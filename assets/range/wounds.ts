import { PALETTE, PARTS, type BodyDamage, type Box } from './fracture.ts';

export const WOUND_COLORS = [...PALETTE, '#901022', '#e3283c', '#d5a193', '#ac7468', '#a54269', '#6e152d', '#f97670', '#3e101d'];
const wetBlood = 16, freshBlood = 17, bone = 18, boneShade = 19;
const organ = 20, organShadow = 21, organHighlight = 22, cavity = 23;
const axes = [['x', 'sx'], ['y', 'sy'], ['z', 'sz']] as const;
type CutFace = { solid: number; removed: number; axis: number; sign: number; face: Box };

function findCutFaces(boxes: readonly Box[]): CutFace[] {
  const faces: CutFace[] = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    for (const [axis, [coordinate, size]] of axes.entries()) {
      const delta = b[coordinate] - a[coordinate];
      if (Math.abs(Math.abs(delta) - (a[size] + b[size]) / 2) > 0.0005) continue;
      const sign = Math.sign(delta);
      const face: Box = { x: a.x, y: a.y, z: a.z, sx: 0, sy: 0, sz: 0, color: wetBlood };
      face[coordinate] += sign * a[size] / 2;
      let touches = true;
      for (const [other, [center, extent]] of axes.entries()) {
        if (other === axis) continue;
        const lo = Math.max(a[center] - a[extent] / 2, b[center] - b[extent] / 2);
        const hi = Math.min(a[center] + a[extent] / 2, b[center] + b[extent] / 2);
        if (hi - lo < 0.026) { touches = false; break; }
        face[center] = (lo + hi) / 2;
        face[extent] = hi - lo;
      }
      if (!touches) continue;
      faces.push({ solid: i, removed: j, axis, sign, face }, { solid: j, removed: i, axis, sign: -sign, face });
    }
  }
  return faces;
}

const cutFaces = PARTS.map(part => findCutFaces(part.boxes));

function inlay(face: Box, axis: number, sign: number, thickness: number, inset: number, tint: number): Box {
  const result = { ...face, color: tint };
  for (const [index, [center, size]] of axes.entries()) {
    if (index === axis) {
      result[size] = thickness;
      result[center] += sign * thickness * 0.49;
    } else result[size] *= inset;
  }
  return result;
}

export function woundDetails(body: BodyDamage, part: number): Box[] {
  const details: Box[] = [];
  const alive = body.alive[part];
  for (const { solid, removed, axis, sign, face } of cutFaces[part]) {
    if (!alive[solid] || alive[removed]) continue;
    const variation = (removed + solid * 13 + axis * 7) % 11;
    details.push(inlay(face, axis, sign, 0.004, 0.995, variation < (part === 0 ? 3 : 1) ? freshBlood : wetBlood));
    if (part === 0) {
      const lobe = variation < 3 ? organShadow : variation < 8 ? organ : organHighlight;
      details.push(inlay(face, axis, sign, 0.024, 0.66 + (variation % 3) * 0.085, lobe));
    } else {
      const socket = part === 1 && face.y > 2.39 && face.y < 2.51 && Math.abs(face.x) > 0.07 && axis === 2;
      const showsBone = !socket && (variation === 3 || variation === 7 || variation === 9);
      const tint = showsBone ? (variation === 7 ? bone : boneShade) : (socket || variation < 4 ? cavity : organShadow);
      details.push(inlay(face, axis, sign, 0.012, showsBone ? 0.46 : 0.86, tint));
    }
    if (details.length >= 180) break;
  }

  if (part === 0) for (let limb = 2; limb < 6; limb++) {
    if (!(body.missingLimbs & (1 << limb)) || (limb >= 4 && body.waistSevered)) continue;
    const side = limb % 2 === 0 ? -1 : 1;
    const arm = limb < 4;
    const face: Box = arm ? { x: side * 0.439, y: 1.87, z: 0.02, sx: 0, sy: 0.22, sz: 0.265, color: wetBlood }
      : { x: side * 0.23, y: 0.997, z: 0.02, sx: 0.245, sy: 0, sz: 0.25, color: wetBlood };
    details.push(inlay(face, arm ? 0 : 1, arm ? side : -1, 0.018, 1, wetBlood),
      inlay(face, arm ? 0 : 1, arm ? side : -1, 0.045, 0.38, boneShade));
  }
  return details;
}
