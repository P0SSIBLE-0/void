import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Item } from "@/types/item";

interface SaveItemParams {
  type: 'link' | 'text';
  value: string;
  category_id?: string | null;
}

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/save');
        const json = await res.json();
        if (json.success) {
          const promptItem: Item = { id: 'prompt', type: 'text', title: '', isPrompt: true };
          const normalizedData = json.data.map((item: Record<string, unknown>) => ({
            ...item,
            image: item.image || (item.meta as Record<string, unknown>)?.image,
            tags: Array.isArray(item.tags) ? item.tags : [],
            category_id: item.category_id || null,
          }));
          setItems([promptItem, ...normalizedData]);
        }
      } catch (error) {
        toast.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleSaveItem = async ({ type, value, category_id }: SaveItemParams) => {
    const payload = {
      type,
      url: type === 'link' ? value : `https://void.app/note/${Date.now()}`,
      note: type === 'text' ? value : undefined,
      category_id: category_id || null,
    };

    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save");
    }

    const { data } = await response.json();

    const newItem: Item = {
      id: data.id,
      type: data.type,
      title: data.title || 'Untitled',
      content: data.summary || data.content,
      url: data.url,
      image: data.meta?.image,
      summary: data.summary,
      meta: data.meta,
      tags: data.tags,
      category_id: data.category_id,
      created_at: data.created_at
    };

    setItems(prev => [prev[0], newItem, ...prev.slice(1)]);
    toast.success("Saved successfully!");
    return newItem;
  };

  const handleUpdateItem = (id: string | number, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteItem = (id: string | number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemCategory = async (id: string | number, categoryId: string | null) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId })
      });

      if (!res.ok) throw new Error("Failed to update category");

      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, category_id: categoryId } : item
      ));
      toast.success("Category updated");
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  return {
    items,
    loading,
    handleSaveItem,
    handleUpdateItem,
    handleDeleteItem,
    handleUpdateItemCategory,
  };
};
