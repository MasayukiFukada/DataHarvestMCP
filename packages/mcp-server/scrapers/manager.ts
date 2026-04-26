import { chromium, Browser } from 'playwright';
import { BaseScraper, ScrapeResult } from './types.js';
import { GenericScraper } from './generic.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ScraperManager {
  private browser: Browser | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrape(url: string, scraperId?: string | null): Promise<ScrapeResult> {
    await this.init();
    const context = await this.browser!.newContext();
    const page = await context.newPage();

    try {
      let scraper: BaseScraper = new GenericScraper();

      if (scraperId) {
        try {
          // カスタムスクレイパーの動的ロードを試みる
          // packages/mcp-server/scrapers/custom/[scraperId].ts (または .js)
          const customModule = await import(`./custom/${scraperId}.js`);
          if (customModule.default) {
            scraper = new customModule.default();
          } else if (customModule.Scraper) {
            scraper = new customModule.Scraper();
          }
        } catch (e) {
          console.error(`Failed to load custom scraper: ${scraperId}, falling back to generic.`, e);
        }
      }

      return await scraper.scrape(page, url);
    } finally {
      await page.close();
      await context.close();
    }
  }
}
