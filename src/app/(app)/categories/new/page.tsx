"use client";

import { useAuth } from "@/contexts/AuthContext";
import CategoryForm from "@/components/CategoryForm";
import { addCategory, type CategoryInput } from "@/lib/data/categories";

export default function NewCategoryPage() {
  const { householdId, categories } = useAuth();

  async function handleSubmit(input: CategoryInput) {
    if (!householdId) return;
    const sortOrder = categories.filter((c) => c.type === input.type).length + 1;
    await addCategory(householdId, input, sortOrder);
  }

  return (
    <CategoryForm
      title="카테고리 추가"
      onSubmit={handleSubmit}
      initial={{ name: "", type: "expense", color: "#2f6fed", icon: "circle" }}
    />
  );
}
