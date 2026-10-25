import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { t } from '../i18n/t';
import { DEFAULT_PREFS, loadPrefs, PrefsProvider } from '../shell/prefs';
import { LocalStoreProvider } from '../store/localStore';
import { notConnectedRegistrar, RegistrarProvider, type Registrar, type Registration } from './registrar';

/** Defaults to a registrar with nothing behind it, to test the honest failure. */
function renderAt(path: string, registrar: Registrar = notConnectedRegistrar) {
  return render(
    <PrefsProvider initial={{ ...DEFAULT_PREFS, langChosen: true }}>
      <LocalStoreProvider tickMs={60_000}>
        <RegistrarProvider registrar={registrar}>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </RegistrarProvider>
      </LocalStoreProvider>
    </PrefsProvider>,
  );
}

const heading = () => screen.getByRole('heading', { level: 1 }).textContent;
const next = () => fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
const type = (value: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value } });

function answerAll() {
  fireEvent.click(screen.getByRole('link', { name: /None of these/ }));
  type('Kamla');
  next();
  type('62');
  next();
  fireEvent.click(screen.getByRole('button', { name: 'Woman' }));
  fireEvent.click(screen.getByRole('button', { name: /^Skip/ }));
  fireEvent.click(screen.getByRole('button', { name: /^General Medicine/ }));
}

describe('register', () => {
  it('starts with the emergency signs, before any question', () => {
    renderAt('/register');
    expect(heading()).toBe(t('en', 'register.signsTitle'));
    expect(screen.getByText(t('en', 'emergency.sign.chest'))).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /^Emergency/ }).length).toBeGreaterThanOrEqual(2);
  });

  it('asks one question per screen with a step count', () => {
    renderAt('/register');
    fireEvent.click(screen.getByRole('link', { name: /None of these/ }));
    expect(screen.getByText('Step 1 of 5')).toBeTruthy();
    expect(heading()).toBe('What is your name?');
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('checks answers before moving on', () => {
    renderAt('/register/name');
    next();
    expect(screen.getByRole('alert').textContent).toContain(t('en', 'register.error.name'));
    type('Kamla');
    next();
    type('200');
    next();
    expect(screen.getByRole('alert').textContent).toContain(t('en', 'register.error.age'));
  });

  it('keeps every answer when going back', () => {
    renderAt('/register/name');
    type('Kamla');
    next();
    fireEvent.click(screen.getByRole('button', { name: /^Back/ }));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Kamla');
  });

  it('keeps answers after a reload', () => {
    const first = renderAt('/register/name');
    type('Kamla');
    first.unmount();
    renderAt('/register/name');
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Kamla');
  });

  it('shows departments as picture cards in plain words', () => {
    renderAt('/register/dept');
    expect(screen.getByRole('button', { name: /General Medicine.*fever, cough, BP, sugar/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /./ }).filter((b) => b.querySelector('svg')).length).toBeGreaterThanOrEqual(7);
  });

  it('shows the way to the Help desk for "Not sure?"', () => {
    renderAt('/register/dept');
    fireEvent.click(screen.getByRole('button', { name: /Not sure/ }));
    expect(screen.getByText(t('en', 'register.helpDeskWay'))).toBeTruthy();
  });

  it('sends the answers and opens the slip', async () => {
    const sent: Registration[] = [];
    const registrar: Registrar = {
      register: (r) => {
        sent.push(r);
        return Promise.resolve({ ok: true, token: 'MED-042' });
      },
    };
    renderAt('/register', registrar);
    answerAll();
    expect(heading()).toBe(t('en', 'register.check'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Get my OPD slip/ }));
    });
    expect(sent).toEqual([{ firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' }]);
    expect(heading()).toBe(t('en', 'slip.title'));
    expect(sessionStorage.getItem('opd-saathi.register.v1') ?? '').not.toContain('Kamla');
  });

  it('never invents a token when nothing is connected, and keeps the answers', async () => {
    renderAt('/register');
    answerAll();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Get my OPD slip/ }));
    });
    expect(screen.getByRole('alert').textContent).toBe(t('en', 'register.offline'));
    expect(heading()).toBe(t('en', 'register.check'));
    expect(screen.getByText('Kamla')).toBeTruthy();
  });

  it('sends a skipped question back to it from the check screen', () => {
    renderAt('/register/check');
    expect(heading()).toBe('What is your name?');
  });

  it('"Someone is helping me" turns on assisted mode', () => {
    renderAt('/register');
    fireEvent.click(screen.getByRole('switch', { name: /Someone is helping me/ }));
    expect(loadPrefs()).toMatchObject({ assisted: true, avoidStairs: true, readAloud: true });
  });
});
