import { useState } from 'react';
import { useParams } from 'react-router';
import type { WaitEstimate } from '@shared/queue/wait.ts';
import { BigLink, Button } from '../components/controls';
import { QrCode } from '../components/QrCode';
import { RouteSteps } from '../components/RouteSteps';
import { Term } from '../components/Term';
import { t, type Lang } from '../i18n/t';
import { usePrefs } from '../shell/prefs';
import { speak } from '../shell/speech';
import { useT } from '../shell/useT';
import { useStore } from '../store/localStore';
import { ticketView, type TicketView } from '../store/selectors';
import { floorName, floorOf, placeName } from './placeNames';

export function waitText(lang: Lang, w: WaitEstimate): string {
  return w.kind === 'minutes' ? t(lang, 'turn.wait', { m: w.minutes }) : t(lang, 'turn.waitUnknown');
}

/** Room and floor for the slip. Medicine has two rooms, so its room is only known once called. */
export function roomInfo(lang: Lang, v: TicketView): { room: string | undefined; floor: string } {
  const roomId = v.ticket.room ?? (v.dept.rooms.length === 1 ? v.dept.rooms[0] : undefined);
  const floor = floorOf(roomId ?? v.dept.rooms[0] ?? '') ?? 1;
  return { room: roomId ? placeName(lang, roomId) : undefined, floor: floorName(lang, floor) };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b-2 border-line py-2">
      <dt className="text-base text-muted">{label}</dt>
      <dd className="m-0 text-xl font-semibold">{value}</dd>
    </div>
  );
}

/** Big type for showing a member of staff: patient's language and English together. */
function LargeView({ v, onClose }: { v: TicketView; onClose: () => void }) {
  const { lang } = usePrefs().prefs;
  const langs: Lang[] = lang === 'en' ? ['en'] : [lang, 'en'];
  return (
    <div role="dialog" aria-modal="true" aria-label={t(lang, 'slip.showStaff')} className="fixed inset-0 z-30 overflow-auto bg-card p-4 text-ink">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <p className="text-center font-mono text-[min(4.5rem,17vw)] font-bold whitespace-nowrap">{v.ticket.token}</p>
        {langs.map((l) => {
          const { room, floor } = roomInfo(l, v);
          return (
            <div key={l} lang={l} className="rounded-2xl border-2 border-line p-3 text-2xl">
              <p className="font-bold">{t(l, 'slip.largeTitle')}</p>
              <p>{t(l, `dept.${v.dept.code}`)}</p>
              <p>{room ? `${room}, ${floor}` : `${floor}. ${t(l, 'slip.roomLater')}`}</p>
              <p>{v.patient?.name[l]}</p>
            </div>
          );
        })}
        <Button icon="cross" onClick={onClose}>
          {t(lang, 'common.close')}
        </Button>
      </div>
    </div>
  );
}

export function Slip() {
  const tr = useT();
  const { lang } = usePrefs().prefs;
  const { token = '' } = useParams();
  const { state, realNow } = useStore();
  const [large, setLarge] = useState(false);
  const v = ticketView(state, token, realNow);

  if (!v) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{tr('slip.title')}</h1>
        <p role="alert">{tr('turn.entry.notFound', { token })}</p>
        <BigLink to="/token" icon="slip" label={tr('turn.entry.title')} />
      </section>
    );
  }

  const { room, floor } = roomInfo(lang, v);
  const speech = tr('slip.speech', {
    token: v.ticket.token,
    dept: tr(`dept.${v.dept.code}`),
    room: room ?? tr('slip.roomLater'),
    floor,
  });
  const turnUrl = `${window.location.origin}/turn/${v.ticket.token}`;

  return (
    <section aria-labelledby="slip-title" className="flex flex-col gap-4">
      <h1 id="slip-title" className="text-2xl font-bold">
        {tr('slip.title')}
      </h1>

      <article className="rounded-2xl border-2 border-ink bg-card p-4">
        <p className="text-base text-muted">{tr('common.hospitalName')}</p>
        <p className="text-base text-muted">{tr('slip.token')}</p>
        <p className="font-mono text-[min(3rem,14vw)] font-bold whitespace-nowrap">{v.ticket.token}</p>
        <dl className="mt-2">
          <Field label={tr('slip.name')} value={v.patient?.name[lang] ?? '—'} />
          <Field label={tr('slip.dept')} value={tr(`dept.${v.dept.code}`)} />
          <Field label={tr('slip.room')} value={room ?? tr('slip.roomLater')} />
          <Field label={tr('slip.floor')} value={floor} />
          <Field label={tr('slip.doctor')} value={v.dept.doctor[lang]} />
          <Field label={tr('slip.ahead')} value={String(v.ahead)} />
          <Field label={tr('slip.wait')} value={waitText(lang, v.wait)} />
        </dl>
        <div className="mt-3 flex flex-col items-center gap-1">
          <QrCode value={turnUrl} label={tr('slip.qr')} />
          <p className="text-base">{tr('slip.qr')}</p>
        </div>
        {/* D10: the way from the entrance, printed with the slip. Medicine's room is set at call
            time, so its route goes to the waiting hall. */}
        <div className="mt-3 border-t-2 border-line pt-3">
          <RouteSteps
            from="entrance"
            to={v.ticket.room ?? (v.dept.rooms.length === 1 ? (v.dept.rooms[0] ?? 'hall_a') : 'hall_a')}
            intro={tr('slip.route')}
            listen={false}
          />
        </div>
        <p className="mt-2 text-base">{tr('slip.keep')}</p>
      </article>

      <div className="flex flex-col gap-3 print:hidden">
        <BigLink to={`/turn/${v.ticket.token}`} icon="bell" label={tr('slip.myTurn')} tone="brand" />
        <BigLink to={`/find?to=${v.ticket.room ?? v.dept.rooms[0] ?? ''}`} icon="find" label={tr('slip.findRoom')} />
        <Button icon="speaker" onClick={() => speak(speech, lang)}>
          {tr('slip.readAloud')}
        </Button>
        <Button icon="slip" onClick={() => setLarge(true)}>
          {tr('slip.showStaff')}
        </Button>
        <Button icon="register" onClick={() => window.print()}>
          {tr('common.print')}
        </Button>
        <Term k="token" />
        <Term k="estimatedWait" />
      </div>

      {large && <LargeView v={v} onClose={() => setLarge(false)} />}
    </section>
  );
}
