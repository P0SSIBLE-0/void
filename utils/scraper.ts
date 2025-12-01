import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import {
  extractTitle,
  extractDescription,
  extractCanonical,
  extractPrice,
  extractImage,
  extractFavicon,
  extractAuthor,
  extractPublishedTime,
  extractSiteName,
  detectType,
  estimateReadingTime
} from './scraper-helpers';

// --- Types ---

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  type: 'link' | 'image' | 'text' | 'pdf';
  content: string; // Cleaned HTML
  textContent: string; // Cleaned Text (for AI)
  meta: {
    subtype?: 'article' | 'product' | 'video' | 'website' | 'tool';
    site_name?: string;
    favicon?: string;
    canonical_url?: string;
    price?: string;
    currency?: string;
    author?: string;
    published_time?: string;
    reading_time?: number;
    has_code?: boolean;
    video_url?: string;
  };
}

// --- Configuration ---

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
const TIMEOUT_MS = 10000;

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  console.log(`[Scraper] Fetching: ${url}`);

  try {
    // 1. Fetch HTML
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok && response.status !== 403) { // Allow 403 to try extracting from potential error page content if any, or just fail
      if (response.status >= 500) throw new Error(`Status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Extraction
    const title = extractTitle($, url);
    const description = extractDescription($);
    const { price, currency } = extractPrice($);
    const image = extractImage($, url);
    const subtype = detectType($, url, price);

    // 3. Readability (Conditional)
    let content = '';
    let textContent = '';
    let reading_time = 0;

    // Only run heavy Readability for articles or if description is missing
    if (subtype === 'article' || (subtype === 'website' && description.length < 50)) {
      try {
        // Using linkedom instead of jsdom for better serverless compatibility
        const { document } = parseHTML(html);

        // Cast linkedom document to any because Readability types expect strict DOM Document
        const reader = new Readability(document as any);
        const article = reader.parse();

        if (article) {
          content = article.content || '';
          textContent = article.textContent || '';
          reading_time = estimateReadingTime(textContent);
        }
      } catch (e) {
        console.warn('[Scraper] Readability failed, falling back to body text', e);
      }
    }

    // Fallback if Readability didn't run or failed
    if (!textContent) {
      // Remove scripts/styles for cleaner text
      $('script, style, nav, footer, header, aside, noscript').remove();
      textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
      content = description || textContent.substring(0, 200);
    }

    return {
      url,
      type: 'link',
      title,
      description,
      content,
      textContent,
      image,
      meta: {
        subtype,
        site_name: extractSiteName($),
        favicon: extractFavicon($, url),
        canonical_url: extractCanonical($, url),
        price,
        currency,
        author: extractAuthor($),
        published_time: extractPublishedTime($),
        reading_time: reading_time || estimateReadingTime(textContent),
        has_code: $('pre code').length > 0,
        video_url: subtype === 'video' ? url : undefined
      }
    };

  } catch (error) {
    console.error(`[Scraper] Failed: ${error}`);
    return {
      url,
      type: 'link',
      title: url,
      description: 'Failed to scrape',
      image: null,
      content: '',
      textContent: '',
      meta: { subtype: 'website' }
    };
  }
}
