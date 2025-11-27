import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import * as motion from "motion/react-client";

export const HeroSection = () => {
  return (
    <section className="relative pt-40 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default"
      >
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span className="text-xs font-medium text-neutral-300 tracking-wide uppercase">
          AI-Powered Second Brain
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8 text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/40"
      >
        Throw it into <br className="hidden md:block" />
        the Void.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        Capture first, organize later. A private, intelligent digital sanctuary
        that remembers everything so you don't have to.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <Link
          href="/signup"
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-neutral-950 rounded-full text-lg font-semibold hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
        >
          <span>Start Capturing</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          <div className="absolute inset-0 w-full h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent -bottom-1 transition-colors duration-500" />
        </Link>
      </motion.div>
    </section>
  );
};
