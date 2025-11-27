import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// --- Constants & Configuration ---
const MAX_TEXT_LENGTH = 10000; 
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// --- Schema Validation ---
const saveRequestSchema = z.object({
  url: z.string().url(),
  type: z.enum(['link', 'image', 'text']).default('link'),
  note: z.string().optional(),
});

// --- Helper: Scrape URL ---
async function scrapeUrl(url: string) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    $('script, style, noscript, iframe, nav, footer, header, aside, svg').remove();

    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') || 
                  'Untitled';

    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || 
                        '';
    
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || 
                  null;

    const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, MAX_TEXT_LENGTH);

    return { title, description, image, text };

  } catch (error) {
    console.error('Scraping failed:', error);
    return { title: 'Saved Link', description: '', image: null, text: '' };
  } finally {
    if (browser) await browser.close();
  }
}

// --- Helper: Process with AI ---
async function processWithAI(title: string, text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { summary: '', tags: [], category: 'link' };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Fallback to 'gemini-1.5-flash' as it has the widest availability and free tier support.
    // If 'gemini-2.0-flash-lite-preview-02-05' failed with Quota: 0, this is the safest bet.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
      Analyze content. Title: "${title}". Content: "${text.substring(0, 5000)}"
      Task: 1. 2-sentence TLDR. 2. 3-5 tags with single word. 3. Category (article, shop, video, tool, recipe, other).
      Return JSON: { "summary": "...", "tags": ["..."], "category": "..." }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    const aiData = JSON.parse(responseText);
    return { summary: aiData.summary || '', tags: aiData.tags || [], category: aiData.category || 'link' };
  } catch (error: any) {
    // Robust error handling: Log nicely and return empty defaults so the save doesn't fail.
    if (error.message?.includes('429')) {
        console.warn('⚠️ AI Quota Exceeded (429). Saving item without summary/tags.');
    } else {
        console.error('❌ AI processing failed:', error.message);
    }
    return { summary: '', tags: [], category: 'link' };
  }
}

// --- GET Handler (Fetch Items) ---
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST Handler (Save Item) ---
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = saveRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error }, { status: 400 });
    }

    const { url, type: manualType, note } = validation.data;
    let scrapedData = { title: note || url, description: '', image: null as string | null, text: '' };
    
    if (manualType === 'link') {
       scrapedData = await scrapeUrl(url);
    } else if (manualType === 'text') {
       scrapedData.text = note || '';
       scrapedData.title = 'Note'; 
    }

    let aiData = { summary: '', tags: [] as string[], category: manualType };
    
    // Skip AI if text is too short OR if we suspect quota issues (optional optimization)
    if (scrapedData.text.length > 50) {
      const aiResult = await processWithAI(scrapedData.title, scrapedData.text);
      aiData = {
        summary: aiResult.summary,
        tags: aiResult.tags,
        category: manualType === 'link' ? 'link' : manualType 
      };
    }

    let dbType = 'link';
    if (manualType === 'image') dbType = 'image';
    else if (manualType === 'text') dbType = 'text';

    const { data, error: dbError } = await supabase
      .from('items')
      .insert([{
          user_id: user.id,
          url: url,
          type: dbType,
          title: scrapedData.title,
          description: scrapedData.description,
          content: scrapedData.text,
          summary: aiData.summary,
          tags: aiData.tags,
          meta: { image: scrapedData.image, original_category: aiData.category }
        }])
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Save API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}