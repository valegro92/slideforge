'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TIERS, getMaxPages, resolveTier } from '../lib/tiers';
import { useTier } from '../lib/TierContext';

// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
  :root {
    --bg: #292524;
    --surface: #1E1E1E;
    --surface-alt: #2D2D2D;
    --border: #454545;
    --text: #FFFFFF;
    --text-dim: #A9A8A7;
    --accent: #2DD4A8;
    --accent-light: #5EEAD2;
    --error: #F87171;
  }

  .ed-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  /* ── Header ── */
  .ed-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 28px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    gap: 16px;
    flex-wrap: wrap;
  }

  .ed-logo {
    font-size: 15px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.3px;
  }

  .ed-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: 8px;
    border: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-primary {
    background: var(--accent);
    color: #111;
    font-weight: 600;
    box-shadow: 0 3px 12px rgba(45,212,168,0.25);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--accent-light);
    transform: translateY(-1px);
  }

  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
  }
  .btn-ghost:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn-secondary {
    background: rgba(45, 212, 168, 0.12);
    border: 1px solid rgba(45, 212, 168, 0.4);
    color: var(--accent);
    font-weight: 600;
  }
  .btn-secondary:hover:not(:disabled) {
    background: rgba(45, 212, 168, 0.2);
    border-color: var(--accent);
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 6px;
  }

  /* ── Upload zone ── */
  .ed-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 60px 24px;
    gap: 24px;
  }

  .upload-zone {
    width: 100%;
    max-width: 520px;
    border: 2px dashed var(--border);
    border-radius: 16px;
    padding: 52px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface);
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--accent);
    background: rgba(45,212,168,0.04);
  }

  .upload-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    color: var(--accent);
    opacity: 0.8;
  }

  .upload-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .upload-sub {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 20px;
  }

  /* ── Progress ── */
  .ed-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 20px;
    padding: 60px 24px;
  }

  .progress-bar-track {
    width: 340px;
    max-width: 90vw;
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-label {
    font-size: 14px;
    color: var(--text-dim);
  }

  /* ── Slides list ── */
  .ed-slides {
    flex: 1;
    overflow-y: auto;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 48px;
  }

  /* ── Single slide wrapper ── */
  .slide-wrap {
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .slide-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
  }

  /* ── Slide canvas area ── */
  .slide-canvas-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    background: #000;
    container-type: inline-size;
  }

  .slide-bg-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  /* ── Ghost overlay layer ── */
  .slide-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* ── Detected blocks (visible, mode=detected) ── */
  .detected-block {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid rgba(45,212,168,0.4);
    border-radius: 3px;
    background: rgba(45,212,168,0.15);
    pointer-events: none;
  }

  .detected-img-block {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid rgba(99,165,212,0.45);
    border-radius: 3px;
    background: rgba(99,165,212,0.12);
    pointer-events: none;
  }

  /* ── Selecting mode blocks (clickable toggle) ── */
  .select-block {
    position: absolute;
    box-sizing: border-box;
    border-radius: 3px;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.15s;
  }
  .select-block.included {
    border: 1.5px solid var(--accent);
    background: rgba(45,212,168,0.2);
  }
  .select-block.excluded {
    border: 1.5px dashed rgba(45,212,168,0.25);
    background: rgba(45,212,168,0.04);
    opacity: 0.4;
  }
  .select-block:hover { opacity: 1; }

  .select-img-block {
    position: absolute;
    box-sizing: border-box;
    border-radius: 3px;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .select-img-block.included {
    border: 1.5px solid #63a5d4;
    background: rgba(99,165,212,0.18);
  }
  .select-img-block.excluded {
    border: 1.5px dashed rgba(99,165,212,0.2);
    background: rgba(99,165,212,0.04);
    opacity: 0.35;
  }
  .select-img-block:hover { opacity: 1; }

  .select-img-badge {
    font-size: 9px;
    font-weight: 600;
    color: #63a5d4;
    background: rgba(20,18,17,0.8);
    padding: 2px 5px;
    border-radius: 3px;
    pointer-events: none;
    letter-spacing: 0.3px;
  }

  /* ── Results banner ── */
  .results-banner {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 18px;
    background: rgba(20, 18, 17, 0.92);
    border: 1px solid rgba(45,212,168,0.4);
    border-radius: 12px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 50;
    font-size: 13px;
    font-weight: 600;
    color: #2DD4A8;
    white-space: nowrap;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }

  .results-banner-sep {
    width: 1px;
    height: 16px;
    background: rgba(45,212,168,0.25);
  }

  .results-banner-img {
    color: #63a5d4;
  }

  /* ── Action buttons after detection ── */
  .slide-actions {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 40;
  }

  .btn-download-slide {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 22px;
    background: var(--accent);
    color: #111;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(45,212,168,0.35);
    transition: all 0.18s;
    white-space: nowrap;
  }
  .btn-download-slide:hover {
    background: var(--accent-light);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(45,212,168,0.45);
  }
  .btn-download-slide:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-select-manual {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 11px 18px;
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }
  .btn-select-manual:hover {
    border-color: rgba(45,212,168,0.4);
    color: var(--accent);
  }

  .btn-select-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 11px 16px;
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }
  .btn-select-back:hover {
    border-color: rgba(255,255,255,0.2);
    color: var(--text);
  }

  .select-counter {
    font-size: 12px;
    color: var(--text-dim);
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    white-space: nowrap;
  }

  /* ── Floating toolbar (pristine mode) ── */
  .slide-toolbar {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(20, 18, 17, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 20;
    white-space: nowrap;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.1);
    margin: 0 2px;
  }

  .tb-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-dim);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .tb-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    color: var(--text);
  }
  .tb-btn:disabled { opacity: 0.45; cursor: default; }

  .tb-btn.active {
    background: rgba(45,212,168,0.12);
    border-color: rgba(45,212,168,0.35);
    color: var(--accent);
  }

  .tb-btn.loading {
    pointer-events: none;
  }

  /* ── Spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── Error toast ── */
  .ed-error {
    margin: 0 auto 12px;
    max-width: 600px;
    padding: 10px 16px;
    background: rgba(248,113,113,0.12);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: 8px;
    font-size: 13px;
    color: var(--error);
  }

  /* ── Tier badge ── */
  .tier-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 5px;
    background: rgba(45,212,168,0.12);
    color: var(--accent);
    border: 1px solid rgba(45,212,168,0.25);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── Watermark ── */
  .watermark-notice {
    font-size: 12px;
    color: var(--text-dim);
    background: rgba(45,212,168,0.06);
    border: 1px solid rgba(45,212,168,0.15);
    border-radius: 6px;
    padding: 4px 10px;
  }

  /* ── Export result ── */
  .export-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 16px;
    padding: 60px 24px;
    text-align: center;
  }
  .export-done h2 { font-size: 22px; font-weight: 700; }
  .export-done p { font-size: 14px; color: var(--text-dim); }

  /* ── Processing overlay ── */
  .processing-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(20,18,17,0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 60;
    gap: 16px;
    color: var(--accent);
    font-size: 15px;
    font-weight: 600;
  }

  .spinner-large {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255,255,255,0.15);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── Editable text blocks (editing mode) ── */
  .editable-text-block {
    position: absolute;
    box-sizing: border-box;
    background: transparent;
    border: none;
    outline: none;
    cursor: text;
    padding: 2px 4px;
    line-height: 1.25;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
    pointer-events: all;
  }
  .editable-text-block:hover {
    outline: 1.5px dashed rgba(45,212,168,0.45);
    background: rgba(45,212,168,0.04);
  }
  .editable-text-block:focus {
    outline: 2px solid var(--accent);
    background: rgba(255,255,255,0.1);
    box-shadow: 0 0 12px rgba(45,212,168,0.2);
  }

  /* ── Editing mode toolbar ── */
  .editing-toolbar {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(20,18,17,0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 40;
    white-space: nowrap;
  }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconUpload = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

// ─── PDF.js loader ────────────────────────────────────────────────────────────

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
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Could not load PDF.js'));
    document.head.appendChild(script);
  });
  return pdfJsPromise;
}

// ─── PptxGenJS loader ────────────────────────────────────────────────────────

let pptxPromise = null;

function loadPptxGen() {
  if (pptxPromise) return pptxPromise;
  pptxPromise = new Promise((resolve, reject) => {
    if (window.PptxGenJS) { resolve(window.PptxGenJS); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/gitbrent/PptxGenJS@3.12.0/dist/pptxgen.bundle.js';
    script.onload = () => {
      if (window.PptxGenJS) resolve(window.PptxGenJS);
      else reject(new Error('PptxGenJS not found after load'));
    };
    script.onerror = () => reject(new Error('Could not load PptxGenJS'));
    document.head.appendChild(script);
  });
  return pptxPromise;
}

// ─── Client-side inpainting (canvas) ─────────────────────────────────────────
//
// Why: the AI Vision bounding boxes for textBlocks are NEVER pixel-perfect.
// Even with generous padding, a fixed-color rect (e.g. white) leaves the
// original text visible AROUND the box on colored backgrounds, producing the
// dreaded "double text" effect in the exported PPTX.
//
// Strategy: sample the average background color from a thin frame of pixels
// just OUTSIDE each text bounding box, then paint a generously-padded rect
// of that color OVER the text region. Result: the text disappears into its
// own background — works on white, colored, gradient, and even photo
// backgrounds (degrades gracefully to a sampled solid color).
//
// 100% client-side, no API call, deterministic, free.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Sample average color from a thin frame around a rect (in pixel coords).
// We sample only pixels OUTSIDE the inner rect but WITHIN the outer frame.
// Returns { r, g, b } as 0-255 ints, or null if no samples.
function sampleBorderColor(ctx, x, y, w, h, frameThickness, imgW, imgH) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(imgW, Math.ceil(x + w));
  const y1 = Math.min(imgH, Math.ceil(y + h));

  // Outer frame box (clamped to image)
  const fx0 = Math.max(0, x0 - frameThickness);
  const fy0 = Math.max(0, y0 - frameThickness);
  const fx1 = Math.min(imgW, x1 + frameThickness);
  const fy1 = Math.min(imgH, y1 + frameThickness);

  if (fx1 <= fx0 || fy1 <= fy0) return null;

  let imageData;
  try {
    imageData = ctx.getImageData(fx0, fy0, fx1 - fx0, fy1 - fy0);
  } catch (e) {
    // Tainted canvas (cross-origin) — unlikely since we draw a same-origin dataURL
    return null;
  }
  const data = imageData.data;
  const fW = fx1 - fx0;

  // Inner rect coords RELATIVE to frame
  const ix0 = x0 - fx0;
  const iy0 = y0 - fy0;
  const ix1 = x1 - fx0;
  const iy1 = y1 - fy0;

  // Collect samples and use median per channel — robust to outliers (text glyphs
  // that may bleed slightly into the frame, or anti-aliased edges).
  const rs = [], gs = [], bs = [];
  // Step to keep sampling cheap on large boxes
  const step = Math.max(1, Math.floor(Math.min(fW, fy1 - fy0) / 80));

  for (let py = 0; py < fy1 - fy0; py += step) {
    for (let px = 0; px < fW; px += step) {
      // Skip pixels that fall INSIDE the inner rect (those are the text region)
      if (px >= ix0 && px < ix1 && py >= iy0 && py < iy1) continue;
      const i = (py * fW + px) * 4;
      const a = data[i + 3];
      if (a < 200) continue;
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
  }

  if (rs.length === 0) return null;

  // Median (robust to dark text pixels that leak into the frame)
  const median = (arr) => {
    arr.sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)];
  };

  return { r: median(rs), g: median(gs), b: median(bs) };
}

function rgbToHex({ r, g, b }) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/**
 * Erase text from an image client-side by painting background-color rects
 * over each detected text box.
 *
 * @param {string} origDataUrl - source image data URL
 * @param {Array} textBlocks - normalized (0-1) bounding boxes
 * @param {Set<number>} keepIndices - indices of blocks to erase (only erase blocks the user kept)
 * @returns {Promise<{ dataUrl: string, blockColors: Array<string|null> }>}
 *   blockColors[i] is the sampled hex (no '#') for block i, or null if not erased.
 */
async function clientSideInpaint(origDataUrl, textBlocks, keepIndices, opts = {}) {
  // Modalita' "solo testo": sfondo completamente bianco, niente immagine originale.
  // Garantisce zero residui per slide complesse (pattern, sfondi colorati).
  if (opts.whiteOnly) {
    const imgWhite = await loadImage(origDataUrl);
    const cWhite = document.createElement('canvas');
    cWhite.width = imgWhite.naturalWidth;
    cWhite.height = imgWhite.naturalHeight;
    const cx = cWhite.getContext('2d');
    cx.fillStyle = '#FFFFFF';
    cx.fillRect(0, 0, cWhite.width, cWhite.height);
    return { dataUrl: cWhite.toDataURL('image/jpeg', 0.92), blockColors: [] };
  }

  if (!textBlocks || textBlocks.length === 0) {
    return { dataUrl: origDataUrl, blockColors: [] };
  }
  const img = await loadImage(origDataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const blockColors = new Array(textBlocks.length).fill(null);

  // Frame piu' generoso per campionare lontano dal testo (descender/ascender,
  // pattern grafici incollati, ecc.).
  const samples = textBlocks.map((tb, i) => {
    if (!keepIndices.has(i)) return null;
    const x = (tb.x || 0) * W;
    const y = (tb.y || 0) * H;
    const w = Math.max(2, (tb.w || 0.02) * W);
    const h = Math.max(2, (tb.h || 0.02) * H);
    const frame = Math.max(10, Math.min(80, Math.round(h * 1.2)));
    const color = sampleBorderColor(ctx, x, y, w, h, frame, W, H);
    return { x, y, w, h, color };
  });

  // Padding aggressivo per coprire i bbox imprecisi della AI Vision: il testo
  // spesso sfugge sopra/sotto/lateralmente. Su slide dense (NotebookLM con
  // tabelle/elenchi) servono valori molto generosi per evitare residui.
  const PAD_X_FRAC = 0.25;
  const PAD_Y_FRAC = 0.80;
  const MIN_PAD_PX = 12;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (!s) continue;
    const fillRgb = s.color || { r: 255, g: 255, b: 255 };
    blockColors[i] = rgbToHex(fillRgb);

    const padX = Math.max(MIN_PAD_PX, s.w * PAD_X_FRAC);
    const padY = Math.max(MIN_PAD_PX, s.h * PAD_Y_FRAC);

    const px = Math.max(0, s.x - padX);
    const py = Math.max(0, s.y - padY);
    const pw = Math.min(W - px, s.w + padX * 2);
    const ph = Math.min(H - py, s.h + padY * 2);

    ctx.fillStyle = `rgb(${fillRgb.r}, ${fillRgb.g}, ${fillRgb.b})`;
    ctx.fillRect(px, py, pw, ph);
  }

  // JPEG keeps file size sane (PPTX-friendly); quality 0.92 preserves background gradients.
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return { dataUrl, blockColors };
}

// ─── createSlideState helper ─────────────────────────────────────────────────

function createSlideState(origDataUrl, width, height) {
  return {
    origDataUrl,
    cleanedDataUrl: null,
    width,
    height,
    mode: 'pristine', // 'pristine' | 'detected' | 'selecting' | 'processing' | 'editing'
    detection: {
      status: 'idle',
      error: null,
      textBlocks: [],
      imageRegions: [],
    },
    grabbedTextIndices: new Set(),
    grabbedImageIndices: new Set(),
    editedTexts: {}, // { blockIndex: "edited text" }
    complexLayout: false,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Editor({ onReset }) {
  const { tier: rawTier, isLoggedIn, user } = useTier();
  const tier = resolveTier(rawTier || '');
  const maxPages = getMaxPages(tier);
  const tierConfig = TIERS[tier] || null;

  const [phase, setPhase] = useState('upload'); // 'upload' | 'rendering' | 'slides' | 'exporting' | 'done'
  const [renderProgress, setRenderProgress] = useState({ done: 0, total: 0, label: '' });
  const [slides, setSlides] = useState([]); // array of createSlideState()
  const [fileName, setFileName] = useState('');
  const [exportError, setExportError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ active: false, done: 0, total: 0 });

  const fileInputRef = useRef(null);

  // ── Inject CSS once ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = 'ed-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // ── PDF rendering ─────────────────────────────────────────────────────────

  const renderPdf = useCallback(async (file) => {
    setPhase('rendering');
    setFileName(file.name.replace(/\.pdf$/i, ''));
    setRenderProgress({ done: 0, total: 0, label: 'Caricamento PDF...' });

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = Math.min(pdf.numPages, maxPages);

      setRenderProgress({ done: 0, total: numPages, label: `Rendering ${numPages} pagine...` });

      const results = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        results.push(createSlideState(dataUrl, viewport.width, viewport.height));
        setRenderProgress({ done: i, total: numPages, label: `Pagina ${i} / ${numPages}` });
      }

      setSlides(results);
      setPhase('slides');
    } catch (err) {
      console.error('PDF render error:', err);
      setExportError(`Errore nel rendering del PDF: ${err.message}`);
      setPhase('upload');
    }
  }, [maxPages]);

  // ── File input handling ───────────────────────────────────────────────────

  const handleFileSelect = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') return;
    renderPdf(file);
  }, [renderPdf]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  // ── Per-slide AI detection ────────────────────────────────────────────────

  const runDetection = useCallback(async (slideIndex) => {
    setSlides(prev => {
      const next = [...prev];
      next[slideIndex] = {
        ...next[slideIndex],
        detection: { ...next[slideIndex].detection, status: 'loading', error: null }
      };
      return next;
    });

    try {
      const slide = slides[slideIndex];
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: slide.origDataUrl,
          email: user?.email,
        })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Errore AI (${resp.status})`);
      }

      const data = await resp.json();
      const textBlocks = Array.isArray(data.textBlocks) ? data.textBlocks : [];
      const imageRegions = Array.isArray(data.imageRegions) ? data.imageRegions : [];

      // Difesa: se l'AI non ha rilevato alcun testo, NON entriamo in editing
      // mode (mostrerebbe solo bianco). Restiamo in pristine con un errore
      // esplicito cosi' l'utente puo' riprovare.
      if (textBlocks.length === 0) {
        setSlides(prev => {
          const next = [...prev];
          next[slideIndex] = {
            ...next[slideIndex],
            mode: 'pristine',
            detection: {
              status: 'error',
              error: 'Nessun testo rilevato. Riprova oppure passa alla slide successiva.',
              textBlocks: [],
              imageRegions: [],
            },
          };
          return next;
        });
        return;
      }

      // Preview con sfondo bianco: l'utente vede direttamente cio' che
      // sara' esportato (zero ridondanza tra immagine originale e text-block).
      let cleanedDataUrl = null;
      try {
        const result = await clientSideInpaint(
          slide.origDataUrl,
          [],
          new Set(),
          { whiteOnly: true }
        );
        cleanedDataUrl = result?.dataUrl || null;
      } catch (err) {
        console.warn('[runDetection] preview background failed', err);
      }

      // Heuristic "complex layout": segnali che l'AI ha probabilmente
      // approssimato male il contenuto della slide.
      //  - una imageRegion gigante (>50% area) → l'AI ha trattato lo sfondo
      //    decorato come "immagine" invece di separarne i testi
      //  - meno di 3 textBlocks → l'AI ha verosimilmente perso del testo
      const hasGiantRegion = imageRegions.some(
        (r) => (r.w || 0) * (r.h || 0) > 0.5
      );
      const tooFewBlocks = textBlocks.length < 3;
      const complexLayout = hasGiantRegion || tooFewBlocks;

      setSlides(prev => {
        const next = [...prev];
        next[slideIndex] = {
          ...next[slideIndex],
          mode: 'editing',
          detection: { status: 'done', error: null, textBlocks, imageRegions },
          grabbedTextIndices: new Set(textBlocks.map((_, i) => i)),
          grabbedImageIndices: new Set(imageRegions.map((_, i) => i)),
          cleanedDataUrl,
          complexLayout,
        };
        return next;
      });
    } catch (err) {
      setSlides(prev => {
        const next = [...prev];
        next[slideIndex] = {
          ...next[slideIndex],
          detection: { ...next[slideIndex].detection, status: 'error', error: err.message }
        };
        return next;
      });
    }
  }, [slides, tier, user]);

  // ── Batch AI detection: cattura tutte le slide in sequenza ───────────────

  const runDetectionAll = useCallback(async () => {
    const indices = slides
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.detection.status !== 'done' && s.detection.status !== 'loading')
      .map(({ i }) => i);

    if (indices.length === 0) return;

    setBatchProgress({ active: true, done: 0, total: indices.length });

    for (let k = 0; k < indices.length; k++) {
      try {
        await runDetection(indices[k]);
      } catch (err) {
        console.error('Batch detection failed for slide', indices[k], err);
        // Continua con le altre anche se una fallisce
      }
      setBatchProgress(p => ({ ...p, done: k + 1 }));
    }

    setBatchProgress({ active: false, done: 0, total: 0 });
  }, [slides, runDetection]);

  // ── Update edited text for a block ──────────────────────────────────────
  const updateBlockText = useCallback((slideIndex, blockIndex, newText) => {
    setSlides(prev => {
      const next = [...prev];
      const slide = { ...next[slideIndex] };
      slide.editedTexts = { ...slide.editedTexts, [blockIndex]: newText };
      next[slideIndex] = slide;
      return next;
    });
  }, []);

  // ── Build PPTX from a subset of slides ───────────────────────────────────

  const buildAndDownloadPptx = useCallback(async (slideSubset, name) => {
    const PptxGenJS = await loadPptxGen();
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    const SLIDE_W = 13.33;
    const SLIDE_H = 7.5;

    // Genera UNA SOLA volta un canvas bianco 16:9 1920x1080 da usare come
    // sfondo per ogni slide del PPTX. Niente origDataUrl, niente cleanedDataUrl,
    // niente imageRegions: solo bianco + i text-block editabili.
    const whiteCanvas = document.createElement('canvas');
    whiteCanvas.width = 1920;
    whiteCanvas.height = 1080;
    const wctx = whiteCanvas.getContext('2d');
    wctx.fillStyle = '#FFFFFF';
    wctx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
    const whiteBgDataUrl = whiteCanvas.toDataURL('image/jpeg', 0.9);

    for (const slide of slideSubset) {
      const pSlide = pptx.addSlide();
      const det = slide.detection || {};

      // 1) Sfondo bianco unico — UNA sola addImage per slide.
      pSlide.addImage({
        data: whiteBgDataUrl,
        x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
      });

      // 2) Solo i text-block editabili. Niente immagini, niente icone,
      //    niente region crop dall'originale.
      const textBlocks = det.textBlocks || [];
      const grabbed = slide.grabbedTextIndices || new Set();
      for (const idx of grabbed) {
        const tb = textBlocks[idx];
        if (!tb) continue;

        const text = (slide.editedTexts && slide.editedTexts[idx] !== undefined)
          ? slide.editedTexts[idx]
          : (tb.text || '');

        let tx = Math.max(0, (tb.x || 0) * SLIDE_W);
        let ty = Math.max(0, (tb.y || 0) * SLIDE_H);
        let tw = Math.max(0.1, (tb.w || 0.1) * SLIDE_W);
        let th = Math.max(0.05, (tb.h || 0.05) * SLIDE_H);
        if (tx + tw > SLIDE_W) tw = SLIDE_W - tx;
        if (ty + th > SLIDE_H) th = SLIDE_H - ty;

        const color = (tb.color || '#333333').replace('#', '').toUpperCase();

        pSlide.addText(text, {
          x: tx, y: ty, w: tw, h: th,
          fontSize: Math.max(8, Math.min(72, tb.fontSize || 18)),
          color,
          bold: tb.bold === true,
          align: tb.align || 'left',
          fontFace: tb.fontFamily || 'Arial',
          wrap: true,
          valign: 'top',
          margin: 0,
        });
      }
    }

    const safeName = name.replace(/[^a-z0-9_-]/gi, '_') || 'slideforge';
    await pptx.writeFile({ fileName: `${safeName}.pptx` });
  }, []);

  // ── Export single slide ───────────────────────────────────────────────────

  const exportSlide = useCallback(async (slideIndex) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    setSlides(prev => {
      const next = [...prev];
      next[slideIndex] = { ...next[slideIndex], exporting: true };
      return next;
    });

    try {
      await buildAndDownloadPptx([slide], `${fileName}_slide${slideIndex + 1}`);
    } catch (err) {
      console.error('Export single slide error:', err);
      setExportError(`Errore export slide ${slideIndex + 1}: ${err.message}`);
    } finally {
      setSlides(prev => {
        const next = [...prev];
        next[slideIndex] = { ...next[slideIndex], exporting: false };
        return next;
      });
    }
  }, [slides, fileName, buildAndDownloadPptx]);

  // ── Export all slides PPTX ────────────────────────────────────────────────

  const exportPptx = useCallback(async () => {
    setPhase('exporting');
    setExportError(null);
    try {
      await buildAndDownloadPptx(slides, fileName);
      setPhase('done');
    } catch (err) {
      console.error('Export error:', err);
      setExportError(`Errore export: ${err.message}`);
      setPhase('slides');
    }
  }, [slides, fileName, buildAndDownloadPptx]);

  // ── Compute export readiness ──────────────────────────────────────────────

  const hasAnyGrabbed = slides.some(
    s => s.grabbedTextIndices.size > 0 || s.grabbedImageIndices.size > 0
  );
  const canExport = slides.length > 0 && phase === 'slides';

  // ─── Render ────────────────────────────────────────────────────────────────

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!isLoggedIn || !tierConfig) {
    return (
      <div className="ed-root">
        <header className="ed-header">
          <span className="ed-logo">SlideForge</span>
        </header>
        <div className="ed-upload">
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '48px 40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 4 }}>🔒</div>
            <div className="upload-title">Accedi con la tua email per usare SlideForge</div>
            <div className="upload-sub" style={{ marginBottom: 0 }}>
              Riservato agli iscritti de La Cassetta degli AI-trezzi
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={onReset}>
                Accedi
              </button>
              <a
                href="https://lacassettadegliaitrezzi.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                Abbonati alla Cassetta
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-root">
      {/* Header */}
      <header className="ed-header">
        <span className="ed-logo">SlideForge</span>
        {phase === 'slides' && (
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {fileName} — {slides.length} slide{slides.length !== 1 ? 's' : ''}
          </span>
        )}
        <div className="ed-header-right">
          <span className="tier-badge">{tierConfig.name}</span>
          {phase === 'slides' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={onReset}>
                Nuovo PDF
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={runDetectionAll}
                disabled={
                  batchProgress.active ||
                  slides.every(s => s.detection.status === 'done')
                }
                title="Analizza con AI tutte le slide non ancora processate"
              >
                {batchProgress.active
                  ? `Elaborazione ${batchProgress.done} / ${batchProgress.total}...`
                  : 'Rendi tutte modificabili'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={exportPptx}
                disabled={!canExport || batchProgress.active}
              >
                <IconDownload /> Esporta PPTX
              </button>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      {phase === 'upload' && (
        <UploadZone
          isDragOver={isDragOver}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          maxPages={maxPages}
          error={exportError}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
        </UploadZone>
      )}

      {phase === 'rendering' && (
        <div className="ed-progress">
          <div className="progress-label">{renderProgress.label}</div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: renderProgress.total > 0
                  ? `${(renderProgress.done / renderProgress.total) * 100}%`
                  : '10%'
              }}
            />
          </div>
          {renderProgress.total > 0 && (
            <div className="progress-label" style={{ fontSize: 12 }}>
              {renderProgress.done} / {renderProgress.total}
            </div>
          )}
        </div>
      )}

      {phase === 'slides' && (
        <div className="ed-slides">
          {exportError && (
            <div className="ed-error">{exportError}</div>
          )}
          {slides.map((slide, si) => (
            <SlideCard
              key={si}
              slide={slide}
              index={si}
              onDetect={() => runDetection(si)}
              onExportSlide={() => exportSlide(si)}
              onUpdateText={(bi, text) => updateBlockText(si, bi, text)}
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
          <h2>Export completato!</h2>
          <p>Il file PPTX è stato scaricato automaticamente.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setPhase('slides')}>
              Torna alle slide
            </button>
            <button className="btn btn-primary" onClick={onReset}>
              Nuovo PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UploadZone sub-component ─────────────────────────────────────────────────

function UploadZone({ isDragOver, onDragOver, onDragLeave, onDrop, onClick, maxPages, error, children }) {
  return (
    <div className="ed-upload">
      {error && <div className="ed-error" style={{ maxWidth: 520 }}>{error}</div>}
      <div
        className={`upload-zone${isDragOver ? ' drag-over' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
      >
        <div className="upload-icon"><IconUpload /></div>
        <div className="upload-title">Carica il tuo PDF</div>
        <div className="upload-sub">
          Trascina qui o clicca per scegliere un file
          <br />
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

// ─── SlideCard sub-component ──────────────────────────────────────────────────

function SlideCard({ slide, index, onDetect, onExportSlide, onUpdateText }) {
  const { origDataUrl, detection, grabbedTextIndices, grabbedImageIndices, mode, exporting, complexLayout } = slide;
  const det = detection;
  const isLoading = det.status === 'loading';
  const isError = det.status === 'error';

  // Solo due mode raggiungibili: 'pristine' (in attesa) e 'editing' (modificabile).
  const isPristine = mode === 'pristine';
  const isEditing = mode === 'editing';

  return (
    <div className="slide-wrap">
      <div className="slide-label">
        Slide {index + 1}
        {isEditing && (
          <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>
            · modalità modifica
          </span>
        )}
        {isEditing && complexLayout && (
          <span
            title="L'AI ha rilevato un layout complesso (sfondo decorato, pattern o pochi testi). Verifica il risultato e usa Riprova se serve."
            style={{
              marginLeft: 8, color: '#F59E0B', fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '2px 8px', borderRadius: 4, fontSize: 10,
              letterSpacing: 0.4,
            }}
          >
            ⚠ LAYOUT COMPLESSO — VERIFICA
          </span>
        )}
      </div>

      <div className="slide-canvas-wrap">
        {/* Background image: cleanedDataUrl in editing, originale altrimenti */}
        <img className="slide-bg-img" src={isEditing && slide.cleanedDataUrl ? slide.cleanedDataUrl : origDataUrl} alt={`Slide ${index + 1}`} draggable={false} />

        {/* Editing mode: editable text blocks on cleaned background */}
        {isEditing && (
          <div className="slide-overlay" style={{ pointerEvents: 'auto' }}>
            {det.textBlocks.map((tb, bi) => (
              grabbedTextIndices.has(bi) && (
                <div
                  key={`e${bi}`}
                  contentEditable
                  suppressContentEditableWarning
                  className="editable-text-block"
                  style={{
                    left: `${(tb.x || 0) * 100}%`,
                    top: `${(tb.y || 0) * 100}%`,
                    width: `${(tb.w || 0) * 100}%`,
                    minHeight: `${(tb.h || 0) * 100}%`,
                    color: tb.color || '#333333',
                    fontSize: `${((tb.fontSize || 16) * 0.104).toFixed(2)}cqi`,
                    fontWeight: tb.bold ? '700' : '400',
                    textAlign: tb.align || 'left',
                    fontFamily: tb.fontFamily || 'Arial, sans-serif',
                  }}
                  onBlur={(e) => onUpdateText(bi, e.target.innerText)}
                  dangerouslySetInnerHTML={{ __html: (slide.editedTexts?.[bi] !== undefined ? slide.editedTexts[bi] : (tb.text || '')).replace(/\n/g, '<br>') }}
                />
              )
            ))}
            {/* Image regions shown as non-editable visual elements */}
            {det.imageRegions.map((ir, bi) => (
              grabbedImageIndices.has(bi) && (
                <div
                  key={`ir${bi}`}
                  style={{
                    position: 'absolute',
                    left: `${(ir.x || 0) * 100}%`,
                    top: `${(ir.y || 0) * 100}%`,
                    width: `${(ir.w || 0) * 100}%`,
                    height: `${(ir.h || 0) * 100}%`,
                    border: '1.5px solid rgba(99,165,212,0.5)',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )
            ))}
          </div>
        )}

        {/* Pristine toolbar: un singolo click → AI + inpaint + editing */}
        {isPristine && (
          <div className="slide-toolbar">
            <button
              className={`tb-btn${isLoading ? ' loading' : ''}`}
              onClick={!isLoading ? onDetect : undefined}
              disabled={isLoading}
              title="Analizza testo, pulisci lo sfondo e rendi modificabile in un click"
              style={{ minWidth: 200 }}
            >
              {isLoading ? <div className="spinner" /> : <IconText />}
              {isLoading ? 'Elaborazione...' : 'Rendi modificabile'}
            </button>

            {isError && (
              <>
                <div className="toolbar-divider" />
                <span style={{ fontSize: 11, color: 'var(--error)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {det.error}
                </span>
                <button
                  className="tb-btn"
                  onClick={onDetect}
                  style={{ color: 'var(--error)', borderColor: 'rgba(248,113,113,0.3)' }}
                >
                  Riprova
                </button>
              </>
            )}
          </div>
        )}

        {/* Editing mode actions: Download PPTX */}
        {isEditing && (
          <div className="editing-toolbar">
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Clicca sul testo per modificarlo
            </span>
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
            <button
              className="btn-download-slide"
              onClick={onExportSlide}
              disabled={exporting}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              {exporting ? <div className="spinner" style={{ borderTopColor: '#111' }} /> : <IconDownload />}
              {exporting ? 'Generazione...' : 'Scarica PPTX'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
