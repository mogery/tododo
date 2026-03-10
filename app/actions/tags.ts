"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { Tag } from "@/types";

export async function getTags(): Promise<Tag[]> {
  return db.select().from(tags).orderBy(asc(tags.name));
}

export async function getTag(id: string): Promise<Tag | null> {
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result[0] || null;
}

export async function createTag(data: { name: string; color: string }) {
  const [tag] = await db
    .insert(tags)
    .values({
      name: data.name,
      color: data.color,
    })
    .returning();

  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath("/tasks");
  return tag;
}

export async function updateTag(
  id: string,
  data: { name?: string; color?: string }
) {
  const [tag] = await db
    .update(tags)
    .set({
      name: data.name,
      color: data.color,
      updatedAt: new Date(),
    })
    .where(eq(tags.id, id))
    .returning();

  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath("/tasks");
  return tag;
}

export async function deleteTag(id: string) {
  await db.delete(tags).where(eq(tags.id, id));
  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath("/tasks");
}
