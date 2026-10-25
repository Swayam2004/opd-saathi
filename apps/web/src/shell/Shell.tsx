import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Icon } from '../components/Icon';
import { useOptionalStore } from '../store/localStore';
import { LanguagePicker } from './LanguagePicker';
import { usePrefs } from './prefs';
import { useT } from './useT';

/**
 * Every patient screen sits inside this. The Emergency bar is first in the page
 * and stays on screen, and the first-visit language question never blocks it
 * (AGENTS.md rule 1).
 */
export function Shell() {
  const tr = useT();
  const { prefs } = usePrefs();
  const { pathname, key } = useLocation();
  const navigate = useNavigate();
  const localStore = useOptionalStore();
  const onEmergency = pathname === '/emergency';
  const showPicker = !prefs.langChosen && !onEmergency;

  return (
    <div className="min-h-dvh bg-page text-ink">
      <header className="sticky top-0 z-20 print:hidden bg-page/95 px-4 pt-2 pb-2 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-xl">
          <NavLink
            to="/emergency"
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-danger bg-danger px-4 text-xl font-bold text-danger-ink"
          >
            <Icon name="alert" className="size-8" />
            {tr('emergency.button')}
          </NavLink>
        </div>
      </header>

      {!showPicker && (
        <nav className="mx-auto flex max-w-xl print:hidden items-center justify-between gap-2 px-4 pt-3">
          {pathname === '/' ? (
            <span className="text-lg font-bold text-brand">{tr('common.appName')}</span>
          ) : (
            <button
              type="button"
              onClick={() => (key === 'default' ? navigate('/') : navigate(-1))}
              className="flex min-h-14 items-center gap-2 rounded-xl px-2 font-semibold"
            >
              <Icon name="back" />
              {tr('common.back')}
            </button>
          )}
          {pathname !== '/settings' && (
            <Link to="/settings" className="flex min-h-14 items-center gap-2 rounded-xl px-2 font-semibold">
              <Icon name="settings" />
              {tr('common.settings')}
            </Link>
          )}
        </nav>
      )}

      <main id="main" className="mx-auto max-w-xl px-4 pt-3 pb-16">
        {showPicker ? <LanguagePicker /> : <Outlet />}
        {localStore && <p className="mt-8 border-t-2 border-line pt-3 text-base text-muted print:hidden">{tr('common.demoMode')}</p>}
      </main>
    </div>
  );
}
