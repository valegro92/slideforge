# SlideForge

Trasforma PDF (es. esportati da NotebookLM) in presentazioni PowerPoint **editabili** usando AI Vision.

## Come funziona

1. Carichi un PDF
2. Click su **Rendi modificabile** (singola slide) o **Rendi tutte modificabili** (intero file)
3. L'AI analizza ogni pagina e separa testi/immagini; un canvas locale "pulisce" lo sfondo dietro al testo originale
4. Modifichi i blocchi di testo direttamente nel browser
5. Esporti in `.pptx` (singola slide o intero file)

## Accesso

L'app è riservata agli iscritti a **La Cassetta degli AI-trezzi** (Officina). I pagamenti sono gestiti esternamente; la lista delle email autorizzate è in `src/lib/allowedEmails.js`.

## Stack

- **Next.js 14** (App Router) + React 18
- **OpenRouter** (Gemini 2.5 Flash, Qwen2.5 VL, ecc.) per l'analisi AI delle slide
- **Canvas API** per l'inpainting client-side (zero costi, deterministico)
- **pdf.js** per il rendering PDF
- **pptxgen-js** per la generazione PPTX
- **Vercel** per l'hosting

## Sviluppo locale

```bash
npm install
cp .env.example .env.local   # aggiungi OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000
```

## Variabili ambiente

| Variabile | Scope | Note |
|---|---|---|
| `OPENROUTER_API_KEY` | server | obbligatoria per `/api/analyze` |
| `NEXT_PUBLIC_APP_URL` | client | usata negli header HTTP-Referer di OpenRouter |
| `ALLOWED_EMAILS` | server | opzionale, fallback alla whitelist hardcoded (CSV) |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | server | opzionali, fallback per `/api/auth/check-email` |

Su Vercel ricordati di abilitare le env per **Production e Preview**.

## Struttura

```
src/
├── app/
│   ├── page.js                  # landing
│   ├── app/page.js              # editor (gate auth)
│   └── api/
│       ├── analyze/             # POST: AI Vision detection
│       └── auth/check-email/    # POST: whitelist check
├── components/
│   ├── LandingPage.jsx
│   ├── EditorLayout.jsx         # gate bloccante + nav
│   ├── Editor.jsx               # editor + clientSideInpaint
│   └── LoginModal.jsx
└── lib/
    ├── allowedEmails.js         # whitelist Officina
    ├── openrouter.js            # client OpenRouter
    ├── tiers.js                 # config pro/enterprise
    ├── TierContext.js           # auth state (localStorage)
    └── supabase.js              # opzionale, fallback
```

## Aggiungere/rimuovere un utente

Edita `src/lib/allowedEmails.js`:

```js
export const ALLOWED_EMAILS = {
  'nuova.email@example.com': 'pro',
  // ...
};
```

Commit e push → Vercel rebuilda automaticamente.

## Sicurezza

- L'email viene rivalidata server-side a ogni richiesta `/api/analyze` (il tier client è solo UI)
- API key OpenRouter solo lato server
- Rate limiting in-memory per IP + tier
- Security headers (X-Frame, XSS, ecc.) in `next.config.js`

## Comandi

```bash
npm run dev      # dev server
npm run build    # build production
npm run start    # serve build
npm run lint     # ESLint
```
