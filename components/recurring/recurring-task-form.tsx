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
import { RecurrencePicker } from "./recurrence-picker";
import { TagSelector } from "@/components/tags/tag-selector";
import { cn } from "@/lib/utils";
import {
  createRecurringTask,
  updateRecurringTask,
} from "@/app/actions/recurring";
import type { Tag, RecurringTaskWithTags } from "@/types";

interface RecurringTaskFormProps {
  tags: Tag[];
  task?: RecurringTaskWithTags;
}

export function RecurringTaskForm({ tags, task }: RecurringTaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(task?.name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [recurrenceType, setRecurrenceType] = useState<
    "daily" | "weekly" | "monthly"
  >(task?.recurrenceType ?? "daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    task?.daysOfWeek ?? []
  );
  const [datesOfMonth, setDatesOfMonth] = useState<number[]>(
    task?.datesOfMonth ?? []
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.startDate ? new Date(task.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    task?.endDate ? new Date(task.endDate) : undefined
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    task?.tags.map((t) => t.id) ?? []
  );

  const isEditing = !!task;

  const isValid = () => {
    if (!name.trim()) return false;
    if (recurrenceType === "weekly" && daysOfWeek.length === 0) return false;
    if (recurrenceType === "monthly" && datesOfMonth.length === 0) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) return;

    startTransition(async () => {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        recurrenceType,
        daysOfWeek: recurrenceType === "weekly" ? daysOfWeek : undefined,
        datesOfMonth: recurrenceType === "monthly" ? datesOfMonth : undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        tagIds: selectedTagIds,
      };

      if (isEditing) {
        await updateRecurringTask(task.id, {
          ...data,
          daysOfWeek: recurrenceType === "weekly" ? daysOfWeek : null,
          datesOfMonth: recurrenceType === "monthly" ? datesOfMonth : null,
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
        });
      } else {
        await createRecurringTask(data);
      }
      router.push("/recurring");
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
          placeholder="What needs to be done regularly?"
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

      <RecurrencePicker
        recurrenceType={recurrenceType}
        daysOfWeek={daysOfWeek}
        datesOfMonth={datesOfMonth}
        onRecurrenceTypeChange={setRecurrenceType}
        onDaysOfWeekChange={setDaysOfWeek}
        onDatesOfMonthChange={setDatesOfMonth}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Start date (optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {startDate ? format(startDate, "PPP") : "No start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {startDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStartDate(undefined)}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>End date (optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {endDate ? format(endDate, "PPP") : "No end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {endDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEndDate(undefined)}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
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
        <Button type="submit" disabled={isPending || !isValid()}>
          {isPending
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save changes"
              : "Create recurring task"}
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
