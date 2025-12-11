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
  category_id: z.string().uuid().optional().nullable(),
});

// --- GET Handler (Fetch Items) ---
export async function GET() {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- POST Handler (Save Item) ---
export async function POST(req: NextRequest) {
  const startTime = Date.now();

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

    const { url, type: manualType, note, category_id: providedCategoryId } = validation.data;

    // 1. Initialize variables
    let title = note || url;
    let categoryId = providedCategoryId || null;
    let description = "";
    let content = "";
    let textContent = "";
    let image: string | null = null;
    let meta: Record<string, unknown> = {};

    // 2. Start scraping (for links) or prepare text
    if (manualType === "link") {
      try {
        console.log(`[Save API] Starting scrape for: ${url}`);
        const scraped = await scrapeUrl(url);

        title = scraped.title || title;
        description = scraped.description;
        content = scraped.content || "";
        textContent = scraped.textContent || "";
        image = scraped.image || null;
        meta = {
          contentType: scraped.type,
          siteName: scraped.siteName,
          favicon: scraped.favicon,
          canonicalUrl: scraped.canonicalUrl,
          price: scraped.price,
          currency: scraped.currency,
          author: scraped.author,
          publishedTime: scraped.publishedTime,
          readingTime: scraped.readingTime,
          videoUrl: scraped.videoUrl,
          // hasCode: scraped.hasCode, // Not yet implemented
        };

        console.log(`[Save API] Scrape completed for ${scraped.type}`);
      } catch (e) {
        console.error("[Save API] Scraping failed:", e);
        // Continue with basic info
      }
    } else if (manualType === "text") {
      textContent = note || "";
      content = ``;
      title = "Note";
      meta.contentType = "note";
    }

    // 3. AI Processing (async, only if we have enough text)
    let aiData = { summary: "", tags: [] as string[], category: manualType };

    if (textContent && textContent.length > 50) {
      try {
        const aiResult = await processWithAI(title, textContent.slice(0, 600));
        aiData = {
          summary: aiResult.summary,
          tags: aiResult.tags,
          category: aiResult.category,
        };
      } catch (e) {
        console.warn("[Save API] AI processing failed:", e);
      }
    } else if (description) {
      aiData.summary = description;
    }

    // 4. Determine DB Type
    let dbType: "link" | "image" | "text" | "pdf" = "link";
    if (manualType === "image") dbType = "image";
    else if (manualType === "text") dbType = "text";
    else if (meta.contentType === "pdf") dbType = "pdf";

    // 5. If no category provided, try to match AI category to existing user categories
    if (!categoryId && aiData.category) {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", user.id);

      if (categories) {
        const aiCat = aiData.category.toLowerCase();
        const match = categories.find(c =>
          c.name.toLowerCase() === aiCat ||
          c.name.toLowerCase().includes(aiCat) ||
          aiCat.includes(c.name.toLowerCase())
        );
        if (match) {
          categoryId = match.id;
        }
      }
    }

    // 6. Insert into Database
    const { data, error: dbError } = await supabase
      .from("items")
      .insert([
        {
          user_id: user.id,
          url: url,
          type: dbType,
          title: title,
          description: description,
          content: content,
          summary: aiData.summary,
          tags: aiData.tags,
          category_id: categoryId,
          meta: {
            ...meta,
            image: image,
            ai_category: aiData.category,
          },
        },
      ])
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    const totalTime = Date.now() - startTime;
    console.log(`[Save API] Total time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      data,
      performance: {
        totalTime,
      }
    });
  } catch (error: unknown) {
    console.error("Save API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}