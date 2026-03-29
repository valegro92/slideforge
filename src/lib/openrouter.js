/**
 * Server-side OpenRouter client with retry logic
 * Handles API calls to OpenRouter for AI Vision analysis
 */

const SLIDE_PROMPT = `You are converting a rasterized presentation slide into separate editable elements for PowerPoint.

Your job: decompose this slide image into 3 types of elements.

Return a JSON object with THREE arrays:

1. "textBlocks": ONLY text that sits on solid-color backgrounds (titles, body text, bullet points, captions, footnotes).
   For each:
   - "text": exact text content (preserve line breaks as \\n)
   - "x": left position as fraction of image width (0.0 to 1.0)
   - "y": top position as fraction of image height (0.0 to 1.0)
   - "w": width as fraction
   - "h": height as fraction
   - "fontSize": estimated font size in points (8-48)
   - "bold": true if text appears bold

   CRITICAL: Do NOT include text that is part of an image, chart, map, diagram, logo, or infographic.
   Examples of text to EXCLUDE from textBlocks:
   - City names on a map (Foggia, Bari, Lecce, etc.)
   - Numbers/percentages on a pie chart or bar chart
   - Labels inside diagrams or flowcharts
   - Text inside logos or icons
   This text belongs to the image and will be captured as part of the imageRegion.

2. "shapeBlocks": colored rectangles, bars, banners, containers — solid-color geometric areas.
   For each:
   - "x", "y", "w", "h": position as fractions
   - "roundedCorners": true if rounded
   - "description": brief label

3. "imageRegions": photos, charts, maps, logos, icons, diagrams, infographics — any visual element that is NOT plain text on a solid background.
   For each:
   - "x", "y", "w", "h": position as fractions
   IMPORTANT: Include the FULL bounding box of each image/chart/map, including any labels or legends that are part of it.

Rules:
- Be PRECISE with positions — bounding boxes must tightly fit each element
- Group related lines into one textBlock (e.g., a title with subtitle = one block)
- Do NOT include the main slide background as a shape
- Do NOT include watermarks or "NotebookLM" text
- Do NOT include a "color" field — colors are computed from pixels

Return ONLY valid JSON, no markdown, no explanation.`;

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // ms
const MAX_DELAY = 20000; // ms

/**
 * Call OpenRouter API with exponential backoff retry logic
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model identifier
 * @param {string} dataUrl - Base64 data URL of the image
 * @returns {Promise<object>} Parsed JSON response with textBlocks, shapeBlocks, imageRegions
 * @throws {Error} If all retries fail
 */
export async function callOpenRouter(apiKey, model, dataUrl) {
  if (!apiKey) {
    throw new Error('OpenRouter API key not provided');
  }
  if (!model) {
    throw new Error('Model not specified');
  }
  if (!dataUrl) {
    throw new Error('Image data URL not provided');
  }

  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Exponential backoff delay before retry (except first attempt)
    if (attempt > 0) {
      const delay = Math.min(
        INITIAL_DELAY * Math.pow(2, attempt - 1),
        MAX_DELAY
      );
      console.log(`Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
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
          temperature: 0.1,
          max_tokens: 4096,
        })
      });

      // Handle rate limiting and service unavailable
      if (response.status === 429 || response.status === 503) {
        const retryAfter = response.headers.get('retry-after');
        lastError = new Error(
          `Rate limited (${response.status})${retryAfter ? ` - retry after ${retryAfter}s` : ''}`
        );
        console.warn(lastError.message);
        continue; // retry
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenRouter API error (${response.status}): ${errorText.substring(0, 200)}`
        );
      }

      // Parse response
      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        throw new Error('OpenRouter returned empty response');
      }

      // Parse JSON from response with robust extraction
      const parsed = parseJsonResponse(responseText);
      return parsed;

    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.message);

      // Don't retry on last attempt
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(
          `Failed after ${MAX_RETRIES} attempts: ${lastError.message}`
        );
      }
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('OpenRouter call failed');
}

/**
 * Robustly parse JSON from API response
 * Handles markdown blocks, extra text, malformed JSON
 * @param {string} text - Response text from API
 * @returns {object} Parsed JSON with textBlocks, shapeBlocks, imageRegions
 */
function parseJsonResponse(text) {
  if (!text) {
    return { textBlocks: [], shapeBlocks: [], imageRegions: [] };
  }

  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Extract JSON object if there's extra text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.textBlocks) parsed.textBlocks = [];
    if (!parsed.shapeBlocks) parsed.shapeBlocks = [];
    if (!parsed.imageRegions) parsed.imageRegions = [];

    return parsed;
  } catch (parseError) {
    console.warn(
      'Failed to parse JSON response. Raw (first 300 chars):',
      cleaned.substring(0, 300)
    );
    // Return safe default
    return { textBlocks: [], shapeBlocks: [], imageRegions: [] };
  }
}

/**
 * Validate that response has expected structure
 * @param {object} response - Response from callOpenRouter
 * @returns {boolean}
 */
export function validateResponse(response) {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const hasRequiredArrays =
    Array.isArray(response.textBlocks) &&
    Array.isArray(response.shapeBlocks) &&
    Array.isArray(response.imageRegions);

  if (!hasRequiredArrays) {
    return false;
  }

  // Basic validation of text blocks
  for (const block of response.textBlocks) {
    if (
      typeof block.text !== 'string' ||
      typeof block.x !== 'number' ||
      typeof block.y !== 'number' ||
      typeof block.w !== 'number' ||
      typeof block.h !== 'number'
    ) {
      return false;
    }
  }

  // Basic validation of image regions
  for (const region of response.imageRegions) {
    if (
      typeof region.x !== 'number' ||
      typeof region.y !== 'number' ||
      typeof region.w !== 'number' ||
      typeof region.h !== 'number'
    ) {
      return false;
    }
  }

  return true;
}
