import { useT } from '../shell/useT';

export const SIGNS = ['chest', 'breathing', 'bleeding', 'faint', 'stroke', 'injury', 'fits', 'pregnancy', 'child'] as const;

/** The nine signs, the "not complete" line and the "staff decide" note (docs/research/07 section 4). */
export function EmergencySigns({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const tr = useT();
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section aria-labelledby="signs-title" className="flex flex-col gap-2">
      <Heading id="signs-title" className="text-xl font-bold">
        {tr('emergency.signsIntro')}
      </Heading>
      <ul className="flex list-disc flex-col gap-2 pl-7">
        {SIGNS.map((s) => (
          <li key={s}>{tr(`emergency.sign.${s}`)}</li>
        ))}
      </ul>
      <p className="font-semibold">{tr('emergency.incomplete')}</p>
      <p className="text-base text-muted">{tr('emergency.notTriage')}</p>
    </section>
  );
}
