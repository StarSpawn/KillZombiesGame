import { mat4, quat } from '@forgeax/engine/math';
import { PARTS, type BodyDamage, type FragmentPose, type Vec3 } from './fracture.ts';

export function movementMode(body: BodyDamage) {
  if (body.destroyed) return 'dead';
  const legs = body.missingLimbs & 0b110000;
  if (legs === 0b110000) {
    if ((body.missingLimbs & 0b001100) === 0b001100) return 'wriggle';
    return body.waistSevered ? 'waist-crawl' : 'crawl';
  }
  return legs ? 'hop' : 'chase';
}

type PartPose = {
  matrix: ReturnType<typeof mat4.create>;
  rotation: ReturnType<typeof quat.create>;
  position: Vec3;
};

const pivots: Vec3[] = [[0, 0, 0], [0, 2.17, 0], [-0.56, 1.99, 0], [0.56, 1.99, 0], [-0.23, 1.0, 0], [0.23, 1.0, 0]];
export const BODY_SCALE=.68;
export const bodyScale:Vec3=[BODY_SCALE,BODY_SCALE,BODY_SCALE];
const rootPivot: Vec3 = [0, 1.0, 0];

export function createMotion() {
  return {
    yaw: 0, age: 0, modeAge: 0, fallProgress: 0, mode: 'chase' as ReturnType<typeof movementMode>,
    root: quat.create(), local: quat.create(), bodyRotation: quat.create(), rootMatrix: mat4.create(), origin: [0, 0, 0] as Vec3,
    parts: PARTS.map((): PartPose => ({ matrix: mat4.create(), rotation: quat.create(), position: [0, 0, 0] })),
  };
}

export type Motion = ReturnType<typeof createMotion>;

export function toWorld(pose: PartPose, [x, y, z]: Vec3): Vec3 {
  const m = pose.matrix;
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}

export function localVector(pose: PartPose, [x, y, z]: Vec3): Vec3 {
  const m = pose.matrix;
  const square=BODY_SCALE*BODY_SCALE;
  return [(m[0]*x+m[1]*y+m[2]*z)/square,(m[4]*x+m[5]*y+m[6]*z)/square,(m[8]*x+m[9]*y+m[10]*z)/square];
}

export function localPoint(pose: PartPose, point: Vec3): Vec3 {
  return localVector(pose, [point[0] - pose.position[0], point[1] - pose.position[1], point[2] - pose.position[2]]);
}

export function fragmentPose(pose: PartPose): FragmentPose {
  const m = pose.matrix;
  const sine = Math.min(1, Math.max(-1, m[8]/BODY_SCALE));
  const pitch = Math.abs(sine) < 0.999999 ? Math.atan2(-m[9], m[10]) : Math.atan2(m[6], m[5]);
  return { matrix: m, scale:BODY_SCALE, euler: [pitch, Math.asin(sine), Math.abs(sine) < 0.999999 ? Math.atan2(-m[4], m[0]) : 0] };
}

export function walk(motion: Motion, body: BodyDamage, position: Vec3, target: Vec3, phaseOffset: number, dt: number, windup = 0) {
  const mode = movementMode(body);
  if (mode === 'dead') return;
  motion.age += dt;
  motion.modeAge = mode === motion.mode ? motion.modeAge + dt : 0;
  motion.mode = mode;

  const dx = target[0] - position[0], dz = target[2] - position[2];
  const distance = Math.hypot(dx, dz);
  const grounded = mode === 'crawl' || mode === 'waist-crawl' || mode === 'wriggle';
  const wriggling = mode === 'wriggle';
  const speed = wriggling ? 0.22 : grounded ? 0.46 : mode === 'hop' ? 0.67 : 0.80;
  const phase = motion.age * 6.9 + phaseOffset;
  const hop = Math.max(0, Math.sin(motion.modeAge * 7.1));
  const ripple = Math.sin(phase * 0.56);
  const stride = mode === 'hop' ? 0.6 + hop * 0.8 : wriggling ? 0.26 + Math.max(0, ripple) * 1.16 : 1;
  const travel = Math.min(Math.max(0, distance - 1.18), speed * stride * dt);
  if (distance > 1.18) {
    position[0] += dx / distance * travel;
    position[2] += dz / distance * travel;
    motion.yaw = Math.atan2(dx, dz);
  }

  if (grounded) motion.fallProgress = Math.min(1, motion.fallProgress + dt / 0.46);
  const fall = motion.fallProgress;
  const prone = fall * fall * (3 - 2 * fall);
  const cycle = Math.sin(phase);
  const standingHeight = mode === 'hop' ? 0.32 * hop : 0.026 * Math.abs(cycle);
  const groundHeight = body.torsoLost ? 0.17 : wriggling ? 0.29 + 0.025 * ripple : body.waistSevered ? 0.32 : 0.37;
  const hipHeight = (1 + standingHeight) * (1 - prone) + groundHeight * prone;
  const supportingSide = body.missingLimbs & (1 << 4) ? 1 : -1;
  quat.fromEuler(motion.root, 0, motion.yaw, 0, 'XYZ');
  const pitch = wriggling ? 1.45 + 0.06 * ripple : 1.38;
  const tilt = mode === 'hop' ? -supportingSide * 0.14 : wriggling ? 0.12 * ripple : 0.025 * cycle;
  quat.fromEuler(motion.local, pitch * prone, 0, tilt, 'XYZ');
  quat.multiply(motion.bodyRotation, motion.root, motion.local);
  mat4.compose(motion.rootMatrix, position, motion.bodyRotation, bodyScale);
  const m = motion.rootMatrix;
  motion.origin[0] = position[0] - m[4] * rootPivot[1];
  motion.origin[1] = hipHeight*BODY_SCALE - m[5] * rootPivot[1];
  motion.origin[2] = position[2] - m[6] * rootPivot[1];

  for (const [part, pose] of motion.parts.entries()) {
    const side = part % 2 === 0 ? -1 : 1;
    let pitch = 0;
    if (part === 1) pitch = -0.90 * prone + (wriggling ? 0.16 * ripple : 0.04 * cycle);
    else if (part >= 4) pitch = mode === 'hop' ? 0.16 - 0.40 * hop : side * 0.33 * cycle;
    else if (part >= 2) pitch = -1.37 - 1.03 * prone + side * cycle * (0.10 + 0.32 * prone) - windup * (side < 0 ? .92 : .55);
    quat.fromEuler(motion.local, pitch, 0, 0, 'XYZ');
    quat.multiply(pose.rotation, motion.bodyRotation, motion.local);
    mat4.compose(pose.matrix, motion.origin, pose.rotation, bodyScale);
    const [x, y, z] = pivots[part];
    const r = pose.matrix;
    pose.position[0] = motion.origin[0] + (m[0] - r[0]) * x + (m[4] - r[4]) * y + (m[8] - r[8]) * z;
    pose.position[1] = motion.origin[1] + (m[1] - r[1]) * x + (m[5] - r[5]) * y + (m[9] - r[9]) * z;
    pose.position[2] = motion.origin[2] + (m[2] - r[2]) * x + (m[6] - r[6]) * y + (m[10] - r[10]) * z;
    r[12] = pose.position[0]; r[13] = pose.position[1]; r[14] = pose.position[2];
  }
}
