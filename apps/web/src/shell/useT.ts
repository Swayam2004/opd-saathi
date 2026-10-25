import { useCallback } from 'react';
import { t, type Args, type MessageKey } from '../i18n/t';
import { usePrefs } from './prefs';

/** `t` bound to the current language. */
export function useT(): <K extends MessageKey>(key: K, ...args: Args<K>) => string {
  const { lang } = usePrefs().prefs;
  return useCallback(<K extends MessageKey>(key: K, ...args: Args<K>) => t(lang, key, ...args), [lang]);
}
