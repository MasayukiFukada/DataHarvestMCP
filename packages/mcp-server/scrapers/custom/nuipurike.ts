import { Page } from 'playwright';
import { BaseScraper, ScrapeResult } from '../types.js';

export default class NuipurikeScraper implements BaseScraper {
  async scrape(page: Page, url: string): Promise<ScrapeResult> {
    // 1ページ目の商品一覧へ移動
    await page.goto(url, { waitUntil: 'networkidle' });

    // 商品リンクを取得
    const items = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'))
        .filter(a => {
          const href = a.href;
          return href.includes('/goods/') && 
                 !href.endsWith('/goods/') && 
                 !href.includes('/gb/') &&
                 !href.includes('post_type=goods');
        })
        .map(a => ({
          title: a.innerText.trim(),
          href: a.href,
          // URLの最後が ID になっている (例: /goods/202604touhokukiritanotomachiuna/)
          id: a.href.split('/').filter(Boolean).pop()
        }))
        .filter(item => item.title.length > 0 && item.id);
      
      // 重複排除 (IDで一意にする)
      const uniqueItems = Array.from(new Map(links.map(item => [item.id, item])).values());
      return uniqueItems;
    });

    const results: string[] = [];
    
    // 全件回ると時間がかかるため、最新の10件程度に制限（必要に応じて調整）
    const targetItems = items.slice(0, 10);
    
    for (const item of targetItems) {
      const locateUrl = `https://www.fancy-fukuya.co.jp/locate/${item.id}/`;
      try {
        await page.goto(locateUrl, { waitUntil: 'networkidle', timeout: 10000 });
        
        const stores = await page.evaluate(() => {
          const shimaneStores: string[] = [];
          const rows = Array.from(document.querySelectorAll('tr'));
          
          let currentPref = '';
          rows.forEach(row => {
            const prefTd = row.querySelector('.column-1');
            // column-1 がある場合は都道府県を更新
            if (prefTd && prefTd.textContent?.trim()) {
              currentPref = prefTd.textContent.trim();
            }
            
            if (currentPref === '島根県' || currentPref === '島根') {
              const storeName = row.querySelector('.column-2')?.textContent?.trim();
              if (storeName) {
                shimaneStores.push(storeName);
              }
            }
          });
          
          return shimaneStores;
        });

        if (stores.length > 0) {
          results.push(`【${item.title}】\n島根県の取扱店舗: ${stores.join(', ')}`);
        } else {
          results.push(`【${item.title}】\n島根県での取扱はありません`);
        }
      } catch (e) {
        results.push(`【${item.title}】\n店舗情報の取得に失敗しました`);
      }
    }

    const title = 'ぬいぐるみリケ 取扱店舗確認 (島根県)';
    const content = results.length > 0 
      ? `調査対象: 最新${targetItems.length}件\n\n${results.join('\n\n')}`
      : '該当するアイテムが見つかりませんでした。';

    return {
      title,
      content,
      url,
      timestamp: new Date().toISOString()
    };
  }
}
