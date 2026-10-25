import type { Lang } from '../routing/types.ts';
import type { DeptCode } from './departments.ts';

export type Gender = 'woman' | 'man' | 'other' | 'unsaid';

/** What registration collects. Made-up people only: first name, no IDs, no phone numbers. */
export interface SamplePatient {
  firstName: Record<Lang, string>;
  age: number;
  gender: Gender;
  dept: DeptCode;
}

/** Registered on server boot so the board is never empty (docs/plan/architecture.md). */
export const SEED_PATIENTS: SamplePatient[] = [
  { firstName: { en: 'Ramesh', hi: 'रमेश' }, age: 54, gender: 'man', dept: 'MED' },
  { firstName: { en: 'Lakshmi', hi: 'लक्ष्मी' }, age: 47, gender: 'woman', dept: 'MED' },
  { firstName: { en: 'Aarav', hi: 'आरव' }, age: 6, gender: 'man', dept: 'CHI' },
  { firstName: { en: 'Pooja', hi: 'पूजा' }, age: 26, gender: 'woman', dept: 'WOM' },
  { firstName: { en: 'Gopal', hi: 'गोपाल' }, age: 68, gender: 'man', dept: 'BON' },
  { firstName: { en: 'Salma', hi: 'सलमा' }, age: 39, gender: 'woman', dept: 'ENT' },
  { firstName: { en: 'Bishnu', hi: 'बिष्णु' }, age: 71, gender: 'man', dept: 'EYE' },
  { firstName: { en: 'Kiran', hi: 'किरण' }, age: 31, gender: 'unsaid', dept: 'SKI' },
];

/** Demo controls add these 20 at once. Medicine gets the most, as in a real OPD. */
export const DEMO_PATIENTS: SamplePatient[] = [
  { firstName: { en: 'Suresh', hi: 'सुरेश' }, age: 45, gender: 'man', dept: 'MED' },
  { firstName: { en: 'Geeta', hi: 'गीता' }, age: 58, gender: 'woman', dept: 'MED' },
  { firstName: { en: 'Manoj', hi: 'मनोज' }, age: 36, gender: 'man', dept: 'MED' },
  { firstName: { en: 'Rekha', hi: 'रेखा' }, age: 62, gender: 'woman', dept: 'MED' },
  { firstName: { en: 'Imran', hi: 'इमरान' }, age: 29, gender: 'man', dept: 'MED' },
  { firstName: { en: 'Savitri', hi: 'सावित्री' }, age: 66, gender: 'woman', dept: 'MED' },
  { firstName: { en: 'Prakash', hi: 'प्रकाश' }, age: 50, gender: 'man', dept: 'MED' },
  { firstName: { en: 'Anjali', hi: 'अंजलि' }, age: 4, gender: 'woman', dept: 'CHI' },
  { firstName: { en: 'Rohan', hi: 'रोहन' }, age: 9, gender: 'man', dept: 'CHI' },
  { firstName: { en: 'Neha', hi: 'नेहा' }, age: 24, gender: 'woman', dept: 'WOM' },
  { firstName: { en: 'Fatima', hi: 'फ़ातिमा' }, age: 31, gender: 'woman', dept: 'WOM' },
  { firstName: { en: 'Kamal', hi: 'कमल' }, age: 59, gender: 'man', dept: 'BON' },
  { firstName: { en: 'Usha', hi: 'उषा' }, age: 64, gender: 'woman', dept: 'BON' },
  { firstName: { en: 'Deepak', hi: 'दीपक' }, age: 42, gender: 'man', dept: 'ENT' },
  { firstName: { en: 'Sneha', hi: 'स्नेहा' }, age: 19, gender: 'woman', dept: 'ENT' },
  { firstName: { en: 'Hari', hi: 'हरि' }, age: 73, gender: 'man', dept: 'EYE' },
  { firstName: { en: 'Kavita', hi: 'कविता' }, age: 55, gender: 'woman', dept: 'EYE' },
  { firstName: { en: 'Arjun', hi: 'अर्जुन' }, age: 22, gender: 'man', dept: 'SKI' },
  { firstName: { en: 'Meena', hi: 'मीना' }, age: 37, gender: 'woman', dept: 'SKI' },
  { firstName: { en: 'Sam', hi: 'सैम' }, age: 28, gender: 'other', dept: 'SKI' },
];
