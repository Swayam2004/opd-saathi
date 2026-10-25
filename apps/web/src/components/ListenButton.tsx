import { useEffect, useState } from 'react';
import { usePrefs } from '../shell/prefs';
import { canSpeak, speak, stopSpeaking } from '../shell/speech';
import { useT } from '../shell/useT';
import { Button } from './controls';

/** Reads `text` aloud. Hidden where the browser has no speech. */
export function ListenButton({ text }: { text: string }) {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || !canSpeak()) return;
    const id = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) setPlaying(false);
    }, 300);
    return () => window.clearInterval(id);
  }, [playing]);

  if (!canSpeak()) return null;

  return playing ? (
    <Button
      icon="stop"
      onClick={() => {
        stopSpeaking();
        setPlaying(false);
      }}
    >
      {tr('common.stop')}
    </Button>
  ) : (
    <Button
      icon="speaker"
      onClick={() => {
        speak(text, lang);
        setPlaying(true);
      }}
    >
      {tr('common.listen')}
    </Button>
  );
}
