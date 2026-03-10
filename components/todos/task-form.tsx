"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagSelector } from "@/components/tags/tag-selector";
import { cn } from "@/lib/utils";
import { createTodo, updateTodo } from "@/app/actions/todos";
import type { Tag, TodoWithTags } from "@/types";

interface TaskFormProps {
  tags: Tag[];
  todo?: TodoWithTags;
}

export function TaskForm({ tags, todo }: TaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(todo?.name ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo?.dueDate ? new Date(todo.dueDate) : undefined
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    todo?.tags.map((t) => t.id) ?? []
  );

  const isEditing = !!todo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    startTransition(async () => {
      if (isEditing) {
        await updateTodo(todo.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
          tagIds: selectedTagIds,
        });
      } else {
        await createTodo({
          name: name.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
          tagIds: selectedTagIds,
        });
      }
      router.push("/tasks");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Task name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What needs to be done?"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Due date (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {dueDate ? format(dueDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dueDate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDueDate(undefined)}
            className="text-muted-foreground"
          >
            Clear date
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagSelector
          tags={tags}
          selectedIds={selectedTagIds}
          onSelectionChange={setSelectedTagIds}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save changes"
              : "Create task"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
