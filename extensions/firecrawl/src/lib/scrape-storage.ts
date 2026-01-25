import { LocalStorage } from "@raycast/api";

export interface StoredScrape {
  id: string;
  url: string;
  title: string;
  scrapedAt: number;
  markdown: string;
}

export const SCRAPE_STORAGE_KEY = "firecrawl-scrapes";
export const MAX_STORED_SCRAPES = 20;

export async function loadScrapes(): Promise<StoredScrape[]> {
  const stored = await LocalStorage.getItem<string>(SCRAPE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveScrapes(scrapes: StoredScrape[]): Promise<void> {
  await LocalStorage.setItem(SCRAPE_STORAGE_KEY, JSON.stringify(scrapes.slice(0, MAX_STORED_SCRAPES)));
}
