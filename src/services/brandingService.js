/**
 * Saved PDF branding logo: one private object per signed-in user.
 *
 *   bucket: pdf-logos (private)      path: <user_id>/logo.png
 *
 * Access control is enforced by Row Level Security on storage.objects (see
 * supabase/migrations/004_pdf_logo_storage.sql). This module only ever talks to
 * Supabase with the anon key plus the signed-in user's own session; there is no
 * service-role credential in the browser. It reads and writes nothing in localStorage.
 *
 * Everything here returns raw bytes or throws a BrandingError. Re-validating a
 * downloaded logo is the caller's job (see normalizeStoredLogo in utils/logoUtils).
 */

import { supabase } from '../lib/supabase';
import { LOGO_MAX_STORED_BYTES } from '../utils/logoUtils';

export const LOGO_BUCKET = 'pdf-logos';

// Supabase user ids are UUIDs. Anything else (slashes, dots, spaces) is rejected before a
// path is built, so a path can never address another folder.
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * code: invalid_user | too_large | unauthorized | unavailable | network
 *       | load_failed | save_failed | remove_failed
 */
export class BrandingError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'BrandingError';
    this.code = code;
    this.cause = cause;
  }
}

export function logoPath(userId) {
  if (typeof userId !== 'string' || !USER_ID_PATTERN.test(userId)) {
    throw new BrandingError('invalid_user', 'A signed-in user is required.');
  }
  return `${userId}/logo.png`;
}

// Turn a storage SDK error into a BrandingError with a stable code.
function classify(error, fallbackCode, fallbackMessage) {
  const status = typeof error?.status === 'number' ? error.status : undefined;
  if (status === 401 || status === 403) {
    return new BrandingError('unauthorized', 'You need to be signed in to do that.', error);
  }
  if (status === 413) {
    return new BrandingError('too_large', 'That logo is too large to store.', error);
  }
  if (status === undefined) {
    // fetch itself failed (offline, DNS, CORS): the SDK wraps it without an HTTP status
    return new BrandingError('network', 'The server could not be reached.', error);
  }
  if (status === 400 || status === 404) {
    // On write operations these mean the bucket is missing or rejected the request,
    // i.e. saved logos are not available in this environment.
    return new BrandingError('unavailable', 'Saved logos are not available right now.', error);
  }
  return new BrandingError(fallbackCode, fallbackMessage, error);
}

/**
 * Download the user's saved logo.
 * Returns a Blob, or null when no logo is saved (the SDK reports a missing object as
 * HTTP 400/404, the same mapping its own exists() uses). Any other failure throws.
 */
export async function getSavedLogo(userId) {
  const path = logoPath(userId);
  const { data, error } = await supabase.storage
    .from(LOGO_BUCKET)
    .download(path, {}, { cache: 'no-store' }); // never serve a stale copy after replace/remove
  if (error) {
    if (error.status === 400 || error.status === 404) return null;
    throw classify(error, 'load_failed', 'Could not load your saved logo.');
  }
  return data ?? null;
}

/**
 * Save (or replace) the user's logo. `blob` must be the normalized PNG, typed image/png:
 * for Blob bodies the SDK sends the Blob's own type as the Content-Type, and the bucket
 * only accepts image/png. Writes only to <userId>/logo.png; RLS rejects any other path.
 */
export async function saveLogo(userId, blob) {
  const path = logoPath(userId);
  if (!(blob instanceof Blob) || blob.type !== 'image/png') {
    throw new BrandingError('save_failed', 'Only PNG logos can be saved.');
  }
  if (blob.size > LOGO_MAX_STORED_BYTES) {
    throw new BrandingError('too_large', 'That logo is too detailed to save.');
  }
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, blob, { upsert: true, cacheControl: '0' });
  if (error) throw classify(error, 'save_failed', 'Could not save your logo.');
}

/**
 * Delete the user's saved logo. RLS can hide an object without raising an error, in which
 * case remove() returns an empty list, so an empty result is confirmed with exists()
 * before it is reported as success.
 */
export async function removeSavedLogo(userId) {
  const path = logoPath(userId);
  const store = supabase.storage.from(LOGO_BUCKET);
  const { data, error } = await store.remove([path]);
  if (error) throw classify(error, 'remove_failed', 'Could not remove your saved logo.');
  if (Array.isArray(data) && data.length > 0) return;

  const { data: stillThere, error: existsError } = await store.exists(path);
  if (stillThere === true) {
    throw new BrandingError('remove_failed', 'Your saved logo could not be removed.');
  }
  if (existsError && existsError.status !== 400 && existsError.status !== 404) {
    throw classify(existsError, 'remove_failed', 'Could not confirm the logo was removed.');
  }
}
