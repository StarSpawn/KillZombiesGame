import { describe, expect, it } from 'vitest';
import { ammunition, ARMORY, GUNS, MOSIN_IMPACT, nextZoom, scopeFov, equip, initialWallet, refill, restoreWallet, shotOffset } from '../loadout.ts';
import { ROOM_X, ROOM_FLOOR, floorHeight, fires, blocksPlayer, DISTANCE, DOCK, feedBoxes, gunBoxes, reloadPose, spawnPositions, START, wallDistance } from '../street.ts';

import { PARTS, createBodyDamage, breakAt, remainingBoxes } from '../fracture.ts';
import { outfits, dressVoxel } from '../outfits.ts';

describe('street escape', () => {
  it('issues three magazines and conserves their rounds on a partial reload', () => {
    const {g18}=ammunition();
    expect(g18).toEqual({loaded:17,spare:34});
    g18.loaded-=5;
    refill(g18,17);
    expect(g18).toEqual({loaded:17,spare:29});
    refill(g18,17);
    expect(g18.spare).toBe(29);
  });
  it('charges for a weapon only on its first successful purchase', () => {
    const wallet=initialWallet();
    expect(equip(wallet,'ak')).toBe(false);
    wallet.cash=150;
    expect(equip(wallet,'ak')).toBe(true);
    expect(equip(wallet,'ak')).toBe(true);
    expect(equip(wallet,'shotgun')).toBe(true);
    expect(wallet.cash).toBe(0);
    expect(restoreWallet(JSON.parse(JSON.stringify(wallet)))).toEqual(wallet);
    expect(restoreWallet(null)).toEqual(initialWallet());
  });
  it('leaves room to walk and shoot through the safe-house door and onto the dock', () => {
    expect(floorHeight(ROOM_X,START)).toBe(ROOM_FLOOR);
    expect(blocksPlayer(ROOM_X,START,ROOM_FLOOR)).toBe(false);
    expect(blocksPlayer(ROOM_X,-.25,ROOM_FLOOR)).toBe(true);
    expect(blocksPlayer(ROOM_X,-.25,ROOM_FLOOR+.8)).toBe(false);
    expect(floorHeight(ROOM_X,-2)).toBe(0);
    expect(blocksPlayer(0,DOCK,0)).toBe(false);
    expect(fires.length).toBeGreaterThan(4);
    const crowd=spawnPositions();
    expect(crowd.length).toBeGreaterThan(65);
    expect(crowd.every(([x,,z])=>z<-4 && !blocksPlayer(x,z,0))).toBe(true);
  });
  it('keeps both sides of the full route inside the rail even in midair',()=>{
    for(const sign of [-1,1])for(const height of [0,1.2,2.5]){
      for(let z=-1;z>=-985;z--)expect(blocksPlayer(sign*13.3,z,height)).toBe(true);
      for(let z=-986;z>=DOCK;z--)expect(blocksPlayer(sign*4.1,z,height)).toBe(true);
      expect(blocksPlayer(sign*12,-82,height)).toBe(false);
      expect(blocksPlayer(sign*3.7,-988,height)).toBe(false);
    }
  });
  it('blocks player and rounds at the shutter from either side, and opens the full route',()=>{
    for(const door of ['closed','locked'] as const){
      expect(blocksPlayer(ROOM_X,-.25,ROOM_FLOOR+.8,door)).toBe(true);
      expect(wallDistance([ROOM_X,ROOM_FLOOR+1.7,START],[0,0,-1],door)).toBeLessThan(6);
      expect(wallDistance([ROOM_X,ROOM_FLOOR+1.7,-4],[0,0,1],door)).toBeLessThan(4);
    }
    expect(DISTANCE).toBe(1000);
    for(let z=-1;z>=DOCK;z-=.25)expect(blocksPlayer(0,z,0,'open')).toBe(false);
    const crowd=spawnPositions();
    expect(new Set(crowd.map((_,i)=>outfits[(i*8)%outfits.length][0])).size).toBe(21);
    const patterns=outfits.map((_,i)=>PARTS[0].boxes.map(box=>dressVoxel(i,0,box).color).join(','));
    expect(new Set(patterns).size).toBe(21);
  });
  it('applies uniforms on surviving voxels with identical collision and display geometry',()=>{
    const body=createBodyDamage(),brick=PARTS[0].boxes.findIndex(b=>b.z>.19 && b.y>1.5 && b.color<4);
    const b=PARTS[0].boxes[brick];
    breakAt(body,{brick,part:0,t:0,point:[b.x,b.y,b.z]},[0,0,-1]);
    for(const [i] of outfits.entries()){
      const surviving=remainingBoxes(body,0);
      expect(surviving).not.toContain(b);
      for(const box of surviving){
        const painted=dressVoxel(i,0,box);
        expect({...painted,color:box.color}).toEqual(box);
      }
    }
  });
  it('cycles the rifle magnification and scales the perspective projection',()=>{
    let zoom=2;
    for(const expected of [4,6,2]){
      zoom=nextZoom(zoom);
      expect(zoom).toBe(expected);
      expect(Math.tan(1.25/2)/Math.tan(scopeFov(zoom)/2)).toBeCloseTo(expected);
    }
  });
  it('removes more torso voxels with the scoped rifle and keeps a body hit survivable',()=>{
    const brick=PARTS[0].boxes.findIndex(b=>b.z>.19 && b.y>1.5 && b.color<4),b=PARTS[0].boxes[brick];
    const hit={brick,part:0,t:0,point:[b.x,b.y,b.z] as [number,number,number]};
    const rifle=createBodyDamage(),pistol=createBodyDamage();
    const regular=breakAt(pistol,hit,[0,0,-1]);
    const heavy=breakAt(rifle,hit,[0,0,-1],MOSIN_IMPACT);
    expect(heavy.removed.length).toBeGreaterThan(regular.removed.length);
    expect(rifle.destroyed).toBe(false);
  });
  it('moves the support hand and feed and returns them to the same rest pose',()=>{
    for(const gun of GUNS){
      const rest=reloadPose(gun,0),middle=reloadPose(gun,.5),end=reloadPose(gun,1);
      expect(middle.hand[1]).toBeLessThan(rest.hand[1]-.1);
      expect(middle.feed[1]).toBeLessThan(-.1);
      for(const axis of [0,1,2])expect(end.hand[axis]).toBeCloseTo(rest.hand[axis]);
      expect(middle.cant).toBeGreaterThan(.2);
      expect(feedBoxes(gun).length).toBeGreaterThan(0);
    }
    expect(new Set(GUNS.map(g=>JSON.stringify(gunBoxes(g)))).size).toBe(GUNS.length);
  });
  it('uses distinct shot directions and reduces dispersion while aiming',()=>{
    const offsets=GUNS.map(g=>shotOffset(g,5,0,false,0));
    expect(new Set(offsets.map(o=>JSON.stringify(o))).size).toBe(GUNS.length);
    expect(new Set(GUNS.map(g=>ARMORY[g].kick)).size).toBe(GUNS.length);
    for(const gun of GUNS){
      const free=shotOffset(gun,5,0,false,0),aimed=shotOffset(gun,5,0,true,0);
      expect(Math.hypot(aimed.x,aimed.y)).toBeLessThan(Math.hypot(free.x,free.y));
    }
    expect(new Set(Array.from({length:9},(_,p)=>JSON.stringify(shotOffset('shotgun',1,p,false,0)))).size).toBe(9);
  });
});
