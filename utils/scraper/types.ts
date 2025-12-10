/**
 * Scraper Types
 */

export type ContentType = 'website' | 'article' | 'video' | 'image' | 'product' | 'social' | 'pdf' | 'code';

export interface ScrapedData {
    url: string;
    type: 'link' | 'image' | 'text' | 'pdf';
    title: string;
    description: string;
    image: string | null;
    content: string;
    textContent: string;
    meta: {
        contentType: ContentType;
        siteName?: string;
        favicon?: string;
        canonicalUrl?: string;
        price?: string;
        currency?: string;
        author?: string;
        publishedTime?: string;
        readingTime?: number;
        videoUrl?: string;
        hasCode?: boolean;
    };
}

export interface FetchResult {
    html: string | null;
    method: 'direct' | 'scrapingant' | 'microlink';
    error?: string;
}

export interface MicrolinkData {
    title?: string;
    description?: string;
    image?: string;
    screenshot?: string;
    logo?: string;
    author?: string;
    publisher?: string;
}

export class ScraperError extends Error {
    constructor(
        message: string,
        public readonly code: 'FETCH_FAILED' | 'BLOCKED' | 'TIMEOUT' | 'PARSE_ERROR' | 'UNKNOWN'
    ) {
        super(message);
        this.name = 'ScraperError';
    }
}
