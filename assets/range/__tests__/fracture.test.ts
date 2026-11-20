import { describe, it, expect } from 'vitest';
import { PARTS, createBodyDamage, hitZombie, hitPart, breakAt, remainingBoxes, FragmentPool, SMALL_LIMIT, LARGE_LIMIT, type Fragment, type Vec3 } from '../fracture.ts';
import { createMotion, localPoint, localVector, movementMode, toWorld, walk } from '../motion.ts';

describe('ballistic body destruction', () => {
  it('keeps world-space head shots aligned with the human-scale rendered pose',()=>{
    const body=createBodyDamage(),motion=createMotion(),origin:Vec3=[3,0,-9];
    walk(motion,body,origin,origin,0,0);
    const pose=motion.parts[1],head=toWorld(pose,PARTS[1].pivot);
    expect(head[1]).toBeGreaterThan(1.6);expect(head[1]).toBeLessThan(1.85);
    const eye:Vec3=[head[0],head[1],head[2]+8];
    const hit=hitPart(localPoint(pose,eye),localVector(pose,[0,0,-1]),body,1,10)!;
    const point=toWorld(pose,hit.point);
    expect(hit.t).toBeCloseTo(eye[2]-point[2]);
    expect(point[0]).toBeCloseTo(eye[0]);expect(point[1]).toBeCloseTo(eye[1]);
  });
  it('each of six regions responds to repeated front and back shots', () => {
    for (let part = 0; part < 6; part++) for (const side of [-1, 1]) {
      const body = createBodyDamage();
      const [x,y] = PARTS[part].pivot;
      const direction: Vec3 = [0, 0, -side];
      let previous = body.remaining;
      for (let shot = 0; shot < 2; shot++) {
        const hit = hitZombie([x, y, side * 5], direction, body)!;
        expect(hit?.part).toBe(part);
        const result = breakAt(body, hit, direction);
        expect(result.removed.length).toBeGreaterThan(0);
        expect(body.remaining).toBeLessThan(previous);
        expect(body.hits[part]).toBe(shot + 1);
        previous = body.remaining;
      }
    }
  });
  it('passes through a drilled hole without re-hitting removed cells', () => {
    const body = createBodyDamage();
    let previous = 0;
    for (let shot = 0; shot < 4; shot++) {
      const hit = hitZombie([0, 1.7, 5], [0, 0, -1], body)!;
      expect(hit.t).toBeGreaterThan(previous);
      previous = hit.t;
      breakAt(body, hit, [0, 0, -1]);
    }
    expect(hitZombie([0, 1.7, 5], [0, 0, -1], body)).toBeNull();
  });
  it('keeps a limbless zombie alive until the head breaks completely', () => {
    const body = createBodyDamage();
    for (const part of [2, 3, 4, 5, 1]) {
      if (part === 1) {
        expect(movementMode(body)).toBe('wriggle');
        expect(remainingBoxes(body, 0).length).toBeGreaterThan(0);
      }
      for (let i = 0; i < PARTS[part].hitsToBreak; i++) {
        const box = remainingBoxes(body, part)[0];
        if (!box) break;
        const hit = hitZombie([box.x, box.y, 5], [0,0,-1], body)!;
        breakAt(body, hit, [0,0,-1]);
        expect(body.destroyed).toBe(part === 1 && !body.alive[1].some(Boolean));
      }
    }
    expect(body.destroyed).toBe(true);
    expect(body.remaining).toBe(0);
    expect(body.alive.every(mask => mask.every(n => n === 0))).toBe(true);
    expect(hitZombie([0, 1.5, 5], [0,0,-1], body)).toBeNull();
  });
  it('severs the waist while preserving the head, arms, and upper torso', () => {
    const body = createBodyDamage();
    const detached: number[] = [];
    for (const x of [-0.26, 0.27, 0]) {
      const hit = hitZombie([x, 1.17, 5], [0, 0, -1], body)!;
      expect(hit?.part).toBe(0);
      detached.push(...breakAt(body, hit, [0, 0, -1]).detached.map(section => section.part));
    }
    expect(detached).toEqual([0, 4, 5]);
    expect(body.waistSevered).toBe(true);
    expect(movementMode(body)).toBe('waist-crawl');
    expect(remainingBoxes(body, 0).every(box => box.y >= 1.25)).toBe(true);
    expect(body.alive.slice(1, 4).every(mask => mask.every(Boolean))).toBe(true);
    expect(body.remaining).toBe(body.alive.reduce((sum, cells) => sum + cells.reduce((n, cell) => n + cell, 0), 0));
  });
  it.each([
    { name: 'level', heights: [1.72, 1.72, 1.72, 1.72, 1.72] },
    { name: 'stepped', heights: [1.62, 1.66, 1.70, 1.74, 1.78] },
  ])('severs the torso across a $name chest cut once the last connection is gone', ({ heights }) => {
    const body = createBodyDamage();
    const direction: Vec3 = [0, 0, -1];
    const severed: ReturnType<typeof breakAt>['detached'] = [];
    for (const [column, x] of [-0.35, -0.17, 0, 0.17, 0.35].entries()) {
      while (!body.waistSevered) {
        const hit = hitZombie([x, heights[column], 5], direction, body);
        if (!hit) break;
        expect(hit.part).toBe(0);
        severed.push(...breakAt(body, hit, direction).detached);
      }
      if (column === 0) {
        expect(body.hits[0]).toBeGreaterThan(1);
        expect(body.waistSevered).toBe(false);
        expect(movementMode(body)).toBe('chase');
      }
    }
    expect(body.waistHits).toBe(0);
    expect(body.waistSevered).toBe(true);
    expect(movementMode(body)).toBe('waist-crawl');
    expect(severed.map(chunk => chunk.part)).toEqual([0, 4, 5]);
    expect(severed[0].boxes.some(box => box.y > 1.4)).toBe(true);
    expect(remainingBoxes(body, 0).every(box => box.y > 1.4)).toBe(true);
    expect(remainingBoxes(body, 0).length).toBeGreaterThan(0);
    expect(body.alive.slice(1, 4).every(mask => mask.every(Boolean))).toBe(true);
    expect(body.destroyed).toBe(false);
  });
  it('survives even when the torso voxels have all been removed', () => {
    const body = createBodyDamage();
    for (let brick = 0; brick < PARTS[0].boxes.length; brick++) {
      const box = PARTS[0].boxes[brick];
      breakAt(body, { part: 0, brick, t: 0, point: [box.x, box.y, box.z] }, [0, 0, -1]);
    }
    expect(remainingBoxes(body, 0)).toEqual([]);
    expect(body.torsoLost).toBe(true);
    expect(body.destroyed).toBe(false);
    expect(body.alive[1].every(Boolean)).toBe(true);
  });
  it('keeps fresh impacts visible at pool capacity and recycles every fragment', () => {
    const pool = new FragmentPool();
    const part = PARTS[2];
    for (let i = 0; i < 100; i++) {
      pool.spawn(2, part.pivot, [0,0,0], 0, [0,0,-1], 16, part.boxes);
      pool.spawn(2, part.pivot, [0,0,0], 0, [0,0,-1], 16, [], part.boxes);
    }
    expect(pool.smallActive).toBe(SMALL_LIMIT);
    expect(pool.largeActive).toBe(LARGE_LIMIT);
    const last = pool.active[pool.active.length - 1];
    expect(last.life).toBeGreaterThan(1);
    for (let i = 0; i < 270; i++) pool.step(1 / 60);
    expect(pool.active.length).toBe(0);
    expect(pool.smallActive + pool.largeActive).toBe(0);
  });
  it('bounces and tumbles loose voxels and body sections before settling their actual geometry', () => {
    const pool = new FragmentPool();
    const part = PARTS[2];
    const [voxel, ...section] = part.boxes;
    const impact: Vec3 = [voxel.x, voxel.y, voxel.z];
    pool.spawn(2, impact, [0,0,0], 0, [0,0,-1], 1, [voxel]);
    pool.spawn(2, impact, [0,0,0], 0, [0,0,-1], 16, [], section);
    const supportHeight = 0.22;
    const settled = new Map<number, { bottom: number; bounces: number; dimensions: Vec3; boxCount: number }>();
    const rolling = new Set<number>();
    const onSettled = (fragment: Readonly<Fragment>) => {
      settled.set(fragment.part, {
        bottom: fragment.position[1] + fragment.restBounds[1],
        bounces: fragment.bounces,
        dimensions: [...fragment.dimensions],
        boxCount: fragment.boxes.length,
      });
    };
    for (let i = 0; i < 270 && pool.active.length; i++) {
      const rotating = pool.active.map(fragment => ({ fragment, rotation: [...fragment.rotation] }));
      pool.step(1 / 60, onSettled, () => supportHeight);
      for (const { fragment, rotation } of rotating) {
        if (fragment.bounces > 0 && fragment.rotation.some((value, axis) => value !== rotation[axis])) {
          rolling.add(fragment.part);
        }
      }
    }
    expect(pool.active.length).toBe(0);
    for (const index of [-1, 2]) {
      const fragment = settled.get(index)!;
      expect(fragment.bottom).toBeCloseTo(supportHeight);
      expect(fragment.bounces).toBeGreaterThan(0);
      expect(rolling.has(index)).toBe(true);
    }
    expect(settled.get(-1)?.dimensions).toEqual([voxel.sx, voxel.sy, voxel.sz]);
    expect(settled.get(2)?.boxCount).toBe(section.length);
  });
});
