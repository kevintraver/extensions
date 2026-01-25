import { Action, ActionPanel, List, Detail, LocalStorage, showToast, Toast, Icon, useNavigation } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { StoredScrape, SCRAPE_STORAGE_KEY, loadScrapes, saveScrapes } from "./lib/scrape-storage";

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ScrapeResultDetail({ scrape }: { scrape: StoredScrape }) {
  return (
    <Detail
      markdown={scrape.markdown}
      navigationTitle={scrape.title}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="URL" text={scrape.url} />
          <Detail.Metadata.Label title="Scraped" text={formatRelativeTime(scrape.scrapedAt)} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            content={scrape.markdown}
            title="Copy Markdown"
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.OpenInBrowser url={scrape.url} shortcut={{ modifiers: ["cmd"], key: "o" }} />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [scrapes, setScrapes] = useState<StoredScrape[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshScrapes = useCallback(async () => {
    const loaded = await loadScrapes();
    setScrapes(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshScrapes();
  }, [refreshScrapes]);

  async function deleteScrape(id: string) {
    const updated = scrapes.filter((s) => s.id !== id);
    setScrapes(updated);
    await saveScrapes(updated);
    showToast({ style: Toast.Style.Success, title: "Scrape deleted" });
  }

  async function clearAllScrapes() {
    setScrapes([]);
    await LocalStorage.removeItem(SCRAPE_STORAGE_KEY);
    showToast({ style: Toast.Style.Success, title: "All scrapes cleared" });
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search scrapes...">
      {scrapes.length === 0 ? (
        <List.EmptyView title="No Scrapes Yet" description="Use the Scrape URL command to scrape a page" />
      ) : (
        scrapes.map((scrape) => (
          <List.Item
            key={scrape.id}
            title={scrape.title}
            subtitle={scrape.url}
            icon={Icon.Document}
            accessories={[{ text: formatRelativeTime(scrape.scrapedAt) }]}
            actions={
              <ActionPanel>
                <Action
                  title="View Results"
                  icon={Icon.Eye}
                  onAction={() => push(<ScrapeResultDetail scrape={scrape} />)}
                />
                <Action.CopyToClipboard
                  content={scrape.markdown}
                  title="Copy Markdown"
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action.OpenInBrowser url={scrape.url} shortcut={{ modifiers: ["cmd"], key: "o" }} />
                <Action
                  title="Delete"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                  onAction={() => deleteScrape(scrape.id)}
                />
                <Action
                  title="Clear All"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                  onAction={clearAllScrapes}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
