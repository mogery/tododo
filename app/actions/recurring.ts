"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  recurringTasks,
  recurringTaskTags,
  taskCompletions,
  tags,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import type { RecurringTaskWithTags, TaskCompletion } from "@/types";

export async function getRecurringTasks(): Promise<RecurringTaskWithTags[]> {
  const result = await db
    .select()
    .from(recurringTasks)
    .orderBy(desc(recurringTasks.createdAt));

  const tasksWithTags = await Promise.all(
    result.map(async (task) => {
      const taskTagsResult = await db
        .select({ tag: tags })
        .from(recurringTaskTags)
        .innerJoin(tags, eq(recurringTaskTags.tagId, tags.id))
        .where(eq(recurringTaskTags.recurringTaskId, task.id));

      return {
        ...task,
        tags: taskTagsResult.map((r) => r.tag),
      };
    })
  );

  return tasksWithTags;
}

export async function getActiveRecurringTasks(): Promise<
  RecurringTaskWithTags[]
> {
  const result = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.isActive, true))
    .orderBy(asc(recurringTasks.name));

  const tasksWithTags = await Promise.all(
    result.map(async (task) => {
      const taskTagsResult = await db
        .select({ tag: tags })
        .from(recurringTaskTags)
        .innerJoin(tags, eq(recurringTaskTags.tagId, tags.id))
        .where(eq(recurringTaskTags.recurringTaskId, task.id));

      return {
        ...task,
        tags: taskTagsResult.map((r) => r.tag),
      };
    })
  );

  return tasksWithTags;
}

export async function getRecurringTask(
  id: string
): Promise<RecurringTaskWithTags | null> {
  const result = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const task = result[0];
  const taskTagsResult = await db
    .select({ tag: tags })
    .from(recurringTaskTags)
    .innerJoin(tags, eq(recurringTaskTags.tagId, tags.id))
    .where(eq(recurringTaskTags.recurringTaskId, task.id));

  return {
    ...task,
    tags: taskTagsResult.map((r) => r.tag),
  };
}

export async function createRecurringTask(data: {
  name: string;
  description?: string;
  recurrenceType: "daily" | "weekly" | "monthly";
  daysOfWeek?: number[];
  datesOfMonth?: number[];
  startDate?: string;
  endDate?: string;
  tagIds?: string[];
}) {
  const [task] = await db
    .insert(recurringTasks)
    .values({
      name: data.name,
      description: data.description || null,
      recurrenceType: data.recurrenceType,
      daysOfWeek: data.daysOfWeek || null,
      datesOfMonth: data.datesOfMonth || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    })
    .returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(recurringTaskTags).values(
      data.tagIds.map((tagId) => ({
        recurringTaskId: task.id,
        tagId,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/recurring");
  return task;
}

export async function updateRecurringTask(
  id: string,
  data: {
    name?: string;
    description?: string;
    recurrenceType?: "daily" | "weekly" | "monthly";
    daysOfWeek?: number[] | null;
    datesOfMonth?: number[] | null;
    startDate?: string | null;
    endDate?: string | null;
    isActive?: boolean;
    tagIds?: string[];
  }
) {
  const [task] = await db
    .update(recurringTasks)
    .set({
      name: data.name,
      description: data.description,
      recurrenceType: data.recurrenceType,
      daysOfWeek: data.daysOfWeek,
      datesOfMonth: data.datesOfMonth,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(recurringTasks.id, id))
    .returning();

  if (data.tagIds !== undefined) {
    await db
      .delete(recurringTaskTags)
      .where(eq(recurringTaskTags.recurringTaskId, id));

    if (data.tagIds.length > 0) {
      await db.insert(recurringTaskTags).values(
        data.tagIds.map((tagId) => ({
          recurringTaskId: id,
          tagId,
        }))
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/recurring");
  return task;
}

export async function deleteRecurringTask(id: string) {
  await db.delete(recurringTasks).where(eq(recurringTasks.id, id));
  revalidatePath("/");
  revalidatePath("/recurring");
}

export async function getCompletionsForDate(
  date: string
): Promise<TaskCompletion[]> {
  return db
    .select()
    .from(taskCompletions)
    .where(eq(taskCompletions.completionDate, date));
}

export async function toggleRecurringTaskCompletion(
  recurringTaskId: string,
  date: string
) {
  // Check if already completed
  const existing = await db
    .select()
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.recurringTaskId, recurringTaskId),
        eq(taskCompletions.completionDate, date)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove completion
    await db
      .delete(taskCompletions)
      .where(eq(taskCompletions.id, existing[0].id));
  } else {
    // Add completion
    await db.insert(taskCompletions).values({
      recurringTaskId,
      completionDate: date,
    });
  }

  revalidatePath("/");
}
