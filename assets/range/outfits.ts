import { type Box } from './fracture.ts';
import { WOUND_COLORS } from './wounds.ts';

export const outfits=[
  ['街区居民','original','bare','#497f80','#37556d'],
  ['消防员','reflective','helmet','#a17a45','#f1ca66'],
  ['施工员','vest','helmet','#cf713c','#f8da77'],
  ['急救员','cross','cap','#344c63','#ece1c6'],
  ['医生','coat','bare','#dfddca','#558886'],
  ['护士','cross','band','#619995','#f0ead1'],
  ['厨师','apron','toque','#dad8c8','#f3ebdb'],
  ['面包师','apron','cap','#a77a58','#e1c69b'],
  ['警卫','badge','peak','#34404c','#d5b26a'],
  ['邮递员','satchel','cap','#58758d','#a88963'],
  ['快递员','satchel','beanie','#826248','#ccae75'],
  ['码头工','overall','beanie','#486d81','#c79c64'],
  ['水手','stripe','sailor','#d6d8ce','#344d6c'],
  ['机修工','overall','cap','#586a5b','#a1ad96'],
  ['园丁','overall','brim','#64734f','#b69970'],
  ['酒店门童','buttons','pillbox','#8e4142','#dab46f'],
  ['通勤者','tie','bare','#49516a','#ba675d'],
  ['记者','pockets','brim','#b3a084','#625645'],
  ['骑行者','stripe','cycle','#96574b','#ddd0a8'],
  ['环卫工','reflective','cap','#7c9c56','#dfdc8b'],
  ['渔民','coat','rain','#bc9856','#76653f'],
] as const;

// The same color lookup is used on intact, surviving and detached body voxels.
export const bodyColors = [...WOUND_COLORS, '#d73b49', '#aa2639', '#701526'];
export const firstFleshColor = WOUND_COLORS.length;
function swatch(hex:string) {
  const index=bodyColors.indexOf(hex);
  return index<0 ? bodyColors.push(hex)-1 : index;
}
const uniforms=outfits.map(([,style,hat,cloth,accent])=>{
  const rgb=Number.parseInt(cloth.slice(1),16);
  const shadow='#'+[16,8,0].map(n=>Math.round(((rgb>>n)&255)*.76).toString(16).padStart(2,'0')).join('');
  return {style,hat,base:swatch(cloth),trim:swatch(accent),shade:swatch(shadow)};
});

export function dressVoxel(outfit:number,part:number,box:Box):Box {
  const {style,hat,base,trim,shade}=uniforms[outfit];
  if(part===1 && box.color===7 && hat!=='bare'){
    return {...box,color:box.y<2.73 || hat==='band' ? trim : base};
  }
  if(box.color>3 || part===1)return box;
  const {x,y,z}=box, ax=Math.abs(x);
  let accent=false;
  switch(style){
    case 'reflective':case 'stripe': accent=Math.abs(y-1.57)<.075 || Math.abs(y-1.87)<.07;break;
    case 'vest':case 'overall': accent=(ax>.15 && ax<.32 && y>1.66) || (ax<.26 && y>1.43 && y<1.66);break;
    case 'cross':accent=z>0 && (Math.abs(x+.20)<.07 && Math.abs(y-1.84)<.16 || Math.abs(x+.20)<.18 && Math.abs(y-1.84)<.055);break;
    case 'coat':case 'tie':accent=z>0 && (ax<.085 && y>1.46 || Math.abs(ax-.16)<.065 && y>1.87);break;
    case 'apron':accent=ax<(y>1.85?.18:.31) && z>0;break;
    case 'badge':accent=z>0 && x<-.06 && x>-.31 && y>1.77 && y<1.95;break;
    case 'satchel':accent=Math.abs(x-(y-1.66)*.90)<.09;break;
    case 'buttons':accent=z>0 && Math.abs(ax-.17)<.08 && Math.cos((y-1.55)*30)>.1;break;
    case 'pockets':accent=z>0 && Math.abs(ax-.24)<.14 && Math.abs(y-1.69)<.12;break;
  }
  return {...box,color:accent?trim:box.color===3?shade:base};
}

// Keep the original cell membership so undamaged runs can also be reused after a hit.
export type VoxelRun={box:Box; cells:number[]};
export function visibleRuns(runs:VoxelRun[],painted:Box[],alive:Uint8Array){
  const result:Box[]=[];
  for(const {box,cells} of runs){
    if(cells.every(i=>alive[i]))result.push(box);
    else for(const i of cells)if(alive[i])result.push(painted[i]);
  }
  return result;
}
export function compactVoxels(voxels:Box[],runs?:VoxelRun[]):Box[] {
  const members=runs?new Map(voxels.map((box,i)=>[box,[i]])):null;
  for(const [axis,extent,otherA,sizeA,otherB,sizeB] of [
    ['z','sz','x','sx','y','sy'],['x','sx','y','sy','z','sz'],['y','sy','x','sx','z','sz']
  ] as const){
    const rows=new Map<string,Box[]>();
    for(const box of voxels){
      const key=[box.color,box[otherA],box[sizeA],box[otherB],box[sizeB]].map(n=>Math.round(n*1e6)).join(',');
      const row=rows.get(key);
      if(row)row.push(box);else rows.set(key,[box]);
    }
    voxels=[];
    for(const row of rows.values()){
      row.sort((a,b)=>a[axis]-b[axis]);
      let last:Box|undefined;
      for(const box of row){
        if(last && Math.abs(last[axis]+last[extent]/2-box[axis]+box[extent]/2)<1e-6){
          last[axis]+=box[extent]/2;
          last[extent]+=box[extent];
          if(members)members.get(last)!.push(...members.get(box)!);
        }else{last={...box};voxels.push(last);if(members)members.set(last,[...members.get(box)!]);}
      }
    }
  }
  if(runs && members)for(const box of voxels)runs.push({box,cells:members.get(box)!});
  return voxels;
}
