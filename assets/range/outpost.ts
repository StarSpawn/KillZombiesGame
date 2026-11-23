import type { Box, Vec3 } from './fracture.ts';

export const DECK=4.6, FENCE_Z=-6, MAX_LIVE=12;
export function entryPath(index:number,wave:number):Vec3[]{
  const side=(index+wave)%2 ? -1 : 1, lane=(index*3+wave)%5;
  const laneX=side*(1.15+.61*lane), back=-27-(index%3)*.5;
  return [[side*(12+lane),0,back],[laneX,0,back],[laneX,0,-14.9],[side*(1.5+lane*1.64),0,FENCE_Z+.6]];
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
