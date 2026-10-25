import { useMemo } from 'react';
import { hospital } from '@shared/data/hospital.ts';
import { buildSteps, dictionaries, findRoute, renderStep, type PlaceId } from '@shared/routing/index.ts';
import { usePrefs } from '../shell/prefs';
import { useOptionalStore } from '../store/localStore';
import { ListenButton } from './ListenButton';

const NONE: readonly PlaceId[] = [];

/** Places staff marked out of service, or none without a store. */
export function useOutOfService(): readonly PlaceId[] {
  return useOptionalStore()?.state.outOfService ?? NONE;
}

/** Written steps between two places in the chosen language, honouring Avoid stairs and out of service. */
export function useRouteSteps(from: PlaceId, to: PlaceId): string[] {
  const { lang, avoidStairs } = usePrefs().prefs;
  const avoidPlaces = useOutOfService();
  return useMemo(() => {
    const r = findRoute(hospital, from, to, { avoidStairs, avoidPlaces });
    if (!r.ok) return [];
    return buildSteps(hospital, r.route).map((s) => renderStep(dictionaries[lang], s));
  }, [from, to, lang, avoidStairs, avoidPlaces]);
}

export function RouteSteps({ from, to, intro, listen = true }: { from: PlaceId; to: PlaceId; intro: string; listen?: boolean }) {
  const steps = useRouteSteps(from, to);
  if (steps.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold">{intro}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-7">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {listen && <ListenButton text={steps.join(' ')} />}
    </div>
  );
}
