import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Item } from "@/types/item";

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
          const normalizedData = json.data.map((item: any) => ({
            ...item,
            image: item.image || item.meta?.image,
            tags: Array.isArray(item.tags) ? item.tags : [],
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

  const handleSaveItem = async ({ type, value }: { type: 'link' | 'text', value: string }) => {
    const payload = {
      type,
      url: type === 'link' ? value : `https://void.app/note/${Date.now()}`,
      note: type === 'text' ? value : undefined
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
      created_at: data.created_at
    };

    setItems(prev => [prev[0], newItem, ...prev.slice(1)]);
    toast.success("Saved successfully!");
  };

  const handleUpdateItem = (id: string | number, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteItem = (id: string | number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return {
    items,
    loading,
    handleSaveItem,
    handleUpdateItem,
    handleDeleteItem
  };
};
