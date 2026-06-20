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
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);  
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Preta loader — in the ROOT layout so it loads on every route, not just the
            homepage. (Was previously only in app/page.js, so elements never showed on
            /features, /pricing, /about-us, etc.) */}
        <Script
          async
          src="https://loader.pretasystems.com/?d=saas-nextjs-flax.vercel.app"
          data-api="https://app.pretasystems.com/api"
          data-debug="true"
          crossOrigin="anonymous"
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
