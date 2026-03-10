import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { todos, todoTags, tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (body.description !== undefined && typeof body.description !== "string") {
      return NextResponse.json(
        { error: "description must be a string" },
        { status: 400 }
      );
    }

    if (body.dueDate !== undefined) {
      if (typeof body.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
        return NextResponse.json(
          { error: "dueDate must be a string in YYYY-MM-DD format" },
          { status: 400 }
        );
      }
    }

    if (body.tagIds !== undefined) {
      if (!Array.isArray(body.tagIds) || !body.tagIds.every((id: unknown) => typeof id === "string")) {
        return NextResponse.json(
          { error: "tagIds must be an array of strings" },
          { status: 400 }
        );
      }
    }

    // Create the todo
    const [todo] = await db
      .insert(todos)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        dueDate: body.dueDate || null,
      })
      .returning();

    // Add tags if provided
    if (body.tagIds && body.tagIds.length > 0) {
      await db.insert(todoTags).values(
        body.tagIds.map((tagId: string) => ({
          todoId: todo.id,
          tagId,
        }))
      );
    }

    // Fetch tags for response
    const todoTagsResult = await db
      .select({ tag: tags })
      .from(todoTags)
      .innerJoin(tags, eq(todoTags.tagId, tags.id))
      .where(eq(todoTags.todoId, todo.id));

    return NextResponse.json(
      {
        ...todo,
        tags: todoTagsResult.map((r) => r.tag),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
