import { List } from "@raycast/api";

import InboxTasks from "./components/InboxTasks";
import { withTodoistApi } from "./helpers/withTodoistApi";
import useSyncData from "./hooks/useSyncData";

function Inbox() {
  const { isLoading } = useSyncData();

  return (
    <List
      navigationTitle="Inbox"
      searchBarPlaceholder="Filter tasks by name, label, priority, or assignee"
      isLoading={isLoading}
    >
      <InboxTasks
        quickLinkView={{
          title: "Inbox",
          view: "inbox",
          todoistLink: { app: "todoist://inbox", web: "https://app.todoist.com/app/inbox" },
        }}
      />
    </List>
  );
}

export default withTodoistApi(Inbox);
