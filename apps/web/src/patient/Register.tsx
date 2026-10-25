import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, Navigate, Outlet, useNavigate } from 'react-router';
import { departments } from '@shared/data/departments.ts';
import type { Gender } from '@shared/data/patients.ts';
import { BigLink, Button, Toggle } from '../components/controls';
import { EmergencySigns } from '../components/EmergencySigns';
import { Icon } from '../components/Icon';
import { RouteSteps } from '../components/RouteSteps';
import { Term } from '../components/Term';
import { usePrefs } from '../shell/prefs';
import { useReadAloud } from '../shell/speech';
import { useT } from '../shell/useT';
import { DraftProvider, useDraft, validAge, validMobile, validName, type Draft } from './draft';
import { useRegistrar, type RegisterResult } from './registrar';

const STEPS = ['name', 'age', 'gender', 'mobile', 'dept'] as const;
type Step = (typeof STEPS)[number];

const nextPath = (step: Step): string => {
  const i = STEPS.indexOf(step);
  return `/register/${STEPS[i + 1] ?? 'check'}`;
};

/** First step whose answer is missing or invalid, if any. */
function firstGap(d: Draft): Step | undefined {
  if (!validName(d.name)) return 'name';
  if (!validAge(d.age)) return 'age';
  if (!d.gender) return 'gender';
  if (!validMobile(d.mobile)) return 'mobile';
  if (!d.dept) return 'dept';
  return undefined;
}

export function RegisterLayout() {
  return (
    <DraftProvider>
      <Outlet />
    </DraftProvider>
  );
}

function HelperSwitch() {
  const tr = useT();
  const { prefs, setAssisted } = usePrefs();
  return (
    <Toggle
      label={tr('register.helper')}
      hint={tr('term.assistedMode.gloss')}
      checked={prefs.assisted}
      onChange={setAssisted}
      onWord={tr('settings.on')}
      offWord={tr('settings.off')}
    />
  );
}

/** Screen 0: the emergency signs come before any question (the brief). */
export function RegisterSigns() {
  const tr = useT();
  useReadAloud(`${tr('register.signsTitle')}. ${tr('emergency.signsIntro')}`);
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{tr('register.signsTitle')}</h1>
      <div className="rounded-2xl border-2 border-danger bg-card p-4">
        <EmergencySigns />
      </div>
      <BigLink to="/emergency" icon="alert" label={tr('emergency.button')} hint={tr('emergency.noToken')} tone="danger" />
      <BigLink to="/register/name" icon="next" label={tr('register.signsNone')} tone="brand" />
      <HelperSwitch />
      <Term k="registration" />
      <p className="text-base text-muted">{tr('register.noIds')}</p>
    </section>
  );
}

function Question({
  step,
  title,
  hint,
  error,
  onNext,
  children,
  nextLabel,
}: {
  step: Step;
  title: string;
  hint?: string;
  error?: string | undefined;
  onNext?: () => void;
  children: ReactNode;
  nextLabel?: string;
}) {
  const tr = useT();
  const { assisted } = usePrefs().prefs;
  const n = STEPS.indexOf(step) + 1;
  useReadAloud(hint ? `${title} ${hint}` : title);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    onNext?.();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div>
        <p className="font-semibold text-muted">{tr('common.stepOf', { step: n, total: STEPS.length })}</p>
        <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-line" aria-hidden="true">
          <div className="h-full bg-brand" style={{ width: `${(n / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <h1 id={`q-${step}`} className="text-2xl font-bold">
        {title}
      </h1>
      {hint && <p>{hint}</p>}
      {assisted && <p className="rounded-xl bg-soft p-3">{tr('register.helperFill')}</p>}
      {children}
      {error && (
        <p role="alert" className="flex items-center gap-2 font-semibold text-danger">
          <Icon name="alert" className="size-6" />
          {error}
        </p>
      )}
      {onNext && (
        <button
          type="submit"
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-brand px-4 text-xl font-semibold text-brand-ink"
        >
          {nextLabel ?? tr('common.next')}
          <Icon name="next" />
        </button>
      )}
    </form>
  );
}

const INPUT = 'min-h-14 w-full rounded-2xl border-2 border-line bg-card px-4 text-2xl text-ink';

function TextStep({
  step,
  field,
  valid,
  errorKey,
  inputProps,
}: {
  step: 'name' | 'age';
  field: 'name' | 'age';
  valid: (s: string) => boolean;
  errorKey: 'register.error.name' | 'register.error.age';
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}) {
  const tr = useT();
  const navigate = useNavigate();
  const { draft, set } = useDraft();
  const [showError, setShowError] = useState(false);
  const title = tr(step === 'name' ? 'register.name.q' : 'register.age.q');
  const hint = step === 'name' ? tr('register.name.hint') : undefined;

  return (
    <Question
      step={step}
      title={title}
      {...(hint ? { hint } : {})}
      error={showError && !valid(draft[field]) ? tr(errorKey) : undefined}
      onNext={() => (valid(draft[field]) ? navigate(nextPath(step)) : setShowError(true))}
    >
      <div className="flex items-center gap-3">
        <input
          aria-labelledby={`q-${step}`}
          value={draft[field]}
          onChange={(e) => set({ [field]: e.target.value })}
          className={INPUT}
          autoFocus
          {...inputProps}
        />
        {step === 'age' && <span className="text-xl">{tr('register.age.unit')}</span>}
      </div>
    </Question>
  );
}

export function NameStep() {
  return (
    <TextStep
      step="name"
      field="name"
      valid={validName}
      errorKey="register.error.name"
      inputProps={{ autoComplete: 'given-name', maxLength: 40 }}
    />
  );
}

export function AgeStep() {
  return (
    <TextStep
      step="age"
      field="age"
      valid={validAge}
      errorKey="register.error.age"
      inputProps={{ inputMode: 'numeric', maxLength: 3, autoComplete: 'off' }}
    />
  );
}

/** A tap answers and moves on. The chosen card shows a tick, not only a colour. */
function Choice({ chosen, icon, label, hint, onClick }: { chosen: boolean; icon?: Parameters<typeof Icon>[0]['name']; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left ${
        chosen ? 'border-brand bg-soft' : 'border-line bg-card'
      } text-ink`}
    >
      {icon && <Icon name={icon} className="size-10" />}
      <span className="flex flex-1 flex-col">
        <span className="text-xl font-semibold">{label}</span>
        {hint && <span className="text-base text-muted">{hint}</span>}
      </span>
      {chosen && <Icon name="check" />}
    </button>
  );
}

export function GenderStep() {
  const tr = useT();
  const navigate = useNavigate();
  const { draft, set } = useDraft();
  const options: Gender[] = ['woman', 'man', 'other', 'unsaid'];
  const label = (g: Gender) => tr(g === 'unsaid' ? 'register.gender.skip' : `register.gender.${g}`);
  return (
    <Question step="gender" title={tr('register.gender.q')}>
      <div className="flex flex-col gap-3">
        {options.map((g) => (
          <Choice
            key={g}
            chosen={draft.gender === g}
            label={label(g)}
            onClick={() => {
              set({ gender: g });
              navigate(nextPath('gender'));
            }}
          />
        ))}
      </div>
    </Question>
  );
}

export function MobileStep() {
  const tr = useT();
  const navigate = useNavigate();
  const { draft, set } = useDraft();
  const [showError, setShowError] = useState(false);
  return (
    <Question
      step="mobile"
      title={tr('register.mobile.q')}
      hint={tr('register.mobile.hint')}
      error={showError && !validMobile(draft.mobile) ? tr('register.error.mobile') : undefined}
      onNext={() => (validMobile(draft.mobile) ? navigate(nextPath('mobile')) : setShowError(true))}
    >
      <input
        aria-labelledby="q-mobile"
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        maxLength={12}
        value={draft.mobile}
        onChange={(e) => set({ mobile: e.target.value })}
        className={INPUT}
      />
      <Button
        icon="next"
        onClick={() => {
          set({ mobile: '' });
          navigate(nextPath('mobile'));
        }}
      >
        {tr('register.mobile.skip')}
      </Button>
    </Question>
  );
}

export function DeptStep() {
  const tr = useT();
  const navigate = useNavigate();
  const { draft, set } = useDraft();
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <Question step="dept" title={tr('register.dept.q')}>
      <div className="flex flex-col gap-3">
        {departments.map((d) => (
          <Choice
            key={d.code}
            chosen={draft.dept === d.code}
            icon={d.code}
            label={tr(`dept.${d.code}`)}
            hint={tr(`dept.${d.code}.hint`)}
            onClick={() => {
              set({ dept: d.code });
              navigate('/register/check');
            }}
          />
        ))}
      </div>
      <Button icon="help" onClick={() => setHelpOpen((o) => !o)} pressed={helpOpen}>
        {tr('register.notSure')}
      </Button>
      {helpOpen && <RouteSteps from="entrance" to="helpdesk" intro={tr('register.helpDeskWay')} />}
    </Question>
  );
}

function Row({ label, value, step }: { label: string; value: string; step: Step }) {
  const tr = useT();
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-line py-2">
      <dl className="m-0">
        <dt className="text-base text-muted">{label}</dt>
        <dd className="m-0 text-xl font-semibold">{value}</dd>
      </dl>
      <Link to={`/register/${step}`} className="flex min-h-14 shrink-0 items-center rounded-xl px-2 font-semibold text-brand underline">
        {tr('common.change')}
      </Link>
    </div>
  );
}

export function CheckStep() {
  const tr = useT();
  const navigate = useNavigate();
  const registrar = useRegistrar();
  const { draft, clear } = useDraft();
  const [state, setState] = useState<'idle' | 'sending' | 'done' | Extract<RegisterResult, { ok: false }>['reason']>('idle');
  useReadAloud(tr('register.check'));

  // Navigation is a transition, so the cleared draft can render first. Show nothing, don't redirect.
  if (state === 'done') return null;
  const gap = firstGap(draft);
  if (gap) return <Navigate to={`/register/${gap}`} replace />;
  const { gender, dept } = draft as Required<Draft>;

  const submit = (): void => {
    setState('sending');
    const mobile = draft.mobile.replace(/\s/g, '');
    registrar
      .register({
        firstName: draft.name.trim(),
        age: Number(draft.age),
        gender,
        dept,
        ...(mobile ? { mobile } : {}),
      })
      .then(
        (r) => {
          if (r.ok) {
            setState('done');
            clear();
            navigate(`/slip/${r.token}`, { replace: true });
          } else setState(r.reason);
        },
        () => setState('offline'),
      );
  };

  const genderLabel = tr(gender === 'unsaid' ? 'register.gender.skip' : `register.gender.${gender}`);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{tr('register.check')}</h1>
      <div>
        <Row label={tr('slip.name')} value={draft.name.trim()} step="name" />
        <Row label={tr('register.age.q')} value={`${draft.age} ${tr('register.age.unit')}`} step="age" />
        <Row label={tr('register.gender.q')} value={genderLabel} step="gender" />
        <Row label={tr('register.mobile.q')} value={draft.mobile.trim() || '—'} step="mobile" />
        <Row label={tr('slip.dept')} value={tr(`dept.${dept}`)} step="dept" />
      </div>
      {state === 'offline' && (
        <p role="alert" className="rounded-xl border-2 border-danger bg-card p-3 font-semibold">
          {tr('register.offline')}
        </p>
      )}
      {state === 'closed' && (
        <p role="alert" className="rounded-xl border-2 border-danger bg-card p-3 font-semibold">
          {tr('register.closed')}
        </p>
      )}
      <Button icon="slip" tone="brand" onClick={submit} disabled={state === 'sending'}>
        {state === 'sending' ? tr('register.sending') : state === 'idle' ? tr('register.submit') : tr('register.retry')}
      </Button>
    </section>
  );
}
