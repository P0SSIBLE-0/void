import * as motion from "motion/react-client";
import { Globe, FileText, Plus, Folder } from "lucide-react";
import { Item, Category } from "@/types/item";

interface CardProps {
  item: Item;
  category?: Category | null;
  onClick?: () => void;
}

export const Card = ({ item, category, onClick }: CardProps) => {
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

  const displayImage = item.image || (item.meta as Record<string, unknown>)?.image as string | undefined;

  return (
    <motion.div
      layoutId={`container-${item.id}`}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="break-inside-avoid mb-4 group relative w-full cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl dark:shadow-neutral-950/50 transition-all duration-300">
        {displayImage && (
          <motion.div
            layoutId={`image-${item.id}`}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full overflow-hidden">
            <img
              src={displayImage} alt={item.title}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 block" />
            {item.type === 'link' && item.url && (
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3" /> {tryGetHostname(item.url)}
              </div>
            )}
            {/* Category indicator */}
            {category && (
              <div
                className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 backdrop-blur-md"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                  border: `1px solid ${category.color}40`
                }}
              >
                <Folder className="w-3 h-3" />
                {category.name}
              </div>
            )}
          </motion.div>
        )}

        <div className="p-4">
          {!displayImage && (
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-6 text-neutral-300" />
              {category && (
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  <Folder className="w-2.5 h-2.5" />
                  {category.name}
                </div>
              )}
            </div>
          )}
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight mb-2 text-sm">
            {item.title.split(' ').slice(0, 8).join(' ') + '...' || 'Untitled'}
          </h3>
          {/* {(item.summary || item.content) && (
            <p className="text-neutral-500 text-sm line-clamp-3 leading-relaxed">
              {item.summary || item.content}
            </p>
          )} */}
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
