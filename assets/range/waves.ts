export const waveCount=(wave:number)=>8+(wave-1)*4;
export function waveChoices(best:number,current:number){
  return [...new Set([Math.max(1,current),Math.max(1,best),best+1])].sort((a,b)=>a-b);
}
