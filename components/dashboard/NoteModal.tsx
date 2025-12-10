"use client";

import React, { useState, useEffect } from "react";
import * as motion from "motion/react-client";
import { X, Trash2, Loader2, Tag, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Item, Category } from "@/types/item";
import { ConfirmDialog } from "@/components/ui/Modal";
import { CategorySelector } from "./CategorySelector";

interface NoteModalProps {
    item: Item | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string | number, updates: Partial<Item>) => void;
    onDelete: (id: string | number) => void;
    categories: Category[];
    onUpdateCategory: (id: string | number, categoryId: string | null) => Promise<void>;
    onCreateCategory: (name: string, color: string) => Promise<Category>;
}

export const NoteModal = ({
    item: initialItem,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    categories,
    onUpdateCategory,
    onCreateCategory,
}: NoteModalProps) => {
    const [item, setItem] = useState<Item | null>(initialItem);
    const [content, setContent] = useState(initialItem?.content || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setItem(initialItem);
        setContent(initialItem?.content || "");
    }, [initialItem]);

    if (!isOpen || !item) return null;

    const handleContentBlur = async () => {
        if (content !== item.content) {
            try {
                await fetch(`/api/items/${item.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ content }),
                });
                onUpdate(item.id, { content });
                toast.success("Note saved");
            } catch {
                toast.error("Failed to save note");
            }
        }
    };

    const handleCategoryChange = async (categoryId: string | null) => {
        await onUpdateCategory(item.id, categoryId);
        setItem({ ...item, category_id: categoryId });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
            if (res.ok) {
                onDelete(item.id);
                onClose();
                toast.success("Note deleted");
            }
        } catch {
            toast.error("Failed to delete note");
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-neutral-500">
                            {item.created_at
                                ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                                : "Just now"}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleContentBlur}
                        placeholder="Write your note..."
                        className="w-full min-h-[200px] bg-transparent text-neutral-900 dark:text-white text-lg leading-relaxed resize-none focus:outline-none placeholder:text-neutral-400"
                    />
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <CategorySelector
                        categories={categories}
                        selectedId={item.category_id || null}
                        onSelect={handleCategoryChange}
                        onCreate={onCreateCategory}
                        compact
                    />

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </motion.div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Note?"
                message="This note will be permanently deleted."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </motion.div>
    );
};
