/**
 * OpenRouter client for SlideForge
 * Estrae OGNI testo da un'immagine di slide, senza esclusioni.
 */

const SLIDE_PROMPT = `Sei un OCR di precisione per slide di presentazione. UNICO compito: trovare OGNI singola scritta leggibile nell'immagine e restituirne posizione e contenuto.

CRITICO — ESTRAI TUTTO:
- Titoli, sottotitoli, paragrafi, elenchi puntati, numeri, date, etichette, didascalie, note, pulsanti, banner.
- Anche testo dentro icone, bottoni colorati, badge, riquadri decorati, banner: ESTRAILO comunque.
- Anche numeri singoli, sigle, simboli accanto al testo: vanno estratti.
- Non escludere NIENTE che sia leggibile come testo. Eccezione unica: il logo "NotebookLM" e watermark in basso a destra.

COORDINATE — frazioni delle dimensioni dell'immagine (0.0-1.0):
- "x": bordo sinistro / larghezza immagine
- "y": bordo superiore / altezza immagine
- "w": larghezza testo / larghezza immagine
- "h": altezza testo / altezza immagine

Restituisci JSON con due campi: "bgColor" (colore di sfondo dominante della slide come "#RRGGBB") e "textBlocks" (array).

Ogni textBlock:
{
  "text": "testo verbatim, accenti e maiuscole come nell'immagine, '\\n' per andare a capo",
  "x": 0.0-1.0,
  "y": 0.0-1.0,
  "w": 0.0-1.0,
  "h": 0.0-1.0,
  "fontSize": dimensione stimata in punti (intero 8-48),
  "bold": true|false,
  "align": "left"|"center"|"right",
  "color": "#RRGGBB del colore del testo",
  "fontFamily": "Arial"|"Roboto"|"Open Sans"|"Montserrat"|"Georgia"
}

REGOLE:
1. Crea un textBlock SEPARATO per ogni gruppo di testo visivamente distinto.
2. Bounding box stretti: avvolgi il testo da vicino.
3. fontSize: titoli ~28-40pt, corpo ~14-20pt, didascalie ~10-12pt.
4. Restituisci SOLO il JSON. Niente markdown fences, niente spiegazioni.`;

const PER_REQUEST_TIMEOUT_MS = 25000;

// Fallback chain of free vision models, tried in order.
// nemotron first — confirmed working; others as backup.
const FALLBACK_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-4-maverick:free',
  'qwen/qwen2.5-vl-72b-instruct:free',
];

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callSingleModel(apiKey, model, dataUrl) {
  const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://slideforge.app',
      'X-Title': 'SlideForge',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: SLIDE_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
      temperature: 0.05,
      max_tokens: 4000,
    }),
  }, PER_REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const err = new Error(`OpenRouter ${response.status}: ${errorText.substring(0, 200)}`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return parseJsonResponse(content);
}

export async function callOpenRouter(apiKey, model, dataUrl) {
  if (!apiKey) throw new Error('OpenRouter API key not provided');
  if (!dataUrl) throw new Error('Image data URL not provided');

  // Build fallback chain: requested model first, then defaults (deduped).
  const chain = [];
  if (model) chain.push(model);
  for (const m of FALLBACK_MODELS) if (!chain.includes(m)) chain.push(m);

  let lastError = null;
  for (let i = 0; i < chain.length; i++) {
    const m = chain[i];
    try {
      const result = await callSingleModel(apiKey, m, dataUrl);
      // Need at least some text blocks; otherwise try the next model.
      if (Array.isArray(result.textBlocks) && result.textBlocks.length > 0) {
        return result;
      }
      lastError = new Error(`Model ${m} returned no text blocks`);
    } catch (e) {
      lastError = e;
      const status = e.status || 0;
      // Only a hard 401 (invalid API key) is non-retryable.
      // 400/403 = model not available for this key → try next model.
      // 429/5xx/AbortError → transient, try next model.
      if (status === 401) throw e;
    }
  }
  throw lastError || new Error('All OpenRouter models failed');
}

function parseJsonResponse(text) {
  if (!text || typeof text !== 'string') return { textBlocks: [] };
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```\s*$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  cleaned = cleaned
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    let fixed = cleaned;
    const openB = (fixed.match(/\[/g) || []).length - (fixed.match(/\]/g) || []).length;
    const openC = (fixed.match(/\{/g) || []).length - (fixed.match(/\}/g) || []).length;
    for (let i = 0; i < openB; i++) fixed += ']';
    for (let i = 0; i < openC; i++) fixed += '}';
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    try {
      parsed = JSON.parse(fixed);
    } catch {
      console.warn('Failed to parse AI response:', cleaned.substring(0, 300));
      return { textBlocks: [] };
    }
  }

  if (!Array.isArray(parsed.textBlocks)) parsed.textBlocks = [];
  if (typeof parsed.bgColor !== 'string') parsed.bgColor = '';
  return parsed;
}

export function validateResponse(response) {
  if (!response || typeof response !== 'object') {
    return { valid: false, warnings: ['Response is not an object'], normalized: { textBlocks: [] } };
  }
  let textBlocks = Array.isArray(response.textBlocks) ? response.textBlocks : [];

  const clamp = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  };

  textBlocks = textBlocks
    .filter(tb => tb && typeof tb.text === 'string' && tb.text.trim().length > 0)
    .map(tb => ({
      text: String(tb.text),
      x: clamp(tb.x),
      y: clamp(tb.y),
      w: Math.max(0.02, clamp(tb.w)),
      h: Math.max(0.01, clamp(tb.h)),
      fontSize: typeof tb.fontSize === 'number' && tb.fontSize >= 6 && tb.fontSize <= 72
        ? Math.round(tb.fontSize) : 16,
      bold: tb.bold === true,
      align: ['left', 'center', 'right'].includes(tb.align) ? tb.align : 'left',
      color: typeof tb.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(tb.color) ? tb.color : '#222222',
      fontFamily: typeof tb.fontFamily === 'string' && tb.fontFamily.trim()
        ? tb.fontFamily.trim() : 'Arial',
    }));

  const bgColor = typeof response.bgColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(response.bgColor)
    ? response.bgColor : '';

  return {
    valid: true,
    warnings: [],
    normalized: { textBlocks, imageRegions: [], bgColor },
  };
}
