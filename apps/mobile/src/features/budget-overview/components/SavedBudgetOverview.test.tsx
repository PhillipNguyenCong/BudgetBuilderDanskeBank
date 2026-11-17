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
  expect(screen.getByText('About 165 kr. per day · 17 days remaining')).toBeVisible();
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
  expect(screen.getAllByText('2.699 kr.')).toHaveLength(2);
  expect(screen.getByText('Pending commitments: 100 kr.')).toBeVisible();
  expect(screen.getByText('Unconfirmed commitments: 1 kr.')).toBeVisible();
  expect(screen.queryByText('Unconfirmed: 1 kr.')).toBeNull();
  expect(screen.queryByText('Pending: 1.000 kr.')).toBeNull();
  expect(screen.getByText('Left for bills')).toBeVisible();
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
    'Monthly plan',
  ]);
  expect(screen.getByText('123,45 kr.')).toBeVisible();
});

it('US-05: saved bill details retain payment frequency separately from monthly allocation', async () => {
  const budget = savedBudget();
  const fixed = budget.plan.pots.find((p) => p.type === 'FIXED_EXPENSE')!;
  fixed.rows = [{ id: 'annual', label: 'Insurance', amountOere: 360000, frequency: 'YEARLY' }];
  budget.totals = calculatePlan(budget.plan);
  await render(<SavedPotDetails widget={fixed} allocationOere={30000} pots={budget.plan.pots} />);
  expect(screen.getByText('Insurance: 3.600 kr.')).toBeVisible();
  expect(screen.getByText('Yearly · 300 kr./month')).toBeVisible();
  expect(screen.getByText('Set aside per month: 300 kr.')).toBeVisible();
});

it('US-10: empty, zero, missing and source-adjusted rows remain distinct', async () => {
  const budget = savedBudget();
  const savings = budget.plan.pots.find((p) => p.type === 'SAVINGS')!;
  savings.rows = [];
  const view = await render(
    <SavedPotDetails widget={savings} allocationOere={0} pots={budget.plan.pots} />,
  );
  expect(screen.getByText('No rows in this pot.')).toBeVisible();
  expect(screen.getByText('Monthly allocation: 0 kr.')).toBeVisible();
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
  expect(screen.getByText('Monthly saving: 0 kr.')).toBeVisible();
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
    expect(screen.queryByText('Month-end processing is not available yet.')).toBeNull();
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
  expect(screen.getByText('300 kr. over your allowance')).toBeVisible();
  expect(screen.getByText('0 kr.')).toBeVisible();
  await view.rerender(
    <SpendingFigures
      numbers={{
        ...summary.overall,
        remainingOere: 280000,
        weeklyGuideDkk: 1153,
        dailyGuideDkk: 165,
        limitations: ['Missing transaction amount.'],
      }}
      daysRemaining={17}
    />,
  );
  expect(screen.getByText('2.800 kr.')).toBeVisible();
  expect(screen.getByText('Provisional · Based on known transactions')).toBeVisible();
  expect(screen.queryByText('Unavailable')).toBeNull();
  expect(screen.getByText('Missing transaction amount.')).toBeVisible();
});

it('US-06: discloses background and plan totals without losing the overview', async () => {
  const budget = savedBudget();
  await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data: spendingSummary(budget), refreshing: false, error: null }}
    />,
  );
  expect(screen.queryByText(/Source coverage:/)).toBeNull();
  expect(screen.queryByText('Forecast unavailable')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
  expect(screen.getByText(/Source coverage:/)).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByText('Left to spend this month')).toBeVisible();
  const disclosure = screen.getByRole('button', { name: 'Monthly plan' });
  expect(disclosure.props.accessibilityState.expanded).toBe(false);
  await fireEvent.press(disclosure);
  expect(
    screen.getByRole('button', { name: 'Monthly plan' }).props.accessibilityState.expanded,
  ).toBe(true);
});

it('US-06: zero booked bill remainder shows paid status in the overview and details', async () => {
  const budget = savedBudget();
  const summary = spendingSummary(budget);
  const numbers = {
    ...summary.fixedExpenses[0]!.numbers,
    recordedSpendingOere: 1200000,
    remainingOere: 0,
  };
  summary.fixedExpenses[0]!.numbers = numbers;
  const view = await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data: summary, refreshing: false, error: null }}
    />,
  );
  expect(screen.getByText('All bills are paid')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'View Fixed expenses details' }).props.accessibilityValue
      .text,
  ).toContain('All bills are paid');
  await view.rerender(
    <SpendingFigures numbers={numbers} daysRemaining={17} kind="FIXED_EXPENSE" breakdown />,
  );
  expect(screen.getByText('All bills are paid')).toBeVisible();
});

it.each([
  [{ pendingSpendingOere: 10000 }, 'Bills pending'],
  [{ unconfirmedSpendingOere: 10000 }, 'Review bill status'],
  [{ limitations: ['Incomplete source coverage.'] }, 'Review bill status'],
  [{ reviewAffectingCount: 1 }, 'Review bill status'],
  [{ remainingOere: -10000, overspentOere: 10000 }, undefined],
  [{ allocationOere: 0, recordedSpendingOere: 0 }, undefined],
])(
  'US-10: zero display never marks pending, uncertain, overspent or empty bills paid (%j)',
  async (changes, label) => {
    const numbers = {
      ...spendingSummary().fixedExpenses[0]!.numbers,
      recordedSpendingOere: 1200000,
      remainingOere: 0,
      ...changes,
    };
    await render(<SpendingFigures numbers={numbers} daysRemaining={17} kind="FIXED_EXPENSE" />);
    expect(screen.queryByText('All bills are paid')).toBeNull();
    if (label) expect(screen.getByText(label)).toBeVisible();
  },
);

it('US-06/10: overspent provisional bills show their signed remainder instead of a misleading zero', async () => {
  const budget = savedBudget();
  const summary = spendingSummary(budget);
  const numbers = {
    ...summary.fixedExpenses[0]!.numbers,
    remainingOere: -851000,
    overspentOere: 851000,
    limitations: ['Outstanding commitments are included; their booking month is not confirmed.'],
  };
  summary.fixedExpenses[0]!.numbers = numbers;
  const view = await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data: summary, refreshing: false, error: null }}
    />,
  );
  expect(screen.getByText('-8.510 kr.')).toBeVisible();
  expect(screen.queryByText('All bills are paid')).toBeNull();
  await view.rerender(
    <SpendingFigures numbers={numbers} daysRemaining={17} kind="FIXED_EXPENSE" breakdown />,
  );
  expect(screen.getByText('-8.510 kr.')).toBeVisible();
  expect(screen.queryByText('All bills are paid')).toBeNull();
});

it('US-12: historical remainder stays signed and does not offer a current-week spending guide', async () => {
  await render(
    <SpendingFigures
      numbers={{ ...spendingSummary().overall, remainingOere: -30000, overspentOere: 30000 }}
      daysRemaining={1}
      historicalMonth="2026-09"
    />,
  );
  expect(screen.getByText('-300 kr.')).toBeVisible();
  expect(screen.getByRole('header', { name: 'Remaining in September 2026' })).toBeVisible();
  expect(screen.queryByText(/for the next/)).toBeNull();
});
