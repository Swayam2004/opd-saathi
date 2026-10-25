import { useState } from 'react';
import { Button } from '../components/controls';
import { useUrgentSender, type UrgentResult } from './urgent';
import { useT } from './useT';

type State = 'idle' | 'sending' | UrgentResult;

/**
 * "I need urgent help". No token, no questions, no confirmation step. The reply
 * never promises a time or an outcome (docs/research/07 section 4.2).
 */
export function UrgentHelp({ token }: { token?: string } = {}) {
  const tr = useT();
  const sender = useUrgentSender();
  const [state, setState] = useState<State>('idle');

  const raise = (): void => {
    setState('sending');
    sender.raise(token).then(setState, () => setState('queued'));
  };

  return (
    <div className="flex flex-col gap-3">
      <Button icon="bell" tone="danger" onClick={raise} disabled={state === 'sending'}>
        {tr('emergency.urgentHelp')}
      </Button>
      <div role="status" aria-live="assertive">
        {state === 'sending' && <p>{tr('emergency.urgentSending')}</p>}
        {state === 'sent' && <p className="rounded-xl border-2 border-brand bg-soft p-3 font-semibold">{tr('emergency.urgentSent')}</p>}
        {state === 'queued' && (
          <p className="rounded-xl border-2 border-danger bg-card p-3 font-semibold">{tr('emergency.urgentQueued')}</p>
        )}
      </div>
    </div>
  );
}
