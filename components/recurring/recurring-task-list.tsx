"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  DotsThree,
  Pencil,
  Trash,
  Pause,
  Play,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  updateRecurringTask,
  deleteRecurringTask,
} from "@/app/actions/recurring";
import { getRecurrenceDescription } from "@/lib/recurrence";
import type { RecurringTaskWithTags } from "@/types";

interface RecurringTaskListProps {
  tasks: RecurringTaskWithTags[];
}

export function RecurringTaskList({ tasks }: RecurringTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ArrowsClockwise className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No recurring tasks yet</p>
        <p className="text-sm text-muted-foreground">
          Create recurring tasks that repeat automatically
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <RecurringTaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

interface RecurringTaskItemProps {
  task: RecurringTaskWithTags;
}

function RecurringTaskItem({ task }: RecurringTaskItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = () => {
    startTransition(async () => {
      await updateRecurringTask(task.id, { isActive: !task.isActive });
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete recurring task "${task.name}"?`)) return;
    startTransition(async () => {
      await deleteRecurringTask(task.id);
    });
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        isPending && "opacity-50",
        !task.isActive && "bg-muted/50"
      )}
    >
      <div
        className={cn(
          "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full",
          task.isActive ? "bg-primary/10" : "bg-muted"
        )}
      >
        <ArrowsClockwise
          className={cn(
            "size-3",
            task.isActive ? "text-primary" : "text-muted-foreground"
          )}
          weight="bold"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium leading-tight",
                !task.isActive && "text-muted-foreground"
              )}
            >
              {task.name}
            </p>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {getRecurrenceDescription(task)}
              </span>
              {task.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {!task.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Paused
                </Badge>
              )}
            </div>
          </div>

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
                <Link href={`/recurring/${task.id}`}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {task.isActive ? (
                  <>
                    <Pause className="mr-2 size-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-4" />
                    Resume
                  </>
                )}
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
        </div>
      </div>
    </div>
  );
}
