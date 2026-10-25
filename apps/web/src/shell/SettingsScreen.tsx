import { Button, Toggle } from '../components/controls';
import { LANG_NAMES, LANGS } from '../i18n/t';
import { TEXT_SIZES, usePrefs } from './prefs';
import { canSpeak, useHasVoice } from './speech';
import { useT } from './useT';

export function SettingsScreen() {
  const tr = useT();
  const { prefs, update, setAssisted } = usePrefs();
  const hasVoice = useHasVoice(prefs.lang);
  const on = tr('settings.on');
  const off = tr('settings.off');

  return (
    <section aria-labelledby="settings-title" className="flex flex-col gap-6">
      <h1 id="settings-title" className="text-2xl font-bold">
        {tr('settings.title')}
      </h1>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-bold">{tr('settings.language')}</legend>
        {LANGS.map((l) => (
          <Button key={l} icon={prefs.lang === l ? 'check' : 'language'} pressed={prefs.lang === l} onClick={() => update({ lang: l, langChosen: true })}>
            <span lang={l}>{LANG_NAMES[l]}</span>
          </Button>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-bold">{tr('settings.textSize')}</legend>
        {TEXT_SIZES.map((s) => (
          <Button key={s} {...(prefs.textSize === s ? { icon: 'check' as const } : {})} pressed={prefs.textSize === s} onClick={() => update({ textSize: s })}>
            {tr(`settings.textSize.${s}`)}
          </Button>
        ))}
      </fieldset>

      <div className="flex flex-col gap-3">
        <Toggle
          label={tr('settings.assisted')}
          hint={tr('term.assistedMode.gloss')}
          checked={prefs.assisted}
          onChange={setAssisted}
          onWord={on}
          offWord={off}
        />
        <Toggle
          label={tr('settings.readAloud')}
          checked={prefs.readAloud}
          onChange={(v) => update({ readAloud: v })}
          onWord={on}
          offWord={off}
        />
        {canSpeak() && hasVoice === false && <p role="status">{tr('settings.noHindiVoice')}</p>}
        <Toggle
          label={tr('settings.avoidStairs')}
          hint={tr('term.avoidStairs.gloss')}
          checked={prefs.avoidStairs}
          onChange={(v) => update({ avoidStairs: v })}
          onWord={on}
          offWord={off}
        />
        <Toggle
          label={tr('settings.contrast')}
          hint={tr('settings.contrast.hint')}
          checked={prefs.contrast}
          onChange={(v) => update({ contrast: v })}
          onWord={on}
          offWord={off}
        />
      </div>

      <p>{tr('settings.helpline104')}</p>
      <p className="text-base text-muted">{tr('common.madeUp')}</p>
    </section>
  );
}
