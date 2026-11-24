import type { ViewPiece } from './gun-model.ts';
import type { Vec3 } from './fracture.ts';
import { DECK } from './outpost.ts';

export const stationPositions:Record<string,Vec3>={heavy:[0,DECK,.38],twin:[-3,DECK,.45],cannon:[3,DECK,.45]};
export const truckStop:Vec3=[3,0,10.1];
export const fieldColors=['#252e2d','#404a40','#687051','#827858','#a43f32','#dcc28c','#2e393b','#544535','#c5b390','#c29a55','#687372','#8e9e8c'];
const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,taper=1):ViewPiece=>({x,y,z,sx,sy,sz,color,taper});
export const soldierIds=['infantry','tower','reserve','reserve2','crew','mortarGunner'];
export const SHOULDER=1.26, HEAVY_PIVOT=1.34, SIGHT_RISE=.25;
function soldierLeg(side:number){
  const x=side*.135,z=side*.1;
  return [box(x,.63,z,.20,.40,.24,2),box(x,.35,z-.025,.17,.30,.19,1),box(x,.14,z-.058,.21,.20,.34,0)];
}
function soldierUpper(crew=false){
  // Local origin at the shoulders: coat, helmet, field pack, bent sleeves and gloved hands.
  const p=[box(0,-.13,0,.46,.46,.28,2,.91),box(0,.025,-.045,.52,.18,.30,2),
    box(0,-.22,.17,.34,.32,.16,7),box(0,-.30,0,.46,.075,.30,7),
    box(-.047,.22,-.074,.246,.24,.245,8),box(-.044,.322,-.077,.334,.15,.325,1,.84),
    box(-.044,.274,-.095,.348,.046,.35,2),box(.07,.004,-.058,.08,.38,.24,3)];
  for(const side of [-1,1]){
    p.push(box(side*.156,-.232,-.155,.115,.155,.07,3));
    const x=side*.248;
    p.push(box(x,-.06,-.062,.144,.244,.174,2),box(x,-.139,-.188,.13,.14,.25,2));
  }
  if(crew){
    for(const side of [-1,1])p.push(box(side*.19,-.12,-.36,.11,.11,.18,0));
  }else{
    p.push(box(.125,-.063,-.139,.102,.125,.235,7,.80),box(.125,-.052,-.354,.097,.121,.25,0),
      box(.125,-.051,-.54,.091,.103,.21,7),box(.125,-.025,-.725,.044,.052,.23,0),
      box(.125,-.159,-.371,.062,.13,.087,1),box(.125,.027,-.641,.021,.077,.027,1),
      box(.19,-.106,-.31,.13,.11,.13,0),box(-.082,-.11,-.423,.29,.12,.135,2),
      box(.075,-.102,-.457,.12,.10,.12,0));
  }
  return p;
}
function heavyGun(){
  const p=[box(0,.01,0,.37,.31,.60,1),box(0,.19,-.015,.32,.055,.58,2),
    box(0,.044,-.67,.13,.14,.83,0),box(0,.045,-1.16,.17,.17,.20,1),
    box(-.296,-.032,.006,.27,.33,.41,2),box(-.299,.144,.006,.29,.045,.43,3),
    box(.24,-.036,-.025,.12,.08,.16,7)];
  for(let i=0;i<6;i++)p.push(box(0,.044,-.42-i*.086,.163,.17,.035,1));
  for(const side of [-1,1])p.push(box(side*.16,0,.34,.08,.09,.16,1),box(side*.16,-.028,.44,.084,.21,.078,7));
  // Faceted anti-aircraft ring and suspended centre bead.
  const radius=.155,segments=16;
  for(let i=0;i<segments;i++){
    const a=2*Math.PI*i/segments;
    p.push({...box(Math.cos(a)*radius,SIGHT_RISE+Math.sin(a)*radius,-.61,.015,2*radius*Math.sin(Math.PI/segments)*1.08,.025,0),roll:a});
  }
  p.push(box(0,SIGHT_RISE-.081,-.61,.012,.15,.023,1),box(0,SIGHT_RISE,-.61,.023,.022,.021,9),
    box(-.080,SIGHT_RISE,-.61,.142,.010,.021,1),box(.080,SIGHT_RISE,-.61,.142,.010,.021,1),
    box(0,.085,-.61,.045,.06,.052,1));
  return p;
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
  }else if(id==='legLeft'||id==='legRight')return soldierLeg(id==='legLeft'?-1:1);
  else if(id==='upper'||id==='crewUpper')return soldierUpper(id==='crewUpper');
  else if(id==='heavyGun')return heavyGun();
  else if(id==='heavy'){
    p.push(box(0,.10,0,1.24,.15,.85,1),box(0,.64,0,.18,1.10,.18,1),
      box(0,1.12,0,.56,.15,.36,2),box(0,.22,0,.44,.20,.38,2));
    for(const side of [-1,1])p.push(box(side*.226,1.24,0,.085,.28,.31,1),box(side*.47,.16,.19,.25,.17,.43,2));
  }
  else if(id==='aircraft'){
    p.push(box(0,0,0,1.15,1,7.4,10,.42),box(0,0,-.4,8.5,.22,1.6,1,.45),box(0,.3,2.75,3.15,.16,.95,2),
      box(0,.72,2.8,.21,1.25,1,2),box(0,.58,-1.1,.68,.37,1.15,6));
    for(const x of [-2.9,2.9])p.push(box(x,.14,-.4,.49,.04,.65,4));
  }else if(id==='drop'){
    p.push(box(0,.34,0,.76,.68,.73,7),box(0,.38,0,.12,.72,.75,5),box(0,.39,0,.78,.73,.09,5));
  }else if(id==='chute'){
    p.push(box(0,1.97,0,2.25,.49,2.25,3,.72));for(const x of [-.7,.7])p.push(box(x,1.1,0,.025,1.35,.025,8));
  }else if(id==='mortar'){
    p.push(box(0,.14,0,.9,.24,1.18,1),box(0,.78,-.21,.28,1.2,.4,0));
  }else{
    p.push(box(0,.09,0,1.01,.16,.9,1),box(0,.65,0,.19,1.07,.19,0),box(0,1.25,0,.49,.4,.64,2));
    for(const x of id==='twin'?[-.23,.23]:[0])p.push(box(x,1.29,-.65,id==='cannon'?.25:.08,id==='cannon'?.25:.09,1.32,0));
    p.push(box(.36,1.1,0,.31,.32,.4,3));
  }
  return p;
}
