// Visual regression check for the inpainting algorithm in
// src/components/Editor.jsx#fillTextAreas. Renders a synthetic NotebookLM-style
// slide (dark blue header + white body + beige side stripe) and compares the
// old single-corner sampling against the current per-block local ring
// sampling. Fails visually when patches stop blending with locally-coloured
// backgrounds.
//
// Run:  cd scripts && npm i canvas && node inpaint-visual-test.mjs
// Output: /tmp/inpaint-compare.png (open to inspect)

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const W = 1280;
const H = 720;

// -------- 1) Build a slide that mimics a NotebookLM export ----------
function makeSlide() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');

  // White body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Dark blue header band (top 22%)
  const HB = Math.floor(H * 0.22);
  ctx.fillStyle = 'rgb(30, 51, 102)';
  ctx.fillRect(0, 0, W, HB);

  // Light beige accent band on the left (like NLM section stripe)
  ctx.fillStyle = 'rgb(245, 235, 210)';
  ctx.fillRect(0, HB, 12, H - HB);

  // Title (white on dark header)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('NotebookLM — Il futuro dell’AI', 60, 90);

  ctx.font = '20px sans-serif';
  ctx.fillText('Panoramica degli strumenti 2025', 60, 135);

  // Body (dark on white)
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Cosa tratteremo oggi:', 60, 240);

  ctx.font = '20px sans-serif';
  const bullets = [
    '1. Introduzione a NotebookLM e le sue funzionalita',
    '2. Come esportare i PDF dalle presentazioni',
    '3. Strumenti per editare i testi estratti',
    '4. Workflow consigliato per team editoriali',
  ];
  bullets.forEach((t, i) => ctx.fillText(t, 60, 300 + i * 40));

  return c;
}

// -------- 2) Text blocks in normalised 0..1 coordinates ------------
const blocks = [
  { text: 'NotebookLM — Il futuro dell’AI', x: 60/W,  y:  60/H, w: 620/W, h: 45/H },
  { text: 'Panoramica degli strumenti 2025',   x: 60/W,  y: 115/H, w: 380/W, h: 25/H },
  { text: 'Cosa tratteremo oggi:',              x: 60/W,  y: 215/H, w: 340/W, h: 30/H },
  { text: '1. Introduzione a NotebookLM e le sue funzionalita', x: 60/W, y: 280/H, w: 640/W, h: 25/H },
  { text: '2. Come esportare i PDF dalle presentazioni',        x: 60/W, y: 320/H, w: 520/W, h: 25/H },
  { text: '3. Strumenti per editare i testi estratti',          x: 60/W, y: 360/H, w: 500/W, h: 25/H },
  { text: '4. Workflow consigliato per team editoriali',        x: 60/W, y: 400/H, w: 560/W, h: 25/H },
];

// -------- 3) OLD algorithm: single corner-median bg ----------------
function sampleCornerBg(ctx, Wp, Hp) {
  const S = Math.min(40, Math.floor(Math.min(Wp, Hp) * 0.04));
  const R = [], G = [], B = [];
  for (const [px, py] of [[0,0],[Wp-S,0],[0,Hp-S],[Wp-S,Hp-S]]) {
    const d = ctx.getImageData(px, py, S, S).data;
    for (let i = 0; i < d.length; i += 4) { R.push(d[i]); G.push(d[i+1]); B.push(d[i+2]); }
  }
  R.sort((a,b)=>a-b); G.sort((a,b)=>a-b); B.sort((a,b)=>a-b);
  const m = R.length >> 1;
  return { r: R[m], g: G[m], b: B[m] };
}

function inpaintOld(srcCanvas) {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);
  const bg = sampleCornerBg(ctx, W, H);
  ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
  const PAD = 0.15;
  for (const tb of blocks) {
    const x0 = Math.floor(tb.x * W);
    const y0 = Math.floor(tb.y * H);
    const w0 = Math.ceil(Math.max(4, tb.w * W));
    const h0 = Math.ceil(Math.max(4, tb.h * H));
    const padX = Math.ceil(w0 * PAD);
    const padY = Math.ceil(h0 * PAD);
    const rx = Math.max(0, x0 - padX);
    const ry = Math.max(0, y0 - padY);
    const rw = Math.min(W - rx, w0 + padX * 2);
    const rh = Math.min(H - ry, h0 + padY * 2);
    ctx.fillRect(rx, ry, rw, rh);
  }
  return c;
}

// -------- 4) NEW algorithm: per-block ring bg ---------------------
function medianRgbOfStrip(ctx, x, y, w, h, Wp, Hp) {
  x = Math.max(0, Math.floor(x));
  y = Math.max(0, Math.floor(y));
  w = Math.min(Wp - x, Math.ceil(w));
  h = Math.min(Hp - y, Math.ceil(h));
  if (w <= 0 || h <= 0) return null;
  const d = ctx.getImageData(x, y, w, h).data;
  const R = [], G = [], B = [];
  for (let i = 0; i < d.length; i += 4) { R.push(d[i]); G.push(d[i+1]); B.push(d[i+2]); }
  if (!R.length) return null;
  R.sort((a,b)=>a-b); G.sort((a,b)=>a-b); B.sort((a,b)=>a-b);
  const m = R.length >> 1;
  return { r: R[m], g: G[m], b: B[m], n: R.length };
}

function sampleBgAroundBlock(ctx, x, y, w, h, Wp, Hp, fallback) {
  const margin = Math.max(3, Math.floor(Math.min(w, h) * 0.5));
  const strips = [
    medianRgbOfStrip(ctx, x, y - margin, w, margin, Wp, Hp),
    medianRgbOfStrip(ctx, x, y + h, w, margin, Wp, Hp),
    medianRgbOfStrip(ctx, x - margin, y, margin, h, Wp, Hp),
    medianRgbOfStrip(ctx, x + w, y, margin, h, Wp, Hp),
  ].filter(Boolean);
  if (!strips.length) return fallback;
  const all = strips.map(s => [s.r, s.g, s.b, s.n]);
  all.sort((a,b)=>
    (a[0]*0.299+a[1]*0.587+a[2]*0.114) -
    (b[0]*0.299+b[1]*0.587+b[2]*0.114));
  const total = all.reduce((s,x)=>s+x[3], 0);
  let acc = 0;
  for (const [r,g,b,n] of all) {
    acc += n;
    if (acc >= total/2) return { r, g, b };
  }
  return fallback;
}

function inpaintNew(srcCanvas) {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);
  const slideBg = sampleCornerBg(ctx, W, H);
  const PAD = 0.15;
  const fills = [];
  for (const tb of blocks) {
    const x0 = Math.floor(tb.x * W);
    const y0 = Math.floor(tb.y * H);
    const w0 = Math.ceil(Math.max(4, tb.w * W));
    const h0 = Math.ceil(Math.max(4, tb.h * H));
    const padX = Math.ceil(w0 * PAD);
    const padY = Math.ceil(h0 * PAD);
    const rx = Math.max(0, x0 - padX);
    const ry = Math.max(0, y0 - padY);
    const rw = Math.min(W - rx, w0 + padX * 2);
    const rh = Math.min(H - ry, h0 + padY * 2);
    const localBg = sampleBgAroundBlock(ctx, rx, ry, rw, rh, W, H, slideBg);
    fills.push({ rx, ry, rw, rh, bg: localBg });
  }
  for (const f of fills) {
    ctx.fillStyle = `rgb(${f.bg.r},${f.bg.g},${f.bg.b})`;
    ctx.fillRect(f.rx, f.ry, f.rw, f.rh);
  }
  return c;
}

// -------- 5) Compose a 3-panel side-by-side ------------------------
const src = makeSlide();
const oldC = inpaintOld(src);
const newC = inpaintNew(src);

const GAP = 24;
const LABEL = 40;
const combo = createCanvas(W, H*3 + GAP*2 + LABEL*3);
const cctx = combo.getContext('2d');
cctx.fillStyle = '#222';
cctx.fillRect(0, 0, combo.width, combo.height);
cctx.fillStyle = '#fff';
cctx.font = 'bold 24px sans-serif';

function panel(c, label, y) {
  cctx.fillStyle = '#fff';
  cctx.fillText(label, 20, y + 28);
  cctx.drawImage(c, 0, y + LABEL);
}
panel(src, '1) Original slide (NotebookLM look)', 0);
panel(oldC, '2) OLD inpainting — single corner-bg', H + GAP + LABEL);
panel(newC, '3) NEW inpainting — per-block local ring', (H + GAP + LABEL) * 2);

writeFileSync('/tmp/inpaint-compare.png', combo.toBuffer('image/png'));
console.log('wrote /tmp/inpaint-compare.png');
