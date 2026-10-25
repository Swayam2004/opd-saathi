import { BigLink } from '../components/controls';
import { ListenButton } from '../components/ListenButton';
import { Term } from '../components/Term';
import { useReadAloud } from './speech';
import { useT } from './useT';

export function Home() {
  const tr = useT();
  const spoken = `${tr('home.welcome')}. ${tr('home.question')}`;
  useReadAloud(spoken);

  return (
    <section aria-labelledby="home-title" className="flex flex-col gap-4">
      <div>
        <h1 id="home-title" className="text-2xl font-bold">
          {tr('home.welcome')}
        </h1>
        <p className="text-lg">{tr('home.question')}</p>
      </div>

      <BigLink to="/register" icon="register" label={tr('home.register')} hint={tr('home.register.hint')} tone="brand" />
      <BigLink to="/token" icon="slip" label={tr('home.haveSlip')} hint={tr('home.haveSlip.hint')} />
      <BigLink to="/find" icon="find" label={tr('home.find')} hint={tr('home.find.hint')} />
      <BigLink to="/emergency" icon="alert" label={tr('emergency.button')} hint={tr('term.emergency.gloss')} tone="danger" />

      <ListenButton text={spoken} />
      <Term k="opd" />
      <p className="text-base text-muted">{tr('common.madeUp')}</p>
    </section>
  );
}
