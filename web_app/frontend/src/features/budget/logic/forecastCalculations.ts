import type {
  BudgetCategory,
  BudgetData,
  ForecastInsight,
  RecurringPayment,
} from "../types/budgetTypes";
import { isCategoryOverBudget } from "./budgetCalculations";

export function getUpcomingRecurringPayments(
  payments: RecurringPayment[],
  today: string,
) {
  const todayTime = new Date(today).getTime();

  return payments
    .filter((payment) => new Date(payment.dueDate).getTime() >= todayTime)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getOverBudgetCategories(categories: BudgetCategory[]) {
  return categories
    .filter((category) => category.kind !== "income")
    .filter(isCategoryOverBudget);
}

export function createForecastInsights(
  data: BudgetData,
  today = "2026-09-03",
): ForecastInsight[] {
  const upcomingPayments = getUpcomingRecurringPayments(data.recurringPayments, today);
  const overBudgetCategories = getOverBudgetCategories(data.categories);
  const insights: ForecastInsight[] = [];

  const firstPayment = upcomingPayments[0];
  if (firstPayment) {
    insights.push({
      id: "upcoming-payment",
      title: "Upcoming payment included",
      description: `${firstPayment.name} is expected soon and is already included in your forecast.`,
      tone: "positive",
    });
  }

  const firstOverBudget = overBudgetCategories[0];
  if (firstOverBudget) {
    const difference = firstOverBudget.forecastAmount - firstOverBudget.budgetedAmount;
    insights.push({
      id: "overspending-risk",
      title: `${firstOverBudget.name} may go over budget`,
      description: `At the current pace, this category may end ${difference} DKK above budget.`,
      tone: "warning",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "on-track",
      title: "Budget is on track",
      description: "Your planned bills and usual spending are covered for the month.",
      tone: "positive",
    });
  }

  return insights;
}

