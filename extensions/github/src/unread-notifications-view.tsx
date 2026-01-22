import { List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useMemo, useState } from "react";

import { getGitHubClient } from "./api/githubClient";
import NotificationListItem from "./components/NotificationListItem";
import RepositoriesDropdown from "./components/RepositoryDropdown";
import { getNotificationIcon, Notification } from "./helpers/notifications";
import { withGitHubClient } from "./helpers/withGithubClient";
import { useViewer } from "./hooks/useViewer";

import type { NotificationWithIcon } from "./notifications";

function UnreadNotificationsView() {
  const { octokit } = getGitHubClient();

  const viewer = useViewer();

  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);

  const {
    data,
    isLoading,
    mutate: mutateList,
  } = useCachedPromise(async () => {
    const response = await octokit.activity.listNotificationsForAuthenticatedUser({ all: false });
    return Promise.all(
      response.data.map(async (notification: Notification) => {
        const icon = await getNotificationIcon(notification);
        return { ...notification, icon };
      }),
    );
  });

  const notifications = useMemo(() => {
    if (selectedRepository) {
      return data?.filter((notification: Notification) => notification.repository.full_name === selectedRepository);
    }

    return data;
  }, [data, selectedRepository]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter by title"
      searchBarAccessory={<RepositoriesDropdown setSelectedRepository={setSelectedRepository} />}
    >
      {notifications?.map((notification: NotificationWithIcon) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          userId={viewer?.id}
          mutateList={mutateList}
        />
      ))}

      <List.EmptyView title="No unread notifications" />
    </List>
  );
}

export default withGitHubClient(UnreadNotificationsView);
