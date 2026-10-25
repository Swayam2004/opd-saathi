import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '../components/Icon';
import { Term } from '../components/Term';
import { useReadAloud } from '../shell/speech';
import { useT } from '../shell/useT';
import { useStore } from '../store/localStore';
import { resolveTicket } from '../store/selectors';

/** "I have my slip": type the token. QR scanning is stretch (scope.md). */
export function TokenEntry() {
  const tr = useT();
  const navigate = useNavigate();
  const { state } = useStore();
  const [value, setValue] = useState('');
  const [missing, setMissing] = useState<string | undefined>();
  useReadAloud(tr('turn.entry.q'));

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const typed = value.trim().toUpperCase().replace(/\s+/g, '');
    // Accept "med42" as well as "MED-042".
    const m = /^([A-Z]{3})-?(\d{1,3})$/.exec(typed);
    const token = m ? `${m[1]}-${m[2]?.padStart(3, '0')}` : typed;
    const ticket = resolveTicket(state, token);
    if (ticket) navigate(`/turn/${ticket.token}`);
    else setMissing(typed || '—');
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{tr('turn.entry.title')}</h1>
      <label htmlFor="token-input" className="text-xl">
        {tr('turn.entry.q')}
      </label>
      <input
        id="token-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={10}
        className="min-h-14 w-full rounded-2xl border-2 border-line bg-card px-4 font-mono text-3xl text-ink uppercase"
      />
      <p className="text-base text-muted">{tr('turn.entry.example')}</p>
      {missing && (
        <p role="alert" className="flex items-center gap-2 font-semibold text-danger">
          <Icon name="alert" className="size-6" />
          {tr('turn.entry.notFound', { token: missing })}
        </p>
      )}
      <button
        type="submit"
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-brand px-4 text-xl font-semibold text-brand-ink"
      >
        <Icon name="bell" />
        {tr('turn.entry.go')}
      </button>
      <Term k="token" />
    </form>
  );
}
