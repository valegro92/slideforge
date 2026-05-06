# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
cp .env.example .env.local   # set OPENROUTER_API_KEY before starting
npm run dev                  # http://localhost:3000
npm run build
npm run lint
```

There is no test suite configured.

## Architecture

SlideForge is a **Next.js 14 App Router** SaaS that lets users upload a PDF, run AI Vision to extract text blocks with bounding-box coordinates, edit them in-browser, and export a `.pptx`. All heavy lifting (pdf.js rendering, Canvas inpainting, pptxgenjs export) is client-side.

### Routes

| Route | Purpose |
|---|---|
| `/` | `src/app/page.js` → `LandingPage.jsx` |
| `/app` | `src/app/app/page.js` → `EditorLayout` (auth gate) wrapping `Editor.jsx` |
| `POST /api/analyze` | Server proxy to OpenRouter vision models; re-validates email server-side |
| `POST /api/auth/check-email` | Email whitelist lookup (hardcoded → Supabase → env var) |
| `POST /api/pdf-to-pptx` | Proxies PDF to the LibreOffice microservice |
| `POST /api/lo-token` | Returns LibreOffice endpoint + bearer token so the client can call it directly |

### Auth & Access Control

Access is restricted to a hardcoded email whitelist in `src/lib/allowedEmails.js` — this is the **source of truth**. The lookup order for `/api/auth/check-email` is:

1. `src/lib/allowedEmails.js` (primary, always checked)
2. Supabase `subscribers` table (if `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set)
3. `ALLOWED_EMAILS` env var (CSV fallback)

Client-side session (email + tier) is stored in `localStorage` under the key `slideforge_auth` via `TierContext`. **The client-side tier is not trusted for authorization** — every `/api/analyze` request re-checks the email against the server-side whitelist.

To add/remove a user: edit `ALLOWED_EMAILS` in `src/lib/allowedEmails.js` and push (Vercel rebuilds automatically). The `admin` tier alias resolves to `enterprise` via `resolveTier()` in `src/lib/tiers.js`.

### AI Pipeline (`src/lib/openrouter.js`)

`callOpenRouter(apiKey, model, dataUrl)` builds a fallback chain: the requested model first, then 5 free vision models in order. It skips to the next model on 400/403/429/5xx — only a 401 (bad API key) is non-retryable. Each model call has a 25 s timeout; the serverless function is capped at 60 s (`export const maxDuration = 60`).

The response is a JSON object `{ bgColor: "#RRGGBB", textBlocks: [...] }` where each block carries fractional coordinates (0.0–1.0 of image dimensions). `validateResponse()` normalizes and clamps all values before they reach the client.

Rate limiting is **in-memory per serverless instance** (not Redis): pro = 200 req/hr, enterprise = 1000 req/hr, keyed by `IP:tier`.

### LibreOffice Microservice (`libreoffice-service/`)

A separate Express service that converts PDF → PPTX via `libreoffice --headless`. It runs as a standalone container (e.g., Fly.io) and is called via `/api/pdf-to-pptx` (server proxy) or directly by the client after obtaining credentials from `/api/lo-token`. Protected by `SHARED_SECRET` (Bearer token). 25 MB upload cap, 90 s conversion timeout.

## Environment Variables

| Variable | Scope | Required |
|---|---|---|
| `OPENROUTER_API_KEY` | server | yes |
| `NEXT_PUBLIC_APP_URL` | client+server | recommended (used in OpenRouter `HTTP-Referer`) |
| `LIBREOFFICE_URL` | server | for PDF→PPTX conversion |
| `LIBREOFFICE_SECRET` | server | matches `SHARED_SECRET` on the LibreOffice service |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | optional |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | optional; enables Supabase auth path |
| `ALLOWED_EMAILS` | server | optional CSV fallback |

On Vercel, enable env vars for both **Production** and **Preview** environments.
