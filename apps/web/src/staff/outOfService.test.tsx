import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/t';
import { apply, initialState, type Command } from '../store/hospital';
import { renderApp } from '../test-utils';

const KEY = 'opd-saathi.hospital.v1';
const LIFTS: Command[] = ['lift_g', 'lift_1', 'lift_2'].map((place) => ({ type: 'setOutOfService', place, on: true }));

function seed(...cmds: Command[]): void {
  let s = initialState(Date.now());
  for (const c of cmds) s = apply(s, c, Date.now()).state;
  localStorage.setItem(KEY, JSON.stringify(s));
}

describe('out of service', () => {
  it('staff mark the lift out of service on every floor at once', () => {
    seed();
    renderApp('/staff/places');
    expect(screen.getByText(t('en', 'staff.loginNote'))).toBeTruthy();
    fireEvent.click(screen.getByRole('switch', { name: /Lift, all floors/ }));
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { outOfService: string[] };
    expect(saved.outOfService.sort()).toEqual(['lift_1', 'lift_2', 'lift_g']);
    expect(screen.getByRole('switch', { name: /Lift, all floors/ }).getAttribute('aria-checked')).toBe('true');
  });

  it('reroutes by the stairs and says the lift is out of service', () => {
    seed(...LIFTS);
    renderApp('/find?to=room3');
    expect(screen.queryByText(t('en', 'find.outOfService', { place: 'Lift' }))).toBeNull(); // usual route takes the stairs
    const steps = screen.getByRole('heading', { name: 'Steps' }).parentElement!.textContent ?? '';
    expect(steps).not.toMatch(/lift/i);
  });

  it('names the lift when the usual step-free route needed it, and sends the patient to the Help desk', () => {
    seed(...LIFTS);
    renderApp('/find?to=room3', { avoidStairs: true });
    expect(screen.getByText(t('en', 'find.outOfService', { place: 'Lift' }))).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(t('en', 'find.noRoute'));
    expect(screen.getByText(t('en', 'find.lostHelpDesk'))).toBeTruthy();
  });

  it('brings the lift back when staff switch it back', () => {
    seed(...LIFTS);
    renderApp('/staff/places');
    fireEvent.click(screen.getByRole('switch', { name: /Lift, all floors/ }));
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { outOfService: string[] };
    expect(saved.outOfService).toEqual([]);
  });
});
