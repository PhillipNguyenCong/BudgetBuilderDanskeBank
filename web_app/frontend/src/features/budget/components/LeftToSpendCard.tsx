import { Amount } from "../../../foundation/components/Amount";
import { Badge } from "../../../foundation/components/Badge";
import { Card } from "../../../foundation/components/Card";

type LeftToSpendCardProps = {
  amount: number;
  payday: string;
};

export function LeftToSpendCard({ amount, payday }: LeftToSpendCardProps) {
  return (
    <Card className="bg-[#003755] p-5 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#b9d5e2]">Left to spend</p>
          <div className="mt-2">
            <Amount size="lg" tone="inverse" value={amount} />
          </div>
        </div>
        <Badge tone={amount >= 0 ? "success" : "danger"}>Forecast</Badge>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#d7e8ef]">
        Based on your current budget and expected payments until {payday}.
      </p>
    </Card>
  );
}
