import { NextResponse } from "next/server";
import { db } from "@/db";
import { todos, todoTags, tags, recurringTasks, taskCompletions } from "@/db/schema";
import { eq, and, isNull, or, lte, desc } from "drizzle-orm";
import { shouldTaskOccurOnDate, formatDateISO } from "@/lib/recurrence";

export async function GET() {
  const today = new Date();
  const todayStr = formatDateISO(today);

  // Get one-time todos due today or overdue
  const todosResult = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.isCompleted, false),
        or(isNull(todos.dueDate), lte(todos.dueDate, todayStr))
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

  // Get active recurring tasks that occur today
  const recurringResult = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.isActive, true))
    .orderBy(desc(recurringTasks.createdAt));

  // Get completions for today
  const completionsResult = await db
    .select()
    .from(taskCompletions)
    .where(eq(taskCompletions.completionDate, todayStr));

  const completedIds = new Set(completionsResult.map((c) => c.recurringTaskId));

  const recurringTasksToday = recurringResult
    .filter((task) => shouldTaskOccurOnDate(task, today))
    .map((task) => ({
      ...task,
      isCompletedToday: completedIds.has(task.id),
    }));

  return NextResponse.json({
    date: todayStr,
    todos: todosWithTags,
    recurringTasks: recurringTasksToday,
  });
}
