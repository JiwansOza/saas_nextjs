"use client";

import { useState, useEffect } from "react";

import HeroSection from "@/components/HeroSection";
import LogoSection from "@/components/LogoSection";
import FeatureSection from "@/components/FeatureSection";
import WorkingSection from "@/components/WorkingSection";
import TestimonialSection from "@/components/TestimonialSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import PretaTestBlock from "@/components/PretaTestBlock";
import HeavyBallast from "@/components/HeavyBallast";

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Logos Section */}
        <LogoSection />

        {/* Preta test block — identical on Home / Features / Testimonials / Pricing */}
        <PretaTestBlock />

        {/* Features Section */}
        <FeatureSection container={container} item={item} />

        {/* How It Works Section */}

        <WorkingSection />

        {/* Testimonials Section */}
        <TestimonialSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <CTASection />

        {/* Weight ballast — MUST stay last inside <main>. See HeavyBallast.jsx: the live
            element's selector is a structural path through section:nth-of-type(1), so anything
            inserted ahead of the existing sections renumbers it and the anchor stops matching.
            Appending here changes no index. Remove this once the heavy-page measurement is
            done; it is an instrument, not a feature. */}
        <HeavyBallast />
      </main>
    </>
  );
}
