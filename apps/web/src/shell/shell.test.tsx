import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { t } from '../i18n/t';
import { DEFAULT_PREFS, loadPrefs, PrefsProvider, type Prefs } from './prefs';
import { LocalStoreProvider } from '../store/localStore';
import { notConnected, UrgentProvider, type UrgentSender } from './urgent';

const chosen: Prefs = { ...DEFAULT_PREFS, langChosen: true };

function renderAt(path: string, opts: { prefs?: Prefs; sender?: UrgentSender } = {}) {
  const tree = (
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
  return render(
    <PrefsProvider {...(opts.prefs ? { initial: opts.prefs } : {})}>
      <LocalStoreProvider tickMs={60_000}>
        {opts.sender ? <UrgentProvider sender={opts.sender}>{tree}</UrgentProvider> : tree}
      </LocalStoreProvider>
    </PrefsProvider>,
  );
}

const emergencyLink = () => screen.getAllByRole('link', { name: /Emergency|इमरजेंसी/ })[0];

describe('Emergency button', () => {
  it.each(['/', '/settings', '/register', '/token', '/find', '/emergency', '/no-such-page'])(
    'is the first link on %s',
    (path) => {
      renderAt(path, { prefs: chosen });
      const first = screen.getAllByRole('link')[0];
      expect(first?.textContent).toBe('Emergency');
      expect(first?.getAttribute('href')).toBe('/emergency');
    },
  );

  it('shows above the first-visit language question', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: /Choose your language/ })).toBeTruthy();
    expect(emergencyLink()?.getAttribute('href')).toBe('/emergency');
  });

  it('opens the Emergency screen before any language is chosen', () => {
    renderAt('/');
    fireEvent.click(emergencyLink()!);
    expect(screen.getByRole('heading', { name: 'Emergency', level: 1 })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Choose your language/ })).toBeNull();
  });
});

describe('first visit', () => {
  it('asks in both scripts, then remembers the answer', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(screen.getByRole('heading', { name: t('hi', 'home.welcome') })).toBeTruthy();
    expect(emergencyLink()?.textContent).toBe('इमरजेंसी');
    expect(loadPrefs()).toMatchObject({ lang: 'hi', langChosen: true });
  });
});

describe('home', () => {
  it('has four big actions with a word each', () => {
    renderAt('/', { prefs: chosen });
    for (const name of [/^Register/, /^I have my slip/, /^Find a place/]) {
      expect(screen.getByRole('link', { name })).toBeTruthy();
    }
    expect(screen.getAllByRole('link', { name: /^Emergency/ })).toHaveLength(2);
  });
});

describe('Emergency screen', () => {
  it('shows 112, 108, the nine signs and no wait time', () => {
    renderAt('/emergency', { prefs: chosen });
    expect(screen.getByRole('link', { name: /112/ }).getAttribute('href')).toBe('tel:112');
    expect(screen.getByRole('link', { name: /108/ }).getAttribute('href')).toBe('tel:108');
    const signs = screen.getByRole('heading', { name: /Any of these/ }).nextElementSibling;
    expect(signs?.querySelectorAll('li')).toHaveLength(9);
    expect(document.body.textContent).not.toMatch(/minute|मिनट/i);
  });

  it('gives the way from the main entrance in the chosen language', () => {
    renderAt('/emergency', { prefs: { ...chosen, lang: 'hi' } });
    const steps = screen.getByText(t('hi', 'emergency.fromEntrance')).nextElementSibling;
    expect(steps?.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(steps?.textContent).toMatch(/[ऀ-ॿ]/);
  });
});

describe('I need urgent help', () => {
  it('says staff have not been told while nothing is connected', async () => {
    renderAt('/emergency', { prefs: chosen, sender: notConnected });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /I need urgent help/ }));
    });
    expect(screen.getByRole('status').textContent).toBe(t('en', 'emergency.urgentQueued'));
  });

  it('says staff are being told once the sender confirms', async () => {
    let calls = 0;
    const sender: UrgentSender = {
      raise: () => {
        calls += 1;
        return Promise.resolve('sent');
      },
    };
    renderAt('/emergency', { prefs: chosen, sender });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /I need urgent help/ }));
    });
    expect(calls).toBe(1);
    expect(screen.getByRole('status').textContent).toBe(t('en', 'emergency.urgentSent'));
  });

  it('does not claim staff were told when sending fails', async () => {
    renderAt('/emergency', { prefs: chosen, sender: { raise: () => Promise.reject(new Error('down')) } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /I need urgent help/ }));
    });
    expect(screen.getByRole('status').textContent).toBe(t('en', 'emergency.urgentQueued'));
  });
});

describe('settings', () => {
  it('assisted mode turns on largest text, read aloud and avoid stairs', () => {
    renderAt('/settings', { prefs: chosen });
    fireEvent.click(screen.getByRole('switch', { name: /Someone is helping me/ }));
    expect(loadPrefs()).toMatchObject({ assisted: true, textSize: 'largest', readAloud: true, avoidStairs: true });
    expect(document.documentElement.dataset.text).toBe('largest');
    expect(screen.getByRole('switch', { name: /Avoid stairs/ }).getAttribute('aria-checked')).toBe('true');
  });

  it('switches every label to Hindi', () => {
    renderAt('/settings', { prefs: chosen });
    fireEvent.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(screen.getByRole('heading', { name: t('hi', 'settings.title') })).toBeTruthy();
    expect(document.documentElement.lang).toBe('hi');
  });

  it('ignores broken saved settings', () => {
    localStorage.setItem('opd-saathi.prefs.v1', '{"lang":"fr","textSize":"huge","contrast":"yes"}');
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    localStorage.setItem('opd-saathi.prefs.v1', 'not json');
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });
});
