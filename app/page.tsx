import React from "react";
import { BackgroundPattern } from "@/components/landing/BackgroundPattern";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-white/20 selection:text-white">
      <BackgroundPattern />
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <CTASection />
      <Footer />
    </div>
  );
}