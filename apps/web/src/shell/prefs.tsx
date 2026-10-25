import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGS, type Lang } from '../i18n/t';

export type TextSize = 'normal' | 'large' | 'largest';
export const TEXT_SIZES: readonly TextSize[] = ['normal', 'large', 'largest'];

/** Per-device settings. They live in this browser only, never on the server. */
export interface Prefs {
  lang: Lang;
  /** False until the first-visit language question is answered. */
  langChosen: boolean;
  textSize: TextSize;
  contrast: boolean;
  readAloud: boolean;
  avoidStairs: boolean;
  assisted: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  lang: 'en',
  langChosen: false,
  textSize: 'normal',
  contrast: false,
  readAloud: false,
  avoidStairs: false,
  assisted: false,
};

const STORAGE_KEY = 'opd-saathi.prefs.v1';

function isLang(v: unknown): v is Lang {
  return LANGS.some((l) => l === v);
}

function isTextSize(v: unknown): v is TextSize {
  return TEXT_SIZES.some((s) => s === v);
}

/** Reads saved prefs, keeping only fields that are valid. Storage can be missing or blocked. */
export function loadPrefs(): Prefs {
  let raw: unknown;
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return DEFAULT_PREFS;
  }
  if (typeof raw !== 'object' || raw === null) return DEFAULT_PREFS;
  const r = raw as Record<string, unknown>;
  const bool = (k: keyof Prefs): boolean =>
    typeof r[k] === 'boolean' ? (r[k] as boolean) : (DEFAULT_PREFS[k] as boolean);
  return {
    lang: isLang(r.lang) ? r.lang : DEFAULT_PREFS.lang,
    langChosen: bool('langChosen'),
    textSize: isTextSize(r.textSize) ? r.textSize : DEFAULT_PREFS.textSize,
    contrast: bool('contrast'),
    readAloud: bool('readAloud'),
    avoidStairs: bool('avoidStairs'),
    assisted: bool('assisted'),
  };
}

function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or blocked storage: settings last for this visit only.
  }
}

interface PrefsValue {
  prefs: Prefs;
  update: (patch: Partial<Prefs>) => void;
  /** Assisted mode turns on largest text, read aloud and avoid stairs (CONTEXT.md). */
  setAssisted: (on: boolean) => void;
}

const PrefsContext = createContext<PrefsValue | null>(null);

export function PrefsProvider({ children, initial }: { children: ReactNode; initial?: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(() => initial ?? loadPrefs());

  useEffect(() => {
    savePrefs(prefs);
    const root = document.documentElement;
    root.lang = prefs.lang;
    root.dataset.text = prefs.textSize;
    root.dataset.contrast = prefs.contrast ? 'high' : 'normal';
  }, [prefs]);

  const update = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), []);

  const setAssisted = useCallback(
    (on: boolean) =>
      setPrefs((p) =>
        on ? { ...p, assisted: true, textSize: 'largest', readAloud: true, avoidStairs: true } : { ...p, assisted: false },
      ),
    [],
  );

  const value = useMemo(() => ({ prefs, update, setAssisted }), [prefs, update, setAssisted]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const value = useContext(PrefsContext);
  if (!value) throw new Error('usePrefs needs a PrefsProvider');
  return value;
}
