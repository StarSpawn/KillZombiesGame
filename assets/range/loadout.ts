export const GUNS = ['g18', 'ak', 'shotgun'] as const;
export type Gun = typeof GUNS[number];
export const ARMORY = {
  g18: { name: 'G18', size: 17, price: 0, interval: 0.19, reload: .72, kick: .014, spread: .004, recovery: .20 },
  ak: { name: 'AK', size: 30, price: 90, interval: 0.10, reload: 1.0, kick: .026, spread: .009, recovery: .15 },
  shotgun: { name: '霰弹枪', size: 6, price: 60, interval: 0.72, reload: 1.08, kick: .067, spread: .066, recovery: .21 },
} as const;
export const BOUNTY = 15;
export const initialWallet = () => ({ cash: 0, owned: ['g18'] as Gun[], best: 0, bestWave: 0 });
export type Wallet = ReturnType<typeof initialWallet>;
export function restoreWallet(value: Partial<Wallet> | null): Wallet {
  const cleanInt = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : 0;
  return { cash: cleanInt(value?.cash), best: cleanInt(value?.best), bestWave: cleanInt(value?.bestWave),
    owned: GUNS.filter(gun => gun === 'g18' || (Array.isArray(value?.owned) && value.owned.includes(gun))) };
}
export function equip(wallet: Wallet, gun: Gun) {
  if (wallet.owned.includes(gun)) return true;
  if (wallet.cash < ARMORY[gun].price) return false;
  wallet.cash -= ARMORY[gun].price;
  wallet.owned.push(gun);
  return true;
}
export function ammunition() {
  const supply = (gun: Gun) => ({ loaded: Number(ARMORY[gun].size), spare: ARMORY[gun].size * 2 });
  return { g18: supply('g18'), ak: supply('ak'), shotgun: supply('shotgun') };
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
