// GA4 events for this test site (tag is in app/layout.js). Page views are automatic; these are the
// moments a funnel needs: sign-ups, logins, form errors and CTA clicks. The Preta v2 AI-insights
// trial reads them back through the GA Data API to find where visitors drop off.

export function track(name, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
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
