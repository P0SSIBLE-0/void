"use client";

import { useState } from "react";
import { Folder, Plus, Check, ChevronDown } from "lucide-react";
import { Category, CATEGORY_COLORS, getRandomCategoryColor } from "@/types/item";

interface CategorySelectorProps {
    categories: Category[];
    selectedId: string | null;
    onSelect: (categoryId: string | null) => void;
    onCreate: (name: string, color: string) => Promise<Category>;
    compact?: boolean;
}

export const CategorySelector = ({
    categories,
    selectedId,
    onSelect,
    onCreate,
    compact = false,
}: CategorySelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(getRandomCategoryColor());

    const selectedCategory = categories.find(c => c.id === selectedId);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const created = await onCreate(newName.trim(), newColor);
            onSelect(created.id);
            setNewName("");
            setNewColor(getRandomCategoryColor());
            setIsCreating(false);
            setIsOpen(false);
        } catch {
            // Error handled in hook
        }
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${selectedCategory
                    ? "border-transparent bg-neutral-100 dark:bg-neutral-800"
                    : "border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400"
                    } ${compact ? "text-xs" : "text-sm"}`}
            >
                {selectedCategory ? (
                    <>
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedCategory.color }}
                        />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {selectedCategory.name}
                        </span>
                    </>
                ) : (
                    <>
                        <Folder className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-500">Add to folder</span>
                    </>
                )}
                <ChevronDown className="w-3 h-3 text-neutral-400 ml-1" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            setIsOpen(false);
                            setIsCreating(false);
                        }}
                    />
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
                        {/* Category List */}
                        <div className="max-h-48 overflow-y-auto p-1">
                            {/* None option */}
                            <button
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${!selectedId
                                    ? "bg-neutral-100 dark:bg-neutral-800"
                                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    }`}
                            >
                                <div className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-600" />
                                <span className="text-neutral-600 dark:text-neutral-400">No folder</span>
                                {!selectedId && <Check className="w-4 h-4 ml-auto text-primary" />}
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        onSelect(cat.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${selectedId === cat.id
                                        ? "bg-neutral-100 dark:bg-neutral-800"
                                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                        }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                        {cat.name}
                                    </span>
                                    {selectedId === cat.id && (
                                        <Check className="w-4 h-4 ml-auto text-primary shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-neutral-200 dark:border-neutral-800" />

                        {/* Create New */}
                        {isCreating ? (
                            <div className="p-3 space-y-3">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                    placeholder="Folder name..."
                                    autoFocus
                                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORY_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewColor(color)}
                                            className={`w-5 h-5 rounded-full transition-transform ${newColor === color ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : ""
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newName.trim()}
                                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg disabled:opacity-50"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create new folder
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
