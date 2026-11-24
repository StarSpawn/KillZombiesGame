import {describe,expect,it,vi} from 'vitest';
import {Field,HEAVY_INTERVAL,HEAVY_IMPACT} from '../field.ts';
import {restoreWallet,ammunition} from '../loadout.ts';
import {DECK,WALK_X} from '../outpost.ts';
import {stationPositions,soldierIds} from '../field-models.ts';
import {breakAt,createBodyDamage,PARTS,type Vec3} from '../fracture.ts';

const api=()=>({pose:vi.fn(),round:vi.fn(),target:vi.fn(),tell:vi.fn(),save:vi.fn()});
describe('shared guard platform and mounted gun',()=>{
  it('stations every soldier on the deck and turns the upper body through fire and recovery',()=>{
    const port=api(),f=new Field(port,restoreWallet({tech:['crew','mortar']}),ammunition());
    const deployed=port.pose.mock.calls.filter(([id,pos])=>pos && soldierIds.includes(id));
    expect(deployed.map(([id])=>id)).toEqual(expect.arrayContaining(['infantry','tower','reserve','crew','mortarGunner']));
    for(const [,pos] of deployed){expect(pos[1]).toBe(DECK);expect(Math.abs(pos[0])).toBeLessThan(WALK_X);}
    port.target.mockReturnValue({position:[3,1,-15]});f.tick(.5,1);
    const fired=port.pose.mock.calls.find(([id,,yaw,pitch,recoil])=>id==='infantry' && yaw<0 && pitch<0 && recoil===1);
    expect(fired).toBeDefined();
    f.tick(.05,1);
    expect(port.pose.mock.calls.some(([id,,,,recoil])=>id==='infantry' && recoil>0 && recoil<1)).toBe(true);
  });
  it('tracks the aim while idle and spaces even held shots with varied terminal points',()=>{
    const port=api(),f=new Field(port,restoreWallet({tech:['heavy']}),ammunition());
    f.interact(stationPositions.heavy);f.trackMount(.7,-.3);
    expect(port.pose).toHaveBeenLastCalledWith('heavy',stationPositions.heavy,-.7,-.3,0);
    const aim:Vec3=[2,1,-25];
    expect(f.mountFire(aim)).toBe(true);expect(f.mountFire(aim)).toBe(false);
    f.tick(HEAVY_INTERVAL-.01,1);expect(f.mountFire(aim)).toBe(false);
    f.tick(.02,1);expect(f.mountFire(aim)).toBe(true);
    const shots=port.round.mock.calls;
    expect(shots).toHaveLength(2);expect(shots[0][1]).not.toEqual(shots[1][1]);
    expect(shots.every((s)=>s[3]===HEAVY_IMPACT)).toBe(true);expect(f.belts.heavy).toBe(198);
  });
  it('keeps each station cooldown while the player switches seats',()=>{
    const port=api(),f=new Field(port,restoreWallet({tech:['cannon']}),ammunition()),aim:Vec3=[0,0,-15];
    f.interact(stationPositions.cannon);expect(f.mountFire(aim)).toBe(true);
    f.interact(stationPositions.cannon);f.interact(stationPositions.heavy);f.trackMount(0,0);
    expect(port.pose.mock.lastCall?.[4]).toBe(0);expect(f.mountFire(aim)).toBe(true);
    f.interact(stationPositions.heavy);f.interact(stationPositions.cannon);expect(f.mountFire(aim)).toBe(false);
  });
  it('severs a torso within two direct heavy hits while preserving head-only kills',()=>{
    const body=createBodyDamage();
    for(let i=0;i<2 && !body.waistSevered;i++){
      const brick=PARTS[0].boxes.findIndex((b,n)=>body.alive[0][n] && b.y>1.4);
      const b=PARTS[0].boxes[brick];
      breakAt(body,{part:0,brick,point:[b.x,b.y,b.z],t:0},[0,0,-1],HEAVY_IMPACT);
    }
    expect(body.waistSevered).toBe(true);expect(body.destroyed).toBe(false);
  });
});
