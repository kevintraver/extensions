import { LocalStorage } from "@raycast/api";

export interface StoredCrawl {
  id: string;
  url: string;
  startedAt: number;
  status: "scraping" | "completed" | "failed";
  pageCount?: number;
  error?: string;
  markdown?: string;
}

export const STORAGE_KEY = "firecrawl-crawls";
export const MAX_STORED_CRAWLS = 20;

export async function loadCrawls(): Promise<StoredCrawl[]> {
  const stored = await LocalStorage.getItem<string>(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveCrawls(crawls: StoredCrawl[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(crawls.slice(0, MAX_STORED_CRAWLS)));
}

export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
