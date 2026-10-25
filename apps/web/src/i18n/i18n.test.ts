import { describe, expect, it } from 'vitest';
import { en, enAreas, type MessageKey } from './en';
import { hi, hiAreas } from './hi';
import { t } from './t';

const keys = Object.keys(en) as MessageKey[];

// Keys whose Hindi may match the English exactly. Empty for now.
const SAME_IN_BOTH = new Set<MessageKey>([]);

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

describe('dictionaries', () => {
  it('give every key a non-empty Hindi string', () => {
    for (const key of keys) expect(hi[key].trim(), key).not.toBe('');
  });

  it('use the same placeholders in both languages', () => {
    for (const key of keys) expect(placeholders(hi[key]), key).toEqual(placeholders(en[key]));
  });

  it('translate every key', () => {
    for (const key of keys) {
      if (!SAME_IN_BOTH.has(key)) expect(hi[key], key).not.toBe(en[key]);
    }
  });

  it('prefix every key with its area, so areas never overwrite each other', () => {
    for (const [area, dict] of [...Object.entries(enAreas), ...Object.entries(hiAreas)]) {
      for (const key of Object.keys(dict)) expect(key.startsWith(`${area}.`), key).toBe(true);
    }
  });
});

describe('t', () => {
  it('fills placeholders', () => {
    expect(t('en', 'turn.ahead', { n: 6 })).toBe('6 people ahead of you');
    expect(t('hi', 'turn.ahead', { n: 6 })).toBe('आपके आगे 6 लोग हैं');
    expect(t('en', 'board.announce', { token: 'MED-042', room: 'Room 1' })).toBe(
      'Token MED-042, please go to Room 1.',
    );
  });

  it('returns plain messages as they are', () => {
    expect(t('hi', 'emergency.button')).toBe('इमरजेंसी');
  });
});
