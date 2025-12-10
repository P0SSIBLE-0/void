import React, { useState, useEffect } from "react";
import * as motion from "motion/react-client";
import { X, Link as LinkIcon, Loader2, Folder } from "lucide-react";
import { Category } from "@/types/item";
import { CategorySelector } from "./CategorySelector";

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { type: 'link' | 'text', value: string }) => Promise<unknown>;
    categories: Category[];
    activeCategory: string | null;
    onCreateCategory: (name: string, color: string) => Promise<Category>;
}

export const AddItemModal = ({
    isOpen,
    onClose,
    onSave,
    categories,
    activeCategory,
    onCreateCategory
}: AddItemModalProps) => {
    const [type, setType] = useState<'link' | 'text'>('link');
    const [inputValue, setInputValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const checkClipboard = async () => {
            if (isOpen && type === 'link' && !inputValue) {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                        setInputValue(text);
                    }
                } catch (err) {
                    // Ignore clipboard errors (permission denied etc)
                }
            }
        };
        checkClipboard();
    }, [isOpen, type, inputValue]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ type, value: inputValue });
            setInputValue("");
            onClose();
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsSaving(false);
        }
    };

    // Get active category name for display
    const activeCategoryName = activeCategory
        ? categories.find(c => c.id === activeCategory)?.name
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Add to Void</h2>
                        {activeCategoryName && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
                                <Folder className="w-3 h-3" />
                                Saving to "{activeCategoryName}"
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2 mb-6 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl">
                    <button
                        onClick={() => setType('link')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'link' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
                    >
                        Save Link
                    </button>
                    <button
                        onClick={() => setType('text')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'text' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
                    >
                        Create Note
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {type === 'link' ? (
                        <div className="mb-6">
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400" />
                                <input
                                    type="url"
                                    required
                                    placeholder="https://example.com"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <textarea
                                required
                                placeholder="What's on your mind?"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full h-32 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                                autoFocus
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving || !inputValue.trim()}
                        className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save to Void'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
