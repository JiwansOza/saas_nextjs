"use client";

// Client-only shell: keeps the scroll/mounted state that the Navbar needs, so the
// RootLayout can stay a SERVER component (needed to read the session cookie and sign
// the Preta context JWT at request time).
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { startSession } from "@/lib/session";

export default function ClientShell({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keep the access token alive past its 15 minutes, and with it the Preta context — the
  // backend hands both back from /auth/refresh, so renewing the session renews the context.
  // The schedule lives in lib/session.js and is armed from the token's own expiry.
  useEffect(() => startSession(), []);

  return (
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
  );
}
