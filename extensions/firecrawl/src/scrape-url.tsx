import { Action, ActionPanel, Form, Detail, showToast, Toast, useNavigation, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import firecrawl from "./firecrawl";
import { isValidUrl } from "./lib/crawl-storage";
import { StoredScrape, loadScrapes, saveScrapes } from "./lib/scrape-storage";

interface FormValues {
  url: string;
}

interface ScrapeResult {
  markdown?: string;
  metadata?: {
    title?: string;
    sourceURL?: string;
  };
}

function ResultDetail({ result, url }: { result: ScrapeResult; url: string }) {
  const title = result.metadata?.title || "Untitled";
  const markdown = result.markdown || "No content available";
  const fullContent = `# ${title}\n*Source: ${url}*\n\n${markdown}`;

  return (
    <Detail
      markdown={fullContent}
      navigationTitle={title}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            content={fullContent}
            title="Copy Markdown"
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.OpenInBrowser url={url} shortcut={{ modifiers: ["cmd"], key: "o" }} />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Clipboard.readText().then((text) => {
      if (text && isValidUrl(text)) {
        setUrl(text);
      }
    });
  }, []);

  async function handleSubmit(values: FormValues) {
    if (!values.url) {
      showToast({ style: Toast.Style.Failure, title: "URL is required" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await firecrawl.v1.scrapeUrl(values.url, {
        formats: ["markdown"],
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "Failed to scrape URL");
      }

      const scrapeResult = result as ScrapeResult;
      const title = scrapeResult.metadata?.title || "Untitled";
      const markdown = scrapeResult.markdown || "No content available";
      const fullContent = `# ${title}\n*Source: ${values.url}*\n\n${markdown}`;

      // Save to storage
      const newScrape: StoredScrape = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: values.url,
        title,
        scrapedAt: Date.now(),
        markdown: fullContent,
      };
      const scrapes = await loadScrapes();
      scrapes.unshift(newScrape);
      await saveScrapes(scrapes);

      push(<ResultDetail result={scrapeResult} url={values.url} />);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast({ style: Toast.Style.Failure, title: "Failed to scrape URL", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Scrape" shortcut={{ modifiers: [], key: "return" }} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="url"
        title="URL"
        placeholder="https://example.com/page"
        value={url}
        onChange={setUrl}
        autoFocus
      />
      <Form.Description text="Scrape a single page and get its markdown content." />
    </Form>
  );
}
