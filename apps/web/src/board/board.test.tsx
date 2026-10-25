import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n/t';
import { apply, initialState, type Command, type HospitalState } from '../store/hospital';
import { renderApp } from '../test-utils';
import { ALTERNATE_MS } from './Board';

const KEY = 'opd-saathi.hospital.v1';

function seed(...cmds: Command[]): HospitalState {
  let s = initialState(Date.now());
  for (const c of cmds) s = apply(s, c, Date.now()).state;
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

const spoken: { text: string; lang: string }[] = [];

beforeEach(() => {
  spoken.length = 0;
  class Utterance {
    lang = '';
    voice: unknown = null;
    constructor(public text: string) {}
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  vi.stubGlobal('speechSynthesis', {
    speak: (u: Utterance) => spoken.push({ text: u.text, lang: u.lang }),
    cancel: () => undefined,
    getVoices: () => [],
    speaking: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('waiting-room board', () => {
  it('shows each room with the token being served, the next three, and delays', () => {
    seed(
      { type: 'addDemoPatients' },
      { type: 'setDoctor', room: 'room7', status: { kind: 'late', byMin: 20 } },
    );
    renderApp('/board');
    const med = screen.getByRole('region', { name: 'General Medicine' });
    expect(med.textContent).toContain('MED-001');
    expect(med.textContent).toContain('MED-002');
    expect(med.textContent).toContain('MED-003  MED-004  MED-005');
    expect(screen.getByRole('region', { name: 'Eyes' }).textContent).toContain('Running 20 minutes late');
    expect(screen.getByText(t('en', 'board.emergency'))).toBeTruthy();
  });

  it('alternates English and Hindi', () => {
    vi.useFakeTimers();
    seed();
    renderApp('/board');
    expect(screen.getByRole('region', { name: 'Children' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(ALTERNATE_MS);
    });
    expect(screen.getByRole('region', { name: t('hi', 'dept.CHI') })).toBeTruthy();
  });

  it('reads each new call aloud in both languages once sound is on', async () => {
    let s = seed({ type: 'register', reg: { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' } }, { type: 'complete', token: 'MED-001' });
    renderApp('/board');
    fireEvent.click(screen.getByRole('button', { name: /Enable sound/ }));

    s = apply(s, { type: 'callNext', dept: 'MED', room: 'room1' }, Date.now()).state;
    localStorage.setItem(KEY, JSON.stringify(s));
    const other = new BroadcastChannel('opd-saathi');
    await act(async () => {
      other.postMessage('changed');
    });
    await waitFor(() => expect(spoken).toHaveLength(2));
    other.close();
    expect(spoken).toEqual([
      { text: 'Token MED-003, please go to Room 1.', lang: 'en-IN' },
      { text: t('hi', 'board.announce', { token: 'MED-003', room: 'कमरा 1' }), lang: 'hi-IN' },
    ]);
  });

  it('does not read out calls made before the board opened', () => {
    seed({ type: 'register', reg: { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' } }, { type: 'complete', token: 'MED-001' }, { type: 'callNext', dept: 'MED', room: 'room1' });
    renderApp('/board');
    fireEvent.click(screen.getByRole('button', { name: /Enable sound/ }));
    expect(spoken).toHaveLength(0);
  });
});
