import type {
  Todo,
  RecurringTask,
  TaskCompletion,
  Tag,
} from "@/db/schema";

// Extended types with relations
export interface TodoWithTags extends Todo {
  tags: Tag[];
}

export interface RecurringTaskWithTags extends RecurringTask {
  tags: Tag[];
}

// Virtual task representing a recurring task occurrence for a specific date
export interface VirtualTask {
  type: "virtual";
  recurringTask: RecurringTaskWithTags;
  date: string; // ISO date string
  isCompleted: boolean;
  completionId?: string;
}

// Union type for all tasks shown in the UI
export type TaskItem =
  | { type: "todo"; task: TodoWithTags }
  | VirtualTask;

// Form types
export interface TodoFormData {
  name: string;
  description?: string;
  dueDate?: string;
  tagIds: string[];
}

export interface RecurringTaskFormData {
  name: string;
  description?: string;
  recurrenceType: "daily" | "weekly" | "monthly";
  daysOfWeek?: number[];
  datesOfMonth?: number[];
  startDate?: string;
  endDate?: string;
  tagIds: string[];
}

export interface TagFormData {
  name: string;
  color: string;
}

// Re-export schema types
export type { Todo, RecurringTask, TaskCompletion, Tag };
