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
import { canUseModel, getMaxPages } from '@/lib/tiers';

// Simple in-memory rate limiting (use Redis in production)
const requestCounts = new Map();

/**
 * Rate limit by tier (requests per hour)
 */
const RATE_LIMITS = {
  free: 10,
  pro: 200,
  enterprise: 1000,
};

const DEFAULT_MODELS = {
  pro: 'google/gemini-2.5-flash',
  enterprise: 'google/gemini-2.5-flash',
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

  if (!body.tier) {
    errors.push('Missing required field: tier');
  } else if (!['free', 'pro', 'enterprise'].includes(body.tier)) {
    errors.push('Invalid tier: must be free, pro, or enterprise');
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
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: OpenRouter API key not set'
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

    const { image, tier } = body;
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
    console.error('Unexpected error in /api/analyze:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
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
