import { checkAllowedEmail } from '@/lib/allowedEmails';

export const runtime = 'nodejs';

export async function POST(request) {
  const url = process.env.LIBREOFFICE_URL;
  const secret = process.env.LIBREOFFICE_SECRET || '';
  if (!url) {
    return new Response(JSON.stringify({ error: 'not configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = body?.email;
  if (typeof email !== 'string' || !email) {
    return new Response(JSON.stringify({ error: 'missing email' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = checkAllowedEmail(email);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    endpoint: `${url.replace(/\/+$/, '')}/convert`,
    token: secret,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
