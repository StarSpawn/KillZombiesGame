import {describe,it,expect,vi} from 'vitest';
import {technologies, DROP_PRICE} from '../technology.ts';
import {restoreWallet,initialWallet,ammunition,purchase,capacity} from '../loadout.ts';
import {Field} from '../field.ts';
import {DECK} from '../outpost.ts';
const api=()=>({pose:vi.fn(),target:vi.fn(),round:vi.fn(),tell:vi.fn(),save:vi.fn()});
describe('outpost technology',()=>{
  it('keeps all five joint nodes gated by both parents and charges only once',()=>{
    expect(technologies).toHaveLength(26);
    expect(technologies.filter(t=>t.parents.length===2)).toHaveLength(5);
    const w=initialWallet();w.cash=20000;
    for(const n of technologies.slice(1)){
      for(const missing of n.parents){
        const locked={...w,tech:w.tech.filter(id=>id!==missing)};
        expect(purchase(locked,n.id)).toBe(false);
      }
      const cash=w.cash;expect(purchase(w,n.id)).toBe(true);
      expect(purchase(w,n.id)).toBe(false);expect(w.cash).toBe(cash-n.cost);
    }
  });
  it('migrates a legacy shotgun while preserving its bounty and unlock path',()=>{
    const w=restoreWallet({owned:['g18','shotgun'],cash:67});
    expect(w.tech).toEqual(['g18','mosin','ak','shotgun']);expect(w.cash).toBe(67);
    expect(restoreWallet(w)).toEqual(w);
  });
  it('requires reaching the arrived truck, preserves full pickups and caps at three',()=>{
    const w=restoreWallet({tech:['truck','rocket'],primary:'lmg',secondary:'rocket'}),a=ammunition(true),f=new Field(api(),w,a);
    const point:[number,number,number]=[3,DECK,5.92];
    a.rocket.spare=0;f.interact(point);expect(a.rocket.spare).toBe(0);
    f.tick(4,1);f.interact([0,DECK,2]);expect(f.truckUses).toBe(3);
    f.interact(point);expect(a.rocket.spare).toBe(1);f.interact(point);
    f.interact(point);expect(f.truckUses).toBe(1);
    a.lmg.spare=0;f.interact(point);expect(a.lmg.spare).toBe(Math.ceil(capacity('lmg',true)/2));
    expect(f.truckUses).toBe(0);f.interact(point);expect(f.truckUses).toBe(0);
  });
  it('charges each delivered airdrop once, independently of radio calls',()=>{
    const w=restoreWallet({tech:['airdrop'],cash:DROP_PRICE*2}),a=ammunition(true),f=new Field(api(),w,a);
    const point:[number,number,number]=[0,DECK,3];f.order='airdrop';
    f.execute(point,point,0);f.execute(point,point,0);expect(w.cash).toBe(DROP_PRICE);
    f.tick(5,1);a.g18.spare=0;f.pickupDrop(point);expect(f.drop).toBeNull();
    f.execute(point,point,0);expect(w.cash).toBe(0);expect(f.calls).toBe(2);
    f.tick(5,1);a.g18.spare=0;f.pickupDrop(point);f.execute(point,point,0);expect(f.drop).toBeNull();
  });
  it('shares the heavy belt with its crew and honours the two-call wave budget',()=>{
    const port=api(),w=restoreWallet({tech:['crew','salvo']}),f=new Field(port,w,ammunition());
    const p:[number,number,number]=[0,DECK,.6];port.target.mockReturnValue({position:[0,1,-10]});
    f.interact(p);f.mountFire([0,0,-15]);f.tick(.3,1);expect(f.belts.heavy).toBe(199);
    f.interact(p);f.tick(.3,1);expect(f.belts.heavy).toBe(198);
    f.order='salvo';f.execute(p,p,0);f.execute(p,p,0);f.execute(p,p,0);expect(f.calls).toBe(0);
    f.tick(5,1);expect(port.round.mock.calls.filter(c=>c[2]===3.7)).toHaveLength(16);
  });
});
