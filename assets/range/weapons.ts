import type { Vec3 } from './fracture.ts';

export const WEAPONS = ['rifle', 'shotgun', 'grenade'] as const;
export type Weapon = typeof WEAPONS[number];
export const SHOTGUN_PELLETS = 9;
export const GRENADE_FUSE = 1.35;
export const GRENADE_RADIUS = 3.1;
export const FIRE_INTERVAL: Record<Weapon, number> = { rifle: 0.125, shotgun: 0.55, grenade: 0.65 };

export type Grenade = { start: Vec3; target: Vec3; age: number };

export function grenadePosition({ start, target, age }: Grenade): Vec3 {
  const travel = Math.min(age / 0.72, 1);
  const bounce = Math.min(Math.max((age - 0.72) / 0.25, 0), 1);
  return [
    start[0] + (target[0] - start[0]) * travel,
    start[1] + (target[1] - start[1]) * travel + 4.8 * travel * (1 - travel) + 0.27 * Math.sin(bounce * Math.PI),
    start[2] + (target[2] - start[2]) * travel,
  ];
}

export function pelletTarget(center: Vec3, right: Vec3, up: Vec3, spread: number, pellet: number, shot: number): Vec3 {
  if (!pellet) return center;
  const angle = pellet * 2.399963 + shot * 0.7;
  const radius = Math.sqrt(pellet / (SHOTGUN_PELLETS - 1)) * spread;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return [center[0] + right[0] * x + up[0] * y,
    center[1] + right[1] * x + up[1] * y, center[2] + right[2] * x + up[2] * y];
}
