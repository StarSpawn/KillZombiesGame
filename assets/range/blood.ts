import type { Vec3 } from './fracture.ts';

export const BLOOD_COLORS = ['#a6061e', '#ea102c', '#ff414c'] as const;
export const BLOOD_LIMIT = 768;

type BloodParticle = {
  position: Vec3;
  rotation: Vec3;
  velocity: Vec3;
  spin: Vec3;
  color: number;
  size: number;
  fullSize: number;
  life: number;
};

function makeParticle(): BloodParticle {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    spin: [0, 0, 0],
    color: 0,
    size: 0,
    fullSize: 0,
    life: 0,
  };
}

export class BloodPool {
  private readonly particles: BloodParticle[] = [];
  private readonly free = Array.from({ length: BLOOD_LIMIT }, makeParticle);
  private replaceIndex = 0;
  private seed = 0xdb5a7821;

  get active(): readonly Readonly<BloodParticle>[] {
    return this.particles;
  }

  clear() {
    for (const particle of this.particles) this.free.push(particle);
    this.particles.length = 0;
    this.replaceIndex = 0;
    this.seed = 0xdb5a7821;
  }

  spray(origin: Vec3, direction: Vec3, count: number, force = 1) {
    const amount = Math.min(Math.floor(count), BLOOD_LIMIT);
    for (let index = 0; index < amount; index++) {
      const particle = this.free.pop() ?? this.particles[this.replaceIndex++ % BLOOD_LIMIT];
      if (this.particles.length < BLOOD_LIMIT) this.particles.push(particle);

      const shade = this.sample();
      particle.color = shade < 0.2 ? 0 : shade < 0.77 ? 1 : 2;
      const size = this.sample();
      particle.fullSize = size < 0.17 ? 0.11 + this.sample() * 0.06 : 0.036 + this.sample() * 0.064;
      particle.size = particle.fullSize;
      particle.life = 0.65 + this.sample() * 0.6;

      // A wide exit plume and visible backscatter mark both sides of the impact.
      const impulse = force * (this.sample() < 0.59 ? -2.3 - this.sample() * 3.6 : 0.8 + this.sample() * 3.0);
      for (let axis = 0; axis < 3; axis++) {
        particle.position[axis] = origin[axis] + (this.sample() - 0.5) * 0.14;
        particle.rotation[axis] = this.sample() * Math.PI;
        particle.velocity[axis] = direction[axis] * impulse + (this.sample() - 0.5) * 6 * force;
        particle.spin[axis] = (this.sample() - 0.5) * 27;
      }
      particle.velocity[1] += (1.4 + this.sample() * 2.7) * force;
    }
  }

  step(dt: number) {
    if (dt <= 0) return;
    const step = Math.min(dt, 0.05);
    for (let index = this.particles.length - 1; index >= 0; index--) {
      const particle = this.particles[index];
      particle.life -= step;
      if (particle.life <= 0) {
        const last = this.particles.pop()!;
        if (index < this.particles.length) this.particles[index] = last;
        this.free.push(particle);
        continue;
      }

      const { position, rotation, velocity, spin } = particle;
      particle.size = particle.fullSize * Math.min(1, particle.life * 3.1);
      velocity[1] -= 13.5 * step;
      for (let axis = 0; axis < 3; axis++) {
        position[axis] += velocity[axis] * step;
        rotation[axis] += spin[axis] * step;
      }
      const floor = particle.size * 0.65;
      if (position[1] <= floor) {
        position[1] = floor;
        if (velocity[1] < 0) velocity[1] *= -0.28;
        velocity[0] *= 0.6;
        velocity[2] *= 0.6;
      }
    }
  }

  private sample() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
}
