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
        {/* THE HANDSHAKE. Measured on a cold visit, the first request to the loader spends
            145 ms (tcp 66 + tls 79) on a TCP+TLS handshake that exists only because the loader
            is a different origin. A preconnect cannot remove that, only start it earlier —
            worth 21-93 ms, because the parser reaches the tags below at ~byte 2200 rather than
            at header time.

            NO crossOrigin. A preconnect carrying crossorigin opens an ANONYMOUS connection,
            while a plain <script src> needs a credentialed one — different pools, so the warmed
            socket goes unused and the handshake is paid anyway. That was live on this page and
            cost the whole benefit: tcp=150 ms, tls=81 ms with the preconnect present, 0 ms once
            the attribute was removed. */}
        <link rel="preconnect" href="https://loader-v1.pretasystems.com" />
        {/* TWO TAGS, NOT /boot. This is the change that closed the first-load gap.

            /boot was one small script whose entire job was to NAME these two URLs and stamp a
            few window.PRETA_* values. That made it a gate: nothing of ours could begin until it
            returned. Measured, that serial step cost roughly the whole of /boot — the single
            largest item in the cold-start gap. Preloading the two files helped their DOWNLOADS
            start early but did not remove the gate, because the loader still could not run
            until /boot's script appended it.

            Naming them here removes the gate entirely: the browser's preload scanner starts
            both with the document, and the worker now emits the paint stamps (PRETA_POLICIES,
            PRETA_DECISION, PRETA_CFGIDS, PRETA_CFGV) from /config instead of /boot.

            MEASURED, six genuine first visits each, fresh browser profile per run, both arms
            through the same route interception so the harness cost cancels:

              /boot + preloads   delta +88 +146 +225 +254 ms, one run at 0   median +146
              these two tags     delta 0 ms on all six                       median    0

            ORDER MATTERS AND IS NOT COSMETIC. The bundle reads window.PRETA_CONFIG as it
            initialises, so config has to have executed first. Two ordinary <script> tags give
            exactly that: they download in parallel and execute in document order. Do not add
            `async` — it would let the bundle run first and find no config, and the elements
            would simply not paint. `defer` is wrong for the opposite reason: it runs after the
            parser is done, which is precisely the moment we are trying to be earlier than.

            THE COST, stated plainly: two parser-blocking tags mean the 352 KB bundle is parsed
            and executed while the parser is stopped, where /boot let it run as a dynamically
            inserted script afterwards. Measured on this page, the site's own first content went
            from ~523 ms to ~578 ms — about 55 ms later. The delta closed from both directions:
            our element also moved earlier, ~628 ms to ~578 ms. If that 55 ms matters more than
            same-paint, /boot still works unchanged — put the old tag back and nothing else
            needs to change. The durable fix is a smaller bundle (the unused injectors are
            ~108 KB of it), not a different tag shape.

            data-* live on the LOADER tag: that is the one the bundle finds via
            document.currentScript. Putting them on the config tag would silently lose them —
            the loader would fall back to the default API host and every visitor would look
            anonymous. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://loader-v1.pretasystems.com/config?d=saas-nextjs-flax.vercel.app"></script>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src="https://loader-v1.pretasystems.com/l/pretaloader.js?d=saas-nextjs-flax.vercel.app"
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
