import * as cheerio from 'cheerio';

// --- Utility Helpers ---

export function normalizeUrl(url: string | undefined | null, baseUrl: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const trimmed = url.trim();
    if (trimmed.startsWith('data:')) return trimmed; 
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('http:')) return trimmed.replace('http:', 'https:');
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

export function truncate(str: string | undefined | null, length: number): string {
  if (!str) return '';
  const cleaned = str.replace(/\s+/g, ' ').trim();
  return cleaned.length > length ? cleaned.substring(0, length) + '...' : cleaned;
}

export function estimateReadingTime(text: string): number {
  if (!text) return 0;
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// --- Image Validation ---

function isSvg(url: string): boolean {
  return url.toLowerCase().endsWith('.svg') || url.includes('image/svg+xml');
}

function isValidImageUrl(url: string): boolean {
  if (!url || isSvg(url)) return false;
  
  const lower = url.toLowerCase();
  
  const invalidPatterns = ['placeholder', 'default-', 'noimage', 'missing', '1x1.'];
  if (invalidPatterns.some(p => lower.includes(p))) return false;

  if (lower.startsWith('data:')) {
    const isImage = lower.startsWith('data:image/jpeg') || lower.startsWith('data:image/png') || lower.startsWith('data:image/webp');
    return isImage && url.length > 5000; 
  }

  const hasExtension = /\.(jpg|jpeg|png|webp|gif)(\?|$|#)/i.test(url);
  const knownCDNs = ['images.unsplash.com', 'i.ytimg.com', 'img.youtube.com', 'media.giphy.com', 'm.media-amazon.com', 'rukmini', 'flixcart.com', 'opengraph.githubassets.com', 'cdn.dribbble.com'];
  
  return hasExtension || knownCDNs.some(cdn => lower.includes(cdn));
}

// --- Extractors ---

export function extractTitle($: cheerio.CheerioAPI, url: string): string {
  let title = $('meta[property="og:title"]').attr('content') || 
              $('title').text() || 
              $('meta[name="twitter:title"]').attr('content') ||
              '';

  // JSON-LD Fallback
  if (!title) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
            if (item.name) { title = item.name; return false; }
            if (item.headline) { title = item.headline; return false; }
        }
      } catch {}
    });
  }

  if (!title || title.trim() === '' || title === 'Untitled' || title === 'Just a moment...') {
    try {
      const u = new URL(url);
      const segments = u.pathname.split('/').filter(Boolean);
      const last = segments.pop();
      if (last) {
        title = last.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s\d+$/, '');
      } else {
        title = u.hostname;
      }
    } catch {
      title = 'Untitled';
    }
  }
  return truncate(title, 200);
}

export function extractDescription($: cheerio.CheerioAPI): string {
  let desc = $('meta[property="og:description"]').attr('content') || 
               $('meta[name="description"]').attr('content') || 
               $('meta[name="twitter:description"]').attr('content') || '';

  // JSON-LD Fallback
  if (!desc) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
            if (item.description) { desc = item.description; return false; }
            if (item.articleBody) { desc = item.articleBody.substring(0, 200); return false; }
        }
      } catch {}
    });
  }
  
  return truncate(desc, 500);
}

export function extractSiteName($: cheerio.CheerioAPI): string | undefined {
  return $('meta[property="og:site_name"]').attr('content') || undefined;
}

export function extractAuthor($: cheerio.CheerioAPI): string | undefined {
  return $('meta[name="author"]').attr('content') || 
         $('meta[property="article:author"]').attr('content') || 
         undefined;
}

export function extractPublishedTime($: cheerio.CheerioAPI): string | undefined {
  return $('meta[property="article:published_time"]').attr('content') || 
         $('time').first().attr('datetime') || 
         undefined;
}

export function extractCanonical($: cheerio.CheerioAPI, url: string): string {
  return $('link[rel="canonical"]').attr('href') || 
         $('meta[property="og:url"]').attr('content') || 
         url;
}

export function extractPrice($: cheerio.CheerioAPI): { price?: string; currency?: string } {
  // 1. Meta Tags (High confidence)
  let price = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
  let currency = $('meta[property="product:price:currency"]').attr('content') || $('meta[property="og:price:currency"]').attr('content') || 'USD';

  // 2. JSON-LD (Product only)
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
              return false;
            }
          }
        }
      } catch {}
    });
  }

  // 3. Text Regex (Strict Mode: Only if we suspect it's a product/shop page)
  // We avoid running this on generic pages to prevent false positives like "200000 INR" for movie budget.
  const isProductPage = $('meta[property="og:type"]').attr('content') === 'product' || 
                        $('button:contains("Buy")').length > 0 || 
                        $('button:contains("Add to Cart")').length > 0 ||
                        $('.price').length > 0;

  if (!price && isProductPage) {
    const match = $('body').text().match(/([$₹£€]|Rs\.?)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    if (match) {
      const symbol = match[1].toLowerCase();
      currency = (symbol === '₹' || symbol.includes('rs')) ? 'INR' : symbol === '£' ? 'GBP' : symbol === '€' ? 'EUR' : 'USD';
      price = match[2].replace(/,/g, '');
    }
  }

  return { price: price ? String(price) : undefined, currency: currency ? String(currency) : undefined };
}

export function extractImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // 1. Meta Tags
  const candidates = [
    $('meta[property="og:image"]').attr('content'),
    $('meta[property="og:image:secure_url"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[name="twitter:image:src"]').attr('content'),
    $('link[rel="image_src"]').attr('href')
  ];

  for (const c of candidates) {
    const normalized = normalizeUrl(c, baseUrl);
    if (normalized && isValidImageUrl(normalized)) return normalized;
  }

  // 2. JSON-LD
  let jsonImage: string | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        // Handle various JSON-LD image formats
        const img = item.image || item.thumbnailUrl;
        if (img) {
           if (typeof img === 'string') jsonImage = img;
           else if (Array.isArray(img)) jsonImage = img[0];
           else if (img.url) jsonImage = img.url;
        }
        if (jsonImage) return false;
      }
    } catch {}
  });
  
  const normJson = normalizeUrl(jsonImage, baseUrl);
  if (normJson && isValidImageUrl(normJson)) return normJson;

  // 3. DOM Scoring
  let bestImage: string | null = null;
  let maxScore = 0;

  $('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || $img.attr('data-src') || $img.attr('srcset')?.split(' ')[0]; // Added srcset support
    if (!src) return;

    const norm = normalizeUrl(src, baseUrl);
    if (!norm || !isValidImageUrl(norm)) return;

    // Score calculation
    let score = 0;
    const width = parseInt($img.attr('width') || '0');
    const height = parseInt($img.attr('height') || '0');
    const area = width * height;

    if (area > 5000) score += Math.min(area, 50000); // Cap size bonus
    if ($img.closest('header, nav, footer, aside').length) score -= 10000;
    if ($img.closest('article, main, [role="main"]').length) score += 20000;
    
    // Keyword bonuses
    const className = ($img.attr('class') || '').toLowerCase();
    const alt = ($img.attr('alt') || '').toLowerCase();
    if (className.includes('hero') || className.includes('feature') || className.includes('cover') || alt.includes('cover')) score += 15000;
    
    if (score > maxScore) {
      maxScore = score;
      bestImage = norm;
    }
  });

  return bestImage;
}

export function extractFavicon($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  const selectors = [
    'link[rel="icon"]', 
    'link[rel="shortcut icon"]', 
    'link[rel="apple-touch-icon"]',
    'link[rel="mask-icon"]'
  ];
  
  for (const sel of selectors) {
    const href = $(sel).last().attr('href');
    const norm = normalizeUrl(href, baseUrl);
    if (norm) return norm;
  }

  try {
    return new URL('/favicon.ico', baseUrl).href;
  } catch {
    return undefined;
  }
}

export function detectType($: cheerio.CheerioAPI, url: string, price?: string): 'article' | 'product' | 'video' | 'website' | 'tool' {
  const ogType = $('meta[property="og:type"]').attr('content');
  if (ogType?.includes('video') || url.match(/(youtube|vimeo|youtu\.be|imdb\.com\/title)/)) return 'video';
  if (price || ogType === 'product' || $('meta[property="product:price:amount"]').length) return 'product';
  if (ogType === 'article') return 'article';
  
  const title = $('title').text().toLowerCase();
  const desc = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
  if (['generator', 'converter', 'calculator', 'tool'].some(k => title.includes(k) || desc.includes(k))) return 'tool';
  
  return 'website';
}
