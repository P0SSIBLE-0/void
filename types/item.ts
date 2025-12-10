// Item type for the dashboard
export type Item = {
  id: string | number;
  type: 'link' | 'image' | 'text' | 'pdf';
  title: string;
  content?: string;
  summary?: string;
  url?: string;
  image?: string;
  meta?: Record<string, unknown>;
  tags?: string[];
  category_id?: string | null;
  isPrompt?: boolean;
  created_at?: string;
};

// Category type
export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
};

// Predefined colors for category selection
export const CATEGORY_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
];

// Get random category color
export function getRandomCategoryColor(): string {
  return CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
}
