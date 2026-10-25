import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from './Icon';

type Tone = 'brand' | 'danger' | 'plain';

const TONES: Record<Tone, string> = {
  brand: 'bg-brand text-brand-ink border-brand',
  danger: 'bg-danger text-danger-ink border-danger',
  plain: 'bg-card text-ink border-line',
};

const BASE =
  'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold leading-snug';

/** A big navigation button: icon, word, and an optional plain-words hint. */
export function BigLink({
  to,
  icon,
  label,
  hint,
  tone = 'plain',
}: {
  to: string;
  icon: IconName;
  label: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Link to={to} className={`${BASE} ${TONES[tone]} text-xl`}>
      <Icon name={icon} className="size-9" />
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && <span className="text-base font-normal opacity-90">{hint}</span>}
      </span>
    </Link>
  );
}

export function Button({
  icon,
  children,
  onClick,
  tone = 'plain',
  pressed,
  disabled,
}: {
  icon?: IconName;
  children: ReactNode;
  onClick: () => void;
  tone?: Tone;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      className={`${BASE} ${TONES[tone]} disabled:opacity-60`}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}

/** On/off switch. State shows as a word and an icon, not by colour alone. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  onWord,
  offWord,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  onWord: string;
  offWord: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${BASE} justify-between ${checked ? 'border-brand bg-soft' : 'border-line bg-card'} text-ink`}
    >
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && <span className="text-base font-normal text-muted">{hint}</span>}
      </span>
      <span
        className={`flex shrink-0 items-center gap-1 rounded-full border-2 px-3 py-1 ${
          checked ? 'border-brand bg-brand text-brand-ink' : 'border-line text-ink'
        }`}
        aria-hidden="true"
      >
        <Icon name={checked ? 'check' : 'cross'} className="size-5" />
        {checked ? onWord : offWord}
      </span>
    </button>
  );
}
