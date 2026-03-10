"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

interface RecurrencePickerProps {
  recurrenceType: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  datesOfMonth: number[];
  onRecurrenceTypeChange: (type: "daily" | "weekly" | "monthly") => void;
  onDaysOfWeekChange: (days: number[]) => void;
  onDatesOfMonthChange: (dates: number[]) => void;
}

export function RecurrencePicker({
  recurrenceType,
  daysOfWeek,
  datesOfMonth,
  onRecurrenceTypeChange,
  onDaysOfWeekChange,
  onDatesOfMonthChange,
}: RecurrencePickerProps) {
  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      onDaysOfWeekChange(daysOfWeek.filter((d) => d !== day));
    } else {
      onDaysOfWeekChange([...daysOfWeek, day].sort((a, b) => a - b));
    }
  };

  const toggleDate = (date: number) => {
    if (datesOfMonth.includes(date)) {
      onDatesOfMonthChange(datesOfMonth.filter((d) => d !== date));
    } else {
      onDatesOfMonthChange([...datesOfMonth, date].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Repeat</Label>
        <Select value={recurrenceType} onValueChange={onRecurrenceTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recurrenceType === "weekly" && (
        <div className="space-y-2">
          <Label>On days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  daysOfWeek.includes(day.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
          {daysOfWeek.length === 0 && (
            <p className="text-sm text-destructive">
              Select at least one day
            </p>
          )}
        </div>
      )}

      {recurrenceType === "monthly" && (
        <div className="space-y-2">
          <Label>On dates</Label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => toggleDate(date)}
                className={cn(
                  "flex size-9 items-center justify-center rounded border text-sm transition-colors",
                  datesOfMonth.includes(date)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                )}
              >
                {date}
              </button>
            ))}
          </div>
          {datesOfMonth.length === 0 && (
            <p className="text-sm text-destructive">
              Select at least one date
            </p>
          )}
        </div>
      )}
    </div>
  );
}
