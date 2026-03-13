import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/todos/task-list";
import { getTodayTodos } from "@/app/actions/todos";
import { getActiveRecurringTasks, getCompletionsInDateRange } from "@/app/actions/recurring";
import { getMostRecentOccurrence, formatDateISO } from "@/lib/recurrence";
import type { TaskItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = new Date();
  const todayStr = formatDateISO(today);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Calculate lookback date (30 days ago)
  const lookbackDate = new Date(today);
  lookbackDate.setDate(lookbackDate.getDate() - 30);
  const lookbackStr = formatDateISO(lookbackDate);

  const [todos, recurringTasks, completions] = await Promise.all([
    getTodayTodos(),
    getActiveRecurringTasks(),
    getCompletionsInDateRange(lookbackStr, todayStr),
  ]);

  // Build task items from todos
  const todoItems: TaskItem[] = todos.map((todo) => ({
    type: "todo",
    task: todo,
  }));

  // Build virtual tasks from recurring tasks
  // Show tasks that:
  // 1. Have an incomplete most recent occurrence (stick around until completed)
  // 2. Were completed today (stick around until next day)
  const completionsByTask = new Map<string, typeof completions>();
  completions.forEach((c) => {
    const existing = completionsByTask.get(c.recurringTaskId) || [];
    existing.push(c);
    completionsByTask.set(c.recurringTaskId, existing);
  });

  const virtualItems: TaskItem[] = [];
  for (const task of recurringTasks) {
    const mostRecentOccurrence = getMostRecentOccurrence(task, today);
    if (!mostRecentOccurrence) continue;

    const occurrenceStr = formatDateISO(mostRecentOccurrence);
    const taskCompletions = completionsByTask.get(task.id) || [];
    const completion = taskCompletions.find((c) => c.completionDate === occurrenceStr);

    if (completion) {
      // Task was completed - only show if completed today
      const completedAt = new Date(completion.completedAt);
      if (completedAt >= startOfToday) {
        virtualItems.push({
          type: "virtual" as const,
          recurringTask: task,
          date: occurrenceStr,
          isCompleted: true,
          completionId: completion.id,
        });
      }
      // If completed before today, don't show
    } else {
      // Task not completed - show as pending
      virtualItems.push({
        type: "virtual" as const,
        recurringTask: task,
        date: occurrenceStr,
        isCompleted: false,
        completionId: undefined,
      });
    }
  }

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
