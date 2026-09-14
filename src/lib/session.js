// Session refresh.
//
// The access token lives 15 minutes and nothing used to renew it, so a visitor was silently
// signed out a quarter hour after logging in — and the Preta context, signed for the same 15
// minutes, went with it. `/auth/refresh` existed on the backend but was unreachable from
// here: its refresh cookie was SameSite=Lax on the API's own site, so the browser would never
// attach it to a cross-site request from this one. That is fixed in
// saas-backend/src/routes/auth.js (SameSite=None; Secure in production).
//
// This module is the single owner of the renewal schedule. It is driven by the ACCESS
// TOKEN's own `exp`, not by an arbitrary interval, and the Preta context is refreshed as a
// consequence of the session being refreshed — never on a timer of its own. The backend
// returns `preta_token` next to `access_token` from /auth/login, /auth/register and
// /auth/refresh alike, so the two cannot drift apart.

import { applyPretaSession, clearPretaCookie } from "@/lib/preta-cookie";

export const ACCESS_TOKEN_KEY = "saasify_access_token";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Refresh this long before the access token expires, so the session is never momentarily
// dead while the request is in flight — and so a failure still leaves time to retry before
// anything the user does starts 401ing.
const REFRESH_MARGIN_SECONDS = 120;

// A refresh that fails because the network blipped should be retried, but not in a hot loop.
const RETRY_DELAY_SECONDS = 30;

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null; // storage blocked (privacy mode)
  }
}

function setAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* nothing we can do; the in-flight session still works for this page */
  }
}

function removeAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Seconds left on a JWT, 0 if unreadable or already expired. Never throws. */
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
 * Store everything a session response carries: the access token, and the Preta context that
 * came with it. /auth/login, /auth/register and /auth/refresh all return the same shape, so
 * every one of them goes through here and none of them can forget the context.
 */
export function applySession(data) {
  if (!data || !data.access_token) return false;
  setAccessToken(data.access_token);
  applyPretaSession(data);
  return true;
}

/**
 * Exchange the refresh cookie for a new session. Returns true on success.
 *
 * `credentials: "include"` is what sends the (httpOnly, cross-site) refresh cookie; without
 * it the backend sees no cookie and answers 401 regardless of how valid the session is.
 */
export async function refreshSession() {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      // 401 means the refresh token is genuinely gone or revoked — the session is over, so
      // drop the local remnants rather than leaving a dead token that makes the UI look
      // signed in. Any other status is a server problem; leave the session alone and retry.
      if (res.status === 401) endSessionLocally();
      return false;
    }
    return applySession(await res.json());
  } catch {
    return false; // offline or backend down — the existing token is still valid for now
  }
}

/** Forget the local half of the session. Does not call the backend. */
function endSessionLocally() {
  removeAccessToken();
  clearPretaCookie();
}

// ── Scheduling ────────────────────────────────────────────────────────────────────────
// One timer, owned by the session, armed from the access token's real expiry. Not a poll:
// it fires once per session lifetime and re-arms off whatever the refresh returned.

let timer = null;
let started = false;

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function scheduleNext() {
  clearTimer();

  const token = getAccessToken();
  if (!token) return; // signed out — nothing to renew, and nothing to schedule

  const left = secondsLeft(token);
  const delaySeconds = Math.max(0, left - REFRESH_MARGIN_SECONDS);

  timer = setTimeout(async () => {
    const ok = await refreshSession();
    if (ok) {
      scheduleNext(); // re-arm from the NEW token's expiry
    } else if (getAccessToken()) {
      // Still signed in, so the failure was transient (offline, 5xx). Try again shortly
      // rather than abandoning the session.
      timer = setTimeout(scheduleNext, RETRY_DELAY_SECONDS * 1000);
    }
  }, delaySeconds * 1000);
}

/**
 * Begin keeping the session alive. Idempotent — a second call is ignored, so a React remount
 * cannot leave two schedules running. Returns a cleanup function.
 */
export function startSession() {
  if (started) return () => {};
  started = true;

  // Background tabs have their timers throttled, so a tab restored after a long pause can
  // hold an already-expired token. Re-check on visibility: if the token is still good this
  // just re-arms for its real expiry, and if it is not, the refresh happens immediately.
  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    const token = getAccessToken();
    if (token && secondsLeft(token) <= REFRESH_MARGIN_SECONDS) {
      refreshSession().then(scheduleNext);
    } else {
      scheduleNext();
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  // A returning visitor has a refresh cookie but no access token in this tab, or a stale one.
  // Recover the session from the cookie before scheduling.
  const token = getAccessToken();
  if (token && secondsLeft(token) > REFRESH_MARGIN_SECONDS) {
    scheduleNext();
  } else if (token) {
    refreshSession().then(scheduleNext);
  }

  return () => {
    started = false;
    clearTimer();
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * Sign out. Revokes the refresh token server-side so it cannot be replayed, then clears the
 * local session and the Preta context. Without the server call the rotated refresh cookie
 * would survive logout and could mint new sessions for another seven days.
 */
export async function endSession() {
  try {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Backend unreachable. Still clear locally — the visitor asked to be signed out.
  }
  clearTimer();
  started = false;
  endSessionLocally();
}
