import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/t';
import { loadPrefs } from '../shell/prefs';
import { renderApp } from '../test-utils';

const steps = () => screen.getByRole('heading', { name: t('en', 'find.steps') }).parentElement!.querySelectorAll('li');

describe('Find a place', () => {
  it('lists places to search or pick, without lifts, stairs or corridor points', () => {
    renderApp('/find');
    expect(screen.getByRole('button', { name: /Pharmacy/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Lift/ })).toBeNull();
    fireEvent.change(screen.getByLabelText(t('en', 'find.search')), { target: { value: 'ward' } });
    expect(screen.getAllByRole('button', { name: /Ward/ })).toHaveLength(3);
  });

  it('draws the route on a plan for every floor it crosses, with written steps', () => {
    renderApp('/find?to=room3');
    expect(steps().length).toBeGreaterThan(1);
    expect(screen.getByText('The ground floor')).toBeTruthy();
    expect(screen.getByText('The first floor')).toBeTruthy();
    expect(document.querySelectorAll('polyline.route').length).toBeGreaterThanOrEqual(2);
  });

  it('avoids stairs when asked, and says so in the steps', () => {
    renderApp('/find?to=ward4', { avoidStairs: true });
    const text = [...steps()].map((li) => li.textContent).join(' ');
    expect(text).toMatch(/lift/i);
    expect(text).not.toMatch(/stairs/i);
  });

  it('turns Avoid stairs on from this screen and remembers it', () => {
    renderApp('/find?to=room3');
    fireEvent.click(screen.getByRole('switch', { name: /Avoid stairs/ }));
    expect(loadPrefs().avoidStairs).toBe(true);
  });

  it('starts from another place when changed', () => {
    renderApp('/find?to=pharmacy');
    fireEvent.click(screen.getAllByRole('button', { name: t('en', 'common.change') })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /X-ray/ }));
    expect(screen.getByText(t('en', 'find.youAreAt', { place: 'X-ray' }))).toBeTruthy();
  });

  it("I'm lost shows the way to the Help desk and a card for staff in both languages", () => {
    renderApp('/find?to=room3', { lang: 'hi' });
    fireEvent.click(screen.getByRole('button', { name: t('hi', 'find.lost') }));
    expect(screen.getByText(t('hi', 'find.lostHelpDesk'))).toBeTruthy();
    expect(screen.getByText(t('en', 'find.lostDest', { place: 'Room 3' }))).toBeTruthy();
  });

  it('gives steps in Hindi', () => {
    renderApp('/find?to=room3', { lang: 'hi' });
    const list = screen.getByRole('heading', { name: t('hi', 'find.steps') }).parentElement!.querySelector('ol');
    expect(list?.textContent).toMatch(/[ऀ-ॿ]/);
  });
});
