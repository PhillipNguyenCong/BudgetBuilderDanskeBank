import type { Response } from 'express';
export function owner(response: Response): string {
  const id: unknown = response.locals.userId;
  if (typeof id !== 'string' || !id) throw new Error('Missing trusted user context');
  return id;
}
