import type { Budget, BudgetPlan } from '@budget-builder/contracts';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../lib/api';
import { createBudget, listBudgets } from '../../budget-shared';
import { loadBudgetSetup, type BudgetSetup } from '../api/setup';

export const creationServices = { load: loadBudgetSetup, create: createBudget, list: listBudgets };
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: BudgetSetup };
export function useBudgetCreation(
  accountId: string,
  onCreated: (budget: Budget) => void,
  onBusy: (busy: boolean) => void,
  services = creationServices,
) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>();
  const [needsCheck, setNeedsCheck] = useState(false);
  const [existing, setExisting] = useState<Budget>();
  const [checkMessage, setCheckMessage] = useState<string>();
  const lock = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    setState({ status: 'loading' });
    services
      .load(accountId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'error',
            message: cause instanceof Error ? cause.message : 'Could not load budget setup.',
          });
      });
    return () => controller.abort();
  }, [accountId, attempt, services]);

  async function submit(plan: BudgetPlan) {
    const controller = lifetime.current;
    if (
      lock.current ||
      needsCheck ||
      !controller ||
      controller.signal.aborted ||
      state.status !== 'ready'
    )
      return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError(undefined);
    setCheckMessage(undefined);
    try {
      const budget = await services.create(accountId, plan, controller.signal);
      if (!controller.signal.aborted) onCreated(budget);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Could not save your budget. Your inputs are still here.',
        );
        setNeedsCheck(
          cause instanceof ApiError && (cause.outcomeUnknown || cause.code === 'ACCOUNT_IN_USE'),
        );
      }
    } finally {
      lock.current = false;
      if (!controller.signal.aborted) {
        setBusy(false);
        onBusy(false);
      }
    }
  }
  async function checkSaved() {
    const controller = lifetime.current;
    if (lock.current || !controller || controller.signal.aborted) return;
    lock.current = true;
    setChecking(true);
    setCheckMessage(undefined);
    try {
      const budgets = await services.list(controller.signal);
      if (controller.signal.aborted) return;
      const found = budgets.find((budget) => budget.accountId === accountId);
      setExisting(found);
      if (found)
        setCheckMessage(
          'A saved budget exists for this account. Open it to review its contents. Your draft has not replaced it.',
        );
      else {
        setNeedsCheck(false);
        setError(undefined);
        setCheckMessage(
          'No saved budget was found for this account. You can retry creation with your current draft.',
        );
      }
    } catch {
      if (!controller.signal.aborted)
        setCheckMessage(
          'Could not check saved budgets. Your draft is still here. Try the check again.',
        );
    } finally {
      lock.current = false;
      if (!controller.signal.aborted) setChecking(false);
    }
  }
  return {
    state,
    retry: () => setAttempt((value) => value + 1),
    submit,
    busy,
    checking,
    error,
    needsCheck,
    existing,
    checkMessage,
    checkSaved,
  };
}
