import { db } from "@/db";
import { todos, todoTags, tags, recurringTasks, taskCompletions } from "@/db/schema";
import { eq, and, isNull, or, lte } from "drizzle-orm";
import { shouldTaskOccurOnDate, formatDateISO } from "@/lib/recurrence";
import { format } from "date-fns";

// Simple debounce state - 5 second cooldown between pushes
let lastPushTime = 0;
const DEBOUNCE_MS = 5000;

interface TrmnlTask {
  name: string;
  completed: boolean;
  overdue: boolean;
}

interface TrmnlPayload {
  merge_variables: {
    date: string;
    date_formatted: string;
    tasks: TrmnlTask[];
    stats: {
      total: number;
      completed: number;
      pending: number;
    };
  };
}

/**
 * Fetches today's tasks and formats them for TRMNL
 */
export async function buildTrmnlPayload(): Promise<TrmnlPayload> {
  const today = new Date();
  const todayStr = formatDateISO(today);

  // Get one-time todos due today or overdue (incomplete only)
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

  // Get active recurring tasks that occur today
  const recurringResult = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.isActive, true));

  const recurringTasksToday = recurringResult.filter((task) =>
    shouldTaskOccurOnDate(task, today)
  );

  // Get completions for today
  const completionsResult = await db
    .select()
    .from(taskCompletions)
    .where(eq(taskCompletions.completionDate, todayStr));

  const completedIds = new Set(completionsResult.map((c) => c.recurringTaskId));

  // Combine all tasks into a single list
  const tasks: TrmnlTask[] = [
    // One-time todos (incomplete only, so completed is always false)
    ...todosResult.map((todo) => ({
      name: todo.name,
      completed: false,
      overdue: todo.dueDate !== null && todo.dueDate < todayStr,
    })),
    // Recurring tasks for today
    ...recurringTasksToday.map((task) => ({
      name: task.name,
      completed: completedIds.has(task.id),
      overdue: false,
    })),
  ];

  // Calculate stats
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  return {
    merge_variables: {
      date: todayStr,
      date_formatted: format(today, "EEEE, MMMM d"),
      tasks,
      stats: {
        total,
        completed,
        pending,
      },
    },
  };
}

/**
 * Pushes current todo state to TRMNL display.
 * Fire-and-forget: logs errors but doesn't throw.
 * Includes 5-second debouncing to avoid rate limits.
 */
export async function pushToTrmnl(): Promise<void> {
  const webhookUrl = process.env.TRMNL_WEBHOOK_URL;

  // Gracefully degrade if not configured
  if (!webhookUrl) {
    return;
  }

  // Check debounce
  const now = Date.now();
  if (now - lastPushTime < DEBOUNCE_MS) {
    return;
  }
  lastPushTime = now;

  try {
    const payload = await buildTrmnlPayload();

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `TRMNL push failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("TRMNL push error:", error);
  }
}
