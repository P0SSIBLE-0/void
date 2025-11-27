export type Item = {
  id: string | number;
  type: 'link' | 'image' | 'text' | 'pdf';
  title: string;
  content?: string;
  summary?: string;
  url?: string;
  image?: string;
  meta?: any;
  tags?: string[];
  isPrompt?: boolean;
  created_at?: string;
};
