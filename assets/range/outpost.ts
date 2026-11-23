import type { Box, Vec3 } from './fracture.ts';

export const DECK=3.2, FENCE_Z=-6, MAX_LIVE=12;
export function spawnPoint(index:number,wave:number):Vec3{
  return [((index*7+wave*3)%17)-8,0,FENCE_Z-12-(index*3%8)];
}

type Piece=Box & {roll?:number};
export const colors=['#56604a','#4d5442','#776e54','#414844','#8b917e','#313e39','#807458','#bec5b2','#b59b53','#3c5040','#5c6a51','#253729','#7c8671','#cbb98a'];
export const outpost:Piece[]=[], gate:Piece[]=[];
function add(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,roll=0,target=outpost){
  target.push({x,y,z,sx,sy,sz,color,roll});
}
add(0,-.18,-22,180,.35,180,0);
add(0,.008,-8.3,90,.04,7,2);
for(let i=0;i<220;i++){
  const x=44*Math.sin(i*83.7),z=-8-(i*17.9)%64;
  add(x,.057,z,.18+(i%9)*.12,.07,.35+i%4*.2,i%3===0?2:1);
}
for(let i=0;i<85;i++){
  const x=Math.sin(i*41.7)*67,z=-34-(i*31%52),h=3.4+i%8;
  add(x,h*.30,z,.48,h*.60,.48,2);
  for(let t=0;t<3;t++)add(x,h*(.45+t*.19),z,3.9-t,h*.38,4.1-t,i%2?9:11);
}
for(let i=0;i<21;i++)add((i-10)*7.8,2,-91-(i%3)*3,12,12+12*Math.sin(i*.54)**2,14,10);
add(0,DECK-.22,3.4,9,.44,6.8,3);
for(let i=0;i<19;i++)add((i-9)*.47,DECK-.02,3.4,.455,.06,6.75,i%3===0?6:2);
for(const x of [-4.28,4.28]){
  for(const z of [.16,6.65]){add(x,1.6,z,.32,3.2,.32,5);add(x,5,z,.15,3.6,.15,3);}
  for(const y of [3.62,4.04])add(x,y,3.4,.09,.09,6.55,4);
}
for(const y of [3.62,4.04])add(0,y,6.65,8.5,.09,.09,4);
add(0,6.89,3.4,9.6,.22,7.4,5);
add(0,6.74,.05,8.65,.14,.24,6);
for(const x of [-3.3,3.3])add(x,6.63,.42,.73,.10,.31,13);
// The mesh silhouettes and watch lights evoke a fictional border outpost.
for(let bay=-8;bay<8;bay++){
  const x=bay*3, target=bay>=-1&&bay<1?gate:outpost;
  add(x+.04,1.30,FENCE_Z,.12,2.60,.16,5,0,target);
  for(const h of [.12,2.28,2.58])add(x+1.5,h,FENCE_Z,3,.048,.05,4,0,target);
  for(let col=0;col<8;col++)for(let row=0;row<5;row++){
    const cx=x+(col+.5)*.375,cy=.29+row*.43;
    for(const sign of [-1,1])add(cx,cy,FENCE_Z,.021,.563,.023,4,sign*.718,target);
  }
}
// Ochre markers pick out the center gate in the rain; these fall with its mesh.
for(const x of [-2.9,2.9]){
  add(x,1.22,FENCE_Z+.035,.095,2.44,.10,4,0,gate);
  for(const y of [.55,1.55,2.23])add(x,y,FENCE_Z+.105,.14,.24,.07,8,0,gate);
}
for(const x of [-10.5,10.5]){
  add(x,1.55,FENCE_Z+.12,1.18,.64,.07,5);
  add(x,1.55,FENCE_Z+.17,1.08,.54,.045,8);
  for(const offset of [-.29,0,.29])add(x+offset,1.55,FENCE_Z+.21,.12,.47,.03,5,-.48);
}
for(const x of [-16,16,-7.5,7.5]){
  add(x,2.08,FENCE_Z+.3,.16,4.16,.18,3);add(x,4.1,FENCE_Z+.3,.75,.22,.35,5);
  add(x,3.98,FENCE_Z+.3,.62,.065,.32,13);
}
for(const side of [-1,1]){
  const x=side*19;
  add(x,1.5,-21,4,3,3.5,6);add(x,3.14,-21,4.5,.30,4,5);
  add(x,1.96,-19.19,2.9,.69,.13,3);
  for(let n=0;n<3;n++)add(side*(11+n*1.6),.5,-10,1.45,1,1,2);
}
