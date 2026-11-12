import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';

export function ForecastUnavailableNotice() {
  return (
    <Card>
      <AppText variant="label">Forecast unavailable</AppText>
      <AppText>
        Cash-flow forecasts and accumulated pot balances are not available yet. Spending guidance is
        shown separately when its inputs are complete.
      </AppText>
    </Card>
  );
}
