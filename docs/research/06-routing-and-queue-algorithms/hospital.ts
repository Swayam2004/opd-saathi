import type { FloorId, Graph, Landmark, LandmarkObjId, LandmarkRel, Path, Place, PlaceKind } from './types.ts';

const places: Place[] = [];
const paths: Path[] = [];

function lm(rel: LandmarkRel, obj: LandmarkObjId): Landmark {
  return { rel, obj };
}

function place(
  id: string,
  kind: PlaceKind,
  floor: FloorId,
  x: number,
  y: number,
  landmark?: Landmark,
  facing?: number,
): void {
  const p: Place = { id, kind, floor, x, y };
  if (landmark) p.landmark = landmark;
  if (facing !== undefined) p.facing = facing;
  places.push(p);
}

function find(id: string): Place {
  const p = places.find((q) => q.id === id);
  if (!p) throw new Error(`hospital.ts: unknown place ${id}`);
  return p;
}

interface LinkOpts {
  metres?: number;
  stairs?: boolean;
  oneWay?: boolean;
  extraSeconds?: number;
}

/**
 * The real team measures metres with a tape. For the sample we default to the
 * straight-line distance rounded up, and the validator checks that nothing is shorter.
 */
function link(a: string, b: string, o: LinkOpts = {}): void {
  const pa = find(a);
  const pb = find(b);
  const metres = o.metres ?? Math.ceil(Math.hypot(pa.x - pb.x, pa.y - pb.y));
  paths.push({
    id: `${a}>${b}`,
    a,
    b,
    metres,
    stairs: o.stairs ?? false,
    oneWay: o.oneWay ?? false,
    extraSeconds: o.extraSeconds ?? 0,
  });
}

// ---- Ground floor (0) ----
place('entrance', 'entrance', 0, 30, 34, lm('near', 'security_desk'));
place('ramp_g', 'ramp', 0, 42, 32, lm('near', 'yellow_rail'));
place('lobby', 'waypoint', 0, 30, 26, lm('near', 'notice_board'));
place('emergency', 'service', 0, 14, 26, lm('next_to', 'red_sign'));
place('helpdesk', 'service', 0, 24, 31, lm('opposite', 'wheelchairs'));
place('wheelchair', 'facility', 0, 34, 31, lm('next_to', 'security_desk'));
place('hub0', 'waypoint', 0, 30, 20, lm('near', 'wall_clock'));
place('g_w1', 'waypoint', 0, 18, 20);
place('g_w0', 'waypoint', 0, 10, 20);
place('g_e1', 'waypoint', 0, 42, 20);
place('g_e2', 'waypoint', 0, 52, 20);
place('registration', 'service', 0, 18, 12, lm('opposite', 'blue_chairs'));
place('toilets_g', 'facility', 0, 10, 12, lm('next_to', 'mural'));
place('pharmacy', 'service', 0, 42, 12, lm('next_to', 'green_sign'));
place('laboratory', 'service', 0, 52, 12, lm('near', 'bench'));
place('xray', 'service', 0, 52, 28, lm('next_to', 'radiation_sign'));
place('water_g', 'facility', 0, 42, 28, lm('opposite', 'green_sign'));
place('lift_g', 'lift', 0, 28, 12, lm('near', 'plants'), 180);
place('stairs_g', 'stairs', 0, 33, 12, lm('next_to', 'fire_box'), 180);

link('entrance', 'lobby', { metres: 8, stairs: true }); // three entrance steps
link('entrance', 'ramp_g');
link('ramp_g', 'lobby', { metres: 20 }); // gentle ramp, longer than the straight line
link('lobby', 'emergency');
link('lobby', 'helpdesk');
link('lobby', 'wheelchair');
link('lobby', 'hub0');
link('hub0', 'g_w1');
link('g_w1', 'g_w0');
link('hub0', 'g_e1');
link('g_e1', 'g_e2');
link('registration', 'g_w1');
link('toilets_g', 'g_w0');
link('pharmacy', 'g_e1');
link('laboratory', 'g_e2');
link('xray', 'g_e2');
link('water_g', 'g_e1');
link('lift_g', 'hub0');
link('stairs_g', 'hub0');
// Pharmacy exit door: one-way, opens next to the lifts.
link('pharmacy', 'lift_g', { oneWay: true });

// ---- First floor (1) ----
place('lift_1', 'lift', 1, 28, 12, lm('near', 'plants'), 180);
place('stairs_1', 'stairs', 1, 33, 12, lm('next_to', 'fire_box'), 180);
place('hub1', 'waypoint', 1, 30, 20, lm('near', 'notice_board'));
place('f1_a', 'waypoint', 1, 6, 20);
place('f1_b', 'waypoint', 1, 14, 20);
place('f1_d', 'waypoint', 1, 42, 20);
place('f1_e', 'waypoint', 1, 50, 20);
place('room1', 'room', 1, 6, 12, lm('next_to', 'mural'));
place('room2', 'room', 1, 14, 12, lm('opposite', 'blue_chairs'));
place('room3', 'room', 1, 42, 12, lm('opposite', 'blue_chairs'));
place('room4', 'room', 1, 50, 12, lm('next_to', 'water_cooler'));
place('room5', 'room', 1, 6, 28, lm('near', 'bench'));
place('room6', 'room', 1, 14, 28, lm('next_to', 'cartoon_wall'));
place('hall_a', 'service', 1, 30, 28, lm('near', 'wall_clock'));
place('room7', 'room', 1, 42, 28, lm('opposite', 'plants'));
place('room8', 'room', 1, 50, 28, lm('next_to', 'fire_box'));
place('toilets_1', 'facility', 1, 57, 20, lm('near', 'water_cooler'));

link('lift_1', 'hub1');
link('stairs_1', 'hub1');
link('hub1', 'f1_b');
link('f1_b', 'f1_a');
link('hub1', 'f1_d');
link('f1_d', 'f1_e');
link('f1_e', 'toilets_1');
link('room1', 'f1_a');
link('room2', 'f1_b');
link('room3', 'f1_d');
link('room4', 'f1_e');
link('room5', 'f1_a');
link('room6', 'f1_b');
link('hall_a', 'hub1');
link('room7', 'f1_d');
link('room8', 'f1_e');

// ---- Second floor (2) ----
place('lift_2', 'lift', 2, 28, 12, lm('near', 'plants'), 180);
place('stairs_2', 'stairs', 2, 33, 12, lm('next_to', 'fire_box'), 180);
place('hub2', 'waypoint', 2, 30, 20, lm('near', 'wall_clock'));
place('f2_a', 'waypoint', 2, 8, 20);
place('f2_b', 'waypoint', 2, 18, 20);
place('f2_c', 'waypoint', 2, 42, 20);
place('ward4', 'ward', 2, 8, 12, lm('opposite', 'blue_chairs'));
place('ward5', 'ward', 2, 18, 12, lm('next_to', 'cartoon_wall'));
place('ward6', 'ward', 2, 42, 12, lm('next_to', 'cartoon_wall'));
place('nurses', 'service', 2, 30, 28, lm('next_to', 'duty_board'));

link('lift_2', 'hub2');
link('stairs_2', 'hub2');
link('hub2', 'f2_b');
link('f2_b', 'f2_a');
link('hub2', 'f2_c');
link('ward4', 'f2_a');
link('ward5', 'f2_b');
link('ward6', 'f2_c');
link('nurses', 'hub2');

// ---- Between floors ----
// Lift: ~45 s wait + ~10 s per floor ride. One edge per floor pair, so the wait is paid once.
link('lift_g', 'lift_1', { metres: 4, extraSeconds: 55 });
link('lift_1', 'lift_2', { metres: 4, extraSeconds: 55 });
link('lift_g', 'lift_2', { metres: 8, extraSeconds: 65 });
// Stairs: one flight pair per floor.
link('stairs_g', 'stairs_1', { metres: 12, stairs: true });
link('stairs_1', 'stairs_2', { metres: 12, stairs: true });

export const hospital: Graph = {
  floors: [
    { id: 0, widthM: 60, heightM: 36 },
    { id: 1, widthM: 60, heightM: 36 },
    { id: 2, widthM: 60, heightM: 36 },
  ],
  places,
  paths,
};
