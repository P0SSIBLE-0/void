import { scrapeUrl } from '../utils/scraper';

const TEST_URLS = [
  { type: 'Simple', url: 'https://example.com' },
  { type: 'Article (Medium)', url: 'https://medium.com/@shivansh-kaushik/clean-architecture-in-react-a-practical-guide-part-1-0a42f7034c44' },
  { type: 'Image (Unsplash)', url: 'https://unsplash.com/photos/a-man-standing-in-a-dark-room-with-red-lights-W-7k7h4wk0k' },
  { type: 'Video (YouTube)', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { type: 'Product (Amazon)', url: 'https://www.amazon.com/dp/B08N5KWB9H' },
  { type: 'JS Heavy (Twitter)', url: 'https://twitter.com/vercel' },
];

async function test() {
  console.log('🚀 Starting Scraper Tests...\n');

  for (const { type, url } of TEST_URLS) {
    console.log(`--- Testing ${type} ---`);
    console.log(`URL: ${url}`);
    const start = Date.now();
    try {
      const result = await scrapeUrl(url);
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      
      console.log(`✅ Success (${duration}s)`);
      console.log(`Title: ${result.title}`);
      console.log(`Type: ${result.type}`);
      console.log(`Image: ${result.image ? 'Found' : 'Missing'}`);
      console.log(`Description: ${result.description?.slice(0, 50)}...`);
    } catch (error) {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.error(`❌ Failed (${duration}s):`, error instanceof Error ? error.message : error);
    }
    console.log('\n');
  }
}

test();