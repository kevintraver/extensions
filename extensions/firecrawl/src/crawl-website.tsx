import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import firecrawl from "./firecrawl";
import { StoredCrawl, loadCrawls, saveCrawls, isValidUrl } from "./lib/crawl-storage";

interface FormValues {
  url: string;
  limit: string;
}

export default function Command() {
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
      const limit = Math.min(parseInt(values.limit) || 10, 100);
      const result = await firecrawl.v1.asyncCrawlUrl(values.url, {
        limit,
        scrapeOptions: { formats: ["markdown"] },
      });

      if (!result.success || !result.id) {
        throw new Error("error" in result ? result.error : "Failed to start crawl");
      }

      const newCrawl: StoredCrawl = {
        id: result.id as string,
        url: values.url,
        startedAt: Date.now(),
        status: "scraping",
      };

      const crawls = await loadCrawls();
      crawls.unshift(newCrawl);
      await saveCrawls(crawls);

      showToast({ style: Toast.Style.Success, title: "Crawl started", message: values.url });
      setUrl("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast({ style: Toast.Style.Failure, title: "Failed to start crawl", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Start Crawl" shortcut={{ modifiers: [], key: "return" }} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="url" title="URL" placeholder="https://example.com" value={url} onChange={setUrl} autoFocus />
      <Form.TextField id="limit" title="Page Limit" placeholder="Maximum pages to crawl" defaultValue="10" />
      <Form.Description text="Crawl a website and get markdown content from multiple pages. View results in Recent Crawls." />
    </Form>
  );
}
