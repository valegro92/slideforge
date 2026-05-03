'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TIERS, getMaxPages, resolveTier } from '../lib/tiers';
import { useTier } from '../lib/TierContext';

// ─── Stili ────────────────────────────────────────────────────────────────────

const STYLES = `
  :root {
    --bg: #292524; --surface: #1E1E1E; --border: #454545;
    --text: #FFFFFF; --text-dim: #A9A8A7;
    --accent: #2DD4A8; --accent-light: #5EEAD2; --error: #F87171;
  }
  .ed-root { display: flex; flex-direction: column; min-height: 100vh;
    background: var(--bg); color: var(--text);
    font-family: 'DM Sans', system-ui, sans-serif; }
  .ed-header { display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px; border-bottom: 1px solid var(--border);
    background: var(--surface); gap: 16px; flex-wrap: wrap; }
  .ed-logo { font-size: 15px; font-weight: 700; color: var(--accent); }
  .ed-header-right { display: flex; align-items: center; gap: 10px; }
  .btn { display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 8px; border: none; font-family: inherit;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.18s;
    white-space: nowrap; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #111; font-weight: 600;
    box-shadow: 0 3px 12px rgba(45,212,168,0.25); }
  .btn-primary:hover:not(:disabled) { background: var(--accent-light); }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
  .btn-ghost:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; }
  .ed-upload { display: flex; flex-direction: column; align-items: center;
    justify-content: center; flex: 1; padding: 60px 24px; gap: 24px; }
  .upload-zone { width: 100%; max-width: 520px;
    border: 2px dashed var(--border); border-radius: 16px;
    padding: 52px 32px; text-align: center; cursor: pointer;
    transition: all 0.2s; background: var(--surface); }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--accent); background: rgba(45,212,168,0.04); }
  .upload-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  .upload-sub { font-size: 13px; color: var(--text-dim); margin-bottom: 20px; }
  .ed-progress { display: flex; flex-direction: column; align-items: center;
    justify-content: center; flex: 1; gap: 20px; padding: 60px 24px; }
  .progress-bar-track { width: 340px; max-width: 90vw; height: 6px;
    background: var(--border); border-radius: 3px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: var(--accent); border-radius: 3px;
    transition: width 0.3s ease; }
  .progress-label { font-size: 14px; color: var(--text-dim); }
  .ed-slides { flex: 1; overflow-y: auto; padding: 32px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 48px; }
  .slide-wrap { width: 100%; max-width: 1100px; }
  .slide-label { font-size: 11px; font-weight: 600; color: var(--text-dim);
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 12px; }
  .slide-canvas-wrap { position: relative; width: 100%;
    aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45); background: #FFFFFF; }
  .editable-text-block { position: absolute; box-sizing: border-box;
    background: transparent; outline: none;
    cursor: text; padding: 0; line-height: 1.25;
    white-space: pre-wrap; word-break: break-word; overflow: hidden;
    pointer-events: all; min-width: 8px; min-height: 14px; }
  .editable-text-block:hover { outline: 1.5px dashed rgba(45,212,168,0.5); }
  .editable-text-block:focus { outline: 2px solid var(--accent);
    background: rgba(128,128,128,0.25); }
  .ed-error { background: rgba(248,113,113,0.1); border: 1px solid var(--error);
    color: var(--error); padding: 12px 16px; border-radius: 8px;
    font-size: 13px; max-width: 600px; margin: 0 auto; }
  .spinner { width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .tier-badge { background: rgba(245,158,11,0.12); color: #F59E0B;
    border: 1px solid rgba(245,158,11,0.4);
    padding: 4px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  .export-done { display: flex; flex-direction: column; align-items: center;
    justify-content: center; flex: 1; gap: 16px; padding: 60px 24px;
    text-align: center; }
  .export-done h2 { font-size: 22px; font-weight: 700; }
  .export-done p { font-size: 14px; color: var(--text-dim); }
`;

const IconUpload = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// ─── Loaders CDN ──────────────────────────────────────────────────────────────

let pdfJsPromise = null;
function loadPdfJs() {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
    script.type = 'module';
    script.onload = () => {
      const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
        resolve(lib);
      } else reject(new Error('PDF.js failed to load'));
    };
    script.onerror = () => reject(new Error('Could not load PDF.js'));
    document.head.appendChild(script);
  });
  return pdfJsPromise;
}

let pptxPromise = null;
function loadPptxGen() {
  if (pptxPromise) return pptxPromise;
  pptxPromise = new Promise((resolve, reject) => {
    if (window.PptxGenJS) { resolve(window.PptxGenJS); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/gitbrent/PptxGenJS@3.12.0/dist/pptxgen.bundle.js';
    script.onload = () => {
      if (window.PptxGenJS) resolve(window.PptxGenJS);
      else reject(new Error('PptxGenJS not found'));
    };
    script.onerror = () => reject(new Error('Could not load PptxGenJS'));
    document.head.appendChild(script);
  });
  return pptxPromise;
}

// ─── Smart text removal: cancella i pixel di testo, mantieni grafica ─────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function sampleSlideBgFromCanvas(ctx, W, H) {
  const S = Math.min(40, Math.floor(Math.min(W, H) * 0.04));
  const patches = [
    [0, 0],
    [W - S, 0],
    [0, H - S],
    [W - S, H - S],
  ];
  const R = [], G = [], B = [];
  for (const [px, py] of patches) {
    const d = ctx.getImageData(px, py, S, S).data;
    for (let i = 0; i < d.length; i += 4) {
      R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]);
    }
  }
  R.sort((a, b) => a - b); G.sort((a, b) => a - b); B.sort((a, b) => a - b);
  const m = R.length >> 1;
  const r = R[m], g = G[m], b = B[m];
  return { r, g, b, hex: `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}` };
}

async function fillTextAreas(origDataUrl, textBlocks) {
  if (!textBlocks || textBlocks.length === 0) return { dataUrl: origDataUrl, bgHex: '#ffffff' };

  const img = await loadImage(origDataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) return { dataUrl: origDataUrl, bgHex: '#ffffff' };

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const bg = sampleSlideBgFromCanvas(ctx, W, H);
  ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;

  const PAD = 0.15;

  for (const tb of textBlocks) {
    const x0 = Math.floor((tb.x || 0) * W);
    const y0 = Math.floor((tb.y || 0) * H);
    const w0 = Math.ceil(Math.max(4, (tb.w || 0) * W));
    const h0 = Math.ceil(Math.max(4, (tb.h || 0) * H));

    const charsPerLine = Math.max(1, Math.floor(w0 / Math.max(1, h0 * 0.55)));
    const numLines = Math.max(1, Math.ceil((tb.text || '').trim().length / charsPerLine));
    const h0eff = Math.ceil(h0 * numLines * 1.25);

    const padX = Math.ceil(w0 * PAD);
    const padY = Math.ceil(h0 * PAD);
    const rx = Math.max(0, x0 - padX);
    const ry = Math.max(0, y0 - padY);
    const rw = Math.min(W - rx, w0 + padX * 2);
    const rh = Math.min(H - ry, h0eff + padY * 2);
    if (rw < 2 || rh < 2) continue;

    ctx.fillRect(rx, ry, rw, rh);
  }

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), bgHex: bg.hex };
}

// ─── Estrazione testi DIRETTAMENTE dal PDF (no AI, no OCR) ────────────────────

async function extractTextFromPage(page) {
  const viewport = page.getViewport({ scale: 1 });
  const W = viewport.width;
  const H = viewport.height;
  const textContent = await page.getTextContent({ disableCombineTextItems: false });

  const blocks = [];
  for (const item of textContent.items || []) {
    const str = (item.str || '').trim();
    if (!str) continue;
    const [, , c, d, e, f] = item.transform;
    const fontHeight = Math.hypot(c, d) || item.height || 12;
    const widthPx = item.width > 0 ? item.width : str.length * fontHeight * 0.55;
    const top = H - f;
    const left = e;

    blocks.push({
      text: str,
      x: left / W,
      y: Math.max(0, (top - fontHeight) / H),
      w: Math.max(0.02, widthPx / W),
      h: Math.max(0.01, fontHeight / H),
      fontSize: Math.round(fontHeight),
      bold: /bold|black|heavy/i.test(item.fontName || ''),
      italic: /italic|oblique/i.test(item.fontName || ''),
      align: 'left',
    });
  }

  blocks.sort((a, b) => a.y - b.y || a.x - b.x);
  const merged = [];
  for (const b of blocks) {
    const last = merged[merged.length - 1];
    if (last
      && Math.abs(last.y - b.y) < (last.h * 0.5)
      && Math.abs(last.fontSize - b.fontSize) < 2
      && (b.x - (last.x + last.w)) < (last.h * 3)) {
      last.text = last.text + (b.x - (last.x + last.w) > last.h * 0.2 ? ' ' : '') + b.text;
      last.w = (b.x + b.w) - last.x;
    } else {
      merged.push({ ...b });
    }
  }
  return merged;
}

// ─── Fallback: estrazione via AI Vision per PDF raster ────────────────────────

async function extractTextViaAI(imageDataUrl, email, tier) {
  const resp = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl, email, tier }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `AI ${resp.status}`);
  }
  const data = await resp.json();
  return Array.isArray(data.textBlocks) ? data.textBlocks.map(tb => ({
    text: tb.text || '',
    x: typeof tb.x === 'number' ? tb.x : 0,
    y: typeof tb.y === 'number' ? tb.y : 0,
    w: typeof tb.w === 'number' ? tb.w : 0.1,
    h: typeof tb.h === 'number' ? tb.h : 0.05,
    fontSize: typeof tb.fontSize === 'number' ? tb.fontSize : 16,
    bold: tb.bold === true,
    italic: false,
    align: tb.align || 'left',
  })) : [];
}

// ─── State ────────────────────────────────────────────────────────────────────

function makeSlide(origDataUrl, cleanedDataUrl, textBlocks, bgHex = '#ffffff') {
  return { origDataUrl, cleanedDataUrl, textBlocks, bgHex, edited: {} };
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export default function Editor({ onReset }) {
  const { tier: rawTier, isLoggedIn, user } = useTier();
  const tier = resolveTier(rawTier || '');
  const tierConfig = TIERS[tier] || null;
  const maxPages = getMaxPages(tier);

  const [phase, setPhase] = useState('upload');
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [slides, setSlides] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [libreofficeReady, setLibreofficeReady] = useState(false);
  const fileInputRef = useRef(null);
  const pdfFileRef = useRef(null);

  useEffect(() => {
    fetch('/api/pdf-to-pptx').then(r => r.json()).then(d => setLibreofficeReady(!!d.configured)).catch(() => {});
  }, []);

  useEffect(() => {
    const id = 'ed-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const processFile = useCallback(async (file) => {
    setPhase('processing');
    setFileName(file.name.replace(/\.pdf$/i, ''));
    pdfFileRef.current = file;
    setProgress({ done: 0, total: 0, label: 'Caricamento PDF...' });
    setGlobalError(null);
    try {
      const pdfjsLib = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const numPages = Math.min(pdf.numPages, maxPages);
      setProgress({ done: 0, total: numPages, label: `Caricamento ${numPages} pagine...` });

      const pages = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const directBlocks = await extractTextFromPage(page);

        pages.push({ dataUrl, directBlocks });
        setProgress({ done: i, total: numPages, label: `Caricamento pagina ${i} / ${numPages}` });
      }

      const totalDirectTexts = pages.reduce((acc, p) => acc + p.directBlocks.length, 0);

      if (totalDirectTexts > 0) {
        setProgress({ done: 0, total: numPages, label: 'Pulisco i testi originali dalle immagini...' });
        const result = [];
        for (let i = 0; i < pages.length; i++) {
          const { dataUrl: cleaned, bgHex } = await fillTextAreas(pages[i].dataUrl, pages[i].directBlocks);
          result.push(makeSlide(pages[i].dataUrl, cleaned, pages[i].directBlocks, bgHex));
          setProgress({ done: i + 1, total: numPages, label: `Pulizia ${i + 1} / ${numPages}` });
        }
        setSlides(result);
        setPhase('editing');
        return;
      }

      // Step 3: PDF raster (es. NotebookLM) → fallback OpenRouter Vision, 3 slide in parallelo.
      setProgress({ done: 0, total: numPages, label: 'PDF tipo immagine: uso AI Vision...' });
      const result = new Array(pages.length);
      let done = 0;
      const CONCURRENCY = 3;
      for (let start = 0; start < pages.length; start += CONCURRENCY) {
        const batch = pages.slice(start, start + CONCURRENCY);
        await Promise.all(batch.map(async (p, j) => {
          const i = start + j;
          try {
            const blocks = await extractTextViaAI(p.dataUrl, user?.email, tier);
            const { dataUrl: cleaned, bgHex } = await fillTextAreas(p.dataUrl, blocks);
            result[i] = makeSlide(p.dataUrl, cleaned, blocks, bgHex);
          } catch (err) {
            console.error('AI extraction failed for page', i + 1, err);
            result[i] = makeSlide(p.dataUrl, p.dataUrl, []);
          }
          done++;
          setProgress({ done, total: numPages, label: `AI estrae testi: pagina ${done} / ${numPages}` });
        }));
      }
      setProgress({ done: numPages, total: numPages, label: 'Pronto' });
      setSlides(result);
      setPhase('editing');
    } catch (err) {
      console.error('PDF process error:', err);
      setGlobalError(`Errore: ${err.message}`);
      setPhase('upload');
    }
  }, [maxPages, user, tier]);

  const handleFileSelect = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') return;
    processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const updateText = useCallback((slideIndex, blockIndex, newText) => {
    setSlides(prev => prev.map((s, i) =>
      i === slideIndex
        ? { ...s, edited: { ...s.edited, [blockIndex]: newText } }
        : s
    ));
  }, []);

  const exportVectorPptx = useCallback(async () => {
    if (!pdfFileRef.current) {
      setGlobalError('PDF originale non disponibile. Ricarica il file.');
      return;
    }
    setPhase('exporting');
    setGlobalError(null);
    try {
      const fd = new FormData();
      fd.append('file', pdfFileRef.current, pdfFileRef.current.name || 'input.pdf');
      fd.append('email', user?.email || '');
      const resp = await fetch('/api/pdf-to-pptx', { method: 'POST', body: fd });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${resp.status}`);
      }
      const blob = await resp.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      const safe = (fileName || 'slideforge').replace(/[^a-z0-9_-]/gi, '_');
      a.download = `${safe}_vector.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      setPhase('done');
    } catch (err) {
      console.error('vector export error:', err);
      setGlobalError(`Errore conversione vettoriale: ${err.message}`);
      setPhase('editing');
    }
  }, [fileName, user]);

  const exportPptx = useCallback(async () => {
    setPhase('exporting');
    setGlobalError(null);
    try {
      const PptxGenJS = await loadPptxGen();
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      const SLIDE_W = 13.33;
      const SLIDE_H = 7.5;

      const lumaOf = (hex) => {
        const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
        if (!m) return 200;
        const v = parseInt(m[1], 16);
        const r = (v >> 16) & 0xff, g = (v >> 8) & 0xff, b = v & 0xff;
        return r * 0.299 + g * 0.587 + b * 0.114;
      };

      for (const slide of slides) {
        const pSlide = pptx.addSlide();
        pSlide.addImage({
          data: slide.cleanedDataUrl || slide.origDataUrl,
          x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
        });

        const slideBgLuma = lumaOf(slide.bgHex);
        const defaultTextColor = slideBgLuma < 128 ? 'F0F0F0' : '111111';

        for (let i = 0; i < slide.textBlocks.length; i++) {
          const tb = slide.textBlocks[i];
          const text = slide.edited[i] !== undefined ? slide.edited[i] : (tb.text || '');
          if (!text || !text.trim()) continue;

          let tx = Math.max(0, (tb.x || 0) * SLIDE_W);
          let ty = Math.max(0, (tb.y || 0) * SLIDE_H);
          let tw = Math.max(0.4, (tb.w || 0.05) * SLIDE_W);
          let th = Math.max(0.2, (tb.h || 0.03) * SLIDE_H * 1.5);
          if (tx + tw > SLIDE_W) tw = SLIDE_W - tx;
          if (ty + th > SLIDE_H) th = SLIDE_H - ty;

          const fontPt = Math.max(8, Math.min(48, Math.round(tb.fontSize)));

          const tbColor = typeof tb.color === 'string' && /^#[0-9a-f]{6}$/i.test(tb.color)
            ? tb.color.replace('#', '')
            : defaultTextColor;
          const tbFont = (typeof tb.fontFamily === 'string' && tb.fontFamily.trim())
            ? tb.fontFamily.trim()
            : 'Arial';

          pSlide.addText(text, {
            x: tx, y: ty, w: tw, h: th,
            fontSize: fontPt,
            color: tbColor,
            bold: tb.bold === true,
            italic: tb.italic === true,
            align: tb.align || 'left',
            fontFace: tbFont,
            wrap: true, valign: 'top', margin: 0,
          });
        }
      }
      const safeName = (fileName || 'slideforge').replace(/[^a-z0-9_-]/gi, '_');
      await pptx.writeFile({ fileName: `${safeName}.pptx` });
      setPhase('done');
    } catch (err) {
      console.error('Export error:', err);
      setGlobalError(`Errore export: ${err.message}`);
      setPhase('editing');
    }
  }, [slides, fileName]);

  if (!isLoggedIn || !tierConfig) {
    return (
      <div className="ed-root">
        <header className="ed-header">
          <span className="ed-logo">SlideForge</span>
        </header>
        <div className="ed-upload">
          <div style={{
            width: '100%', maxWidth: 480, background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 16,
            padding: '48px 40px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <div className="upload-title">Accedi con la tua email</div>
            <div className="upload-sub">Riservato agli iscritti de La Cassetta degli AI-trezzi</div>
            <button className="btn btn-primary" onClick={onReset}>Accedi</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-root">
      <header className="ed-header">
        <span className="ed-logo">SlideForge</span>
        {phase === 'editing' && (
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {fileName} — {slides.length} slide
          </span>
        )}
        <div className="ed-header-right">
          <span className="tier-badge">{tierConfig.name}</span>
          {phase === 'editing' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={onReset}>Nuovo PDF</button>
              {libreofficeReady && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={exportVectorPptx}
                  title="Conversione vettoriale tramite LibreOffice — qualità più alta, ogni elemento del PDF diventa un oggetto PowerPoint nativo">
                  <IconDownload /> PPTX vettoriale
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={exportPptx}>
                <IconDownload /> Scarica PPTX
              </button>
            </>
          )}
        </div>
      </header>

      {globalError && phase !== 'editing' && (
        <div className="ed-error" style={{ margin: '20px auto' }}>{globalError}</div>
      )}

      {phase === 'upload' && (
        <UploadZone
          isDragOver={isDragOver}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          maxPages={maxPages}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])} />
        </UploadZone>
      )}

      {phase === 'processing' && (
        <div className="ed-progress">
          <div className="progress-label">{progress.label}</div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              width: progress.total > 0
                ? `${(progress.done / progress.total) * 100}%`
                : '10%'
            }}/>
          </div>
        </div>
      )}

      {phase === 'editing' && (
        <div className="ed-slides">
          {globalError && <div className="ed-error">{globalError}</div>}
          {slides.map((slide, si) => (
            <SlideCard
              key={si}
              slide={slide}
              index={si}
              onUpdateText={(bi, txt) => updateText(si, bi, txt)}
            />
          ))}
        </div>
      )}

      {phase === 'exporting' && (
        <div className="ed-progress">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="spinner" />
            <span className="progress-label">Generazione PPTX in corso...</span>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="export-done">
          <div style={{ fontSize: 48 }}>✅</div>
          <h2>Export completato</h2>
          <p>Il file PPTX e&apos; stato scaricato.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setPhase('editing')}>Torna alle slide</button>
            <button className="btn btn-primary" onClick={onReset}>Nuovo PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadZone({ isDragOver, onDragOver, onDragLeave, onDrop, onClick, maxPages, children }) {
  return (
    <div className="ed-upload">
      <div className={`upload-zone${isDragOver ? ' drag-over' : ''}`}
        onDragOver={onDragOver} onDragLeave={onDragLeave}
        onDrop={onDrop} onClick={onClick}>
        <div style={{ color: 'var(--accent)', marginBottom: 16 }}><IconUpload /></div>
        <div className="upload-title">Carica il tuo PDF</div>
        <div className="upload-sub">
          Trascina qui o clicca per scegliere un file<br />
          Max {maxPages} pagine per il tuo piano
        </div>
        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Scegli file
        </button>
        {children}
      </div>
    </div>
  );
}

function detectSlideBgLuma(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const S = 24;
        const canvas = document.createElement('canvas');
        canvas.width = S * 2; canvas.height = S * 2;
        const ctx = canvas.getContext('2d');
        const iw = img.naturalWidth; const ih = img.naturalHeight;
        ctx.drawImage(img, 0,      0,      S, S, 0, 0, S, S);
        ctx.drawImage(img, iw - S, 0,      S, S, S, 0, S, S);
        ctx.drawImage(img, 0,      ih - S, S, S, 0, S, S, S);
        ctx.drawImage(img, iw - S, ih - S, S, S, S, S, S, S);
        const d = ctx.getImageData(0, 0, S * 2, S * 2).data;
        let luma = 0;
        for (let p = 0; p < d.length; p += 4)
          luma += d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114;
        resolve(luma / (d.length / 4));
      } catch { resolve(200); }
    };
    img.onerror = () => resolve(200);
    img.src = dataUrl;
  });
}

function SlideCard({ slide, index, onUpdateText }) {
  const wrapRef = useRef(null);
  const [W, setW] = useState(960);
  const [darkBg, setDarkBg] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const src = slide.cleanedDataUrl || slide.origDataUrl;
    if (!src) return;
    detectSlideBgLuma(src).then(luma => setDarkBg(luma < 128));
  }, [slide.cleanedDataUrl, slide.origDataUrl]);

  const H = W * 9 / 16;
  const ptToPx = H / 540;
  const textColor = darkBg ? '#f0f0f0' : '#111111';

  function estimateLines(tb) {
    const blockWpx = Math.max(1, (tb.w || 0.1) * W);
    const fontPx = Math.max(8, (tb.fontSize || 14) * ptToPx);
    const avgCharW = fontPx * 0.55;
    const charsPerLine = Math.max(1, Math.floor(blockWpx / avgCharW));
    return Math.max(1, Math.ceil((tb.text || '').trim().length / charsPerLine));
  }

  return (
    <div className="slide-wrap">
      <div className="slide-label">
        <span>Slide {index + 1}</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
          · {slide.textBlocks.length} testi editabili
        </span>
      </div>

      <div ref={wrapRef} className="slide-canvas-wrap">
        <img
          src={slide.cleanedDataUrl || slide.origDataUrl}
          alt={`Slide ${index + 1}`}
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'fill',
            pointerEvents: 'none', userSelect: 'none',
          }}
        />
        {slide.textBlocks.map((tb, bi) => {
          const lines = estimateLines(tb);
          const fontPx = Math.max(11, (tb.fontSize || 14) * ptToPx);
          const blockHeightPct = Math.max(1.5, (tb.h || 0) * 100 * lines * 1.25);
          return (
            <div key={bi} contentEditable suppressContentEditableWarning
              className="editable-text-block"
              style={{
                left: `${(tb.x || 0) * 100}%`,
                top: `${(tb.y || 0) * 100}%`,
                width: `${Math.max(2, (tb.w || 0) * 100)}%`,
                height: `${blockHeightPct}%`,
                fontSize: `${fontPx.toFixed(1)}px`,
                fontWeight: tb.bold ? 700 : 400,
                fontStyle: tb.italic ? 'italic' : 'normal',
                textAlign: tb.align || 'left',
                fontFamily: 'Arial, sans-serif',
                color: textColor,
              }}
              onBlur={(e) => onUpdateText(bi, e.currentTarget.innerText)}
              dangerouslySetInnerHTML={{
                __html: ((slide.edited[bi] !== undefined ? slide.edited[bi] : (tb.text || ''))
                  || '(vuoto)').replace(/\n/g, '<br>'),
              }} />
          );
        })}
      </div>
    </div>
  );
}
