import { hospital } from '@shared/data/hospital.ts';
import { dictionaries } from '@shared/routing/strings.ts';
import type { Lang } from '@shared/routing/types.ts';

/** A place's name in `lang`, from the routing dictionary. */
export function placeName(lang: Lang, id: string): string {
  return dictionaries[lang].places[id] ?? id;
}

export function floorOf(id: string): number | undefined {
  return hospital.places.find((p) => p.id === id)?.floor;
}

/** "the first floor" as the routing text has it, for use mid-sentence. */
export function floorPhrase(lang: Lang, floor: number): string {
  return dictionaries[lang].floors[String(floor)] ?? String(floor);
}

/** "The first floor" as a label: the routing text is mid-sentence, so capitalise it. */
export function floorName(lang: Lang, floor: number): string {
  const s = dictionaries[lang].floors[String(floor)] ?? String(floor);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
