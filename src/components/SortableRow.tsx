"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export default function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 bg-surface px-1 py-1.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-8 w-7 shrink-0 touch-none items-center justify-center text-subtle-foreground transition hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      {children}
    </div>
  );
}
