"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

      {/* Preta anti-flicker — hides the page so the site's own content doesn't paint
          before Preta injects, then the loader's revealPage() calls __preta_af_clear
          to show everything together (no pop-in). NOTE: this app fetches its context
          from a SLOW external backend (data-ctx-endpoint on Render, cold-start 1-3s),
          so the fallback is capped at 1.5s — otherwise a cold start would blank the
          page for seconds. Warm/repeat loads (session-cached JWT) reveal cleanly at
          ~280ms. For a fully clean first load this app should move to window-var
          (sign the JWT server-side like the doctor demo) so there is no ctx fetch. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){document.documentElement.style.opacity='0';var t=setTimeout(function(){document.documentElement.style.opacity='';},1500);window.__preta_af_clear=function(){clearTimeout(t);document.documentElement.style.transition='opacity .15s';document.documentElement.style.opacity='1';setTimeout(function(){document.documentElement.style.transition='';document.documentElement.style.opacity='';},200);};})();",
        }}
      />

      <Script
  id="preta-loader"
  src="https://hamza-phase-1.pushkarnagwekar.workers.dev/?d=saas-nextjs-flax.vercel.app"
  strategy="afterInteractive"
  data-api="https://app.pretasystems.com/v2/api"
  data-ctx-endpoint="https://saasify-backend-ps2n.onrender.com/users/preta-token"
  data-ctx-token-key="saasify_access_token"
  data-debug="true"
/>

  

        {/* Standard Next.js app-shell wrapper. App Router doesn't emit the
            #__next node that Pages Router does, but the Preta loader looks for
            it (or #root) to reserve banner space cleanly via a shell margin.
            Without a recognized shell the loader falls back to body-level
            hacks and the injected banner mis-lays out the navbar/content. */}
        <div id="__next">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar isScrolled={isScrolled} mounted={mounted} />
            {children}
            <Footer />
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
