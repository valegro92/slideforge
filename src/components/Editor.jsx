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
    cursor: text; padding: 0; line-height: 1.15;
    white-space: pre-wrap; word-break: break-word; overflow: visible;
    pointer-events: all; min-width: 8px; min-height: 14px;
    color: #222 !important; }
  .editable-text-block:hover { outline: 1.5px dashed rgba(45,212,168,0.5); }
  .editable-text-block:focus { outline: 2px solid var(--accent);
    background: rgba(255,255,255,0.6); }
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
// Per ogni text-block, identifica i pixel "diversi dallo sfondo" (= il testo)
// e li sostituisce col colore di sfondo dominante della zona, mantenendo
// pattern, icone, gradienti tutto intorno.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function smartTextRemoval(origDataUrl, textBlocks) {
  if (!textBlocks || textBlocks.length === 0) {
    return origDataUrl;
  }
  const img = await loadImage(origDataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const PAD = 0.10;             // espansione 10% del bbox
  const DIST_THRESHOLD = 70;    // soglia distanza colore per "testo"

  for (const tb of textBlocks) {
    const x0 = (tb.x || 0) * W;
    const y0 = (tb.y || 0) * H;
    const w0 = (tb.w || 0) * W;
    const h0 = (tb.h || 0) * H;
    if (w0 < 4 || h0 < 4) continue;
    const padX = w0 * PAD;
    const padY = h0 * PAD;
    const x = Math.max(0, Math.floor(x0 - padX));
    const y = Math.max(0, Math.floor(y0 - padY));
    const w = Math.min(W - x, Math.ceil(w0 + padX * 2));
    const h = Math.min(H - y, Math.ceil(h0 + padY * 2));
    if (w < 4 || h < 4) continue;

    const region = ctx.getImageData(x, y, w, h);
    const px = region.data;

    // Background dominante: mediana RGB sui pixel piu' chiari (40% top luma)
    const lumas = [];
    for (let p = 0; p < px.length; p += 4) {
      lumas.push((px[p] * 0.299 + px[p + 1] * 0.587 + px[p + 2] * 0.114) | 0);
    }
    lumas.sort((a, b) => a - b);
    const lightThreshold = lumas[Math.floor(lumas.length * 0.4)] || 128;

    const bgR = [], bgG = [], bgB = [];
    for (let p = 0; p < px.length; p += 4) {
      const lum = px[p] * 0.299 + px[p + 1] * 0.587 + px[p + 2] * 0.114;
      if (lum >= lightThreshold) {
        bgR.push(px[p]); bgG.push(px[p + 1]); bgB.push(px[p + 2]);
      }
    }
    if (bgR.length === 0) continue;
    bgR.sort((a, b) => a - b);
    bgG.sort((a, b) => a - b);
    bgB.sort((a, b) => a - b);
    const mid = bgR.length >> 1;
    const bg = { r: bgR[mid], g: bgG[mid], b: bgB[mid] };

    // Sostituisci pixel "scuri" (= testo) col background
    for (let p = 0; p < px.length; p += 4) {
      const dr = Math.abs(px[p] - bg.r);
      const dg = Math.abs(px[p + 1] - bg.g);
      const db = Math.abs(px[p + 2] - bg.b);
      if (dr + dg + db > DIST_THRESHOLD) {
        px[p] = bg.r;
        px[p + 1] = bg.g;
        px[p + 2] = bg.b;
      }
    }
    ctx.putImageData(region, x, y);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

// ─── Estrazione testi DIRETTAMENTE dal PDF (no AI, no OCR) ────────────────────
// I PDF di NotebookLM (e quasi tutti i PDF moderni generati da software) hanno
// il testo come oggetti vettoriali, non come pixel. pdf.js ce li restituisce
// con coordinate precise, font, dimensione. Niente AI, niente errori.

async function extractTextFromPage(page) {
  const viewport = page.getViewport({ scale: 1 });
  const W = viewport.width;
  const H = viewport.height;
  const textContent = await page.getTextContent({ disableCombineTextItems: false });

  const blocks = [];
  for (const item of textContent.items || []) {
    const str = (item.str || '').trim();
    if (!str) continue;
    // item.transform = [a, b, c, d, e, f]
    // (a,b,c,d) = scale/rotation, (e,f) = position in PDF coords (origin: bottom-left).
    const [, , c, d, e, f] = item.transform;
    const fontHeight = Math.hypot(c, d) || item.height || 12;
    const widthPx = item.width || 0;
    // Top-left in viewport coords (origin: top-left).
    const top = H - f;
    const left = e;

    blocks.push({
      text: str,
      x: left / W,
      y: Math.max(0, (top - fontHeight) / H),
      w: Math.max(0.01, widthPx / W),
      h: Math.max(0.01, fontHeight / H),
      fontSize: Math.round(fontHeight),
      bold: /bold|black|heavy/i.test(item.fontName || ''),
      italic: /italic|oblique/i.test(item.fontName || ''),
      align: 'left',
    });
  }

  // Raggruppa items adiacenti sulla stessa riga (stesso y, x consecutivi).
  // Cosi' invece di un text-block per ogni glifo/parola, abbiamo uno per riga.
  blocks.sort((a, b) => a.y - b.y || a.x - b.x);
  const merged = [];
  for (const b of blocks) {
    const last = merged[merged.length - 1];
    if (last
      && Math.abs(last.y - b.y) < (last.h * 0.5)
      && Math.abs(last.fontSize - b.fontSize) < 2
      && (b.x - (last.x + last.w)) < (last.h * 1.5)) {
      // estendi il blocco precedente
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

function makeSlide(origDataUrl, cleanedDataUrl, textBlocks) {
  return { origDataUrl, cleanedDataUrl, textBlocks, edited: {} };
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export default function Editor({ onReset }) {
  const { tier: rawTier, isLoggedIn, user } = useTier();
  const tier = resolveTier(rawTier || '');
  const tierConfig = TIERS[tier] || null;
  const maxPages = getMaxPages(tier);

  const [phase, setPhase] = useState('upload'); // 'upload'|'processing'|'editing'|'exporting'|'done'
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [slides, setSlides] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const fileInputRef = useRef(null);

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
    setProgress({ done: 0, total: 0, label: 'Caricamento PDF...' });
    setGlobalError(null);
    try {
      const pdfjsLib = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const numPages = Math.min(pdf.numPages, maxPages);
      setProgress({ done: 0, total: numPages, label: `Caricamento ${numPages} pagine...` });

      // Step 1: render tutte le pagine come immagini + tenta estrazione diretta.
      const pages = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        // Tentativo 1: testo vettoriale dal PDF (PDF testuali — istantaneo)
        const directBlocks = await extractTextFromPage(page);

        pages.push({ dataUrl, directBlocks });
        setProgress({ done: i, total: numPages, label: `Caricamento pagina ${i} / ${numPages}` });
      }

      const totalDirectTexts = pages.reduce((acc, p) => acc + p.directBlocks.length, 0);

      // Step 2: se il PDF ha testo vettoriale → usa quello (immediato, perfetto).
      if (totalDirectTexts > 0) {
        setProgress({ done: 0, total: numPages, label: 'Pulisco i testi originali dalle immagini...' });
        const result = [];
        for (let i = 0; i < pages.length; i++) {
          const cleaned = await smartTextRemoval(pages[i].dataUrl, pages[i].directBlocks);
          result.push(makeSlide(pages[i].dataUrl, cleaned, pages[i].directBlocks));
          setProgress({ done: i + 1, total: numPages, label: `Pulizia ${i + 1} / ${numPages}` });
        }
        setSlides(result);
        setPhase('editing');
        return;
      }

      // Step 3: PDF raster (es. NotebookLM) → fallback OpenRouter Vision per ogni pagina.
      setProgress({ done: 0, total: numPages, label: 'PDF tipo immagine: uso AI Vision...' });
      const result = [];
      for (let i = 0; i < pages.length; i++) {
        setProgress({ done: i, total: numPages, label: `AI estrae testi: pagina ${i + 1} / ${numPages}` });
        try {
          const blocks = await extractTextViaAI(pages[i].dataUrl, user?.email, tier);
          const cleaned = await smartTextRemoval(pages[i].dataUrl, blocks);
          result.push(makeSlide(pages[i].dataUrl, cleaned, blocks));
        } catch (err) {
          console.error('AI extraction failed for page', i + 1, err);
          result.push(makeSlide(pages[i].dataUrl, pages[i].dataUrl, []));
        }
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

  const exportPptx = useCallback(async () => {
    setPhase('exporting');
    setGlobalError(null);
    try {
      const PptxGenJS = await loadPptxGen();
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      const SLIDE_W = 13.33;
      const SLIDE_H = 7.5;

      for (const slide of slides) {
        const pSlide = pptx.addSlide();
        // Sfondo: immagine "pulita" (testi originali rimossi, grafica intatta)
        pSlide.addImage({
          data: slide.cleanedDataUrl || slide.origDataUrl,
          x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
        });

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

          // pdf.js fontSize e' in unita' PDF (1pt = 1unit), va bene cosi'.
          // Convertiamo l'altezza da viewport pixel a punti (1in = 72pt;
          // ipotizziamo viewport scale 1 = 1pt per unit).
          const fontPt = Math.max(8, Math.min(48, Math.round(tb.fontSize)));

          pSlide.addText(text, {
            x: tx, y: ty, w: tw, h: th,
            fontSize: fontPt,
            color: '222222',
            bold: tb.bold === true,
            italic: tb.italic === true,
            align: tb.align || 'left',
            fontFace: 'Arial',
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

function SlideCard({ slide, index, onUpdateText }) {
  const wrapRef = useRef(null);
  const [W, setW] = useState(960);
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  const H = W * 9 / 16;
  // 1pt = 1/72in; SLIDE_H = 7.5in = 540pt. Quindi 1pt = H/540 px.
  const ptToPx = H / 540;

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
        {slide.textBlocks.map((tb, bi) => (
          <div key={bi} contentEditable suppressContentEditableWarning
            className="editable-text-block"
            style={{
              left: `${(tb.x || 0) * 100}%`,
              top: `${(tb.y || 0) * 100}%`,
              width: `${Math.max(2, (tb.w || 0) * 100)}%`,
              minHeight: `${Math.max(1.5, (tb.h || 0) * 100)}%`,
              fontSize: `${Math.max(11, (tb.fontSize || 14) * ptToPx).toFixed(1)}px`,
              fontWeight: tb.bold ? 700 : 400,
              fontStyle: tb.italic ? 'italic' : 'normal',
              textAlign: tb.align || 'left',
              fontFamily: 'Arial, sans-serif',
            }}
            onBlur={(e) => onUpdateText(bi, e.currentTarget.innerText)}
            dangerouslySetInnerHTML={{
              __html: ((slide.edited[bi] !== undefined ? slide.edited[bi] : (tb.text || ''))
                || '(vuoto)').replace(/\n/g, '<br>'),
            }} />
        ))}
      </div>
    </div>
  );
}
