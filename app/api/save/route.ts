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
    let scrapedData = {
      title: note || url,
      description: "",
      image: null as string | null,
      text: "",
    };

    if (manualType === "link") {
      scrapedData = await scrapeUrl(url);
    } else if (manualType === "text") {
      scrapedData.text = note || "";
      scrapedData.title = "Note";
    }

    let aiData = { summary: "", tags: [] as string[], category: manualType };

    // Skip AI if text is too short OR if we suspect quota issues (optional optimization)
    if (scrapedData.text.length > 50) {
      const aiResult = await processWithAI(scrapedData.title, scrapedData.text);
      aiData = {
        summary: aiResult.summary,
        tags: aiResult.tags,
        category: manualType === "link" ? "link" : manualType,
      };
    }

    let dbType = "link";
    if (manualType === "image") dbType = "image";
    else if (manualType === "text") dbType = "text";

    const { data, error: dbError } = await supabase
      .from("items")
      .insert([
        {
          user_id: user.id,
          url: url,
          type: dbType,
          title: scrapedData.title,
          description: scrapedData.description,
          content: scrapedData.text,
          summary: aiData.summary,
          tags: aiData.tags,
          meta: {
            image: scrapedData.image,
            original_category: aiData.category,
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
