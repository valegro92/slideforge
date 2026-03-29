# API Integration Guide for SlideForge

This document provides guidance for integrating the `/api/analyze` endpoint and tier system into the UI components.

## Quick Start: Using the API

### From a Client Component

```javascript
'use client';

import { useState } from 'react';
import { useTier } from '@/lib/TierContext';
import { canUseModel } from '@/lib/tiers';

export default function SlideAnalyzer() {
  const { tier } = useTier();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function analyzeSlide(imageDataUrl, model) {
    // Validate tier permissions
    if (!canUseModel(tier, model)) {
      setError(`${model} not available on ${tier} tier`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          model,
          tier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    // Your component JSX here
    // Call analyzeSlide() on image upload
  );
}
```

---

## Request Format

```javascript
POST /api/analyze

Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "model": "google/gemini-2.5-flash",
  "tier": "pro"
}
```

### Required Fields
- **image**: Base64 data URL (e.g., from `canvas.toDataURL()` or `FileReader`)
- **model**: Model name string (e.g., "google/gemini-2.5-flash")
- **tier**: Tier string ("free", "pro", or "enterprise")

### Response Format (Success)

```javascript
{
  "textBlocks": [
    {
      "text": "Title Text",
      "x": 0.1,           // left as fraction (0.0-1.0)
      "y": 0.05,          // top as fraction
      "w": 0.8,           // width as fraction
      "h": 0.15,          // height as fraction
      "fontSize": 28,     // estimated size in points
      "bold": true
    },
    {
      "text": "Body text\non multiple lines",
      "x": 0.1,
      "y": 0.25,
      "w": 0.8,
      "h": 0.4,
      "fontSize": 12,
      "bold": false
    }
  ],
  "shapeBlocks": [
    {
      "x": 0.0,
      "y": 0.0,
      "w": 1.0,
      "h": 0.2,
      "roundedCorners": false,
      "description": "Blue header bar"
    }
  ],
  "imageRegions": [
    {
      "x": 0.15,
      "y": 0.3,
      "w": 0.7,
      "h": 0.6
    }
  ]
}
```

### Error Responses

**400 Bad Request** - Invalid input
```javascript
{
  "error": "Validation failed",
  "details": [
    "image must be a valid base64 data URL",
    "Invalid tier: must be free, pro, or enterprise"
  ]
}
```

**403 Forbidden** - Tier doesn't allow this model
```javascript
{
  "error": "Model \"google/gemini-2.5-flash\" is not available on the free tier"
}
```

**429 Too Many Requests** - Rate limit exceeded
```javascript
{
  "error": "Rate limit exceeded",
  "details": "Maximum 10 requests per hour for free tier"
}
```

**503 Service Unavailable** - OpenRouter error
```javascript
{
  "error": "Failed to analyze image",
  "details": "Rate limited (429)"
}
```

---

## Converting Canvas to Data URL

### From HTML Canvas Element

```javascript
function getCanvasAsDataUrl(canvas) {
  return canvas.toDataURL('image/png');
}

// Usage:
const canvas = document.getElementById('myCanvas');
const dataUrl = getCanvasAsDataUrl(canvas);
await analyzeSlide(dataUrl, 'google/gemini-2.5-flash');
```

### From File Input

```javascript
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Usage:
const file = inputElement.files[0];
const dataUrl = await fileToDataUrl(file);
await analyzeSlide(dataUrl, 'google/gemini-2.5-flash');
```

### From PDF Page (using pdf.js)

```javascript
async function pdfPageToDataUrl(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: canvas.getContext('2d'),
    viewport
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL('image/png');
}
```

---

## Parsing Results in the Editor

### Rendering Text Blocks

```javascript
function renderTextBlocks(canvas, textBlocks, canvasWidth, canvasHeight) {
  const ctx = canvas.getContext('2d');

  for (const block of textBlocks) {
    const x = block.x * canvasWidth;
    const y = block.y * canvasHeight;
    const w = block.w * canvasWidth;
    const h = block.h * canvasHeight;

    // Draw bounding box
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Set text properties
    ctx.font = `${block.bold ? 'bold ' : ''}${block.fontSize}px Arial`;
    ctx.fillStyle = '#000000';

    // Draw text (basic; real implementation should handle line breaks)
    ctx.fillText(block.text.split('\n')[0], x + 4, y + block.fontSize);

    // Store reference for editing
    block.canvasX = x;
    block.canvasY = y;
    block.canvasW = w;
    block.canvasH = h;
  }
}
```

### Making Text Editable

```javascript
function makeTextBlockEditable(block, onUpdate) {
  const input = document.createElement('textarea');
  input.value = block.text;
  input.style.position = 'absolute';
  input.style.left = block.canvasX + 'px';
  input.style.top = block.canvasY + 'px';
  input.style.width = block.canvasW + 'px';
  input.style.height = block.canvasH + 'px';

  input.addEventListener('change', (e) => {
    block.text = e.target.value;
    onUpdate(block);
  });

  document.body.appendChild(input);
  input.focus();
}
```

### Dragging Elements

```javascript
function makeElementDraggable(element, onDrag) {
  let startX, startY;

  element.addEventListener('mousedown', (e) => {
    startX = e.clientX - element.offsetLeft;
    startY = e.clientY - element.offsetTop;

    function handleMouseMove(moveEvent) {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;

      // Update normalized position (0.0-1.0)
      const parentRect = element.parentElement.getBoundingClientRect();
      const x = newX / parentRect.width;
      const y = newY / parentRect.height;

      onDrag({ x, y });
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
}
```

---

## Using Tier Gates in Components

### Check Model Availability

```javascript
import { canUseModel, getAvailableModels } from '@/lib/tiers';

function ModelSelector({ tier }) {
  const models = getAvailableModels(tier);

  return (
    <select>
      {models.map(model => (
        <option key={model} value={model}>
          {model}
        </option>
      ))}
    </select>
  );
}
```

### Show Feature Based on Tier

```javascript
import { useTier } from '@/lib/TierContext';
import { hasWatermark } from '@/lib/tiers';

export default function ExportButton() {
  const { tier } = useTier();

  return (
    <button>
      {hasWatermark(tier) ? 'Export (with watermark)' : 'Export'}
    </button>
  );
}
```

### Enforce Page Limits

```javascript
import { useTier } from '@/lib/TierContext';
import { getMaxPages } from '@/lib/tiers';

function PdfUpload() {
  const { tier } = useTier();
  const maxPages = getMaxPages(tier);

  async function handlePdfUpload(file) {
    const pdf = await pdfjsLib.getDocument(file).promise;
    if (pdf.numPages > maxPages) {
      alert(`This tier allows max ${maxPages} pages. Your PDF has ${pdf.numPages} pages.`);
      return;
    }
    // Continue with analysis
  }
}
```

---

## Error Handling Best Practices

```javascript
async function analyzeWithErrorHandling(imageUrl, model, tier) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageUrl, model, tier })
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Handle specific error cases
      if (response.status === 429) {
        return {
          error: 'Rate limited',
          message: `Too many requests. ${errorData.details}`,
          retryAfter: response.headers.get('Retry-After')
        };
      }

      if (response.status === 403) {
        return {
          error: 'Tier error',
          message: errorData.error,
          suggestion: 'Upgrade your tier to use this model'
        };
      }

      return {
        error: 'Analysis failed',
        message: errorData.details || errorData.error
      };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    return {
      error: 'Network error',
      message: error.message,
      suggestion: 'Check your connection and try again'
    };
  }
}
```

---

## Testing the API Locally

### Using cURL

```bash
# 1. Create a simple test image (1px PNG)
curl -s https://example.com/test.png > test.png

# 2. Convert to base64
BASE64=$(base64 -i test.png)

# 3. Call API
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"data:image/png;base64,$BASE64\",
    \"model\": \"google/gemini-2.5-flash\",
    \"tier\": \"pro\"
  }"
```

### Using JavaScript in Browser Console

```javascript
// 1. Create a canvas
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 300;
const ctx = canvas.getContext('2d');

// 2. Draw something
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 500, 300);
ctx.fillStyle = 'black';
ctx.font = '24px Arial';
ctx.fillText('Test Slide', 50, 50);

// 3. Get data URL
const imageUrl = canvas.toDataURL('image/png');

// 4. Call API
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: imageUrl,
    model: 'google/gemini-2.5-flash',
    tier: 'pro'
  })
});

console.log(await response.json());
```

---

## Rate Limiting Behavior

### Free Tier
- 10 requests per hour
- Shared pool across all free users (same IP)
- 429 response when exceeded
- Wait 1 hour to reset

### Pro Tier
- 100 requests per hour
- Per-IP rate limit
- 429 response when exceeded

### Enterprise
- 1000 requests per hour
- Per-IP rate limit
- 429 response when exceeded

### Strategy
- Cache results when possible
- Batch multiple slides in one request (future feature)
- Show remaining quota to users
- Implement client-side debouncing

---

## Fallback to Tesseract (Free Tier)

When OpenRouter is unavailable or rate limited, use Tesseract.js:

```javascript
import Tesseract from 'tesseract.js';

async function fallbackToTesseract(imageUrl) {
  const result = await Tesseract.recognize(
    imageUrl,
    'eng',
    {
      logger: m => console.log('Tesseract:', m)
    }
  );

  // Parse Tesseract output into compatible format
  return {
    textBlocks: parseOCRResults(result.data),
    shapeBlocks: [],
    imageRegions: []
  };
}

function parseOCRResults(ocrData) {
  // Convert OCR output to textBlocks format
  const blocks = [];
  for (const word of ocrData.words) {
    blocks.push({
      text: word.text,
      x: word.bbox.x0 / ocrData.width,
      y: word.bbox.y0 / ocrData.height,
      w: (word.bbox.x1 - word.bbox.x0) / ocrData.width,
      h: (word.bbox.y1 - word.bbox.y0) / ocrData.height,
      fontSize: 12, // Tesseract doesn't provide this
      bold: word.is_bold || false
    });
  }
  return blocks;
}
```

---

## Next Steps

1. **Implement Editor component** using this guide
2. **Add Tesseract fallback** for robustness
3. **Integrate pptxgen** for export
4. **Add progress tracking** during analysis
5. **Implement caching** for repeated slides
6. **Add analytics** to track model performance

---

## Support

For issues:
- Check `OPENROUTER_API_KEY` is set in `.env.local`
- Verify model name is correct (check openrouter.ai)
- Check rate limit status in error response
- See logs in browser DevTools Console tab
- Test with `curl` to isolate frontend vs backend
