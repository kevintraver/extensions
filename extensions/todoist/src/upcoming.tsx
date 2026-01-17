import { List } from "@raycast/api";

import UpcomingTasks from "./components/UpcomingTasks";
import { withTodoistApi } from "./helpers/withTodoistApi";
import useSyncData from "./hooks/useSyncData";

function Upcoming() {
  const { isLoading } = useSyncData();

  return (
    <List
      navigationTitle="Upcoming"
      searchBarPlaceholder="Filter tasks by name, label, priority, or assignee"
      isLoading={isLoading}
    >
      <UpcomingTasks
        quickLinkView={{
          title: "Upcoming",
          view: "upcoming",
          todoistLink: { app: "todoist://upcoming", web: "https://app.todoist.com/app/upcoming" },
        }}
      />
    </List>
  );
}

export default withTodoistApi(Upcoming);
