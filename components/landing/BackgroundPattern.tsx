import React from "react";
import * as motion from "motion/react-client";

export const BackgroundPattern = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {/* Subtle Grid */}
    <div 
      className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" 
      style={{ maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)" }}
    />
    
    {/* Floating Orbs */}
    <motion.div 
      animate={{ 
        x: [0, 100, 0],
        y: [0, -50, 0],
        opacity: [0.3, 0.5, 0.3] 
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen"
    />
    <motion.div 
      animate={{ 
        x: [0, -100, 0],
        y: [0, 50, 0],
        opacity: [0.2, 0.4, 0.2] 
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen"
    />
  </div>
);
