import { scrapeUrl } from '../utils/scraper';
import * as fs from 'fs';

const urls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://github.com/facebook/react',
  'https://www.behance.net/gallery/238650461/Daily-Quest-Solo-Leveling-Inspired-App-Concept/modules/1373478579',
  'https://www.amazon.com/dp/B0D1XD1ZV3',
  'https://twitter.com/elonmusk/status/1866025888016605281',
  'https://www.flipkart.com/apple-iphone-15/p/itm6ac6485515ae4',
];

async function test() {
  const results: string[] = [];
  results.push('=== SCRAPER TEST RESULTS ===\n');

  for (const url of urls) {
    results.push(`\n--- ${url.substring(0, 50)}... ---`);
    const start = Date.now();

    try {
      const data = await scrapeUrl(url);
      const time = Date.now() - start;

      results.push(`Time: ${time}ms`);
      results.push(`Title: ${data.title.substring(0, 60)}`);
      results.push(`Type: ${data.meta.contentType}`);
      results.push(`Description: ${data.description ? data.description.substring(0, 80) + '...' : 'NONE'}`);
      results.push(`Image: ${data.image ? 'YES (' + data.image.substring(0, 40) + '...)' : 'NONE'}`);
      results.push(`Price: ${data.meta.price || 'N/A'} ${data.meta.currency || ''}`);
      results.push(`Favicon: ${data.meta.favicon ? 'YES' : 'NO'}`);
    } catch (e: unknown) {
      results.push(`ERROR: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  }

  const output = results.join('\n');
  console.log(output);
  fs.writeFileSync('test-results.txt', output);
  console.log('\n\nResults saved to test-results.txt');
}

test();
