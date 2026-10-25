import type { Lang, PlaceId } from '../routing/types.ts';

// TODO(S2): move DeptCode into the shared contract.
/** Seven departments (docs/plan/contracts.md). The code is also the token prefix. */
export type DeptCode = 'MED' | 'CHI' | 'WOM' | 'BON' | 'ENT' | 'EYE' | 'SKI';

export interface Department {
  code: DeptCode;
  /** OPD rooms in `hospital`. Medicine has two rooms under one queue; the room is set at call time. */
  rooms: PlaceId[];
  /** Made-up doctor on duty today, written in each script. */
  doctor: Record<Lang, string>;
  /** Sample average consultation time. The estimated wait starts from it. */
  seedAvgMinutes: number;
  /** Seats in the waiting area this department uses, for overcrowding. */
  seats: number;
}

/**
 * Registration closes before the OPD does in every hospital the research checked
 * (docs/research/03, finding 6). Clock times are HH:MM in the hospital's day.
 */
export const OPD_HOURS = {
  opens: '09:00',
  registrationCloses: '11:30',
  closes: '14:00',
} as const;

export const departments: Department[] = [
  {
    code: 'MED',
    rooms: ['room1', 'room2'],
    doctor: { en: 'Dr. Meera Das', hi: 'डॉ. मीरा दास' },
    seedAvgMinutes: 5,
    seats: 40,
  },
  {
    code: 'CHI',
    rooms: ['room3'],
    doctor: { en: 'Dr. Arun Mishra', hi: 'डॉ. अरुण मिश्रा' },
    seedAvgMinutes: 6,
    seats: 20,
  },
  {
    code: 'WOM',
    rooms: ['room4'],
    doctor: { en: 'Dr. Sunita Rao', hi: 'डॉ. सुनीता राव' },
    seedAvgMinutes: 7,
    seats: 20,
  },
  {
    code: 'BON',
    rooms: ['room5'],
    doctor: { en: 'Dr. Vikram Patnaik', hi: 'डॉ. विक्रम पटनायक' },
    seedAvgMinutes: 6,
    seats: 15,
  },
  {
    code: 'ENT',
    rooms: ['room6'],
    doctor: { en: 'Dr. Farah Khan', hi: 'डॉ. फ़राह ख़ान' },
    seedAvgMinutes: 5,
    seats: 15,
  },
  {
    code: 'EYE',
    rooms: ['room7'],
    doctor: { en: 'Dr. Rajesh Behera', hi: 'डॉ. राजेश बेहेरा' },
    seedAvgMinutes: 5,
    seats: 15,
  },
  {
    code: 'SKI',
    rooms: ['room8'],
    doctor: { en: 'Dr. Anita Singh', hi: 'डॉ. अनीता सिंह' },
    seedAvgMinutes: 4,
    seats: 15,
  },
];
