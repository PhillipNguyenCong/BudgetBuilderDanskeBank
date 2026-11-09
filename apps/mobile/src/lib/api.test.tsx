import { requestJson, ApiError } from './api';
const schema = {
  parse: (value: unknown) => {
    if (value !== 'valid') throw new Error('private payload');
    return value;
  },
};
afterEach(() => jest.restoreAllMocks());
it('validates responses and sends no customer identity', async () => {
  const fetcher = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({ ok: true, json: async () => 'valid' } as Response);
  expect(await requestJson('/api/v1/me', schema, undefined, 'http://localhost:3001')).toBe('valid');
  expect(fetcher).toHaveBeenCalledWith(
    'http://localhost:3001/api/v1/me',
    expect.objectContaining({ headers: { Accept: 'application/json' } }),
  );
});

it('sends JSON writes and exposes safe conflict codes without server payloads', async () => {
  const fetcher = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false,
    status: 409,
    json: async () => ({ error: { code: 'ACCOUNT_IN_USE', message: 'private payload' } }),
  } as Response);
  await expect(
    requestJson('/api/v1/budgets', schema, undefined, 'http://localhost:3001', {
      method: 'POST',
      body: { accountId: 'owned', plan: {} },
    }),
  ).rejects.toMatchObject({ code: 'ACCOUNT_IN_USE', status: 409 });
  expect(fetcher).toHaveBeenCalledWith(
    'http://localhost:3001/api/v1/budgets',
    expect.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'owned', plan: {} }),
    }),
  );
});

it('marks a lost write response as unknown outcome instead of a confirmed failed save', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connection reset'));
  try {
    await requestJson('/api/v1/budgets', schema, undefined, 'http://localhost:3001', {
      method: 'POST',
      body: {},
    });
    throw new Error('Expected rejection');
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'SAVE_UNCONFIRMED', outcomeUnknown: true });
  }
});
it('rejects missing configuration and malformed responses safely', async () => {
  await expect(requestJson('/api/v1/me', schema, undefined, '')).rejects.toThrow('not configured');
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({ ok: true, json: async () => ({ secret: true }) } as Response);
  await expect(
    requestJson('/api/v1/me', schema, undefined, 'http://localhost:3001'),
  ).rejects.toThrow('unexpected response');
});
it('does not expose server response details', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);
  await expect(
    requestJson('/api/v1/me', schema, undefined, 'http://localhost:3001'),
  ).rejects.toThrow('temporarily unavailable');
});

it('aborts a stalled request after ten seconds', async () => {
  jest.useFakeTimers();
  try {
    jest.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const pending = expect(
      requestJson('/api/v1/me', schema, undefined, 'http://localhost:3001'),
    ).rejects.toThrow('Cannot connect');
    await jest.advanceTimersByTimeAsync(10000);
    await pending;
  } finally {
    jest.useRealTimers();
  }
});
