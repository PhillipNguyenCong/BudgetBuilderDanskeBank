import { describe, expect, it } from "vitest";
import { sampleBudgetData } from "../data/sampleBudgetData";
import {
  createForecastInsights,
  getOverBudgetCategories,
  getUpcomingRecurringPayments,
} from "../logic/forecastCalculations";

describe("forecast calculations", () => {
  it("returns upcoming recurring payments sorted by due date", () => {
    const payments = getUpcomingRecurringPayments(
      sampleBudgetData.recurringPayments,
      "2026-09-03",
    );

    expect(payments.map((payment) => payment.id)).toEqual([
      "insurance-september",
      "streaming-september",
      "mobile-september",
    ]);
  });

  it("ignores recurring payments before today", () => {
    const payments = getUpcomingRecurringPayments(
      sampleBudgetData.recurringPayments,
      "2026-09-15",
    );

    expect(payments.map((payment) => payment.id)).toEqual(["mobile-september"]);
  });

  it("finds categories forecasted over budget", () => {
    expect(getOverBudgetCategories(sampleBudgetData.categories).map((category) => category.id)).toEqual([
      "dining",
    ]);
  });

  it("creates automatic forecast insights", () => {
    const insights = createForecastInsights(sampleBudgetData);

    expect(insights).toHaveLength(2);
    expect(insights[0].id).toBe("upcoming-payment");
    expect(insights[1].id).toBe("overspending-risk");
  });
});

