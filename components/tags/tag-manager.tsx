"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash, Check, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createTag, updateTag, deleteTag } from "@/app/actions/tags";
import type { Tag } from "@/types";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

interface TagManagerProps {
  tags: Tag[];
}

export function TagManager({ tags }: TagManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" weight="bold" />
              Add tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
            </DialogHeader>
            <TagForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No tags yet</p>
          <p className="text-sm text-muted-foreground">
            Create tags to organize your tasks
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              isEditing={editingTag?.id === tag.id}
              onEdit={() => setEditingTag(tag)}
              onCancelEdit={() => setEditingTag(null)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <TagForm tag={editingTag} onSuccess={() => setEditingTag(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TagRowProps {
  tag: Tag;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}

function TagRow({ tag, onEdit }: TagRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    startTransition(async () => {
      await deleteTag(tag.id);
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <Badge
        variant="secondary"
        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
      >
        {tag.name}
      </Badge>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          disabled={isPending}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          <Trash className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface TagFormProps {
  tag?: Tag;
  onSuccess: () => void;
}

function TagForm({ tag, onSuccess }: TagFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      if (tag) {
        await updateTag(tag.id, { name: name.trim(), color });
      } else {
        await createTag({ name: name.trim(), color });
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tag-name">Name</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tag name"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="size-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "white" : "transparent",
                boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preview</Label>
        <Badge
          variant="secondary"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {name || "Tag name"}
        </Badge>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? "Saving..." : tag ? "Save changes" : "Create tag"}
        </Button>
      </div>
    </form>
  );
}
