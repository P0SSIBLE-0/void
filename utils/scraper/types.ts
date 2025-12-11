export type ContentType = 'link' | 'image' | 'text' | 'pdf' | 'video' | 'product';

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  type: ContentType;
  image?: string;
  favicon?: string;
  siteName?: string;
  author?: string;
  publishedTime?: string;
  price?: string;
  currency?: string;
  content?: string;
  textContent?: string;
  canonicalUrl?: string;
  readingTime?: number; // in minutes
  videoUrl?: string;
}

export class ScraperError extends Error {
  constructor(public message: string, public code: string = 'UNKNOWN_ERROR', public url?: string) {
    super(message);
    this.name = 'ScraperError';
  }
}
