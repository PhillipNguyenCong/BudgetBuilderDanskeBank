import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import {
  activityItem,
  activityPage,
  savedBudget,
  spendingSummary,
} from '../../../tests/spendingFixtures';
import { formatDkk } from '../../budget-shared';
import { SavedBudgetOverview } from './SavedBudgetOverview';
import { SavedPotDetails } from './SavedPotDetails';
import { SpendingFigures } from './SpendingFigures';
import { getBudgetActivity } from '../api';
jest.mock('../api', () => ({ ...jest.requireActual('../api'), getBudgetActivity: jest.fn() }));
beforeEach(() => jest.mocked(getBudgetActivity).mockResolvedValue(activityPage([activityItem()])));

it('shows unallocated income even when spending guidance is unavailable', async () => {
  const budget = savedBudget();
  budget.totals.incomeOere += 10050;
  budget.totals.unallocatedOere += 10050;
  const onRetrySpending = jest.fn();
  await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'error', message: 'Offline.' }}
      onRetrySpending={onRetrySpending}
    />,
  );
  expect(
    screen.getByText(`Unallocated · ${formatDkk(budget.totals.unallocatedOere)}`),
  ).toBeVisible();
  expect(screen.queryByText(/About .* kr\./)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry spending' }));
  expect(onRetrySpending).toHaveBeenCalledTimes(1);
});

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
  expect(screen.getByText('Left after bills and savings')).toBeVisible();
  expect(screen.queryByText(/for the next/)).toBeNull();
  expect(await screen.findByText('Synthetic grocery shop')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'View Spending budget details' }));
  expect(onOpenPot).toHaveBeenCalledWith(budget.id, 'spending');
  await fireEvent.press(screen.getByRole('button', { name: 'Budget details' }));
  await fireEvent.press(screen.getByRole('button', { name: 'View monthly transactions' }));
  expect(onOpenActivity).toHaveBeenCalledWith(budget.id);
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
  await fireEvent.press(screen.getByRole('button', { name: 'Budget details' }));
  expect(within(screen.getByTestId('read-more-overlay')).getByText('2.699 kr.')).toBeVisible();
  expect(screen.getByText('Pending commitments: 100 kr.')).toBeVisible();
  expect(screen.getByText('Unconfirmed commitments: 1 kr.')).toBeVisible();
  expect(screen.queryByText('Unconfirmed: 1 kr.')).toBeNull();
  expect(screen.queryByText('Pending: 1.000 kr.')).toBeNull();
});

it('US-06: shows spending pots first and preserves API plan totals', async () => {
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
    'View Monthly salary details',
    'View Fixed expenses details',
    'View Savings details',
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
  await fireEvent.press(screen.getByRole('button', { name: 'Budget details' }));
  expect(screen.getByText(/Source coverage:/)).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByText('Left after bills and savings')).toBeVisible();
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
  expect(screen.queryByText('All bills are paid')).toBeNull();
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
  expect(screen.queryByText('-8.510 kr.')).toBeNull();
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

it('shows each spending pot’s own weekly guide in its row', async () => {
  const budget = savedBudget();
  const spending = budget.plan.pots.find((pot) => pot.type === 'SPENDING')!;
  budget.plan.pots = [
    ...budget.plan.pots.filter((pot) => pot.id !== spending.id),
    { ...spending, purpose: 'FUN', rows: [{ id: 'fun', label: 'Leisure', amountOere: 937500 }] },
    {
      ...spending,
      id: 'groceries-pot',
      name: 'Groceries',
      purpose: 'GROCERIES',
      rows: [{ id: 'food', label: 'Food', amountOere: 637200 }],
    },
  ];
  budget.totals = calculatePlan(budget.plan);
  const data = spendingSummary(budget);
  data.month = '2026-11';
  data.quality.coverage = { from: '2026-11-01', to: '2026-11-15', completeMonths: 0 };
  data.pots.push({
    potId: 'groceries-pot',
    numbers: { ...data.overall, weeklyGuideDkk: 420 },
  });
  const view = await render(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data, refreshing: false, error: null }}
    />,
  );
  expect(screen.queryByText(/for 7 days/)).toBeNull();
  const funRow = () => within(screen.getByRole('button', { name: 'View Spending budget details' }));
  expect(funRow().getByText('≈ 2.188 kr./week')).toBeVisible();
  const groceryRow = () => within(screen.getByRole('button', { name: 'View Groceries details' }));
  expect(groceryRow().getByText('≈ 1.487 kr./week')).toBeVisible();
  data.daysRemaining = 5;
  data.quality.coverage.to = '2026-09-03';
  data.quality.coverage.from = '2026-09-01';
  await view.rerender(
    <SavedBudgetOverview
      budget={budget}
      spending={{ status: 'ready', data, refreshing: false, error: null }}
    />,
  );
  expect(groceryRow().getByText('≈ 1.487 kr./week')).toBeVisible();
  expect(groceryRow().getByText('Monthly plan · 6.372 kr.')).toBeVisible();
  expect(groceryRow().queryByText(/for 5 days/)).toBeNull();
  expect(funRow().getByText('≈ 2.188 kr./week')).toBeVisible();
  expect(funRow().getByText('Monthly plan · 9.375 kr.')).toBeVisible();
  expect(funRow().queryByText(/for 5 days/)).toBeNull();
});

it('updates the remainder and spending arc from the same snapshot', async () => {
  const summary = spendingSummary();
  summary.daysRemaining = 14;
  const show = (remainingOere: number, weeklyGuideDkk: number) => (
    <SavedBudgetOverview
      budget={summary.budget}
      spending={{
        status: 'ready',
        refreshing: false,
        error: null,
        data: {
          ...summary,
          overall: { ...summary.overall, allocationOere: 1000000, remainingOere, weeklyGuideDkk },
        },
      }}
    />
  );
  const view = await render(show(1000000, 5000));
  expect(screen.getByText('100% left')).toBeVisible();
  await view.rerender(show(970000, 4850));
  expect(screen.getByText('97% left')).toBeVisible();
  expect(screen.getByText('9.700 kr.')).toBeVisible();
  expect(screen.queryByText(/for the next/)).toBeNull();
  await view.rerender(show(0, 0));
  expect(screen.getByText('0% left')).toBeVisible();
  await view.rerender(show(1005000, 5025));
  expect(screen.getByText('100% left')).toBeVisible();
  expect(screen.getByText('10.050 kr.')).toBeVisible();
});

it('labels a month beyond demo coverage and shortens the guide through month end', async () => {
  const data = spendingSummary();
  data.month = '2026-11';
  data.snapshotDate = '2026-11-26';
  data.daysRemaining = 5;
  data.overall.weeklyGuideDkk = 2800;
  data.overall.limitations.push('Missing coverage');
  await render(
    <SavedBudgetOverview
      budget={data.budget}
      spending={{ status: 'ready', data, refreshing: false, error: null }}
    />,
  );
  expect(screen.getByText('Plan estimate')).toBeVisible();
  expect(screen.queryByText(/for the next|Demo data as of/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Budget details' }));
  expect(
    screen.getByText('No activity data for November 2026. The estimate uses your plan.'),
  ).toBeVisible();
  expect(screen.getByText('About 2.800 kr. for the next 5 days')).toBeVisible();
  expect(screen.queryByText(/% left/)).toBeNull();
});

it('reports overspending and a zero one-day guide when there was no spending allocation', async () => {
  const data = spendingSummary();
  data.daysRemaining = 1;
  data.overall = {
    ...data.overall,
    allocationOere: 0,
    remainingOere: -30000,
    overspentOere: 30000,
    weeklyGuideDkk: 0,
    limitations: ['Incomplete activity'],
  };
  await render(
    <SavedBudgetOverview
      budget={data.budget}
      spending={{ status: 'ready', data, refreshing: false, error: null }}
    />,
  );
  expect(
    screen.getByLabelText('Over budget, 300 kr., Provisional, No spending allocation'),
  ).toBeVisible();
  expect(screen.queryByText(/% left/)).toBeNull();
});

it.each([1, 2])(
  'exposes the complete guide on a 320-point screen at font scale %s',
  async (fontScale) => {
    const dimensions = jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({ width: 320, height: 568, scale: 2, fontScale });
    try {
      const data = spendingSummary();
      await render(
        <SavedBudgetOverview
          budget={data.budget}
          spending={{ status: 'ready', data, refreshing: false, error: null }}
        />,
      );
      expect(
        screen.getByLabelText(/Left after bills and savings, 2.800 kr., 35% left/),
      ).toBeVisible();
      expect(screen.getByText('2.800 kr.').props.numberOfLines).toBe(
        fontScale === 1 ? 1 : undefined,
      );
    } finally {
      dimensions.mockRestore();
    }
  },
);

it('shows five account transactions immediately and appends five at a time, including credits', async () => {
  const data = spendingSummary();
  const seed = activityItem();
  const records = Array.from({ length: 11 }, (_, i) => ({
    ...seed,
    transaction: {
      ...seed.transaction,
      id: String(i),
      text: `Payment ${i + 1}`,
      direction: 'CREDIT' as const,
    },
  }));
  const load = jest.mocked(getBudgetActivity);
  load.mockImplementation(async (_id, options) =>
    activityPage(records, options?.offset, options?.limit),
  );
  await render(
    <SavedBudgetOverview
      budget={data.budget}
      spending={{ status: 'ready', data, refreshing: false, error: null }}
    />,
  );
  expect(await screen.findByText('Payment 5')).toBeVisible();
  expect(load).toHaveBeenLastCalledWith(
    data.budget.id,
    {
      month: data.month,
      range: 'account',
      offset: 0,
      limit: 5,
      expectedSnapshotVersion: data.snapshotVersion,
    },
    expect.any(AbortSignal),
  );
  expect(screen.queryByText('Payment 6')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Show more' }));
  expect(await screen.findByText('Payment 10')).toBeVisible();
  expect(screen.getByText('Payment 1')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Show more' }));
  expect(await screen.findByText('Payment 11')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
});
