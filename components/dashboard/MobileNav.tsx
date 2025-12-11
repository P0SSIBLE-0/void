"use client";

import React, { useState, useEffect } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import {
    LayoutGrid,
    Plus,
    Folder,
    Search,
    Moon,
    Sun,
    Laptop,
    X,
    LogOut,
} from "lucide-react";
import { Category, CATEGORY_COLORS, getRandomCategoryColor } from "@/types/item";
import { Modal } from "@/components/ui/Modal";

interface MobileNavProps {
    categories: Category[];
    activeCategory: string | null;
    onSelectCategory: (id: string | null) => void;
    onCreateCategory: (name: string, color: string) => Promise<Category>;
    onAddClick: () => void;
    onSearch: () => void;
}

export const MobileNav = ({
    categories,
    activeCategory,
    onSelectCategory,
    onCreateCategory,
    onAddClick,
    onSearch,
}: MobileNavProps) => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isFoldersOpen, setIsFoldersOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState(getRandomCategoryColor());

    const activeFolder = categories.find((c) => c.id === activeCategory);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        if (theme === "dark") setTheme("light");
        else if (theme === "light") setTheme("system");
        else setTheme("dark");
    };

    const handleCreateCategory = async () => {
        if (newCategoryName.trim()) {
            await onCreateCategory(newCategoryName.trim(), newCategoryColor);
            setNewCategoryName("");
            setNewCategoryColor(getRandomCategoryColor());
            setIsCreateModalOpen(false);
        }
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                {/* Folders Drawer */}
                <AnimatePresence>
                    {isFoldersOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ ease: "easeInOut", duration: 0.2 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                                onClick={() => setIsFoldersOpen(false)}
                            />
                            <motion.div
                                initial={{ y: "120%" }}
                                animate={{ y: '20%' }}
                                exit={{ y: "120%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.3 }}
                                className="fixed bottom-20 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-50 max-h-[60vh] overflow-hidden shadow-2xl border-t border-neutral-200 dark:border-neutral-800"
                            >
                                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Folders</h3>
                                    <button
                                        onClick={() => setIsFoldersOpen(false)}
                                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-4 overflow-y-auto max-h-[45vh] space-y-2">
                                    {/* All Items */}
                                    <button
                                        onClick={() => {
                                            onSelectCategory(null);
                                            setIsFoldersOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-medium transition-all ${activeCategory === null
                                            ? "bg-neutral-100 dark:bg-neutral-800"
                                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                            }`}
                                    >
                                        <LayoutGrid className="w-5 h-5" />
                                        <span>All Items</span>
                                    </button>

                                    {/* Category List */}
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                onSelectCategory(cat.id);
                                                setIsFoldersOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-medium transition-all ${activeCategory === cat.id
                                                ? "bg-neutral-100 dark:bg-neutral-800"
                                                : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                                }`}
                                        >
                                            <div
                                                className="w-5 h-5 rounded-lg"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}

                                    {/* Create New Folder */}
                                    <button
                                        onClick={() => {
                                            setIsFoldersOpen(false);
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 p-4 rounded-2xl font-medium text-orange-500 border-2 border-dashed border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>New Folder</span>
                                    </button>

                                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2" />

                                    <form action="/auth/signout" method="post">
                                        <button
                                            type="submit"
                                            className="w-full flex items-center gap-3 p-4 rounded-2xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span>Sign Out</span>
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Tab Bar */}
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 px-4 py-2 safe-area-pb">
                    <div className="flex items-center justify-around">
                        {/* Home */}
                        <button
                            onClick={() => onSelectCategory(null)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeCategory === null && !isFoldersOpen
                                ? "text-orange-500"
                                : "text-neutral-400"
                                }`}
                        >
                            <LayoutGrid className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Home</span>
                        </button>

                        {/* Search */}
                        <button
                            onClick={onSearch}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-400"
                        >
                            <Search className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Search</span>
                        </button>

                        {/* Add (Center - Floating) */}
                        <button
                            onClick={onAddClick}
                            className="relative -top-4 size-16 bg-neutral-800 dark:bg-white rounded-full shadow-lg shadow-gray-500/30 flex items-center justify-center text-white dark:text-black active:scale-95 transition-transform"
                        >
                            <Plus className="size-7" />
                        </button>

                        {/* Folders */}
                        <button
                            onClick={() => setIsFoldersOpen(!isFoldersOpen)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isFoldersOpen || activeCategory !== null
                                ? "text-orange-500"
                                : "text-neutral-400"
                                }`}
                        >
                            <div className="relative">
                                <Folder className="w-6 h-6" />
                                {activeFolder && (
                                    <div
                                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900"
                                        style={{ backgroundColor: activeFolder.color }}
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-medium">
                                {activeFolder ? activeFolder.name.slice(0, 6) : "Folders"}
                            </span>
                        </button>

                        {/* Theme */}
                        <button
                            onClick={toggleTheme}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-400 transition-all"
                        >
                            {mounted && theme === "dark" ? (
                                <Moon className="size-6" />
                            ) : mounted && theme === "light" ? (
                                <Sun className="size-6" />
                            ) : (
                                <Laptop className="size-6" />
                            )}
                            <span className="text-[10px] font-medium">
                                {mounted ? (theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Auto") : "Theme"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Category Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <Modal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        title="Create Folder"
                        size="sm"
                    >
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                                placeholder="Folder name..."
                                autoFocus
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                            />
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewCategoryColor(color)}
                                        className={`w-8 h-8 rounded-lg ${newCategoryColor === color ? "ring-2 ring-offset-2 ring-neutral-400" : ""
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleCreateCategory}
                                disabled={!newCategoryName.trim()}
                                className="w-full py-3 bg-linear-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
};
