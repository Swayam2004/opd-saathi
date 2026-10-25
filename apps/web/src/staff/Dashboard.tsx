import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { departments, type Department, type DeptCode } from '@shared/data/departments.ts';
import { minuteOfDay } from '@shared/queue/clock.ts';
import { inService, waitingQueue, type Ticket } from '@shared/queue/queue.ts';
import type { DoctorStatus } from '@shared/queue/wait.ts';
import { Button } from '../components/controls';
import { Icon } from '../components/Icon';
import { t, type Lang } from '../i18n/t';
import { placeName } from '../patient/placeNames';
import { chime } from '../shell/alerts';
import { usePrefs } from '../shell/prefs';
import { useT } from '../shell/useT';
import type { Command, HospitalState, Outcome } from '../store/hospital';
import { useStore } from '../store/localStore';
import { doctorStatus, simNowMs } from '../store/selectors';
import { CalibrationCard, OutOfServicePanel } from './OutOfService';

/** How often an unseen urgent flag sounds again, in real ms. */
export const FLAG_REPEAT_MS = 10_000;

export function hhmm(min: number): string {
  return `${Math.floor(min / 60)}:${String(Math.round(min) % 60).padStart(2, '0')}`;
}

const SMALL_BTN = 'min-h-14 rounded-xl border-2 px-3 font-semibold';

export type Crowd = 'ok' | 'busy' | 'full';

/** Waiting people against seats. Shown as a word and an icon as well as a colour. */
export function crowdLevel(waiting: number, seats: number): Crowd {
  const ratio = waiting / Math.max(1, seats);
  return ratio >= 1 ? 'full' : ratio >= 0.6 ? 'busy' : 'ok';
}

function useAct(): { act: (cmd: Command) => void; error: string | undefined } {
  const { dispatch } = useStore();
  const [error, setError] = useState<string>();
  return {
    act: (cmd) => {
      const o: Outcome = dispatch(cmd);
      setError(o.ok ? undefined : o.error);
    },
    error,
  };
}

function UrgentFlags() {
  const tr = useT();
  const { state, dispatch } = useStore();
  const [soundOn, setSoundOn] = useState(false);
  const open = state.flags.filter((f) => !f.seenAtMs);

  // Sound on arrival, then again every few seconds until someone marks it seen.
  useEffect(() => {
    if (!soundOn || open.length === 0) return;
    chime();
    const id = window.setInterval(chime, FLAG_REPEAT_MS);
    return () => window.clearInterval(id);
  }, [soundOn, open.length]);

  return (
    <section aria-labelledby="flags-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="flags-title" className="flex items-center gap-2 text-2xl font-bold text-danger">
          <Icon name="bell" />
          {tr('staff.urgent.title')}
        </h2>
        <button type="button" aria-pressed={soundOn} onClick={() => setSoundOn(true)} className={`${SMALL_BTN} flex items-center gap-2 border-brand bg-card`}>
          <Icon name={soundOn ? 'check' : 'speaker'} className="size-6" />
          {soundOn ? tr('staff.soundOn') : tr('staff.enableSound')}
        </button>
      </div>
      {open.length === 0 && <p className="text-muted">{tr('staff.urgent.none')}</p>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {open.map((f) => (
          <li key={f.id} role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-4 border-danger bg-card p-3">
            <span className="flex flex-col">
              <span className="text-xl font-bold">{f.token ? tr('staff.urgent.token', { token: f.token }) : tr('staff.urgent.noToken')}</span>
              <span className="text-base text-muted">{tr('staff.urgent.raised', { time: hhmm(minuteOfDay(f.raisedAtMs)) })}</span>
            </span>
            <button type="button" onClick={() => dispatch({ type: 'flagSeen', id: f.id })} className={`${SMALL_BTN} flex items-center gap-2 border-danger bg-danger text-danger-ink`}>
              <Icon name="check" className="size-6" />
              {tr('staff.urgent.seen')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function doctorOptions(lang: Lang, nowMin: number): { label: string; status: DoctorStatus }[] {
  const breakUntil = (m: number): number => Math.ceil((nowMin + m) / 5) * 5;
  return [
    { label: t(lang, 'staff.doctor.in'), status: { kind: 'available' } },
    ...[15, 30].map((m) => ({ label: t(lang, 'staff.doctor.break', { time: hhmm(breakUntil(m)) }), status: { kind: 'break', untilMin: breakUntil(m) } as DoctorStatus })),
    ...[10, 20, 30].map((m) => ({ label: t(lang, 'staff.doctor.late', { m }), status: { kind: 'late', byMin: m } as DoctorStatus })),
  ];
}

function sameStatus(a: DoctorStatus, b: DoctorStatus): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function RoomRow({ dept, room, here, nowMin, act }: { dept: Department; room: string; here: Ticket | undefined; nowMin: number; act: (c: Command) => void }) {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const { state } = useStore();
  const current = doctorStatus(state, room);
  const options = doctorOptions(lang, nowMin);
  const selected = Math.max(0, options.findIndex((o) => sameStatus(o.status, current)));
  const roomLabel = placeName(lang, room);

  return (
    <div className="flex flex-col gap-2 border-t-2 border-line pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg font-semibold">{roomLabel}</span>
        <span className="font-mono text-2xl font-bold">{here?.token ?? '—'}</span>
      </div>
      <p className="m-0 text-base text-muted">
        {here ? (here.status === 'called' ? `▶ ${tr('staff.status.called')}` : tr('staff.status.inConsult')) : tr('staff.roomFree')}
      </p>
      <div className="flex flex-wrap gap-2">
        {!here && (
          <button type="button" onClick={() => act({ type: 'callNext', dept: dept.code, room })} className={`${SMALL_BTN} border-brand bg-brand text-brand-ink`}>
            {tr('staff.callNext')} · {roomLabel}
          </button>
        )}
        {here?.status === 'called' && (
          <>
            <button type="button" onClick={() => act({ type: 'start', token: here.token })} className={`${SMALL_BTN} border-brand bg-card`}>
              {tr('staff.arrived')}
            </button>
            <button type="button" onClick={() => act({ type: 'noShow', token: here.token })} className={`${SMALL_BTN} border-line bg-card`}>
              {tr('staff.noShow')}
            </button>
          </>
        )}
        {here && (
          <button type="button" onClick={() => act({ type: 'complete', token: here.token })} className={`${SMALL_BTN} border-line bg-card`}>
            {tr('staff.finish')}
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1 text-base">
        <span className="text-muted">{tr('staff.doctor.update')}</span>
        <select
          value={selected}
          onChange={(e) => {
            const o = options[Number(e.target.value)];
            if (o) act({ type: 'setDoctor', room, status: o.status });
          }}
          className="min-h-14 rounded-xl border-2 border-line bg-card px-2 text-ink"
        >
          {options.map((o, i) => (
            <option key={o.label} value={i}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function WaitingRow({ ticket, state, act }: { ticket: Ticket; state: HospitalState; act: (c: Command) => void }) {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const [to, setTo] = useState<DeptCode | ''>('');
  const name = state.patients[ticket.token]?.name[lang];
  return (
    <li className="flex flex-col gap-2 rounded-xl border-2 border-line p-2">
      <span className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xl font-bold">{ticket.token}</span>
        {name && <span>{name}</span>}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => act({ type: 'sendToEnd', token: ticket.token })} className={`${SMALL_BTN} border-line bg-card`}>
          {tr('staff.sendToEnd')}
        </button>
        <label className="sr-only" htmlFor={`move-${ticket.token}`}>
          {tr('staff.moveTo', { token: ticket.token })}
        </label>
        <select
          id={`move-${ticket.token}`}
          value={to}
          onChange={(e) => setTo(e.target.value as DeptCode | '')}
          className="min-h-14 rounded-xl border-2 border-line bg-card px-2 text-ink"
        >
          <option value="">{tr('staff.move')}</option>
          {departments
            .filter((d) => d.code !== ticket.dept)
            .map((d) => (
              <option key={d.code} value={d.code}>
                {tr(`dept.${d.code}`)}
              </option>
            ))}
        </select>
        <button
          type="button"
          disabled={!to}
          onClick={() => to && act({ type: 'move', token: ticket.token, dept: to })}
          className={`${SMALL_BTN} border-line bg-card disabled:opacity-50`}
        >
          {tr('staff.move.go')}
        </button>
      </div>
    </li>
  );
}

const CROWD_ICON: Record<Crowd, 'check' | 'alert' | 'bell'> = { ok: 'check', busy: 'bell', full: 'alert' };
const CROWD_STYLE: Record<Crowd, string> = { ok: 'border-brand', busy: 'border-ink', full: 'border-danger bg-danger text-danger-ink' };

function DeptCard({ dept }: { dept: Department }) {
  const tr = useT();
  const { state, realNow } = useStore();
  const { act, error } = useAct();
  const now = simNowMs(state, realNow);
  const nowMin = minuteOfDay(now);
  const serving = inService(state.queue, dept.code);
  const waiting = waitingQueue(state.queue, dept.code);
  const avgWait = waiting.length ? Math.round(waiting.reduce((s, x) => s + (now - x.registeredAtMs), 0) / waiting.length / 60_000) : 0;
  const crowd = crowdLevel(waiting.length, dept.seats);

  return (
    <section aria-label={tr(`dept.${dept.code}`)} className="flex flex-col gap-3 rounded-2xl border-2 border-line bg-card p-4">
      <h2 className="text-xl font-bold">{tr(`dept.${dept.code}`)}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex items-center gap-1 rounded-full border-2 px-3 py-1 font-semibold ${CROWD_STYLE[crowd]}`}>
          <Icon name={CROWD_ICON[crowd]} className="size-5" />
          {tr(`staff.crowd.${crowd}`)}
        </span>
        <span className="text-base">{tr('staff.crowd.detail', { n: waiting.length, seats: dept.seats })}</span>
      </div>
      <p className="m-0">
        {tr('staff.waiting', { n: waiting.length })} · {tr('staff.avgWait', { m: avgWait })}
      </p>
      {dept.rooms.map((room) => (
        <RoomRow key={room} dept={dept} room={room} here={serving.find((x) => x.room === room)} nowMin={nowMin} act={act} />
      ))}
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {tr('staff.error', { error })}
        </p>
      )}
      <details className="border-t-2 border-line pt-2">
        <summary className="min-h-14 cursor-pointer content-center font-semibold">
          {tr('staff.waitingList')} ({waiting.length})
        </summary>
        {waiting.length === 0 ? (
          <p>{tr('staff.noneWaiting')}</p>
        ) : (
          <ol className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {waiting.map((x) => (
              <WaitingRow key={x.token} ticket={x} state={state} act={act} />
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}

export function DemoControls() {
  const tr = useT();
  const { state, dispatch } = useStore();
  const [confirming, setConfirming] = useState(false);
  const fast = state.clock.speed > 1;
  return (
    <section aria-labelledby="demo-title" className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-line bg-card p-4">
      <h2 id="demo-title" className="text-xl font-bold">
        {tr('staff.demo.title')}
      </h2>
      <Button icon="register" onClick={() => dispatch({ type: 'addDemoPatients' })}>
        {tr('staff.demo.add')}
      </Button>
      <Button icon="next" pressed={fast} onClick={() => dispatch({ type: 'setSpeed', speed: fast ? 1 : 10 })}>
        {fast ? tr('staff.demo.normal') : tr('staff.demo.fast')}
      </Button>
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-danger p-3">
          <p className="m-0 font-semibold">{tr('staff.demo.resetConfirm')}</p>
          <Button
            icon="alert"
            tone="danger"
            onClick={() => {
              dispatch({ type: 'reset' });
              setConfirming(false);
            }}
          >
            {tr('staff.demo.reset')}
          </Button>
          <Button icon="cross" onClick={() => setConfirming(false)}>
            {tr('common.cancel')}
          </Button>
        </div>
      ) : (
        <Button icon="alert" onClick={() => setConfirming(true)}>
          {tr('staff.demo.reset')}
        </Button>
      )}
    </section>
  );
}

/** Staff dashboard at /staff (S5). Urgent flags pinned first, then every department. */
export function Dashboard() {
  const tr = useT();
  const { state, realNow } = useStore();
  const nowMin = minuteOfDay(simNowMs(state, realNow));

  return (
    <div className="min-h-dvh bg-page p-4 text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{tr('staff.title')}</h1>
          <p className="m-0 font-mono text-lg">{tr('staff.clock', { time: hhmm(nowMin), n: state.clock.speed })}</p>
          <p className="m-0 flex items-center gap-2 rounded-xl bg-soft p-3 text-base">
            <Icon name="alert" className="size-6" />
            {tr('staff.loginNote')}
          </p>
          <nav className="flex flex-wrap gap-x-4">
            <Link to="/staff/counter" className="flex min-h-14 items-center gap-2 font-semibold text-brand underline">
              <Icon name="register" />
              {tr('staff.links.counter')}
            </Link>
            <Link to="/board" target="_blank" className="flex min-h-14 items-center gap-2 font-semibold text-brand underline">
              <Icon name="slip" />
              {tr('staff.links.board')}
            </Link>
            <Link to="/" target="_blank" className="flex min-h-14 items-center gap-2 font-semibold text-brand underline">
              <Icon name="home" />
              {tr('staff.links.patient')}
            </Link>
          </nav>
        </header>

        <UrgentFlags />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <DeptCard key={d.code} dept={d} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DemoControls />
          <div className="rounded-2xl border-2 border-line bg-card p-4">
            <OutOfServicePanel />
          </div>
          <CalibrationCard />
        </div>
        <p className="text-base text-muted">{tr('common.demoMode')}</p>
      </div>
    </div>
  );
}
