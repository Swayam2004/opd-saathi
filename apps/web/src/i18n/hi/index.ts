// AI draft. No native speaker has read these yet (#40). Wording for medical,
// emergency and status text comes from docs/research/07-accessibility-and-languages/glossary-hi.json.
import type { MessageKey } from '../en';
import { board } from './board';
import { common } from './common';
import { dept } from './dept';
import { emergency } from './emergency';
import { find } from './find';
import { home } from './home';
import { register } from './register';
import { settings } from './settings';
import { slip } from './slip';
import { staff } from './staff';
import { term } from './term';
import { turn } from './turn';

export const hiAreas = {
  board,
  common,
  dept,
  emergency,
  find,
  home,
  register,
  settings,
  slip,
  staff,
  term,
  turn,
} as const;

// Each area file is typed against its English twin, so a missing or extra key
// fails the build there. This annotation catches a missing area.
export const hi: Record<MessageKey, string> = {
  ...board,
  ...common,
  ...dept,
  ...emergency,
  ...find,
  ...home,
  ...register,
  ...settings,
  ...slip,
  ...staff,
  ...term,
  ...turn,
};
