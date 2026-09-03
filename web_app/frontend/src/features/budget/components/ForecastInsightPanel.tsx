import { SectionHeader } from "../../../foundation/components/SectionHeader";
import type { ForecastInsight } from "../types/budgetTypes";
import { ForecastInsightCard } from "./ForecastInsightCard";

type ForecastInsightPanelProps = {
  insights: ForecastInsight[];
};

export function ForecastInsightPanel({ insights }: ForecastInsightPanelProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Forecast insights" />
      <div className="space-y-3">
        {insights.map((insight) => (
          <ForecastInsightCard insight={insight} key={insight.id} />
        ))}
      </div>
    </div>
  );
}

