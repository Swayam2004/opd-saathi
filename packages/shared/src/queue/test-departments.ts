// Fixture: the department configs the research tests were written against.
import type { DepartmentConfig } from './queue.ts';

export const departments: DepartmentConfig[] = [
  { id: 'medicine', prefix: 'MED', rooms: ['room1', 'room2'], seedAvgMinutes: 5 },
  { id: 'children', prefix: 'PED', rooms: ['room3'], seedAvgMinutes: 6 },
  { id: 'women', prefix: 'WOM', rooms: ['room4'], seedAvgMinutes: 7 },
  { id: 'bones', prefix: 'BON', rooms: ['room5'], seedAvgMinutes: 6 },
  { id: 'ent', prefix: 'ENT', rooms: ['room6'], seedAvgMinutes: 5 },
  { id: 'eyes', prefix: 'EYE', rooms: ['room7'], seedAvgMinutes: 5 },
  { id: 'skin', prefix: 'SKN', rooms: ['room8'], seedAvgMinutes: 4 },
];
