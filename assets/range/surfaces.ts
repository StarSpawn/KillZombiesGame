import type { TextureAsset } from '@forgeax/engine/types';

export type Surface='masonry'|'concrete'|'gravel';
const size=128;
function noise(x:number,y:number){
  let h=Math.imul(x+341,374761393)+Math.imul(y+59,668265263);
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}
// Periodic value noise keeps damp patches continuous where the 4 m tiles meet.
function mottling(x:number,y:number,step:number){
  const ix=Math.floor(x/step),iy=Math.floor(y/step),wrap=size/step;
  const sample=(dx:number,dy:number)=>noise((ix+dx)%wrap,(iy+dy)%wrap);
  const u=(x%step)/step,v=(y%step)/step;
  return (sample(0,0)*(1-u)+sample(1,0)*u)*(1-v)+(sample(0,1)*(1-u)+sample(1,1)*u)*v;
}
export function surfaceTexture(surface:Surface):TextureAsset{
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const grit=noise(x,y),patch=mottling(x,y,32),chips=mottling(x,y,8);
    // The 2x2 grain and coarser chipped edges survive the mip levels seen from the gallery.
    const fleck=noise(x>>1,y>>1), damp=patch+.32*chips;
    let value=135+patch*40+chips*38+fleck*18+grit*14;
    if(surface==='masonry'){
      const row=Math.floor(y/8),offset=row%2*8,col=(x+offset)%16;
      const brick=noise(Math.floor(((x+offset)%size)/16),row);
      value=142+brick*48+patch*23+fleck*16;
      if(col===0 || y%8===0)value=68+grit*30;
      else if(col===1 || y%8===1)value+=20;
      else if((col>12 || y%8>5) && chips+brick<.63)value-=49;
    }else if(surface==='gravel'){
      value=99+fleck*62+chips*36+grit*26;
      if(damp<.44)value=66+patch*36+fleck*8;
      else if(damp<.48)value=132+fleck*20;
      else if(fleck>.88)value+=37;
    }else{
      // Vertical rain streaks below the horizontal panel joints, with coarse flaked patches.
      const runoff=mottling(x,(y>>2)+16,8);
      if(runoff<.30)value-=42*(1-y%32/32);
      if(y%32===0)value*=.66;
      else if(y%32===1)value+=15;
      if(chips<.27)value-=39;
    }
    const dampShade=damp<.50?1:0;
    const i=(y*size+x)*4;
    data[i]=Math.min(255,value-4*dampShade);
    data[i+1]=Math.min(255,value);
    data[i+2]=Math.min(255,value+(surface==='gravel'?7*dampShade:-5));
    data[i+3]=255;
  }
  return {kind:'texture',shape:{viewDimension:'2d',extent:{width:size,height:size}},format:'rgba8unorm',data,colorSpace:'linear',mips:{kind:'generate'}};
}
