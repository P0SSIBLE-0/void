"use client";

import { useState, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Card } from "@/components/dashboard/Card";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import { ItemPreviewModal } from "@/components/dashboard/ItemPreviewModal";
import { NoteModal } from "@/components/dashboard/NoteModal";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { Item } from "@/types/item";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedNote, setSelectedNote] = useState<Item | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    loading: itemsLoading,
    handleSaveItem,
    handleUpdateItem,
    handleDeleteItem,
    handleUpdateItemCategory,
  } = useItems();

  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  } = useCategories();

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.isPrompt) return true;

      // Filter by category
      if (activeCategory !== null && item.category_id !== activeCategory) {
        return false;
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [items, activeCategory, searchQuery]);

  // Handle save with category
  const handleSave = async ({ type, value }: { type: "link" | "text"; value: string }) => {
    return handleSaveItem({ type, value, category_id: activeCategory });
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    searchInputRef.current?.focus();
  };

  const loading = itemsLoading || categoriesLoading;
  const activeCategoryData = getCategoryById(activeCategory);

  // Count items in current category
  const itemCount = items.filter((i) => !i.isPrompt && (activeCategory === null ? true : i.category_id === activeCategory)).length;

  return (
    <div className="">
      {/* Desktop Sidebar */}
      <Sidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onAddClick={() => setIsAddModalOpen(true)}
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Mobile Navigation */}
      <MobileNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onCreateCategory={createCategory}
        onAddClick={() => setIsAddModalOpen(true)}
        onSearch={handleSearchFocus}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarExpanded ? "lg:pl-64" : "lg:pl-20"} pb-24 lg:pb-0 min-h-screen`}>
        <div className="p-4 lg:p-8">
          {/* Header */}
          <header className="mb-8">
            {/* Category Title (Desktop) */}
            <div className="flex items-center gap-4 mb-6">
              {activeCategoryData && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="size-12 rounded-full shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: activeCategoryData.color }}
                >
                  <span className="text-white text-lg lg:md:text-xl font-bold">
                    {activeCategoryData.name.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {activeCategoryData ? activeCategoryData.name : "All Items"}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <motion.div
              className={`relative transition-all duration-300 lg:md:max-w-xl `}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-7 text-neutral-400 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search your void..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full bg-neutral-200 focus:bg-white dark:bg-neutral-900 dark:focus:bg-neutral-800 rounded-full py-4 pl-14 pr-4 placeholder:text-neutral-500 focus:outline-none focus:shadow transition-all font-semibold lg:md:text-2xl tracking-wide`}
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  ×
                </motion.button>
              )}
            </motion.div>
          </header>

          {/* Items Grid */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4 text-center"
              >
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-3xl flex items-center justify-center">
                  <Search className="w-10 h-10 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    {searchQuery ? "No results found" : "No items yet"}
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    {searchQuery
                      ? `Try searching for something else`
                      : activeCategoryData
                        ? `Add items to "${activeCategoryData.name}"`
                        : "Save your first link or create a note"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      item={item}
                      category={item.category_id ? getCategoryById(item.category_id) : null}
                      onClick={() => {
                        if (item.isPrompt) setIsAddModalOpen(true);
                        else if (item.type === 'text') setSelectedNote(item);
                        else setSelectedItem(item);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddItemModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSave}
            categories={categories}
            activeCategory={activeCategory}
            onCreateCategory={createCategory}
          />
        )}
        {selectedItem && (
          <ItemPreviewModal
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            categories={categories}
            onUpdateCategory={handleUpdateItemCategory}
            onCreateCategory={createCategory}
            getCategoryById={getCategoryById}
          />
        )}
        {selectedNote && (
          <NoteModal
            item={selectedNote}
            isOpen={!!selectedNote}
            onClose={() => setSelectedNote(null)}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            categories={categories}
            onUpdateCategory={handleUpdateItemCategory}
            onCreateCategory={createCategory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
