import { useEffect, useState } from 'react';
import { LANG_TAGS, type Lang } from '../i18n/t';
import { usePrefs } from './prefs';

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  const tag = LANG_TAGS[lang].toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().replace('_', '-') === tag) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang))
  );
}

/** Reads `text` aloud, cutting off anything already playing. Does nothing where speech is missing. */
export function speak(text: string, lang: Lang): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_TAGS[lang];
  const voice = voiceFor(lang);
  if (voice) u.voice = voice;
  synth.speak(u);
}

/** Adds `text` to the speech queue without cutting off what is playing (board call-outs). */
export function announce(text: string, lang: Lang): void {
  if (!canSpeak()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_TAGS[lang];
  const voice = voiceFor(lang);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/**
 * Whether this device has a voice for `lang`. Voices load late on some browsers,
 * so this listens for `voiceschanged`. Undefined means "can't tell yet".
 */
export function useHasVoice(lang: Lang): boolean | undefined {
  const [has, setHas] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (!canSpeak()) {
      setHas(false);
      return;
    }
    const synth = window.speechSynthesis;
    const check = (): void => {
      if (synth.getVoices().length > 0) setHas(voiceFor(lang) !== undefined);
    };
    check();
    synth.addEventListener('voiceschanged', check);
    return () => synth.removeEventListener('voiceschanged', check);
  }, [lang]);
  return has;
}

/** With "Read everything aloud" on, reads the screen's main text when it opens or changes. */
export function useReadAloud(text: string): void {
  const { lang, readAloud } = usePrefs().prefs;
  useEffect(() => {
    if (readAloud) speak(text, lang);
  }, [text, lang, readAloud]);
  useEffect(() => stopSpeaking, []);
}
