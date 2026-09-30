// Preta context delivery — COOKIE mode (data-ctx-cookie).
// Mirrors Step 4b of the dashboard onboarding guide.
//
// The token is signed by OUR BACKEND, not here and not by Next.js. `/auth/login` and
// `/auth/signup` already return it as `preta_token`, and `/users/preta-token` re-issues it
// (see saas-backend/src/routes/auth.js and users.js). That is Step 4a, and it was already
// done — so the only missing piece was writing what the backend hands back into a cookie
// on OUR domain, which is what this file does.
//
// Why the backend and not a cookie set by the API directly: the API lives on
// *.onrender.com and the site on *.vercel.app. A cookie set by the API would land on the
// API's domain, where the script running on this site cannot read it. So the token comes
// back in the response body and the browser writes it here instead.

export const PRETA_COOKIE = "preta_ctx";

// The cookie lives exactly as long as the TOKEN INSIDE IT, read from the token's own `exp`.
//
// It used to be a hardcoded 900 seconds, matching the backend's `expiresIn: '15m'` by hand. Two
// numbers for one lifetime is a bug waiting to happen in either direction: raise the backend's TTL
// and the cookie is thrown away while its token is still good (the visitor goes anonymous and the
// personalised elements vanish); lower it and the cookie outlives its token, handing the edge
// something it must reject. Reading the token means the backend is the only place the session
// length is decided — change `expiresIn` there and this follows on its own.
const FALLBACK_MAX_AGE_SECONDS = 900;

// A token with under a minute left is not worth storing; the next refresh writes a fresh one.
const MIN_MAX_AGE_SECONDS = 60;

/** Seconds until this JWT expires, or null when it carries no readable `exp`. */
function secondsUntilExpiry(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (!exp) return null;
    return exp - Math.floor(Date.now() / 1000);
  } catch {
    return null; // not a JWT we can read — fall back below
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * Write the signed context token.
 *
 * No token? Leave any existing cookie alone. A backend that returns null because Preta is
 * not configured (signPretaJwt returns null without PRETA_PRIVATE_KEY) must not wipe a
 * context that is still good. Signing out is separate and explicit — clearPretaCookie().
 */
export function setPretaCookie(token, maxAgeSeconds) {
  if (!token) return;
  const fromToken = secondsUntilExpiry(token);
  const maxAge =
    maxAgeSeconds ??
    (fromToken === null ? FALLBACK_MAX_AGE_SECONDS : Math.max(MIN_MAX_AGE_SECONDS, fromToken));
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    PRETA_COOKIE + "=" + token + "; Path=/; Max-Age=" + maxAge + "; SameSite=Lax" + secure;
}

/**
 * Remove it. This is what takes personalised elements away at logout: the loader finds no
 * cookie, sends no context, and the edge matches nothing. Miss this and a signed-out
 * visitor keeps seeing personalised content until the token expires on its own.
 */
export function clearPretaCookie() {
  document.cookie = PRETA_COOKIE + "=; Path=/; Max-Age=0; SameSite=Lax";
}

/** Read it back. */
export function readPretaCookie() {
  const m = document.cookie.match(/(?:^|;\s*)preta_ctx=([^;]+)/);
  return m ? m[1] : null;
}

/**
 * Write the context that came back with a session response.
 *
 * This is the single renewal point. `/auth/login`, `/auth/signup` and `/auth/refresh` all
 * return `preta_token` next to `access_token` (saas-backend/src/routes/auth.js), so wherever
 * the session is issued or refreshed, the context is re-issued with it — no frontend timer,
 * and no way for the two to drift apart.
 *
 * Pass the parsed JSON body of any of those three responses.
 */
export function applyPretaSession(body) {
  if (body && body.preta_token) setPretaCookie(body.preta_token);
}
