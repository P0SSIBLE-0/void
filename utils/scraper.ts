import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

// --- Types ---

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  type: 'link' | 'image' | 'text' | 'pdf';
  content: string; // Cleaned HTML
  textContent: string; // Cleaned Text (for AI)
  
  // Enhanced Meta (to be stored in jsonb)
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

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT_MS = 10000;

// --- Helpers ---

function normalizeUrl(url: string | undefined | null, baseUrl: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    if (url.startsWith('data:')) return null; // Skip data URIs for main images usually
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

function truncate(str: string | undefined | null, length: number): string {
  if (!str) return '';
  const cleaned = str.replace(/\s+/g, ' ').trim();
  return cleaned.length > length ? cleaned.substring(0, length) + '...' : cleaned;
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// --- Extraction Logic ---

function extractPrice($: cheerio.CheerioAPI): { price?: string; currency?: string } {
  // 1. OpenGraph / Meta tags
  let price = $('meta[property="product:price:amount"]').attr('content') ||
              $('meta[property="og:price:amount"]').attr('content');
  let currency = $('meta[property="product:price:currency"]').attr('content') ||
                 $('meta[property="og:price:currency"]').attr('content') ||
                 'USD';

  // 2. JSON-LD (Product)
  if (!price) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offer.price) {
              price = offer.price;
              currency = offer.priceCurrency || currency;
              return false; // break
            }
          }
        }
      } catch {}
    });
  }
  
  return { price: price ? String(price) : undefined, currency: currency ? String(currency) : undefined };
}

function extractImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // 1. Open Graph (Highest Priority)
  let image = $('meta[property="og:image"]').attr('content') ||
              $('meta[property="og:image:secure_url"]').attr('content') ||
              $('meta[name="twitter:image"]').attr('content') ||
              $('meta[name="twitter:image:src"]').attr('content');

  // 2. Link Rel
  if (!image) image = $('link[rel="image_src"]').attr('href');

  // 3. JSON-LD
  if (!image) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item.image) {
             const img = Array.isArray(item.image) ? item.image[0] : item.image;
             if (typeof img === 'string') image = img;
             else if (img.url) image = img.url;
             if (image) return false;
          }
        }
      } catch {}
    });
  }

  // 4. Largest Image on Page (Fallback)
  if (!image) {
    let maxScore = 0;
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (!src || src.endsWith('.svg') || src.startsWith('data:')) return;
      
      // Simple heuristic scoring
      let width = parseInt($(el).attr('width') || '0');
      let height = parseInt($(el).attr('height') || '0');
      
      // If no dimensions, assume it's small unless it's in a main container
      let score = width * height;
      
      // Boost if inside generic main containers
      if ($(el).parents('article, main, [role="main"]').length > 0) score += 10000;
      
      // Penalize if in nav/footer
      if ($(el).parents('nav, footer, header, aside').length > 0) score -= 10000;

      if (score > maxScore) {
        maxScore = score;
        image = src;
      }
    });
  }

  return normalizeUrl(image, baseUrl);
}

function detectType($: cheerio.CheerioAPI, url: string, price?: string): ScrapedData['meta']['subtype'] {
  const ogType = $('meta[property="og:type"]').attr('content');
  
  // 1. Explicit Video
  if (ogType?.includes('video') || url.match(/(youtube\.com|vimeo\.com|youtu\.be)/)) return 'video';
  
  // 2. Product (has price or type=product)
  if (price || ogType === 'product') return 'product';
  
  // 3. Article
  if (ogType === 'article') return 'article';
  
  // 4. Tool detection (Naive heuristic)
  const title = $('title').text().toLowerCase();
  const desc = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
  if (
    title.includes('generator') || title.includes('converter') || title.includes('calculator') || 
    title.includes('formatter') || desc.includes('tool to') || desc.includes('online tool')
  ) {
    return 'tool';
  }

  return 'website';
}

// --- Main Function ---

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  console.log(`[Scraper] Fetching: ${url}`);
  
  try {
    // 1. Fetch HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const html = await response.text();
    
    // 2. Load into Cheerio (for fast meta parsing)
    const $ = cheerio.load(html);
    
    // 3. Basic Meta
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('title').text() || 
                  'Untitled';
                  
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content') || 
                        '';
                        
    const site_name = $('meta[property="og:site_name"]').attr('content');
    const canonical_url = $('link[rel="canonical"]').attr('href') || url;
    const author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content');
    const published_time = $('meta[property="article:published_time"]').attr('content');
    
    // 4. Favicon
    let faviconUrl = $('link[rel="icon"]').attr('href') || 
                  $('link[rel="shortcut icon"]').attr('href') || 
                  $('link[rel="apple-touch-icon"]').attr('href');
    let favicon = normalizeUrl(faviconUrl, url);
    if (!favicon) {
      // Fallback to default /favicon.ico
      try {
        favicon = new URL('/favicon.ico', url).href;
      } catch {}
    }

    // 5. Specialized Extraction
    const { price, currency } = extractPrice($);
    const image = extractImage($, url);
    const subtype = detectType($, url, price);
    const has_code = $('pre code').length > 0;

    // 6. Readability (Content Cleaning)
    // We use JSDOM here because Readability expects a DOM document
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    // If Readability failed, fallback to body text
    const content = (article ? article.content : $('body').html()) || '';
    const textContent = (article ? article.textContent : $('body').text()) || '';
    const reading_time = estimateReadingTime(textContent);

    // 7. Construct Final Object
    return {
      url,
      type: 'link', // Default DB type
      title: truncate(title, 200),
      description: truncate(description, 500),
      content: content, // This is the cleaned HTML
      textContent: textContent,
      image: image,
      meta: {
        subtype,
        site_name,
        favicon: favicon || undefined,
        canonical_url,
        price,
        currency,
        author,
        published_time,
        reading_time,
        has_code,
        video_url: subtype === 'video' ? url : undefined // Simple assumption
      }
    };

  } catch (error) {
    console.error(`[Scraper] Error scraping ${url}:`, error);
    
    // Fallback for errors
    return {
      url,
      type: 'link',
      title: url,
      description: 'Failed to scrape content',
      image: null,
      content: '',
      textContent: '',
      meta: { subtype: 'website' }
    };
  }
}
