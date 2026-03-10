import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  getDay,
  getDate,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";
import type { RecurringTask } from "@/db/schema";

/**
 * Checks if a recurring task should occur on a given date
 */
export function shouldTaskOccurOnDate(
  task: RecurringTask,
  date: Date
): boolean {
  const dateOnly = startOfDay(date);

  // Check if within start/end bounds
  if (task.startDate) {
    const startDate = startOfDay(parseISO(task.startDate));
    if (dateOnly < startDate) return false;
  }
  if (task.endDate) {
    const endDate = endOfDay(parseISO(task.endDate));
    if (dateOnly > endDate) return false;
  }

  // Check recurrence pattern
  switch (task.recurrenceType) {
    case "daily":
      return true;

    case "weekly":
      if (!task.daysOfWeek || task.daysOfWeek.length === 0) return false;
      const dayOfWeek = getDay(dateOnly);
      return task.daysOfWeek.includes(dayOfWeek);

    case "monthly":
      if (!task.datesOfMonth || task.datesOfMonth.length === 0) return false;
      const dateOfMonth = getDate(dateOnly);
      return task.datesOfMonth.includes(dateOfMonth);

    default:
      return false;
  }
}

/**
 * Gets all dates in a range where a recurring task should occur
 */
export function getTaskOccurrencesInRange(
  task: RecurringTask,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates = eachDayOfInterval({ start: startDate, end: endDate });
  return dates.filter((date) => shouldTaskOccurOnDate(task, date));
}

/**
 * Formats a date as ISO date string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Gets a human-readable description of the recurrence pattern
 */
export function getRecurrenceDescription(task: RecurringTask): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  switch (task.recurrenceType) {
    case "daily":
      return "Every day";

    case "weekly":
      if (!task.daysOfWeek || task.daysOfWeek.length === 0) {
        return "Weekly";
      }
      if (task.daysOfWeek.length === 7) {
        return "Every day";
      }
      const days = task.daysOfWeek
        .sort((a, b) => a - b)
        .map((d) => dayNames[d])
        .join(", ");
      return `Every ${days}`;

    case "monthly":
      if (!task.datesOfMonth || task.datesOfMonth.length === 0) {
        return "Monthly";
      }
      const dates = task.datesOfMonth
        .sort((a, b) => a - b)
        .map((d) => ordinal(d))
        .join(", ");
      return `Monthly on the ${dates}`;

    default:
      return "Unknown";
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
