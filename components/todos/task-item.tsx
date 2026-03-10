"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  DotsThree,
  Pencil,
  Trash,
  Calendar,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toggleTodo, deleteTodo } from "@/app/actions/todos";
import { toggleRecurringTaskCompletion } from "@/app/actions/recurring";
import type { TaskItem } from "@/types";
import { getRecurrenceDescription } from "@/lib/recurrence";

interface TaskItemProps {
  item: TaskItem;
}

export function TaskItemComponent({ item }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();

  const isVirtual = item.type === "virtual";
  const name = isVirtual ? item.recurringTask.name : item.task.name;
  const description = isVirtual
    ? item.recurringTask.description
    : item.task.description;
  const tags = isVirtual ? item.recurringTask.tags : item.task.tags;
  const isCompleted = isVirtual ? item.isCompleted : item.task.isCompleted;
  const dueDate = isVirtual ? null : item.task.dueDate;

  const handleToggle = () => {
    startTransition(async () => {
      if (isVirtual) {
        await toggleRecurringTaskCompletion(item.recurringTask.id, item.date);
      } else {
        await toggleTodo(item.task.id);
      }
    });
  };

  const handleDelete = () => {
    if (isVirtual) return; // Can't delete virtual tasks
    startTransition(async () => {
      await deleteTodo(item.task.id);
    });
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        isPending && "opacity-50",
        isCompleted && "bg-muted/50"
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium leading-tight",
                isCompleted && "text-muted-foreground line-through"
              )}
            >
              {name}
            </p>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              {isVirtual && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowsClockwise className="size-3" />
                  {getRecurrenceDescription(item.recurringTask)}
                </span>
              )}
              {dueDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {format(parseISO(dueDate), "MMM d")}
                </span>
              )}
            </div>
          </div>

          {!isVirtual && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <DotsThree className="size-4" weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/tasks/${item.task.id}`}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
