import type { ViewPiece } from './gun-model.ts';
import type { Vec3 } from './fracture.ts';
import { DECK } from './outpost.ts';

export const stationPositions:Record<string,Vec3>={heavy:[0,DECK,.38],twin:[-3,DECK,.45],cannon:[3,DECK,.45]};
export const truckStop:Vec3=[3,0,10.1];
export const fieldColors=['#252e2d','#404a40','#687051','#827858','#a43f32','#dcc28c','#2e393b','#544535','#c5b390','#c29a55','#687372','#8e9e8c'];
const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,taper=1):ViewPiece=>({x,y,z,sx,sy,sz,color,taper});
function soldier(x=0,y=0,z=0):ViewPiece[]{
  const parts=[box(0,1.04,0,.45,.58,.29,2),box(0,1.52,0,.26,.28,.26,8),
    box(0,1.67,0,.34,.17,.33,1,.85),box(.14,1.19,-.32,.10,.12,.65,0),box(-.15,1.19,-.17,.14,.15,.35,2)];
  for(const side of [-1,1])parts.push(box(side*.13,.44,0,.18,.75,.22,1),box(side*.13,.12,-.04,.21,.19,.31,0));
  return parts.map(p=>({...p,x:x+p.x,y:y+p.y,z:z+p.z}));
}
export function fieldModel(id:string):ViewPiece[]{
  const p:ViewPiece[]=[];
  if(['truck','car','tank','flak'].includes(id)){
    const truck=id==='truck',tracked=id==='tank'||id==='flak';
    p.push(box(0,1,0,2.5,.85,truck?6:4.4,2,.87),box(0,.65,0,2.2,.44,4.3,0));
    for(const sign of [-1,1]){
      if(tracked)p.push(box(sign*1.12,.58,0,.51,.84,4.35,0,.82));
      for(let i=0;i<(tracked?5:3);i++)p.push(box(sign*1.18,.51,(i-(tracked?2:1))*(tracked?.77:1.7),.49,.85,.87,1,.78));
    }
    if(truck){p.push(box(0,1.95,1.92,2.34,1.57,1.6,2),box(0,2.2,2.74,1.94,.57,.045,6),
      box(0,2,-.77,2.4,1.44,3.78,3,.89),box(0,2.72,-.72,2.29,.24,3.72,2));
      for(const x of [-.89,.89])p.push(box(x,1.24,2.99,.28,.22,.08,5),box(x,1.28,-3.02,.19,.14,.08,4));
    }else{
      p.push(box(0,1.65,-.18,1.62,.78,1.6,2,.78),box(.58,1.94,-.18,.28,.14,.42,4));
      for(const x of id==='flak'?[-.38,.38]:[0])p.push(box(x,1.73,-1.76,tracked?.17:.09,tracked?.18:.11,2.1,0));
    }
  }else if(id==='infantry'||id==='tower'){
    for(const x of [-1,1])for(const z of [-1,1])p.push(box(x,1.85,z,.19,3.7,.19,7));
    p.push(box(0,3.76,0,2.6,.22,2.6,1),box(0,4.16,-1.2,2.5,.7,.14,2),...soldier(0,3.87,0));
  }else if(id==='reserve'||id==='reserve2'||id==='crew')return soldier();
  else if(id==='aircraft'){
    p.push(box(0,0,0,1.15,1,7.4,10,.42),box(0,0,-.4,8.5,.22,1.6,1,.45),box(0,.3,2.75,3.15,.16,.95,2),
      box(0,.72,2.8,.21,1.25,1,2),box(0,.58,-1.1,.68,.37,1.15,6));
    for(const x of [-2.9,2.9])p.push(box(x,.14,-.4,.49,.04,.65,4));
  }else if(id==='drop'){
    p.push(box(0,.34,0,.76,.68,.73,7),box(0,.38,0,.12,.72,.75,5),box(0,.39,0,.78,.73,.09,5));
  }else if(id==='chute'){
    p.push(box(0,1.97,0,2.25,.49,2.25,3,.72));for(const x of [-.7,.7])p.push(box(x,1.1,0,.025,1.35,.025,8));
  }else if(id==='mortar'){
    p.push(box(0,.14,0,.9,.24,1.18,1),box(0,.78,-.21,.28,1.2,.4,0),...soldier(.82,0,.2));
  }else{
    p.push(box(0,.09,0,1.01,.16,.9,1),box(0,.65,0,.19,1.07,.19,0),box(0,1.25,0,.49,.4,.64,2));
    for(const x of id==='twin'?[-.23,.23]:[0])p.push(box(x,1.29,-.65,id==='cannon'?.25:.08,id==='cannon'?.25:.09,1.32,0));
    p.push(box(.36,1.1,0,.31,.32,.4,3));
  }
  return p;
}
