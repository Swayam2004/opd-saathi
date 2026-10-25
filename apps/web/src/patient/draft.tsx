import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { departments, type DeptCode } from '@shared/data/departments.ts';
import type { Gender } from '@shared/data/patients.ts';

/** Answers so far, as typed. Back keeps every answer, and a reload keeps them too. */
export interface Draft {
  name: string;
  age: string;
  gender?: Gender;
  mobile: string;
  dept?: DeptCode;
}

const EMPTY: Draft = { name: '', age: '', mobile: '' };
const KEY = 'opd-saathi.register.v1';
const GENDERS: readonly Gender[] = ['woman', 'man', 'other', 'unsaid'];

function load(): Draft {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return EMPTY;
    const r = raw as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === 'string' ? v.slice(0, 40) : '');
    const d: Draft = { name: str(r.name), age: str(r.age), mobile: str(r.mobile) };
    const g = GENDERS.find((x) => x === r.gender);
    if (g) d.gender = g;
    const dept = departments.find((x) => x.code === r.dept)?.code;
    if (dept) d.dept = dept;
    return d;
  } catch {
    return EMPTY;
  }
}

export const validName = (s: string): boolean => s.trim().length > 0;
export const validAge = (s: string): boolean => /^\d{1,3}$/.test(s.trim()) && Number(s) <= 120;
/** Optional: empty, or ten digits. */
export const validMobile = (s: string): boolean => s.trim() === '' || /^\d{10}$/.test(s.replace(/\s/g, ''));

interface DraftValue {
  draft: Draft;
  set: (patch: Partial<Draft>) => void;
  clear: () => void;
}

const DraftContext = createContext<DraftValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(load);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      // Blocked storage: answers last until the tab closes.
    }
  }, [draft]);
  const set = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const clear = useCallback(() => {
    // Remove now: the provider may unmount before an effect could save the empty draft.
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // Blocked storage: nothing was saved.
    }
    setDraft(EMPTY);
  }, []);
  const value = useMemo(() => ({ draft, set, clear }), [draft, set, clear]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftValue {
  const v = useContext(DraftContext);
  if (!v) throw new Error('useDraft needs a DraftProvider');
  return v;
}
