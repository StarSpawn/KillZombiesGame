import { describe, it, expect } from 'vitest';
import type { Vec3 } from '../fracture.ts';
import { DECK, WALK_X, entryPath, entryKind, FENCE_Z, fenceBays, outpost } from '../outpost.ts';
import { waveCount, waveChoices } from '../waves.ts';
import { ARMORY, BOUNTY, equip, initialWallet, restoreWallet } from '../loadout.ts';
import { district, firstBuilding } from '../district.ts';

function sight(from:Vec3,to:Vec3){
  const delta:Vec3=[to[0]-from[0],to[1]-from[1],to[2]-from[2]];
  const length=Math.hypot(...delta);
  return firstBuilding(from,delta.map(v=>v/length) as Vec3,length)/length;
}

describe('Berlin street entrances',()=>{
  it('lists the larger waves and lets the player buy the rifle with the first clear',()=>{
    expect([1,2,3].map(waveCount)).toEqual([8,12,16]);
    expect(waveChoices(1,1)).toEqual([1,2]);
    const wallet=initialWallet();wallet.cash=waveCount(1)*BOUNTY;
    expect(wallet.cash).toBe(ARMORY.mosin.price);
    expect(equip(wallet,'mosin')).toBe(true);
    expect(wallet.cash).toBe(0);
    expect(restoreWallet(wallet).owned).toEqual(['g18','mosin']);
  });
  it('keeps fixed scenery below sight level in the apron ahead of the gallery',()=>{
    const blockers=[...outpost,...district].filter(b=>
      Math.abs(b.x)-b.sx/2<WALK_X && b.z-b.sz/2<-.5 && b.z+b.sz/2>-25 &&
      b.y+b.sy/2>2.8 && b.y-b.sy/2<DECK+2);
    expect(blockers).toEqual([]);
  });
  it('conceals the entire spawning body even at the extremes of the jumping platform',()=>{
    for(let wave=1;wave<=2;wave++)for(let i=0;i<30;i++){
      const [start]=entryPath(i,wave);
      for(const x of [-WALK_X,0,WALK_X])for(const z of [.43,6.32])for(const y of [DECK+1.65,DECK+3.05]){
        for(const side of [-.6,.6])for(const height of [.1,2.1]){
          expect(sight([x,y,z],[start[0]+side,start[1]+height,start[2]+.4]),JSON.stringify({entrance:entryKind(i,wave),start,x,y,z,side,height})).toBeLessThan(.99);
        }
      }
    }
  });
  it('routes each arrival around the building and into view before it reaches the mesh',()=>{
    for(let wave=1;wave<=2;wave++)for(let i=0;i<30;i++){
      const path=entryPath(i,wave);
      for(let n=1;n<path.length;n++){
        expect(sight([path[n-1][0],path[n-1][1]+1,path[n-1][2]],[path[n][0],path[n][1]+1,path[n][2]])).toBe(1);
      }
      expect(path.slice(1,-1).some(([x,y,z])=>sight([0,DECK+1.68,3.4],[x,y+1.7,z])===1)).toBe(true);
      expect(path[2][2]).toBeLessThan(FENCE_Z-6);
    }
    expect(new Set(Array.from({length:8},(_,i)=>entryKind(i,1))).size).toBe(4);
    expect(fenceBays[0]*3).toBe(-132);
    expect((fenceBays.at(-1)!+1)*3).toBe(132);
  });
});
