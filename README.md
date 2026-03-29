# SlideForge - AI-Powered Presentation Converter

Convert rasterized PDFs and images into editable PowerPoint presentations using AI Vision.

## Quick Links

- **Setup Guide**: [SETUP.md](SETUP.md) - How to run locally and deploy
- **Project Structure**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Detailed architecture
- **API Integration**: [API_INTEGRATION.md](API_INTEGRATION.md) - How to use the API in components

## Quick Start

```bash
# Install
cd saas
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key

# Run locally
npm run dev
```

Visit `http://localhost:3000`

## Features

### Free Tier ($0)
- 3 pages per PDF
- Offline OCR (Tesseract.js)
- Watermarked export
- 10 requests/hour

### Pro Tier ($9.99/month)
- 50 pages per PDF
- 4 AI Vision models
- No watermark
- 100 requests/hour

### Enterprise ($29.99/month)
- 200 pages per PDF
- All AI Vision models
- REST API access
- 1000 requests/hour

## Core Technologies

- **Framework**: Next.js 14 (App Router)
- **Runtime**: React 18
- **AI**: OpenRouter (multiple vision models)
- **OCR**: Tesseract.js (free tier fallback)
- **Export**: pptxgen-js (PPTX generation)
- **PDF**: pdf.js (PDF parsing)
- **Deployment**: Vercel

## Project Structure

```
saas/
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout + TierProvider
│   │   ├── page.js            # Landing page
│   │   ├── globals.css        # Global styles
│   │   ├── app/
│   │   │   └── page.js        # Editor page
│   │   └── api/
│   │       └── analyze/
│   │           └── route.js   # POST /api/analyze
│   ├── lib/
│   │   ├── tiers.js           # Tier definitions
│   │   ├── openrouter.js      # OpenRouter client
│   │   └── TierContext.js     # Tier context provider
│   └── components/
│       ├── LandingPage.js     # Landing (to implement)
│       └── Editor.js          # Main editor (to implement)
├── public/
│   └── favicon.svg            # App icon
├── package.json               # Dependencies
├── next.config.js             # Next.js config
├── vercel.json                # Vercel config
└── .env.example               # Environment template
```

## API Endpoint

### POST /api/analyze

Analyzes a slide image and extracts elements.

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
  "textBlocks": [...],
  "shapeBlocks": [...],
  "imageRegions": [...]
}
```

See [API_INTEGRATION.md](API_INTEGRATION.md) for complete documentation.

## Tier System

### Permissions
- **canUseModel(tier, model)**: Check if tier can use a model
- **getMaxPages(tier)**: Get page limit for tier
- **hasWatermark(tier)**: Check if watermark required
- **getAvailableModels(tier)**: List available models

### Usage in Components
```javascript
'use client';
import { useTier } from '@/lib/TierContext';
import { canUseModel } from '@/lib/tiers';

export default function MyComponent() {
  const { tier } = useTier();
  
  if (!canUseModel(tier, 'google/gemini-2.5-flash')) {
    return <p>Upgrade to Pro to use this model</p>;
  }
  
  return <div>Model available</div>;
}
```

## Development

### Environment Variables
Create `.env.local` from `.env.example`:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Testing Locally

Use the browser console to test the API:

```javascript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: 'data:image/png;base64,...',
    model: 'google/gemini-2.5-flash',
    tier: 'pro'
  })
});

console.log(await response.json());
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Set environment variables:
   - `OPENROUTER_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Deploy automatically on push

See [SETUP.md](SETUP.md) for detailed instructions.

## Components to Implement

### LandingPage Component
- Hero section
- Feature highlights
- Pricing tiers (from `tiers.js`)
- FAQ section
- Call to action

### Editor Component
- File upload
- PDF/image preview
- Slide selector
- Model selector
- Text editor (drag, resize)
- Shape editor
- Export to PPTX
- Progress indicators

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md#next-steps) for more details.

## Security

- OpenRouter API key stored server-side only
- Tier-based permission validation
- Rate limiting per IP + tier
- Input validation for all requests
- Security headers configured

## Performance

- Automatic code splitting with Next.js
- 60-second API timeout for AI processing
- ~20 KB core bundle (minified/gzipped)
- Lazy-load heavy libraries (Tesseract, pptxgen)

## Roadmap

- [x] Next.js project setup
- [x] Tier system
- [x] API route for analysis
- [x] OpenRouter client with retry
- [ ] UI components (LandingPage, Editor)
- [ ] Authentication
- [ ] Stripe integration
- [ ] Database for projects
- [ ] Redis for rate limiting
- [ ] Batch processing
- [ ] Usage analytics

## Troubleshooting

### "OpenRouter API key not set"
- Ensure `.env.local` contains `OPENROUTER_API_KEY`
- Restart dev server

### "Rate limit exceeded"
- Free tier: 10 requests/hour
- Pro tier: 100 requests/hour
- Enterprise: 1000 requests/hour
- Wait or upgrade tier

### "Model not available"
- Check tier supports the model
- Free tier only supports Tesseract

See [SETUP.md](SETUP.md#troubleshooting) for more.

## Documentation

- **[SETUP.md](SETUP.md)** - Local setup, deployment, environment
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Architecture, file structure, integrations
- **[API_INTEGRATION.md](API_INTEGRATION.md)** - API usage, examples, parsing results

## Contact

- OpenRouter Status: https://status.openrouter.io
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs

## License

Proprietary - SlideForge
