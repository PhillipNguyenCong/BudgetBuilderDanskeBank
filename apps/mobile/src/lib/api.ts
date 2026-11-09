// Public URL only. Never put credentials in EXPO_PUBLIC_* variables.
export async function requestJson<T>(
  path: string,
  schema: { parse(value: unknown): T },
  signal?: AbortSignal,
  baseUrl = process.env.EXPO_PUBLIC_API_URL,
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
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch {
      throw new Error(
        'Cannot connect to the demo backend. Check your Wi-Fi connection and try again.',
      );
    }
    if (!response.ok) {
      throw new Error(
        response.status === 503
          ? 'Bank data is temporarily unavailable. Please try again later.'
          : 'Could not load your account data. Please try again.',
      );
    }
    try {
      return schema.parse(await response.json());
    } catch {
      throw new Error('The backend returned an unexpected response. Please try again.');
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
