// PostHog and Mixpanel for this test site, next to GA4 (app/layout.js). Runs before the app hydrates — Next.js's
// own hook for client-side setup (15.3+). The Preta v2 AI-insights trial reads PostHog back through
// its query API and Mixpanel through its raw event export, the same way it reads GA4.
//
// Pageviews come from history changes (the `defaults` preset), button and link clicks from
// autocapture; the site's own funnel events are sent by lib/analytics.js.
import posthog from "posthog-js";
import mixpanel from "mixpanel-browser";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_nrybRQUNrZJpKXSmryDptamjcS6VgKVCNgQLUqTwaXw8";

posthog.init(POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  defaults: "2025-05-24",
});

// Mixpanel (project SaasTest, US data). Autocapture sends page views ($mp_web_page_view, on every
// client-side route change too) and clicks ($mp_click); the token is public — it is in the page anyway.
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || "f7de08077bdbdb15ee71592393ca4787";

mixpanel.init(MIXPANEL_TOKEN, {
  autocapture: { pageview: "full-url", click: true, input: false, scroll: false, submit: true },
  persistence: "localStorage",
});
