
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function processWithAI(title: string, text: string) {
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