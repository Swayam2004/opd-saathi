import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { hospital } from '@shared/data/hospital.ts';
import {
  buildSteps,
  dictionaries,
  findRoute,
  renderFloorSvg,
  renderStep,
  type FloorId,
  type Place,
  type Route,
} from '@shared/routing/index.ts';
import { Button, Toggle } from '../components/controls';
import { Icon } from '../components/Icon';
import { ListenButton } from '../components/ListenButton';
import { RouteSteps, useOutOfService } from '../components/RouteSteps';
import { Term } from '../components/Term';
import { t, type Lang } from '../i18n/t';
import { usePrefs } from '../shell/prefs';
import { useT } from '../shell/useT';
import { floorName, placeName } from './placeNames';

const HIDDEN_KINDS = new Set(['waypoint', 'lift', 'stairs', 'ramp']);

/** Places a person would look for. Lifts and stairs show on the plan, not in the list. */
export const PICKABLE: Place[] = hospital.places.filter((p) => !HIDDEN_KINDS.has(p.kind));

function matches(lang: Lang, p: Place, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [placeName(lang, p.id), placeName('en', p.id), p.id].some((s) => s.toLowerCase().includes(needle));
}

function PlaceList({ onPick, exclude }: { onPick: (id: string) => void; exclude?: string }) {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const [q, setQ] = useState('');
  const list = PICKABLE.filter((p) => p.id !== exclude && matches(lang, p, q));
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="place-search" className="font-semibold">
        {tr('find.search')}
      </label>
      <input
        id="place-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="min-h-14 w-full rounded-2xl border-2 border-line bg-card px-4 text-xl text-ink"
      />
      <p className="font-semibold">{tr('find.pick')}</p>
      {list.length === 0 && <p role="status">{tr('find.noResults', { q })}</p>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {list.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-card px-4 py-2 text-left text-ink"
            >
              <Icon name="find" />
              <span className="flex flex-col">
                <span className="text-lg font-semibold">{placeName(lang, p.id)}</span>
                <span className="text-base text-muted">{floorName(lang, p.floor)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One floor plan per floor the route touches, start and end marked by shape. */
function FloorPlans({ route }: { route: Route }) {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const floors = useMemo(() => {
    const seen: FloorId[] = [];
    for (const id of route.nodes) {
      const f = hospital.places.find((p) => p.id === id)?.floor;
      if (f !== undefined && !seen.includes(f)) seen.push(f);
    }
    return seen;
  }, [route]);

  return (
    <div className="flex flex-col gap-4" aria-label={tr('find.map')}>
      {floors.map((f) => (
        <figure key={f} className="m-0 overflow-hidden rounded-2xl border-2 border-line bg-white">
          <figcaption className="bg-soft px-3 py-1 font-semibold text-ink">{floorName(lang, f)}</figcaption>
          {/* Maps are exempt from reflow (WCAG 1.4.10): keep labels readable and scroll sideways. */}
          <div
            tabIndex={0}
            className="overflow-x-auto [&>svg]:h-auto [&>svg]:w-full [&>svg]:min-w-[34rem]"
            // Our own data, escaped by renderFloorSvg. Ids made unique per floor.
            dangerouslySetInnerHTML={{
              __html: renderFloorSvg(hospital, f, { route, dict: dictionaries[lang], scale: 10 }).replaceAll(
                'plan-title',
                `plan-title-${f}`,
              ),
            }}
          />
        </figure>
      ))}
    </div>
  );
}

/** Large card for a member of staff: where the person needs to go, in their language and English. */
function LostCard({ to }: { to: string }) {
  const { lang } = usePrefs().prefs;
  const langs: Lang[] = lang === 'en' ? ['en'] : [lang, 'en'];
  return (
    <div className="rounded-2xl border-4 border-ink bg-card p-4">
      {langs.map((l) => (
        <div key={l} lang={l} className="py-1">
          <p className="text-lg">{t(l, 'find.lostCard')}</p>
          <p className="text-3xl font-bold">{t(l, 'find.lostDest', { place: placeName(l, to) })}</p>
        </div>
      ))}
    </div>
  );
}

export function Find() {
  const tr = useT();
  const { prefs, update } = usePrefs();
  const { lang, avoidStairs } = prefs;
  const [params, setParams] = useSearchParams();
  const to = PICKABLE.some((p) => p.id === params.get('to')) ? (params.get('to') ?? undefined) : undefined;
  const from = hospital.places.some((p) => p.id === params.get('from')) ? (params.get('from') ?? 'entrance') : 'entrance';
  const [picking, setPicking] = useState<'from' | undefined>();
  const [lost, setLost] = useState(false);

  const set = (patch: Record<string, string>): void => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    setParams(next, { replace: true });
  };

  const avoidPlaces = useOutOfService();
  const result = useMemo(
    () => (to ? findRoute(hospital, from, to, { avoidStairs, avoidPlaces }) : undefined),
    [from, to, avoidStairs, avoidPlaces],
  );
  // Out-of-service places the usual route would have used, named once each ("Lift").
  const detours = useMemo(() => {
    if (!to || avoidPlaces.length === 0) return [];
    const usual = findRoute(hospital, from, to, { avoidStairs });
    if (!usual.ok) return [];
    const names = usual.route.nodes.filter((n) => avoidPlaces.includes(n)).map((n) => placeName(lang, n));
    return [...new Set(names)];
  }, [from, to, avoidStairs, avoidPlaces, lang]);
  const steps = useMemo(
    () => (result?.ok ? buildSteps(hospital, result.route).map((s) => renderStep(dictionaries[lang], s)) : []),
    [result, lang],
  );

  if (picking === 'from') {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{tr('find.from')}</h1>
        <PlaceList
          onPick={(id) => {
            set({ from: id });
            setPicking(undefined);
          }}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="find-title" className="flex flex-col gap-4">
      <h1 id="find-title" className="text-2xl font-bold">
        {tr('find.title')}
      </h1>

      <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-line bg-card p-3">
        <p className="m-0 font-semibold">{tr('find.youAreAt', { place: placeName(lang, from) })}</p>
        <button type="button" onClick={() => setPicking('from')} className="min-h-14 shrink-0 rounded-xl px-2 font-semibold text-brand underline">
          {tr('common.change')}
        </button>
      </div>

      <Toggle
        label={tr('find.avoidStairs')}
        hint={tr('term.avoidStairs.gloss')}
        checked={avoidStairs}
        onChange={(v) => update({ avoidStairs: v })}
        onWord={tr('settings.on')}
        offWord={tr('settings.off')}
      />

      {!to && <PlaceList onPick={(id) => set({ to: id })} exclude={from} />}

      {to && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="m-0 text-xl font-bold">
              {tr('find.to')}: {placeName(lang, to)}
            </p>
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('to');
                setParams(next, { replace: true });
                setLost(false);
              }}
              className="min-h-14 shrink-0 rounded-xl px-2 font-semibold text-brand underline"
            >
              {tr('common.change')}
            </button>
          </div>

          {detours.map((name) => (
            <p key={name} role="status" className="flex items-center gap-2 rounded-2xl border-2 border-danger bg-card p-3 font-semibold">
              <Icon name="alert" className="size-6 text-danger" />
              {tr('find.outOfService', { place: name })}
            </p>
          ))}

          {result && !result.ok && (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border-2 border-danger bg-card p-4">
              <p className="font-semibold">{tr('find.noRoute')}</p>
              <RouteSteps from={from} to="helpdesk" intro={tr('find.lostHelpDesk')} />
            </div>
          )}

          {result?.ok && (
            <>
              <section aria-labelledby="steps-title" className="flex flex-col gap-2">
                <h2 id="steps-title" className="text-xl font-bold">
                  {tr('find.steps')}
                </h2>
                <p className="text-base text-muted">{tr('find.distance', { n: Math.round(result.route.metres) })}</p>
                <ol className="flex list-decimal flex-col gap-2 pl-7">
                  {steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <ListenButton text={steps.join(' ')} />
              </section>
              <FloorPlans route={result.route} />
              <Term k="landmark" />
            </>
          )}

          <Button icon="help" onClick={() => setLost((l) => !l)} pressed={lost}>
            {tr('find.lost')}
          </Button>
          {lost && (
            <div className="flex flex-col gap-3">
              <LostCard to={to} />
              <RouteSteps from={from} to="helpdesk" intro={tr('find.lostHelpDesk')} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
