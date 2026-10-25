import { useCallback, useEffect } from 'react';
import { waitRange } from '@shared/queue/range.ts';
import { useParams } from 'react-router';
import type { DoctorStatus } from '@shared/queue/wait.ts';
import { BigLink } from '../components/controls';
import { Icon } from '../components/Icon';
import { RouteSteps } from '../components/RouteSteps';
import { Term } from '../components/Term';
import { t, type Lang } from '../i18n/t';
import { chime, useAlertOnce, vibrate } from '../shell/alerts';
import { usePrefs } from '../shell/prefs';
import { useReadAloud } from '../shell/speech';
import { UrgentHelp } from '../shell/UrgentHelp';
import { useT } from '../shell/useT';
import { useOptionalStore, useStore } from '../store/localStore';
import { doctorStatus, ticketView, type TicketView } from '../store/selectors';
import { floorOf, floorPhrase, placeName } from './placeNames';
import { roomInfo, waitText } from './Slip';

/** The brief: alert when 3 people are ahead. */
export const CLOSE_AT = 3;

function clock(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
}

function doctorText(lang: Lang, s: DoctorStatus): string | undefined {
  switch (s.kind) {
    case 'available':
      return t(lang, 'turn.doctor.in');
    case 'break':
      return t(lang, 'turn.doctor.break', { time: clock(s.untilMin) });
    case 'late':
      return t(lang, 'turn.doctor.late', { m: s.byMin });
    case 'off':
      return undefined;
  }
}

export function aheadText(lang: Lang, n: number): string {
  if (n === 0) return t(lang, 'turn.aheadNone');
  if (n === 1) return t(lang, 'turn.aheadOne');
  return t(lang, 'turn.ahead', { n });
}

function Status({ v }: { v: TicketView }) {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  // For sentences: the room once known, else the waiting hall (Medicine's room is set at call time).
  const { room } = roomInfo(lang, v);
  const placeId = room ? (v.ticket.room ?? v.dept.rooms[0] ?? 'hall_a') : 'hall_a';
  const where = { room: placeName(lang, placeId), floor: floorPhrase(lang, floorOf(placeId) ?? 1) };
  const close = v.ticket.status === 'waiting' && v.ahead <= CLOSE_AT;
  const called = v.ticket.status === 'called';

  const alertClose = useCallback(() => {
    chime();
    vibrate();
  }, []);
  useAlertOnce(`${v.ticket.token}:close`, close, alertClose);
  useAlertOnce(`${v.ticket.token}:called`, called, alertClose);

  // Wait range (D11). The first range a patient sees is kept, so staff can check it later.
  const range = v.ticket.status === 'waiting' && v.wait.kind === 'minutes' ? waitRange(v.wait.minutes) : undefined;
  const store = useOptionalStore();
  const token = v.ticket.token;
  const alreadyShown = store?.state.shown.some((x) => x.token === token) ?? true;
  useEffect(() => {
    if (range && !alreadyShown) store?.dispatch({ type: 'recordShown', range: { token, lowMin: range.lowMin, highMin: range.highMin } });
  }, [range, alreadyShown, store, token]);

  const headline =
    v.ticket.status === 'waiting'
      ? `${aheadText(lang, v.ahead)}. ${waitText(lang, v.wait)}`
      : called
        ? tr('turn.calledBody', where)
        : v.ticket.status === 'in_consult'
          ? tr('turn.inRoom')
          : v.ticket.status === 'no_show'
            ? tr('turn.missed')
            : tr('turn.done');
  useReadAloud(headline);

  if (called) {
    return (
      <div className="flex flex-col gap-4">
        <div role="alert" className="rounded-2xl border-4 border-brand bg-soft p-4">
          <p className="flex items-center gap-2 text-3xl font-bold">
            <Icon name="bell" className="size-9" />
            {tr('turn.called')}
          </p>
          <p className="mt-2 text-2xl font-semibold">{tr('turn.calledBody', where)}</p>
        </div>
        {v.ticket.room && <RouteSteps from="hall_a" to={v.ticket.room} intro={tr('turn.showWay')} />}
        <BigLink to={`/find?to=${v.ticket.room ?? ''}`} icon="find" label={tr('turn.showWay')} tone="brand" />
      </div>
    );
  }

  if (v.ticket.status !== 'waiting') {
    return <p className="rounded-2xl border-2 border-line bg-card p-4 text-2xl font-semibold">{headline}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {close && (
        <div role="alert" className="rounded-2xl border-4 border-brand bg-soft p-4">
          <p className="flex items-center gap-2 text-2xl font-bold">
            <Icon name="bell" className="size-8" />
            {tr('turn.close')}
          </p>
          <p className="text-xl">{tr('turn.closeBody', where)}</p>
        </div>
      )}
      {close && v.patient?.mobile && (
        <figure className="m-0 rounded-2xl border-2 border-line bg-card p-3">
          <figcaption className="text-base text-muted">{tr('turn.smsLabel')}</figcaption>
          <p className="mt-1 rounded-xl bg-soft p-3">{tr('turn.sms', { token: v.ticket.token, ...where })}</p>
        </figure>
      )}
      <div className="rounded-2xl border-2 border-line bg-card p-4">
        <p className="text-3xl font-bold">{aheadText(lang, v.ahead)}</p>
        <p className="text-2xl">{waitText(lang, v.wait)}</p>
        {range && <p className="text-lg text-muted">{tr('turn.waitRange', { low: range.lowMin, high: range.highMin })}</p>}
      </div>
      <Term k="estimatedWait" />
    </div>
  );
}

export function Turn() {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const { token = '' } = useParams();
  const { state, realNow } = useStore();
  const v = ticketView(state, token, realNow);

  if (!v) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{tr('turn.title')}</h1>
        <p role="alert">{tr('turn.entry.notFound', { token })}</p>
        <BigLink to="/token" icon="slip" label={tr('turn.entry.title')} />
      </section>
    );
  }

  const doctors = v.dept.rooms
    .map((room) => ({ room, text: doctorText(lang, doctorStatus(state, room)) }))
    .filter((d): d is { room: string; text: string } => d.text !== undefined);

  return (
    <section aria-labelledby="turn-title" className="flex flex-col gap-5">
      <div>
        <h1 id="turn-title" className="text-2xl font-bold">
          {tr('turn.title')}
        </h1>
        <p className="text-base text-muted">{tr('turn.yourToken')}</p>
        <p className="font-mono text-[min(3rem,14vw)] font-bold whitespace-nowrap">{v.ticket.token}</p>
        <p className="text-lg">{tr(`dept.${v.dept.code}`)}</p>
      </div>

      <Status v={v} />

      <dl className="m-0 flex flex-col gap-2">
        <div>
          <dt className="text-base text-muted">{tr('turn.nowServing')}</dt>
          <dd className="m-0 font-mono text-2xl font-bold">
            {v.nowServing.length > 0 ? v.nowServing.map((x) => x.token).join(', ') : '—'}
          </dd>
        </div>
        {doctors.map((d) => (
          <div key={d.room}>
            <dt className="text-base text-muted">{placeName(lang, d.room)}</dt>
            <dd className="m-0 text-lg">{d.text}</dd>
          </div>
        ))}
      </dl>

      {v.ticket.status === 'waiting' && (
        <div>
          <p className="font-bold">{tr('turn.whatNow')}</p>
          <p>{tr('turn.sitIn', { place: tr('turn.waitingHall') })}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <BigLink to={`/slip/${v.ticket.token}`} icon="slip" label={tr('slip.title')} />
        <UrgentHelp token={v.ticket.token} />
      </div>
    </section>
  );
}
