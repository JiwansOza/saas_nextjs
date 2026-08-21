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

// The backend signs with `expiresIn: '5m'`. Keep the cookie's life the same: a cookie that
// outlived its token would hand the edge something it must reject, and the visitor would
// look anonymous with no way to tell why.
const MAX_AGE_SECONDS = 300;

// Re-issue once less than this remains, so a visitor reading a page is never dropped
// mid-session by a token quietly lapsing underneath them.
const REFRESH_BELOW_SECONDS = 120;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * Write the signed context token.
 *
 * No token? Leave any existing cookie alone. A backend that returns null because Preta is
 * not configured (signPretaJwt returns null without PRETA_PRIVATE_KEY) must not wipe a
 * context that is still good. Signing out is separate and explicit — clearPretaCookie().
 */
export function setPretaCookie(token, maxAgeSeconds = MAX_AGE_SECONDS) {
  if (!token) return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    PRETA_COOKIE + "=" + token + "; Path=/; Max-Age=" + maxAgeSeconds + "; SameSite=Lax" + secure;
}

/**
 * Remove it. This is what takes personalised elements away at logout: the loader finds no
 * cookie, sends no context, and the edge matches nothing. Miss this and a signed-out
 * visitor keeps seeing personalised content until the token expires on its own.
 */
export function clearPretaCookie() {
  document.cookie = PRETA_COOKIE + "=; Path=/; Max-Age=0; SameSite=Lax";
}

/** Read it back. Used only to decide whether a refresh is due. */
export function readPretaCookie() {
  const m = document.cookie.match(/(?:^|;\s*)preta_ctx=([^;]+)/);
  return m ? m[1] : null;
}

/** Seconds left on a JWT, 0 if unreadable or expired. Never throws. */
function secondsLeft(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 0;
  } catch {
    return 0;
  }
}

/**
 * Session-renewal moment. The backend's token lives 5 minutes but a signed-in visitor can
 * sit on a page far longer, so without this they silently go anonymous — the exact failure
 * the onboarding guide calls out for "token refresh / session renewal".
 *
 * Re-issues from `/users/preta-token`, which authenticates with the access token this app
 * already keeps in localStorage. Safe to call on every mount: it does nothing while the
 * current token still has time on it.
 */
export async function refreshPretaCookie() {
  let accessToken = null;
  try {
    accessToken = localStorage.getItem("saasify_access_token");
  } catch {
    return; // storage unavailable (privacy mode) — nothing to authenticate with
  }

  // Signed out. Do not clear here: logout already did that explicitly, and clearing on
  // every anonymous page load would fight a cookie that was just written by login.
  if (!accessToken) return;

  const current = readPretaCookie();
  if (current && secondsLeft(current) > REFRESH_BELOW_SECONDS) return;

  try {
    const res = await fetch(`${BACKEND_URL}/users/preta-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return; // 401 = the session really is gone; logout handles the cookie
    const { token } = await res.json();
    setPretaCookie(token);
  } catch {
    // Backend unreachable. The existing cookie stays until it expires on its own, which is
    // better than blanking personalisation because one refresh call failed.
  }
}
