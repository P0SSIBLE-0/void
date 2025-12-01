import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { scrapeUrl } from "@/utils/scraper";
import { processWithAI } from "@/utils/generate";
import { z } from "zod";

// --- Schema Validation ---
const saveRequestSchema = z.object({
  url: z.string().url(),
  type: z.enum(["link", "image", "text"]).default("link"),
  note: z.string().optional(),
});

// --- GET Handler (Fetch Items) ---
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = saveRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error },
        { status: 400 }
      );
    }

    const { url, type: manualType, note } = validation.data;

    // 1. Initialize variables
    let title = note || url;
    let description = "";
    let content = "";     // HTML content for Reader Mode
    let textContent = ""; // Plain text for AI analysis
    let image: string | null = null;
    let meta: any = {};

    // 2. Scrape or Process Input (Parallel with AI when possible)
    let scrapePromise: Promise<any> | null = null;

    if (manualType === "link") {
      // Start scraping (don't await yet)
      scrapePromise = scrapeUrl(url).catch((e) => {
        console.error("Scraping failed, falling back to basic info", e);
        return null;
      });
    } else if (manualType === "text") {
      textContent = note || "";
      content = `<p>${note}</p>`;
      title = "Note";
      meta.subtype = "note";
    }

    // 3. Wait for scraping to complete before AI (AI needs the text content)
    let aiData = { summary: "", tags: [] as string[], category: manualType };

    if (scrapePromise) {
      const scraped = await scrapePromise;
      if (scraped) {
        title = scraped.title || title;
        description = scraped.description;
        content = scraped.content;
        textContent = scraped.textContent;
        image = scraped.image;
        meta = scraped.meta;
      }
    }

    // 4. AI Processing (only if we have enough text)
    if (textContent && textContent.length > 50) {
      // Run AI processing but limit text to save tokens
      const aiResult = await processWithAI(title, textContent.slice(0, 600));
      aiData = {
        summary: aiResult.summary,
        tags: aiResult.tags,
        category: aiResult.category,
      };
    } else if (description) {
      // Fallback: try to use description if text content is empty/short
      aiData.summary = description;
    }

    // 4. Determine DB Type
    // We try to map our detected subtype to the DB enum ('link', 'image', 'text', 'pdf')
    let dbType = "link";
    if (manualType === "image") dbType = "image";
    else if (manualType === "text") dbType = "text";
    // If scraper detected PDF, etc., we could switch dbType here if valid in Enum

    // 5. Insert into Database
    const { data, error: dbError } = await supabase
      .from("items")
      .insert([
        {
          user_id: user.id,
          url: url,
          type: dbType,
          title: title,
          description: description,
          content: content, // Storing HTML
          summary: aiData.summary,
          tags: aiData.tags,
          meta: {
            ...meta, // Spread scraper meta (price, subtype, etc.)
            image: image, // Ensure image is top-level in meta for easy access
            ai_category: aiData.category, // Store what AI thought it was
          },
        },
      ])
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Save API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}