import { en, type MessageKey } from './en';
import { hi } from './hi';

export type { MessageKey } from './en';

// TODO(S2): import Lang from the shared contract once it lands.
export type Lang = 'en' | 'hi';

export const LANGS: readonly Lang[] = ['en', 'hi'];

// Each language's name in its own script, for the first-visit picker.
export const LANG_NAMES: Record<Lang, string> = { en: 'English', hi: 'हिंदी' };

// BCP 47 tags for speechSynthesis and <html lang>.
export const LANG_TAGS: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN' };

const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, hi };

type Params<S extends string> = S extends `${string}{${infer P}}${infer Rest}`
  ? P | Params<Rest>
  : never;

/** The `{placeholder}` names in a message, read from the English text. */
export type ParamsOf<K extends MessageKey> = Params<(typeof en)[K]>;

export type Args<K extends MessageKey> = [ParamsOf<K>] extends [never]
  ? []
  : [params: Record<ParamsOf<K>, string | number>];

/**
 * Look up a message and fill its placeholders.
 * `t('hi', 'turn.ahead', { n: 6 })` gives "आपके आगे 6 लोग हैं".
 */
export function t<K extends MessageKey>(lang: Lang, key: K, ...args: Args<K>): string {
  const params: Partial<Record<string, string | number>> = args[0] ?? {};
  return dictionaries[lang][key].replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
