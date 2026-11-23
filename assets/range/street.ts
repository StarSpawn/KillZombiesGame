import type { Box, Vec3 } from './fracture.ts';

export const START = 5;
export const ROOM_X = -12;
export const ROOM_FLOOR = 4.2;
export const fires: Vec3[] = [];
export function floorHeight(x:number,z:number) {
  return Math.abs(x-ROOM_X)<5.25 && z>=-.55 && z<10.65 ? ROOM_FLOOR : 0;
}
export const DOCK = -995;
export const DISTANCE = START - DOCK;
export const streetColors: string[] = [];
export const scenery: Box[] = [];
export const solids: Box[] = [];
function block(x: number, y: number, z: number, sx: number, sy: number, sz: number, tint: string, solid = false) {
  let index = streetColors.indexOf(tint);
  if (index < 0) index = streetColors.push(tint) - 1;
  const box = { x, y, z, sx, sy, sz, color: index };
  scenery.push(box);
  if (solid) solids.push(box);
}
const letters: Record<string, string> = {
  '5':'111100111001111',V:'101101101101010',
  A:'010101111101101', B:'110101110101110', C:'111100100100111', D:'110101101101110',
  E:'111100110100111', F:'111100110100100', G:'111100101101111', H:'101101111101101',
  I:'111010010010111', K:'101110100110101', L:'100100100100111', M:'101111111101101',
  N:'101111111111101', O:'111101101101111', P:'110101110100100', R:'110101110101101',
  S:'111100111001111', T:'111010010010010', U:'101101101101111', X:'101101010101101',
  Y:'101101010010010', '0':'111101101101111','4':'101101111001001','9':'111101111001111',
};
function sign(label: string, x: number, y: number, z: number, pixel: number, base: string, ink: string) {
  block(x,y,z,(label.length*4+1)*pixel,7*pixel,0.24,base);
  for (let n=0;n<label.length;n++) {
    const glyph=letters[label[n]];
    if (!glyph) continue;
    for (let i=0;i<15;i++) if (glyph[i]==='1')
      block(x+(n*4+i%3-(label.length*4-2)/2)*pixel,y+(2-Math.floor(i/3))*pixel,z+0.132,pixel*0.98,pixel*0.98,0.028,ink);
  }
}
const curb='#a6a299', trim='#524e4b', frame='#303940', glass='#435964';
const shore=DOCK+9;
const avenueEnd=shore+3;
const length=10-avenueEnd, middle=(10+avenueEnd)/2;
block(0,-.62,middle,150,1,length,'#797b74');
block(0,-.10,middle,16.46,.18,length,'#54565a');
const facades=['#bbab8d','#9b7b68','#cdc2a5','#867a70','#bc9379','#adaba0'];
const names=['CAFE','ART','BANK','HOTEL','BOOKS','DELI'];
// Existing Fifth Avenue section: 54 ft roadway between two 23 ft sidewalks.
const blockPitch=82, blocks=Math.ceil(-avenueEnd/blockPitch);
const crossings=Array.from({length:blocks-1},(_,i)=>-(i+1)*blockPitch);
block(-5.04,-.004,middle,6.35,.014,length,'#78534c');
for (let z=0;z>avenueEnd;z-=7) {
  if(crossings.some(c=>Math.abs(c-z)<6)) continue;
  for(const x of [-5.18,-1.83,1.52,4.87]) block(x,.009,z,.11,.018,2.2,'#cfcabd');
}
for(const z of crossings){
  block(0,-.04,z,88,.07,10,'#55575a');
  for(const edge of [-1,1]) for(let x=-7.8;x<=7.8;x+=1.65)
    block(x,.024,z+edge*4.5,.74,.025,2.3,'#dfd8c8');
}
for(const side of [-1,1]){
  for(let section=0;section<blocks;section++){
    const front=-section*blockPitch-1, back=Math.max(avenueEnd,front-blockPitch+13);
    const span=front-back, center=(front+back)/2;
    block(side*11.735,.07,center,7.01,.16,span,'#b1a79a');
    block(side*8.23,.07,center,.22,.23,span,curb);
    for(let bay=0;bay<3;bay++){
      const id=section*3+bay+(side>0?3:0), z=front-span*(bay+.5)/3;
      const depth=span/3-.16, floors=6+(id*7)%8, h=4.4+floors*3.1;
      // A recessed garden frames a limestone setback tower opposite the department store.
      if(side===-1 && section===2 && bay===1){
        block(-29,.12,z,26,.23,depth,'#b5a997');
        for(const offset of [-7,7]){
          block(-22,.38,z+offset,13,.56,2,'#938b79');
          block(-22,.79,z+offset,12,.55,1.55,'#637259');
        }
        for(let tier=0;tier<5;tier++){
          const width=28-tier*3.4, height=18-tier;
          block(-46, tier*(37-tier)/2+height/2,z,width,height,depth-tier*2,'#b7af98');
          for(let col=-2;col<=2;col++)block(-46+width/2+.06,tier*(37-tier)/2+height/2,z+col*(depth-tier*2)/5,.14,height-.5,.72,'#596571');
        }
        continue;
      }
      // Twin spires, pointed windows and buttresses mark the cathedral frontage.
      if(side===1 && section===3 && bay===1){
        block(27,10,z,18,20,depth,'#abaaa0');
        for(const end of [-1,1]){
          const towerZ=z+end*(depth/2-2.9);
          block(18.7,11,towerZ,6.4,22,5.6,'#c1bdb1');
          for(let tier=0;tier<9;tier++){
            const width=5.3-tier*.55;
            block(18.7,23+tier*2,towerZ,width,2,width,'#a7a598');
          }
        }
        for(let col=-1;col<=1;col++)for(let level=0;level<4;level++)
          block(17.9,4+level*1.4,z+col*2.65,.25,1.42,2.05-level*.42,'#58636a');
        continue;
      }
      // Broken upper bays expose floor slabs, wall stubs and torn reinforcement.
      if ((section+bay+(side>0?1:0))%4===1) {
        const base=5+(id%3)*3, wall='#787570', slab='#635e58';
        block(side*20.8,base/2,z,11.6,base,depth,wall,true);
        for(let col=0;col<4;col++){
          const wz=z+depth*((col+.5)/4-.5), levels=1+(id+col*3)%5;
          block(side*25.5,base+levels*1.55,wz,1.5,levels*3.1,depth/4,wall);
          block(side*15.6,base+levels*1.55,wz,1.1,levels*3.1,.67,wall);
          for(let k=0;k<levels;k++)block(side*20.8,base+3.1*k,wz,10.6,.36,depth/4-.12,slab);
          block(side*15.5,base+levels*3.1+.47,wz,.09,1,.10,'#513f38');
          block(side*14.91,2.25,wz,.30,2.95,depth/4-.9,'#343b3e');
          for(let k=0;k<3;k++)block(side*(13.3+k*.4),.22+k*.11,wz+Math.sin(k+id),.78,.42+k*.16,1.02,slab);
        }
        if((section+bay)%3!==2){
          fires.push([side*14.9,base+.3,z]);
          block(side*14.71,2.1,z-3.1,.22,4.2,3.8,'#343333');
          fires.push([side*14.14,.25,z-3.1]);
        }
        continue;
      }
      const wall=facades[id%facades.length];
      block(side*20.8,h/2,z,11.6,h,depth,wall,true);
      block(side*15.20,2.05,z,.66,4.1,depth,'#80786b');
      for(let col=0;col<4;col++){
        const wz=z+depth*((col+.5)/4-.5);
        block(side*14.80,1.86,wz,.25,3.02,depth/4-.55,glass);
        block(side*14.65,1.86,wz,.07,3.02,.10,frame);
        const pane=(id+col)%4===0?'#c8a979':'#54616b';
        for(let row=0;row<floors;row++){
          const wy=5.8+row*3.1;
          if((id*5+col*7+row*3)%9<3){
            // A dark recess with a few teeth of glass instead of an intact window.
            block(side*14.91,wy,wz,.23,1.94,depth/4-1.12,'#30373a');
            block(side*14.76,wy-.65,wz+.48,.10,.51,.94,'#748083');
            block(side*14.75,wy+.63,wz-.85,.09,.65,.33,'#64727a');
          }else block(side*14.91,wy,wz,.23,1.94,depth/4-1.12,pane);
          block(side*14.75,4.77+row*3.1,wz,.35,.16,depth/4-.76,'#c9bca5');
        }
      }
      if(id%3!==0){
        // Spalled stone under the windows reveals irregular runs of brick.
        const cz=z+depth*.22;
        for(let j=0;j<12;j++){
          const course=Math.floor(j/4), n=j%4;
          if((j+id)%7===0)continue;
          block(side*14.80,3.65+course*.24,cz+n*.47-course*.18,.16,.22,.44,
            ['#69574f','#786154','#514e4b'][(id+j)%3]);
        }
        for(let j=0;j<6;j++)
          block(side*(13.65+.62*Math.sin(j*2)),.15+.08*(j%3),cz+j*.46,.40+(j%3)*.17,.24,.52,'#807972');
      }
      const pale='#d9cbb2',ink='#40505a';
      if(id%3===0){
        // Limestone piers frame recessed window bays, with a stepped crown above.
        for(let n=0;n<=4;n++)block(side*14.67,h/2+2,z+depth*(n/4-.5),.48,h-4,.45,pale);
        for(const rise of [0,1,2])block(side*(20.8+rise*.22),h+.42+rise*.65,z,11.7-rise*1.25,.73,depth-rise*1.28,wall);
      }else if(id%3===1){
        for(let n=0;n<4;n++){
          const wz=z+depth*((n+.5)/4-.5);
          block(side*14.30,3.14,wz,1.34,.21,depth/4-.4,'#446660');
          block(side*13.69,2.96,wz,.13,.28,depth/4-.4,'#43605b');
        }
        for(const height of [4.5,10.7,h-.3])block(side*14.84,height,z,.45,.25,depth,pale);
      }else{
        block(side*14.51,4.7,z,.83,.21,depth,'#9a805e');
        for(const end of [-1,1])block(side*14.73,h/2,z+end*depth*.47,.48,h,.48,ink);
        block(side*14.05,3.06,z,1.88,.25,4.1,'#69504b');
        for(const end of [-1,1])block(side*13.28,1.46,z+end*1.87,.11,2.8,.12,'#8f7960');
      }
      // Corner buildings have a second public facade along the cross street.
      if(bay===0 || bay===2){
        const face=bay===0?1:-1, end=z+face*depth*.5;
        for(let col=0;col<3;col++){
          const wx=side*(16.9+col*3.65);
          block(wx,1.75,end+face*.08,2.65,2.95,.2,glass);
          for(let row=0;row<floors;row++){
            const wy=5.85+row*3.1;
            block(wx,wy,end+face*.09,2.06,1.95,.22,'#505f6b');
            block(wx,wy-.97,end+face*.18,2.37,.18,.34,pale);
            block(wx,wy,end+face*.22,.13,1.94,.09,wall);
          }
        }
        for(const y of [3.96,h-.28])block(side*20.8,y,end+face*.16,12.0,.33,.48,pale);
      }
      if(id%5===0){
        // A tall retail entrance with paired stone columns and an ornamented parapet.
        for(const end of [-1,1]){
          const wz=z+end*2.18;
          block(side*13.94,.38,wz,1.05,.49,1.04,pale);
          block(side*13.94,2.14,wz,.69,3.10,.68,'#c3b599');
          block(side*13.94,3.84,wz,1.12,.36,1.10,pale);
        }
        block(side*14.12,4.22,z,2.16,.46,6.22,pale);
        for(let n=-3;n<=3;n++)block(side*14.55,h+.48,z+n*depth*.119,.52,.67,.45,pale);
      }
      // Glazed storefront entrances, plinths and transoms set a human-size ground floor.
      block(side*14.59,1.15,z,.16,2.3,1.9,ink);
      for(const end of [-1,1])block(side*14.49,1.42,z+end*.46,.08,1.4,.78,'#809290');
      block(side*14.59,2.51,z,.24,.15,2.2,pale);
      block(side*14.74,3.95,z,.86,.42,depth,'#d5c6aa');
      block(side*20.8,h+.17,z,12.02,.34,depth+.2,trim);
      if(id%3===0 || id%7===1){
        for(let tier=0;tier<3;tier++){
          const w=10-tier*2, dz=depth*(.83-tier*.14), y=h+3+tier*6;
          block(side*(21.3+tier*.3),y,z,w,6,dz,wall);
          for(let col=-1;col<=1;col++)block(side*(21.3+tier*.3-w/2),y,z+col*dz*.29,.16,5.25,.95,glass);
        }
      }
      if(id%4===0){
        block(side*14.12,6.76,z-depth*.31,1.87,.095,.10,trim);
        block(side*13.7,5.87,z-depth*.31,.93,1.71,.065,'#9e5548');
        block(side*13.7,5.62,z-depth*.31+.042,.51,.16,.03,pale);
      }
      sign(names[id%names.length],side*13.95,3.52,z+depth*.40,.115,frame,'#efd599');
    }
    for(const n of [0,1]){
      const z=center+(n-.5)*span*.56, x=side*10.6;
      block(x,2.9,z,.2,5.8,.2,frame);
      block(x-side*.62,5.82,z,1.48,.14,.22,frame);
      block(x-side*1.26,5.73,z,.56,.13,.38,'#ffe0a0');
      const treeZ=z-4;
      block(x,.16,treeZ,1.35,.10,1.65,trim);
      block(x,1.75,treeZ,.38,3.2,.38,'#6c5a49');
      block(x,3.67,treeZ,2.25,1.92,2.5,'#6a7857');
      block(x+side*.22,4.63,treeZ-.26,1.65,.78,1.8,'#89916a');
    }
    if(section>0){
      const z=front+4.8;
      block(side*10,2.8,z,.19,5.6,.19,'#766a53');
      block(side*8.5,5.6,z,3.1,.15,.17,'#766a53');
      block(side*7.1,5.05,z,.45,.98,.34,'#ad8550');
      block(side*7.1,5.27,z+.19,.22,.22,.05,'#e77c60');
      sign('5 AV',side*9.70,3.48,z,.084,'#365f50','#e2dfc9');
    }
  }
}
// Close the view inland as well as along the side streets.
block(0,-.54,38,175,1,60,'#696a65');
for(let i=-4;i<=4;i++){
  const h=16+Math.abs(i*7)%17,z=36+(i%2)*4;
  block(i*14,h/2,z,13,h,15,'#797977');
  for(let row=1;row<h/4;row++)for(const col of [-4,0,4])
    block(i*14+col,row*3.7,z-7.56,1.7,1.9,.18,'#505b60');
}
// Side streets recede through a second row of facades to buildings at the next junction.
for(const crossing of [5,...crossings])for(const side of [-1,1]){
  block(side*56,-.12,crossing,78,.15,14,'#51565a');
  for(let tier=0;tier<3;tier++) {
    const x=side*(34+tier*15);
    for(const edge of [-1,1]){
      const h=11+((tier*7+Math.abs(crossing)+edge+1)%15);
      block(x,h/2,crossing+edge*14,13,h,14,'#68696a');
      for(let row=0;row<h/4-1;row++)for(let col=-1;col<=1;col++)
        block(x+col*3.6,3+row*3.5,crossing+edge*6.9,1.8,1.8,.28,'#454f55');
    }
  }
  block(side*78,13,crossing,10,26,16,'#777778');
  for(let row=0;row<6;row++)for(const col of [-4,0,4])
    block(side*72.9,3+row*3.6,crossing+col,.3,1.9,1.9,'#4b5358');
}
// Keep the avenue readable at cross streets and recessed facades.
const streetRailX=13.6, pierRailX=4.49, playerRadius=.32, railDepth=.2;
const railColor='#626d70';
function sidewalkRail(side:number,front:number,back:number){
  const x=side*streetRailX,z=(front+back)/2;
  for(const height of [.54,1.03])block(x,height,z,railDepth,.12,front-back,railColor);
  const steps=Math.ceil((front-back)/2.8);
  for(let i=0;i<=steps;i++)block(x,.55,front+(back-front)*i/steps,.22,1.10,.20,'#48545a');
}
for(const side of [-1,1]){
  for(const crossing of crossings)sidewalkRail(side,crossing+12,crossing-2);
  for(const section of (side<0?[2]:[3])){
    const center=-section*blockPitch-1-(blockPitch-13)/2;
    sidewalkRail(side,center+12,center-12);
  }
  sidewalkRail(side,-.6,-5);
  sidewalkRail(side,avenueEnd+6,shore);
  const span=streetRailX-pierRailX;
  for(const h of [.54,1.03])block(side*(pierRailX+span/2),h,shore,span,.12,railDepth,railColor);
  for(let i=0;i<=4;i++)block(side*(pierRailX+i*span/4),.55,shore,.20,1.1,.20,railColor);
  for(const h of [.54,1.03])block(side*pierRailX,h,(shore+DOCK-1)/2,railDepth,.12,shore-DOCK+1,railColor);
}
function car(x:number,z:number,paint:string) {
  block(x,.64,z,1.95,.72,3.95,paint,true);
  block(x,1.19,z+.1,1.58,.54,2.03,glass,true);
  block(x,1.51,z+.1,1.67,.12,2.1,paint);
  for(const s of [-1,1]) {
    for(const a of [-1,1]) block(x+s*.93,.34,z+a*1.22,.23,.56,.66,'#292a30');
    block(x+s*.67,.72,z+2,.4,.17,.06,'#eccfa0');
    block(x+s*.68,.74,z-2,.38,.18,.07,'#b55347');
  }
}
for(let i=0;i<blocks*2;i++){
  const z=-24-Math.floor(i/2)*blockPitch-(i%2)*27;
  if(z>avenueEnd)car((i%2?1:-1)*7.15,z,['#d69b39','#637d83','#b48133','#555e66'][i%4]);
}
const roomStart=scenery.length;
// The safe room has a recessed doorway looking directly down the street.
block(0,-.04,5,10.4,.17,11,'#6b635b');
block(-5.05,2,5,.45,4,11,'#73736b',true);block(5.05,2,5,.45,4,11,'#73736b',true);
block(0,2,10.4,10.5,4,.5,'#70665f',true);block(0,4.18,5,10.6,.35,11,'#615f5d');
for(const s of [-1,1]) {
  block(s*3.68,2,-.25,2.85,4,.55,'#626e69',true);
  block(s*2.22,1.68,-.04,.15,3.36,.36,'#d39c55');
  block(s*4.79,1.02,5.1,.09,.28,10.3,'#d49b54');
}
block(0,3.72,-.25,4.6,.74,.55,'#5c645e');
sign('EXIT',0,3.48,.10,.11,'#275952','#eaf1c9');
block(-4.08,.62,4.9,1.4,1.24,2.4,'#7b694a',true);
block(-4.08,1.35,4.7,1.38,.21,2.6,'#ad9369');
block(4.4,1.65,2.4,.35,1.12,.95,'#9e463d');block(4.19,1.65,2.4,.08,.20,.56,'#f2d7ad');
block(4.18,1.65,2.4,.09,.65,.18,'#f2d7ad');
// The quartermaster stands behind the counter inside the safe house.
block(-4.42,1.64,5.37,.69,.86,.42,'#536257');
block(-4.42,2.29,5.37,.48,.48,.45,'#b18a6c');
block(-4.42,2.56,5.37,.53,.13,.52,'#38494b');
block(-4.22,1.89,5.1,.19,.31,.18,'#d3b775');
sign('SUPPLY',-3.57,2.91,5.63,.12,frame,'#ecce92');
// The shutter mesh is lifted independently of the fixed wall and its noticeboard.
export const shutter:Box={x:0,y:1.49,z:-.25,sx:4.48,sy:3.72,sz:.30,color:0};
const doorStart=scenery.length;
block(0,1.49,-.25,4.48,3.72,.30,'#844b43');
for(let i=0;i<11;i++) block(0,.11+i*.29,-.25,4.43,.064,.36,'#ac7561');
block(0,1.32,-.25,4.44,.16,.38,'#d3a65b');
export const doorBoxes=scenery.splice(doorStart);
block(-3.66,2.25,.12,1.92,1.38,.08,'#4c4d48');
block(-3.79,2.21,.18,1.35,.99,.045,'#c4b597');
for(let n=0;n<4;n++)block(-4.29+n*.31,2.23,.21,.035,.83,.025,'#8b8676');
block(-3.81,2.24,.237,1.14,.07,.025,'#9e503f');
block(-3.29,2.24,.25,.12,.16,.025,'#9e503f');
for(let i=0;i<8;i++)block(-2.86+(i%2)*.06,.27+Math.floor(i/2)*.24,.08,.10,.16,.05,'#b59d53');
for(let i=0;i<6;i++)block(i%2?.35:-.21,.064,1.2+i*.49,.15,.012,.29,'#514441');
block(0,3.97,5,2.8,.1,.35,'#ffe1a0');
// Boarded sash opens over the sidewalk. Remaining glass stays at the frame edges.
block(0,.26,-.25,4.46,.52,.5,'#77695e',true);
for(const side of [-1,1])for(let i=0;i<3;i++)
  block(side*(2.07-i*.14),3.32-i*.065,-.23,.14,.30-i*.07,.07,'#9bb5bb');
for(const b of [...scenery.slice(roomStart), ...doorBoxes, shutter]){
  b.x+=ROOM_X; b.y+=ROOM_FLOOR;
}
block(ROOM_X,ROOM_FLOOR/2,5,10.45,ROOM_FLOOR,11,'#837f75',true);
block(ROOM_X-4,7.4,15,19,14.8,9,'#898278');
for(const x of [-7,-3,1,5])for(const y of [2.1,6.2,10.3])
  block(ROOM_X-4+x,y,10.42,2.1,2.45,.2,'#4b5860');
// A continuous promenade joins the last city block to the narrower timber pier.
block(0,-.12,shore+1.7,30,.23,4,'#a19c8c');
// Translate the entire waterfront from its authored pier origin.
const waterfrontStart=scenery.length;
block(0,-.6,-105,9.5,1.15,18,'#987858');
for(let i=0;i<35;i++) block(0,.004,-96.25-i*.52,9.45,.02,.047,'#5c544c');
for(const s of [-1,1]) for(let i=0;i<5;i++) {
  block(s*4.49,.68,-96-i*3.5,.34,1.42,.34,'#594e4c');
  block(s*4.49,1.45,-96-i*3.5,.38,.13,.38,'#dbb57c');
}
block(0,-1.6,-145,205,.7,104,'#397a86');
for(let i=0;i<75;i++) block(Math.sin(i*47)*82,-1.23,-113-(i*19)%75,1.2+i%6,.05,.19,'#6d9ca0');
for(const x of [-4,4]) block(x,3,-100,.38,6,.48,frame);
sign('PIER 04',0,5.9,-100,.30,'#214f53','#ffe0a3');
block(1.4,-.07,-116,5.9,1.8,9,'#98483c');block(1.4,.95,-116,5.6,.43,8.8,'#ffe2ac');
block(1.4,2.06,-116,3.65,2.1,4.3,'#d0bea0');block(1.4,2.42,-113.78,3.12,.8,.15,glass);
block(1.4,3.22,-116,4.2,.30,4.7,'#a55340');block(1.4,4.33,-116,.14,2.2,.14,frame);
for(const side of [-1,1]) {
  for(let i=0;i<5;i++)block(1.4+side*2.6,1.65,-112.2-i*1.72,.09,.92,.09,'#dcc7a1');
  block(1.4+side*2.6,2.07,-115.62,.10,.11,7.1,'#decca8');
  block(1.4+side*1.05,2.42,-113.68,.09,.82,.13,'#cbb996');
}
block(1.4,4.23,-116,2.25,.12,.17,'#6b6c68');
block(1.4,5.36,-116,.21,.23,.23,'#f7bd60');
sign('04',1.4,.38,-111.45,.10,'#843e38','#ffdb92');
for(let i=0;i<26;i++) {
  const x=(i-12)*7.4, h=4+(i*13)%19;
  block(x,h/2-1,-182-(i%3)*5,5+(i%5),h,8,'#7c858d');
}
for(const part of scenery.slice(waterfrontStart)) part.z+=DOCK+105;

export type DoorState='closed'|'open'|'locked';
export function spawnPositions(): Vec3[] {
  const positions: Vec3[]=[];
  for(let r=0;r<48;r++) {
    const count=r===0?3:r<5?4:5;
    for(let c=0;c<count;c++) {
      let x=(c-(count-1)/2)*3.3 + (r===0?0:Math.sin(r*21+c*8)*1.22);
      const z=-6-r*((-shore-12)/47)-Math.abs(Math.sin(r*7+c*2))*(r===0?1.6:3.2);
      if(solids.some(b=>Math.abs(x-b.x)<b.sx/2+.6 && Math.abs(z-b.z)<b.sz/2+.6)) x*=.56;
      positions.push([x,0,z]);
    }
  }
  return positions;
}
export function blocksPlayer(x:number,z:number,feet:number,door:DoorState='open') {
  if(door!=='open' && Math.abs(z-shutter.z)<shutter.sz/2+.32 && feet<shutter.y+shutter.sy/2 && feet+2>shutter.y-shutter.sy/2 && Math.abs(x-shutter.x)<shutter.sx/2+.32)return true;
  // The footprint includes the player's radius and applies throughout a jump.
  const edge=(z<shore+railDepth/2+playerRadius ? pierRailX : streetRailX)-railDepth/2-playerRadius;
  if(z>-.2 && (Math.abs(x-ROOM_X)>4.65 || feet<ROOM_FLOOR-.01))return true;
  if(z>9.7 || z<DOCK-1 || (z<=-.2 && Math.abs(x)>edge))return true;
  return solids.some(b=>feet < b.y+b.sy/2 && feet+2 > b.y-b.sy/2 &&
    Math.abs(x-b.x)<b.sx/2+.32 && Math.abs(z-b.z)<b.sz/2+.32);
}
export function wallDistance(origin:Vec3, dir:Vec3,door:DoorState='open') {
  let closest=DISTANCE+30;
  for(const b of door==='open'?solids:[shutter,...solids]) {
    let lo=0, hi=closest;
    const center=[b.x,b.y,b.z], size=[b.sx,b.sy,b.sz];
    for(let i=0;i<3;i++){
      const a=center[i]-size[i]/2-origin[i],c=a+size[i];
      if(Math.abs(dir[i])<1e-7){if(a>0||c<0){hi=-1;break;}continue;}
      const t=a/dir[i],u=c/dir[i];
      lo=Math.max(lo,Math.min(t,u));hi=Math.min(hi,Math.max(t,u));
      if(hi<lo)break;
    }
    if(hi>=lo)closest=lo;
  }
  return closest;
}
export * from './gun-model.ts';
