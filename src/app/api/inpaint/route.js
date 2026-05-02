/**
 * POST /api/inpaint
 *
 * Uses Gemini 2.5 Flash Image (Nano Banana) to erase all text from a slide.
 * Returns the cleaned image as a base64 data URL.
 *
 * Request body: { image: string (base64 data URL) }
 * Response: { cleanedImage: string (base64 data URL) }
 */

import { eraseTextWithAI } from '@/lib/openrouter';
import { checkAllowedEmail } from '@/lib/allowedEmails';

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: API key not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Authorization: ricontrolla l'email contro la whitelist server-side ──
    const auth = checkAllowedEmail(body.email);
    if (!auth.authorized) {
      return new Response(
        JSON.stringify({
          error: 'Accesso riservato agli iscritti de La Cassetta degli AI-trezzi'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.image || !body.image.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid image data URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // mode: 'text' = remove only text, 'all' = remove text + images
    const mode = body.mode === 'all' ? 'all' : 'text';
    const cleanedImage = await eraseTextWithAI(apiKey, body.image, mode);

    return new Response(
      JSON.stringify({ cleanedImage }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Inpaint error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Inpainting failed' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
