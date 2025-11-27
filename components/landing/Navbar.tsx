import React from "react";
import Link from "next/link";
import * as motion from "motion/react-client";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6 }}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-linear-to-tr from-neutral-200 to-neutral-400" />
               <div className="w-3 h-3 bg-neutral-950 rounded-full relative z-10" />
            </motion.div>
            <span className="text-lg font-bold tracking-tighter text-white">Void</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium bg-white text-neutral-950 px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>
  );
};
