/**
 * Smart URL Scraper
 * 
 * Modular scraper that:
 * 1. Detects blocked/anti-bot responses and falls back to ScrapingAnt
 * 2. Prioritizes OG/meta data
 * 3. Uses Microlink for screenshots when needed
 */

import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

import type { ScrapedData, ContentType, MicrolinkData } from './types';
import { ScraperError } from './types';
import { smartFetch, fetchWithMicrolink } from './fetchers';

// ============================================================================
// Main Scraper Function
// ============================================================================

export async function scrapeUrl(url: string): Promise<ScrapedData> {
    console.log(`[Scraper] Starting: ${url}`);

    try {
        // 1. Check if it's a direct media URL
        if (isDirectMedia(url)) {
            return handleDirectMedia(url);
        }

        // 2. Detect expected content type
        const contentType = detectContentType(url);

        // 3. Fetch HTML with smart fallback (direct → ScrapingAnt)
        const fetchResult = await smartFetch(url);

        // 4. If fetch failed completely, use Microlink as LAST RESORT
        if (!fetchResult.html) {
            console.warn(`[Scraper] All fetch methods failed: ${fetchResult.error}`);
            return await handleMicrolinkFallback(url, contentType, fetchResult.error);
        }

        // 5. Parse and extract data (OG data is prioritized in extractAllData)
        const $ = cheerio.load(fetchResult.html);
        const data = extractAllData($, url, contentType);

        console.log(`[Scraper] Done via ${fetchResult.method}`);
        return data;

    } catch (error) {
        console.error('[Scraper] Unexpected error:', error);

        if (error instanceof ScraperError) {
            throw error;
        }

        // Return fallback data instead of throwing
        return createFallbackData(url, error instanceof Error ? error.message : 'Unknown error');
    }
}

// ============================================================================
// URL Analysis
// ============================================================================

function isDirectMedia(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|pdf)(\?|$)/i.test(url);
}

function detectContentType(url: string): ContentType {
    const lower = url.toLowerCase();

    if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|imdb\.com\/title/.test(lower)) return 'video';
    if (/twitter\.com|x\.com|instagram\.com|facebook\.com|linkedin\.com|reddit\.com/.test(lower)) return 'social';
    if (/github\.com|gitlab\.com|codepen\.io|codesandbox\.io/.test(lower)) return 'code';
    if (/\/product\/|\/p\/|\/dp\/|\/item\/|amazon\.|flipkart\.|ebay\./.test(lower)) return 'product';
    if (/\/blog\/|\/article\/|\/post\/|medium\.com|substack\.com/.test(lower)) return 'article';
    if (/\.pdf(\?|$)/i.test(lower)) return 'pdf';

    return 'website';
}

// ============================================================================
// Data Extraction
// ============================================================================

function extractAllData($: cheerio.CheerioAPI, url: string, contentType: ContentType): ScrapedData {
    // OG/Meta tags first (highest priority)
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content');
    const ogSite = $('meta[property="og:site_name"]').attr('content');
    const ogVideo = $('meta[property="og:video"]').attr('content');

    // Fallback extraction
    const title = ogTitle || $('title').text().trim() || extractTitleFromUrl(url);
    const description = ogDesc || extractDescriptionFallback($);
    const image = normalizeUrl(ogImage, url) || extractBestImage($, url);

    // Content extraction for articles
    let textContent = '';
    let content = '';
    let readingTime = 0;

    if (contentType === 'article' || (contentType === 'website' && !ogDesc)) {
        const article = extractReadableContent($);
        textContent = article.textContent;
        content = article.content;
        readingTime = Math.ceil(textContent.split(/\s+/).length / 200);
    }

    // Fallback text content
    if (!textContent) {
        $('script, style, nav, footer, header, aside').remove();
        textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    // Price extraction
    const { price, currency } = extractPrice($);

    // Detect actual content type from OG
    let finalType = contentType;
    if (ogType?.includes('video')) finalType = 'video';
    else if (ogType === 'product' || price) finalType = 'product';
    else if (ogType === 'article') finalType = 'article';

    return {
        url,
        type: finalType === 'pdf' ? 'pdf' : finalType === 'image' ? 'image' : 'link',
        title,
        description,
        image: isValidImage(image) ? image : null,
        content,
        textContent,
        meta: {
            contentType: finalType,
            siteName: ogSite,
            favicon: extractFavicon($, url),
            canonicalUrl: $('link[rel="canonical"]').attr('href') || url,
            price,
            currency,
            author: $('meta[name="author"]').attr('content'),
            publishedTime: $('meta[property="article:published_time"]').attr('content'),
            readingTime: readingTime || undefined,
            videoUrl: ogVideo || (finalType === 'video' ? url : undefined),
            hasCode: $('pre code').length > 0,
        },
    };
}

function extractDescriptionFallback($: cheerio.CheerioAPI): string {
    // Try JSON-LD
    let desc = '';
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            if (json.description) desc = json.description;
        } catch { /* ignore */ }
    });
    return desc ? desc.substring(0, 500) : '';
}

function extractBestImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
    // JSON-LD first
    let jsonImage: string | null = null;
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            const img = json.image || json.thumbnailUrl;
            if (img) jsonImage = typeof img === 'string' ? img : (Array.isArray(img) ? img[0] : img.url);
        } catch { /* ignore */ }
    });
    if (jsonImage && isValidImage(jsonImage)) return normalizeUrl(jsonImage, baseUrl);

    // Score DOM images
    let best: string | null = null;
    let maxScore = 0;

    $('img').each((_, el) => {
        const $img = $(el);
        const src = $img.attr('src') || $img.attr('data-src');
        if (!src) return;

        const normalized = normalizeUrl(src, baseUrl);
        if (!normalized || !isValidImage(normalized)) return;

        let score = 0;
        const width = parseInt($img.attr('width') || '0');
        const height = parseInt($img.attr('height') || '0');

        if (width * height > 5000) score += 100;
        if ($img.closest('article, main, [role="main"]').length) score += 50;
        if ($img.closest('header, nav, footer, aside').length) score -= 100;

        const cls = ($img.attr('class') || '').toLowerCase();
        if (cls.includes('hero') || cls.includes('feature') || cls.includes('cover')) score += 75;

        if (score > maxScore) {
            maxScore = score;
            best = normalized;
        }
    });

    return best;
}

function extractPrice($: cheerio.CheerioAPI): { price?: string; currency?: string } {
    let price = $('meta[property="product:price:amount"]').attr('content') ||
        $('meta[property="og:price:amount"]').attr('content');
    let currency = $('meta[property="product:price:currency"]').attr('content') || 'USD';

    if (!price) {
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html() || '{}');
                if (json['@type'] === 'Product' && json.offers) {
                    const offer = Array.isArray(json.offers) ? json.offers[0] : json.offers;
                    price = offer.price;
                    currency = offer.priceCurrency || currency;
                }
            } catch { /* ignore */ }
        });
    }

    return { price: price ? String(price) : undefined, currency };
}

function extractFavicon($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const href = $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        $('link[rel="apple-touch-icon"]').attr('href');

    if (href) return normalizeUrl(href, baseUrl) || undefined;

    try {
        return new URL('/favicon.ico', baseUrl).href;
    } catch {
        return undefined;
    }
}

function extractReadableContent($: cheerio.CheerioAPI): { content: string; textContent: string } {
    try {
        const html = $.html();
        const { document } = parseHTML(html);
        const reader = new Readability(document as unknown as Document);
        const article = reader.parse();
        return {
            content: article?.content || '',
            textContent: article?.textContent || '',
        };
    } catch {
        return { content: '', textContent: '' };
    }
}

// ============================================================================
// Utilities
// ============================================================================

function normalizeUrl(url: string | undefined, base: string): string | null {
    if (!url) return null;
    try {
        if (url.startsWith('data:')) return url;
        if (url.startsWith('//')) return `https:${url}`;
        return new URL(url, base).href;
    } catch {
        return null;
    }
}

function isValidImage(url: string | null): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();

    if (lower.endsWith('.svg') || lower.includes('placeholder') ||
        lower.includes('1x1.') || lower.includes('spacer')) {
        return false;
    }

    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) ||
        /ytimg\.com|twimg\.com|cdninstagram|imgur\.com|media-amazon|flixcart|unsplash/.test(lower);
}

function extractTitleFromUrl(url: string): string {
    try {
        const u = new URL(url);
        const path = u.pathname.split('/').filter(Boolean).pop();
        if (path) return path.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return u.hostname;
    } catch {
        return 'Untitled';
    }
}

// ============================================================================
// Fallback Handlers
// ============================================================================

function handleDirectMedia(url: string): ScrapedData {
    const isPdf = url.toLowerCase().endsWith('.pdf');
    return {
        url,
        type: isPdf ? 'pdf' : 'image',
        title: extractTitleFromUrl(url),
        description: '',
        image: isPdf ? null : url,
        content: '',
        textContent: '',
        meta: { contentType: isPdf ? 'pdf' : 'image' },
    };
}

async function handleMicrolinkFallback(
    url: string,
    contentType: ContentType,
    error?: string
): Promise<ScrapedData> {
    console.log('[Scraper] Using Microlink fallback');

    const microlink = await fetchWithMicrolink(url, true);

    if (microlink) {
        return {
            url,
            type: 'link',
            title: microlink.title || extractTitleFromUrl(url),
            description: microlink.description || '',
            image: microlink.screenshot || microlink.image || null,
            content: '',
            textContent: '',
            meta: {
                contentType,
                siteName: microlink.publisher,
                author: microlink.author,
                favicon: microlink.logo,
            },
        };
    }

    return createFallbackData(url, error);
}

function createFallbackData(url: string, error?: string): ScrapedData {
    return {
        url,
        type: 'link',
        title: extractTitleFromUrl(url),
        description: error ? `Could not fetch: ${error}` : 'Failed to scrape content',
        image: null,
        content: '',
        textContent: '',
        meta: { contentType: 'website' },
    };
}

// Re-export types
export type { ScrapedData, ContentType } from './types';
export { ScraperError } from './types';
