import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import ClientShell from "@/components/ClientShell";
import { createPretaContextToken } from "@/lib/preta-token";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Read the logged-in user's Preta attributes from the saasify_session cookie (set at
// login — 24h, contains { pretaUser: { plan, role, has_paid, ... } }). We sign these
// SERVER-SIDE on every request and hand the loader a fresh JWT via window.__PRETA_CTX__.
// This replaces the old data-ctx-endpoint fetch, whose reliance on the short-lived
// saasify_access_token caused a 401 (→ personalized element hidden until re-login).
async function getPretaContext() {
  try {
    const raw = (await cookies()).get("saasify_session")?.value;
    if (!raw) return { pretaUser: null, token: null };
    const session = JSON.parse(decodeURIComponent(raw));
    const pretaUser = session.pretaUser || null;
    if (!pretaUser) return { pretaUser: null, token: null };
    const token = await createPretaContextToken(pretaUser);
    return { pretaUser, token };
  } catch (e) {
    console.error("[Preta] context sign error:", e?.message);
    return { pretaUser: null, token: null };
  }
}

export default async function RootLayout({ children }) {
  const { pretaUser, token } = await getPretaContext();

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
        {/* Preta context — signed server-side, exposed for the loader BEFORE it runs.
            window.pretaUser feeds client-side targeting; window.__PRETA_CTX__ is the
            signed JWT the edge verifies (data-ctx-var). No network fetch → no 401. */}
        {(pretaUser || token) && (
          <script
            dangerouslySetInnerHTML={{
              __html: [
                pretaUser ? `window.pretaUser=${JSON.stringify(pretaUser)};` : "",
                token ? `window.__PRETA_CTX__=${JSON.stringify(token)};` : "",
              ].join(""),
            }}
          />
        )}
        {/* Preta loader — single-stage (/?d=), context via window var (data-ctx-var). */}
        <script
          src="https://hamza-phase-1.pushkarnagwekar.workers.dev/?d=saas-nextjs-flax.vercel.app"
          defer
          data-api="/px"
          data-ctx-var="__PRETA_CTX__"
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
