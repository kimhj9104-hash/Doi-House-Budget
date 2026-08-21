"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CategoryForm from "@/components/CategoryForm";
import { updateCategory, deleteCategory, type CategoryInput } from "@/lib/data/categories";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { householdId, categories } = useAuth();
  const category = categories.find((c) => c.id === id);

  if (!category) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-subtle-foreground">
        카테고리를 찾을 수 없어요
      </div>
    );
  }

  async function handleSubmit(input: CategoryInput) {
    if (!householdId) return;
    await updateCategory(householdId, id, input);
  }

  async function handleDelete() {
    if (!householdId) return;
    await deleteCategory(householdId, id);
  }

  return (
    <CategoryForm
      title="카테고리 수정"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initial={{
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
      }}
    />
  );
}
