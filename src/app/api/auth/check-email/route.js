/**
 * POST /api/auth/check-email
 *
 * Checks whether an email address is authorized to access SlideForge.
 *
 * Primary path: queries the `slideforge_subscribers` table in Supabase.
 * Fallback path: if Supabase is not configured, checks against the
 *   ALLOWED_EMAILS environment variable (comma-separated list).
 *
 * Request body:
 * { email: string }
 *
 * Response (authorized):
 * { authorized: true, tier: string, email: string }
 *
 * Response (not authorized):
 * { authorized: false, tier: 'free' }
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// CORS headers — applied to every response
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ---------------------------------------------------------------------------
// In-memory rate limiting — 10 requests per minute per IP
// ---------------------------------------------------------------------------

/** @type {Map<string, number[]>} Maps IP → array of request timestamps (ms) */
const emailCheckCounts = new Map();

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

/**
 * Returns true if the given IP has exceeded the rate limit.
 * Also prunes stale timestamps as a side-effect.
 *
 * @param {string} ip
 * @returns {boolean}
 */
function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (!emailCheckCounts.has(ip)) {
    emailCheckCounts.set(ip, []);
  }

  const timestamps = emailCheckCounts
    .get(ip)
    .filter(t => t > windowStart); // prune old entries

  emailCheckCounts.set(ip, timestamps);

  return timestamps.length >= RATE_LIMIT_MAX;
}

/**
 * Records a request timestamp for the given IP.
 *
 * @param {string} ip
 */
function recordRequest(ip) {
  if (!emailCheckCounts.has(ip)) {
    emailCheckCounts.set(ip, []);
  }
  emailCheckCounts.get(ip).push(Date.now());
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the client IP from the request headers.
 *
 * @param {Request} request
 * @returns {string}
 */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Validates that a string looks like an email address.
 * Intentionally lenient — full RFC validation happens at the DB level.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Builds a NextResponse with CORS headers already attached.
 *
 * @param {object} body
 * @param {number} status
 * @returns {NextResponse}
 */
function respond(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// Fallback: ALLOWED_EMAILS environment variable
// ---------------------------------------------------------------------------

/**
 * Parses the ALLOWED_EMAILS env var into a normalized Set.
 *
 * @returns {Set<string>}
 */
function getAllowedEmailsFromEnv() {
  const raw = process.env.ALLOWED_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Checks the ALLOWED_EMAILS fallback list.
 *
 * @param {string} normalizedEmail
 * @returns {{ authorized: boolean, tier: string, email?: string }}
 */
function checkFallbackList(normalizedEmail) {
  const allowed = getAllowedEmailsFromEnv();

  if (allowed.has(normalizedEmail)) {
    return { authorized: true, tier: 'pro', email: normalizedEmail };
  }

  return { authorized: false, tier: 'free' };
}

// ---------------------------------------------------------------------------
// Supabase lookup
// ---------------------------------------------------------------------------

/**
 * Queries `slideforge_subscribers` for the given email where active = true.
 *
 * @param {string} normalizedEmail
 * @returns {Promise<{ authorized: boolean, tier: string, email?: string }>}
 */
async function checkSupabase(normalizedEmail) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('email, tier')
    .eq('email', normalizedEmail)
    .eq('active', true)
    .maybeSingle(); // returns null (not error) when no row matches

  if (error) {
    // Re-throw so the caller can handle/log it
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  if (data) {
    return { authorized: true, tier: data.tier, email: data.email };
  }

  return { authorized: false, tier: 'free' };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * Handles CORS preflight requests.
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * POST /api/auth/check-email
 */
export async function POST(request) {
  // --- Rate limiting ---
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp)) {
    return respond(
      {
        error: 'Too many requests',
        details: `Maximum ${RATE_LIMIT_MAX} email checks per minute`,
      },
      429
    );
  }

  recordRequest(clientIp);

  // --- Parse body ---
  let body;
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'Invalid JSON in request body' }, 400);
  }

  // --- Validate & normalize email ---
  const rawEmail = body?.email;

  if (!rawEmail) {
    return respond({ error: 'Missing required field: email' }, 400);
  }

  const normalizedEmail = String(rawEmail).toLowerCase().trim();

  if (!isValidEmail(normalizedEmail)) {
    return respond({ error: 'Invalid email address' }, 400);
  }

  // --- Primary path: Supabase ---
  if (isSupabaseConfigured()) {
    try {
      const result = await checkSupabase(normalizedEmail);
      return respond(result);
    } catch (error) {
      console.error('check-email: Supabase error:', error.message);
      // Fall through to fallback rather than returning 500,
      // so the app stays functional even when the DB is temporarily unavailable.
    }
  }

  // --- Fallback path: ALLOWED_EMAILS env var ---
  const result = checkFallbackList(normalizedEmail);
  return respond(result);
}

/**
 * Reject all other HTTP methods.
 */
export async function GET() {
  return respond(
    { error: 'Method not allowed. Use POST to /api/auth/check-email' },
    405
  );
}
