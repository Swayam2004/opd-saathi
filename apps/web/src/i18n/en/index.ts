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

// One file per area. Every key in an area starts with `<area>.`, so two areas
// never share a key (the i18n test checks this).
export const enAreas = {
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

export const en = {
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
} as const;

export type MessageKey = keyof typeof en;
