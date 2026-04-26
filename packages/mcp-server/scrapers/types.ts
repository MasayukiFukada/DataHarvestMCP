import { Page } from 'playwright';

export interface ScrapeResult {
  title: string;
  content: string;
  url: string;
  timestamp: string;
}

export interface BaseScraper {
  scrape(page: Page, url: string): Promise<ScrapeResult>;
}
