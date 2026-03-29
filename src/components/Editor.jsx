'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TIERS, getMaxPages } from '../lib/tiers';
import { useTier } from '../lib/TierContext';

const STYLES = `
  :root {
    --bg: #292524;
    --surface: #1E1E1E;
    --surface-alt: #2D2D2D;
    --border: #454545;
    --text: #FFFFFF;
    --text-dim: #A9A8A7;
    --text-muted: #9CA3AF;
    --accent: #2DD4A8;
    --accent-light: #5EEAD2;
    --accent-dark: #0D9488;
    --accent-glow: rgba(45, 212, 168, 0.2);
    --error: #F87171;
    --radius: 12px;
  }

  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    gap: 20px;
  }

  .editor-title {
    font-size: 16px;
    font-weight: 600;
    flex: 1;
  }

  .editor-buttons {
    display: flex;
    gap: 12px;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-export {
    background: var(--accent);
    color: var(--surface);
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(45, 212, 168, 0.25);
  }

  .btn-export:hover:not(:disabled) {
    transform: translateY(-2px);
    background: var(--accent-light);
  }

  .btn-restart {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
  }

  .btn-restart:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn-cancel {
    background: var(--error);
    color: white;
    font-weight: 600;
  }

  .btn-cancel:hover {
    opacity: 0.9;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    overflow-y: auto;
  }

  .slide-viewport {
    width: 100%;
    max-width: 960px;
    aspect-ratio: 16/9;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    background: var(--surface-alt);
  }

  .slide-layer {
    position: absolute;
    inset: 0;
  }

  .slide-bg {
    width: 100%;
    height: 100%;
    object-fit: fill;
    display: block;
  }

  .text-block {
    position: absolute;
    padding: 2px 4px;
    outline: none;
    word-wrap: break-word;
    overflow: hidden;
    white-space: pre-wrap;
    cursor: text;
    line-height: 1.25;
    font-family: 'DM Sans', system-ui, sans-serif;
    border-radius: 2px;
  }

  .text-block:hover {
    outline: 2px dashed var(--accent);
    outline-offset: -1px;
    z-index: 5;
  }

  .text-block:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
    box-shadow: 0 0 16px rgba(45, 212, 168, 0.4);
    z-index: 10;
    overflow: visible;
  }

  .text-block[data-over-image="1"]:focus {
    background-color: rgba(255, 255, 255, 0.92) !important;
  }

  .text-block-draggable {
    cursor: grab;
  }

  .text-block-draggable.dragging {
    cursor: grabbing;
    opacity: 0.9;
    z-index: 20 !important;
  }

  .text-block-resize-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    bottom: -6px;
    right: -6px;
    background: var(--accent);
    border-radius: 2px;
    cursor: nwse-resize;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .text-block:hover .text-block-resize-handle,
  .text-block:focus .text-block-resize-handle {
    opacity: 1;
  }

  .shape-block {
    position: absolute;
    border: none;
  }

  .image-block {
    position: absolute;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
  }

  .nav-buttons {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
  }

  .nav-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 20px;
    transition: all 0.2s;
  }

  .nav-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .slide-info {
    font-size: 14px;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    min-width: 60px;
    text-align: center;
  }

  .thumbnails-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 12px 20px;
    margin-top: 20px;
    max-width: 960px;
    border-top: 1px solid var(--border);
  }

  .thumbnail {
    flex-shrink: 0;
    width: 120px;
    height: 67px;
    border-radius: 6px;
    border: 2px solid var(--border);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface-alt);
  }

  .thumbnail:hover {
    border-color: var(--accent);
  }

  .thumbnail.active {
    border-color: var(--accent);
    box-shadow: 0 0 12px rgba(45, 212, 168, 0.3);
  }

  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .edit-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--accent);
    color: #000;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s, transform 0.3s;
    z-index: 100;
    pointer-events: none;
  }

  .edit-toast.show {
    opacity: 1;
    transform: translateY(0);
  }

  .upgrade-prompt {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    max-width: 400px;
    z-index: 1000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }

  .upgrade-prompt h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .upgrade-prompt p {
    color: var(--text-dim);
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .upgrade-prompt-buttons {
    display: flex;
    gap: 12px;
  }

  .upgrade-prompt-buttons button {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upgrade-cta {
    background: var(--accent);
    color: var(--surface);
  }

  .upgrade-cta:hover {
    background: var(--accent-light);
  }

  .upgrade-dismiss {
    background: var(--surface-alt);
    border: 1px solid var(--border);
    color: var(--text-dim);
  }

  .upgrade-dismiss:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .progress-indicator {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-dim);
    z-index: 500;
  }
`;

export default function Editor() {
  const { tier } = useTier();
  const [allSlides, setAllSlides] = useState([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cancelFlag, setCancelFlag] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [upgradePrompt, setUpgradePrompt] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [dragInfo, setDragInfo] = useState(null);
  const [resizeInfo, setResizeInfo] = useState(null);

  const pdfjsLib = useRef(null);
  const tessWorker = useRef(null);
  const toastTimer = useRef(null);
  const viewportRef = useRef(null);

  const tierConfig = TIERS[tier] || TIERS.free;
  const canUseAI = !tierConfig.models.includes('offline') || tierConfig.models.length > 1;
  const canDragResize = tier === 'pro' || tier === 'enterprise';
  const maxPages = getMaxPages(tier);

  // Load PDF.js via script tag (CDN imports break Webpack)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
      script.type = 'module';
      script.onload = () => {
        pdfjsLib.current = window.pdfjsLib;
        if (pdfjsLib.current) {
          pdfjsLib.current.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
        }
      };
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.pdfjsLib) {
      pdfjsLib.current = window.pdfjsLib;
    }
  }, []);

  const showEditToast = useCallback((msg) => {
    setToastMsg(msg);
    setShowToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 1500);
  }, []);

  const showUpgradePrompt = useCallback((msg) => {
    setUpgradePrompt(msg);
  }, []);

  const dismissUpgradePrompt = useCallback(() => {
    setUpgradePrompt(null);
  }, []);

  // Pixel color sampling functions (preserved exactly)
  const sampleBg = useCallback((px, w, h, x1, y1, x2, y2) => {
    const m = 30, pixels = [];
    const pairs = [
      [x1, Math.max(0, y1 - m), x2, Math.max(0, y1 - 3)],
      [x1, Math.min(h, y2 + 3), x2, Math.min(h, y2 + m)],
      [Math.max(0, x1 - m), y1, Math.max(0, x1 - 3), y2],
      [Math.min(w, x2 + 3), y1, Math.min(w, x2 + m), y2]
    ];
    for (const [a, b, c, d] of pairs) {
      if (c <= a || d <= b) continue;
      const sx = Math.max(1, Math.floor((c - a) / 15));
      const sy = Math.max(1, Math.floor((d - b) / 15));
      for (let y = b; y < d; y += sy) {
        for (let x = a; x < c; x += sx) {
          if (x >= 0 && x < w && y >= 0 && y < h) {
            const i = (y * w + x) * 4;
            pixels.push([px[i], px[i + 1], px[i + 2]]);
          }
        }
      }
    }
    if (!pixels.length) return [230, 230, 230];
    const counts = {};
    for (const [r, g, b] of pixels) {
      const k = `${(r >> 4) << 4},${(g >> 4) << 4},${(b >> 4) << 4}`;
      counts[k] = (counts[k] || 0) + 1;
    }
    let best = null, bestC = 0;
    for (const k in counts) {
      if (counts[k] > bestC) {
        bestC = counts[k];
        best = k;
      }
    }
    return best ? best.split(',').map(Number) : [230, 230, 230];
  }, []);

  const sampleShapeFill = useCallback((px, w, h, x1, y1, x2, y2) => {
    const rw = x2 - x1, rh = y2 - y1;
    const insetX = Math.round(rw * 0.2), insetY = Math.round(rh * 0.2);
    const ix1 = x1 + insetX, iy1 = y1 + insetY;
    const ix2 = x2 - insetX, iy2 = y2 - insetY;
    const pixels = [];
    const sx = Math.max(1, Math.floor((ix2 - ix1) / 20));
    const sy = Math.max(1, Math.floor((iy2 - iy1) / 20));
    for (let y = Math.max(0, iy1); y < Math.min(h, iy2); y += sy) {
      for (let x = Math.max(0, ix1); x < Math.min(w, ix2); x += sx) {
        const i = (y * w + x) * 4;
        pixels.push([px[i], px[i + 1], px[i + 2]]);
      }
    }
    if (!pixels.length) return [200, 200, 200];
    const counts = {};
    for (const [r, g, b] of pixels) {
      const k = `${(r >> 4) << 4},${(g >> 4) << 4},${(b >> 4) << 4}`;
      counts[k] = (counts[k] || 0) + 1;
    }
    let best = null, bestC = 0;
    for (const k in counts) {
      if (counts[k] > bestC) {
        bestC = counts[k];
        best = k;
      }
    }
    return best ? best.split(',').map(Number) : [200, 200, 200];
  }, []);

  const getTextColor = useCallback((px, w, h, x1, y1, x2, y2, bg) => {
    const pixels = [];
    const sx = Math.max(1, Math.floor((x2 - x1) / 20));
    const sy = Math.max(1, Math.floor((y2 - y1) / 20));
    for (let y = Math.max(0, y1); y < Math.min(h, y2); y += sy) {
      for (let x = Math.max(0, x1); x < Math.min(w, x2); x += sx) {
        const i = (y * w + x) * 4;
        pixels.push([px[i], px[i + 1], px[i + 2]]);
      }
    }
    if (!pixels.length) return [0, 0, 0];
    const dists = pixels.map(([r, g, b]) =>
      Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
    );
    const sorted = [...dists].sort((a, b) => a - b);
    const thr = sorted[Math.floor(sorted.length * 0.8)] || 30;
    let sR = 0, sG = 0, sB = 0, cnt = 0;
    for (let i = 0; i < pixels.length; i++) {
      if (dists[i] > thr) {
        sR += pixels[i][0];
        sG += pixels[i][1];
        sB += pixels[i][2];
        cnt++;
      }
    }
    return cnt ? [Math.round(sR / cnt), Math.round(sG / cnt), Math.round(sB / cnt)] : [0, 0, 0];
  }, []);

  // Crop image regions from a canvas using normalized 0-1 coordinates.
  // Returns array of { dataUrl, region } where region is the original normalized rect.
  const cropImageRegions = useCallback((srcCanvas, imageRegions) => {
    if (!imageRegions || imageRegions.length === 0) return [];
    const w = srcCanvas.width, h = srcCanvas.height;
    const results = [];
    for (const region of imageRegions) {
      const x = Math.max(0, Math.round((region.x || 0) * w));
      const y = Math.max(0, Math.round((region.y || 0) * h));
      const rw = Math.min(w - x, Math.round((region.w || 0) * w));
      const rh = Math.min(h - y, Math.round((region.h || 0) * h));
      if (rw < 4 || rh < 4) continue;
      const crop = document.createElement('canvas');
      crop.width = rw;
      crop.height = rh;
      const ctx = crop.getContext('2d');
      ctx.drawImage(srcCanvas, x, y, rw, rh, 0, 0, rw, rh);
      results.push({
        dataUrl: crop.toDataURL('image/png'),
        region: { x: region.x || 0, y: region.y || 0, w: region.w || 0, h: region.h || 0 },
      });
    }
    return results;
  }, []);

  const cleanBackground = useCallback((srcCanvas, imgData, textBlocks, imageRegions, shapeBlocks) => {
    const w = srcCanvas.width, h = srcCanvas.height;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.drawImage(srcCanvas, 0, 0);
    const px = imgData.data;

    for (const s of (shapeBlocks || [])) {
      const bg = sampleBg(px, w, h, s.pxLeft, s.pxTop, s.pxRight, s.pxBottom);
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(s.pxLeft, s.pxTop, s.pxRight - s.pxLeft, s.pxBottom - s.pxTop);
    }

    // Paint over image regions so they appear as clean background in the PPTX
    // background layer; they will be re-added as separate image elements.
    for (const region of (imageRegions || [])) {
      const x1 = Math.max(0, Math.round((region.x || 0) * w));
      const y1 = Math.max(0, Math.round((region.y || 0) * h));
      const x2 = Math.min(w, Math.round(((region.x || 0) + (region.w || 0)) * w));
      const y2 = Math.min(h, Math.round(((region.y || 0) + (region.h || 0)) * h));
      if (x2 <= x1 || y2 <= y1) continue;
      const bg = sampleBg(px, w, h, x1, y1, x2, y2);
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    }

    for (const b of textBlocks) {
      if (b.overImage) continue;
      const padX = Math.max(25, Math.round((b.pxRight - b.pxLeft) * 0.08));
      const padY = Math.max(20, Math.round((b.pxBottom - b.pxTop) * 0.15));
      const x1 = Math.max(0, b.pxLeft - padX);
      const y1 = Math.max(0, b.pxTop - padY);
      const x2 = Math.min(w, b.pxRight + padX);
      const y2 = Math.min(h, b.pxBottom + padY);
      const bg = sampleBg(px, w, h, x1, y1, x2, y2);
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    }

    return out;
  }, [sampleBg]);

  const callAIVision = useCallback(async (dataUrl, slideNum) => {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (cancelFlag) throw new Error('Processing cancelled');

      if (attempt > 0) {
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 20000);
        await new Promise(r => setTimeout(r, delay));
      }

      try {
        const resp = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, tier })
        });

        if (resp.status === 429) {
          lastError = new Error('Modello AI sovraccarico. Riprovo...');
          continue;
        }
        if (resp.status === 503) {
          lastError = new Error('Servizio AI non disponibile.');
          continue;
        }
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || `AI Vision failed (${resp.status})`);
        }

        // Server returns already parsed & validated JSON
        return await resp.json();
      } catch (fetchErr) {
        lastError = fetchErr;
        if (attempt === maxRetries - 1) throw lastError;
      }
    }
    throw lastError || new Error('AI call failed');
  }, [cancelFlag, tier]);

  const extractBlocksOffline = useCallback((ocrData, imgW, imgH, minConf) => {
    const rawLines = [];
    if (ocrData.blocks && ocrData.blocks.length > 0) {
      for (let bi = 0; bi < ocrData.blocks.length; bi++) {
        const block = ocrData.blocks[bi];
        if (!block.paragraphs) continue;
        for (const para of block.paragraphs) {
          if (!para.lines) continue;
          for (const line of para.lines) {
            if (!line.words) continue;
            const words = [];
            let left = Infinity, top = Infinity, right = 0, bottom = 0;
            for (const word of line.words) {
              const text = (word.text || '').trim();
              if (!text || (word.confidence || 0) < minConf) continue;
              words.push(text);
              left = Math.min(left, word.bbox.x0);
              top = Math.min(top, word.bbox.y0);
              right = Math.max(right, word.bbox.x1);
              bottom = Math.max(bottom, word.bbox.y1);
            }
            if (words.length > 0) {
              rawLines.push({ words, blockNum: bi + 1, left, top, right, bottom, height: bottom - top });
            }
          }
        }
      }
    }

    rawLines.sort((a, b) => a.blockNum !== b.blockNum ? a.blockNum - b.blockNum : a.top - b.top);

    const MAX_GAP_PCT = 0.02, MAX_BOX_PCT = 0.20, LINE_H_RATIO = 0.4;
    const textBoxes = [];
    let cur = null;

    for (const line of rawLines) {
      const text = line.words.join(' ');
      if (text.includes('NotebookLM') && text.length < 25) continue;
      if (text.replace(/\s/g, '').length < 2) continue;

      if (!cur) {
        cur = { lines: [text], lineHeights: [line.height], blockNum: line.blockNum, left: line.left, top: line.top, right: line.right, bottom: line.bottom };
        continue;
      }

      const vGap = line.top - cur.bottom;
      const avgH = (cur.bottom - cur.top) / cur.lines.length;
      const sameBlock = line.blockNum === cur.blockNum;
      const hOverlap = Math.min(line.right, cur.right) - Math.max(line.left, cur.left);
      const lineW = line.right - line.left;
      const curW = cur.right - cur.left;
      const minW = Math.min(lineW, curW);
      const overlapH = minW > 0 && hOverlap / minW > 0.4;
      const absGap = vGap > imgH * MAX_GAP_PCT;
      const boxTall = (line.bottom - cur.top) > imgH * MAX_BOX_PCT;
      const lastH = cur.lineHeights[cur.lineHeights.length - 1];
      const hChange = lastH > 0 && line.height > 0 && Math.abs(line.height - lastH) / Math.max(line.height, lastH) > LINE_H_RATIO;
      const combinedW = Math.max(line.right, cur.right) - Math.min(line.left, cur.left);
      const tooWide = combinedW > imgW * 0.6;
      const merge = sameBlock && !absGap && !boxTall && !hChange && overlapH && !tooWide && vGap < avgH * 1.5;

      if (merge) {
        cur.lines.push(text);
        cur.lineHeights.push(line.height);
        cur.left = Math.min(cur.left, line.left);
        cur.top = Math.min(cur.top, line.top);
        cur.right = Math.max(cur.right, line.right);
        cur.bottom = Math.max(cur.bottom, line.bottom);
      } else {
        textBoxes.push(cur);
        cur = { lines: [text], lineHeights: [line.height], blockNum: line.blockNum, left: line.left, top: line.top, right: line.right, bottom: line.bottom };
      }
    }
    if (cur) textBoxes.push(cur);

    return textBoxes.map(b => ({
      text: b.lines.join('\n'),
      x: b.left / imgW, y: b.top / imgH,
      w: (b.right - b.left) / imgW, h: (b.bottom - b.top) / imgH,
      numLines: b.lines.length,
      pxLeft: b.left, pxTop: b.top, pxRight: b.right, pxBottom: b.bottom,
    }));
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    if (!pdfjsLib.current) {
      alert('PDF.js not loaded yet. Please try again.');
      return;
    }

    setFileName(file.name.replace(/\.pdf$/i, ''));
    setProcessing(true);
    setCancelFlag(false);

    try {
      const pdf = await pdfjsLib.current.getDocument({ data: await file.arrayBuffer() }).promise;
      const n = pdf.numPages;

      if (tier === 'free' && n > maxPages) {
        setProcessing(false);
        showUpgradePrompt(`Il piano Free supporta fino a ${maxPages} pagine. Passa a Pro per elaborare tutte le ${n} pagine.`);
        return;
      }

      // Load Tesseract for OCR
      if (typeof window.Tesseract === 'undefined') {
        const tessScript = document.createElement('script');
        tessScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        document.head.appendChild(tessScript);
        await new Promise(r => tessScript.onload = r);
      }
      tessWorker.current = await window.Tesseract.createWorker('ita+eng', 1);

      const slides = [];
      for (let i = 1; i <= n; i++) {
        if (cancelFlag) throw new Error('Processing cancelled');

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const blocks = [];

        // Extract text with AI or OCR
        let aiImageRegions = [];
        if (canUseAI) {
          setProgressMsg(`Slide ${i}/${n} — AI Vision in corso...`);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          let parsed;
          try {
            parsed = await callAIVision(dataUrl, i);
          } catch (aiErr) {
            console.warn(`⚠️ AI Vision failed for slide ${i}, falling back to OCR:`, aiErr.message);
            setProgressMsg(`Slide ${i}/${n} — AI non disponibile, uso OCR...`);
            parsed = null;
          }

          if (parsed && parsed.textBlocks && parsed.textBlocks.length > 0) {
            // AI Vision succeeded — use AI results
            aiImageRegions = parsed.imageRegions || [];

            const textBlocks = (parsed.textBlocks || []).map(tb => {
              const pxLeft = Math.round((tb.x || 0) * canvas.width);
              const pxTop = Math.round((tb.y || 0) * canvas.height);
              const pxRight = Math.round(((tb.x || 0) + (tb.w || 0.1)) * canvas.width);
              const pxBottom = Math.round(((tb.y || 0) + (tb.h || 0.05)) * canvas.height);
              const bg = sampleBg(imgData.data, canvas.width, canvas.height, pxLeft, pxTop, pxRight, pxBottom);
              const tc = getTextColor(imgData.data, canvas.width, canvas.height, pxLeft, pxTop, pxRight, pxBottom, bg);
              return {
                text: tb.text || '', x: tb.x || 0, y: tb.y || 0, w: tb.w || 0.1, h: tb.h || 0.05,
                numLines: (tb.text || '').split('\n').length,
                pxLeft, pxTop, pxRight, pxBottom, aiFontSize: tb.fontSize || null, aiBold: tb.bold || false,
              };
            });

            for (const tb of textBlocks) {
              blocks.push({
                text: tb.text, x: tb.x, y: tb.y, w: tb.w, h: tb.h, numLines: tb.numLines,
                pxLeft: tb.pxLeft, pxTop: tb.pxTop, pxRight: tb.pxRight, pxBottom: tb.pxBottom,
                aiFontSize: tb.aiFontSize, aiBold: tb.aiBold, overImage: false, pixelColor: '000000', bgColor: '#FFFFFF'
              });
            }
          } else {
            // AI failed or returned empty — fallback to OCR for this slide
            setProgressMsg(`Slide ${i}/${n} — OCR fallback...`);
            const ocrResult = await tessWorker.current.recognize(canvas);
            const tessBlocks = extractBlocksOffline(ocrResult.data, canvas.width, canvas.height, 0.3);
            for (const tb of tessBlocks) {
              const bg = sampleBg(imgData.data, canvas.width, canvas.height, tb.pxLeft, tb.pxTop, tb.pxRight, tb.pxBottom);
              const tc = getTextColor(imgData.data, canvas.width, canvas.height, tb.pxLeft, tb.pxTop, tb.pxRight, tb.pxBottom, bg);
              const colorHex = tc.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
              blocks.push({
                text: tb.text, x: tb.x, y: tb.y, w: tb.w, h: tb.h, numLines: tb.numLines,
                pxLeft: tb.pxLeft, pxTop: tb.pxTop, pxRight: tb.pxRight, pxBottom: tb.pxBottom,
                aiFontSize: null, aiBold: false, overImage: false, pixelColor: colorHex, bgColor: `rgb(${bg[0]},${bg[1]},${bg[2]})`
              });
            }
          }
        } else {
          // Free tier — OCR only
          setProgressMsg(`Slide ${i}/${n} — OCR in corso...`);
          const ocrResult = await tessWorker.current.recognize(canvas);
          const tessBlocks = extractBlocksOffline(ocrResult.data, canvas.width, canvas.height, 0.3);
          for (const tb of tessBlocks) {
            const bg = sampleBg(imgData.data, canvas.width, canvas.height, tb.pxLeft, tb.pxTop, tb.pxRight, tb.pxBottom);
            const tc = getTextColor(imgData.data, canvas.width, canvas.height, tb.pxLeft, tb.pxTop, tb.pxRight, tb.pxBottom, bg);
            const colorHex = tc.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
            blocks.push({
              text: tb.text, x: tb.x, y: tb.y, w: tb.w, h: tb.h, numLines: tb.numLines,
              pxLeft: tb.pxLeft, pxTop: tb.pxTop, pxRight: tb.pxRight, pxBottom: tb.pxBottom,
              aiFontSize: null, aiBold: false, overImage: false, pixelColor: colorHex, bgColor: `rgb(${bg[0]},${bg[1]},${bg[2]})`
            });
          }
        }

        // Crop image regions from the high-res canvas before cleaning the background
        const extractedImages = cropImageRegions(canvas, aiImageRegions);

        const cleaned = cleanBackground(canvas, imgData, blocks, aiImageRegions, []);
        slides.push({
          origDataUrl: canvas.toDataURL('image/jpeg', 0.92),
          cleanedDataUrl: cleaned.toDataURL('image/jpeg', 0.92),
          origImgData: imgData,
          blocks,
          extracted: extractedImages,
          imgRegions: aiImageRegions,
          shapes: [],
          width: canvas.width,
          height: canvas.height,
        });
      }

      if (tessWorker.current) await tessWorker.current.terminate();

      setAllSlides(slides);
      setCurrentSlideIdx(0);
      setProcessing(false);
    } catch (err) {
      console.error(err);
      setProcessing(false);
      alert(`Error: ${err.message}`);
    }
  }, [tier, maxPages, canUseAI, callAIVision, sampleBg, getTextColor, cleanBackground, cropImageRegions, extractBlocksOffline, cancelFlag, showUpgradePrompt]);

  const handleTextEdit = useCallback((slideIdx, blockIdx, newText) => {
    const newSlides = [...allSlides];
    newSlides[slideIdx].blocks[blockIdx].text = newText;
    setAllSlides(newSlides);
    showEditToast('Testo salvato');

    setUndoStack([...undoStack, { slideIdx, blockIdx, oldText: allSlides[slideIdx].blocks[blockIdx].text }]);
    setRedoStack([]);
  }, [allSlides, undoStack, showEditToast]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    const newSlides = [...allSlides];
    const oldText = newSlides[lastAction.slideIdx].blocks[lastAction.blockIdx].text;
    newSlides[lastAction.slideIdx].blocks[lastAction.blockIdx].text = lastAction.oldText;
    setAllSlides(newSlides);
    setRedoStack([...redoStack, { slideIdx: lastAction.slideIdx, blockIdx: lastAction.blockIdx, text: oldText }]);
    setUndoStack(undoStack.slice(0, -1));
  }, [allSlides, undoStack, redoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const lastAction = redoStack[redoStack.length - 1];
    const newSlides = [...allSlides];
    const oldText = newSlides[lastAction.slideIdx].blocks[lastAction.blockIdx].text;
    newSlides[lastAction.slideIdx].blocks[lastAction.blockIdx].text = lastAction.text;
    setAllSlides(newSlides);
    setUndoStack([...undoStack, { slideIdx: lastAction.slideIdx, blockIdx: lastAction.blockIdx, oldText }]);
    setRedoStack(redoStack.slice(0, -1));
  }, [allSlides, undoStack, redoStack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
      if (allSlides.length > 0 && !['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) {
        if (e.key === 'ArrowLeft' && currentSlideIdx > 0) {
          setCurrentSlideIdx(currentSlideIdx - 1);
        } else if (e.key === 'ArrowRight' && currentSlideIdx < allSlides.length - 1) {
          setCurrentSlideIdx(currentSlideIdx + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIdx, allSlides, handleUndo, handleRedo]);

  const handleTextBlockPointerDown = useCallback((e, blockIdx) => {
    if (!canDragResize || e.button !== 0) return;
    if (e.target.classList.contains('text-block-resize-handle')) {
      setResizeInfo({ blockIdx, startX: e.clientX, startY: e.clientY, startW: e.currentTarget.offsetWidth, startH: e.currentTarget.offsetHeight });
      e.preventDefault();
    } else if (!e.currentTarget.textContent) {
      setDragInfo({ blockIdx, startX: e.clientX, startY: e.clientY, startLeft: e.currentTarget.offsetLeft, startTop: e.currentTarget.offsetTop });
      e.preventDefault();
    }
  }, [canDragResize]);

  useEffect(() => {
    if (!dragInfo && !resizeInfo) return;

    const handlePointerMove = (e) => {
      if (!viewportRef.current) return;
      const viewport = viewportRef.current;
      const vpRect = viewport.getBoundingClientRect();

      if (dragInfo) {
        const dx = e.clientX - dragInfo.startX;
        const dy = e.clientY - dragInfo.startY;
        const newLeft = Math.max(0, Math.min(vpRect.width - 50, dragInfo.startLeft + dx));
        const newTop = Math.max(0, Math.min(vpRect.height - 20, dragInfo.startTop + dy));

        const textBlock = viewport.querySelector(`[data-block-idx="${dragInfo.blockIdx}"]`);
        if (textBlock) {
          textBlock.style.left = newLeft + 'px';
          textBlock.style.top = newTop + 'px';
        }
      } else if (resizeInfo) {
        const dx = e.clientX - resizeInfo.startX;
        const dy = e.clientY - resizeInfo.startY;
        const newW = Math.max(50, resizeInfo.startW + dx);
        const newH = Math.max(20, resizeInfo.startH + dy);

        const textBlock = viewport.querySelector(`[data-block-idx="${resizeInfo.blockIdx}"]`);
        if (textBlock) {
          textBlock.style.width = newW + 'px';
          textBlock.style.height = newH + 'px';
        }
      }
    };

    const handlePointerUp = () => {
      setDragInfo(null);
      setResizeInfo(null);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragInfo, resizeInfo]);

  const handleExport = useCallback(async () => {
    if (typeof window.PptxGenJS === 'undefined') {
      const pptxScript = document.createElement('script');
      pptxScript.src = 'https://cdn.jsdelivr.net/gh/gitbrent/PptxGenJS@3.12.0/dist/pptxgen.bundle.js';
      document.head.appendChild(pptxScript);
      await new Promise(r => pptxScript.onload = r);
    }

    const pptx = new window.PptxGenJS();
    pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
    pptx.layout = 'W';
    const SW = 13.333, SH = 7.5;

    for (const s of allSlides) {
      const sl = pptx.addSlide();
      sl.addImage({ data: s.cleanedDataUrl, x: 0, y: 0, w: SW, h: SH });

      // Add extracted image regions as separate positioned elements
      for (const ei of (s.extracted || [])) {
        const { x, y, w, h } = ei.region;
        sl.addImage({
          data: ei.dataUrl,
          x: x * SW,
          y: y * SH,
          w: w * SW,
          h: h * SH,
        });
      }

      for (const b of s.blocks) {
        const blockH = b.h * SH;
        const nLines = Math.max(b.numLines || 1, 1);
        const lineH = blockH / nLines;
        const fontSize = Math.max(8, Math.min(48, Math.round(lineH * 72 / 1.35)));
        const bg = sampleBg(s.origImgData.data, s.width, s.height, b.pxLeft, b.pxTop, b.pxRight, b.pxBottom);
        const tc = getTextColor(s.origImgData.data, s.width, s.height, b.pxLeft, b.pxTop, b.pxRight, b.pxBottom, bg);
        const colorHex = tc.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
        const bgHex = bg.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');

        const pad = 0.06;
        const x = Math.max(0, b.x * SW - pad);
        const y = Math.max(0, b.y * SH - pad);
        const w = Math.min(SW - x, b.w * SW + 2 * pad);
        const h = Math.min(SH - y, b.h * SH + 2 * pad);

        const lines = b.text.split('\n');
        const txtParts = lines.map((line, i) => ({
          text: line + (i < lines.length - 1 ? '\n' : ''),
          options: { fontSize, color: colorHex, bold: fontSize >= 26 && nLines <= 3, fontFace: 'Calibri' }
        }));

        const fillOpt = b.overImage ? { type: 'none' } : { color: bgHex };
        sl.addText(txtParts, { x, y, w, h, valign: 'top', wrap: true, fill: fillOpt });
      }

      // Add watermark for free tier
      if (tier === 'free') {
        sl.addText('Creato con SlideForge — slideforge.app', {
          x: 11, y: 6.8, w: 2.3, h: 0.7,
          fontSize: 8, color: 'CCCCCC', opacity: 0.5, align: 'right', valign: 'bottom'
        });
      }
    }

    const blob = await pptx.write({ outputType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}_EDITABILE.pptx`;
    a.click();
  }, [allSlides, fileName, tier, sampleBg, getTextColor]);

  if (processing) {
    return (
      <div className="editor-container">
        <style>{STYLES}</style>
        <div className="editor-header">
          <div className="editor-title">SlideForge — Elaborazione</div>
          <button className="btn btn-cancel" onClick={() => setCancelFlag(true)}>Annulla</button>
        </div>
        <div className="editor-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⟳</div>
            <h3>{progressMsg || 'Sto elaborando le slide...'}</h3>
            <p style={{ color: 'var(--text-dim)' }}>Dipende dal numero di pagine e dal modello AI</p>
          </div>
        </div>
      </div>
    );
  }

  if (allSlides.length === 0) {
    return (
      <div className="editor-container">
        <style>{STYLES}</style>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <h2 style={{ marginBottom: '16px' }}>Carica un PDF per iniziare</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
          />
          {tier === 'free' && <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-dim)' }}>Piano Free: max {maxPages} pagine</p>}
        </div>
      </div>
    );
  }

  const slide = allSlides[currentSlideIdx];
  const vpH = viewportRef.current?.offsetHeight || 540;

  return (
    <div className="editor-container">
      <style>{STYLES}</style>

      {upgradePrompt && (
        <>
          <div className="modal-overlay" onClick={dismissUpgradePrompt} />
          <div className="upgrade-prompt">
            <h3>Funzione disponibile nel piano Pro</h3>
            <p>{upgradePrompt}</p>
            <div className="upgrade-prompt-buttons">
              <button className="upgrade-cta" onClick={() => { /* Handle upgrade */ dismissUpgradePrompt(); }}>
                Passa a Pro
              </button>
              <button className="upgrade-dismiss" onClick={dismissUpgradePrompt}>Annulla</button>
            </div>
          </div>
        </>
      )}

      <div className="edit-toast" style={{ opacity: showToast ? 1 : 0, transform: showToast ? 'translateY(0)' : 'translateY(10px)' }}>
        {toastMsg}
      </div>

      <div className="editor-header">
        <div className="editor-title">SlideForge Editor — {fileName}</div>
        <div className="editor-buttons">
          <button className="btn btn-export" onClick={handleExport}>⬇ Esporta PPTX</button>
          <button className="btn btn-restart" onClick={() => { setAllSlides([]); setCurrentSlideIdx(0); }}>⟲ Ricomincia</button>
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-content">
          <div className="slide-viewport" ref={viewportRef}>
            <div className="slide-layer" style={{ zIndex: 1 }}>
              <img className="slide-bg" src={slide.cleanedDataUrl} alt="slide" />
            </div>

            <div className="slide-layer" style={{ zIndex: 2 }} id="shapesLayer">
              {slide.shapes?.map((sh, idx) => (
                <div key={idx} className="shape-block" style={{
                  left: sh.x * 100 + '%', top: sh.y * 100 + '%',
                  width: sh.w * 100 + '%', height: sh.h * 100 + '%',
                  backgroundColor: sh.fillColor || 'transparent',
                  borderRadius: sh.rounded ? '8px' : '0'
                }} />
              ))}
            </div>

            <div className="slide-layer" style={{ zIndex: 3 }} id="imagesLayer">
              {slide.extracted?.map((ei, idx) => (
                <img key={idx} className="image-block" src={ei.dataUrl} alt="extracted" style={{
                  left: ei.region.x * 100 + '%', top: ei.region.y * 100 + '%',
                  width: ei.region.w * 100 + '%', height: ei.region.h * 100 + '%'
                }} />
              ))}
            </div>

            <div className="slide-layer" style={{ zIndex: 4 }} id="textLayer">
              {slide.blocks.map((b, bIdx) => {
                const nLines = Math.max(b.numLines || 1, 1);
                const blockHPx = b.h * vpH;
                const lineHPx = blockHPx / nLines;
                const geoFsPx = Math.max(8, Math.min(48, Math.round(lineHPx / 1.35)));
                const aiFsPx = b.aiFontSize ? Math.round(b.aiFontSize * 1.33) : 0;
                const fsPx = (aiFsPx >= 10 && aiFsPx <= 64) ? aiFsPx : geoFsPx;

                return (
                  <div
                    key={bIdx}
                    data-block-idx={bIdx}
                    className={`text-block ${canDragResize ? 'text-block-draggable' : ''}`}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onInput={(e) => handleTextEdit(currentSlideIdx, bIdx, e.currentTarget.textContent)}
                    onPointerDown={(e) => handleTextBlockPointerDown(e, bIdx)}
                    style={{
                      left: b.x * 100 + '%',
                      top: b.y * 100 + '%',
                      width: b.w * 100 + '%',
                      height: b.h * 100 + '%',
                      fontSize: fsPx + 'px',
                      color: '#' + (b.pixelColor || '000000'),
                      backgroundColor: b.overImage ? 'transparent' : (b.bgColor || '#FFFFFF'),
                      fontWeight: (b.aiBold || (fsPx >= 20 && nLines <= 3)) ? 'bold' : 'normal'
                    }}
                  >
                    {b.text}
                    {canDragResize && <div className="text-block-resize-handle" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="nav-buttons">
            <button className="nav-btn" disabled={currentSlideIdx === 0} onClick={() => setCurrentSlideIdx(currentSlideIdx - 1)}>‹</button>
            <div className="slide-info">{currentSlideIdx + 1} / {allSlides.length}</div>
            <button className="nav-btn" disabled={currentSlideIdx === allSlides.length - 1} onClick={() => setCurrentSlideIdx(currentSlideIdx + 1)}>›</button>
          </div>

          <div className="thumbnails-strip">
            {allSlides.map((s, idx) => (
              <div
                key={idx}
                className={`thumbnail ${idx === currentSlideIdx ? 'active' : ''}`}
                onClick={() => setCurrentSlideIdx(idx)}
              >
                <img src={s.cleanedDataUrl} alt={`Slide ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
