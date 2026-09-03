import { describe, expect, it } from "vitest";
import { sampleBudgetData } from "../data/sampleBudgetData";
import {
  calculateBudgetTotals,
  getCategoryProgress,
  getSpendCategories,
  isCategoryOverBudget,
} from "../logic/budgetCalculations";

describe("budget calculations", () => {
  it("calculates total income", () => {
    expect(calculateBudgetTotals(sampleBudgetData).income).toBe(28500);
  });

  it("calculates fixed expense totals", () => {
    const totals = calculateBudgetTotals(sampleBudgetData);

    expect(totals.fixedBudgeted).toBe(9560);
    expect(totals.fixedSpent).toBe(8620);
  });

  it("calculates flexible spending totals", () => {
    const totals = calculateBudgetTotals(sampleBudgetData);

    expect(totals.flexibleBudgeted).toBe(6050);
    expect(totals.flexibleSpent).toBe(3680);
  });

  it("calculates left to spend from income minus forecast expenses", () => {
    expect(calculateBudgetTotals(sampleBudgetData).leftToSpend).toBe(8430);
  });

  it("detects categories forecasted over budget", () => {
    const dining = sampleBudgetData.categories.find((category) => category.id === "dining");

    expect(dining).toBeDefined();
    expect(isCategoryOverBudget(dining!)).toBe(true);
  });

  it("excludes income from spend categories", () => {
    expect(getSpendCategories(sampleBudgetData.categories)).toHaveLength(7);
  });

  it("calculates category spending progress", () => {
    const groceries = sampleBudgetData.categories.find((category) => category.id === "groceries");

    expect(groceries).toBeDefined();
    expect(getCategoryProgress(groceries!)).toBe(51);
  });
});
