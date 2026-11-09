import type { Request } from 'express';
export interface Identity {
  userId: string;
}
export type IdentityProvider = (request: Request) => Promise<Identity> | Identity;
export function demoIdentity(environment: NodeJS.ProcessEnv = process.env): IdentityProvider {
  if (environment.NODE_ENV === 'production' || environment.VERCEL)
    throw new Error(
      'Demo identity is disabled for deployed environments. Inject an authenticated identity provider.',
    );
  return () => ({ userId: 'demo-user' });
}
