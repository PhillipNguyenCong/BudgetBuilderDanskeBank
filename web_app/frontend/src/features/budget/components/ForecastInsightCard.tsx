import { Card } from "../../../foundation/components/Card";
import type { ForecastInsight } from "../types/budgetTypes";

type ForecastInsightCardProps = {
  insight: ForecastInsight;
};

const toneClasses = {
  positive: "border-l-[#176b4d]",
  warning: "border-l-[#c77700]",
  danger: "border-l-[#b42318]",
};

export function ForecastInsightCard({ insight }: ForecastInsightCardProps) {
  return (
    <Card className={`border-l-4 p-4 ${toneClasses[insight.tone]}`}>
      <h3 className="text-sm font-semibold text-[#172033]">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5f6f82]">{insight.description}</p>
    </Card>
  );
}

