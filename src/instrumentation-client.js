// PostHog for this test site, next to GA4 (app/layout.js). Runs before the app hydrates — Next.js's
// own hook for client-side setup (15.3+). The Preta v2 AI-insights trial reads PostHog back through
// its query API, the same way it reads GA4, to test PostHog as a second analytics source.
//
// Pageviews come from history changes (the `defaults` preset), button and link clicks from
// autocapture; the site's own funnel events are sent by lib/analytics.js.
import posthog from "posthog-js";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_nrybRQUNrZJpKXSmryDptamjcS6VgKVCNgQLUqTwaXw8";

posthog.init(POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  defaults: "2025-05-24",
});
