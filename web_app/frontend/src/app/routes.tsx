import { BudgetHomeContainer } from "../features/budget/containers/BudgetHomeContainer";

export const routes = {
  budgetHome: "/",
} as const;

export function renderCurrentRoute() {
  return <BudgetHomeContainer />;
}

