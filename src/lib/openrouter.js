/**
 * OpenRouter client for SlideForge — "Grab Text" approach
 *
 * Sends a slide image to an AI Vision model and gets back the text blocks
 * with their positions. No shapes, no image regions — just text extraction,
 * like Canva's "Image to Text" feature.
 */

const SLIDE_PROMPT = `You are a precision OCR engine for presentation slides. Your ONLY task: find every piece of readable text in this slide image and return its exact position and content.

COORDINATE SYSTEM — all values are fractions of image dimensions (0.0 to 1.0):
- "x": left edge ÷ image width
- "y": top edge ÷ image height
- "w": text width ÷ image width
- "h": text height ÷ image height

Return a JSON object with TWO arrays: "textBlocks" and "imageRegions".

Each imageRegion (photos, charts, diagrams, logos, icons, infographics — any visual that is NOT plain text):
{
  "x": 0.0-1.0,
  "y": 0.0-1.0,
  "w": 0.0-1.0,
  "h": 0.0-1.0,
  "type": "photo" | "chart" | "diagram" | "icon" | "logo" | "infographic"
}

RULES for imageRegions:
- Include the FULL bounding box including legends, axes, labels that are part of the image.
- Each distinct visual gets its own region.
- Do NOT include text-only areas as images.
- For background images spanning the full slide, include as one region covering the full area.

Each textBlock:
{
  "text": "exact verbatim text (preserve line breaks as \\n)",
  "x": 0.0-1.0,
  "y": 0.0-1.0,
  "w": 0.0-1.0,
  "h": 0.0-1.0,
  "fontSize": estimated point size (integer, 8-48),
  "bold": true/false,
  "align": "left" | "center" | "right",
  "color": "#RRGGBB hex color of the text (e.g. #1A2B3C)",
  "fontFamily": "closest Google Font or web-safe font name (e.g. Roboto, Open Sans, Montserrat, Arial, Georgia)"
}

RULES:
1. Extract ALL readable text: titles, subtitles, body text, bullet points, captions, footnotes, labels, numbers, dates.
2. Create SEPARATE textBlocks for each visually distinct text group:
   - Slide title = one block
   - Subtitle = separate block
   - Each bullet group = one block (bullets joined with \\n)
   - Caption/footnote = separate block
   - Text in a colored bar/banner = separate block
3. INCLUDE text that overlays colored shapes, banners, or images — it's still editable text.
4. EXCLUDE text that is PART of a chart axis, diagram label, infographic number, map label, or logo. These are baked into the image.
5. EXCLUDE watermarks, "NotebookLM", "Google" branding.
6. Bounding boxes must be TIGHT — wrap the text closely, no excess padding.
7. fontSize hints: slide titles ~32-40pt, body/bullets ~16-20pt, captions ~10-14pt.
8. Return ONLY the JSON object. No markdown fences, no explanation.`;

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 20000;

/**
 * Call OpenRouter API with retry logic
 * @param {string} apiKey
 * @param {string} model
 * @param {string} dataUrl - base64 image data URL
 * @returns {Promise<{textBlocks: Array}>}
 */
export async function callOpenRouter(apiKey, model, dataUrl) {
  if (!apiKey) throw new Error('OpenRouter API key not provided');
  if (!model) throw new Error('Model not specified');
  if (!dataUrl) throw new Error('Image data URL not provided');

  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt - 1), MAX_DELAY);
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }],
          temperature: 0.05,
          max_tokens: 4096,
        })
      });

      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`Rate limited (${response.status})`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) throw new Error('OpenRouter returned empty response');

      return parseJsonResponse(responseText);

    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }
    }
  }

  throw lastError || new Error('OpenRouter call failed');
}

/**
 * Parse JSON from AI response — handles markdown fences, truncation, etc.
 * @param {string} text
 * @returns {{textBlocks: Array}}
 */
function parseJsonResponse(text) {
  const EMPTY = { textBlocks: [] };
  if (!text || typeof text !== 'string') return EMPTY;

  // Strip markdown fences
  let cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```[\s\S]*$/i, '')
    .trim();

  if (cleaned === text.trim()) cleaned = text.trim();

  // Extract outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Fix common issues
  cleaned = cleaned
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to recover truncated JSON
    let fixed = cleaned.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');
    const openB = (fixed.match(/\[/g) || []).length - (fixed.match(/\]/g) || []).length;
    const openC = (fixed.match(/\{/g) || []).length - (fixed.match(/\}/g) || []).length;
    for (let i = 0; i < openB; i++) fixed += ']';
    for (let i = 0; i < openC; i++) fixed += '}';
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');

    try {
      parsed = JSON.parse(fixed);
    } catch {
      console.warn('Failed to parse AI response:', cleaned.substring(0, 300));
      return EMPTY;
    }
  }

  // Normalize — only care about textBlocks
  if (!Array.isArray(parsed.textBlocks)) parsed.textBlocks = [];

  const clamp = (v) => typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;

  parsed.textBlocks = parsed.textBlocks
    .filter(b => b && typeof b.text === 'string' && b.text.trim().length > 0)
    .map(b => ({
      text: b.text.trim(),
      x: clamp(b.x),
      y: clamp(b.y),
      w: Math.max(0.02, clamp(b.w)),
      h: Math.max(0.01, clamp(b.h)),
      fontSize: typeof b.fontSize === 'number' && b.fontSize >= 6 && b.fontSize <= 72
        ? Math.round(b.fontSize) : 16,
      bold: !!b.bold,
      align: ['left', 'center', 'right'].includes(b.align) ? b.align : 'left',
      color: typeof b.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(b.color) ? b.color : null,
      fontFamily: typeof b.fontFamily === 'string' && b.fontFamily.trim() ? b.fontFamily.trim() : null,
    }));

  if (!Array.isArray(parsed.imageRegions)) parsed.imageRegions = [];

  parsed.imageRegions = parsed.imageRegions
    .filter(b => b && typeof b.x === 'number')
    .map(b => ({
      x: clamp(b.x),
      y: clamp(b.y),
      w: Math.max(0.02, clamp(b.w)),
      h: Math.max(0.02, clamp(b.h)),
      type: b.type || 'photo',
    }));

  return { textBlocks: parsed.textBlocks, imageRegions: parsed.imageRegions };
}

/**
 * Validate response structure
 * @param {object} response
 * @returns {{ valid: boolean, normalized: object|null, warnings: string[] }}
 */
export function validateResponse(response) {
  const warnings = [];

  if (!response || typeof response !== 'object') {
    return { valid: false, normalized: null, warnings: ['Response is not an object'] };
  }

  if (!Array.isArray(response.textBlocks)) {
    return { valid: false, normalized: null, warnings: ['textBlocks missing or not an array'] };
  }

  const textBlocks = response.textBlocks.filter((b, i) => {
    const ok = typeof b.text === 'string' && typeof b.x === 'number' &&
      typeof b.y === 'number' && typeof b.w === 'number' && typeof b.h === 'number';
    if (!ok) warnings.push(`textBlocks[${i}] dropped — invalid fields`);
    return ok;
  });

  const imageRegions = Array.isArray(response.imageRegions)
    ? response.imageRegions.filter((b, i) => {
        const ok = typeof b.x === 'number' && typeof b.y === 'number' &&
          typeof b.w === 'number' && typeof b.h === 'number';
        if (!ok) warnings.push(`imageRegions[${i}] dropped — invalid fields`);
        return ok;
      })
    : [];

  return { valid: true, normalized: { textBlocks, imageRegions }, warnings };
}

/**
 * Use Gemini 2.5 Flash Image (Nano Banana) to erase all text from a slide.
 * Sends the slide image with a prompt to remove text and reconstruct the background.
 * Returns a base64 data URL of the cleaned image.
 *
 * @param {string} apiKey - OpenRouter API key
 * @param {string} dataUrl - base64 image data URL of the slide
 * @returns {Promise<string>} - base64 data URL of the cleaned image
 */
export async function eraseTextWithAI(apiKey, dataUrl) {
  if (!apiKey) throw new Error('OpenRouter API key not provided');
  if (!dataUrl) throw new Error('Image data URL not provided');

  const INPAINT_PROMPT = `Remove ALL text AND all visual elements (charts, graphs, diagrams, icons, logos, infographics, photos) from this presentation slide image.
Erase everything and reconstruct the background behind it seamlessly — keep only the background color, gradients, and decorative patterns.
The result should be a clean empty slide background with no text, no images, no charts, no icons — just the underlying background.
Return ONLY the cleaned image, no text response.`;

  let lastError = null;
  let data = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt - 1), MAX_DELAY);
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://slideforge.app',
          'X-Title': 'SlideForge',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          modalities: ['image', 'text'],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: INPAINT_PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }],
          temperature: 0.2,
        })
      });

      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`Rate limited (${response.status})`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI inpainting error (${response.status}): ${errorText.substring(0, 300)}`);
      }

      data = await response.json();
      break;

    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Inpainting failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }
    }
  }

  if (!data) throw lastError || new Error('AI inpainting failed');
  const msg = data.choices?.[0]?.message;

  // OpenRouter returns images as base64 data URLs in various locations
  // 1. In message.images array (Gemini image models with modalities=["image","text"])
  if (Array.isArray(msg?.images) && msg.images.length > 0) {
    const img = msg.images[0];
    if (typeof img === 'string') return img;
    if (img?.image_url?.url) return img.image_url.url;
    if (img?.url) return img.url;
  }

  // 2. In content as string (direct base64)
  if (typeof msg?.content === 'string' && msg.content.startsWith('data:image/')) {
    return msg.content;
  }

  // 3. In content as array of parts
  if (Array.isArray(msg?.content)) {
    for (const part of msg.content) {
      if (part.type === 'image_url' && part.image_url?.url) return part.image_url.url;
      if (typeof part === 'string' && part.startsWith('data:image/')) return part;
    }
  }

  // 4. Check data.images directly (some providers)
  if (Array.isArray(data.images) && data.images.length > 0) {
    return data.images[0];
  }

  console.error('[inpaint] No image found. Full response:', JSON.stringify(data).substring(0, 800));
  throw new Error('AI inpainting returned no image');
}
