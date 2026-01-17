import { parseISO } from "date-fns";
import { useMemo } from "react";

import { groupByDates } from "../helpers/groupBy";
import { getTasksForTodayView } from "../helpers/tasks";
import { QuickLinkView } from "../home";
import useCachedData from "../hooks/useCachedData";
import useViewTasks from "../hooks/useViewTasks";

import TaskListSections from "./TaskListSections";
import TodayEmptyView from "./TodayEmptyView";

type TodayTasksProps = { quickLinkView: QuickLinkView; showOverdue?: boolean };

export default function TodayTasks({ quickLinkView, showOverdue = true }: TodayTasksProps) {
  const [data] = useCachedData();

  const tasks = useMemo(() => {
    if (!data) return [];

    const allTasks = getTasksForTodayView(data.items, data.user.id);

    if (showOverdue) {
      return allTasks;
    }

    // Filter out overdue tasks, only show tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allTasks.filter((task) => {
      if (!task.due) return false;
      const taskDate = parseISO(task.due.date);
      const taskDateMidnight = new Date(taskDate);
      taskDateMidnight.setHours(0, 0, 0, 0);
      return taskDateMidnight.getTime() === today.getTime();
    });
  }, [data, showOverdue]);

  let sections = [];

  const { sections: groupedSections, viewProps } = useViewTasks("todoist.today", {
    tasks,
    data,
    optionsToExclude: ["date"],
  });

  // Handle the date grouping case specially to ensure we only use our filtered tasks
  if (viewProps.groupBy?.value === "date" || viewProps.groupBy?.value === "default") {
    sections = groupByDates(tasks);
  } else {
    sections = groupedSections;
  }

  if (tasks.length === 0) {
    return <TodayEmptyView quickLinkView={quickLinkView} />;
  }

  return <TaskListSections sections={sections} viewProps={viewProps} quickLinkView={quickLinkView} />;
}
