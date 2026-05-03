/**
 * POST /api/pdf-to-pptx
 *
 * Proxies a PDF to the LibreOffice headless converter and streams back the PPTX.
 *
 * Env vars (set on Vercel):
 *   LIBREOFFICE_URL    — e.g. https://slideforge-lo.fly.dev
 *   LIBREOFFICE_SECRET — shared secret (matches SHARED_SECRET on the service)
 *
 * Request: multipart/form-data with field "file" = the PDF.
 * Response: application/vnd.openxmlformats-officedocument.presentationml.presentation
 */

import { checkAllowedEmail } from '@/lib/allowedEmails';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(request) {
  const url = process.env.LIBREOFFICE_URL;
  const secret = process.env.LIBREOFFICE_SECRET || '';
  if (!url) {
    return new Response(JSON.stringify({ error: 'LIBREOFFICE_URL not configured on Vercel' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid form data' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = formData.get('email');
  if (typeof email !== 'string' || !email) {
    return new Response(JSON.stringify({ error: 'missing email' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const auth = checkAllowedEmail(email);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'unauthorized email' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ error: 'missing field "file"' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Re-pack as a fresh form for the upstream service.
  const upstreamForm = new FormData();
  upstreamForm.append('file', file, file.name || 'input.pdf');

  const upstream = await fetch(`${url.replace(/\/+$/, '')}/convert`, {
    method: 'POST',
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    body: upstreamForm,
  }).catch(err => ({ ok: false, status: 502, _err: err }));

  if (!upstream.ok) {
    let details = '';
    try { details = await upstream.text(); } catch { /* ignore */ }
    return new Response(JSON.stringify({
      error: 'libreoffice service error',
      status: upstream.status,
      details: details.slice(0, 500),
    }), {
      status: upstream.status === 401 ? 500 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pptx = await upstream.arrayBuffer();
  return new Response(pptx, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="converted.pptx"',
      'Content-Length': String(pptx.byteLength),
    },
  });
}

export async function GET() {
  const url = process.env.LIBREOFFICE_URL;
  return new Response(JSON.stringify({
    configured: Boolean(url),
    url: url ? new URL(url).host : null,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
