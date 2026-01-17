import { List } from "@raycast/api";

import OverdueTasks from "./components/OverdueTasks";
import { withTodoistApi } from "./helpers/withTodoistApi";
import useSyncData from "./hooks/useSyncData";

function Overdue() {
  const { isLoading } = useSyncData();

  return (
    <List
      navigationTitle="Overdue"
      searchBarPlaceholder="Filter tasks by name, label, priority, or assignee"
      isLoading={isLoading}
    >
      <OverdueTasks
        quickLinkView={{
          title: "Overdue",
          view: "overdue",
        }}
      />
    </List>
  );
}

export default withTodoistApi(Overdue);
