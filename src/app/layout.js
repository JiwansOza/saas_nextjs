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
        {/* Start the DNS + TLS handshake to the loader origin before the parser reaches the
            script tag below. The boot request is cross-origin, so without this its round trip
            includes a fresh connection setup on every cold visit. */}
        <link rel="preconnect" href="https://loader-v1.pretasystems.com" />
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
