import { useEffect, useRef, useState } from 'react';
import { departments } from '@shared/data/departments.ts';
import { inService, waitingQueue } from '@shared/queue/queue.ts';
import { Icon } from '../components/Icon';
import { LANGS, t, type Lang } from '../i18n/t';
import { placeName } from '../patient/placeNames';
import { chime } from '../shell/alerts';
import { announce, canSpeak } from '../shell/speech';
import { useStore } from '../store/localStore';
import { doctorStatus } from '../store/selectors';

/** How long each language stays on screen. */
export const ALTERNATE_MS = 8000;

function clock(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Waiting-room board for a TV at /board. Alternates English and Hindi and reads
 * each newly called token aloud in both. Browsers need one tap before sound, so
 * the first thing on screen is "Enable sound".
 */
export function Board() {
  const { state } = useStore();
  const [langIndex, setLangIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const lang: Lang = LANGS[langIndex % LANGS.length] ?? 'en';

  useEffect(() => {
    const id = window.setInterval(() => setLangIndex((i) => i + 1), ALTERNATE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Announce each call once. Calls made before this page opened are not read out.
  const announced = useRef<Set<string> | null>(null);
  const called = Object.values(state.queue.tickets).filter((x) => x.status === 'called' && x.room && x.calledAtMs);
  useEffect(() => {
    const keys = called.map((x) => `${x.token}@${x.calledAtMs}`);
    if (announced.current === null) {
      announced.current = new Set(keys);
      return;
    }
    for (const x of called) {
      const key = `${x.token}@${x.calledAtMs}`;
      if (announced.current.has(key) || !x.room) continue;
      announced.current.add(key);
      if (!soundOn) continue;
      chime();
      for (const l of LANGS) announce(t(l, 'board.announce', { token: x.token, room: placeName(l, x.room) }), l);
    }
  });

  return (
    <div className="min-h-dvh bg-page p-4 text-ink" lang={lang}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">
            {t(lang, 'common.hospitalName')} · {t(lang, 'board.nowServing')}
          </h1>
          {canSpeak() && (
            <button
              type="button"
              onClick={() => setSoundOn(true)}
              aria-pressed={soundOn}
              className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-brand bg-card px-4 text-xl font-semibold"
            >
              <Icon name={soundOn ? 'check' : 'speaker'} />
              {soundOn ? t(lang, 'board.soundOn') : t(lang, 'board.enableSound')}
            </button>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const serving = inService(state.queue, d.code);
            const next = waitingQueue(state.queue, d.code).slice(0, 3);
            return (
              <section key={d.code} className="rounded-2xl border-2 border-line bg-card p-4" aria-label={t(lang, `dept.${d.code}`)}>
                <h2 className="text-2xl font-bold">{t(lang, `dept.${d.code}`)}</h2>
                {d.rooms.map((room) => {
                  const here = serving.find((x) => x.room === room);
                  const doc = doctorStatus(state, room);
                  return (
                    <div key={room} className="mt-2 flex items-baseline justify-between gap-2 border-t-2 border-line pt-2">
                      <span className="text-xl">{placeName(lang, room)}</span>
                      <span className="flex flex-col items-end">
                        <span className={`font-mono text-4xl font-bold ${here?.status === 'called' ? 'text-brand' : ''}`}>
                          {here?.status === 'called' && '▶ '}
                          {here?.token ?? '—'}
                        </span>
                        {doc.kind === 'late' && <span className="font-semibold text-danger">{t(lang, 'board.late', { m: doc.byMin })}</span>}
                        {doc.kind === 'break' && (
                          <span className="font-semibold text-danger">{t(lang, 'board.break', { time: clock(doc.untilMin) })}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
                <p className="mt-3 text-lg">
                  <span className="text-muted">{t(lang, 'board.nextTokens')}: </span>
                  <span className="font-mono font-semibold">{next.length ? next.map((x) => x.token).join('  ') : t(lang, 'board.noOne')}</span>
                </p>
              </section>
            );
          })}
        </div>

        <p className="flex items-center gap-2 rounded-2xl border-2 border-danger bg-card p-4 text-2xl font-bold">
          <Icon name="alert" className="size-9 text-danger" />
          {t(lang, 'board.emergency')}
        </p>
        <p className="text-base text-muted">{t(lang, 'common.demoMode')}</p>
      </div>
    </div>
  );
}
