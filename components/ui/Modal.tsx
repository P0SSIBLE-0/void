"use client";

import React from "react";
import * as motion from "motion/react-client";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showClose?: boolean;
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-6xl",
};

export const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    size = "md",
    showClose = true,
}: ModalProps) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-white dark:bg-neutral-900 w-full ${sizeClasses[size]} rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden`}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        {title && (
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                                {title}
                            </h2>
                        )}
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">{children}</div>
            </motion.div>
        </motion.div>
    );
};

// Confirm Dialog Modal
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "default";
    isLoading?: boolean;
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    isLoading = false,
}: ConfirmDialogProps) => {
    const variantStyles = {
        danger: "bg-red-500 hover:bg-red-600 text-white",
        warning: "bg-amber-500 hover:bg-amber-600 text-white",
        default: "bg-neutral-900 dark:bg-white hover:opacity-90 text-white dark:text-neutral-900",
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
            >
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        {message}
                    </p>
                </div>

                <div className="flex gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${variantStyles[variant]}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
