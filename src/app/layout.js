import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Preta context is delivered as a COOKIE (data-ctx-cookie), not a window variable.
//
// Nothing is read or signed in this layout any more. The signing already happens where it
// should — in our own backend, which returns `preta_token` from /auth/login, /auth/signup
// and /users/preta-token (saas-backend/src/routes/auth.js, users.js). The browser writes
// that token into the `preta_ctx` cookie via src/lib/preta-cookie.js, and the loader reads
// it there. The private key therefore stays in one place instead of two.
//
// What this buys over the old data-ctx-var setup:
//   • this layout no longer calls cookies(), so pages can render statically / be CDN-cached
//     — a cookie travels with the visitor, a printed variable travels with the page, and a
//     cached page would hand the next visitor a stale token;
//   • the loader can start its edge decision immediately. With data-ctx-var it first has to
//     confirm the variable is actually populated (edgeDecisionCanStartNow in core/edge.js)
//     and skips the early start when it is not; a cookie is readable synchronously, so that
//     check always passes.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* The Preta anti-flicker snippet used to sit here: it set opacity:0 on <html> and
            waited up to 1500 ms for the loader to reveal the page. It worked, but the cost was
            the whole site being invisible for ~380–680 ms of every load — this site was being
            held back so Preta could catch up.

            Removed deliberately. Preta now places its elements during parse, from a decision
            persisted by the previous load, so they land in the same paint as the site's own
            content instead of after it. Nothing has to be hidden for that to look right.

            Preta's own two hides are off as well: the /boot opacity hide and the loader's
            800 ms one are both governed by the `anti_flicker` flag, now false. Turning that
            flag back on is what brings hiding back — this snippet does not need to return. */}
        {/* No context <script> here any more. The signed JWT lives in the `preta_ctx`
            cookie, written by src/lib/preta-cookie.js from the token our backend returns,
            and the loader reads it from there itself.

            window.pretaUser is also gone. It only ever fed the LEGACY client-side
            targeting path, and naming a ctx attribute puts the loader in edge-evaluate
            mode, where the decision is made server-side and checkTargeting() is never
            called. Restore it here if this site is ever moved off edge evaluation. */}
        {/* Preta loader — v2, context via cookie (data-ctx-cookie). */}
        {/* <script
          src="https://loader-v2.pretasystems.com/boot?d=saas-nextjs-flax.vercel.app"
          defer
          data-api="https://app.pretasystems.com/v2/api"
          data-ctx-cookie="preta_ctx"
        ></script> */}
        {/* Preta boot loader — context via cookie. The cookie name here must match
            PRETA_COOKIE in src/lib/preta-cookie.js and the name registered in the
            dashboard's onboarding step, or the loader finds nothing and every visitor
            looks anonymous. */}
        {/* data-debug: turns on the loader's log() output (it is silent otherwise), so the
            console shows which elements were fetched, matched and injected. Debugging aid on
            this test site only — remove it before this pattern reaches a customer page. */}
        {/* Start the handshake, then fetch both assets alongside /boot instead of behind it.

            THE HANDSHAKE. Measured on a cold visit, /boot spends 145 ms (tcp 66 + tls 79) on a
            TCP+TLS handshake that exists only because the loader is a different origin. A
            preconnect cannot remove that, only start it earlier — worth 21-93 ms, because the
            parser reaches this tag at ~byte 2200 rather than at header time.

            THE TWO PRELOADS. /boot's response is what NAMES the config and the bundle, so
            without these neither can begin until it returns: measured, /boot 90→422 ms and only
            then config 428→564 ms. Naming them here moved the config to 118→415 ms — it now
            finishes with /boot rather than after it. Both URLs are stable for exactly this
            reason; the worker serves them stale-while-revalidate, so a repeat visit still reads
            them from cache in 0 ms.

            NO crossOrigin ON ANY OF THESE. A preconnect or preload carrying crossorigin opens an
            anonymous connection, while a plain <script src> needs a credentialed one — different
            pools, so the warmed socket goes unused and the handshake is paid anyway. That was
            live on this page and cost the whole benefit: tcp=150 ms, tls=81 ms with the
            preconnect present, 0 ms once the attribute was removed. The hrefs must also match
            the script URLs the loader requests EXACTLY, or the preloads are simply downloads
            nobody uses.

            Honest limit: this makes the DOWNLOADS parallel, and that is all. Measured, the delta
            against the page's own content did not move (+319 ms → +328 ms), because everything
            has arrived by ~415 ms and the element still paints at ~674 ms — the remaining wait is
            the bundle sitting ready while the main thread is busy hydrating this page. */}
        <link rel="preconnect" href="https://loader-v1.pretasystems.com" />
        <link
          rel="preload"
          as="script"
          href="https://loader-v1.pretasystems.com/config?d=saas-nextjs-flax.vercel.app"
        />
        <link
          rel="preload"
          as="script"
          href="https://loader-v1.pretasystems.com/l/pretaloader.js?d=saas-nextjs-flax.vercel.app"
        />
        {/* async + fetchpriority, deliberately together:

            async  — the parser never stops for this tag. Without it the script is
                     parser-blocking, and measured on this site that delayed the page's OWN
                     first contentful paint by ~304 ms (FCP 636 ms with it, 332 ms without).

            fetchpriority="high" — async alone hands the request LOW network priority, which
                     pushed the element's arrival from ~90 ms to ~200 ms on a warm load. This
                     asks for the priority back without giving the parser back. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          // async
          fetchPriority="high"
          src="https://loader-v1.pretasystems.com/boot?d=saas-nextjs-flax.vercel.app"
          data-api="https://app.pretasystems.com/v1/api"
          data-ctx-cookie="preta_ctx"
          data-debug="true"
        ></script>

      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* App-shell wrapper the loader keys off. Do NOT remove it (see a11c11c, reverted).
            The App Router does not emit #__next the way the Pages Router does, so this supplies
            it deliberately, and two separate things depend on it:

            1. Banner layout. The loader looks for a recognised shell to push down for banner
               space ('.application-main, ytd-app, #root, #__next, main[role="main"], #content'
               — see loader-src/injectors/banner.js). With none, it falls back to body-level
               positioning: the banner mounts position:relative as <body>'s FIRST child, so
               hydration removing it collapses the space and the navbar visibly jumps.

            2. Every element's targetSelector. Selectors are structural paths
               ('body > div:nth-of-type(2) > main > section…'), so deleting a wrapper shifts all
               of them. Measured while it was commented out: #__next absent and ALL NINE
               selectors matched zero nodes. Elements only still appeared through the injectors'
               anchorText fallback, which runs later — early-inject dropped from 8 elements to
               1, and paint slipped from ~+8ms to +24–41ms after FCP.

            If the shell ever has to change, re-record the element selectors along with it. */}
        <div id="__next">
          <ClientShell>{children}</ClientShell>
        </div>
      </body>
    </html>
  );
}
