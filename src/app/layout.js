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
        {/* Preta anti-flicker — hide instantly, reveal once the loader injects. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){document.documentElement.style.opacity='0';var t=setTimeout(function(){document.documentElement.style.opacity='';},1500);window.__preta_af_clear=function(){clearTimeout(t);document.documentElement.style.transition='opacity .15s';document.documentElement.style.opacity='1';setTimeout(function(){document.documentElement.style.transition='';document.documentElement.style.opacity='';},200);};})();",
          }}
        />
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
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src="https://loader-v1.pretasystems.com/boot?d=saas-nextjs-flax.vercel.app"
          data-api="https://app.pretasystems.com/v1/api"
          data-ctx-cookie="preta_ctx"
          data-debug="true"
        ></script>

      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* App-shell wrapper the loader keys off for clean banner layout. */}
        <div id="__next">
          <ClientShell>{children}</ClientShell>
        </div>
      </body>
    </html>
  );
}
