import React, { useState, useEffect, useRef } from "react";
import * as motion from "motion/react-client";
import { Globe, FileText, Search, X, Link as LinkIcon, Calendar, Tag, ExternalLink, Copy, Share2, Trash2, Clock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { Item } from "@/types/item";

function tryGetHostname(url: string) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'link';
    }
}

export const ItemPreviewModal = ({
    item: initialItem,
    isOpen,
    onClose,
    onUpdate,
    onDelete
}: {
    item: Item | null,
    isOpen: boolean,
    onClose: () => void,
    onUpdate: (id: string | number, updates: Partial<Item>) => void,
    onDelete: (id: string | number) => void
}) => {
    const [item, setItem] = useState<Item | null>(initialItem);
    const [notes, setNotes] = useState(initialItem?.content || "");
    const [newTag, setNewTag] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    // Update local state when initialItem changes
    useEffect(() => {
        setItem(initialItem);
        setNotes(initialItem?.content || "");
    }, [initialItem]);

    if (!isOpen || !item) return null;

    const displayImage = item.image || item.meta?.image;
    const hostname = item.url ? tryGetHostname(item.url) : '';

    const handleNotesBlur = async () => {
        if (notes !== item.content) {
            try {
                await fetch(`/api/items/${item.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ content: notes })
                });
                onUpdate(item.id, { content: notes });
                toast.success("Notes saved");
            } catch (error) {
                toast.error("Failed to save notes");
            }
        }
    };

    const handleAddTag = async () => {
        if (!newTag.trim()) return;
        const updatedTags = [...(item.tags || []), newTag.trim()];
        try {
            const res = await fetch(`/api/items/${item.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ tags: updatedTags })
            });
            if (res.ok) {
                setItem({ ...item, tags: updatedTags });
                onUpdate(item.id, { tags: updatedTags });
                setNewTag("");
                setIsAddingTag(false);
                toast.success("Tag added");
            }
        } catch (error) {
            toast.error("Failed to add tag");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const updatedTags = (item.tags || []).filter(t => t !== tagToRemove);
        try {
            await fetch(`/api/items/${item.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ tags: updatedTags })
            });
            setItem({ ...item, tags: updatedTags });
            onUpdate(item.id, { tags: updatedTags });
            toast.success("Tag removed");
        } catch (error) {
            toast.error("Failed to remove tag");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
            if (res.ok) {
                onDelete(item.id);
                onClose();
                toast.success("Item deleted");
            } else {
                throw new Error("Failed");
            }
        } catch (error) {
            toast.error("Failed to delete item");
            setIsDeleting(false);
        }
    };

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-neutral-950/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-100 dark:bg-secondary w-full max-w-7xl h-[85dvh] rounded-[24px] overflow-hidden shadow-xl flex flex-col md:flex-row border border-white/20 dark:bg-dark/80 ring-1 ring-black/5"
            >
                {/* Left: Visual Content (Browser-like container) */}
                <div className="w-full md:w-[65%] h-[30%] md:h-full bg-[#e4e5e9] dark:bg-dark/80 relative flex flex-col border-0 lg:md:border-r lg:md:border-neutral-300/50 shrink-0">
                    {/* Fake Browser Bar */}
                    {displayImage && (
                        <div className="absolute top-5 hidden md:lg:block left-6 right-6 h-auto z-10">
                            <div className="bg-neutral-900/90 backdrop-blur-md rounded-sm px-4 py-3 shadow-xl flex items-center gap-4">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                                </div>
                                <div className="h-4 w-px bg-white/10 mx-1" />
                                <Search className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="text-xs font-medium text-neutral-300 truncate max-w-[300px]">
                                    {item.url || 'Local Note'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Image Container - Dynamic Sizing based on Aspect Ratio */}
                    <div className="flex-1 p-2 md:p-10 flex items-center justify-center overflow-hidden relative">
                        {displayImage ? (
                            <div
                                className="relative h-full w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-black flex items-center justify-center"
                            >
                                <motion.img
                                    ref={imageRef}
                                    src={displayImage}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                />

                                {item.url && (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-6 left-6 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} className="w-4 h-4 bg-white rounded-full p-0.5" alt="" />
                                        {tryGetHostname(item.url)}
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center text-neutral-300 p-12 text-center border border-neutral-200">
                                <FileText className="w-24 h-24 mb-6 opacity-20" />
                                <p className="text-lg font-medium opacity-50">No visual preview available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Details & Notes (Sidebar style) */}
                <div className="w-full flex-1 md:h-full md:w-[35%] bg-[#f8f9fa] dark:bg-dark flex flex-col relative overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar pb-7 overscroll-contain touch-pan-y">

                        {/* Meta Header */}
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-800 dark:text-white leading-tight mb-2">
                                    {item.title}
                                </h2>
                                <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 dark:text-neutral-600">
                                    <span>{item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'Just now'}</span>
                                    {hostname && (
                                        <>
                                            <span>•</span>
                                            <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" />
                                                {hostname}
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TLDR Section */}
                        {item.summary && (
                            <div className="mb-8 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <h4 className="text-primary text-[10px] font-bold uppercase tracking-widest">TLDR</h4>
                                    <div className="h-px flex-1 bg-primary/20" />
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-600 text-sm leading-relaxed dark:bg-dark/80">
                                    {item.summary}
                                </div>
                            </div>
                        )}

                        {/* Tags Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Mind Tags</h4>
                                <div className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 font-bold">?</div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {isAddingTag ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddTag();
                                                if (e.key === 'Escape') setIsAddingTag(false);
                                            }}
                                            autoFocus
                                            placeholder="Tag name..."
                                            className="flex-1 bg-white border border-primary rounded-xl px-3 py-1.5 text-sm focus:outline-none text-neutral-700"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingTag(true)}
                                        className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add tag
                                    </button>
                                )}

                                {item.tags && item.tags.map((tag, i) => (
                                    <span key={i} className="group px-3 py-1.5 rounded-xl bg-[#e9ecef] dark:bg-neutral-800 dark:text-neutral-300 text-neutral-500 text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer border border-transparent hover:border-red-100 flex items-center gap-1" onClick={() => handleRemoveTag(tag)}>
                                        {tag.startsWith('#') ? tag.substring(1) : tag}
                                        <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </span>
                                ))}
                                {/* Type Badge */}
                                <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs font-medium flex items-center gap-1">
                                    {item.type === 'link' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    {item.meta?.original_category || item.type}
                                </span>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Mind Notes</h4>
                                <div className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 font-bold">?</div>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder="Type here to add a note..."
                                className="w-full min-h-[120px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-sm text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm no-scrollbar"
                            />
                        </div>
                    </div>

                    {/* Bottom Toolbar (Floating-ish) */}
                    <div className="p-2 px-3 flex justify-center gap-3 absolute w-fit mx-auto rounded-full bottom-2 left-0 right-0 bg-white/30 dark:bg-neutral-700/30 backdrop-blur-md">
                        <button className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center text-neutral-400 hover:text-primary hover:border-primary/30 transition-all" title="Share">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(item.url || item.content || '');
                                toast.success('Copied to clipboard!');
                            }}
                            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center text-neutral-400 hover:text-primary hover:border-primary/30 transition-all"
                            title="Copy"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Delete"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};