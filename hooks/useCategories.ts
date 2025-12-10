import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Category, getRandomCategoryColor } from "@/types/item";

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const json = await res.json();
                if (json.success) {
                    setCategories(json.data);
                }
            } catch (error) {
                console.error("Failed to load categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Create category
    const createCategory = useCallback(async (name: string, color?: string) => {
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    color: color || getRandomCategoryColor()
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Failed to create category");
            }

            setCategories(prev => [...prev, json.data]);
            toast.success(`Category "${name}" created`);
            return json.data as Category;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create category";
            toast.error(message);
            throw error;
        }
    }, []);

    // Update category
    const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!res.ok) throw new Error("Failed to update category");

            const json = await res.json();
            setCategories(prev => prev.map(c => c.id === id ? json.data : c));
            toast.success("Category updated");
        } catch (error) {
            toast.error("Failed to update category");
            throw error;
        }
    }, []);

    // Delete category
    const deleteCategory = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

            if (!res.ok) throw new Error("Failed to delete category");

            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success("Category deleted");
        } catch (error) {
            toast.error("Failed to delete category");
            throw error;
        }
    }, []);

    // Get category by ID
    const getCategoryById = useCallback((id: string | null | undefined) => {
        if (!id) return null;
        return categories.find(c => c.id === id) || null;
    }, [categories]);

    return {
        categories,
        loading,
        createCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
    };
};
