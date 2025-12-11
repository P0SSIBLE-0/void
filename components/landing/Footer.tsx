import React from "react";

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 py-12 px-6 bg-neutral-950 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <img src="/logo.svg" alt="logo" className="size-6 mr-2" />
          <span className="font-bold tracking-tight text-sm">Void</span>
        </div>
        <div className="flex gap-6 text-sm text-neutral-500">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  );
};
