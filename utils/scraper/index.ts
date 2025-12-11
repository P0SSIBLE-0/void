import { ScrapedData, ScraperError, ContentType } from './types';
import { parseHtml, isJsShell } from './parser';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Known JS-heavy domains that require browser rendering
const JS_HEAVY_DOMAINS = [
  'twitter.com',
  'x.com',
  'instagram.com',
  'facebook.com',
  'linkedin.com',
  'pinterest.com',
  'tiktok.com',
];

function isJsHeavyDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return JS_HEAVY_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

function isValidResult(result: ScrapedData): boolean {
  // Must have a valid title (not just 'Untitled' or empty)
  if (!result.title || result.title === 'Untitled' || result.title.trim().length < 2) {
    console.log(`[Scraper] Validation failed: empty/untitled`);
    return false;
  }

  // Check for common block/error page indicators (more specific patterns)
  const badTitlePatterns = [
    'just a moment', 'attention required', 'security check', 'access denied', 'please wait',
    '404 -', '404 |', '404:', 'page not found', '403 forbidden', '500 -', '500 |',
    'something went wrong', 'we couldn\'t find', 'an error occurred', 'error page'
  ];
  const titleLower = result.title.toLowerCase();

  // Check if title STARTS with or IS primarily an error message
  if (badTitlePatterns.some(bad => titleLower.includes(bad))) {
    console.log(`[Scraper] Validation failed: bad title pattern in "${result.title}"`);
    return false;
  }

  // Check description for 404 indicators too
  if (result.description) {
    const descLower = result.description.toLowerCase();
    const badDescs = ['page not found', '404 error', 'doesn\'t exist', 'no longer available'];
    if (badDescs.some(bad => descLower.includes(bad))) {
      console.log(`[Scraper] Validation failed: bad description pattern`);
      return false;
    }
  }

  return true;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Step 1: Native Fetch
 * Fast, cheap, but fails on JS-heavy sites or bot protection.
 */
async function fetchNative(url: string): Promise<ScrapedData | null> {
  // Skip native fetch for known JS-heavy sites
  if (isJsHeavyDomain(url)) {
    console.log(`[Scraper] Skipping native fetch for JS-heavy domain: ${url}`);
    return null;
  }

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    }, 3000); // 3s timeout

    if (!res.ok) {
      console.log(`[Scraper] Native fetch failed (${res.status}) for ${url}`);
      return null;
    }

    const html = await res.text();

    // Debug: Log HTML length and snippet
    console.log(`[Scraper] Native HTML length: ${html.length}, snippet: ${html.substring(0, 200).replace(/\n/g, ' ')}`);

    // Check if it's a JS shell
    if (isJsShell(html)) {
      console.log(`[Scraper] Detected JS shell for ${url}`);
      return null;
    }

    const result = parseHtml(html, url);

    // Debug: Log parsed title
    console.log(`[Scraper] Parsed title: "${result.title}", image: ${result.image ? 'found' : 'missing'}`);

    // Validate the result has meaningful data
    if (!isValidResult(result)) {
      console.log(`[Scraper] Native fetch returned invalid/empty result for ${url}`);
      return null;
    }

    return result;
  } catch (error) {
    console.log(`[Scraper] Native fetch error for ${url}:`, error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

/**
 * Step 2: ScrapingAnt
 * Renders JS, handles anti-bot. Costs money/credits.
 */
async function fetchScrapingAnt(targetUrl: string): Promise<ScrapedData | null> {
  const apiKey = process.env.SCRAPINGANT_API_KEY;
  if (!apiKey) {
    console.warn('[Scraper] No SCRAPING_ANT_API_KEY configured, skipping.');
    return null;
  }

  try {
    // Construct ScrapingAnt URL
    // We use browser=true to render JS
    const saUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true&return_page_source=true`;

    const res = await fetchWithTimeout(saUrl, {
      method: 'GET',
    }, 8000); // 8s timeout

    if (!res.ok) {
      console.log(`[Scraper] ScrapingAnt failed (${res.status}) for ${targetUrl}`);
      return null;
    }

    const text = await res.text();

    // If it's a JSON error response
    if (text.trim().startsWith('{') && text.includes('"error"')) {
      console.log(`[Scraper] ScrapingAnt returned error JSON: ${text.substring(0, 100)}`);
      return null;
    }

    return parseHtml(text, targetUrl);

  } catch (error) {
    console.log(`[Scraper] ScrapingAnt timed out or error for ${targetUrl}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Step 3: Microlink
 * Reliable metadata extraction as last resort.
 */
async function fetchMicrolink(targetUrl: string): Promise<ScrapedData | null> {
  try {
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetchWithTimeout(microlinkUrl, {}, 10000); // 10s timeout

    if (!res.ok) {
      console.log(`[Scraper] Microlink API returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.status === 'success' && data.data) {
      const m = data.data;
      const result: ScrapedData = {
        url: targetUrl,
        title: m.title || new URL(targetUrl).hostname,
        description: m.description || '',
        image: m.image?.url || undefined,
        favicon: m.logo?.url || undefined,
        type: 'link',
        siteName: m.publisher || undefined,
        author: m.author || undefined,
      };

      // Validate Microlink result too
      if (!isValidResult(result)) {
        console.log(`[Scraper] Microlink returned invalid result for ${targetUrl}`);
        return null;
      }

      return result;
    }
    return null;
  } catch (error) {
    console.log(`[Scraper] Microlink error for ${targetUrl}:`, error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

/**
 * Main Scraper Function
 * Implements the waterfall strategy.
 */
export async function scrapeUrl(url: string): Promise<ScrapedData> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ScraperError('Invalid URL provided', 'INVALID_URL', url);
  }

  console.log(`[Scraper] Starting strategy for: ${url}`);

  // 1. Native Fetch (skip for JS-heavy domains)
  const nativeResult = await fetchNative(url);
  if (nativeResult) {
    console.log('[Scraper] ✓ Native fetch successful');
    return nativeResult;
  }

  // 2. ScrapingAnt (Browser/JS) - handles JS-heavy sites
  console.log('[Scraper] → Trying ScrapingAnt...');
  const antResult = await fetchScrapingAnt(url);
  if (antResult && isValidResult(antResult)) {
    console.log('[Scraper] ✓ ScrapingAnt successful');
    return antResult;
  }

  // 3. Microlink (Metadata Fallback) - good for social media
  console.log('[Scraper] → Trying Microlink...');
  const microResult = await fetchMicrolink(url);
  if (microResult) {
    console.log('[Scraper] ✓ Microlink successful');
    return microResult;
  }

  // 4. Fallback - return basic info from URL
  console.log('[Scraper] ⚠ All strategies failed, returning basic info');
  return {
    url,
    title: parsedUrl.hostname.replace('www.', ''),
    description: `Content from ${parsedUrl.hostname}`,
    type: 'link',
    favicon: `${parsedUrl.origin}/favicon.ico`,
  };
}

export type { ScrapedData, ContentType };
export { ScraperError };
