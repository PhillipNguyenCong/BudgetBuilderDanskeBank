import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';

export function ForecastUnavailableNotice() {
  return (
    <Card>
      <AppText variant="heading">Forecast unavailable</AppText>
      <AppText>
        Forecasts, actual spending, weekly guidance and accumulated pot balances are not calculated
        yet. Your budget plan has been saved.
      </AppText>
    </Card>
  );
}
