import { Icon } from '../components/Icon';
import { LANG_NAMES, LANGS, t } from '../i18n/t';
import { usePrefs } from './prefs';

/** First visit only. Asks in every language at once, each in its own script. */
export function LanguagePicker() {
  const { update } = usePrefs();
  return (
    <section aria-labelledby="lang-title" className="flex flex-col gap-4 pt-4">
      <h1 id="lang-title" className="flex items-center gap-3 text-2xl font-bold">
        <Icon name="language" className="size-9" />
        <span className="flex flex-col">
          {LANGS.map((l) => (
            <span key={l} lang={l}>
              {t(l, 'home.lang.title')}
            </span>
          ))}
        </span>
      </h1>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => update({ lang: l, langChosen: true })}
          className="min-h-20 rounded-2xl border-2 border-brand bg-card px-4 text-3xl font-bold text-ink"
        >
          {LANG_NAMES[l]}
        </button>
      ))}
      {LANGS.map((l) => (
        <p key={l} lang={l} className="text-base text-muted">
          {t(l, 'home.lang.later')}
        </p>
      ))}
    </section>
  );
}
