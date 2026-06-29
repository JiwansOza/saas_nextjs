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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/*
          Reads the saasify_session cookie and sets window.pretaUser before
          the personalisation loader runs. In production a real client would
          do the same — server-render the user's plan data into this script
          from their session/JWT so the loader can evaluate targeting instantly.
        */}
        <Script id="user-context-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var match = document.cookie.match(/(^|;\\s*)saasify_session=([^;]+)/);
                if (match) {
                  var session = JSON.parse(decodeURIComponent(match[2]));
                  window.pretaUser = session.pretaUser || {};
                } else {
                  window.pretaUser = {};
                }
              } catch(e) {
                window.pretaUser = {};
              }
            })();
          `}
        </Script>

        <Script
          src="https://yash-loader-worker.pushkarnagwekar.workers.dev/?d=saas-nextjs-flax.vercel.app"
          data-api="https://app.pretasystems.com/api"
          data-debug="true"
          strategy="afterInteractive"
        />

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
      </body>
    </html>
  );
}
