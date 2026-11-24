import { techById, technologies } from './technology.ts';
export const GUNS = ['g18', 'ak', 'shotgun', 'mosin', 'lmg', 'rocket'] as const;
export type Gun = typeof GUNS[number];
export const ARMORY = {
  g18: { name: '马卡洛夫 PM', size: 17, price: 0, interval: 0.19, reload: .72, kick: .014, spread: .004, recovery: .20 },
  lmg: { name:'轻机枪', size:60, price:180, interval:.084, reload:3.5, kick:.018, spread:.007, recovery:.15 },
  rocket: { name:'火箭筒', size:1, price:200, interval:1, reload:1.8, kick:.07, spread:.003, recovery:.18 },
  ak: { name: 'AK', size: 30, price: 90, interval: 0.10, reload: 1.0, kick: .026, spread: .009, recovery: .15 },
  mosin: { name: '莫辛纳甘', size: 5, price: 120, interval: .85, reload: 1.45, kick: .058, spread: .0016, recovery:.19 },
  shotgun: { name: '霰弹枪', size: 6, price: 60, interval: 0.72, reload: 1.08, kick: .067, spread: .066, recovery: .21 },
} as const;
// Game balance values for the rifle and its three optical zoom settings.
export const MOSIN_IMPACT=1.85;
export const nextZoom=(zoom:number)=>zoom===2?4:zoom===4?6:2;
export const scopeFov=(zoom:number)=>2*Math.atan(Math.tan(1.25/2)/zoom);
export const BOUNTY = 15;
export const weaponSlot=(gun:Gun)=>(gun==='g18'||gun==='shotgun')?'secondary':'primary';
export const initialWallet = () => ({ cash: 0, owned: ['g18'] as Gun[], best: 0, bestWave: 0, tech: ['g18'] as string[], trial: false, primary:null as Gun|null, secondary:'g18' as Gun });
export type Wallet = ReturnType<typeof initialWallet>;
export function otherCarriedGun(wallet:Wallet,current:Gun){
  if(!wallet.primary)return wallet.secondary;
  return current===wallet.primary?wallet.secondary:wallet.primary;
}
export function restoreWallet(value: Partial<Wallet> | null): Wallet {
  const cleanInt = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : 0;
  const ids=new Set<string>(['g18']);
  // Older saves owned guns directly. Keep those purchases and grant their prerequisites.
  function restore(id:string){
    const item=techById.get(id);
    if(!item || ids.has(id))return;
    item.parents.forEach(restore); ids.add(id);
  }
  if(Array.isArray(value?.tech))value.tech.forEach(restore);
  if(Array.isArray(value?.owned))value.owned.forEach(restore);
  // The launcher used to occupy the secondary slot. Preserve an explicitly equipped
  // primary, or move the old launcher across when that slot was empty.
  const migratedLauncher=value?.secondary==='rocket' && ids.has('rocket')?'rocket':null;
  const primary=GUNS.find(g=>g===value?.primary && ids.has(g) && weaponSlot(g)==='primary')
    ?? migratedLauncher ?? (Array.isArray(value?.owned)?value.owned.find(g=>GUNS.includes(g) && ids.has(g) && weaponSlot(g)==='primary'):null)
    ?? GUNS.find(g=>ids.has(g) && weaponSlot(g)==='primary') ?? null;
  const secondary=GUNS.find(g=>g===value?.secondary && ids.has(g) && weaponSlot(g)==='secondary')??'g18';
  return {primary,secondary,cash:cleanInt(value?.cash),best:cleanInt(value?.best),bestWave:cleanInt(value?.bestWave),
    owned:GUNS.filter(id=>ids.has(id)),tech:technologies.filter(v=>ids.has(v.id)).map(v=>v.id),trial:value?.trial===true};
}
export function purchase(wallet:Wallet,id:string){
  const item=techById.get(id);
  if(!item || wallet.tech.includes(id) || item.parents.some(p=>!wallet.tech.includes(p)) || wallet.cash<item.cost)return false;
  wallet.cash-=item.cost;wallet.tech.push(id);
  if(GUNS.includes(id as Gun))wallet.owned=GUNS.filter(g=>wallet.tech.includes(g));
  wallet.tech=technologies.filter(n=>wallet.tech.includes(n.id)).map(n=>n.id);
  if(id==='radio')wallet.trial=true;
  return true;
}
export function equip(wallet:Wallet,gun:Gun){
  if(!wallet.owned.includes(gun) && !purchase(wallet,gun))return false;
  wallet[weaponSlot(gun)]=gun;return true;
}
export function capacity(gun:Gun,pouch:boolean){
  const base={g18:68,mosin:30,ak:90,shotgun:12,lmg:120,rocket:2}[gun];
  return pouch && gun!=='rocket'?Math.ceil(base*1.5):base;
}
export function ammunition(pouch=false){
  return Object.fromEntries(GUNS.map(g=>[g,{loaded:Number(ARMORY[g].size),spare:capacity(g,pouch)}])) as Record<Gun,{loaded:number;spare:number}>;
}
export function resupply(ammo:ReturnType<typeof ammunition>,wallet:Wallet){
  let changed=false;
  for(const gun of [wallet.primary,wallet.secondary]){
    if(!gun)continue;
    const cap=capacity(gun,wallet.tech.includes('pouch'));
    if(ammo[gun].spare>=cap)continue;
    ammo[gun].spare=Math.min(cap,ammo[gun].spare+(gun==='rocket'?1:Math.ceil(cap/2)));
    changed=true;
  }
  return changed;
}
export function refill(ammo: { loaded: number; spare: number }, capacity: number) {
  const moved = Math.min(capacity - ammo.loaded, ammo.spare);
  ammo.loaded += moved;
  ammo.spare -= moved;
}


export function shotOffset(gun:Gun,shot:number,pellet:number,aiming:boolean,kick:number){
  const profile=ARMORY[gun], angle=(shot*2.39996+pellet*2.39996+Math.sin(shot*4.13)*.45);
  const radius=gun==='shotgun'?Math.sqrt((pellet+.35)/9):.35+.65*Math.abs(Math.sin(shot*8.17));
  const spread=profile.spread*(aiming?.50:gun==='shotgun'?1.32:3.4)*(1+Math.min(1,kick*9));
  return {x:Math.cos(angle)*spread*radius,y:Math.sin(angle)*spread*radius};
}
