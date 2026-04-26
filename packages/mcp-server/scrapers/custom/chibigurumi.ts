import { Page } from 'playwright';
import { BaseScraper, ScrapeResult } from '../types.js';

export default class ChibigurumiScraper implements BaseScraper {
  async scrape(page: Page, url: string): Promise<ScrapeResult> {
    // ページへ移動
    await page.goto(url, { waitUntil: 'networkidle' });

    // サイトのタイトルを取得
    const title = await page.title();

    // 要素が表示されるのを待機
    try {
      await page.waitForSelector('.products_item', { timeout: 10000 });
    } catch (e) {
      console.log('Timeout waiting for .products_item');
    }

    // アイテムリストを取得
    const items = await page.evaluate(() => {
      const itemList: any[] = [];
      const elements = document.querySelectorAll('.products_item');
      
      elements.forEach((el) => {
        const itemTitle = el.querySelector('.products_name')?.textContent?.trim() || 'No Title';
        const releaseDate = el.querySelector('.products_date')?.textContent?.trim() || 'No Date';
        itemList.push(`【${itemTitle}】 発売時期: ${releaseDate}`);
      });

      if (itemList.length === 0) {
        return `アイテムが見つかりませんでした。 bodyのクラス: ${document.body.className}, HTMLの一部: ${document.body.innerHTML.substring(0, 500)}`;
      }

      return itemList;
    });

    // 抽出した情報をテキストとして結合
    const content = Array.isArray(items) 
      ? `取得アイテム数: ${items.length}件\n\n${items.join('\n')}`
      : items;

    return {
      title,
      content,
      url,
      timestamp: new Date().toISOString()
    };
  }
}
