import React from "react";
import Link from "next/link";
import * as motion from "motion/react-client";

export const CTASection = () => {
  return (
    <section className="py-32 px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/5 p-12 md:p-24 rounded-[3rem] overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#ffffff08_0%,transparent_60%)]" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white">
              Ready to clear your mind?
            </h2>
            <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
              Join the beta today and stop worrying about organizing your digital life. 
              Let the Void handle it.
            </p>
            <Link 
              href="/signup"
              className="inline-block bg-white text-neutral-950 px-10 py-4 rounded-full text-lg font-bold hover:bg-neutral-200 transition-transform hover:scale-105"
            >
              Enter the Void
            </Link>
          </div>
        </motion.div>
      </section>
  );
};
