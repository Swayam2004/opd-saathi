export type Lang = 'en' | 'hi';
export type FloorId = 0 | 1 | 2;
export type PlaceId = string;

/** 'waypoint' is an unnamed corridor junction. It never appears in search. */
export type PlaceKind =
  | 'entrance'
  | 'room'
  | 'ward'
  | 'service'
  | 'facility'
  | 'lift'
  | 'stairs'
  | 'ramp'
  | 'waypoint';

export type LandmarkRel = 'opposite' | 'next_to' | 'near';
export type LandmarkObjId = string;

/** One visible thing. Stored as ids so each language can order the words itself. */
export interface Landmark {
  rel: LandmarkRel;
  obj: LandmarkObjId;
}

export interface Place {
  id: PlaceId;
  kind: PlaceKind;
  floor: FloorId;
  /** Metres from the floor's top-left corner. y grows downwards, like SVG. */
  x: number;
  y: number;
  landmark?: Landmark;
  /** Lifts, stairs: compass-style degrees (0 = plan up, 90 = right) a person faces on stepping out. */
  facing?: number;
}

export interface Path {
  /** Unique. By convention `${a}>${b}`. */
  id: string;
  a: PlaceId;
  b: PlaceId;
  /** Walking distance. Must be >= straight-line distance on the same floor. */
  metres: number;
  /** True for stair flights and steps. Removed from the graph when avoid-stairs is on. */
  stairs: boolean;
  /** True means a -> b only. */
  oneWay: boolean;
  /** Fixed seconds on top of walking time. Lift wait plus ride. */
  extraSeconds: number;
}

export interface Floor {
  id: FloorId;
  widthM: number;
  heightM: number;
}

export interface Graph {
  floors: Floor[];
  places: Place[];
  paths: Path[];
}

export interface RouteLeg {
  pathId: string;
  from: PlaceId;
  to: PlaceId;
  metres: number;
  seconds: number;
  stairs: boolean;
}

export interface Route {
  from: PlaceId;
  to: PlaceId;
  /** from, then the end of every leg. */
  nodes: PlaceId[];
  legs: RouteLeg[];
  metres: number;
  seconds: number;
  avoidStairs: boolean;
}

export type RouteResult =
  | { ok: true; route: Route }
  | { ok: false; reason: 'unknown_place' | 'no_route' };

export const DOOR_KINDS: ReadonlySet<PlaceKind> = new Set<PlaceKind>([
  'room',
  'ward',
  'service',
  'facility',
]);
