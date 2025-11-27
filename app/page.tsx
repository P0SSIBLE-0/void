import React from "react";
import { BackgroundPattern } from "@/components/landing/BackgroundPattern";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-white/20 selection:text-white font-sans">
      <BackgroundPattern />
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <CTASection />
      <Footer />
    </div>
  );
}