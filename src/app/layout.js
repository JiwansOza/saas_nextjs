"use client";

import { Geist, Geist_Mono } from "next/font/google";
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


  const afSnippet = `(function(){document.documentElement.style.opacity='0';var t=setTimeout(function(){document.documentElement.style.opacity='';},2000);window.__preta_af_clear=function(){clearTimeout(t);document.documentElement.style.transition='opacity 0.15s';document.documentElement.style.opacity='1';setTimeout(function(){document.documentElement.style.transition='';document.documentElement.style.opacity='';},200);};})();`;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: afSnippet }} />
        <script
          async
          src="https://preta-policy-phase1.pushkarnagwekar.workers.dev/?d=saas-nextjs-flax.vercel.app"
          data-api="https://preta-dashboard-phase1.pushkarnagwekar.workers.dev/api"
          data-ctx-endpoint="/api/preta-token"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

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
