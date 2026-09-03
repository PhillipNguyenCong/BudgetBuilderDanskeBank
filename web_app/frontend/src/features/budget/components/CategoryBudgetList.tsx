import { Card } from "../../../foundation/components/Card";
import { SectionHeader } from "../../../foundation/components/SectionHeader";
import type { BudgetCategory } from "../types/budgetTypes";
import { CategoryBudgetRow } from "./CategoryBudgetRow";

type CategoryBudgetListProps = {
  categories: BudgetCategory[];
  getProgress: (category: BudgetCategory) => number;
  isOverBudget: (category: BudgetCategory) => boolean;
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryBudgetList({
  categories,
  getProgress,
  isOverBudget,
  onSelectCategory,
}: CategoryBudgetListProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Categories" />
      <Card className="px-4">
        {categories.map((category) => (
          <CategoryBudgetRow
            category={category}
            isOverBudget={isOverBudget(category)}
            key={category.id}
            onSelect={onSelectCategory}
            progress={getProgress(category)}
          />
        ))}
      </Card>
    </div>
  );
}

