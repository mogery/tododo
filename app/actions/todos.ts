"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { todos, todoTags, tags } from "@/db/schema";
import { eq, desc, and, isNull, or, lte } from "drizzle-orm";
import type { TodoWithTags } from "@/types";

export async function getTodos(): Promise<TodoWithTags[]> {
  const result = await db.query.todos.findMany({
    orderBy: [desc(todos.createdAt)],
    with: {
      // We need to manually join tags through todoTags
    },
  });

  // Get tags for each todo
  const todosWithTags = await Promise.all(
    result.map(async (todo) => {
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

  return todosWithTags;
}

export async function getTodayTodos(): Promise<TodoWithTags[]> {
  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.isCompleted, false),
        or(isNull(todos.dueDate), lte(todos.dueDate, today))
      )
    )
    .orderBy(todos.dueDate, todos.createdAt);

  const todosWithTags = await Promise.all(
    result.map(async (todo) => {
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

  return todosWithTags;
}

export async function getTodo(id: string): Promise<TodoWithTags | null> {
  const result = await db.select().from(todos).where(eq(todos.id, id)).limit(1);

  if (result.length === 0) return null;

  const todo = result[0];
  const todoTagsResult = await db
    .select({ tag: tags })
    .from(todoTags)
    .innerJoin(tags, eq(todoTags.tagId, tags.id))
    .where(eq(todoTags.todoId, todo.id));

  return {
    ...todo,
    tags: todoTagsResult.map((r) => r.tag),
  };
}

export async function createTodo(data: {
  name: string;
  description?: string;
  dueDate?: string;
  tagIds?: string[];
}) {
  const [todo] = await db
    .insert(todos)
    .values({
      name: data.name,
      description: data.description || null,
      dueDate: data.dueDate || null,
    })
    .returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(todoTags).values(
      data.tagIds.map((tagId) => ({
        todoId: todo.id,
        tagId,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  return todo;
}

export async function updateTodo(
  id: string,
  data: {
    name?: string;
    description?: string;
    dueDate?: string | null;
    tagIds?: string[];
  }
) {
  const [todo] = await db
    .update(todos)
    .set({
      name: data.name,
      description: data.description,
      dueDate: data.dueDate,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id))
    .returning();

  if (data.tagIds !== undefined) {
    // Remove existing tags
    await db.delete(todoTags).where(eq(todoTags.todoId, id));

    // Add new tags
    if (data.tagIds.length > 0) {
      await db.insert(todoTags).values(
        data.tagIds.map((tagId) => ({
          todoId: id,
          tagId,
        }))
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return todo;
}

export async function toggleTodo(id: string) {
  const [existing] = await db
    .select()
    .from(todos)
    .where(eq(todos.id, id))
    .limit(1);

  if (!existing) return null;

  const [todo] = await db
    .update(todos)
    .set({
      isCompleted: !existing.isCompleted,
      completedAt: existing.isCompleted ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id))
    .returning();

  revalidatePath("/");
  revalidatePath("/tasks");
  return todo;
}

export async function deleteTodo(id: string) {
  await db.delete(todos).where(eq(todos.id, id));
  revalidatePath("/");
  revalidatePath("/tasks");
}
