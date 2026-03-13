import { db } from "@/db";
import { todos, todoTags, tags, recurringTasks, taskCompletions } from "@/db/schema";
import { eq, and, isNull, or, lte, gte } from "drizzle-orm";
import { getMostRecentOccurrence, formatDateISO } from "@/lib/recurrence";
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

  // Get active recurring tasks
  const recurringResult = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.isActive, true));

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
  const recurringTaskItems: TrmnlTask[] = [];
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
        recurringTaskItems.push({
          name: task.name,
          completed: true,
          overdue: false,
        });
      }
      // If completed before today, don't show
    } else {
      // Task not completed - show as pending (overdue if occurrence is before today)
      recurringTaskItems.push({
        name: task.name,
        completed: false,
        overdue: occurrenceStr < todayStr,
      });
    }
  }

  // Combine all tasks into a single list
  const tasks: TrmnlTask[] = [
    // One-time todos
    ...todosResult.map((todo) => ({
      name: todo.name,
      completed: todo.isCompleted,
      overdue: !todo.isCompleted && todo.dueDate !== null && todo.dueDate < todayStr,
    })),
    // Recurring tasks
    ...recurringTaskItems,
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
