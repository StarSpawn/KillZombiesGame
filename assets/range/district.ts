import { CITY_SHIFT, ENTRY_X, ROOF_Y, WINDOW_Y } from './outpost.ts';
import type { Box,Vec3 } from './fracture.ts';

// A fictional Berlin block, with the main avenue looking through the gap between its corner shops.
export const district:Box[]=[], districtColors:string[]=[];
const buildings:Box[]=[];
function box(x:number,y:number,z:number,sx:number,sy:number,sz:number,hex:string){
  let color=districtColors.indexOf(hex);
  if(color<0)color=districtColors.push(hex)-1;
  const b={x,y,z,sx,sy,sz,color};district.push(b);return b;
}
const stone='#aaa393',cream='#cfbf9f',roof='#514f50',sill='#aea99a',pavement='#83817b';
const panes=['#364b4e','#566664','#b49461','#253535','#51615b'];
const glyphs:Record<string,string>={
  K:'101101110101101',I:'111010010010111',N:'101111111111101',O:'111101101101111',
  P:'110101110100100',S:'111100111001111',T:'111010010010010',A:'010101111101101',
  F:'111100110100100',E:'111100110100111',L:'100100100100111',G:'111100101101111',
  D:'110101101101110',B:'110101110101110',U:'101101101101111',H:'101101111101101',M:'101111111101101',R:'110101110101101',W:'101101111111101'
};
function shopSign(word:string,x:number,y:number,z:number,background:string,u=.15){
  const w=(word.length*4+1)*u;
  box(x,y,z,w,6.3*u,.17,background);
  for(let j=0;j<word.length;j++)for(let n=0;n<15;n++)if(glyphs[word[j]]?.[n]==='1')
    box(x+((j-word.length/2)*4+n%3+1)*u,y+(2-Math.floor(n/3))*u,z+.1,u*.90,u*.90,.04,'#efd8a9');
}
function block(x:number,z:number,w:number,d:number,floors:number,paint:string,modern:boolean,store='',face=1){
  const h=3.35+floors*2.75,front=z+face*d/2,edge=(offset:number)=>front+face*offset;
  buildings.push(box(x,h/2,z,w,h,d,paint));
  box(x,.22,z,w+.3,.44,d+.3,stone);
  box(x,h+.18,z,w+.68,.36,d+.5,modern?cream:roof);
  if(!modern){
    for(let i=0;i<4;i++)box(x,h+.45+i*.42,z,w-.1,.46,d*(1-i*.20),'#705a52');
    for(const side of [-1,1])box(x+side*w*.32,h+1.4,z,1.02,2.6,.94,'#865f51');
  }
  const count=Math.max(3,Math.floor(w/2.65)),pitch=w/count;
  for(let row=0;row<floors;row++){
    const y=4.65+row*2.75;
    if(modern)box(x,y,edge(.035),w-.52,1.7,.09,'#485b65');
    for(let col=0;col<count;col++){
      const wx=x-w/2+pitch*(col+.5),glass=panes[(row*7+col*3+floors)%panes.length];
      box(wx,y,edge(.11),pitch*(modern?.84:.57),1.56,.14,glass);
      box(wx,y,edge(.20),.085,1.55,.07,sill);
      if(!modern){
        box(wx,y-.82,edge(.12),pitch*.69,.14,.31,cream);
        box(wx,y+.24,edge(.2),pitch*.58,.08,.07,sill);
      }
    }
    if(!modern)box(x,y-1.25,edge(.06),w,.16,.21,cream);
    else if(row%2===0)box(x+w*.18,y-.72,edge(.32),w*.52,.35,.70,'#c3b8a1');
    for(const side of [-1,1])for(let i=0;i<Math.floor(d/2.8);i++)
      box(x+side*(w/2+.05),y,z-d/2+1.5+i*2.8,.10,1.42,1.12,panes[(i+row)%5]);
  }
  for(let i=0;i<count;i++){
    const wx=x-w/2+pitch*(i+.5);
    box(wx,1.52,edge(.10),pitch*.76,2.24,.13,i===0?'#39484e':'#617476');
    box(wx,2.90,edge(.27),pitch*.92,.25,.71,store==='KINO'?'#934e46':'#717860');
  }
  if(store)shopSign(store,x,3.22,edge(.48),'#504c4b');
}
box(0,-.22,0,330,.40,300,'#786f59');
box(0,.005,-11.6,300,.05,8,'#585c5c');
box(0,.015,-34,12,.06,42,'#5c6060');
for(const x of [-6.5,6.5])box(x,.09,-35,1.2,.16,42,pavement);
box(0,.09,-16.3,290,.18,1.5,pavement);
for(let x=-132;x<134;x+=6.4)box(x,.042,-11.6,2.6,.012,.15,'#a7a393');
block(-15,-21,18,8,3,'#ac8771',false,'KINO');
block(15,-21,18,8,4,'#bba88b',false,'BUNDESPOST');
// The corner cinema has a deep canopy and a two-tone illuminated fascia.
box(-15,3.0,-16.0,10.6,.28,1.8,'#98564d');
box(-15,3.30,-15.13,10.6,.55,.14,'#ccbba4');
shopSign('KINO',-18.0,5.35,-16.45,'#87473e',.37);
for(const x of [-16,-14.5]){box(x,1.36,-16.70,1.08,1.65,.17,cream);box(x,1.39,-16.58,.89,1.39,.08,'#9c6a4d');}
for(const x of [-65,-33,-21,22,37,67]){
  const z=-14.8,paint=x<0?'#857257':'#63777a';
  box(x,.66,z,3.9,.67,1.66,paint);
  box(x-.15,1.19,z,1.98,.57,1.45,'#536473');
  box(x-.15,1.50,z,2.10,.12,1.50,paint);
  for(const wheel of [-1.16,1.16])for(const side of [-1,1])box(x+wheel,.33,z+side*.79,.49,.47,.16,roof);
}

function solid(x:number,y:number,z:number,w:number,h:number,d:number,paint:string){
  buildings.push(box(x,y,z,w,h,d,paint));
}
function entryHouse(side:number){
  const x=side*ENTRY_X,z=-17,base=side>0?WINDOW_Y:0,h=ROOF_Y;
  const paint=side>0?'#989083':'#9d7c68',gap=3.4;
  // A recessed, traversable interior with a solid front on either side of its opening.
  for(const sign of [-1,1]){
    solid(x+sign*(8+gap/2)/2,h/2,z,(16-gap)/2,h,.45,paint);
    solid(x+sign*7.85,h/2,z-5,.30,h,10,paint);
    for(const row of [1.55,4.85])for(const col of [3.45,6.25]){
      box(x+sign*col,row,z+.25,1.78,1.65,.09,'#4a575b');
      box(x+sign*col,row-.86,z+.32,2,.14,.28,stone);
      box(x+sign*col,row,z+.34,.095,1.63,.08,sill);
    }
  }
  solid(x,h/2,z-9.9,16,h,.25,'#434544');
  if(base)solid(x,base/2,z,gap,base,.45,paint);
  solid(x,(h+base+2.55)/2,z,gap,h-base-2.55,.45,paint);
  solid(x,h-.12,z-4.9,16.2,.24,10.2,roof);
  if(base)solid(x,base-.11,z-2.3,14,.22,5.2,roof);
  if(side<0){
    solid(x,h+1.6,z-4.3,8,3.2,2.1,'#736b5e');
    box(x,h+3.22,z-4.3,8.42,.16,2.36,roof);
    shopSign('APOTHEKE',x,3.45,z+.39,'#6a5340',.26);
  }else{
    box(x,base-.12,z+.25,3.85,.24,.59,stone);
    for(const sign of [-1,1])box(x+sign*2.15,base+1.25,z+.32,.81,2.54,.13,'#687269');
  }
}
for(let side of [-1,1]){
  entryHouse(side);
  block(side*55,-25,21,15,5,'#b5b2a1',true);
  block(side*78,-24,21,13,3,'#ac8a77',false);
  block(side*102,-27,20,12,5,'#a2a9a2',true);
  block(side*16,-41,16,15,5,'#bcad97',side>0);
  block(side*43,-52,24,11,7,'#9fa49f',true);
}
block(-6,-65,34,13,7,'#b9b6a8',true);
block(23,-73,13,12,9,'#a8aaa4',true);
// Two signal masts and a civil-defence sign frame the street without covering the entry routes.
for(const side of [-1,1]){
  const x=side*23;
  box(x,10,-25,.22,20,.22,'#434e4d');
  for(let i=0;i<4;i++)box(x,15+i*1.3,-25,3.6-i*.65,.09,.12,'#65726d');
  box(x,20.05,-25,.23,.30,.23,'#bf5542');
}
shopSign('SPERRGEBIET',11,7.9,-16.4,'#743c34',.23);
for(const x of [-8,8]){
  box(x,2.15,-11,.22,4.3,.22,'#45504a');
  box(x,3.25,-11,1.27,1.18,.19,'#804338');
  box(x,3.26,-10.88,.76,.16,.045,'#d2c5a1');
}
// Move the entire western block together, including its shared collision boxes.
for(const piece of district)if(piece.z<0)piece.z-=CITY_SHIFT;
const lotEdge=-7.6-CITY_SHIFT;
box(0,-.025,(-6+lotEdge)/2,265,.07,-6-lotEdge,'#69695e');
// The two flags share their stripes. The east flag also carries its gold wreath emblem.
function banner(x:number,y:number,z:number,east:boolean){
  box(x-1.52,y-.70,z,.10,4.4,.10,'#5b6160');
  for(const [i,shade] of ['#252726','#913f34','#c0a254'].entries())box(x,y+(.5-i*.5),z,3,.5,.065,shade);
  if(east){
    for(let i=0;i<10;i++){const a=(i+1)*Math.PI*2/12;box(x+Math.sin(a)*.31,y+Math.cos(a)*.32,z+.05,.105,.125,.04,'#c7a856');}
    box(x,y,z+.065,.07,.43,.04,'#d7bb69');box(x+.035,y+.15,z+.065,.24,.074,.04,'#d7bb69');
  }
}
banner(11.3,8.2,-16.15-CITY_SHIFT,false);
shopSign('WEST BERLIN',15,6.55,-16.53-CITY_SHIFT,'#38494d',.26);
banner(-9.7,4.4,-5.5,true);
shopSign('DDR',-9.7,2.92,-5.42,'#555a4d',.16);
// Courtyard, warehouse doors and rail sidings occupy the reverse view from the tower.
box(0,.01,14,220,.06,9,'#666967');
for(const z of [21,23.2,27.5,29.7])box(0,.14,z,200,.13,.12,'#53585a');
for(let x=-95;x<96;x+=1.65)for(const z of [22.1,28.6])box(x,.07,z,.29,.12,3.35,'#695b4e');
for(let i=-2;i<=2;i++){
  const x=i*25+3,h=i%2?7:9;
  buildings.push(box(x,h/2,43,23,h,14,i%2?'#916b58':'#a77b62'));
  box(x,h+.15,43,23.5,.32,14.5,roof);
  box(x,.37,34.7,22,.73,2.5,'#8a857a');
  box(x,3.96,35.1,21,.24,2.2,'#515858');
  for(const bay of [-7,0,7]){
    box(x+bay,2.0,35.91,4.15,2.65,.2,'#575e5c');
    for(let row=0;row<3;row++)box(x+bay,1.3+row*.53,35.76,3.94,.07,.12,'#777b74');
    box(x+bay,h-1.3,35.86,4.8,1.36,.30,'#586469');
    for(const offset of [-1.32,0,1.32])box(x+bay+offset,h-1.3,35.67,.11,1.38,.10,sill);
  }
}
for(const side of [-1,1]){
  block(side*43,15,17,9,3,'#aaa18c',false,'',-1);
  block(side*75,37,28,13,4,'#a8a99d',true,'',-1);
  box(side*36,12.4,52,2.4,24.8,2.5,'#886858');
  box(side*36,24.8,52,2.9,.7,3,'#5c5550');
  for(let i=0;i<4;i++){
    const x=side*(10+i*9.5);
    box(x,1.30,28.6,8.4,2.15,2.9,i%2?'#7b5548':'#6c7160');
    box(x,2.48,28.6,8.6,.25,3,'#565658');
    box(x,.36,28.6,6.0,.56,2.2,'#404544');
    box(x,1.35,26.99,2.95,1.85,.17,'#595c52');
  }
}
// Use the same walls and openings for line of sight and projectile occlusion.
export function firstBuilding(eye:Vec3,dir:Vec3,limit:number){
  for(const b of buildings){
    let lo=0,hi=limit;
    const center=[b.x,b.y,b.z],size=[b.sx,b.sy,b.sz];
    for(let i=0;i<3;i++){
      const low=center[i]-size[i]/2-eye[i],high=low+size[i];
      if(Math.abs(dir[i])<1e-8){if(low>0||high<0){hi=-1;break;}continue;}
      const a=low/dir[i],c=high/dir[i];
      lo=Math.max(lo,Math.min(a,c));hi=Math.min(hi,Math.max(a,c));
      if(lo>hi)break;
    }
    if(lo<=hi)limit=lo;
  }
  return limit;
}
