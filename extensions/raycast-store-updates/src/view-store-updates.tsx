import { ActionPanel, Action, List, Icon, Keyboard, LocalStorage } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useCallback, useEffect, useState } from "react";

// =============================================================================
// Types
// =============================================================================

interface FeedAuthor {
  name: string;
  url: string;
}

interface FeedItem {
  id: string;
  url: string;
  title: string;
  summary: string;
  image: string;
  date_modified: string;
  author: FeedAuthor;
}

interface Feed {
  version: string;
  title: string;
  home_page_url: string;
  description: string;
  icon: string;
  items: FeedItem[];
}

// =============================================================================
// Constants
// =============================================================================

const FEED_URL = "https://www.raycast.com/store/feed.json";
const STORAGE_KEY = "readItemIds";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parses the Raycast Store URL to extract author and extension name.
 * URL format: https://www.raycast.com/{author}/{extension}
 */
function parseExtensionUrl(url: string): { author: string; extension: string } {
  const path = url.replace("https://www.raycast.com/", "");
  const [author, extension] = path.split("/");
  return { author, extension };
}

/**
 * Creates a Raycast deeplink to open an extension in the Store.
 * Format: raycast://extensions/{author}/{extension}
 */
function createStoreDeeplink(url: string): string {
  const { author, extension } = parseExtensionUrl(url);
  return `raycast://extensions/${author}/${extension}`;
}

// =============================================================================
// Components
// =============================================================================

function FilterDropdown({ onChange }: { onChange: (value: string) => void }) {
  return (
    <List.Dropdown tooltip="Filter" defaultValue="unread" onChange={onChange}>
      <List.Dropdown.Item title="Unread" value="unread" icon={Icon.Circle} />
      <List.Dropdown.Item title="All" value="all" icon={Icon.List} />
    </List.Dropdown>
  );
}

function ExtensionActions({
  item,
  isRead,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
}: {
  item: FeedItem;
  isRead: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onMarkAllAsRead: () => void;
}) {
  const storeDeeplink = createStoreDeeplink(item.url);

  return (
    <ActionPanel>
      <ActionPanel.Section>
        <Action.OpenInBrowser
          title="Open in Raycast Store"
          url={storeDeeplink}
          icon={Icon.RaycastLogoNeg}
          shortcut={Keyboard.Shortcut.Common.Open}
        />
        <Action.OpenInBrowser title="Open in Browser" url={item.url} icon={Icon.Globe} />
        <Action.CopyToClipboard
          title="Copy Extension URL"
          content={item.url}
          shortcut={Keyboard.Shortcut.Common.Copy}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        {isRead ? (
          <Action
            title="Mark as Unread"
            icon={Icon.Circle}
            shortcut={{ modifiers: ["cmd", "shift"], key: "u" }}
            onAction={() => onMarkAsUnread(item.id)}
          />
        ) : (
          <Action
            title="Mark as Read"
            icon={Icon.Checkmark}
            shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
            onAction={() => onMarkAsRead(item.id)}
          />
        )}
        <Action
          title="Mark All as Read"
          icon={Icon.CheckList}
          shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
          onAction={onMarkAllAsRead}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action.OpenInBrowser title="View Author Profile" url={item.author.url} icon={Icon.Person} />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function ExtensionListItem({
  item,
  isRead,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
}: {
  item: FeedItem;
  isRead: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onMarkAllAsRead: () => void;
}) {
  const modifiedDate = new Date(item.date_modified);

  return (
    <List.Item
      icon={{ source: item.image, fallback: Icon.Box }}
      title={item.title}
      subtitle={item.summary}
      accessories={[
        ...(isRead ? [{ icon: Icon.Check, tooltip: "Read" }] : []),
        {
          icon: Icon.Person,
          text: item.author.name,
          tooltip: `Author: ${item.author.name}`,
        },
        {
          date: modifiedDate,
          tooltip: `Modified: ${modifiedDate.toLocaleString()}`,
        },
      ]}
      actions={
        <ExtensionActions
          item={item}
          isRead={isRead}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
          onMarkAllAsRead={onMarkAllAsRead}
        />
      }
    />
  );
}

// =============================================================================
// Command
// =============================================================================

export default function Command() {
  const { data, isLoading } = useFetch<Feed>(FEED_URL, {
    keepPreviousData: true,
  });

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoadingReadIds, setIsLoadingReadIds] = useState(true);
  const [filter, setFilter] = useState<string>("unread");

  useEffect(() => {
    LocalStorage.getItem<string>(STORAGE_KEY).then((stored) => {
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
      setIsLoadingReadIds(false);
    });
  }, []);

  const persistReadIds = useCallback(async (ids: Set<string>) => {
    setReadIds(ids);
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }, []);

  const items = data?.items ?? [];

  const markAsRead = useCallback(
    async (id: string) => {
      const next = new Set(readIds);
      next.add(id);
      await persistReadIds(next);
    },
    [readIds, persistReadIds],
  );

  const markAsUnread = useCallback(
    async (id: string) => {
      const next = new Set(readIds);
      next.delete(id);
      await persistReadIds(next);
    },
    [readIds, persistReadIds],
  );

  const markAllAsRead = useCallback(async () => {
    const next = new Set(readIds);
    for (const item of items) {
      next.add(item.id);
    }
    await persistReadIds(next);
  }, [readIds, items, persistReadIds]);

  const filteredItems = filter === "unread" ? items.filter((item) => !readIds.has(item.id)) : items;

  return (
    <List
      isLoading={isLoading || isLoadingReadIds}
      searchBarPlaceholder="Search extensions..."
      searchBarAccessory={<FilterDropdown onChange={setFilter} />}
    >
      {filteredItems.length === 0 && !isLoading && !isLoadingReadIds ? (
        <List.EmptyView
          icon={filter === "unread" ? Icon.CheckCircle : Icon.MagnifyingGlass}
          title={filter === "unread" ? "All Caught Up" : "No Extensions Found"}
          description={filter === "unread" ? "No unread store updates" : "Unable to load the feed"}
        />
      ) : (
        filteredItems.map((item) => (
          <ExtensionListItem
            key={item.id}
            item={item}
            isRead={readIds.has(item.id)}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onMarkAllAsRead={markAllAsRead}
          />
        ))
      )}
    </List>
  );
}
