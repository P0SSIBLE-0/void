"use client";

import React, { useState } from "react";
import { Globe, Github, Image as ImageIcon, FileText, Video, Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { FilterPill } from "@/components/dashboard/FilterPill";
import { Card } from "@/components/dashboard/Card";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import { ItemPreviewModal } from "@/components/dashboard/ItemPreviewModal";
import { useItems } from "@/hooks/useItems";
import { Item } from "@/types/item";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const { items, loading, handleSaveItem, handleUpdateItem, handleDeleteItem } = useItems();

  const filteredItems = items.filter(item => {
    if (item.isPrompt) return true; 
    if (activeFilter !== "All" && activeFilter === "Web Pages" && item.type !== 'link') return false;
    if (activeFilter !== "All" && activeFilter === "Images" && item.type !== 'image') return false;
    if (activeFilter !== "All" && activeFilter === "Posts" && item.type !== 'text') return false;
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.title?.toLowerCase().includes(query) || item.content?.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
             <AddItemModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSave={handleSaveItem} 
            />
        )}
        {selectedItem && (
             <ItemPreviewModal 
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
            />
        )}
      </AnimatePresence>

      <header className="w-full mb-8 text-left">
        <div className="relative group z-20 max-w-2xl">
            <input 
                type="text" 
                placeholder="Search my mind..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-4xl md:text-5xl font-bold text-neutral-300 placeholder:text-neutral-300/50 dark:placeholder:text-neutral-700 focus:text-neutral-900 dark:focus:text-white focus:outline-none transition-colors"
            />
        </div>
      </header>

      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar w-full px-1">
        <FilterPill icon={Globe} label="All" isActive={activeFilter === "All"} onClick={() => setActiveFilter("All")} />
        <FilterPill icon={Globe} label="Web Pages" isActive={activeFilter === "Web Pages"} onClick={() => setActiveFilter("Web Pages")} />
        <FilterPill icon={ImageIcon} label="Images" isActive={activeFilter === "Images"} onClick={() => setActiveFilter("Images")} />
        <FilterPill icon={FileText} label="Notes" isActive={activeFilter === "Posts"} onClick={() => setActiveFilter("Posts")} />
      </div>

      <div className="min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
             </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mx-auto max-w-[1920px]">
                <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => (
                        <Card 
                            key={item.id} 
                            item={item} 
                            onClick={() => {
                                if (item.isPrompt) setIsAddModalOpen(true);
                                else setSelectedItem(item);
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>
          )}
      </div>

    </div>
  );
}
