import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { RegistrarProvider, type Registrar } from '../patient/registrar';
import { UrgentProvider, type UrgentSender } from '../shell/urgent';
import { apply, initialState, isHospitalState, type Command, type HospitalState, type Outcome } from './hospital';

// Local Store: the hospital lives in this browser's localStorage and every open
// tab stays in sync through BroadcastChannel (the brief's baseline). It stands in
// until the server Store (S4) lands, and the shell labels it, so it never passes
// for a live hospital (ADR 0002).

const KEY = 'opd-saathi.hospital.v1';
const CHANNEL = 'opd-saathi';

function read(): HospitalState | undefined {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return isHospitalState(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function write(s: HospitalState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Blocked storage: this tab keeps its own copy.
  }
}

interface StoreValue {
  state: HospitalState;
  dispatch: (cmd: Command) => Outcome;
  /** Real time, ticking once a second so waits and the demo clock move. */
  realNow: number;
}

const StoreContext = createContext<StoreValue | null>(null);

export function LocalStoreProvider({ children, tickMs = 1000 }: { children: ReactNode; tickMs?: number }) {
  const [state, setState] = useState<HospitalState>(() => {
    const saved = read();
    if (saved) return saved;
    const fresh = initialState(Date.now());
    write(fresh);
    return fresh;
  });
  const [realNow, setRealNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setRealNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  // The channel lives and dies with this effect. StrictMode runs effects twice in
  // development, so a channel made once and closed in a cleanup would stay closed.
  const channel = useRef<BroadcastChannel | undefined>(undefined);

  useEffect(() => {
    const reload = (): void => {
      const s = read();
      if (s) setState(s);
    };
    const onStorage = (e: StorageEvent): void => {
      if (e.key === KEY) reload();
    };
    const bc = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(CHANNEL);
    channel.current = bc;
    bc?.addEventListener('message', reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      bc?.close();
      if (channel.current === bc) channel.current = undefined;
    };
  }, []);

  const dispatch = useCallback(
    (cmd: Command): Outcome => {
      // Read the latest copy first: another tab may have changed it.
      const base = read() ?? state;
      const { state: next, outcome } = apply(base, cmd, Date.now());
      write(next);
      setState(next);
      try {
        channel.current?.postMessage('changed');
      } catch {
        // Other tabs still catch up through the storage event.
      }
      return outcome;
    },
    [state],
  );

  const registrar = useMemo<Registrar>(
    () => ({
      register: (reg) => {
        const o = dispatch({ type: 'register', reg });
        return Promise.resolve(o.ok && o.token ? { ok: true, token: o.token } : { ok: false, reason: 'offline' });
      },
    }),
    [dispatch],
  );

  const urgent = useMemo<UrgentSender>(
    () => ({ raise: (token) => Promise.resolve(dispatch({ type: 'raiseFlag', ...(token ? { token } : {}) }).ok ? 'sent' : 'queued') }),
    [dispatch],
  );

  const value = useMemo(() => ({ state, dispatch, realNow }), [state, dispatch, realNow]);
  return (
    <StoreContext.Provider value={value}>
      <RegistrarProvider registrar={registrar}>
        <UrgentProvider sender={urgent}>{children}</UrgentProvider>
      </RegistrarProvider>
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore needs a LocalStoreProvider');
  return v;
}

/** The store when one is mounted. Screens that also work without it use this. */
export function useOptionalStore(): StoreValue | null {
  return useContext(StoreContext);
}
