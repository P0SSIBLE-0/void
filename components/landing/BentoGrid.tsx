'use client';
import React, { useRef, useState } from "react";
import { Brain, Layers, Search, Zap, Command } from "lucide-react";
import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";

const Skeleton = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0.5 }}
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: "easeInOut" }}
    className={cn("bg-neutral-800/50 rounded-lg", className)}
  />
);

const BentoCard = ({ 
  children, 
  className, 
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setOpacity(1);
  };

  const handleBlur = () => {
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-neutral-900/40 border border-white/5 p-8 backdrop-blur-sm transition-colors duration-300",
        className
      )}
    >
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.06), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

export const BentoGrid = () => {
  return (
      <section className="py-20 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Your brain, <span className="text-neutral-500">uncluttered.</span>
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px]">
          
          {/* Large Card: Capture */}
          <BentoCard className="md:col-span-2 md:row-span-2 bg-neutral-900/80">
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/20 transition-colors">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Instant Capture</h3>
                <p className="text-neutral-400 text-lg max-w-md">
                  One click to save links, images, and thoughts. The "Tether" extension works in the background, so you never break your flow.
                </p>
              </div>
              <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-4 mt-6 flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono text-neutral-300">Saved to Void • Just now</span>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500" />
          </BentoCard>

          {/* Tall Card: AI */}
          <BentoCard className="md:col-span-1 md:row-span-2 bg-neutral-900/60" delay={0.1}>
             <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Auto-Sense</h3>
              <p className="text-neutral-400 mb-6">
                No more manual tagging. Gemini AI analyzes content, extracts context, and organizes it for you.
              </p>
              <div className="mt-auto space-y-2">
                {['#design', '#inspiration', '#minimalism'].map((tag, i) => (
                  <motion.div 
                    key={tag} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="bg-white/5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 font-mono border border-white/5 w-fit group-hover:bg-white/10 transition-colors"
                  >
                    {tag}
                  </motion.div>
                ))}
              </div>
          </BentoCard>

          {/* Small Card: Search */}
          <BentoCard className="md:col-span-1 md:row-span-1 bg-neutral-900/60" delay={0.2}>
             <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Deep Recall</h3>
              <p className="text-sm text-neutral-400">
                Search by concept. "Blue lake" finds the image, even without tags.
              </p>
          </BentoCard>

          {/* Small Card: Keyboard First */}
          <BentoCard className="md:col-span-1 md:row-span-1 bg-neutral-900/60" delay={0.3}>
             <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/20">
                <Command className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Keyboard First</h3>
              <p className="text-sm text-neutral-400">
                Navigate your entire second brain without lifting your hands.
              </p>
          </BentoCard>

          {/* Wide Card: Interface */}
          <BentoCard className="md:col-span-4 bg-neutral-900/40 flex flex-row items-center" delay={0.4}>
              <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20">
                    <Layers className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">The Expanse</h3>
                  <p className="text-neutral-400 max-w-lg">
                    A responsive masonry grid that treats every piece of content with respect. 
                    Rich previews, typography-focused notes, and color-extracted images.
                  </p>
                </div>
                <div className="flex-1 h-full min-h-[200px] w-full relative overflow-hidden rounded-xl border border-white/5 bg-neutral-950/50 p-4 group-hover:border-white/10 transition-colors">
                    {/* Abstract UI representation with Skeleton */}
                    <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-24" delay={0} />
                        <Skeleton className="h-32" delay={0.2} />
                        <Skeleton className="h-20" delay={0.4} />
                        <Skeleton className="h-32" delay={0.1} />
                        <Skeleton className="h-20" delay={0.3} />
                        <Skeleton className="h-28" delay={0.5} />
                    </div>
                </div>
              </div>
          </BentoCard>

        </div>
      </section>
  );
};
