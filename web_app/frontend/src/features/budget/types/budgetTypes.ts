export type BudgetCategoryKind = "income" | "fixed" | "flexible" | "savings";

export type BudgetCategory = {
  id: string;
  name: string;
  kind: BudgetCategoryKind;
  budgetedAmount: number;
  spentAmount: number;
  forecastAmount: number;
};

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  categoryId: string;
};

export type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  categoryId: string;
};

export type BudgetData = {
  month: string;
  payday: string;
  categories: BudgetCategory[];
  recurringPayments: RecurringPayment[];
  transactions: Transaction[];
};

export type BudgetTotals = {
  income: number;
  fixedBudgeted: number;
  fixedSpent: number;
  flexibleBudgeted: number;
  flexibleSpent: number;
  savingsBudgeted: number;
  totalSpent: number;
  totalForecast: number;
  leftToSpend: number;
};

export type ForecastInsightTone = "positive" | "warning" | "danger";

export type ForecastInsight = {
  id: string;
  title: string;
  description: string;
  tone: ForecastInsightTone;
};

