import { Page } from 'playwright';
import { BaseScraper, ScrapeResult } from './types.js';

export class GenericScraper implements BaseScraper {
  async scrape(page: Page, url: string): Promise<ScrapeResult> {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 基本的な情報の抽出
    const title = await page.title();
    
    // スクリプトやスタイルを除去してテキストのみを抽出
    const content = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script, style, nav, footer, header');
      scripts.forEach(s => s.remove());
      return document.body.innerText;
    });

    return {
      title,
      content: content.replace(/\s+/g, ' ').trim().slice(0, 10000),
      url,
      timestamp: new Date().toISOString()
    };
  }
}
