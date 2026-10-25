import type { MessageKey } from '../i18n/t';
import { useT } from './useT';

/** Stands in for a screen another ticket builds, so links and the shell work now. */
export function Placeholder({ title }: { title: Extract<MessageKey, `${string}.title`> }) {
  const tr = useT();
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{tr(title)}</h1>
      <p>{tr('common.soon')}</p>
    </section>
  );
}
