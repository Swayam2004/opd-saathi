import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/t';
import { apply, initialState } from '../store/hospital';
import { renderApp } from '../test-utils';

const heading = () => screen.getByRole('heading', { level: 1 }).textContent;

describe('OPD slip', () => {
  it('shows token, first name, department, room, floor, doctor, people ahead, wait and a QR code', () => {
    renderApp('/slip/CHI-001');
    expect(screen.getByText('CHI-001')).toBeTruthy();
    for (const [label, value] of [
      ['Name', 'Aarav'],
      ['Department', 'Children'],
      ['Room', 'Room 3'],
      ['Floor', 'The first floor'],
      ['Doctor', 'Dr. Arun Mishra'],
    ]) {
      expect(screen.getByText(label!).nextElementSibling?.textContent).toBe(value);
    }
    expect(screen.getByText('People ahead').nextElementSibling?.textContent).toMatch(/^\d+$/);
    expect(screen.getByRole('img', { name: t('en', 'slip.qr') })).toBeTruthy();
  });

  it('says the Medicine room is given when called', () => {
    renderApp('/slip/MED-001');
    expect(screen.getByText('Room').nextElementSibling?.textContent).toMatch(/Room 1|Room 2/);
  });

  it('shows the slip in Hindi', () => {
    renderApp('/slip/CHI-001', { lang: 'hi' });
    expect(heading()).toBe(t('hi', 'slip.title'));
    expect(screen.getByText('आरव')).toBeTruthy();
  });

  it('opens a large view for staff in the patient language and English', () => {
    renderApp('/slip/CHI-001', { lang: 'hi' });
    fireEvent.click(screen.getByRole('button', { name: t('hi', 'slip.showStaff') }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain(t('hi', 'slip.largeTitle'));
    expect(dialog.textContent).toContain(t('en', 'slip.largeTitle'));
    fireEvent.click(screen.getByRole('button', { name: t('hi', 'common.close') }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('explains an unknown token instead of a blank page', () => {
    renderApp('/slip/XYZ-999');
    expect(screen.getByRole('alert').textContent).toBe(t('en', 'turn.entry.notFound', { token: 'XYZ-999' }));
  });

  it('is where registration lands, with a real token from the store', async () => {
    renderApp('/register/name');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Kamla' } });
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '62' } });
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Woman' }));
    fireEvent.click(screen.getByRole('button', { name: /^Skip/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Eyes/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Get my OPD slip/ }));
    });
    expect(heading()).toBe(t('en', 'slip.title'));
    expect(screen.getByText('EYE-002')).toBeTruthy();
    expect(screen.getByText('Kamla')).toBeTruthy();
  });

  it('prints the way from the main entrance on the slip', () => {
    renderApp('/slip/EYE-001');
    const route = screen.getByText(t('en', 'slip.route')).nextElementSibling;
    expect(route?.querySelectorAll('li').length).toBeGreaterThan(1);
    expect(route?.textContent).toMatch(/Room 7/);
  });

  it('routes a waiting Medicine patient to the waiting hall, since the room is set at call time', () => {
    const s = apply(initialState(Date.now()), { type: 'register', reg: { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' } }, Date.now()).state;
    localStorage.setItem('opd-saathi.hospital.v1', JSON.stringify(s));
    renderApp('/slip/MED-003');
    const route = screen.getByText(t('en', 'slip.route')).nextElementSibling;
    expect(route?.textContent).toMatch(/Waiting hall A/);
  });
});
