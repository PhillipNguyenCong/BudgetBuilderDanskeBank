import { BudgetSetupStep } from "../components/BudgetSetupStep";

export function BudgetSetupContainer() {
  return (
    <BudgetSetupStep
      actionLabel="Confirm categories"
      description="Review income, bills, subscriptions, groceries, transport, and savings before creating the monthly overview."
      title="Confirm your budget"
    />
  );
}

