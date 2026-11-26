import { plannedWeeklyDkk } from '@budget-builder/budget-core/allocations';
import { isHistorical, outsideActivityCoverage } from '../components/budgetMonth';
import type { ClassifiedTransaction } from '@budget-builder/contracts';
import { useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { BackButton } from '../../../foundation/components/BackButton';
import { Button } from '../../../foundation/components/Button';
import { Screen } from '../../../foundation/components/Screen';
import { useSpendingSummary } from '../hooks/useSpendingSummary';
import { useBudgetActivity } from '../hooks/useBudgetActivity';
import { ActivityList } from '../components/ActivityList';
import { SnapshotNotice } from '../components/SnapshotNotice';
import { SpendingFigures } from '../components/SpendingFigures';
import { SavedPotDetails } from '../components/SavedPotDetails';
import { TransactionCorrection } from '../containers/TransactionCorrection';
import { getBudgetActivity, getSpendingSummary } from '../api';

export function BudgetActivityScreen({
  budgetId,
  potId,
  month,
  review,
  active = true,
  onBack,
  onOpenActivity,
  loadSummary = getSpendingSummary,
  loadActivity = getBudgetActivity,
}: {
  budgetId: string;
  potId?: string | undefined;
  month?: string | undefined;
  review?: 'undated' | undefined;
  active?: boolean;
  onBack: () => void;
  onOpenActivity: () => void;
  loadSummary?: typeof getSpendingSummary;
  loadActivity?: typeof getBudgetActivity;
}) {
  const summary = useSpendingSummary(budgetId || undefined, undefined, active, loadSummary, month);
  const data = summary.state.status === 'ready' ? summary.state.data : undefined;
  const activity = useBudgetActivity(
    budgetId || undefined,
    potId,
    month ?? data?.month,
    data?.snapshotVersion,
    active && !!data && potId !== data.budget.plan.income.id,
    loadActivity,
    { review },
  );
  const [selected, select] = useState<ClassifiedTransaction | null>(null);
  const [saved, setSaved] = useState(false);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const widget = data
    ? potId === data.budget.plan.income.id
      ? { ...data.budget.plan.income, type: 'INCOME' as const }
      : data.budget.plan.pots.find((p) => p.id === potId)
    : undefined;
  const numbers =
    data?.pots.find((p) => p.potId === potId)?.numbers ??
    data?.fixedExpenses.find((p) => p.potId === potId)?.numbers;
  const weeklyPlanDkk =
    widget?.type === 'SPENDING' &&
    widget.purpose !== undefined &&
    numbers &&
    data &&
    !isHistorical(data)
      ? plannedWeeklyDkk(numbers.allocationOere, data.month)
      : undefined;
  const invalidPot = !!data && !!potId && !widget;
  function restoreFocus() {
    if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
  }
  return (
    <Screen>
      <BackButton onPress={onBack} />
      <View
        ref={heading}
        accessible
        accessibilityRole="header"
        accessibilityLabel={review ? 'Undated records' : (widget?.name ?? 'Account activity')}
      >
        <AppText variant="title">
          {review ? 'Undated records' : (widget?.name ?? 'Account activity')}
        </AppText>
      </View>
      {!budgetId ? (
        <AppText accessibilityRole="alert">
          This budget is unavailable. Return to Budget and select a saved plan.
        </AppText>
      ) : summary.state.status === 'loading' ? (
        <AppText>Loading spending details…</AppText>
      ) : summary.state.status === 'error' ? (
        <>
          <AppText accessibilityRole="alert">
            Could not load spending details. {summary.state.message}
          </AppText>
          <Button label="Try again" onPress={summary.retry} />
        </>
      ) : null}
      {invalidPot ? (
        <AppText accessibilityRole="alert">
          This pot is no longer available. Return to your budget to choose a current pot.
        </AppText>
      ) : data ? (
        <>
          <SnapshotNotice summary={data} />
          {summary.state.status === 'ready' && summary.state.error ? (
            <AppText accessibilityRole="alert">
              Could not refresh spending. Showing the previously loaded snapshot.
            </AppText>
          ) : null}
          {summary.state.status === 'ready' && summary.state.refreshing ? (
            <AppText>Refreshing spending…</AppText>
          ) : null}
          {numbers ? (
            <SpendingFigures
              numbers={numbers}
              daysRemaining={data.daysRemaining}
              breakdown
              weeklyPlanDkk={weeklyPlanDkk}
              showActivityGuide={weeklyPlanDkk === undefined || !outsideActivityCoverage(data)}
              historicalMonth={isHistorical(data) ? data.month : undefined}
              kind={widget?.type === 'FIXED_EXPENSE' ? 'FIXED_EXPENSE' : 'SPENDING'}
            />
          ) : null}
          {widget ? (
            <SavedPotDetails
              widget={widget}
              allocationOere={
                widget.type === 'INCOME'
                  ? data.budget.totals.incomeOere
                  : data.budget.totals.pots.find((p) => p.id === widget.id)?.allocationOere
              }
              pots={data.budget.plan.pots}
            />
          ) : null}
          {widget?.type !== 'INCOME' ? (
            <>
              <AppText variant="heading" accessibilityRole="header">
                {review ? 'Date needs review' : `Transactions · ${data.month}`}
              </AppText>
              {saved ? (
                <AppText accessibilityLiveRegion="polite">
                  Classification saved. Spending and activity are being refreshed.
                </AppText>
              ) : null}
              <ActivityList
                items={activity.items}
                budget={data.budget}
                onOpen={(item) => {
                  setSaved(false);
                  select(item);
                }}
              />
              {activity.loading ? <AppText>Loading transactions…</AppText> : null}
              {activity.error ? (
                <>
                  <AppText accessibilityRole="alert">
                    Could not load matching transactions. Spending inputs may have changed; refresh
                    spending and activity together.
                  </AppText>
                  <Button
                    label="Retry transactions"
                    onPress={() => {
                      summary.retry();
                      activity.reload();
                    }}
                  />
                </>
              ) : null}
              {activity.hasMore ? (
                <Button
                  label="Load more transactions"
                  variant="secondary"
                  onPress={activity.more}
                  disabled={activity.loading}
                />
              ) : null}
            </>
          ) : null}
          {potId ? (
            <Button label="All account activity" variant="secondary" onPress={onOpenActivity} />
          ) : null}
          <Button
            label="Refresh spending and activity"
            variant="secondary"
            onPress={() => {
              summary.retry();
              activity.reload();
              setSaved(false);
            }}
          />
          {selected ? (
            <TransactionCorrection
              key={selected.transaction.id}
              budget={data.budget}
              initial={selected}
              month={month}
              onClose={() => select(null)}
              onSaved={() => {
                select(null);
                setSaved(true);
                summary.retry();
                activity.reload();
                requestAnimationFrame(restoreFocus);
              }}
              onRestoreFocus={restoreFocus}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
