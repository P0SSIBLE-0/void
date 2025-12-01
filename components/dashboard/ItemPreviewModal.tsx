import React, { useState, useEffect, useRef } from "react";
import * as motion from "motion/react-client";
import {
    Globe, FileText, Search, X, Link as LinkIcon, Calendar, Tag, ExternalLink,
    Copy, Share2, Trash2, Clock, Plus, Loader2, Image as ImageIcon, Type, MoreHorizontal, CreditCard, Layout
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { Item } from "@/types/item";

// --- Helper Functions ---
function tryGetHostname(url: string) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'link';
    }
}

function getFaviconUrl(item: Item): string {
    if (item.meta?.favicon) return item.meta.favicon;
    if (item.url) {
        try {
            const url = new URL(item.url);
            return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
        } catch { }
    }
    return "";
}

// --- Components ---

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
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        setItem(initialItem);
        setNotes(initialItem?.content || "");
    }, [initialItem]);

    if (!isOpen || !item) return null;

    const displayImage = item.image || item.meta?.image;
    const hostname = item.url ? tryGetHostname(item.url) : '';
    const favicon = getFaviconUrl(item);
    const price = item.meta?.price;
    const currency = item.meta?.currency || '';

    // --- Handlers ---

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
        const currentTags = item.tags || [];
        if (currentTags.includes(newTag.trim())) {
            setNewTag("");
            return;
        }

        const updatedTags = [...currentTags, newTag.trim()];
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

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImageSize({ width: naturalWidth, height: naturalHeight });
    };

    // --- Render ---

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-(--background) w-full max-w-6xl h-[90vh] sm:h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-neutral-200 dark:border-neutral-800 ring-1 ring-black/5"
            >
                {/* --- LEFT: Visual Content --- */}
                <div className="w-full lg:w-[60%] h-[40%] lg:h-full bg-neutral-100/50 dark:bg-neutral-900/50 relative flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800">

                    {/* Header (Mobile Only Close) */}
                    <div className="absolute top-4 right-4 z-20 lg:hidden">
                        <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8 overflow-hidden group">
                        {displayImage ? (
                            <>
                                {/* Blurred Background for Fill */}
                                <div
                                    className="absolute inset-0 opacity-20 dark:opacity-10 blur-3xl scale-110 pointer-events-none"
                                    style={{
                                        backgroundImage: `url(${displayImage})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover'
                                    }}
                                />

                                {/* Main Image */}
                                <motion.img
                                    layoutId={`image-${item.id}`}
                                    src={displayImage}
                                    alt={item.title}
                                    onLoad={handleImageLoad}
                                    className="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-lg ring-1 ring-black/10 dark:ring-white/10"
                                />

                                {/* Image Metadata Overlay (Desktop) */}
                                {imageSize && (
                                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                        {imageSize.width} × {imageSize.height}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-neutral-400 gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No preview image</p>
                            </div>
                        )}

                        {/* Source Floating Pill */}
                        {item.url && (
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 z-20 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border border-white/20 dark:border-neutral-700 text-(--foreground) pl-1.5 pr-4 py-1.5 rounded-full text-xs font-medium shadow-lg hover:scale-105 transition-transform flex items-center gap-2 group/link"
                            >
                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-black flex items-center justify-center overflow-hidden shrink-0">
                                    {favicon ? (
                                        <img src={favicon} alt="" className="w-4 h-4 object-cover" />
                                    ) : (
                                        <Globe className="w-3.5 h-3.5 text-neutral-500" />
                                    )}
                                </div>
                                <span className="truncate max-w-[150px]">{hostname}</span>
                                <ExternalLink className="w-3 h-3 opacity-50 group-hover/link:opacity-100 transition-opacity ml-auto" />
                            </a>
                        )}
                    </div>
                </div>

                {/* --- RIGHT: Details & Notes --- */}
                <div className="w-full lg:w-[40%] h-[60%] lg:h-full bg-(--background) flex flex-col relative">

                    {/* Toolbar Header */}
                    <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                {item.type === 'link' ? <Globe className="w-3 h-3" /> : item.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                                {item.meta?.subtype || item.type}
                            </div>
                            {price && (
                                <div className="px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                                    <CreditCard className="w-3 h-3" />
                                    {currency} {price}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <button onClick={onClose} className="hidden lg:flex w-8 h-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Title & Info */}
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-(--foreground) leading-tight mb-3">
                                {item.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 rounded-md">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'Just now'}
                                </span>
                                {item.meta?.site_name && (
                                    <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 rounded-md">
                                        <Layout className="w-3.5 h-3.5" />
                                        {item.meta.site_name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Summary / Description */}
                        {(item.summary || item.content) && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                    <FileText className="w-3 h-3" />
                                    About
                                </div>
                                <div className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                    {item.summary || item.content?.slice(0, 300)}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                <Tag className="w-3 h-3" />
                                Tags
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="group pl-3 pr-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-1 border border-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all cursor-pointer"
                                        onClick={() => handleRemoveTag(tag)}
                                    >
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                        <X className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                    </span>
                                ))}

                                {isAddingTag ? (
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddTag();
                                            if (e.key === 'Escape') setIsAddingTag(false);
                                        }}
                                        onBlur={() => { if (!newTag) setIsAddingTag(false); }}
                                        autoFocus
                                        className="bg-transparent border border-primary text-primary rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none min-w-[80px]"
                                        placeholder="New tag..."
                                    />
                                ) : (
                                    <button
                                        onClick={() => setIsAddingTag(true)}
                                        className="px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notes Input */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                <MoreHorizontal className="w-3 h-3" />
                                Personal Notes
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder="Add your thoughts, ideas, or key takeaways..."
                                className="w-full min-h-[150px] bg-neutral-50 dark:bg-neutral-900/50 border-0 rounded-xl p-4 text-sm text-(--foreground) placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-(--background)/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (item.url) {
                                            navigator.clipboard.writeText(item.url);
                                            toast.success("Link copied");
                                        }
                                    }}
                                    className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                                    title="Copy Link"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                                    title="Share"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-neutral-600 dark:text-neutral-400 text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                <span>Delete Item</span>
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};
