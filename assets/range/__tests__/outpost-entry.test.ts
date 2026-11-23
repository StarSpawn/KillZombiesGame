import { describe, it, expect } from 'vitest';
import type { Vec3 } from '../fracture.ts';
import { DECK, entryPath, FENCE_Z, fenceBays } from '../outpost.ts';
import { firstBuilding } from '../district.ts';

function sight(from:Vec3,to:Vec3){
  const delta:Vec3=[to[0]-from[0],to[1]-from[1],to[2]-from[2]];
  const length=Math.hypot(...delta);
  return firstBuilding(from,delta.map(v=>v/length) as Vec3,length)/length;
}

describe('Berlin street entrances',()=>{
  it('conceals the entire spawning body even at the extremes of the jumping platform',()=>{
    for(let wave=1;wave<=2;wave++)for(let i=0;i<30;i++){
      const [start]=entryPath(i,wave);
      for(const x of [-3.98,3.98])for(const z of [.43,6.32])for(const y of [DECK+1.65,DECK+3.05]){
        for(const side of [-.6,.6])for(const height of [.1,2.1]){
          expect(sight([x,y,z],[start[0]+side,height,start[2]+.4])).toBeLessThan(.99);
        }
      }
    }
  });
  it('routes each arrival around the building and into view before it reaches the mesh',()=>{
    for(let wave=1;wave<=2;wave++)for(let i=0;i<30;i++){
      const path=entryPath(i,wave);
      for(let n=1;n<path.length;n++){
        expect(sight([path[n-1][0],1,path[n-1][2]],[path[n][0],1,path[n][2]])).toBe(1);
      }
      expect(sight([0,DECK+1.68,3.4],[path[2][0],1.7,path[2][2]])).toBe(1);
      expect(path[2][2]).toBeLessThan(FENCE_Z-6);
    }
    expect(fenceBays[0]*3).toBe(-132);
    expect((fenceBays.at(-1)!+1)*3).toBe(132);
  });
});
