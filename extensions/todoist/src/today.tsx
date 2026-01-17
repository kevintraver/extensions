import { getPreferenceValues, List } from "@raycast/api";

import TodayTasks from "./components/TodayTasks";
import { withTodoistApi } from "./helpers/withTodoistApi";
import useSyncData from "./hooks/useSyncData";

function Today() {
  const { isLoading } = useSyncData();
  const { showOverdueTasks } = getPreferenceValues<Preferences.Today>();

  return (
    <List
      navigationTitle="Today"
      searchBarPlaceholder="Filter tasks by name, label, priority, or assignee"
      isLoading={isLoading}
    >
      <TodayTasks
        quickLinkView={{
          title: "Today",
          view: "today",
          todoistLink: { app: "todoist://today", web: "https://app.todoist.com/app/today" },
        }}
        showOverdue={showOverdueTasks}
      />
    </List>
  );
}

export default withTodoistApi(Today);
