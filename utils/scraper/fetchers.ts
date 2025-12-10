/**
 * Scraper Fetchers
 * Handles all HTTP fetching with fallback chain
 */

import type { FetchResult, MicrolinkData } from './types';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT = 6000;
const SCRAPINGANT_TIMEOUT = 8000;

// Patterns that indicate we got a blocked/anti-bot response
const BLOCKED_PATTERNS = [
    'enable javascript',
    'javascript is disabled',
    'please enable javascript',
    'checking your browser',
    'just a moment',
    'verify you are human',
    'captcha',
    'cloudflare',
    'access denied',
    'robot check',
    'are you a robot',
];

// Sites that always need JS rendering
const JS_REQUIRED_HOSTS = [
    'twitter.com', 'x.com',
    'instagram.com',
    'facebook.com', 'fb.com',
    'linkedin.com',
    'tiktok.com',
    'reddit.com',
    'medium.com',
];

/**
 * Check if response HTML indicates we're blocked
 * Returns false if valid OG data exists (we can extract useful info)
 */
function isBlockedResponse(html: string): boolean {
    const lower = html.toLowerCase();

    // If HTML contains OG meta tags, it's NOT blocked - we can extract useful data
    if (lower.includes('og:title') || lower.includes('og:description') || lower.includes('og:image')) {
        return false;
    }

    // Check for blocked patterns
    if (BLOCKED_PATTERNS.some(p => lower.includes(p))) return true;

    // Check if HTML is too short (likely an error page)
    if (html.length < 1000 && !lower.includes('<!doctype')) return true;

    return false;
}

/**
 * Check if URL needs JavaScript rendering
 */
export function needsJavaScript(url: string): boolean {
    try {
        const host = new URL(url).hostname.replace('www.', '');
        return JS_REQUIRED_HOSTS.some(h => host.includes(h));
    } catch {
        return false;
    }
}

/**
 * Direct fetch - fastest but may get blocked
 */
export async function fetchDirect(url: string): Promise<FetchResult> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            signal: controller.signal,
            redirect: 'follow',
        });
        clearTimeout(timeout);

        // Check status
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                return { html: null, method: 'direct', error: 'Access denied' };
            }
            if (response.status >= 500) {
                return { html: null, method: 'direct', error: `Server error: ${response.status}` };
            }
        }

        // Check content type
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('html') && !contentType.includes('xml')) {
            return { html: null, method: 'direct', error: 'Not HTML content' };
        }

        const html = await response.text();

        // Check if we got blocked
        if (isBlockedResponse(html)) {
            console.warn('[Fetch] Got blocked response, need ScrapingAnt');
            return { html: null, method: 'direct', error: 'Blocked by anti-bot' };
        }

        return { html, method: 'direct' };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        if (message.includes('abort')) {
            return { html: null, method: 'direct', error: 'Timeout' };
        }
        return { html: null, method: 'direct', error: message };
    }
}

/**
 * ScrapingAnt fetch - handles JS rendering
 */
export async function fetchWithScrapingAnt(url: string): Promise<FetchResult> {
    const apiKey = process.env.SCRAPINGANT_API_KEY || process.env.NEXT_PUBLIC_SCRAPINGANT_API_KEY;

    if (!apiKey) {
        console.warn('[ScrapingAnt] No API key configured');
        return { html: null, method: 'scrapingant', error: 'No API key' };
    }
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SCRAPINGANT_TIMEOUT);

        const params = new URLSearchParams({
            url,
            'x-api-key': apiKey,
            browser: 'true',
            return_page_source: 'true',
        });

        const response = await fetch(`https://api.scrapingant.com/v2/general?${params}`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const status = response.status;
            if (status === 401) return { html: null, method: 'scrapingant', error: 'Invalid API key' };
            if (status === 403) return { html: null, method: 'scrapingant', error: 'API quota exceeded' };
            return { html: null, method: 'scrapingant', error: `API error: ${status}` };
        }

        const data = await response.json();

        if (!data.content) {
            return { html: null, method: 'scrapingant', error: 'Empty response' };
        }

        return { html: data.content, method: 'scrapingant' };

    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        if (message.includes('abort')) {
            return { html: null, method: 'scrapingant', error: 'Timeout' };
        }
        return { html: null, method: 'scrapingant', error: message };
    }
}

/**
 * Microlink - fallback for metadata when everything else fails
 */
export async function fetchWithMicrolink(url: string, screenshot = false): Promise<MicrolinkData | null> {
    try {
        const params = new URLSearchParams({ url });
        if (screenshot) {
            params.append('screenshot', 'true');
        }

        const response = await fetch(`https://api.microlink.io?${params}`, {
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) return null;

        const result = await response.json();
        if (result.status !== 'success') return null;

        const data = result.data || {};
        return {
            title: data.title,
            description: data.description,
            image: data.image?.url,
            screenshot: data.screenshot?.url,
            logo: data.logo?.url,
            author: data.author,
            publisher: data.publisher,
        };
    } catch {
        return null;
    }
}

/**
 * Smart fetch with automatic fallback
 */
export async function smartFetch(url: string): Promise<FetchResult> {
    const jsRequired = needsJavaScript(url);

    // If JS is required, go straight to ScrapingAnt
    if (jsRequired) {
        console.log('[Fetch] JS required, using ScrapingAnt');
        const result = await fetchWithScrapingAnt(url);
        if (result.html) return result;
        // If ScrapingAnt fails, still try direct as last resort
    }

    // Try direct fetch first
    console.log('[Fetch] Trying direct fetch');
    const directResult = await fetchDirect(url);

    if (directResult.html) {
        return directResult;
    }

    // Direct failed, try ScrapingAnt
    console.log('[Fetch] Direct failed, trying ScrapingAnt');
    const antResult = await fetchWithScrapingAnt(url);

    if (antResult.html) {
        return antResult;
    }

    // Everything failed
    return {
        html: null,
        method: 'direct',
        error: antResult.error || directResult.error || 'All fetch methods failed'
    };
}
