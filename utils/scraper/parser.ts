import * as cheerio from 'cheerio';
import { ContentType, ScrapedData } from './types';

export function isJsShell(html: string): boolean {
  if (!html) return true;
  const lower = html.toLowerCase();

  // 1. Aggressive Block/Challenge Detection
  // Cloudflare & Common Bot Protection Phrases
  if (
    lower.includes('verify you are human') ||
    lower.includes('checking your browser') ||
    lower.includes('please enable cookies') ||
    lower.includes('attention required') ||
    lower.includes('security check') ||
    lower.includes('challenge-platform') ||
    lower.includes('cloudflare')
  ) {
    const $ = cheerio.load(html);
    const title = $('title').text().toLowerCase().trim();
    // Cloudflare standard titles
    if (title === 'just a moment...' || title === 'attention required' || title === 'security check') return true;

    // If body is relatively short and contains these phrases, it's a block
    if (html.length < 5000) return true;
  }

  // 2. Short Content / Empty Shell Detection
  if (html.length < 500) {
    if (lower.includes('enable javascript') || lower.includes('javascript is required')) return true;
    if (lower.includes('<title>') && lower.includes('<body>')) return false;
    return true;
  }

  const $ = cheerio.load(html);
  const bodyText = $('body').text().toLowerCase().trim();
  const title = $('title').text().trim();

  // 3. Twitter/X specific shell detection
  if (title === 'Twitter' || title === 'X' || title === 'x.com') {
    if (bodyText.length < 200) return true;
  }

  // 4. Content vs Warning Logic
  const hasJsWarning = bodyText.includes('enable javascript') || bodyText.includes('javascript is required');
  // Lowered threshold to 50 chars to allow simple HTML pages (like example.com) that lack OG tags
  const hasContent = bodyText.length > 50;
  // Check for common meta tags that suggest a valid SSR page
  const hasMeta = $('meta[property^="og:"]').length > 0 || $('meta[name^="twitter:"]').length > 0;

  // If it explicitly asks for JS and has low content, or has no content and no meta, it's a shell
  return (hasJsWarning && !hasContent) || (!hasContent && !hasMeta);
}

export function detectType(url: string, $: cheerio.CheerioAPI): ContentType {
  const ogType = $('meta[property="og:type"]').attr('content')?.toLowerCase() || '';
  const urlLower = url.toLowerCase();

  // 1. PDF
  if (urlLower.endsWith('.pdf')) {
    return 'pdf';
  }

  // 2. Video
  if (
    ogType.includes('video') ||
    $('meta[property="og:video"]').length > 0 ||
    $('meta[property^="og:video:"]').length > 0 ||
    urlLower.includes('youtube.com/watch') ||
    urlLower.includes('youtu.be')
  ) {
    return 'video';
  }

  // 3. Product
  const hasPrice =
    $('meta[property="product:price:amount"]').length > 0 ||
    $('meta[property="og:price:amount"]').length > 0 ||
    $('meta[name="price"]').length > 0;

  if (
    ogType.includes('product') ||
    hasPrice ||
    urlLower.includes('/dp/') || // Amazon common pattern
    urlLower.includes('/product/')
  ) {
    return 'product';
  }

  // 4. Image
  if (
    ogType.includes('image') ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlLower)
  ) {
    return 'image';
  }

  // 5. Article
  if (ogType.includes('article')) {
    return 'text';
  }

  return 'link';
}

export function parseHtml(html: string, url: string): ScrapedData {
  const $ = cheerio.load(html);

  // Title Strategy
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    'Untitled';

  // Description Strategy
  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  // Image Strategy - Multiple fallbacks
  let image =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[property="og:image:url"]').attr('content') ||
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content') ||
    $('link[rel="image_src"]').attr('href');

  // Try to get image from JSON-LD structured data
  if (!image) {
    $('script[type="application/ld+json"]').each((_, el) => {
      if (image) return; // Already found
      try {
        const jsonStr = $(el).html();
        if (jsonStr) {
          const json = JSON.parse(jsonStr);
          // Handle array of objects
          const data = Array.isArray(json) ? json[0] : json;
          image = data.image?.url || data.image || data.thumbnailUrl || data.logo?.url;
          // Handle image as array
          if (Array.isArray(image)) {
            image = image[0]?.url || image[0];
          }
        }
      } catch {
        // JSON parse error, ignore
      }
    });
  }

  // Fallback: Look for first large image in content
  if (!image) {
    $('article img, main img, .post img, .content img, img[src*="upload"], img[src*="image"]').each((_, el) => {
      if (image) return;
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      // Skip tiny images, icons, avatars, tracking pixels
      const srcLower = (src || '').toLowerCase();
      if (src &&
        !srcLower.includes('avatar') &&
        !srcLower.includes('icon') &&
        !srcLower.includes('logo') &&
        !srcLower.includes('pixel') &&
        !srcLower.includes('1x1') &&
        !srcLower.endsWith('.svg')) {
        image = src;
      }
    });
  }

  // Resolve relative image URLs
  if (image && !image.startsWith('http')) {
    try {
      image = new URL(image, url).toString();
    } catch {
      // invalid URL, ignore
    }
  }

  // Favicon Strategy
  let favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    '/favicon.ico';

  if (favicon && !favicon.startsWith('http')) {
    try {
      favicon = new URL(favicon, url).toString();
    } catch {
      // invalid URL, ignore
    }
  }

  // Site Name
  const siteName = $('meta[property="og:site_name"]').attr('content');

  // Author
  const author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content');

  // Price/Currency (for products)
  const price = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
  const currency = $('meta[property="product:price:currency"]').attr('content') || $('meta[property="og:price:currency"]').attr('content');

  // Published Time
  const publishedTime = $('meta[property="article:published_time"]').attr('content');

  // Canonical URL
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;

  // Video URL
  const videoUrl = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content') || (detectType(url, $) === 'video' ? url : undefined);

  // Content Extraction (Simplified)
  // Remove script, style, nav, footer to get cleaner text
  $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
  const content = $('body').html() || '';
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();

  // Reading Time (Words / 200)
  const wordCount = textContent.split(' ').length;
  const readingTime = Math.ceil(wordCount / 200);

  const type = detectType(url, $);

  return {
    url,
    title: title.trim(),
    description: description.trim(),
    type,
    image,
    favicon,
    siteName,
    author,
    price,
    currency,
    publishedTime,
    content,
    textContent,
    canonicalUrl,
    readingTime,
    videoUrl
  };
}
