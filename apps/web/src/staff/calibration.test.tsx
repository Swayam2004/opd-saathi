import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/t';
import { apply, initialState, type HospitalState } from '../store/hospital';
import { renderApp } from '../test-utils';

const KEY = 'opd-saathi.hospital.v1';
const kamla = { type: 'register', reg: { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' } } as const;

const saved = (): HospitalState => JSON.parse(localStorage.getItem(KEY) ?? '{}') as HospitalState;

describe('wait range and calibration', () => {
  it('shows a range under the estimate on My turn, never as "you can wait"', () => {
    localStorage.setItem(KEY, JSON.stringify(apply(initialState(Date.now()), kamla, Date.now()).state));
    renderApp('/turn/MED-003');
    const line = screen.getByText(/^Usually \d+ to \d+ minutes$/);
    expect(line).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/can wait|can leave/i);
  });

  it('keeps the first range shown, once', () => {
    localStorage.setItem(KEY, JSON.stringify(apply(initialState(Date.now()), kamla, Date.now()).state));
    const first = renderApp('/turn/MED-003');
    first.unmount();
    renderApp('/turn/MED-003');
    expect(saved().shown.filter((x) => x.token === 'MED-003')).toHaveLength(1);
  });

  it('staff see how many called patients waited within their range', () => {
    const now = Date.now();
    let s = apply(initialState(now), kamla, now).state;
    s = apply(s, { type: 'recordShown', range: { token: 'MED-003', lowMin: 0, highMin: 30 } }, now).state;
    s = apply(s, { type: 'complete', token: 'MED-001' }, now).state;
    s = apply(s, { type: 'callNext', dept: 'MED', room: 'room1' }, now + 60_000).state;
    localStorage.setItem(KEY, JSON.stringify(s));
    renderApp('/staff/places');
    expect(screen.getByText(t('en', 'staff.calibration', { inside: 1, shown: 1 }))).toBeTruthy();
  });

  it('says so when no one shown a range has been called', () => {
    localStorage.setItem(KEY, JSON.stringify(initialState(Date.now())));
    renderApp('/staff/places');
    expect(screen.getByText(t('en', 'staff.calibration.none'))).toBeTruthy();
  });
});
