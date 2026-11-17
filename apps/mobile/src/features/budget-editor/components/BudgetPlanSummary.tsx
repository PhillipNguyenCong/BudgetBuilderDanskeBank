import { StyleSheet } from 'react-native';
import { Disclosure } from '../../../foundation/components/Disclosure';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { Card } from '../../../foundation/components/Card';
import { formatDkk } from '../../budget-shared';
import { type DraftWidget, type validateDraft } from '../editor/draft';
import { RolloverRule } from './RolloverRule';

export function BudgetPlanSummary({
  result,
  widgets,
  onChange,
  onUpdateSavings,
  reviewOnly = false,
}: {
  reviewOnly?: boolean;
  result: ReturnType<typeof validateDraft>;
  widgets: DraftWidget[];
  onChange: (widget: DraftWidget) => void;
  onUpdateSavings: () => void;
}) {
  const spending = widgets.filter((widget) => widget.type === 'SPENDING');
  const savings = widgets.filter((widget) => widget.type === 'SAVINGS');
  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header" style={styles.heading}>
        Rollover
      </AppText>
      <AppText variant="small">
        {reviewOnly
          ? 'Choose what to do with positive money left at the end of the month.'
          : 'Choose what should happen to positive money left in Budget at month-end.'}
      </AppText>
      {spending.map((widget) => (
        <RolloverRule
          key={widget.id}
          widget={widget}
          savings={savings}
          onChange={onChange}
          showName={spending.length > 1}
        />
      ))}
      {!spending.length ? (
        <AppText variant="small">No Budget pot is available for rollover.</AppText>
      ) : null}
      <AppText variant="small">
        Saved preference only. Automatic month-end processing is not available yet.
      </AppText>
      {result.error ? <AppText accessibilityRole="alert">{result.error}</AppText> : null}
      {!reviewOnly ? (
        <Disclosure label="View monthly totals">
          {result.totals ? (
            <>
              <AppText>Income: {formatDkk(result.totals.incomeOere)}</AppText>
              <AppText>Allocated: {formatDkk(result.totals.allocatedOere)}</AppText>
              <AppText>Unallocated: {formatDkk(result.totals.unallocatedOere)}</AppText>
            </>
          ) : (
            <AppText>Totals unavailable until the inputs are valid.</AppText>
          )}
          <Button
            label="Update savings"
            variant="secondary"
            disabled={!result.plan || !result.totals}
            onPress={onUpdateSavings}
          />
        </Disclosure>
      ) : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 12 },
  heading: { fontSize: 20, lineHeight: 26 },
});
