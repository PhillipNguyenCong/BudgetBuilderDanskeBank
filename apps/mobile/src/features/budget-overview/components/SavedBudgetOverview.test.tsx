import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { savedBudget, spendingSummary } from '../../../tests/spendingFixtures';
import { SavedBudgetOverview } from './SavedBudgetOverview';
import { SavedPotDetails } from './SavedPotDetails';
import { SpendingFigures } from './SpendingFigures';

it('US-06: leads with snapshot spending and routes pot details through callbacks', async () => {
  const budget = savedBudget();
  const onOpenPot = jest.fn();
  const onOpenActivity = jest.fn();
  await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data: spendingSummary(budget), refreshing: false, error: null }}
      onOpenPot={onOpenPot}
      onOpenActivity={onOpenActivity}
    />,
  );
  expect(screen.getByText('Left to spend this month')).toBeVisible();
  expect(screen.getByText('About DKK 165 per day · 17 days remaining')).toBeVisible();
  expect(screen.getByText('Synthetic grocery shop')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'View Spending budget details' }));
  expect(onOpenPot).toHaveBeenCalledWith(budget.id, 'spending');
  await fireEvent.press(screen.getByRole('button', { name: 'All account activity' }));
  expect(onOpenActivity).toHaveBeenCalledWith(budget.id);
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
});

it('US-06/10: shows fixed-expense progress and separates pending and unconfirmed commitments', async () => {
  const budget = savedBudget();
  const summary = spendingSummary(budget);
  summary.overall.pendingSpendingOere = 10000;
  summary.overall.unconfirmedSpendingOere = 100;
  summary.overall.remainingOere = 269900;
  summary.overall.reviewAffectingCount = 1;
  summary.pots[0]!.numbers.pendingSpendingOere = 10000;
  summary.pots[0]!.numbers.unconfirmedSpendingOere = 100;
  summary.pots[0]!.numbers.remainingOere = 269900;
  summary.pots[0]!.numbers.reviewAffectingCount = 1;
  summary.fixedExpenses[0]!.numbers.pendingSpendingOere = 100000;
  summary.fixedExpenses[0]!.numbers.remainingOere = 200000;
  await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data: summary, refreshing: false, error: null }}
    />,
  );
  expect(screen.getAllByText('DKK 2,699')).toHaveLength(2);
  expect(screen.getByText('Pending commitments: DKK 100')).toBeVisible();
  expect(screen.getByText('Unconfirmed commitments: DKK 1')).toBeVisible();
  expect(screen.getByText('Unconfirmed: DKK 1')).toBeVisible();
  expect(screen.getByText('Pending: DKK 1,000')).toBeVisible();
  expect(screen.getByText('Fixed expenses · Left for bills')).toBeVisible();
});

it('US-06: groups spending first, retains within-type ordering and API plan totals', async () => {
  const budget = savedBudget();
  const spending = budget.plan.pots.find((p) => p.type === 'SPENDING')!;
  budget.plan.pots = [
    budget.plan.pots[2]!,
    { ...spending, id: 'travel', name: 'Travel', rows: [] },
    budget.plan.pots[1]!,
    spending,
  ];
  budget.totals.pots.push({ id: 'travel', allocationOere: 12345 });
  await render(<SavedBudgetOverview budget={budget} />);
  expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
    'View Travel details',
    'View Spending budget details',
    'View Fixed expenses details',
    'View Savings details',
    'View Monthly salary details',
    'All account activity',
  ]);
  expect(screen.getByText('DKK 123.45')).toBeVisible();
});

it('US-05: saved bill details retain payment frequency separately from monthly allocation', async () => {
  const budget = savedBudget();
  const fixed = budget.plan.pots.find((p) => p.type === 'FIXED_EXPENSE')!;
  fixed.rows = [{ id: 'annual', label: 'Insurance', amountOere: 360000, frequency: 'YEARLY' }];
  budget.totals = calculatePlan(budget.plan);
  await render(<SavedPotDetails widget={fixed} allocationOere={30000} pots={budget.plan.pots} />);
  expect(screen.getByText('Insurance: DKK 3,600')).toBeVisible();
  expect(screen.getByText('Yearly · DKK 300/month')).toBeVisible();
  expect(screen.getByText('Set aside per month: DKK 300')).toBeVisible();
});

it('US-10: empty, zero, missing and source-adjusted rows remain distinct', async () => {
  const budget = savedBudget();
  const savings = budget.plan.pots.find((p) => p.type === 'SAVINGS')!;
  savings.rows = [];
  const view = await render(
    <SavedPotDetails widget={savings} allocationOere={0} pots={budget.plan.pots} />,
  );
  expect(screen.getByText('No rows in this pot.')).toBeVisible();
  expect(screen.getByText('Monthly allocation: DKK 0')).toBeVisible();
  await view.rerender(
    <SavedPotDetails
      widget={{
        ...savings,
        rows: [
          {
            id: 'zero',
            label: 'Monthly saving',
            amountOere: 0,
            adjustedByUser: true,
            source: {
              kind: 'SUGGESTED',
              explanation: 'Synthetic history estimate.',
              recordIds: [],
              period: null,
            },
          },
        ],
      }}
      allocationOere={undefined}
      pots={budget.plan.pots}
    />,
  );
  expect(screen.getByText('Monthly allocation: Amount unavailable')).toBeVisible();
  expect(screen.getByText('Monthly saving: DKK 0')).toBeVisible();
  expect(screen.getByText('Adjusted by you')).toBeVisible();
  expect(screen.getByText('Synthetic history estimate.')).toBeVisible();
});

it.each(['TO_NEXT_MONTH', 'TO_SAVINGS'] as const)(
  'US-11: retains saved %s rollover preferences',
  async (destination) => {
    const budget = savedBudget();
    const pot = budget.plan.pots.find((p) => p.type === 'SPENDING')!;
    if (pot.type !== 'SPENDING') throw new Error('Invalid fixture');
    pot.rollover = {
      enabled: true,
      destination,
      targetPotId: destination === 'TO_SAVINGS' ? 'savings' : null,
    };
    await render(<SavedPotDetails widget={pot} allocationOere={800000} pots={budget.plan.pots} />);
    expect(
      screen.getByText(
        destination === 'TO_SAVINGS'
          ? 'Rollover preference: to Savings'
          : 'Rollover preference: next month’s spending',
      ),
    ).toBeVisible();
    expect(screen.getByText('Month-end processing is not available yet.')).toBeVisible();
  },
);

it('US-06/10: overspending and incomplete inputs never imply an empty bank account', async () => {
  const summary = spendingSummary();
  const view = await render(
    <SpendingFigures
      numbers={{
        ...summary.overall,
        remainingOere: -30000,
        overspentOere: 30000,
        weeklyGuideDkk: 0,
        dailyGuideDkk: 0,
      }}
      daysRemaining={17}
    />,
  );
  expect(screen.getByText('DKK 300 over your allowance')).toBeVisible();
  expect(screen.getByText('DKK 0')).toBeVisible();
  await view.rerender(
    <SpendingFigures
      numbers={{
        ...summary.overall,
        remainingOere: null,
        weeklyGuideDkk: null,
        dailyGuideDkk: null,
        limitations: ['Missing transaction amount.'],
      }}
      daysRemaining={17}
    />,
  );
  expect(screen.getByText('Unavailable')).toBeVisible();
  expect(screen.getByText('Weekly guide unavailable')).toBeVisible();
  expect(screen.getByText('Missing transaction amount.')).toBeVisible();
});
