import { EmergencySigns } from '../components/EmergencySigns';
import { Icon } from '../components/Icon';
import { RouteSteps } from '../components/RouteSteps';
import { Term } from '../components/Term';
import { useReadAloud } from './speech';
import { UrgentHelp } from './UrgentHelp';
import { useT } from './useT';

/**
 * Reachable from every screen and before registration. Says what to do, never
 * what the person has, and shows no wait time (docs/research/07 section 4.2).
 */
export function Emergency() {
  const tr = useT();
  const spoken = [tr('emergency.goNow'), tr('emergency.noToken'), tr('emergency.where')].join(' ');
  useReadAloud(spoken);

  return (
    <section aria-labelledby="emergency-title" className="flex flex-col gap-5">
      <div className="rounded-2xl border-2 border-danger bg-card p-4">
        <h1 id="emergency-title" className="flex items-center gap-2 text-2xl font-bold text-danger">
          <Icon name="alert" className="size-8" />
          {tr('emergency.title')}
        </h1>
        <p className="mt-2 text-xl font-semibold">{tr('emergency.goNow')}</p>
        <p className="text-xl font-semibold">{tr('emergency.noToken')}</p>
      </div>

      <UrgentHelp />

      <div className="flex flex-col gap-3">
        <p>{tr('emergency.numbers')}</p>
        <a
          href="tel:112"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-danger bg-card px-4 text-xl font-bold"
        >
          <Icon name="phone" />
          {tr('emergency.call112')}
        </a>
        <a
          href="tel:108"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-danger bg-card px-4 text-xl font-bold"
        >
          <Icon name="phone" />
          {tr('emergency.call108')}
        </a>
      </div>

      <section aria-labelledby="way-title" className="flex flex-col gap-2">
        <h2 id="way-title" className="flex items-center gap-2 text-xl font-bold">
          <Icon name="route" />
          {tr('emergency.where')}
        </h2>
        <Term k="casualty" />
        {/* Static route from the main entrance. The full map comes with Find a place (D7). */}
        <RouteSteps from="entrance" to="emergency" intro={tr('emergency.fromEntrance')} />
      </section>

      <EmergencySigns />
    </section>
  );
}
