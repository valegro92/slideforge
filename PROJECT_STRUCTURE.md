# SlideForge Project Structure

## Complete Implementation Summary

### Root Configuration Files

**`package.json`**
- Next.js 14, React 18 dependencies
- Scripts: dev, build, start, lint
- No extra dependencies for MVP (Tesseract, PDF.js, pptxgen loaded via CDN)

**`next.config.js`**
- React strict mode enabled
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- 50MB API response limit for large images
- Auto-minification (swcMinify)

**`vercel.json`**
- Framework preset: nextjs
- API routes timeout: 60s (for AI processing)
- Environment variables configured
- Region: iad1 (US East)

**`.env.example`**
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=https://slideforge.app
```

**`.gitignore`**
- Standard Next.js ignores
- Environment files (.env, .env.local)
- Node modules, OS files

---

## Source Code Structure

### `src/app/` - Next.js App Router

**`layout.js`** - Root Layout
- Imports global CSS
- Wraps with TierProvider
- Sets metadata (title, description, OG tags)
- Configures viewport
- Sets dark theme color (#292524)
- Language: Italian (`lang="it"`)

**`globals.css`** - Global Styles
- DM Sans + JetBrains Mono fonts from Google
- Dark theme: #292524 background, #fafaf9 text
- Smooth scroll behavior
- Emerald selection color (#2DD4A8)
- Custom scrollbar styling
- Full viewport height

**`page.js`** - Landing Page
- Simple import of LandingPage component
- To be implemented with: pricing tiers, hero, features, CTA

**`app/page.js`** - Editor Page
- Wraps Editor in EditorLayout (to be implemented)
- Metadata for editor page
- To be implemented with: canvas, controls, export

**`api/analyze/route.js`** - AI Analysis Endpoint
- POST /api/analyze
- Validates request: image, model, tier
- Tier permission checks
- Rate limiting (free: 10/hr, pro: 100/hr, enterprise: 1000/hr)
- Proxies to OpenRouter with error handling
- Returns: textBlocks, shapeBlocks, imageRegions

### `src/lib/` - Shared Utilities

**`tiers.js`** - Tier System
Exports:
- `TIERS`: Configuration object with free, pro, enterprise
- `canUseTier(tier, feature)`: Check feature access
- `getMaxPages(tier)`: Max slides per PDF
- `canUseModel(tier, model)`: Model access validation
- `hasWatermark(tier)`: Watermark requirement
- `getTierConfig(tier)`: Full config object
- `getAvailableModels(tier)`: List of AI models
- `getAllTiers()`: All tier definitions

Tier Details:
```
free: 3 pages, offline (Tesseract), watermark, $0
pro: 50 pages, 4 AI models, no watermark, $9.99/mo
enterprise: 200 pages, all models, API access, $29.99/mo
```

**`openrouter.js`** - OpenRouter Client
Exports:
- `callOpenRouter(apiKey, model, dataUrl)`: Make API call with retry
- `validateResponse(response)`: Validate response structure
- `SLIDE_PROMPT`: System prompt for slide decomposition

Features:
- Exponential backoff retry (3 attempts, max 20s delay)
- Handles 429 (rate limit) and 503 (unavailable)
- Robust JSON parsing (handles markdown, extra text)
- Validates response structure
- Returns safe defaults on parse failure
- Logs errors for debugging

**`TierContext.js`** - React Context for Tier
Exports:
- `TierProvider`: Context provider component
- `useTier()`: Hook to access tier state

Usage:
```javascript
'use client';
import { useTier } from '@/lib/TierContext';

const { tier, setTier } = useTier();
```

### `src/components/` - React Components

**`LandingPage.js`** - To Be Implemented
Should include:
- Hero section with value proposition
- Feature comparison table
- Pricing tiers (from tiers.js)
- FAQ section
- CTA buttons linking to /app

**`Editor.js`** - To Be Implemented
Should include:
- File upload area
- PDF/image preview
- Slide selector
- Model selector
- Text editor (click to edit, drag to move)
- Shape editor
- Image editor
- Export to PPTX
- Progress indicators
- Error messages

Optional: **`EditorLayout.js`** - To Be Implemented
- Header with logo, back button
- Sidebar with controls
- Main editor canvas area
- Status bar

### `public/` - Static Assets

**`favicon.svg`** - App Icon
- Minimal SVG design
- 4-color abstract slide representation

---

## AI Pipeline (From Original HTML)

### SLIDE_PROMPT
Instructs OpenRouter models to decompose a slide into:
1. **textBlocks**: Text on solid backgrounds (position, size, content)
2. **shapeBlocks**: Colored rectangles, banners (position, rounded corners)
3. **imageRegions**: Photos, charts, logos, diagrams (position only)

### Request Flow
1. Client uploads PDF/image
2. Extract slide canvas
3. Convert to base64 data URL
4. Send to POST /api/analyze with model + tier
5. Server validates tier permissions
6. Server checks rate limit
7. Server calls OpenRouter with SLIDE_PROMPT
8. OpenRouter returns JSON with decomposed elements
9. Client renders interactive canvas
10. User edits, then exports to PPTX

### Fallback: Tesseract OCR
For free tier or model failures:
- Use Tesseract.js (client-side)
- Provides text positions and content
- No styling information
- Works offline

### Export: PPTX Generation
Using pptxgen-js:
- Create slides from canvas layout
- Add textBlocks with formatting
- Add shapeBlocks with colors
- Add imageRegions with cropped images
- Optional watermark for free tier
- Download as .pptx file

---

## Rate Limiting Strategy

### In-Memory (Current)
- Maps IP:tier combinations to request timestamps
- Purges entries older than 1 hour
- Simple but doesn't persist across server restarts

### Production (To Implement)
- Redis with INCR + EXPIRE
- Atomic operations for accuracy
- Survives deployments
- Scales across multiple instances

---

## Tier Feature Gates

### Free ($0)
- 3 pages max per PDF
- Offline OCR only (Tesseract)
- Watermark on export
- Rate: 10 req/hr

### Pro ($9.99/mo)
- 50 pages max per PDF
- 4 AI Vision models
- No watermark
- Drag & resize elements
- Rate: 100 req/hr

### Enterprise ($29.99/mo)
- 200 pages max per PDF
- All AI Vision models
- Custom branding
- API REST access
- Batch processing
- Priority support
- Rate: 1000 req/hr

---

## Security

### API Key Management
- OpenRouter key stored in `OPENROUTER_API_KEY` env variable
- Never exposed to client
- Server-side proxying via /api/analyze

### Input Validation
- Image format validation (data URL check)
- Model name validation against tier
- Tier name validation (free/pro/enterprise)
- Image size limits (50MB max)

### Rate Limiting
- Per IP + tier combination
- Prevents abuse and costs
- 429 Retry-After header

### Headers & Security
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Cache-Control: no-store (for API responses)

---

## Deployment Checklist

- [ ] Set `OPENROUTER_API_KEY` in production env
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Update `HTTP-Referer` header if needed (now uses NEXT_PUBLIC_APP_URL)
- [ ] Configure custom domain on Vercel
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set up monitoring/alerts for API usage
- [ ] Configure Redis for rate limiting (when scaling)
- [ ] Add authentication (when charging for Pro/Enterprise)
- [ ] Set up Stripe for payments
- [ ] Add database for user projects
- [ ] Configure analytics/telemetry
- [ ] Review security headers in next.config.js

---

## Integration Points for Other Agents

### UI/Components Agent
1. Implement LandingPage with pricing and hero
2. Implement Editor with canvas and controls
3. Optional: EditorLayout for structure
4. Use `useTier()` hook for feature gates
5. Call `/api/analyze` endpoint
6. Integrate Tesseract.js for OCR
7. Integrate pptxgen-js for export

### Backend/Infrastructure Agent
1. Add database (Prisma + PostgreSQL/MongoDB)
2. Add authentication (NextAuth.js or Auth0)
3. Add Stripe integration for payments
4. Implement Redis for rate limiting
5. Add project storage and history
6. Set up monitoring (Sentry, DataDog)
7. Configure CDN caching
8. Add email notifications

### DevOps Agent
1. Configure Vercel deployment
2. Set up GitHub Actions for CI/CD
3. Add pre-deployment tests
4. Configure staging environment
5. Set up log aggregation
6. Configure alerting thresholds
7. Plan disaster recovery

---

## Performance Notes

### Optimizations Included
- Next.js 14 automatic code splitting
- Image optimization (via Next.js Image component)
- API route timeout: 60s (enough for AI processing)
- No unnecessary dependencies

### Potential Improvements
- Cache AI responses (per image hash)
- Compress PDF before sending to AI
- WebWorker for Tesseract.js
- Lazy load pptxgen-js
- Implement analytics sampling

---

## Browser Compatibility

### Required Features
- Fetch API
- Canvas API (for image manipulation)
- FileReader API (for file uploads)
- Base64 encoding/decoding
- ES6+ (const, async/await, spread operator)

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## File Sizes (Approximate)

```
openrouter.js     ~4 KB
tiers.js          ~3 KB
TierContext.js    ~0.5 KB
api/analyze/route.js  ~7 KB
layout.js         ~2 KB
globals.css       ~2 KB
next.config.js    ~2 KB

Total core: ~20 KB (minified/gzipped)
```

---

## Testing Strategy

### Unit Tests
- `tiers.js`: Tier permission logic
- `openrouter.js`: JSON parsing, retry logic

### Integration Tests
- `/api/analyze`: Rate limiting, tier validation
- Client → API → OpenRouter flow

### E2E Tests
- Upload PDF → Select model → Export PPTX
- Test each tier (free, pro, enterprise)
- Test fallback to Tesseract

---

## Known Limitations

1. **In-memory rate limiting**: Resets on server restart
2. **Single-server only**: Multiple instances need Redis
3. **No authentication**: Any user can use the API
4. **No usage tracking**: Can't bill users
5. **No project persistence**: Exports only, no save/load
6. **Free OCR quality**: Tesseract less accurate than AI

---

## Next Steps

1. **Immediate**: Implement UI components (LandingPage, Editor)
2. **Short-term**: Add authentication and Stripe integration
3. **Medium-term**: Add database for project storage
4. **Long-term**: Add batch processing, API keys, analytics

---

## Contact Points

- **OpenRouter Status**: https://status.openrouter.io
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **React Hooks**: https://react.dev/reference/react/hooks
