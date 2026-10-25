import { createContext, useContext, type ReactNode } from 'react';

export type UrgentResult = 'sent' | 'queued';

/**
 * Raises an urgent flag. `RaiseUrgentFlag` is open to every role and needs no
 * token (docs/plan/architecture.md). The real sender arrives with the Store (S2, S4).
 */
export interface UrgentSender {
  raise: (token?: string) => Promise<UrgentResult>;
}

/**
 * Until the Store lands nothing reaches staff, so the screen must say so.
 * A fallback never pretends to be connected (ADR 0002).
 */
export const notConnected: UrgentSender = {
  raise: () => Promise.resolve('queued'),
};

const UrgentContext = createContext<UrgentSender>(notConnected);

export function UrgentProvider({ sender, children }: { sender: UrgentSender; children: ReactNode }) {
  return <UrgentContext.Provider value={sender}>{children}</UrgentContext.Provider>;
}

export function useUrgentSender(): UrgentSender {
  return useContext(UrgentContext);
}
