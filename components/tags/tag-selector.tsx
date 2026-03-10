"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

interface TagSelectorProps {
  tags: Tag[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function TagSelector({
  tags,
  selectedIds,
  onSelectionChange,
}: TagSelectorProps) {
  const toggle = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onSelectionChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedIds, tagId]);
    }
  };

  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tags available. Create some in the Tags section.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedIds.includes(tag.id);
        return (
          <Badge
            key={tag.id}
            variant="secondary"
            className={cn(
              "cursor-pointer transition-all",
              isSelected
                ? "ring-2 ring-offset-2"
                : "opacity-60 hover:opacity-100"
            )}
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              borderColor: isSelected ? tag.color : "transparent",
              // @ts-expect-error CSS custom property for ring color
              "--tw-ring-color": tag.color,
            }}
            onClick={() => toggle(tag.id)}
          >
            {tag.name}
          </Badge>
        );
      })}
    </div>
  );
}
