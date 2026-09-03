import { useMemo, useState } from "react";
import { Button } from "../../../foundation/components/Button";
import { sampleBudgetData } from "../data/sampleBudgetData";
import {
  calculateBudgetTotals,
  getCategoryProgress,
  getSpendCategories,
  isCategoryOverBudget,
} from "../logic/budgetCalculations";
import {
  createForecastInsights,
  getUpcomingRecurringPayments,
} from "../logic/forecastCalculations";
import { BudgetSetupStep } from "../components/BudgetSetupStep";
import { BudgetSummaryCard } from "../components/BudgetSummaryCard";
import { CategoryBudgetList } from "../components/CategoryBudgetList";
import { ForecastInsightPanel } from "../components/ForecastInsightPanel";
import { LeftToSpendCard } from "../components/LeftToSpendCard";
import { UpcomingPaymentList } from "../components/UpcomingPaymentList";

export function BudgetHomeContainer() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const totals = useMemo(() => calculateBudgetTotals(sampleBudgetData), []);
  const spendCategories = useMemo(
    () => getSpendCategories(sampleBudgetData.categories),
    [],
  );
  const upcomingPayments = useMemo(
    () => getUpcomingRecurringPayments(sampleBudgetData.recurringPayments, "2026-09-03"),
    [],
  );
  const insights = useMemo(() => createForecastInsights(sampleBudgetData), []);
  const selectedCategory = spendCategories.find(
    (category) => category.id === selectedCategoryId,
  );

  return (
    <div className="min-h-[780px] bg-[#f7fafc]">
      <header className="bg-[#003755] px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-[#b9d5e2]">Danske Bank</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Budget builder</h1>
            <p className="mt-1 text-sm text-[#d7e8ef]">
              Monthly overview and automatic forecast.
            </p>
          </div>
          <Button className="bg-white text-[#003755] hover:bg-[#edf6fa]">Edit</Button>
        </div>
      </header>

      <div className="-mt-4 space-y-5 px-4 pb-8">
        <LeftToSpendCard amount={totals.leftToSpend} payday="payday" />
        <BudgetSummaryCard month={sampleBudgetData.month} totals={totals} />
        <ForecastInsightPanel insights={insights} />
        <CategoryBudgetList
          categories={spendCategories}
          getProgress={getCategoryProgress}
          isOverBudget={isCategoryOverBudget}
          onSelectCategory={setSelectedCategoryId}
        />
        {selectedCategory ? (
          <BudgetSetupStep
            actionLabel="Adjust category"
            description={`${selectedCategory.name} is selected. A later version can open the full category detail screen here.`}
            title="Category selected"
          />
        ) : null}
        <UpcomingPaymentList payments={upcomingPayments} />
      </div>
    </div>
  );
}

