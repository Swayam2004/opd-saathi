import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/t';
import { apply, initialState, type Command, type HospitalState } from '../store/hospital';
import { renderApp } from '../test-utils';
import { crowdLevel } from './Dashboard';

const KEY = 'opd-saathi.hospital.v1';
const kamla = { type: 'register', reg: { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' } } as const;

function seed(...cmds: Command[]): HospitalState {
  let s = initialState(Date.now());
  for (const c of cmds) s = apply(s, c, Date.now()).state;
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}
const saved = (): HospitalState => JSON.parse(localStorage.getItem(KEY) ?? '{}') as HospitalState;
const med = () => screen.getByRole('region', { name: 'General Medicine' });

describe('staff dashboard', () => {
  it('says a real hospital needs a staff login, and shows every department', () => {
    seed();
    renderApp('/staff');
    expect(screen.getByText(t('en', 'staff.loginNote'))).toBeTruthy();
    expect(screen.getAllByRole('region').length).toBeGreaterThanOrEqual(7);
  });

  it('pins urgent flags at the top until marked seen', async () => {
    seed({ type: 'raiseFlag', token: 'MED-003' });
    renderApp('/staff');
    const flag = screen.getByRole('alert');
    expect(flag.textContent).toContain('Token MED-003');
    fireEvent.click(within(flag).getByRole('button', { name: /Mark as seen/ }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(saved().flags[0]?.seenAtMs).toBeGreaterThan(0);
  });

  it('shows a flag raised in another tab within a second', async () => {
    let s = seed();
    renderApp('/staff');
    s = apply(s, { type: 'raiseFlag' }, Date.now()).state;
    localStorage.setItem(KEY, JSON.stringify(s));
    const other = new BroadcastChannel('opd-saathi');
    await act(async () => {
      other.postMessage('changed');
    });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(t('en', 'staff.urgent.noToken')), { timeout: 1000 });
    other.close();
  });

  it('finishes a consultation and calls the next token into the free room', () => {
    seed(kamla);
    renderApp('/staff');
    fireEvent.click(within(med()).getAllByRole('button', { name: /Consultation done/ })[0]!);
    fireEvent.click(within(med()).getByRole('button', { name: /Call next · Room 1/ }));
    expect(saved().queue.tickets['MED-003']).toMatchObject({ status: 'called', room: 'room1' });
    expect(within(med()).getByText(/Called, not arrived yet/)).toBeTruthy();
  });

  it('marks a called patient as a no-show', () => {
    seed(kamla, { type: 'complete', token: 'MED-001' }, { type: 'callNext', dept: 'MED', room: 'room1' });
    renderApp('/staff');
    fireEvent.click(within(med()).getByRole('button', { name: 'No-show' }));
    expect(saved().queue.tickets['MED-003']?.status).toBe('no_show');
  });

  it('sends a patient to the end and moves one to another department', () => {
    seed(kamla, { type: 'register', reg: { firstName: 'Ravi', age: 40, gender: 'man', dept: 'MED' } });
    renderApp('/staff');
    fireEvent.click(within(med()).getByText(/^Waiting \(2\)/));
    const rows = within(med()).getAllByRole('listitem');
    fireEvent.click(within(rows[0]!).getByRole('button', { name: 'Send to end of queue' }));
    expect(saved().queue.tickets['MED-003']!.order).toBeGreaterThan(saved().queue.tickets['MED-004']!.order);
    fireEvent.change(within(med()).getByLabelText('Move MED-004 to:'), { target: { value: 'EYE' } });
    fireEvent.click(within(med()).getAllByRole('button', { name: 'Move' })[0]!);
    expect(saved().queue.tickets['MED-004']?.status).toBe('moved');
  });

  it('sets doctor status, which patients see at once', () => {
    seed();
    renderApp('/staff');
    const select = within(med()).getAllByLabelText(t('en', 'staff.doctor.update'))[0]!;
    const late = [...select.querySelectorAll('option')].find((o) => o.textContent === 'Running 20 minutes late');
    fireEvent.change(select, { target: { value: late?.getAttribute('value') } });
    expect(saved().doctors['room1']).toEqual({ kind: 'late', byMin: 20 });
  });

  it('shows overcrowding as a word and an icon', () => {
    expect([crowdLevel(2, 20), crowdLevel(15, 20), crowdLevel(25, 20)]).toEqual(['ok', 'busy', 'full']);
    seed();
    renderApp('/staff');
    expect(within(med()).getByText('Space free')).toBeTruthy();
  });

  it('demo controls add 20 patients, speed time up and reset after a confirm', () => {
    seed();
    renderApp('/staff');
    fireEvent.click(screen.getByRole('button', { name: /Add 20 sample patients/ }));
    expect(Object.keys(saved().patients)).toHaveLength(28);
    fireEvent.click(screen.getByRole('button', { name: /Speed up time 10x/ }));
    expect(saved().clock.speed).toBe(10);
    fireEvent.click(screen.getByRole('button', { name: /Reset everything/ }));
    expect(Object.keys(saved().patients)).toHaveLength(28);
    fireEvent.click(screen.getAllByRole('button', { name: /Reset everything/ })[0]!);
    expect(Object.keys(saved().patients)).toHaveLength(8);
  });
});

describe('registration counter', () => {
  it('registers a patient in a few taps and offers the slip to print', () => {
    seed();
    renderApp('/staff/counter');
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Kamla' } });
    fireEvent.change(screen.getByLabelText('How old are you?'), { target: { value: '62' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'EYE' } });
    fireEvent.click(screen.getByRole('button', { name: /Register and print slip/ }));
    expect(screen.getByRole('status').textContent).toContain('EYE-002');
    expect(screen.getByRole('link', { name: /Open the slip to print/ }).getAttribute('href')).toBe('/slip/EYE-002');
  });

  it('checks the answers first', () => {
    seed();
    renderApp('/staff/counter');
    fireEvent.click(screen.getByRole('button', { name: /Register and print slip/ }));
    expect(screen.getByRole('alert').textContent).toContain(t('en', 'register.error.name'));
  });
});
