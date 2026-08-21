"use client";

// Client-only shell: keeps the scroll/mounted state that the Navbar needs, so the
// RootLayout can stay a SERVER component (needed to read the session cookie and sign
// the Preta context JWT at request time).
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { refreshPretaCookie } from "@/lib/preta-cookie";

export default function ClientShell({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Session renewal for the Preta context cookie. The backend signs it for 5 minutes, but
  // a signed-in visitor can sit on one page much longer — without this they silently go
  // anonymous, which is the failure the onboarding guide calls out explicitly.
  //
  // This does NOT block or delay the loader: the loader reads whatever cookie is already
  // there. This only keeps the next page load correct. refreshPretaCookie() is a no-op
  // while the current token still has time on it, and for signed-out visitors.
  useEffect(() => {
    refreshPretaCookie();
    const id = setInterval(refreshPretaCookie, 60_000);
    const onFocus = () => refreshPretaCookie(); // a tab left open for hours
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

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
