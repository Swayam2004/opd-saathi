import { createContext, useContext, type ReactNode } from 'react';
import type { DeptCode } from '@shared/data/departments.ts';
import type { Gender } from '@shared/data/patients.ts';

/** What registration sends. First name only, no IDs (AGENTS.md rule 3). */
export interface Registration {
  firstName: string;
  age: number;
  gender: Gender;
  /** Only for the "turn is close" alert. Never shown on the slip. */
  mobile?: string;
  dept: DeptCode;
}

export type RegisterResult = { ok: true; token: string } | { ok: false; reason: 'offline' | 'closed' };

/** Turns a registration into a token. The Store fills this in (S2, S4, or the local store). */
export interface Registrar {
  register: (r: Registration) => Promise<RegisterResult>;
}

/** Nothing to register against: say so, never invent a token. */
export const notConnectedRegistrar: Registrar = {
  register: () => Promise.resolve({ ok: false, reason: 'offline' }),
};

const RegistrarContext = createContext<Registrar>(notConnectedRegistrar);

export function RegistrarProvider({ registrar, children }: { registrar: Registrar; children: ReactNode }) {
  return <RegistrarContext.Provider value={registrar}>{children}</RegistrarContext.Provider>;
}

export function useRegistrar(): Registrar {
  return useContext(RegistrarContext);
}
