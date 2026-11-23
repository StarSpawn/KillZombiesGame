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
    let value=146+patch*58+chips*21+grit*24;
    if(surface==='masonry'){
      const row=Math.floor(y/8),col=(x+(row%2)*10)%32;
      const brick=noise(Math.floor(((x+(row%2)*10)%128)/32),row);
      value=148+brick*46+patch*28+grit*22;
      if(y%8===0||col===0)value=88+grit*45;
    }else if(surface==='gravel'){
      value=100+grit*64+chips*37+patch*39;
      if(patch+chips*.22<.40)value=88+grit*12;
      else if(grit>.94)value+=40;
    }else if(chips<.25)value-=30;
    const i=(y*size+x)*4;
    data[i]=value;data[i+1]=value;data[i+2]=value;data[i+3]=255;
  }
  return {kind:'texture',shape:{viewDimension:'2d',extent:{width:size,height:size}},format:'rgba8unorm',data,colorSpace:'linear',mips:{kind:'generate'}};
}
