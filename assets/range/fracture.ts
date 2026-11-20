export type Vec3 = [number, number, number];

export type Box = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  color: number;
};

type Part = {
  name: string;
  hitsToBreak: number;
  intact: readonly Box[];
  boxes: readonly Box[];
  pivot: Vec3;
};

export const PALETTE = [
  '#3b7274', '#4d8785', '#5d9290', '#2a545a',
  '#ac8874', '#c5a48d', '#856b68', '#403735',
  '#253d53', '#34536b', '#233039', '#161f27',
  '#c6bcb0', '#aa9a84', '#463233', '#654241',
] as const;

const color = {
  shirt: 0,
  shirtLight: 1,
  shirtFade: 2,
  shirtDark: 3,
  skin: 4,
  skinLight: 5,
  skinDark: 6,
  hair: 7,
  pants: 8,
  pantsLight: 9,
  boot: 10,
  dark: 11,
  eyes: 12,
  teeth: 13,
  woundDark: 14,
  wound: 15,
} as const;

const UNIT = 0.125;

// Grid coordinates are inclusive at the lower edge and exclusive at the upper edge.
function block(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tint: number): Box {
  return {
    x: (x0 + x1) * UNIT * 0.5,
    y: (y0 + y1) * UNIT * 0.5,
    z: (z0 + z1) * UNIT * 0.5,
    sx: (x1 - x0) * UNIT,
    sy: (y1 - y0) * UNIT,
    sz: (z1 - z0) * UNIT,
    color: tint,
  };
}

function mirrored(box: Box, side: number): Box {
  return { ...box, x: box.x * side };
}

const chest = [
  { x0: -3.5, x1: -1.25, y0: 13.6, y1: 15.65, tint: color.shirtLight },
  { x0: -1.25, x1: 1.25, y0: 12.35, y1: 14.65, tint: color.shirtFade },
  { x0: 1.25, x1: 3.5, y0: 11.55, y1: 13.7, tint: color.shirt },
];

const body: Box[] = [
  block(-3.5, 8, -2, 3.5, 10, 2, color.pants),
  block(-3.5, 9.1, 2, 3.5, 9.75, 2.25, color.shirtDark),
  block(-0.55, 9.03, 2.25, 0.55, 9.8, 2.42, color.pantsLight),

  block(-3.5, 10, -2.15, 3.5, 16.5, 1, color.shirt),
  ...chest.flatMap(({ x0, x1, y0, y1, tint }) => [
    block(x0, 10, 1, x1, y0, 2.15, tint),
    block(x0, y1, 1, x1, 16.5, 2.15, tint),
    block(x0, y0, 1, x1, y1, 1.15, color.woundDark),
    block(x0 + 0.15, y0 + 0.3, 1.15, x1 - 0.4, y1 - 0.45, 1.35, color.wound),
  ]),
  block(-1.15, 16.5, -1.15, 1.15, 17.3, 1.25, color.skinDark),
  block(-1.8, 16, 2.15, 1.8, 16.5, 2.25, color.shirtDark),

  block(-2.6, 17.25, -2.05, 2.6, 21.55, 2.1, color.skin),
  block(-2.2, 17.1, 0.65, 2.35, 18.2, 2.21, color.skinDark),
  block(-2.75, 21.55, -2.2, 2.67, 22.45, 2.21, color.hair),
  block(-2.75, 20.8, 2.1, -0.4, 21.55, 2.27, color.hair),
  block(1.32, 21.03, 2.1, 2.67, 21.55, 2.29, color.hair),
  block(-2.76, 18.5, -1.2, -2.6, 19.65, 0.25, color.skinLight),
  block(2.6, 18.5, -1.2, 2.76, 19.65, 0.25, color.skinDark),

  block(-1.95, 19.55, 2.1, -0.33, 20.54, 2.31, color.dark),
  block(0.36, 19.57, 2.1, 1.97, 20.54, 2.31, color.dark),
  block(-1.48, 19.78, 2.31, -0.75, 20.37, 2.41, color.eyes),
  block(0.65, 19.8, 2.31, 1.34, 20.34, 2.41, color.eyes),
  block(-2.1,18.85,2.09,-.84,19.54,2.24,color.skinDark),
  block(.63,18.96,2.1,1.61,19.54,2.24,color.woundDark),
  block(-2.42,18.43,2.10,-1.8,18.92,2.23,color.wound),
  block(-0.31, 19.03, 2.1, 0.35, 19.65, 2.53, color.skinLight),
  block(-1.42, 17.84, 2.21, 1.48, 18.62, 2.34, color.dark),
  block(-0.99, 18.24, 2.34, -0.57, 18.61, 2.42, color.teeth),
  block(0.53, 18.26, 2.34, 0.94, 18.61, 2.42, color.teeth),
];

for (const side of [-1, 1]) {
  body.push(
    mirrored(block(0.52, 0, -2.05, 3.18, 1.85, 2.85, color.boot), side),
    mirrored(block(0.55, 0.32, 2.85, 3.11, 1.06, 3.04, color.dark), side),
    mirrored(block(0.62, 1.85, -1.85, 3.05, 8, 1.87, color.pants), side),
    mirrored(block(0.8, 3.8, 1.87, 2.86, 5.74, 2.06, color.pantsLight), side),
    mirrored(block(3.5, 13.2, -1.62, 5.47, 16.42, 1.85, color.shirtLight), side),
    mirrored(block(3.63, 12, -1.4, 5.47, 13.2, 1.73, color.skinDark), side),
  );
}

const forearm = [
  block(3.63, 9.45, -1.4, 5.47, 12, 1.73, color.skin),
  block(3.57, 7.96, -1.25, 5.88, 9.45, 2.25, color.skinDark),
  block(3.74, 8.24, 2.25, 5.7, 9.32, 2.45, color.skinLight),
];

// Retain the authored silhouette and colour details while making all surfaces destructible.
const sourceBoxes = [...body, ...chest.map(({ x0, x1, y0, y1, tint }) =>
  block(x0, y0, 1.15, x1, y1, 2.15, tint)),
  ...forearm.map(box => mirrored(box, -1)), ...forearm];
const regions: Box[][] = Array.from({ length: 6 }, () => []);
const intact:Box[][]=regions.map(()=>[]);
for (const box of sourceBoxes) {
  const part = box.y >= 2.08 ? 1 : Math.abs(box.x) > 0.44 ? (box.x < 0 ? 2 : 3)
    : box.y < 1 ? (box.x < 0 ? 4 : 5) : 0;
  intact[part].push(box);
  const nx = Math.max(1, Math.ceil(box.sx / 0.16));
  const ny = Math.max(1, Math.ceil(box.sy / 0.16));
  const nz = Math.max(1, Math.ceil(box.sz / 0.16));
  for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) {
    regions[part].push({
      x: box.x - box.sx / 2 + (x + 0.5) * box.sx / nx,
      y: box.y - box.sy / 2 + (y + 0.5) * box.sy / ny,
      z: box.z - box.sz / 2 + (z + 0.5) * box.sz / nz,
      sx: box.sx / nx, sy: box.sy / ny, sz: box.sz / nz, color: box.color,
    });
  }
}
export const PARTS: readonly Part[] = regions.map((boxes, index) => ({
  name: ['躯干', '头部', '左臂', '右臂', '左腿', '右腿'][index],
  intact: intact[index],
  hitsToBreak: [Infinity, 4, 3, 3, 3, 3][index], boxes,
  pivot: [boxes.reduce((n, b) => n + b.x, 0) / boxes.length,
    boxes.reduce((n, b) => n + b.y, 0) / boxes.length,
    boxes.reduce((n, b) => n + b.z, 0) / boxes.length],
}));
const waistSeam = 1.25;
const waistHitHeight = 1.36;
const waistHitsToBreak = 3;
const bothLegs = 0b110000;
const BOX_AXES = [['x', 'sx'], ['y', 'sy'], ['z', 'sz']] as const;
const torsoBoxes = PARTS[0].boxes;

function connects(a: Box, b: Box): boolean {
  const epsilon = 1e-6;
  let touchingAxes = 0;
  for (const [center, size] of BOX_AXES) {
    const overlap = (a[size] + b[size]) / 2 - Math.abs(a[center] - b[center]);
    if (overlap < -epsilon) return false;
    if (overlap <= epsilon) touchingAxes++;
  }
  // A connection requires face contact or positive-volume overlap.
  return touchingAxes <= 1;
}

// Build the contact graph once in the authored pose, shared by all zombies.
const torsoNeighbors: number[][] = torsoBoxes.map(() => []);
for (let i = 0; i < torsoBoxes.length; i++) {
  for (let j = i + 1; j < torsoBoxes.length; j++) {
    if (!connects(torsoBoxes[i], torsoBoxes[j])) continue;
    torsoNeighbors[i].push(j);
    torsoNeighbors[j].push(i);
  }
}
const legBoxes = [...PARTS[4].boxes, ...PARTS[5].boxes];
const neckContacts = torsoBoxes.flatMap((box, i) => PARTS[1].boxes.some(head => connects(box, head)) ? [i] : []);
const hipContacts = torsoBoxes.flatMap((box, i) => legBoxes.some(leg => connects(box, leg)) ? [i] : []);

function torsoConnectedToHead(alive: Uint8Array): Uint8Array {
  const attached = new Uint8Array(alive.length);
  const queue = neckContacts.filter(i => alive[i]);
  for (const i of queue) attached[i] = 1;
  for (let i = 0; i < queue.length; i++) {
    for (const neighbor of torsoNeighbors[queue[i]]) {
      if (!alive[neighbor] || attached[neighbor]) continue;
      attached[neighbor] = 1;
      queue.push(neighbor);
    }
  }
  return attached;
}

export type BodyDamage = {
  alive: Uint8Array[]; hits: number[]; remaining: number; destroyed: boolean; missingLimbs: number;
  waistHits: number; waistSevered: boolean; torsoLost: boolean;
};
export function createBodyDamage(): BodyDamage {
  return { alive: PARTS.map(part => new Uint8Array(part.boxes.length).fill(1)),
    hits: [0, 0, 0, 0, 0, 0], remaining: PARTS.reduce((n, part) => n + part.boxes.length, 0),
    destroyed: false, missingLimbs: 0, waistHits: 0, waistSevered: false, torsoLost: false };
}
export function remainingBoxes(body: BodyDamage, part: number): Box[] {
  return PARTS[part].boxes.filter((_, i) => body.alive[part][i]);
}
export type Hit = { part: number; brick: number; t: number; point: Vec3 };
type DetachedPart = { part: number; boxes: Box[] };

function detach(body: BodyDamage, part: number, detached: DetachedPart[], includes?: (box: Box, index: number) => boolean) {
  const boxes: Box[] = [];
  for (const [index, box] of PARTS[part].boxes.entries()) {
    if (!body.alive[part][index] || (includes && !includes(box, index))) continue;
    body.alive[part][index] = 0;
    body.remaining--;
    boxes.push(box);
  }
  if (boxes.length) detached.push({ part, boxes });
  if (part >= 2) body.missingLimbs |= 1 << part;
}

export function breakAt(body: BodyDamage, hit: Hit, direction: Vec3) {
  const { part, brick, point } = hit;
  const removed: Box[] = [];
  const detached: DetachedPart[] = [];
  if (!body.alive[part][brick]) return { removed, detached, collapsed: false };
  body.hits[part]++;
  for (const [i, box] of PARTS[part].boxes.entries()) {
    const dx = box.x - point[0], dy = box.y - point[1], dz = box.z - point[2];
    const along = dx * direction[0] + dy * direction[1] + dz * direction[2];
    const radial = dx * dx + dy * dy + dz * dz - along * along;
    if (body.alive[part][i] && (i === brick || (along > -0.10 && along < 0.19 && radial < 0.045))) {
      body.alive[part][i] = 0;
      body.remaining--;
      removed.push(box);
    }
  }
  if (part === 0) {
    if (!body.waistSevered && point[1] <= waistHitHeight) body.waistHits++;
    const attached = torsoConnectedToHead(body.alive[0]);
    const cutThrough = !hipContacts.some(index => attached[index]);
    const waistBreak = !body.waistSevered && body.waistHits >= waistHitsToBreak;
    if (cutThrough || waistBreak) {
      detach(body, 0, detached, (box, index) => cutThrough ? !attached[index] : box.y < waistSeam);
      if (!body.waistSevered) {
        body.waistSevered = true;
        if ((body.missingLimbs & bothLegs) !== bothLegs) {
          detach(body, 4, detached);
          detach(body, 5, detached);
        }
      }
    }
    body.torsoLost = !torsoBoxes.some((box, index) => box.y >= waistSeam && body.alive[0][index]);
  } else if (body.hits[part] >= PARTS[part].hitsToBreak || remainingBoxes(body, part).length < PARTS[part].boxes.length * 0.18) {
    detach(body, part, detached);
  }
  const collapsed = !body.alive[1].some(Boolean);
  if (collapsed) {
    for (let index = 0; index < PARTS.length; index++) detach(body, index, detached);
    body.destroyed = true;
  }
  return { removed, detached, collapsed };
}

const BODY_BOUNDS = block(-5.9, 0, -2.25, 5.9, 22.5, 3.05, 0);
const PART_BOUNDS = PARTS.map(({ boxes }) => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const box of boxes) for (const [axis, [center, size]] of BOX_AXES.entries()) {
    min[axis] = Math.min(min[axis], box[center] - box[size] / 2);
    max[axis] = Math.max(max[axis], box[center] + box[size] / 2);
  }
  return { x: (min[0] + max[0]) / 2, y: (min[1] + max[1]) / 2, z: (min[2] + max[2]) / 2,
    sx: max[0] - min[0], sy: max[1] - min[1], sz: max[2] - min[2], color: 0 };
});

function rayBox(origin: Vec3, direction: Vec3, box: Box): number {
  let near = 0;
  let far = Infinity;
  for (let axis = 0; axis < 3; axis += 1) {
    const [center, size] = BOX_AXES[axis];
    const relative = origin[axis] - box[center];
    const halfSize = box[size] * 0.5;
    const velocity = direction[axis];
    if (Math.abs(velocity) < 1e-9) {
      if (Math.abs(relative) > halfSize) return Infinity;
      continue;
    }
    const a = (-halfSize - relative) / velocity;
    const b = (halfSize - relative) / velocity;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return Infinity;
  }
  return near;
}

export function hitZombie(
  origin: Vec3,
  direction: Vec3,
  body: BodyDamage,
): Hit | null {
  if (rayBox(origin, direction, BODY_BOUNDS) === Infinity) return null;
  let t = Infinity;
  let part = -1;
  let brick = -1;
  for (let partIndex = 0; partIndex < PARTS.length; partIndex += 1) {
    for (const [i, box] of PARTS[partIndex].boxes.entries()) {
      if (!body.alive[partIndex][i]) continue;
      const distance = rayBox(origin, direction, box);
      if (distance < t) {
        t = distance;
        part = partIndex;
        brick = i;
      }
    }
  }
  if (part < 0) return null;
  return {
    part,
    brick,
    t,
    point: [
      origin[0] + direction[0] * t,
      origin[1] + direction[1] * t,
      origin[2] + direction[2] * t,
    ],
  };
}

export function hitPart(origin: Vec3, direction: Vec3, body: BodyDamage, part: number, limit: number): Hit | null {
  if (rayBox(origin, direction, PART_BOUNDS[part]) >= limit) return null;
  let brick = -1;
  let t = limit;
  for (let index = 0; index < PARTS[part].boxes.length; index++) {
    if (!body.alive[part][index]) continue;
    const distance = rayBox(origin, direction, PARTS[part].boxes[index]);
    if (distance >= t) continue;
    t = distance;
    brick = index;
  }
  if (brick < 0) return null;
  return { part, brick, t, point: [origin[0] + direction[0] * t, origin[1] + direction[1] * t, origin[2] + direction[2] * t] };
}

export type FragmentPose = { matrix: ArrayLike<number>; scale?:number; euler: Vec3 };

export const SMALL_LIMIT = 256;
export const LARGE_LIMIT = 32;

type Bounds = [number, number, number, number, number, number];

export type Fragment = {
  part: number;
  boxes: readonly Box[];
  pivot: Vec3;
  generation: number;
  position: Vec3;
  rotation: Vec3;
  size: number;
  dimensions: Vec3;
  restBounds: Bounds;
  radius: number;
  color: number;
  velocity: Vec3;
  spin: Vec3;
  life: number;
  bounces: number;
  rolling: boolean;
  restRotation: Vec3 | null;
  near: boolean;
};

function makeFragment(): Fragment {
  return {
    part: -1,
    boxes: [],
    pivot: [0, 0, 0],
    generation: 0,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    size: 0,
    dimensions: [0, 0, 0],
    restBounds: [0, 0, 0, 0, 0, 0],
    radius: 0,
    color: 0,
    velocity: [0, 0, 0],
    spin: [0, 0, 0],
    life: 0,
    bounces: 0,
    rolling: false,
    restRotation: null,
    near: false,
  };
}

function place(fragment: Fragment, local: Vec3, origin: Vec3, sine: number, cosine: number, pose?: FragmentPose): void {
  const [x, y, z] = local;
  if (pose) {
    const m = pose.matrix;
    fragment.position[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    fragment.position[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    fragment.position[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    fragment.rotation = [...pose.euler];
    return;
  }
  fragment.position[0] = origin[0] + cosine * x + sine * z;
  fragment.position[1] = origin[1] + y;
  fragment.position[2] = origin[2] - sine * x + cosine * z;
}

// Project the fragment's actual box geometry along a world axis expressed in local space.
function project(fragment: Fragment, x: number, y: number, z: number): [number, number] {
  const dx = Math.abs(x);
  const dy = Math.abs(y);
  const dz = Math.abs(z);
  if (fragment.part < 0) {
    const [width, height, depth] = fragment.dimensions;
    const extent = (dx * width + dy * height + dz * depth) * 0.5;
    return [-extent, extent];
  }
  const [px, py, pz] = fragment.pivot;
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const box of fragment.boxes) {
    const center = x * (box.x - px) + y * (box.y - py) + z * (box.z - pz);
    const extent = (dx * box.sx + dy * box.sy + dz * box.sz) * 0.5;
    minimum = Math.min(minimum, center - extent);
    maximum = Math.max(maximum, center + extent);
  }
  return [minimum, maximum];
}

function groundHeight(fragment: Fragment): number {
  const [x, y, z] = fragment.rotation;
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);
  const [bottom] = project(fragment, cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy);
  return -bottom;
}

function calculateRestBounds(fragment: Fragment): void {
  const [x, y, z] = fragment.rotation;
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);
  const [minX, maxX] = project(fragment, cy * cz, -cy * sz, sy);
  const [minY, maxY] = project(fragment, cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy);
  const [minZ, maxZ] = project(fragment, sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy);
  fragment.restBounds = [minX, minY, minZ, maxX, maxY, maxZ];
}

function faceDown([x, y, z]: Vec3): Vec3 {
  const halfTurn = Math.PI;
  const quarterTurn = Math.PI / 2;
  // Either an X/Y face or a Z face can face the ground. Preserve the free yaw.
  const xyFace: Vec3 = [Math.round(x / halfTurn) * halfTurn, y, Math.round(z / quarterTurn) * quarterTurn];
  const zFace: Vec3 = [Math.round((x - quarterTurn) / halfTurn) * halfTurn + quarterTurn, Math.round(y / halfTurn) * halfTurn, z];
  const xyDistance = (xyFace[0] - x) ** 2 + (xyFace[2] - z) ** 2;
  const zDistance = (zFace[0] - x) ** 2 + (zFace[1] - y) ** 2;
  return xyDistance <= zDistance ? xyFace : zFace;
}

export class FragmentPool {
  readonly active: Fragment[] = [];
  private readonly smallFree = Array.from({ length: SMALL_LIMIT }, makeFragment);
  private readonly largeFree = Array.from({ length: LARGE_LIMIT }, makeFragment);
  private seed = 0x7a31b529;

  get smallActive(): number {
    return SMALL_LIMIT - this.smallFree.length;
  }

  get largeActive(): number {
    return LARGE_LIMIT - this.largeFree.length;
  }

  private sample(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private recycle(index: number): void {
    const fragment = this.active[index];
    const last = this.active.pop()!;
    if (index < this.active.length) this.active[index] = last;
    fragment.boxes = [];
    (fragment.part < 0 ? this.smallFree : this.largeFree).push(fragment);
  }

  reset(): void {
    while (this.active.length > 0) this.recycle(this.active.length - 1);
    this.seed = 0x7a31b529;
  }

  spawn(
    partIndex: number, _localHit: Vec3, bodyPosition: Vec3, bodyYaw: number,
    shotDirection: Vec3, smallCount: number, removed: readonly Box[], detached: readonly Box[] = [], pose?: FragmentPose,
  ): void {
    if (smallCount <= 0 && !detached.length) return;
    const scale=pose?.scale??1;
    const near = smallCount > 4;
    const sine = Math.sin(bodyYaw), cosine = Math.cos(bodyYaw);
    const allocate = (large: boolean) => {
      const free = large ? this.largeFree : this.smallFree;
      if (!free.length) {
        let replace = this.active.findIndex(f => (f.part >= 0) === large && !f.near);
        if (replace < 0 && near) replace = this.active.findIndex(f => (f.part >= 0) === large);
        if (replace >= 0) this.recycle(replace);
      }
      const fragment = free.pop();
      if (fragment) {
        fragment.generation++;
        fragment.near = near;
        fragment.bounces = 0;
        fragment.rolling = false;
        fragment.restRotation = null;
        fragment.life = 4.5;
      }
      return fragment;
    };
    if (detached.length) {
      const chunk = allocate(true);
      if (chunk) {
        chunk.part = partIndex;
        chunk.boxes = detached;
        const bounds: Bounds = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
        for (const box of detached) {
          bounds[0] = Math.min(bounds[0], box.x - box.sx * 0.5);
          bounds[1] = Math.min(bounds[1], box.y - box.sy * 0.5);
          bounds[2] = Math.min(bounds[2], box.z - box.sz * 0.5);
          bounds[3] = Math.max(bounds[3], box.x + box.sx * 0.5);
          bounds[4] = Math.max(bounds[4], box.y + box.sy * 0.5);
          bounds[5] = Math.max(bounds[5], box.z + box.sz * 0.5);
        }
        chunk.pivot = [(bounds[0] + bounds[3]) * 0.5, (bounds[1] + bounds[4]) * 0.5, (bounds[2] + bounds[5]) * 0.5];
        chunk.radius = Math.hypot(bounds[3] - bounds[0], bounds[4] - bounds[1], bounds[5] - bounds[2]) * 0.5;
        if(scale!==1){
          const [px,py,pz]=chunk.pivot;
          chunk.boxes=detached.map(b=>({...b,x:px+(b.x-px)*scale,y:py+(b.y-py)*scale,z:pz+(b.z-pz)*scale,
            sx:b.sx*scale,sy:b.sy*scale,sz:b.sz*scale}));
          chunk.radius*=scale;
        }
        chunk.rotation = [0, bodyYaw, 0];
        place(chunk, chunk.pivot, bodyPosition, sine, cosine, pose);
        const side = chunk.pivot[0] < 0 ? -1 : 1;
        const forwardSpeed = 1.15 + this.sample() * 0.6;
        const lateralSpeed = 0.55 + this.sample() * 0.7;
        chunk.velocity = [shotDirection[0] * forwardSpeed + side * lateralSpeed,
          1.1 + this.sample() * 0.6, shotDirection[2] * forwardSpeed + 0.3];
        chunk.spin = [(2.1 + this.sample() * 1.5) * (this.sample() < 0.35 ? -1 : 1),
          side * (1.2 + this.sample() * 1.2), side * (3.6 + this.sample() * 2.4)];
        this.active.push(chunk);
      }
      return;
    }
    const count = Math.min(smallCount, removed.length);
    for (let index = 0; index < count; index++) {
      const crumb = allocate(false);
      if (!crumb) break;
      // Sample the actual removed material once, keeping each voxel's shape and colour.
      const source = removed[Math.floor(index * removed.length / count)];
      crumb.part = -1;
      crumb.color = source.color;
      crumb.dimensions = [source.sx*scale, source.sy*scale, source.sz*scale];
      crumb.size = Math.max(...crumb.dimensions);
      crumb.radius = Math.hypot(...crumb.dimensions) * 0.5;
      crumb.rotation = [0, bodyYaw, 0];
      place(crumb, [source.x, source.y, source.z], bodyPosition, sine, cosine, pose);
      const speed = 1.25 + this.sample() * 1.45;
      // Most ejecta follows the shot, with back-spatter at the entry wound.
      const sign = index % 4 === 0 ? -0.7 : 1;
      crumb.velocity = [shotDirection[0] * speed * sign + (this.sample() - 0.5) * 2.2,
        shotDirection[1] * speed * sign + 1.1 + this.sample() * 1.5,
        shotDirection[2] * speed * sign + (this.sample() - 0.5) * 1.8];
      crumb.spin = [(this.sample() - 0.5) * 16, (this.sample() - 0.5) * 16, (this.sample() - 0.5) * 16];
      this.active.push(crumb);
    }
  }

  step(
    dt: number,
    onSettled?: (fragment: Readonly<Fragment>) => void,
    surfaceAt?: (x: number, z: number) => number,
  ): void {
    const step = Math.min(dt, 0.05);
    if (step <= 0) return;
    const slideDamping = Math.exp(-7 * step);
    const rollDamping = Math.exp(-5.5 * step);
    const settleEase = 1 - Math.exp(-16 * step);
    for (let index = this.active.length - 1; index >= 0; index--) {
      const fragment = this.active[index];
      const { position, rotation, velocity, spin } = fragment;
      fragment.life -= step;
      position[0] += velocity[0] * step;
      position[2] += velocity[2] * step;
      const support = surfaceAt?.(position[0], position[2]) ?? 0;
      if (!fragment.rolling) {
        velocity[1] -= 9.8 * step;
        position[1] += velocity[1] * step;
        for (let axis = 0; axis < 3; axis++) rotation[axis] += spin[axis] * step;
        if (position[1] <= support + fragment.radius) {
          const floor = support + groundHeight(fragment);
          if (position[1] <= floor) {
            position[1] = floor;
            if (velocity[1] <= 0) {
              const rebound = -velocity[1] * (fragment.bounces === 0 ? 0.33 : 0.22);
              velocity[0] *= 0.65;
              velocity[2] *= 0.65;
              if (fragment.bounces < 3 && rebound > 0.45) {
                fragment.bounces++;
                velocity[1] = rebound;
                for (let axis = 0; axis < 3; axis++) spin[axis] *= 0.66;
              } else {
                fragment.rolling = true;
                velocity[1] = 0;
                const inverseRadius = 0.45 / Math.max(fragment.radius, 0.05);
                spin[0] += velocity[2] * inverseRadius;
                spin[2] -= velocity[0] * inverseRadius;
              }
            }
          }
        }
      } else {
        velocity[0] *= slideDamping;
        velocity[2] *= slideDamping;
        for (let axis = 0; axis < 3; axis++) {
          rotation[axis] += spin[axis] * step;
          spin[axis] *= rollDamping;
        }
        if (Math.hypot(...spin) < 0.7) fragment.restRotation ??= faceDown(rotation);
        const rest = fragment.restRotation;
        if (rest) {
          for (let axis = 0; axis < 3; axis++) rotation[axis] += (rest[axis] - rotation[axis]) * settleEase;
          const tilt = Math.hypot(rest[0] - rotation[0], rest[1] - rotation[1], rest[2] - rotation[2]);
          if (tilt < 0.02 && Math.hypot(velocity[0], velocity[2]) < 0.04) {
            fragment.rotation = rest;
            calculateRestBounds(fragment);
            position[1] = support - fragment.restBounds[1];
            velocity.fill(0);
            spin.fill(0);
            onSettled?.(fragment);
            this.recycle(index);
            continue;
          }
        }
        position[1] = support + groundHeight(fragment);
      }
      // A saturated pool can retire moving debris. Persistence is only earned by coming to rest.
      if (fragment.life <= 0) this.recycle(index);
    }
  }
}
