/**
 * POST /api/analyze
 *
 * Server-side endpoint for analyzing slides with OpenRouter
 * Validates tier, enforces rate limiting, and proxies to OpenRouter
 *
 * Request body:
 * {
 *   image: string (base64 data URL),
 *   model: string,
 *   tier: string (free, pro, enterprise)
 * }
 *
 * Response:
 * {
 *   textBlocks: [...],
 *   shapeBlocks: [...],
 *   imageRegions: [...]
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
  pro: 100,
  enterprise: 1000,
};

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

  if (!body.model) {
    errors.push('Missing required field: model');
  } else if (typeof body.model !== 'string') {
    errors.push('model must be a string');
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
    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { image, model, tier } = body;

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

    // Validate response structure
    if (!validateResponse(response)) {
      console.warn('Invalid response structure from OpenRouter:', response);
      return new Response(
        JSON.stringify({
          error: 'Invalid response from AI model',
          details: 'Response did not match expected structure'
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
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
