import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './App';
import { DEFAULT_PREFS, PrefsProvider, type Prefs } from './shell/prefs';
import { LocalStoreProvider } from './store/localStore';

/** The whole app at `path`, with the local store, as a returning visitor. StrictMode as in main.tsx. */
export function renderApp(path: string, prefs: Partial<Prefs> = {}) {
  return render(
    <StrictMode>
      <PrefsProvider initial={{ ...DEFAULT_PREFS, langChosen: true, ...prefs }}>
        <LocalStoreProvider tickMs={60_000}>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </LocalStoreProvider>
      </PrefsProvider>
    </StrictMode>,
  );
}
