import { Amount } from "../../../foundation/components/Amount";
import { Card } from "../../../foundation/components/Card";
import type { BudgetTotals } from "../types/budgetTypes";

type BudgetSummaryCardProps = {
  month: string;
  totals: BudgetTotals;
};

export function BudgetSummaryCard({ month, totals }: BudgetSummaryCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#5f6f82]">{month}</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#172033]">Budget</h1>
        </div>
        <div className="rounded-md bg-[#e6f1f6] px-3 py-2 text-right">
          <p className="text-xs font-semibold text-[#003755]">Income</p>
          <Amount size="sm" value={totals.income} />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs text-[#5f6f82]">Fixed</dt>
          <dd className="mt-1">
            <Amount size="sm" value={totals.fixedBudgeted} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#5f6f82]">Flexible</dt>
          <dd className="mt-1">
            <Amount size="sm" value={totals.flexibleBudgeted} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#5f6f82]">Savings</dt>
          <dd className="mt-1">
            <Amount size="sm" value={totals.savingsBudgeted} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

