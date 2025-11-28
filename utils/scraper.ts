import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';

// --- Configuration ---
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TIMEOUT_MS = 15000;

// Limits
const LIMITS = {
  TITLE: 100,
  DESCRIPTION: 300,
  TEXT: 2000,
};

// --- Helpers ---

function truncate(str: string | undefined | null, length: number): string {
  if (!str) return '';
  const cleaned = str.replace(/\s+/g, ' ').trim();
  return cleaned.length > length ? cleaned.substring(0, length) + '...' : cleaned;
}

function normalizeUrl(url: string | undefined | null, baseUrl: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    if (url.startsWith('data:')) return null;
    if (url.startsWith('//')) return `https:${url}`;
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

function getDirectImage(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const v = u.searchParams.get('v') || u.pathname.split('/').pop();
      if (v && v.length === 11) return `https://img.youtube.com/vi/${v}/maxresdefault.jpg`;
    }
    // Google Image Search
    if (u.hostname.includes('google') && u.searchParams.get('imgurl')) {
      return u.searchParams.get('imgurl');
    }
  } catch { }
  return null;
}

// --- Level 1: Fast Scrape (Fetch + Cheerio) ---

async function fastScrape(url: string) {
  try {
    console.log(`[FastScrape] Attempting: ${url}`);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });
    clearTimeout(id);

    if (response.headers.get('content-type')?.startsWith('image/')) {
      return { title: 'Image', description: 'Direct Image', image: url, text: '' };
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        console.warn(`[FastScrape] Blocked (${response.status}), escalating.`);
        return null;
      }
      throw new Error(`Status ${response.status}`);
    }

    const html = await response.text();

    // Dribbble and similar SPAs often return a shell
    if (html.length < 2000 && !html.includes('<article')) {
      console.log('[FastScrape] HTML too short/empty, escalating.');
      return null;
    }

    const $ = cheerio.load(html);

    const title = truncate(
      $('meta[property="og:title"]').attr('content') || $('title').text(),
      LIMITS.TITLE
    );
    const description = truncate(
      $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
      LIMITS.DESCRIPTION
    );

    let image = $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');

    if (!image) {
      $('script[type="application/ld+json"]').each((_, el) => {
        if (image) return;
        try {
          const json = JSON.parse($(el).html() || '{}');
          const entities = Array.isArray(json) ? json : [json];
          for (const e of entities) {
            if (e.image) {
              const i = e.image.url || e.image;
              if (typeof i === 'string') { image = i; break; }
            }
          }
        } catch { }
      });
    }

    if (!image) {
      let maxScore = 0;
      $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (!src || src.endsWith('.svg')) return;
        let score = 0;
        if ($(el).attr('width')) score += 10;
        if ($(el).parents('article, main').length) score += 20;
        if (score > maxScore) { maxScore = score; image = src; }
      });
    }

    $('script, style, nav, footer, header, aside, svg').remove();
    const text = truncate($('body').text(), LIMITS.TEXT);

    if (!title || title === 'Untitled' || text.length < 100) {
      console.log('[FastScrape] Content insufficient, escalating.');
      return null;
    }

    return {
      title: title || 'Untitled',
      description: description || '',
      image: normalizeUrl(image, url),
      text
    };

  } catch (e) {
    console.warn(`[FastScrape] Failed: ${e}`);
    return null;
  }
}

// --- Level 2: Deep Scrape (Puppeteer) ---

async function getBrowser() {
  if (IS_PRODUCTION) {
    chromium.setGraphicsMode = false;
    return await puppeteerCore.launch({
      // @ts-ignore
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as any,
    });
  } else {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }
}

async function deepScrape(url: string) {
  console.log(`[DeepScrape] Launching browser for: ${url}`);
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1440, height: 900 });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media', 'stylesheet'].includes(type)) req.abort();
      else req.continue();
    });

    // Use networkidle2 for better SPA support
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    try {
      await page.waitForSelector('body', { timeout: 5000 });
    } catch { }

    // Evaluate with NO internal function definitions to avoid __name issues
    const data = await page.evaluate(() => {
      // Inline logic only
      const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title;

      const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        document.querySelector('meta[name="description"]')?.getAttribute('content');

      let image = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

      if (!image) {
        const imgs = Array.from(document.querySelectorAll('img'));
        let bestImg = null;
        let maxScore = 0;

        for (const img of imgs) {
          if (img.src.endsWith('.svg') || img.src.startsWith('data:')) continue;

          const rect = img.getBoundingClientRect();
          if (rect.width < 50 || rect.height < 50) continue;

          let score = (rect.width * rect.height);
          if (rect.top < 800) score += 5000;
          if (img.closest('main, article')) score += 5000;
          if (img.closest('header, nav, footer')) score -= 5000;

          if (score > maxScore) {
            maxScore = score;
            bestImg = img.src;
          }
        }
        image = bestImg;
      }

      // 5. Text Content
      // Cleanup for text
      const bodyClone = document.body.cloneNode(true) as HTMLElement;

      // Aggressive cleanup of UI elements
      const trash = bodyClone.querySelectorAll(
        'script, style, nav, footer, header, aside, svg, noscript, ' +
        '[role="navigation"], [role="banner"], [role="contentinfo"], ' +
        '.nav, .header, .footer, .menu, .sidebar, .ad, .banner, .cookie, .popup, .modal'
      );
      trash.forEach(n => n.remove());

      const text = bodyClone.innerText.replace(/\s+/g, ' ').trim().substring(0, 8000);

      return { title, description, image, text };
    });

    return {
      title: truncate(data.title, LIMITS.TITLE) || 'Untitled',
      description: truncate(data.description, LIMITS.DESCRIPTION) || '',
      image: normalizeUrl(data.image, url),
      text: data.text || ''
    };

  } catch (error) {
    console.error(`[DeepScrape] Failed: ${error}`);
    return { title: 'Saved Link', description: '', image: null, text: '' };
  } finally {
    if (browser) await browser.close();
  }
}

// --- Main Orchestrator ---

export async function scrapeUrl(url: string) {
  // 1. Special Direct Patterns
  const direct = getDirectImage(url);
  if (direct) return { title: 'Media', description: '', image: direct, text: '' };

  // 2. Try Fast Scrape
  const fastResult = await fastScrape(url);

  if (fastResult && fastResult.title && fastResult.title !== 'Untitled' && (fastResult.image || fastResult.text.length > 500)) {
    return fastResult;
  }

  // 3. Fallback to Deep Scrape
  console.log(`[Orchestrator] Fast scrape insufficient for ${url}, falling back to Deep Scrape.`);
  return await deepScrape(url);
}