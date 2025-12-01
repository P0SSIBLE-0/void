import { scrapeUrl } from '../utils/scraper';

const urls = [
  'https://medium.com/@wlockett/the-ai-bubble-is-about-to-burst-but-the-next-bubble-is-already-growing-383c0c0c7ede', // Article
  'https://www.imdb.com/title/tt27988879/', // movie
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Video
  'https://squoosh.app/', // Tool
  'https://github.com/facebook/react', // Code/Repo
  'https://www.flipkart.com/realme-gt-8-pro/p/itm78c31e0a1941f', // Product Page
  'https://dribbble.com/shots/26799571-Crypto-Mobile-App-UI-Design', // Design website, // can't scrape bot detected return error 202
];

async function checkImage(url: string | null): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  console.log('Starting Scraper Test...\n');

  for (const url of urls) {
    console.log(`\n👉 Testing: ${url}`);
    const start = Date.now();
    try {
      const data = await scrapeUrl(url);
      const duration = Date.now() - start;

      console.log(`✅ Scraped in ${duration}ms`);
      console.log(`   Title:       ${data.title}`);
      console.log(`   Description: ${data.description ? data.description.substring(0, 100) + '...' : 'NULL'}`);
      console.log(`   Subtype:     ${data.meta.subtype}`);
      console.log(`   Image:       ${data.image ? data.image.substring(0, 60) + '...' : 'NULL'}`);

      if (data.image) {
        const isImageValid = await checkImage(data.image);
        console.log(`   Image Status: ${isImageValid ? '✅ Accessible' : '❌ Broken/Unreachable'}`);
      }

      console.log(`   Price:       ${data.meta.price || 'N/A'} ${data.meta.currency || ''}`);
      console.log(`   Favicon:     ${data.meta.favicon ? '✅ Found' : '❌ Missing'}`);
      console.log(`   Text Length: ${data.textContent.length} chars`);
      console.log(`   Code:        ${data.meta.has_code ? 'Yes' : 'No'}`);

    } catch (e) {
      console.error(`❌ Failed:`, e);
    }
  }
}

run();
