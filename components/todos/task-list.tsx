"use client";

import { TaskItemComponent } from "./task-item";
import type { TaskItem } from "@/types";
import { ClipboardText } from "@phosphor-icons/react";

interface TaskListProps {
  items: TaskItem[];
  emptyMessage?: string;
}

export function TaskList({
  items,
  emptyMessage = "No tasks yet",
}: TaskListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardText className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const key =
          item.type === "virtual"
            ? `${item.recurringTask.id}-${item.date}`
            : item.task.id;
        return <TaskItemComponent key={key} item={item} />;
      })}
    </div>
  );
}
