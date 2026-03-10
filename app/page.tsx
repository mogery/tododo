import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/todos/task-list";
import { getTodayTodos } from "@/app/actions/todos";
import { getActiveRecurringTasks, getCompletionsForDate } from "@/app/actions/recurring";
import { shouldTaskOccurOnDate, formatDateISO } from "@/lib/recurrence";
import type { TaskItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = new Date();
  const todayStr = formatDateISO(today);

  const [todos, recurringTasks, completions] = await Promise.all([
    getTodayTodos(),
    getActiveRecurringTasks(),
    getCompletionsForDate(todayStr),
  ]);

  // Build task items from todos
  const todoItems: TaskItem[] = todos.map((todo) => ({
    type: "todo",
    task: todo,
  }));

  // Build virtual tasks from recurring tasks
  const completionMap = new Map(completions.map((c) => [c.recurringTaskId, c]));
  const virtualItems: TaskItem[] = recurringTasks
    .filter((task) => shouldTaskOccurOnDate(task, today))
    .map((task) => {
      const completion = completionMap.get(task.id);
      return {
        type: "virtual" as const,
        recurringTask: task,
        date: todayStr,
        isCompleted: !!completion,
        completionId: completion?.id,
      };
    });

  // Combine and sort: incomplete first, then by name
  const allItems = [...todoItems, ...virtualItems].sort((a, b) => {
    const aCompleted = a.type === "virtual" ? a.isCompleted : a.task.isCompleted;
    const bCompleted = b.type === "virtual" ? b.isCompleted : b.task.isCompleted;

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    const aName = a.type === "virtual" ? a.recurringTask.name : a.task.name;
    const bName = b.type === "virtual" ? b.recurringTask.name : b.task.name;
    return aName.localeCompare(bName);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-sm text-muted-foreground">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 size-4" weight="bold" />
            Add task
          </Link>
        </Button>
      </div>

      <TaskList
        items={allItems}
        emptyMessage="No tasks for today. Enjoy your day!"
      />
    </div>
  );
}
