"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
    LayoutGrid,
    LogOut,
    Moon,
    Sun,
    Laptop,
    Plus,
    Folder,
    ChevronRight,
    Pencil,
    Trash2,
} from "lucide-react";
import { Category, CATEGORY_COLORS, getRandomCategoryColor } from "@/types/item";
import { Modal } from "@/components/ui/Modal";

interface SidebarProps {
    categories: Category[];
    activeCategory: string | null;
    onSelectCategory: (id: string | null) => void;
    onCreateCategory: (name: string, color: string) => Promise<Category>;
    onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
    onAddClick: () => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const Sidebar = ({
    categories,
    activeCategory,
    onSelectCategory,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
    onAddClick,
    isExpanded,
    onToggle,
}: SidebarProps) => {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState(getRandomCategoryColor());
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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

    const handleUpdateCategory = async () => {
        if (editingCategory && editingCategory.name.trim()) {
            await onUpdateCategory(editingCategory.id, {
                name: editingCategory.name,
                color: editingCategory.color,
            });
            setEditingCategory(null);
        }
    };

    return (
        <>
            <aside
                className={`hidden lg:flex fixed left-0 top-0 h-screen flex-col border-r border-(--sidebar-border) dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 backdrop-blur-xl z-50 transition-all duration-300 ${isExpanded ? "w-64" : "w-20"
                    }`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-800">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-linear-to-br from-zinc-900 to-zinc-700 rounded-full flex items-center justify-center shadow-lg shadow-gray-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-bold text-lg bg-linear-to-r from-zinc-500 to-zinc-700 bg-clip-text text-transparent"
                            >
                                Void
                            </motion.span>
                        )}
                    </Link>
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <ChevronRight
                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {/* Quick Actions */}
                    <div className="mb-4">
                        <button
                            onClick={onAddClick}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium bg-linear-to-r from-zinc-900 to-gray-500 text-white shadow-lg shadow-gray-500/20 hover:shadow-gray-500/30 hover:to-zinc-800 transition-colors active:scale-100 ${!isExpanded && "justify-center"
                                }`}
                        >
                            <Plus className="w-5 h-5" />
                            {isExpanded && <span>Add New</span>}
                        </button>
                    </div>

                    {/* Divider */}
                    {isExpanded && (
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2">
                            Folders
                        </div>
                    )}

                    {/* All Items */}
                    <button
                        onClick={() => onSelectCategory(null)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${activeCategory === null
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                            } ${!isExpanded && "justify-center"}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                        {isExpanded && <span>All Items</span>}
                    </button>

                    {/* Categories */}
                    <AnimatePresence>
                        {categories.map((cat) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="group relative"
                            >
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectCategory(cat.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') onSelectCategory(cat.id);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer select-none ${activeCategory === cat.id
                                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                        } ${!isExpanded && "justify-center"}`}
                                >
                                    <div
                                        className="w-4 h-4 rounded-lg shrink-0"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    {isExpanded && (
                                        <>
                                            <span className="truncate flex-1 text-left">{cat.name}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCategory(cat);
                                                    }}
                                                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Delete "${cat.name}"?`)) {
                                                            onDeleteCategory(cat.id);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-md"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Create Category Button */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-2 border-dashed border-neutral-200 dark:border-neutral-700 ${!isExpanded && "justify-center"
                            }`}
                    >
                        <Folder className="w-5 h-5" />
                        {isExpanded && <span>New Folder</span>}
                    </button>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">

                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${!isExpanded && "justify-center"
                            }`}
                    >
                        {mounted && theme === "dark" ? (
                            <Moon className="w-5 h-5" />
                        ) : mounted && theme === "light" ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Laptop className="w-5 h-5" />
                        )}
                        {isExpanded && (
                            <span>{mounted ? (theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System") : "Theme"}</span>
                        )}
                    </button>

                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${!isExpanded && "justify-center"
                                }`}
                        >
                            <LogOut className="w-5 h-5" />
                            {isExpanded && <span>Sign Out</span>}
                        </button>
                    </form>
                </div>
            </aside>

            {/* Create Category Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <Modal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        title="Create New Folder"
                        size="sm"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Folder Name
                                </label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                                    placeholder="e.g., Design Inspiration"
                                    autoFocus
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewCategoryColor(color)}
                                            className={`w-8 h-8 rounded-lg transition-all ${newCategoryColor === color
                                                ? "ring-2 ring-offset-2 ring-neutral-400 scale-110"
                                                : "hover:scale-105"
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCreateCategory}
                                disabled={!newCategoryName.trim()}
                                className="w-full py-3 bg-linear-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Folder
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Edit Category Modal */}
            <AnimatePresence>
                {editingCategory && (
                    <Modal
                        isOpen={!!editingCategory}
                        onClose={() => setEditingCategory(null)}
                        title="Edit Folder"
                        size="sm"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Folder Name
                                </label>
                                <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) =>
                                        setEditingCategory({ ...editingCategory, name: e.target.value })
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && handleUpdateCategory()}
                                    autoFocus
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                setEditingCategory({ ...editingCategory, color })
                                            }
                                            className={`w-8 h-8 rounded-lg transition-all ${editingCategory.color === color
                                                ? "ring-2 ring-offset-2 ring-neutral-400 scale-110"
                                                : "hover:scale-105"
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateCategory}
                                disabled={!editingCategory.name.trim()}
                                className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                Save Changes
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
};
