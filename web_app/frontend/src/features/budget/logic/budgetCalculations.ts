import type { BudgetCategory, BudgetData, BudgetTotals } from "../types/budgetTypes";

export function sumBudgetedByKind(
  categories: BudgetCategory[],
  kind: BudgetCategory["kind"],
) {
  return categories
    .filter((category) => category.kind === kind)
    .reduce((total, category) => total + category.budgetedAmount, 0);
}

export function sumSpentByKind(
  categories: BudgetCategory[],
  kind: BudgetCategory["kind"],
) {
  return categories
    .filter((category) => category.kind === kind)
    .reduce((total, category) => total + category.spentAmount, 0);
}

export function calculateBudgetTotals(data: BudgetData): BudgetTotals {
  const spendCategories = data.categories.filter((category) => category.kind !== "income");
  const income = sumBudgetedByKind(data.categories, "income");
  const fixedBudgeted = sumBudgetedByKind(data.categories, "fixed");
  const fixedSpent = sumSpentByKind(data.categories, "fixed");
  const flexibleBudgeted = sumBudgetedByKind(data.categories, "flexible");
  const flexibleSpent = sumSpentByKind(data.categories, "flexible");
  const savingsBudgeted = sumBudgetedByKind(data.categories, "savings");
  const totalSpent = spendCategories.reduce((total, category) => total + category.spentAmount, 0);
  const totalForecast = spendCategories.reduce(
    (total, category) => total + category.forecastAmount,
    0,
  );

  return {
    income,
    fixedBudgeted,
    fixedSpent,
    flexibleBudgeted,
    flexibleSpent,
    savingsBudgeted,
    totalSpent,
    totalForecast,
    leftToSpend: income - totalForecast,
  };
}

export function getSpendCategories(categories: BudgetCategory[]) {
  return categories.filter((category) => category.kind !== "income");
}

export function isCategoryOverBudget(category: BudgetCategory) {
  return category.forecastAmount > category.budgetedAmount;
}

export function getCategoryProgress(category: BudgetCategory) {
  if (category.budgetedAmount <= 0) {
    return 0;
  }

  return Math.round((category.spentAmount / category.budgetedAmount) * 100);
}

