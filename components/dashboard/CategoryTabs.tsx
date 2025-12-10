"use client";

import { useState } from "react";
import { Folder, MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { Category, CATEGORY_COLORS } from "@/types/item";

interface CategoryTabsProps {
    categories: Category[];
    activeId: string | null;
    onSelect: (categoryId: string | null) => void;
    onCreate: (name: string, color: string) => Promise<Category>;
    onUpdate: (id: string, updates: Partial<Category>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export const CategoryTabs = ({
    categories,
    activeId,
    onSelect,
    onCreate,
    onUpdate,
    onDelete,
}: CategoryTabsProps) => {
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);

    const handleStartEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setMenuOpen(null);
    };

    const handleSaveEdit = async (id: string) => {
        if (editName.trim()) {
            await onUpdate(id, { name: editName.trim() });
        }
        setEditingId(null);
    };

    const handleCreate = async () => {
        if (newName.trim()) {
            await onCreate(newName.trim(), newColor);
            setNewName("");
            setNewColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
            setIsCreating(false);
        }
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {/* All Items Tab */}
            <button
                onClick={() => onSelect(null)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${activeId === null
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
            >
                <Folder className="w-4 h-4" />
                All
            </button>

            {/* Category Tabs */}
            {categories.map((cat) => (
                <div key={cat.id} className="relative shrink-0">
                    {editingId === cat.id ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleSaveEdit(cat.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(cat.id);
                                if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 border-2 border-primary focus:outline-none min-w-[100px]"
                        />
                    ) : (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(cat.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setMenuOpen(cat.id);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') onSelect(cat.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer select-none ${activeId === cat.id
                                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                }`}
                        >
                            <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate max-w-[120px]">{cat.name}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(menuOpen === cat.id ? null : cat.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 -mr-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
                            >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Context Menu */}
                    {menuOpen === cat.id && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden">
                                <button
                                    onClick={() => handleStartEdit(cat)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Rename
                                </button>
                                {/* Color picker */}
                                <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
                                    <div className="text-xs text-neutral-500 mb-2">Color</div>
                                    <div className="flex flex-wrap gap-1">
                                        {CATEGORY_COLORS.slice(0, 8).map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    onUpdate(cat.id, { color });
                                                    setMenuOpen(null);
                                                }}
                                                className={`w-4 h-4 rounded-full ${cat.color === color ? "ring-2 ring-offset-1 ring-neutral-400" : ""
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete "${cat.name}" folder? Items will be uncategorized.`)) {
                                            onDelete(cat.id);
                                        }
                                        setMenuOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-neutral-200 dark:border-neutral-800"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Create New Tab */}
            {isCreating ? (
                <div className="flex items-center gap-2 shrink-0">
                    <div
                        className="w-3 h-3 rounded-full cursor-pointer"
                        style={{ backgroundColor: newColor }}
                        onClick={() => {
                            const idx = CATEGORY_COLORS.indexOf(newColor);
                            setNewColor(CATEGORY_COLORS[(idx + 1) % CATEGORY_COLORS.length]);
                        }}
                    />
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreate();
                            if (e.key === "Escape") setIsCreating(false);
                        }}
                        placeholder="Folder name..."
                        autoFocus
                        className="px-3 py-2 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 border-2 border-primary focus:outline-none min-w-[120px]"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newName.trim()}
                        className="px-3 py-2 rounded-xl text-sm font-medium bg-primary text-white disabled:opacity-50"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => setIsCreating(false)}
                        className="px-3 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-700"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New folder
                </button>
            )}
        </div>
    );
};
