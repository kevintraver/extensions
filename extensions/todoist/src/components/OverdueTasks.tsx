import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { parseISO } from "date-fns";
import { useMemo } from "react";

import CreateTask from "../create-task";
import { groupByDates } from "../helpers/groupBy";
import { getTasksForTodayView } from "../helpers/tasks";
import { QuickLinkView } from "../home";
import useCachedData from "../hooks/useCachedData";
import useViewTasks from "../hooks/useViewTasks";

import CreateViewActions from "./CreateViewActions";
import TaskListSections from "./TaskListSections";

type OverdueTasksProps = { quickLinkView: QuickLinkView };

export default function OverdueTasks({ quickLinkView }: OverdueTasksProps) {
  const [data] = useCachedData();

  const tasks = useMemo(() => {
    if (!data) return [];

    const allTasks = getTasksForTodayView(data.items, data.user.id);

    // Filter to only overdue tasks (due before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allTasks.filter((task) => {
      if (!task.due) return false;
      const taskDate = parseISO(task.due.date);
      const taskDateMidnight = new Date(taskDate);
      taskDateMidnight.setHours(0, 0, 0, 0);
      return taskDateMidnight.getTime() < today.getTime();
    });
  }, [data]);

  const {
    sortedTasks,
    viewProps: { orderBy, sortBy },
  } = useViewTasks("todoist.overdue", { tasks, data, optionsToExclude: ["date"] });

  if (tasks.length === 0) {
    return (
      <List.EmptyView
        title="You don't have any overdue tasks."
        description="You're all caught up!"
        icon="🎉"
        actions={
          <ActionPanel>
            <Action.Push title="Create Task" icon={Icon.Plus} target={<CreateTask />} />

            {quickLinkView ? (
              <ActionPanel.Section>
                <CreateViewActions {...quickLinkView} />
              </ActionPanel.Section>
            ) : null}
          </ActionPanel>
        }
      />
    );
  }

  const sections = groupByDates(sortBy?.value === "default" ? tasks : sortedTasks);

  return <TaskListSections sections={sections} viewProps={{ orderBy, sortBy }} quickLinkView={quickLinkView} />;
}
