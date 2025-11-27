import React from "react";
import * as motion from "motion/react-client";
import { Globe, FileText, Plus } from "lucide-react";
import { Item } from "@/types/item";

export const Card = ({ item, onClick }: { item: Item, onClick?: () => void }) => {
  if (item.isPrompt) {
    return (
      <motion.div 
        whileHover={{ y: -4 }}
        onClick={onClick}
        className="break-inside-avoid mb-4 cursor-pointer group w-full"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all h-auto min-h-[200px] flex flex-col justify-center items-center text-center group-hover:border-orange-500/50 dark:group-hover:border-orange-500/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <Plus className="w-5 h-5" />
           </div>
           <h3 className="text-base font-bold text-orange-500 mb-1">ADD NEW</h3>
           <p className="text-neutral-400 text-sm">Save a link or note...</p>
        </div>
      </motion.div>
    );
  }

  const displayImage = item.image || item.meta?.image;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="break-inside-avoid mb-4 group relative w-full cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl dark:shadow-neutral-950/50 transition-all duration-300">
        {displayImage && (
          <div className="relative w-full">
            <img src={displayImage} alt={item.title} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 block" />
            {item.type === 'link' && item.url && (
                 <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {tryGetHostname(item.url)}
                 </div>
            )}
          </div>
        )}
        
        <div className="p-5">
            {!displayImage && <FileText className="w-6 h-6 text-neutral-300 mb-3" />}
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight mb-2 text-[15px]">
                {item.title || 'Untitled'}
            </h3>
            {(item.summary || item.content) && (
                <p className="text-neutral-500 text-sm line-clamp-3 leading-relaxed">
                    {item.summary || item.content}
                </p>
            )}
             {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap opacity-60">
                     {item.tags.slice(0, 2).map((tag, i) => (
                         <span key={i} className="text-[10px] text-neutral-400">#{tag}</span>
                     ))}
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

function tryGetHostname(url: string) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'link';
    }
}
