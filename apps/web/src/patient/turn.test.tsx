import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/t';
import { apply, initialState, type Command, type HospitalState } from '../store/hospital';
import { renderApp } from '../test-utils';

const KEY = 'opd-saathi.hospital.v1';

/** Saves a hospital built from `cmds`, as another tab would. */
function seed(...cmds: Command[]): HospitalState {
  let s = initialState(Date.now());
  for (const c of cmds) s = apply(s, c, Date.now()).state;
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

const kamla = { type: 'register', reg: { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED', mobile: '9000000000' } } as const;

describe('I have my slip', () => {
  it('accepts a typed token in a loose form and opens My turn', () => {
    seed();
    renderApp('/token');
    fireEvent.change(screen.getByLabelText(t('en', 'turn.entry.q')), { target: { value: 'chi 1' } });
    fireEvent.click(screen.getByRole('button', { name: /Show my turn/ }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t('en', 'turn.title'));
    expect(screen.getAllByText('CHI-001').length).toBeGreaterThan(0);
  });

  it('says plainly when a token is not found', () => {
    seed();
    renderApp('/token');
    fireEvent.change(screen.getByLabelText(t('en', 'turn.entry.q')), { target: { value: 'ABC-123' } });
    fireEvent.click(screen.getByRole('button', { name: /Show my turn/ }));
    expect(screen.getByRole('alert').textContent).toContain('ABC-123');
  });
});

describe('My turn', () => {
  it('shows people ahead, the wait, now serving and doctor status', () => {
    seed(kamla, { type: 'setDoctor', room: 'room2', status: { kind: 'late', byMin: 15 } });
    renderApp('/turn/MED-003');
    expect(screen.getByText('2 people ahead of you')).toBeTruthy();
    expect(screen.getByText(/^About \d+ minutes$/)).toBeTruthy();
    expect(screen.getByText('MED-001, MED-002')).toBeTruthy();
    expect(screen.getByText('The doctor is running 15 minutes late')).toBeTruthy();
  });

  it('alerts at 3 ahead with a banner and a simulated SMS', () => {
    seed(kamla);
    renderApp('/turn/MED-003');
    expect(screen.getByRole('alert').textContent).toContain(t('en', 'turn.close'));
    // Medicine's room is set at call time, so the banner points to the waiting hall.
    expect(screen.getByRole('alert').textContent).toContain('Please go to Waiting hall A, the first floor.');
    expect(screen.getByText(t('en', 'turn.smsLabel'))).toBeTruthy();
  });

  it('does not alert while more than 3 are ahead', () => {
    seed({ type: 'addDemoPatients' }, kamla);
    renderApp('/turn/MED-010');
    expect(screen.queryByText(t('en', 'turn.close'))).toBeNull();
  });

  it('switches to the called view with the room and the way there', () => {
    seed(kamla, { type: 'complete', token: 'MED-001' }, { type: 'callNext', dept: 'MED', room: 'room1' });
    renderApp('/turn/MED-003');
    expect(screen.getByRole('alert').textContent).toContain(t('en', 'turn.called'));
    expect(screen.getByRole('alert').textContent).toContain('Room 1');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('updates live when another tab calls the token', async () => {
    let s = seed(kamla, { type: 'complete', token: 'MED-001' });
    renderApp('/turn/MED-003');
    expect(screen.queryByText(t('en', 'turn.called'))).toBeNull();
    s = apply(s, { type: 'callNext', dept: 'MED', room: 'room1' }, Date.now()).state;
    localStorage.setItem(KEY, JSON.stringify(s));
    const other = new BroadcastChannel('opd-saathi');
    await act(async () => {
      other.postMessage('changed');
    });
    await waitFor(() => expect(screen.getByText(t('en', 'turn.called'))).toBeTruthy());
    other.close();
  });

  it('works in Hindi', () => {
    seed(kamla);
    renderApp('/turn/MED-003', { lang: 'hi' });
    expect(screen.getByText('आपके आगे 2 लोग हैं')).toBeTruthy();
  });
});
