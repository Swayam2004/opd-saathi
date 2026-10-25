import type { MessageKey } from '../i18n/t';
import { useT } from '../shell/useT';

type TermKey = Extract<MessageKey, `term.${string}.gloss`> extends `term.${infer K}.gloss` ? K : never;

/** A term with its one-line explanation, for the first place it appears (the brief). */
export function Term({ k }: { k: TermKey }) {
  const tr = useT();
  return (
    <p className="text-base text-muted">
      <strong className="text-ink">{tr(`term.${k}`)}</strong>: {tr(`term.${k}.gloss`)}
    </p>
  );
}
