import {technologies,techById,branchNames} from './technology.ts';
const x=(col:number)=>16+col*171, y=(tier:number)=>14+tier*79;
const wires=technologies.flatMap(n=>n.parents.map((id,i)=>{
  const p=techById.get(id)!,sx=x(p.column)+73,sy=y(p.tier)+48,tx=x(n.column)+73,ty=y(n.tier);
  let points=[[sx,sy],[sx,sy+15],[tx,sy+15],[tx,ty]];
  if(n.tier-p.tier>1){
    const rail=p.column<n.column?x(n.column)-9:x(n.column)+155+i*5;
    const side=rail>sx?x(p.column)+145:x(p.column),end=rail>tx?x(n.column)+145:x(n.column);
    points=[[side,sy-21],[rail,sy-21],[rail,ty+19+i*9],[end,ty+19+i*9]];
  }
  return points.slice(1).map(([b,d],j)=>{
    const [a,c]=points[j];
    return '<i aria-hidden="true" class="wire" data-link-to="'+n.id+'" style="left:'+Math.min(a,b)+'px;top:'+Math.min(c,d)+'px;width:'+Math.max(2,Math.abs(b-a))+'px;height:'+Math.max(2,Math.abs(d-c))+'px"></i>';
  }).join('');
})).join('');
export const chart='<div class="chart-scroll" tabindex="0" aria-label="科技树，可滚动"><div class="chart">'+wires+technologies.map(n=>
  '<button class="node '+n.branch+'" style="left:'+x(n.column)+'px;top:'+y(n.tier)+'px" data-ui-action="inspect-'+n.id+'"><small>'+branchNames[n.branch]+'</small><b>'+n.name+'</b></button>').join('')+'</div></div>';
export const operationsCss=`
  .intro{border:0;background:linear-gradient(90deg,#071215ec 0%,#101c1bd9 20%,#12212067 48%,transparent 73%),linear-gradient(0deg,#080e10b8,transparent 45%)}
  .cinema{left:6%;bottom:12%;width:min(470px,80vw)}.cinema h1{font-family:"Microsoft YaHei",sans-serif;font-weight:900;font-size:clamp(52px,7vw,96px);letter-spacing:.035em;line-height:1.06}
  .cinema .rule{width:66px;height:5px;background:#cb5541}.cinema .kicker{color:#d6b778;margin:22px 0 12px}
  .cinema p{max-width:310px;color:#e4e4d5}.cinema [data-first]{font:13px Consolas,"Microsoft YaHei UI",monospace;color:#bdc5ae}
  .cinema button,.market-head button{background:#bd533e;color:#fff0d8;border:1px solid #db7c60;font-weight:700}
  .cinema button{margin-top:8px;padding:12px 22px}.cinema button span{margin-left:18px;color:#f9d7b5}
  header,aside,.vitals,.ammo{background:linear-gradient(90deg,#131e1de8,#1a2420a8);border-left:3px solid #aaa57b;padding:8px 12px}
  aside,.ammo{border-left:0;border-right:3px solid #c98a57}.cash{color:#e6c692}.route i{background:#bf6350}
  .market{background:#101816eb}.tree-ledger{width:min(1150px,96%);padding:16px 20px;background:#242d29;border-top:4px solid #b45a45}
  .loadout{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0 0 10px}.loadout label{color:#dcdcc8;font-size:13px}.loadout select{margin-left:4px;padding:3px 6px;color:#f2e6ce;background:#18251e;border:1px solid #7c856d}
  .tech-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,23%);gap:14px}
  .chart-scroll{overflow:auto;max-height:61vh;background-color:#17231f;background-image:linear-gradient(#93a99512 1px,transparent 1px),linear-gradient(90deg,#93a99512 1px,transparent 1px);background-size:22px 22px;scrollbar-color:#596859 #1c2623}
  .chart{position:relative;width:860px;height:785px}.chart .wire{position:absolute;background:#657566;pointer-events:none}.chart [data-active=yes]{background:#cbb47c}
  .node{position:absolute;width:145px;height:48px;padding:4px 9px;text-align:left;border:1px solid #576159;background:#202b26;color:#bdc3b4}
  .node small,.node b{display:block}.node small{font-size:10px;color:#a4aea2}.node b{font-size:14px}
  .node[data-state=owned]{border-left:4px solid #93b79a;background:#30423a}.node[data-state=ready]{border-left:4px solid #dfb36e;color:#ffdda1}
  .node.joint{border-style:double;border-width:3px}.node[aria-pressed=true]{outline:2px solid #eee3c5;outline-offset:2px}
  .dossier{padding:14px;border:1px solid #657065;background:#1b2521;align-self:start}.dossier h3{font-size:23px;margin:10px 0}
  .dossier .req{border-top:1px solid #4b574d;padding-top:10px}.dossier button{width:100%;margin-top:10px;background:#734437}
  .dossier button:disabled{background:#343a34;color:#cac6b6}.tree-ledger .balance{padding:2px 0 8px}
  .field-status{position:absolute;top:114px;left:25px;font:12px/1.55 Consolas,"Microsoft YaHei UI",monospace;white-space:pre-line;color:#e1e5d4;text-shadow:0 1px 3px #000}
  .interact{position:absolute;top:64%;width:100%;text-align:center;font-weight:700;color:#ffdd9c;text-shadow:0 2px 4px black}
  @media(max-width:720px){.tech-layout{grid-template-columns:1fr}.dossier{padding:8px}.dossier h3{font-size:17px;margin:3px 0}.tree-ledger .chart-scroll{max-height:40vh}.tree-ledger .dossier p{margin:3px 0}.field-status{left:12px}.help{display:none}.guns{flex-wrap:wrap;justify-content:center}}
`;
