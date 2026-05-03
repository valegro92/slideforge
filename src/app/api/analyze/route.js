/**
 * POST /api/analyze
 *
 * Server-side endpoint for analyzing slides with OpenRouter
 * Validates tier, enforces rate limiting, and proxies to OpenRouter
 *
 * Request body:
 * {
 *   image: string (base64 data URL),
 *   model?: string (optional — server auto-selects if omitted),
 *   tier: string (free, pro, enterprise)
 * }
 *
 * Response:
 * {
 *   textBlocks: [...],
 *   imageRegions?: [...]
 * }
 */

import { callOpenRouter, validateResponse } from '@/lib/openrouter';
import { canUseModel, getMaxPages, resolveTier } from '@/lib/tiers';
import { checkAllowedEmail } from '@/lib/allowedEmails';

// Simple in-memory rate limiting (use Redis in production)
const requestCounts = new Map();

/**
 * Rate limit by tier (requests per hour)
 */
const RATE_LIMITS = {
  pro: 200,
  enterprise: 1000,
};

const DEFAULT_MODELS = {
  pro: 'nvidia/nemotron-nano-12b-v2-vl:free',
  enterprise: 'nvidia/nemotron-nano-12b-v2-vl:free',
};

function getModelForTier(tier) {
  return DEFAULT_MODELS[tier] || null;
}

/**
 * Check if request is rate limited
 * @param {string} identifier - IP or user ID
 * @param {string} tier - User tier
 * @returns {boolean}
 */
function isRateLimited(identifier, tier) {
  const now = Date.now();
  const hourAgo = now - 3600000;

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }

  const requests = requestCounts.get(identifier);
  const recentRequests = requests.filter(t => t > hourAgo);
  requestCounts.set(identifier, recentRequests);

  const limit = RATE_LIMITS[tier] || 10;
  return recentRequests.length >= limit;
}

/**
 * Record a request for rate limiting
 * @param {string} identifier - IP or user ID
 */
function recordRequest(identifier) {
  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }
  requestCounts.get(identifier).push(Date.now());
}

/**
 * Get client IP from request
 */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Validate request body
 */
function validateRequest(body) {
  const errors = [];

  if (!body.image) {
    errors.push('Missing required field: image');
  } else if (typeof body.image !== 'string') {
    errors.push('image must be a string (base64 data URL)');
  } else if (!body.image.startsWith('data:image/')) {
    errors.push('image must be a valid base64 data URL');
  }

  if (body.model && typeof body.model !== 'string') {
    errors.push('model must be a string if provided');
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.push('Missing required field: email');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Handle POST request
 */
export async function POST(request) {
  try {
    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[/api/analyze] OPENROUTER_API_KEY missing in env. Configure it on Vercel for the Preview/Production environment in use.');
      return new Response(
        JSON.stringify({
          error: 'OPENROUTER_API_KEY non configurata su Vercel per questo environment (Preview/Production).'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request
    const requestValidation = validateRequest(body);
    if (!requestValidation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: requestValidation.errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { image } = body;

    // ── Authorization: ricontrolla l'email contro la whitelist server-side ──
    // Il tier client-side non e' affidabile (localStorage falsificabile),
    // quindi la fonte di verita' e' sempre la whitelist hardcoded.
    const auth = checkAllowedEmail(body.email);
    if (!auth.authorized) {
      return new Response(
        JSON.stringify({
          error: 'Accesso riservato agli iscritti de La Cassetta degli AI-trezzi'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const tier = resolveTier(auth.tier);

    const model = body.model || getModelForTier(tier);

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'No AI model available for this tier' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check tier permissions
    if (!canUseModel(tier, model)) {
      return new Response(
        JSON.stringify({
          error: `Model "${model}" is not available on the ${tier} tier`
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitKey = `${clientIp}:${tier}`;

    if (isRateLimited(rateLimitKey, tier)) {
      const limit = RATE_LIMITS[tier];
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          details: `Maximum ${limit} requests per hour for ${tier} tier`
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          }
        }
      );
    }

    // Record this request
    recordRequest(rateLimitKey);

    // Call OpenRouter
    let response;
    try {
      response = await callOpenRouter(apiKey, model, image);
    } catch (error) {
      console.error('OpenRouter error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to analyze image',
          details: error.message.substring(0, 200)
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate and normalize response structure
    const validation = validateResponse(response);

    if (!validation.valid) {
      console.error(
        '[/api/analyze] Response failed validation. Reasons:',
        validation.warnings,
        '\nRaw response (first 500 chars):',
        JSON.stringify(response).substring(0, 500)
      );
      return new Response(
        JSON.stringify({
          error: 'Invalid response from AI model',
          details: validation.warnings.join('; '),
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log any non-fatal warnings (e.g. dropped blocks, defaulted arrays)
    if (validation.warnings.length > 0) {
      console.warn('[/api/analyze] Response normalized with warnings:', validation.warnings);
    }

    // Success — same image always produces the same result, safe to cache
    return new Response(
      JSON.stringify(validation.normalized),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache for 1 hour in the browser; CDN/proxy may also cache
          'Cache-Control': 'private, max-age=3600',
        },
      }
    );

  } catch (error) {
    console.error('[/api/analyze] Unexpected error:', error?.stack || error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: (error && (error.message || String(error))).slice(0, 300),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Reject other HTTP methods
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      error: 'Method not allowed. Use POST to /api/analyze'
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
