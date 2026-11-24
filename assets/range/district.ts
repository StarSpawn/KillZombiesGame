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
  // Exposed, staggered brick courses at the worn corner give the silhouette a voxel-scale relief.
  if(!modern){
    const edgeX=x-w/2+.29;
    for(let row=0;row<5;row++){
      const bricks=[4,3,3,1,2][row];
      for(let i=0;i<bricks;i++)box(edgeX+i*.48+(row%2)*.14,.51+.25*row,edge(.12),.45,.21,.22,
        (row+i)%3===0?'#74584b':'#846d5c');
    }
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
// Move the entire western block together, including its shared collision boxes.
for(const piece of district)if(piece.z<0)piece.z-=CITY_SHIFT;
const lotEdge=-7.6-CITY_SHIFT;
box(0,-.025,(-6+lotEdge)/2,265,.07,-6-lotEdge,'#69695e');
shopSign('WEST BERLIN',15,6.55,-16.53-CITY_SHIFT,'#38494d',.26);
// The brick dispatch office faces the left end of the gallery, with the lettering flush to its wall.
solid(-32,2.05,5,7.8,4.1,9.4,'#916b58');
box(-32,4.18,5,8.25,.30,9.85,roof);
box(-27.86,.32,5,.56,.64,9.65,'#938c7e');
for(const z of [2.1,4.5,6.9]){
  box(-28.05,2.18,z,.12,1.65,1.64,'#303c3b');
  box(-27.95,2.2,z,.11,1.39,1.42,z===4.5?'#c09961':'#64726d');
  box(-27.88,2.2,z,.10,1.44,.09,'#494740');
  box(-27.88,2.2,z,.10,.085,1.46,'#494740');
  box(-27.85,1.32,z,.47,.15,1.96,stone);
}
// An upper signal room rises above the long deck when viewed from its centre.
solid(-32.4,5.78,5.8,6.7,3.14,7.25,'#916b58');
box(-32.4,7.45,5.8,7.14,.23,7.65,roof);
for(const z of [3.25,5.75,8.25]){
  box(-29,5.96,z,.15,1.66,1.72,'#303c3b');
  box(-28.89,5.95,z,.10,1.45,1.53,z===5.75?'#baa071':'#677871');
  box(-28.79,5.95,z,.1,1.49,.10,'#443e34');
  box(-28.79,5.95,z,.1,.10,1.58,'#443e34');
  box(-28.79,5.07,z,.41,.17,1.96,stone);
}
const signStart=district.length;
shopSign('DDR POST',0,4.65,0,'#424c48',.15);
for(const piece of district.slice(signStart)){
  const localX=piece.x;piece.x=-29.01+piece.z;piece.z=5-localX;
  [piece.sx,piece.sz]=[piece.sz,piece.sx];
}
// Three stepped brick chimney courses, an aerial and ribbed ceramics break the western roofline.
box(-33.7,8.62,8.2,1.04,2.3,1.06,'#9d7c68');
box(-33.7,9.82,8.2,1.26,.22,1.28,roof);
box(-33.7,10.02,8.2,.82,.20,.87,'#574f49');
for(const x of [-39,-53]){
  box(x,4.55,4.8,.34,9.1,.34,'#706151');
  for(const y of [7.45,8.53]){
    box(x,y,4.8,.26,.19,3.1,'#5e5046');
    for(const z of [3.61,5.99])box(x,y+.24,z,.27,.36,.29,'#acafa0');
  }
}
// The eastern loading shed has a stepped clerestory, corrugated shutters and pallet stacks.
solid(37,2.63,5.75,9.2,5.26,10.7,'#727971');
box(36.7,.48,5.75,11.6,.96,12.5,'#7f8073');
for(let i=0;i<3;i++){
  const z=2.15+i*3.55;
  box(37,5.38,z,9.65,.25,3.57,roof);
  box(37,5.78,z+.77,9.1,.59,1.78,'#475354');
  box(37,6.13,z+.77,9.47,.17,2.05,roof);
}
for(const z of [3,8.2]){
  box(32.34,2.55,z,.17,3.04,3.58,'#404846');
  for(let k=0;k<7;k++)box(32.23,1.28+k*.40,z,.13,.19,3.36,k%3?'#636b63':'#746d59');
  box(31.75,4.24,z,1.57,.19,4.26,roof);
}
for(const [x,z,levels] of [[24,2.4,2],[25.4,5.4,3],[27.8,6.1,1],[23.1,7.5,1]]){
  for(let layer=0;layer<levels;layer++){
    const y=.20+layer*1.02;
    box(x,y,z,2.13,.19,1.49,'#524e43');
    box(x,y+.51,z,1.95,.84,1.31,layer%2?'#777361':'#897253');
    for(const strap of [-.61,.61])box(x+strap,y+.52,z,.12,.87,1.34,'#4f5149');
  }
}
// A rail-mounted lifting frame makes the loading yard recognizable above the platform edge.
for(const x of [29.4,39.8])for(const z of [1.35,10.85]){
  box(x,3.98,z,.33,7.96,.36,'#58574b');
  box(x,.28,z,.85,.56,.89,stone);
}
for(const x of [29.4,39.8])box(x,8.05,6.1,.52,.32,10.15,'#695e47');
for(const z of [3.38,4.03]){
  box(34.6,8.45,z,11.25,.50,.23,'#a38452');
  box(34.6,8.73,z,11.45,.12,.31,'#564f43');
}
box(32.8,8.05,3.71,1.18,.55,1.17,'#5c5b4e');
box(32.8,6.98,3.71,.09,1.68,.09,'#3d4442');
box(32.8,6.13,3.71,.41,.23,.27,'#9a7750');
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
