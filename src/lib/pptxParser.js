/**
 * Browser-side PPTX parser. Given a PPTX Blob (e.g. from the LibreOffice
 * service), returns per-slide text blocks in the same shape the editor uses
 * (normalised 0-1 coords, fontSize in pt, bold/italic/align/color).
 *
 * Loads JSZip from CDN at runtime, matching the existing pattern for pdf.js
 * and PptxGenJS — no new npm dependency required.
 *
 * No AI involved: positions, sizes, fonts and colours are extracted from the
 * PPTX XML produced by LibreOffice's native PDF parser. This is the source
 * of truth for raster PDFs (NotebookLM etc.) where pdf.js getTextContent
 * returns nothing.
 */

let jszipPromise = null;
function loadJSZip() {
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.JSZip) {
      resolve(window.JSZip); return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => {
      if (window.JSZip) resolve(window.JSZip);
      else reject(new Error('JSZip failed to load'));
    };
    script.onerror = () => reject(new Error('Could not load JSZip'));
    document.head.appendChild(script);
  });
  return jszipPromise;
}

// PPTX dimensions are in EMUs. 914400 EMUs = 1 inch.
const EMU_PER_INCH = 914400;

function attr(el, name) {
  if (!el) return null;
  const v = el.getAttribute(name);
  return v == null ? null : v;
}

function intAttr(el, name) {
  const v = attr(el, name);
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function localName(el) {
  return el.localName || (el.tagName ? el.tagName.split(':').pop() : '');
}

function findOne(parent, name) {
  if (!parent) return null;
  const stack = [parent];
  while (stack.length) {
    const node = stack.pop();
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i];
      if (localName(c) === name) return c;
      stack.push(c);
    }
  }
  return null;
}

function findAll(parent, name, out) {
  if (!parent) return out || [];
  const result = out || [];
  for (let i = 0; i < parent.children.length; i++) {
    const c = parent.children[i];
    if (localName(c) === name) result.push(c);
    findAll(c, name, result);
  }
  return result;
}

function textOf(el) {
  if (!el) return '';
  return el.textContent || '';
}

// Extract one shape's text-frame info into a normalised text-block.
function shapeToBlock(sp, slideW, slideH) {
  // Position + size (EMU) — read from spPr/xfrm or fall back to inherited values.
  const xfrm = findOne(sp, 'xfrm');
  if (!xfrm) return null;
  const off = findOne(xfrm, 'off');
  const ext = findOne(xfrm, 'ext');
  if (!off || !ext) return null;

  const x = intAttr(off, 'x');
  const y = intAttr(off, 'y');
  const cx = intAttr(ext, 'cx');
  const cy = intAttr(ext, 'cy');
  if (x == null || y == null || cx == null || cy == null) return null;
  if (cx <= 0 || cy <= 0) return null;

  // Concatenate all <a:t> runs inside the txBody, joining paragraphs with \n.
  const txBody = findOne(sp, 'txBody');
  if (!txBody) return null;

  const paragraphs = findAll(txBody, 'p');
  const lines = [];
  let primaryFontPt = null;
  let primaryBold = false;
  let primaryItalic = false;
  let primaryAlign = 'left';
  let primaryColor = null;
  let primaryFont = null;

  for (const p of paragraphs) {
    const runs = findAll(p, 'r');
    let lineText = '';
    for (const r of runs) {
      const rPr = findOne(r, 'rPr');
      const t = findOne(r, 't');
      const txt = textOf(t);
      if (txt) lineText += txt;

      if (rPr && primaryFontPt == null) {
        // sz is in hundredths of a point: 1800 = 18pt.
        const sz = intAttr(rPr, 'sz');
        if (sz != null) primaryFontPt = sz / 100;
        if (attr(rPr, 'b') === '1') primaryBold = true;
        if (attr(rPr, 'i') === '1') primaryItalic = true;
        const fillEl = findOne(rPr, 'solidFill');
        if (fillEl) {
          const srgb = findOne(fillEl, 'srgbClr');
          if (srgb) {
            const v = attr(srgb, 'val');
            if (v && /^[0-9a-fA-F]{6}$/.test(v)) primaryColor = `#${v.toLowerCase()}`;
          }
        }
        const latin = findOne(rPr, 'latin');
        if (latin) primaryFont = attr(latin, 'typeface');
      }
    }
    if (lineText) lines.push(lineText);

    // Paragraph-level pPr for alignment.
    const pPr = findOne(p, 'pPr');
    if (pPr) {
      const algn = attr(pPr, 'algn');
      if (algn === 'ctr') primaryAlign = 'center';
      else if (algn === 'r') primaryAlign = 'right';
      else if (algn === 'just') primaryAlign = 'left';
    }
  }

  const text = lines.join('\n').trim();
  if (!text) return null;

  return {
    text,
    x: x / slideW,
    y: y / slideH,
    w: cx / slideW,
    h: (cy / slideH) / Math.max(1, lines.length), // single-line h (the editor multiplies by line count)
    fontSize: primaryFontPt != null ? Math.round(primaryFontPt) : 16,
    bold: primaryBold,
    italic: primaryItalic,
    align: primaryAlign,
    color: primaryColor || undefined,
    fontFamily: primaryFont || undefined,
  };
}

async function parseSlideXml(xmlText, slideW, slideH) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (!doc || !doc.documentElement) return [];

  const shapes = findAll(doc.documentElement, 'sp');
  const blocks = [];
  for (const sp of shapes) {
    const b = shapeToBlock(sp, slideW, slideH);
    if (b) blocks.push(b);
  }
  return blocks;
}

async function getSlideDimensions(zip) {
  // ppt/presentation.xml contains <p:sldSz cx="..." cy="..."/> in EMUs.
  const presFile = zip.file('ppt/presentation.xml');
  if (!presFile) return { w: 9144000, h: 6858000 }; // 10x7.5in default
  const xml = await presFile.async('string');
  const m = xml.match(/<p:sldSz[^>]+cx="(\d+)"[^>]+cy="(\d+)"/);
  if (m) return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) };
  return { w: 9144000, h: 6858000 };
}

/**
 * Parse a PPTX blob and return per-slide text blocks normalised to 0-1 coords.
 * Returns: [{ blocks: [...] }, ...] in slide order.
 */
export async function parsePptxBlob(blob) {
  const JSZip = await loadJSZip();
  const buf = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const { w: slideW, h: slideH } = await getSlideDimensions(zip);

  // Collect ppt/slides/slide*.xml files in numeric order.
  const slideFiles = [];
  zip.forEach((path, file) => {
    const m = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (m) slideFiles.push({ index: parseInt(m[1], 10), file });
  });
  slideFiles.sort((a, b) => a.index - b.index);

  const slides = [];
  for (const { file } of slideFiles) {
    const xml = await file.async('string');
    const blocks = await parseSlideXml(xml, slideW, slideH);
    slides.push({ blocks });
  }
  return { slides, slideW, slideH };
}
