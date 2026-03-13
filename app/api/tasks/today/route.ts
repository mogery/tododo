import { NextResponse } from "next/server";
import { db } from "@/db";
import { todos, todoTags, tags, recurringTasks, taskCompletions } from "@/db/schema";
import { eq, and, isNull, or, lte, desc, gte } from "drizzle-orm";
import { getMostRecentOccurrence, formatDateISO } from "@/lib/recurrence";

export async function GET() {
  const today = new Date();
  const todayStr = formatDateISO(today);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Calculate lookback date (30 days ago)
  const lookbackDate = new Date(today);
  lookbackDate.setDate(lookbackDate.getDate() - 30);
  const lookbackStr = formatDateISO(lookbackDate);

  // Get one-time todos due today or overdue, OR completed today
  const todosResult = await db
    .select()
    .from(todos)
    .where(
      or(
        // Incomplete tasks due today or overdue
        and(
          eq(todos.isCompleted, false),
          or(isNull(todos.dueDate), lte(todos.dueDate, todayStr))
        ),
        // Tasks completed today (stick around until next day)
        and(
          eq(todos.isCompleted, true),
          gte(todos.completedAt, startOfToday)
        )
      )
    )
    .orderBy(todos.dueDate, todos.createdAt);

  const todosWithTags = await Promise.all(
    todosResult.map(async (todo) => {
      const todoTagsResult = await db
        .select({ tag: tags })
        .from(todoTags)
        .innerJoin(tags, eq(todoTags.tagId, tags.id))
        .where(eq(todoTags.todoId, todo.id));

      return {
        ...todo,
        tags: todoTagsResult.map((r) => r.tag),
      };
    })
  );

  // Get active recurring tasks
  const recurringResult = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.isActive, true))
    .orderBy(desc(recurringTasks.createdAt));

  // Get completions for the lookback period
  const completionsResult = await db
    .select()
    .from(taskCompletions)
    .where(
      and(
        gte(taskCompletions.completionDate, lookbackStr),
        lte(taskCompletions.completionDate, todayStr)
      )
    );

  // Group completions by task
  const completionsByTask = new Map<string, typeof completionsResult>();
  completionsResult.forEach((c) => {
    const existing = completionsByTask.get(c.recurringTaskId) || [];
    existing.push(c);
    completionsByTask.set(c.recurringTaskId, existing);
  });

  // Build recurring tasks list with same logic as UI
  const recurringTasksToday: Array<typeof recurringResult[0] & { isCompletedToday: boolean; occurrenceDate: string }> = [];
  for (const task of recurringResult) {
    const mostRecentOccurrence = getMostRecentOccurrence(task, today);
    if (!mostRecentOccurrence) continue;

    const occurrenceStr = formatDateISO(mostRecentOccurrence);
    const taskCompletions = completionsByTask.get(task.id) || [];
    const completion = taskCompletions.find((c) => c.completionDate === occurrenceStr);

    if (completion) {
      // Task was completed - only show if completed today
      const completedAt = new Date(completion.completedAt);
      if (completedAt >= startOfToday) {
        recurringTasksToday.push({
          ...task,
          isCompletedToday: true,
          occurrenceDate: occurrenceStr,
        });
      }
      // If completed before today, don't show
    } else {
      // Task not completed - show as pending
      recurringTasksToday.push({
        ...task,
        isCompletedToday: false,
        occurrenceDate: occurrenceStr,
      });
    }
  }

  return NextResponse.json({
    date: todayStr,
    todos: todosWithTags,
    recurringTasks: recurringTasksToday,
  });
}
