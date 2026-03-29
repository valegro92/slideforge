/**
 * Supabase client utilities for SlideForge
 *
 * Exports two clients:
 * - `supabase`      — anon/public client, safe for browser and server-side reads
 * - `supabaseAdmin` — service-role client, SERVER-SIDE ONLY
 *                     Never import this in client components or expose to the browser.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Public Supabase client using the anon key.
 * Safe for use in browser components and server-side code that respects Row Level Security.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Admin Supabase client using the service role key.
 *
 * IMPORTANT: Use only in server-side code (API routes, Server Actions, etc.).
 * This key bypasses Row Level Security — never expose it to the client.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          // Disable automatic token refresh — service role doesn't need it
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

/**
 * Check whether Supabase is fully configured (both URL and anon key present).
 * Useful for graceful fallback logic in API routes.
 *
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Check whether the admin client is available (service role key present).
 *
 * @returns {boolean}
 */
export function isSupabaseAdminConfigured() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
