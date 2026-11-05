// GA4 events for this test site (tag is in app/layout.js). Page views are automatic; these are the
// moments a funnel needs: sign-ups, logins, form errors and CTA clicks. The Preta v2 AI-insights
// trial reads them back through the GA Data API to find where visitors drop off.

export function track(name, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
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
  if (typeof window === "undefined" || typeof window.gtag !== "function") return go();
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
