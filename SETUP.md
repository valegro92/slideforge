# SlideForge Next.js SaaS - Setup Guide

## Project Overview

SlideForge is a Next.js 14 SaaS application that converts PDF presentations into editable PowerPoint files. It uses OpenRouter's AI Vision models to decompose slides into extractable elements (text blocks, shapes, images).

## Architecture

### Frontend (Client-Side)
- **LandingPage**: Hero, pricing, features, CTA
- **Editor**: Main application interface
  - PDF/image upload
  - Slide preview canvas
  - Element editing (text, shapes)
  - Model selection
  - Export to PPTX

### Backend (Server-Side)
- **API Route** (`/api/analyze`): Validates tier, rate limits, proxies to OpenRouter
- **OpenRouter Client** (`src/lib/openrouter.js`): Handles API calls with exponential backoff retry
- **Tier System** (`src/lib/tiers.js`): Feature gates and rate limiting

### Tier System

```
FREE (tier: 'free')
├─ Max pages: 3
├─ Models: offline (Tesseract OCR only)
├─ Watermark: yes
├─ Price: $0

PRO (tier: 'pro')
├─ Max pages: 50
├─ Models: 4 AI Vision models
├─ Watermark: no
├─ Price: $9.99/month

ENTERPRISE (tier: 'enterprise')
├─ Max pages: 200
├─ Models: All AI Vision models
├─ Watermark: no
├─ Price: $29.99/month
```

## Environment Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- OpenRouter API key (get from https://openrouter.ai)

### Local Development

1. **Clone & install dependencies**
```bash
cd saas
npm install
```

2. **Create `.env.local`** (copy from `.env.example`)
```bash
cp .env.example .env.local
```

3. **Add your OpenRouter API key to `.env.local`**
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

### Vercel (Recommended)

1. **Push to GitHub** (prerequisite)

2. **Import project to Vercel**
   - Go to https://vercel.com/new
   - Select your repository
   - Framework preset: Next.js

3. **Set environment variables**
   - `OPENROUTER_API_KEY`: Your API key
   - `NEXT_PUBLIC_APP_URL`: Your production domain

4. **Deploy**
```bash
vercel deploy
```

### Self-Hosted

```bash
npm run build
npm run start
```

Then use a reverse proxy (nginx, Caddy) in front of Node.

## API Reference

### POST /api/analyze

Analyzes a slide image and extracts text, shapes, and image regions.

**Request**
```json
{
  "image": "data:image/png;base64,...",
  "model": "google/gemini-2.5-flash",
  "tier": "pro"
}
```

**Response**
```json
{
  "textBlocks": [
    {
      "text": "Title text",
      "x": 0.1,
      "y": 0.1,
      "w": 0.8,
      "h": 0.2,
      "fontSize": 32,
      "bold": true
    }
  ],
  "shapeBlocks": [
    {
      "x": 0.05,
      "y": 0.05,
      "w": 0.9,
      "h": 0.9,
      "roundedCorners": false,
      "description": "Background banner"
    }
  ],
  "imageRegions": [
    {
      "x": 0.1,
      "y": 0.3,
      "w": 0.8,
      "h": 0.6
    }
  ]
}
```

**Error Response**
```json
{
  "error": "Rate limit exceeded",
  "details": "Maximum 10 requests per hour for free tier"
}
```

## Tier Feature Gates

### Server-Side Validation

The `/api/analyze` route validates:

1. **Model availability**: Tier can use requested model
2. **Rate limiting**: Requests per hour based on tier
3. **API key**: OpenRouter key is set

### Client-Side Feature Gates

Use the tier context in components:

```javascript
'use client';
import { useTier } from '@/lib/TierContext';
import { canUseModel, hasWatermark } from '@/lib/tiers';

export default function MyComponent() {
  const { tier } = useTier();

  if (hasWatermark(tier)) {
    // Show watermark option
  }

  if (canUseModel(tier, 'google/gemini-2.5-flash')) {
    // Show Gemini model option
  }
}
```

## Rate Limiting

**Free tier**: 10 requests/hour
**Pro tier**: 100 requests/hour
**Enterprise tier**: 1000 requests/hour

Rate limiting is per IP + tier combination. Production should use Redis instead of in-memory Map.

## Available AI Models

All models from OpenRouter are supported:

- `nvidia/nemotron-nano-12b-v2-vl:free` (free)
- `google/gemini-2.5-flash` (premium)
- `qwen/qwen2.5-vl-72b-instruct` (premium)
- `google/gemini-2.0-flash-001` (premium)

Pro and Enterprise tiers can use all models.

## Development Tips

### Adding a new model

1. Update `tiers.js`:
```javascript
export const TIERS = {
  pro: {
    models: [..., 'new-model-name']
  }
}
```

2. The API will automatically validate and allow access

### Debugging OpenRouter calls

Enable debug logging in `openrouter.js`:

```javascript
console.log('OpenRouter request:', { model, imageSize: dataUrl.length });
```

### Testing tier restrictions

Use browser DevTools to set `tier` in localStorage or modify the request.

## File Structure

```
saas/
├── package.json              # Dependencies and scripts
├── next.config.js            # Next.js configuration
├── vercel.json               # Vercel deployment config
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore rules
├── public/
│   └── favicon.svg           # App icon
├── src/
│   ├── app/
│   │   ├── layout.js         # Root layout with TierProvider
│   │   ├── page.js           # Landing page
│   │   ├── globals.css       # Global styles
│   │   ├── app/
│   │   │   └── page.js       # Editor page
│   │   └── api/
│   │       └── analyze/
│   │           └── route.js  # POST /api/analyze endpoint
│   ├── lib/
│   │   ├── tiers.js          # Tier definitions and helpers
│   │   ├── openrouter.js     # OpenRouter client with retry logic
│   │   └── TierContext.js    # React context for tier state
│   └── components/
│       ├── LandingPage.js    # Landing page component (to be implemented)
│       └── Editor.js         # Main editor component (to be implemented)
```

## Next Steps

### For UI Agents
1. Implement `LandingPage` component
   - Integrate pricing tiers from `tiers.js`
   - Add "Get Started" CTA linking to `/app`

2. Implement `Editor` component
   - Integrate file upload
   - Call `/api/analyze` with tier validation
   - Render slide canvas with draggable elements
   - Export to PPTX (use pptxgen via CDN)

### For Infrastructure Agents
1. Set up Redis for production rate limiting
2. Add database for storing user projects
3. Integrate Stripe for payments
4. Add authentication (NextAuth.js or Auth0)
5. Set up monitoring and analytics

## Dependencies

### Core
- `next@14`: React framework
- `react@18`: UI library
- `react-dom@18`: DOM rendering

### Client-Side Libraries (to be installed)
- `pdf.js`: PDF parsing
- `tesseract.js`: Free OCR
- `pptxgen-js`: PPTX export
- `canvas`: Image manipulation

### Production
- `redis`: Rate limiting (when scaling)
- `stripe`: Payment processing

## Security Considerations

1. **API Key**: Stored in server env only, never exposed to client
2. **Rate Limiting**: Prevents abuse, uses IP + tier combo
3. **Input Validation**: Image size, format, tier permissions
4. **CORS**: Allow only your domain via `HTTP-Referer` header
5. **Headers**: Set security headers in `next.config.js`

## Monitoring

### OpenRouter API calls
- Check OpenRouter dashboard for usage
- Monitor `callOpenRouter` error logs
- Implement retry alerts if >3 retries per request

### Rate limiting
- In production: use Redis INFO for capacity monitoring
- Set alerts for >80% usage per tier

## Troubleshooting

### "OpenRouter API key not set"
- Ensure `.env.local` contains `OPENROUTER_API_KEY`
- Restart dev server after adding env variable

### "Rate limit exceeded"
- Check request count in the last hour
- Try again after 1 hour, or upgrade tier

### "AI Vision returned empty response"
- Try a different model
- Ensure image is valid (JPG, PNG, GIF, WebP)
- Check OpenRouter service status

### "Failed to parse JSON response"
- The model returned malformed JSON
- The response is logged (first 300 chars) for debugging
- Falls back to empty blocks structure

## Contact & Support

For issues with:
- **OpenRouter API**: https://openrouter.ai/status
- **Next.js**: https://nextjs.org/docs
- **Vercel Deployment**: https://vercel.com/support
