import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

// One-time tasks
export const todos = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Templates for recurring tasks
export const recurringTasks = pgTable("recurring_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  recurrenceType: text("recurrence_type", {
    enum: ["daily", "weekly", "monthly"],
  }).notNull(),
  // For weekly: array of day numbers [0-6] where 0 = Sunday
  daysOfWeek: jsonb("days_of_week").$type<number[]>(),
  // For monthly: array of dates [1-31]
  datesOfMonth: jsonb("dates_of_month").$type<number[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tracks recurring task completions per date
export const taskCompletions = pgTable("task_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  recurringTaskId: uuid("recurring_task_id")
    .references(() => recurringTasks.id, { onDelete: "cascade" })
    .notNull(),
  completionDate: date("completion_date").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Tag definitions
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Junction table for todos and tags (many-to-many)
export const todoTags = pgTable(
  "todo_tags",
  {
    todoId: uuid("todo_id")
      .references(() => todos.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.todoId, table.tagId] })]
);

// Junction table for recurring tasks and tags (many-to-many)
export const recurringTaskTags = pgTable(
  "recurring_task_tags",
  {
    recurringTaskId: uuid("recurring_task_id")
      .references(() => recurringTasks.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.recurringTaskId, table.tagId] })]
);

// Type exports
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type RecurringTask = typeof recurringTasks.$inferSelect;
export type NewRecurringTask = typeof recurringTasks.$inferInsert;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type NewTaskCompletion = typeof taskCompletions.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
