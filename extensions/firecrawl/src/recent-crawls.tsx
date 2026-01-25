import {
  Action,
  ActionPanel,
  List,
  Detail,
  LocalStorage,
  showToast,
  Toast,
  Icon,
  Color,
  useNavigation,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import firecrawl from "./firecrawl";
import { StoredCrawl, STORAGE_KEY, loadCrawls, saveCrawls } from "./lib/crawl-storage";

interface CrawledPage {
  markdown?: string;
  metadata?: {
    title?: string;
    sourceURL?: string;
  };
}

const POLL_INTERVAL = 3000;

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

function getStatusIcon(status: StoredCrawl["status"]): { source: Icon; tintColor: Color } {
  switch (status) {
    case "scraping":
      return { source: Icon.CircleProgress, tintColor: Color.Blue };
    case "completed":
      return { source: Icon.CheckCircle, tintColor: Color.Green };
    case "failed":
      return { source: Icon.XMarkCircle, tintColor: Color.Red };
  }
}

function getStatusText(crawl: StoredCrawl): string {
  switch (crawl.status) {
    case "scraping":
      return "Crawling...";
    case "completed":
      return `${crawl.pageCount} page${crawl.pageCount === 1 ? "" : "s"}`;
    case "failed":
      return crawl.error || "Failed";
  }
}

function CrawlResultDetail({ crawl }: { crawl: StoredCrawl }) {
  const markdown = crawl.markdown || "No content available";

  return (
    <Detail
      markdown={markdown}
      navigationTitle={crawl.url}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="URL" text={crawl.url} />
          <Detail.Metadata.Label title="Pages" text={String(crawl.pageCount || 0)} />
          <Detail.Metadata.Label title="Started" text={formatRelativeTime(crawl.startedAt)} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            content={markdown}
            title="Copy Markdown"
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.OpenInBrowser url={crawl.url} shortcut={{ modifiers: ["cmd"], key: "o" }} />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [crawls, setCrawls] = useState<StoredCrawl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCrawls = useCallback(async () => {
    const loaded = await loadCrawls();
    setCrawls(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshCrawls();
  }, [refreshCrawls]);

  // Poll for status updates on pending crawls
  useEffect(() => {
    const pendingCrawls = crawls.filter((c) => c.status === "scraping");
    if (pendingCrawls.length === 0) return;

    const interval = setInterval(async () => {
      let updated = false;
      const updatedCrawls = [...crawls];

      for (const crawl of pendingCrawls) {
        try {
          const response = await firecrawl.v1.checkCrawlStatus(crawl.id);
          const index = updatedCrawls.findIndex((c) => c.id === crawl.id);

          if (index !== -1 && "status" in response) {
            if (response.status === "completed") {
              const pages = (response.data || []) as CrawledPage[];
              const markdown = pages
                .map((page) => {
                  const title = page.metadata?.title || "Untitled";
                  const sourceUrl = page.metadata?.sourceURL || "Unknown URL";
                  const content = page.markdown || "";
                  return `# ${title}\n*Source: ${sourceUrl}*\n\n${content}`;
                })
                .join("\n\n---\n\n");

              updatedCrawls[index] = {
                ...crawl,
                status: "completed",
                pageCount: pages.length,
                markdown,
              };
              updated = true;
            } else if (response.status === "failed") {
              updatedCrawls[index] = {
                ...crawl,
                status: "failed",
                error: "error" in response ? String(response.error) : "Crawl failed",
              };
              updated = true;
            }
          }
        } catch (error) {
          console.error(`Failed to check status for crawl ${crawl.id}:`, error);
        }
      }

      if (updated) {
        setCrawls(updatedCrawls);
        await saveCrawls(updatedCrawls);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [crawls]);

  async function deleteCrawl(id: string) {
    const updated = crawls.filter((c) => c.id !== id);
    setCrawls(updated);
    await saveCrawls(updated);
    showToast({ style: Toast.Style.Success, title: "Crawl deleted" });
  }

  async function clearAllCrawls() {
    setCrawls([]);
    await LocalStorage.removeItem(STORAGE_KEY);
    showToast({ style: Toast.Style.Success, title: "All crawls cleared" });
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search crawls...">
      {crawls.length === 0 ? (
        <List.EmptyView title="No Crawls Yet" description="Use the Crawl Website command to start a crawl" />
      ) : (
        crawls.map((crawl) => (
          <List.Item
            key={crawl.id}
            title={crawl.url}
            subtitle={getStatusText(crawl)}
            icon={getStatusIcon(crawl.status)}
            accessories={[{ text: formatRelativeTime(crawl.startedAt) }]}
            actions={
              <ActionPanel>
                {crawl.status === "completed" && (
                  <>
                    <Action
                      title="View Results"
                      icon={Icon.Eye}
                      onAction={() => push(<CrawlResultDetail crawl={crawl} />)}
                    />
                    <Action.CopyToClipboard
                      content={crawl.markdown || ""}
                      title="Copy Markdown"
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                  </>
                )}
                <Action.OpenInBrowser url={crawl.url} shortcut={{ modifiers: ["cmd"], key: "o" }} />
                <Action
                  title="Delete"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                  onAction={() => deleteCrawl(crawl.id)}
                />
                <Action
                  title="Clear All"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                  onAction={clearAllCrawls}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
