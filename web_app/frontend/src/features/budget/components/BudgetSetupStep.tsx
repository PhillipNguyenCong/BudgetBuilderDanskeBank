import { Button } from "../../../foundation/components/Button";
import { Card } from "../../../foundation/components/Card";

type BudgetSetupStepProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export function BudgetSetupStep({
  title,
  description,
  actionLabel,
}: BudgetSetupStepProps) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[#172033]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5f6f82]">{description}</p>
      <Button className="mt-4 w-full" variant="secondary">
        {actionLabel}
      </Button>
    </Card>
  );
}

