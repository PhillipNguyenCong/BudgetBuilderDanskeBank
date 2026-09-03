import { Amount } from "../../../foundation/components/Amount";
import { Card } from "../../../foundation/components/Card";
import { ListRow } from "../../../foundation/components/ListRow";
import { SectionHeader } from "../../../foundation/components/SectionHeader";
import { formatDate } from "../../../shared/utils/formatDate";
import type { RecurringPayment } from "../types/budgetTypes";

type UpcomingPaymentListProps = {
  payments: RecurringPayment[];
};

export function UpcomingPaymentList({ payments }: UpcomingPaymentListProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Upcoming payments" />
      <Card className="px-4">
        {payments.map((payment) => (
          <ListRow
            description={`Expected ${formatDate(payment.dueDate)}`}
            key={payment.id}
            title={payment.name}
            trailing={<Amount size="sm" value={payment.amount} />}
          />
        ))}
      </Card>
    </div>
  );
}

