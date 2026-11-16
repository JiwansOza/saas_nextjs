// Funnel events for this test site, sent to GA4 (tag in app/layout.js), PostHog and Mixpanel
// (instrumentation-client.js). Page views are automatic in both; these are the moments a funnel
// needs: sign-ups, logins, form errors and CTA clicks. The Preta v2 AI-insights trial reads them
// back from each tool to find where visitors drop off.
import posthog from "posthog-js";
import mixpanel from "mixpanel-browser";

const mixpanelReady = () => !!mixpanel.__loaded;

export function track(name, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag("event", name, params);
  // PostHog keeps its own copy; it batches and flushes on page hide like GA.
  if (posthog.__loaded) posthog.capture(name, params);
  if (mixpanelReady()) mixpanel.track(name, params);
}

/**
 * Send an event, then run `next` once GA has sent it — for events followed by a full-page
 * redirect (sign_up, login). gtag sends asynchronously; redirecting straight after track()
 * unloads the page first and the event is lost (that is how sign_ups went missing from GA4).
 * Waits at most `timeoutMs`, so a blocked or slow GA never holds the visitor up.
 */
export function trackThen(name, params, next, timeoutMs = 1000) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    next();
  };
  if (typeof window === "undefined") return go();
  // PostHog sends this with sendBeacon on unload, so it survives the redirect without waiting.
  if (posthog.__loaded) posthog.capture(name, params, { transport: "sendBeacon" });
  if (mixpanelReady()) mixpanel.track(name, params, { transport: "sendBeacon" });
  if (typeof window.gtag !== "function") return go();
  window.gtag("event", name, { ...params, event_callback: go, event_timeout: timeoutMs });
  setTimeout(go, timeoutMs + 200); // belt and braces: event_callback never fires if gtag.js failed to load
}

/**
 * One delegated listener for every <button> that isn't a form submit: logs `cta_click` with its label and page.
 * Several CTAs on this site ("Start Free Trial", plan buttons, "Book a Demo") have no action yet —
 * this is what lets the data show visitors clicking them and going nowhere.
 */
export function trackButtonClicks() {
  const onClick = (e) => {
    const btn = e.target instanceof Element ? e.target.closest("button") : null;
    // A <button> with no type attribute is type "submit" even outside a form, so only skip real
    // form submits (those are tracked as sign_up / login instead).
    if (!btn || (btn.type === "submit" && btn.form)) return;
    const text = (btn.innerText || btn.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60);
    if (!text) return;
    track("cta_click", { cta_text: text, page_path: window.location.pathname });
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
