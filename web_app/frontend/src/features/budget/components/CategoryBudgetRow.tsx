import { Amount } from "../../../foundation/components/Amount";
import { Badge } from "../../../foundation/components/Badge";
import { ProgressBar } from "../../../foundation/components/ProgressBar";
import type { BudgetCategory } from "../types/budgetTypes";

type CategoryBudgetRowProps = {
  category: BudgetCategory;
  progress: number;
  isOverBudget: boolean;
  onSelect: (categoryId: string) => void;
};

export function CategoryBudgetRow({
  category,
  progress,
  isOverBudget,
  onSelect,
}: CategoryBudgetRowProps) {
  const progressTone = isOverBudget ? "warning" : "normal";

  return (
    <button
      className="w-full border-b border-[#e5edf2] py-4 text-left last:border-b-0"
      onClick={() => onSelect(category.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#172033]">{category.name}</p>
            {isOverBudget ? <Badge tone="warning">Risk</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-[#5f6f82]">
            Spent <Amount size="sm" tone="muted" value={category.spentAmount} /> of{" "}
            <Amount size="sm" tone="muted" value={category.budgetedAmount} />
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-[#5f6f82]">Forecast</p>
          <Amount
            size="sm"
            tone={isOverBudget ? "warning" : "default"}
            value={category.forecastAmount}
          />
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar
          label={`${category.name} spending progress`}
          max={100}
          tone={progressTone}
          value={progress}
        />
      </div>
    </button>
  );
}

