import { ErrorSchema } from '@budget-builder/contracts';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
    public readonly outcomeUnknown = false,
  ) {
    super(message);
  }
}
const safeMessages: Record<string, string> = {
  ACCOUNT_IN_USE: 'This account already has a budget. Your draft has not replaced it.',
  OVER_ALLOCATED: 'Allocations exceed income. Review your amounts before trying again.',
  AMOUNT_OVERFLOW: 'The combined amounts are too large.',
  VALIDATION_ERROR: 'Some budget details are invalid. Review your inputs.',
  NOT_FOUND: 'This account or budget is no longer available.',
  BANK_DATA_UNAVAILABLE: 'Bank data is temporarily unavailable. Please try again later.',
};
const unconfirmed = () =>
  new ApiError(
    'SAVE_UNCONFIRMED',
    'We could not confirm whether your budget was saved. Check saved budgets before trying again.',
    undefined,
    true,
  );

// Public URL only. Never put credentials in EXPO_PUBLIC_* variables.
export async function requestJson<T>(
  path: string,
  schema: { parse(value: unknown): T },
  signal?: AbortSignal,
  baseUrl = process.env.EXPO_PUBLIC_API_URL,
  options?: { method: 'POST' | 'PUT'; body: unknown },
): Promise<T> {
  if (!baseUrl)
    throw new Error(
      'The demo connection is not configured. Set EXPO_PUBLIC_API_URL and restart Expo.',
    );
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10000);
  try {
    let response: Response;
    try {
      response = await fetch(baseUrl.replace(/\/$/, '') + path, {
        headers: {
          Accept: 'application/json',
          ...(options ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(options ? { method: options.method, body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });
    } catch {
      if (options) throw unconfirmed();
      throw new Error(
        'Cannot connect to the demo backend. Check your Wi-Fi connection and try again.',
      );
    }
    if (!response.ok) {
      let code = response.status === 503 ? 'BANK_DATA_UNAVAILABLE' : 'REQUEST_FAILED';
      try {
        const parsed = ErrorSchema.safeParse(await response.json());
        if (parsed.success && safeMessages[parsed.data.error.code]) code = parsed.data.error.code;
      } catch {
        /* Error bodies are optional and never displayed verbatim. */
      }
      if (options && response.status >= 500 && response.status !== 503) throw unconfirmed();
      throw new ApiError(
        code,
        safeMessages[code] ??
          (options
            ? 'Could not save the budget. Your inputs are still here. Please try again.'
            : 'Could not load your account data. Please try again.'),
        response.status,
      );
    }
    try {
      return schema.parse(await response.json());
    } catch {
      if (options) throw unconfirmed();
      throw new Error('The backend returned an unexpected response. Please try again.');
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
