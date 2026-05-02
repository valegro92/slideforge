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
  .btn-primary:hover:not(:disabled) { background: var(--accent-light); transform: translateY(-1px); }
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
  .progress-bar-fill { height: 100%; background: var(--accent);
    border-radius: 3px; transition: width 0.3s ease; }
  .progress-label { font-size: 14px; color: var(--text-dim); }
  .ed-slides { flex: 1; overflow-y: auto; padding: 32px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 48px; }
  .slide-wrap { width: 100%; max-width: 1100px;
    display: flex; flex-direction: column; gap: 0; }
  .slide-label { font-size: 11px; font-weight: 600; color: var(--text-dim);
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 12px; }
  .slide-canvas-wrap { position: relative; width: 100%;
    aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    container-type: inline-size; }
  .slide-bg-img { display: block; width: 100%; height: 100%;
    object-fit: fill; pointer-events: none; user-select: none; }
  .slide-overlay { position: absolute; inset: 0; pointer-events: auto; }
  .editable-text-block { position: absolute; box-sizing: border-box;
    background: transparent; border: none; outline: none;
    cursor: text; padding: 2px 4px; line-height: 1.25;
    white-space: pre-wrap; word-break: break-word; overflow: hidden;
    pointer-events: all; min-width: 12px; min-height: 12px; }
  .editable-text-block:hover { outline: 1.5px dashed rgba(45,212,168,0.45);
    background: rgba(45,212,168,0.04); }
  .editable-text-block:focus { outline: 2px solid var(--accent);
    background: rgba(255,255,255,0.04);
    box-shadow: 0 0 12px rgba(45,212,168,0.2); }
  .slide-actions { position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; z-index: 30;
    background: rgba(20,18,17,0.85); padding: 20px 28px; border-radius: 12px;
    backdrop-filter: blur(8px); }
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

// ─── Icons ────────────────────────────────────────────────────────────────────

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
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ─── Loaders ──────────────────────────────────────────────────────────────────

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

// ─── Slide state ──────────────────────────────────────────────────────────────

function makeSlide(origDataUrl, w, h) {
  return {
    origDataUrl, width: w, height: h,
    status: 'pristine', error: null,
    textBlocks: [], edited: {},
  };
}

// ─── Editor ────────────────────────────────────────────────────────────────────

export default function Editor({ onReset }) {
  const { tier: rawTier, isLoggedIn, user } = useTier();
  const tier = resolveTier(rawTier || '');
  const tierConfig = TIERS[tier] || null;
  const maxPages = getMaxPages(tier);

  const [phase, setPhase] = useState('upload');
  const [renderProgress, setRenderProgress] = useState({ done: 0, total: 0, label: '' });
  const [batchProgress, setBatchProgress] = useState({ active: false, done: 0, total: 0 });
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

  const renderPdf = useCallback(async (file) => {
    setPhase('rendering');
    setFileName(file.name.replace(/\.pdf$/i, ''));
    setRenderProgress({ done: 0, total: 0, label: 'Caricamento PDF...' });
    setGlobalError(null);
    try {
      const pdfjsLib = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const numPages = Math.min(pdf.numPages, maxPages);
      setRenderProgress({ done: 0, total: numPages, label: `Rendering ${numPages} pagine...` });

      const result = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        result.push(makeSlide(dataUrl, viewport.width, viewport.height));
        setRenderProgress({ done: i, total: numPages, label: `Pagina ${i} / ${numPages}` });
      }
      setSlides(result);
      setPhase('editing');
    } catch (err) {
      console.error('PDF render error:', err);
      setGlobalError(`Errore nel rendering del PDF: ${err.message}`);
      setPhase('upload');
    }
  }, [maxPages]);

  const handleFileSelect = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') return;
    renderPdf(file);
  }, [renderPdf]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const extractText = useCallback(async (slideIndex) => {
    setSlides(prev => prev.map((s, i) =>
      i === slideIndex ? { ...s, status: 'extracting', error: null } : s
    ));
    try {
      const slide = slides[slideIndex];
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: slide.origDataUrl,
          email: user?.email,
          tier,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Errore AI (${resp.status})`);
      }
      const data = await resp.json();
      const textBlocks = Array.isArray(data.textBlocks) ? data.textBlocks : [];
      setSlides(prev => prev.map((s, i) =>
        i === slideIndex
          ? { ...s, status: 'ready', textBlocks, edited: {} }
          : s
      ));
    } catch (err) {
      console.error('[extractText]', err);
      setSlides(prev => prev.map((s, i) =>
        i === slideIndex ? { ...s, status: 'error', error: err.message } : s
      ));
    }
  }, [slides, user, tier]);

  const extractAll = useCallback(async () => {
    const indices = slides
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status === 'pristine' || s.status === 'error')
      .map(({ i }) => i);
    if (indices.length === 0) return;
    setBatchProgress({ active: true, done: 0, total: indices.length });
    for (let k = 0; k < indices.length; k++) {
      try { await extractText(indices[k]); } catch (err) { console.error(err); }
      setBatchProgress(p => ({ ...p, done: k + 1 }));
    }
    setBatchProgress({ active: false, done: 0, total: 0 });
  }, [slides, extractText]);

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
        pSlide.background = { color: 'FFFFFF' };

        for (let i = 0; i < slide.textBlocks.length; i++) {
          const tb = slide.textBlocks[i];
          const text = slide.edited[i] !== undefined ? slide.edited[i] : (tb.text || '');
          if (!text || !text.trim()) continue;

          let tx = Math.max(0, (tb.x || 0) * SLIDE_W);
          let ty = Math.max(0, (tb.y || 0) * SLIDE_H);
          let tw = Math.max(0.5, (tb.w || 0.1) * SLIDE_W);
          let th = Math.max(0.25, (tb.h || 0.05) * SLIDE_H);
          if (tx + tw > SLIDE_W) tw = SLIDE_W - tx;
          if (ty + th > SLIDE_H) th = SLIDE_H - ty;

          pSlide.addText(text, {
            x: tx, y: ty, w: tw, h: th,
            fontSize: Math.max(8, Math.min(48, tb.fontSize || 16)),
            color: '222222',
            bold: tb.bold === true,
            align: tb.align || 'left',
            fontFace: tb.fontFamily || 'Arial',
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

  const allReady = slides.length > 0 && slides.every(s => s.status === 'ready');
  const someReady = slides.some(s => s.status === 'ready');

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
              <button
                className="btn btn-ghost btn-sm"
                onClick={extractAll}
                disabled={batchProgress.active || allReady}
              >
                {batchProgress.active
                  ? `Estraggo ${batchProgress.done}/${batchProgress.total}...`
                  : 'Estrai testi da tutte'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={exportPptx}
                disabled={!someReady || batchProgress.active}
              >
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

      {phase === 'rendering' && (
        <div className="ed-progress">
          <div className="progress-label">{renderProgress.label}</div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              width: renderProgress.total > 0
                ? `${(renderProgress.done / renderProgress.total) * 100}%`
                : '10%'
            }}/>
          </div>
        </div>
      )}

      {phase === 'editing' && (
        <div className="ed-slides">
          {globalError && <div className="ed-error">{globalError}</div>}
          {slides.map((slide, si) => (
            <SlideCard key={si} slide={slide} index={si}
              onExtract={() => extractText(si)}
              onUpdateText={(bi, txt) => updateText(si, bi, txt)} />
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

function SlideCard({ slide, index, onExtract, onUpdateText }) {
  const isPristine = slide.status === 'pristine';
  const isExtracting = slide.status === 'extracting';
  const isReady = slide.status === 'ready';
  const isError = slide.status === 'error';

  return (
    <div className="slide-wrap">
      <div className="slide-label">
        <span>Slide {index + 1}</span>
        {isReady && (
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            · {slide.textBlocks.length} testi editabili
          </span>
        )}
        {isError && (
          <span style={{ color: 'var(--error)', fontWeight: 600 }}>
            · errore: {slide.error}
          </span>
        )}
      </div>

      <div className="slide-canvas-wrap" style={{ background: isReady ? '#FFFFFF' : '#000' }}>
        {!isReady && (
          <img className="slide-bg-img" src={slide.origDataUrl}
            alt={`Slide ${index + 1}`} draggable={false} />
        )}

        {isReady && (
          <div className="slide-overlay">
            {slide.textBlocks.map((tb, bi) => (
              <div key={bi} contentEditable suppressContentEditableWarning
                className="editable-text-block"
                style={{
                  left: `${(tb.x || 0) * 100}%`,
                  top: `${(tb.y || 0) * 100}%`,
                  width: `${(tb.w || 0) * 100}%`,
                  minHeight: `${(tb.h || 0) * 100}%`,
                  color: '#222222',
                  fontSize: `${((tb.fontSize || 16) * 0.104).toFixed(2)}cqi`,
                  fontWeight: tb.bold ? 700 : 400,
                  textAlign: tb.align || 'left',
                  fontFamily: tb.fontFamily || 'Arial, sans-serif',
                }}
                onBlur={(e) => onUpdateText(bi, e.currentTarget.innerText)}
                dangerouslySetInnerHTML={{
                  __html: (slide.edited[bi] !== undefined ? slide.edited[bi] : (tb.text || ''))
                    .replace(/\n/g, '<br>'),
                }} />
            ))}
          </div>
        )}

        {(isPristine || isError) && (
          <div className="slide-actions">
            <button className="btn btn-primary" onClick={onExtract} disabled={isExtracting}>
              <IconEdit /> {isError ? 'Riprova estrazione' : 'Estrai testi'}
            </button>
          </div>
        )}

        {isExtracting && (
          <div className="slide-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="spinner" />
              <span style={{ fontSize: 13 }}>Sto estraendo i testi...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
