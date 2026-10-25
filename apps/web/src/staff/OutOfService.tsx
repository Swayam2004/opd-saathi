import { Link } from 'react-router';
import { hospital } from '@shared/data/hospital.ts';
import type { PlaceId } from '@shared/routing/types.ts';
import { Toggle } from '../components/controls';
import { Icon } from '../components/Icon';
import { useT } from '../shell/useT';
import { useStore } from '../store/localStore';
import { calibration } from '../store/selectors';

const GROUPS = [
  { key: 'staff.places.lift', places: hospital.places.filter((p) => p.kind === 'lift').map((p) => p.id) },
  { key: 'staff.places.ramp', places: hospital.places.filter((p) => p.kind === 'ramp').map((p) => p.id) },
] as const satisfies readonly { key: string; places: PlaceId[] }[];

/** Staff mark a lift or ramp out of service. A panel the staff dashboard (S5) can embed. */
export function OutOfServicePanel() {
  const tr = useT();
  const { state, dispatch } = useStore();
  return (
    <section aria-labelledby="oos-title" className="flex flex-col gap-3">
      <h2 id="oos-title" className="text-xl font-bold">
        {tr('staff.places.title')}
      </h2>
      <p className="text-base text-muted">{tr('staff.places.hint')}</p>
      {GROUPS.map((g) => {
        const out = g.places.length > 0 && g.places.every((p) => state.outOfService.includes(p));
        return (
          <Toggle
            key={g.key}
            label={tr(g.key)}
            checked={out}
            onChange={(on) => {
              for (const place of g.places) dispatch({ type: 'setOutOfService', place, on });
            }}
            onWord={tr('staff.outOfService')}
            offWord={tr('staff.backInService')}
          />
        );
      })}
    </section>
  );
}

/** D11: share of patients whose wait fell inside the range they were shown. */
export function CalibrationCard() {
  const tr = useT();
  const { state } = useStore();
  const c = calibration(state);
  return (
    <section aria-labelledby="cal-title" className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-card p-4">
      <h2 id="cal-title" className="text-xl font-bold">
        {tr('staff.calibration.title')}
      </h2>
      <p className="text-lg">{c.shown === 0 ? tr('staff.calibration.none') : tr('staff.calibration', { inside: c.inside, shown: c.shown })}</p>
    </section>
  );
}

/** Stand-alone page until the staff dashboard lands. */
export function OutOfServicePage() {
  const tr = useT();
  return (
    <div className="min-h-dvh bg-page p-4 text-ink">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-bold">{tr('staff.title')}</h1>
        <p className="flex items-center gap-2 rounded-xl bg-soft p-3 text-base">
          <Icon name="alert" className="size-6" />
          {tr('staff.loginNote')}
        </p>
        <OutOfServicePanel />
        <CalibrationCard />
        <Link to="/" className="flex min-h-14 items-center gap-2 font-semibold text-brand underline">
          <Icon name="home" />
          {tr('common.home')}
        </Link>
      </div>
    </div>
  );
}
