import type { Box, Vec3 } from './fracture.ts';
import type { Gun } from './loadout.ts';

// First-person art palette: blued steel, edge highlights, walnut and worn canvas.
export const gunColors=['#222832','#53616b','#a7b1ac','#885534','#343c44','#986e56','#485c54','#f7d577','#bd8050','#242e2b','#697c74','#506075','#855239','#e2edc7'];
export type ViewPiece=Box & {rise?:number; taper?:number; roll?:number};
function piece(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,rise=0,taper=1):ViewPiece {
  return {x,y,z,sx,sy,sz,color,rise,taper};
}
export const sightHeight:Record<Gun,number>={g18:.113,ak:.176,shotgun:.116};
export function gunBoxes(gun:Gun):ViewPiece[] {
  const p=piece, parts:ViewPiece[]=[];
  if(gun==='g18'){
    parts.push(p(0,.057,-.067,.078,.069,.294,1),p(0,.003,-.06,.073,.047,.24,9),
      p(0,-.076,.028,.075,.15,.075,9,.032,.86),p(0,-.066,-.04,.049,.013,.083,4,.008),
      p(0,-.032,-.081,.049,.060,.013,4),p(0,.096,-.204,.009,.032,.012,0),
      p(0,.109,-.197,.008,.008,.005,13),p(0,.075,.083,.058,.024,.012,0));
    for(const side of [-1,1]){
      parts.push(p(side*.018,.091,.071,.012,.032,.013,0),
        p(side*.018,.101,.079,.006,.006,.003,13),
        p(side*.026,.068,-.079,.014,.009,.141,11));
      for(let i=0;i<5;i++)parts.push(p(side*.039,.056,.016+i*.012,.003,.038,.005,0,.002));
    }
    parts.push(p(.037,.066,-.072,.008,.028,.064,0),p(.041,.070,-.075,.004,.017,.048,2));
  }else if(gun==='ak'){
    parts.push(p(0,.035,-.078,.081,.093,.307,4),p(0,.092,-.080,.078,.049,.27,11,0,.91),
      p(0,.014,.161,.069,.093,.205,3,-.04,.84),p(0,-.01,.26,.073,.103,.027,9),
      p(0,-.065,.004,.064,.114,.069,12,.025,.78),p(0,.021,-.307,.093,.077,.18,3,.002,.79),
      p(0,.077,-.315,.073,.043,.16,8),p(0,.057,-.483,.032,.035,.24,1),
      p(0,.085,-.447,.034,.033,.107,4),p(0,.053,-.60,.043,.046,.041,0),
      p(0,.109,-.062,.062,.027,.102,0),p(0,.116,-.057,.086,.018,.069,11));
    // An open reflex window leaves the street visible inside its rim.
    for(const side of [-1,1]){
      parts.push(p(side*.044,.159,-.072,.008,.072,.024,4),
        {...p(side*.037,.201,-.072,.009,.024,.024,1),roll:side*.65},p(side*.032,.107,-.054,.012,.021,.085,1));
      for(let i=0;i<3;i++)parts.push(p(side*.042,.034,-.267-i*.044,.009,.014,.02,12));
    }
    parts.push(p(0,.211,-.072,.063,.008,.024,1),p(.051,.049,-.043,.032,.017,.024,0));
  }else{
    parts.push(p(0,.034,-.095,.091,.091,.249,1),p(0,.012,.145,.078,.10,.235,3,-.048,.78),
      p(0,-.027,.262,.082,.122,.032,9),p(0,-.042,.024,.065,.071,.083,3,.017,.80),
      p(0,.067,-.453,.047,.052,.52,1),p(0,.011,-.415,.043,.041,.40,0),
      p(0,.021,-.342,.096,.072,.21,8),p(0,.096,-.446,.013,.007,.48,4),
      p(0,.103,-.683,.009,.02,.015,4),p(0,.113,-.682,.011,.008,.010,7),
      p(0,.067,.017,.064,.016,.027,4));
    for(let i=0;i<6;i++)parts.push(p(0,.021,-.262-i*.031,.099,.074,.007,3));
    for(const side of [-1,1])parts.push(p(side*.033,.046,-.094,.029,.019,.101,4));
    parts.push(p(.046,.035,-.094,.008,.026,.097,0),p(.050,.042,-.103,.004,.009,.065,2));
  }
  parts.push(p(.035,-.088,.040,.069,.088,.066,9,.014,.87),
    p(.061,-.14,.103,.084,.076,.119,6,-.045),p(.081,-.17,.168,.091,.085,.09,10,-.027));
  for(let i=0;i<3;i++)parts.push(p(.006,-.064-i*.023,.018,.058,.019,.054,9));
  return parts;
}
export function feedBoxes(gun:Gun):ViewPiece[]{
  if(gun==='shotgun')return [piece(0,-.012,-.16,.031,.031,.069,8),piece(0,-.012,-.122,.033,.033,.012,7)];
  if(gun==='g18')return [piece(0,-.146,.025,.059,.100,.060,4),piece(0,-.197,.026,.077,.014,.072,0)];
  return [piece(0,-.092,-.132,.062,.137,.078,4,.006),piece(0,-.184,-.149,.064,.085,.083,4,.026),
    piece(0,-.237,-.180,.066,.052,.093,0,.023),piece(.032,-.153,-.145,.006,.111,.010,1,.019)];
}
export const supportHand=[
  piece(-.028,-.032,0,.071,.059,.089,9,.012),piece(-.073,-.062,.071,.080,.077,.105,6,-.035),
  piece(-.094,-.085,.126,.087,.080,.073,10,-.020),
  ...[0,1,2].map(i=>piece(.009,-.018,-.03+i*.023,.036,.039,.020,9)),
];
export function reloadPose(gun:Gun,progress:number){
  const t=Math.min(1,Math.max(0,progress)), pull=Math.sin(Math.PI*t)**2;
  const reach=Math.sin(Math.PI*Math.min(1,t/.26)/2)*Math.sin(Math.PI*Math.min(1,(1-t)/.25)/2);
  const rest=gun==='g18'?-.01:gun==='ak'?-.33:-.36;
  const well=gun==='g18'?.025:gun==='ak'?-.15:-.16;
  const travel=gun==='shotgun'?.105:.13;
  return {cant:.43*pull, lift:.158*pull,
    hand:[(gun==='g18'?-.032:-.014)-.045*pull,(gun==='g18'?-.056:.007)-reach*.058-travel*pull,rest+(well-rest)*reach] as Vec3,
    feed:[-.03*pull,-travel*pull,.045*pull] as Vec3};
}
