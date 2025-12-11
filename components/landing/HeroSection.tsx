"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Image as ImageIcon, Link as LinkIcon, FileText, Hash } from "lucide-react";
import * as motion from "motion/react-client";
import { useMotionValue, useSpring, useTransform } from "motion/react";

export const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax transforms
  const x1 = useTransform(springX, [-0.5, 0.5], [-25, 25]);
  const y1 = useTransform(springY, [-0.5, 0.5], [-25, 25]);

  const x2 = useTransform(springX, [-0.5, 0.5], [15, -15]);
  const y2 = useTransform(springY, [-0.5, 0.5], [15, -15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const width = rect.width;
      const height = rect.height;
      const mouseXFromCenter = e.clientX - rect.left - width / 2;
      const mouseYFromCenter = e.clientY - rect.top - height / 2;

      // Normalize to -0.5 to 0.5
      mouseX.set(mouseXFromCenter / width);
      mouseY.set(mouseYFromCenter / height);
    }
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative pt-40 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10 overflow-hidden min-h-[80vh] justify-center"
    >
      {/* Floating Elements (Parallax) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left - Image */}
        <motion.div
          style={{ x: x1, y: y1 }}
          className="absolute top-20 left-[10%] opacity-20 hidden lg:block"
        >
          <div className="w-16 h-16 bg-neutral-800 rounded-2xl -rotate-12 flex items-center justify-center border border-white/5">
            <ImageIcon className="size-8 text-neutral-400" />
          </div>
        </motion.div>

        {/* Top Right - Link */}
        <motion.div
          style={{ x: x2, y: y2 }}
          className="absolute top-32 right-[15%] opacity-20 hidden lg:block"
        >
          <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center border border-white/5">
            <LinkIcon className="size-6 text-neutral-400" />
          </div>
        </motion.div>

        {/* Bottom Left - Note */}
        <motion.div
          style={{ x: x2, y: y2 }}
          className="absolute bottom-40 left-[15%] opacity-20 hidden lg:block"
        >
          <div className="w-20 h-24 bg-neutral-800 rounded-xl rotate-6 flex items-center justify-center border border-white/5">
            <FileText className="size-8 text-neutral-400" />
          </div>
        </motion.div>

        {/* Bottom Right - Tag */}
        <motion.div
          style={{ x: x1, y: y1 }}
          className="absolute bottom-20 right-[10%] opacity-20 hidden lg:block"
        >
          <div className="px-4 py-2 bg-neutral-800 rounded-full -rotate-6 flex items-center justify-center border border-white/5">
            <Hash className="size-5 text-neutral-400 mr-1" />
            <span className="font-mono text-neutral-400">inspiration</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default"
      >
        <Sparkles className="size-3 text-orange-400" />
        <span className="text-xs font-medium text-neutral-300 tracking-wide uppercase">
          AI-Powered Second Brain
        </span>
      </motion.div>

      <div className="relative">
        <div className="absolute -inset-x-20 -inset-y-10 bg-orange-500/20 blur-[100px] rounded-full opacity-20 pointer-events-none" />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8 text-white z-10"
        >
          Throw it into <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-b from-white via-white to-neutral-500 relative">
            the Void.
            <motion.span
              className="absolute inset-0 text-orange-500/10 blur-xl"
              aria-hidden="true"
            >
              the Void.
            </motion.span>
          </span>
        </motion.h1>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg md:lg:text-2xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
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
          <div className="absolute inset-0 w-full h-px bg-linear-to-r from-transparent via-orange-500 to-transparent -bottom-1 transition-colors duration-500 opacity-50" />
        </Link>
      </motion.div>
    </section>
  );
};
