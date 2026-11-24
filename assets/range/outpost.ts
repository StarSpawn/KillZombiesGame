import type { Box, Vec3 } from './fracture.ts';

export const DECK=4.6, FENCE_Z=-6, MAX_LIVE=28;
// Shared street coordinates keep entrances aligned with the district mesh.
export const CITY_SHIFT=18, ENTRY_X=33, FRONT=-17-CITY_SHIFT, ROOF_Y=7, WINDOW_Y=3.1;
export const entryKinds=['alley','shop','window','roof'] as const;
export function entryKind(index:number,wave:number){return entryKinds[(index+wave-1)%entryKinds.length];}
export function entryPath(index:number,wave:number):Vec3[]{
  const lane=(index*3+wave)%5, side=(Math.floor(index/4)+wave)%2?-1:1;
  const kind=entryKind(index,wave),end:Vec3=[(kind==='alley'?side:kind==='window'?1:-1)*(1.5+lane*1.64),0,FENCE_Z+.6];
  if(kind==='alley'){
    const laneX=side*(1.15+.61*lane),back=-27-(index%3)*.5-CITY_SHIFT;
    return [[side*(12+lane),0,back],[laneX,0,back],[laneX,0,FRONT+3],end];
  }
  if(kind==='roof'){
    const cx=-ENTRY_X, y=ROOF_Y;
    return [[cx,y,FRONT-7],[cx+5.8,y,FRONT-7],[cx+5.8,y,FRONT+1],[cx+5.8,0,FRONT+1.8],end];
  }
  const cx=kind==='shop'?-ENTRY_X:ENTRY_X,y=kind==='shop'?0:WINDOW_Y;
  return [[cx+Math.sign(cx)*6.4,y,FRONT-3],[cx,y,FRONT-3],[cx,y,FRONT+1],[cx,0,FRONT+2],end];
}

type Piece=Box & {roll?:number};
export const colors=['#56604a','#4d5442','#776e54','#414844','#8b917e','#313e39','#807458','#bec5b2','#b59b53','#3c5040','#5c6a51','#253729','#7c8671','#cbb98a'];
export const outpost:Piece[]=[], gate:Piece[]=[];
function add(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,roll=0,target=outpost){
  target.push({x,y,z,sx,sy,sz,color,roll});
}
add(0,DECK-.22,3.4,9,.44,6.8,3);
for(let i=0;i<19;i++)add((i-9)*.47,DECK-.02,3.4,.455,.06,6.75,i%3===0?6:2);
for(const x of [-4.28,4.28]){
  for(const z of [.16,6.65]){add(x,DECK/2,z,.32,DECK,.32,5);add(x,DECK+1.8,z,.15,3.6,.15,3);}
  for(const y of [DECK+.42,DECK+.84])add(x,y,3.4,.09,.09,6.55,4);
}
for(const y of [DECK+.42,DECK+.84])add(0,y,6.65,8.5,.09,.09,4);
add(0,DECK+3.69,3.4,9.6,.22,7.4,5);
add(0,DECK+3.54,.05,8.65,.14,.24,6);
for(const x of [-3.3,3.3])add(x,DECK+3.43,.42,.73,.10,.31,13);
// The striped rear loading hoist marks the truck interaction point from the deck.
add(3,DECK+.05,5.92,1.55,.08,1.05,9);
for(let n=0;n<5;n++)add(2.42+n*.29,DECK+.10,5.92,.13,.025,1.0,8);
add(4.13,DECK+1.34,5.92,.18,2.68,.22,3);
add(3.72,DECK+2.55,5.92,1.08,.18,.20,4);
add(3.28,DECK+1.68,5.92,.035,1.55,.035,5);
add(3.27,DECK+.8,6.38,1.3,.42,.51,6);
for(const side of [-1,1]){
  add(side*11,3,-8,.24,6,.24,5);
  add(side*11,6.18,-8,1.02,.42,.52,3);
  add(side*11,6.18,-7.72,.85,.28,.035,13);
}
// One panel is instanced in both directions; the two middle bays break with the gate.
export const panel:Piece[]=[];
export const fenceBays=Array.from({length:88},(_,i)=>i-44).filter(i=>i!==-1 && i!==0);
add(.04,1.30,FENCE_Z,.12,2.60,.16,5,0,panel);
for(const h of [.12,2.28,2.58])add(1.5,h,FENCE_Z,3,.041,.05,4,0,panel);
for(let col=0;col<8;col++)for(let row=0;row<5;row++){
  const cx=(col+.5)*.375,cy=.29+row*.43;
  for(const sign of [-1,1])add(cx,cy,FENCE_Z,.018,.563,.022,4,sign*.718,panel);
}
for(const bay of [-1,0])for(const piece of panel)gate.push({...piece,x:piece.x+3*bay});
for(const x of [-2.9,2.9])add(x,1.22,FENCE_Z+.035,.095,2.44,.10,4,0,gate);
