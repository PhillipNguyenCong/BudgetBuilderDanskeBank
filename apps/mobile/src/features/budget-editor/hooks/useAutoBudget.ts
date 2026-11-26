import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { BillSuggestions } from '@budget-builder/contracts';
import {
  autoAllocationIncome,
  createAutoAllocationDraft,
  prepareAutoBills,
} from '../editor/autoAllocation';
import type { Draft } from '../editor/draft';
import {
  applyCarChecklist,
  createCarChecklist,
  type CarChecklistItem,
} from '../editor/carChecklist';

export type AutoBudgetOptions = {
  draft: Draft;
  dismissed: string[];
  disabled: boolean;
  load: (signal: AbortSignal) => Promise<BillSuggestions>;
  onApply: (draft: Draft) => void;
  onActiveChange: (active: boolean) => void;
};

export function useAutoBudget({
  draft,
  dismissed,
  disabled,
  load,
  onApply,
  onActiveChange,
}: AutoBudgetOptions) {
  const [status, setStatus] = useState<'closed' | 'confirm' | 'loading' | 'error' | 'car-review'>(
    'closed',
  );
  const [carChoice, setCarChoice] = useState<'yes' | 'no' | null>(null);
  const [checklist, setChecklist] = useState<CarChecklistItem[]>([]);
  const carReview = useRef<{ snapshot: Draft; draft: Draft; data: BillSuggestions } | null>(null);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<ReturnType<typeof createAutoAllocationDraft>>();
  const [notes, setNotes] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  const latest = useRef({ draft, disabled });
  latest.current = { draft, disabled };
  useEffect(() => () => controller.current?.abort(), []);

  function close() {
    controller.current?.abort();
    controller.current = null;
    carReview.current = null;
    setStatus('closed');
    onActiveChange(false);
  }
  function open() {
    if (disabled || status !== 'closed') return;
    setError('');
    setCarChoice(null);
    setChecklist([]);
    setStatus('confirm');
    onActiveChange(true);
  }
  async function confirm() {
    if (disabled || controller.current || carChoice === null) return;
    const current = new AbortController();
    controller.current = current;
    const snapshot = latest.current.draft;
    setStatus('loading');
    setError('');
    try {
      autoAllocationIncome(snapshot);
      const data = await load(current.signal);
      if (current.signal.aborted) return;
      if (latest.current.draft !== snapshot || latest.current.disabled)
        throw new Error(
          'Your inputs changed while finding bills. Confirm auto allocation again to use the latest amounts.',
        );
      if (carChoice === 'yes') {
        const prepared = prepareAutoBills(snapshot, data, dismissed);
        carReview.current = { snapshot, draft: prepared, data };
        setChecklist(createCarChecklist(prepared));
        setStatus('car-review');
      } else apply(snapshot, data, snapshot);
    } catch (reason) {
      if (!current.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Auto allocation failed. Try again.');
        setStatus('error');
      }
    } finally {
      if (controller.current === current) controller.current = null;
    }
  }
  function apply(value: Draft, data: BillSuggestions, snapshot: Draft) {
    if (latest.current.draft !== snapshot || latest.current.disabled)
      throw new Error(
        'Your inputs changed. Cancel and start auto allocation again to use the latest amounts.',
      );
    const result = createAutoAllocationDraft(value, data, dismissed);
    onApply(result.draft);
    setOutcome(result);
    setNotes(data.notes);
    AccessibilityInfo.announceForAccessibility(
      `Auto allocation applied using ${result.allocation.split}. Review the editable amounts before saving.`,
    );
    close();
  }
  function finishCarReview() {
    if (disabled || !carReview.current) return;
    setError('');
    try {
      const review = carReview.current;
      apply(applyCarChecklist(review.draft, checklist), review.data, review.snapshot);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Review the car costs and try again.');
    }
  }
  return {
    status,
    error,
    outcome,
    notes,
    open,
    close,
    confirm,
    carChoice,
    setCarChoice,
    checklist,
    setChecklist,
    finishCarReview,
  };
}
