import type {} from '@forgeax/engine/app';
import type { Plugin } from '@forgeax/engine/plugin';
import { mountUi, type UiAsset } from '@forgeax/engine/ui';
import { waveCount } from './waves.ts';
import { ARMORY, GUNS, restoreWallet, type Gun, type Wallet } from './loadout.ts';

type State={type:'state';phase:'intro'|'run'|'supply'|'choose'|'down';weapon:Gun;cash:number;owned:Gun[];
  hp:number;kills:number;loaded:number;spare:number;total:number;wave:number;bestWave:number;spawned:number;choices:number[];
  zoom:number;aiming:boolean;reload:number;hitMarker:number;hurt:number;notice:string;ready:boolean;shots:number};
const saveKey='voxel-zombie.street.v1';
const hudAsset:UiAsset={
  guid:'f222ed9a-7915-4ac0-ae51-d02ef58ea63d',browserExtensions:['css'],
  html:`<div class="hud" data-street-hud data-phase="intro">
    <div class="shade"></div><div class="damage" hidden></div>
    <div class="intro layer"><div class="cinema"><span class="rule"></span><div class="kicker">BORDER WATCH / 04</div>
      <h1>边境哨塔</h1><p>在塔台上移动，击退靠近铁网的丧尸。铁网被攻破即失守。</p><p data-first></p>
      <button data-ui-action="skip">开始守卫　<span>SPACE</span></button></div></div>
    <div class="game layer">
      <button class="capture" data-ui-action="capture"><span>点击画面控制视角</span></button>
      <header><div class="kicker">BORDER WATCH / 04</div><strong>第 1 波</strong>
      <div class="route"><i></i></div><div class="distance"></div></header>
      <aside><div class="cash"></div><small>击杀赏金</small></aside>
      <div class="cross"></div><div class="hit" hidden>×</div><div class="notice"></div>
      <div class="vitals"><div class="kicker">铁网耐久</div><b class="hp"></b><div class="bar"><i></i></div></div>
      <div class="guns" aria-label="切换武器">
        <button data-ui-action="g18"><span>1</span> PM <em></em></button>
        <button data-ui-action="ak"><span>2</span> AK <em></em></button>
        <button data-ui-action="shotgun"><span>3</span> 霰弹枪 <em></em></button>
        <button data-ui-action="mosin"><span>4</span> 莫辛纳甘 <em></em></button>
      </div>
      <div class="scope" hidden><i></i><b data-mag></b></div><div class="ammo"><div class="kicker" data-gun></div><b data-loaded></b><small data-spare></small></div>
      <div class="help">WASD 移动　空格 跳跃　左键 射击　右键 瞄准　R 换弹　1–4 切枪　Esc 释放鼠标</div>
    </div>
    <section class="market" hidden role="dialog" aria-modal="true" aria-label="哨塔军需商店">
      <div class="ledger"><div class="market-head"><div><div class="kicker">OUTPOST / SUPPLY</div>
        <h2>哨塔军需处</h2></div><button data-ui-action="shop-close" aria-label="选择下一波">选择下一波 →</button></div>
        <div class="balance">可用现金 <strong data-balance></strong></div>
        <div class="stock">${GUNS.map((g,i)=>`<div class="stock-row"><div><strong>${ARMORY[g].name}</strong>
          <small>${['手枪 · 紧凑','步枪 · 连发','霰弹枪 · 扇形散射','步枪 · 可调倍镜 / 重创'][i]}　/　${ARMORY[g].size} 发</small></div>
          <button data-ui-action="buy-${g}"></button></div>`).join('')}</div>
        <p>购买后永久解锁。每波开始时修复铁网并补充弹药。</p>
      </div></section>
    <section class="waves market" hidden role="dialog" aria-label="选择波次">
      <div class="ledger"><div class="market-head"><h2>选择下一波</h2><button data-ui-action="return-shop">返回军需处</button></div>
      <p data-record></p><div data-options>${[0,1,2].map(i=>`<div class="stock-row" data-choice="${i}"><span><strong></strong><small></small></span><button data-ui-action="wave-${i}">出发</button></div>`).join('')}</div><div class="stock-row" data-other hidden><label>指定已解锁波次　<input type="number" required style="width:55px" min="1" step="1" value="1" aria-label="指定波次"></label><small data-other-count></small><button data-ui-action="custom-wave">出发</button></div></div></section>
    <section class="result layer"><div class="card"><div class="kicker">BORDER WATCH / 04</div><h2></h2><p data-summary></p>
      <button data-ui-action="retry">重新守卫　<span>ENTER</span></button></div></section>
  </div>`,
  css:`
    :host{display:block;pointer-events:none;color:#faf4df;font:14px "Microsoft YaHei UI",sans-serif}
    *{box-sizing:border-box}.hud,.layer,.shade,.damage{position:absolute;inset:0;pointer-events:none}
    .shade{background:linear-gradient(180deg,#171e242e,transparent 18%,transparent 72%,#10161b67)}
    .damage{box-shadow:inset 0 0 100px 22px #a82020a0}.layer{display:none}
    [data-phase=intro] .intro,[data-phase=run] .game,[data-phase=down] .result{display:block}
    .kicker,.distance,button span,.cash,.ammo b,.hp{font-family:Consolas,"Microsoft YaHei UI",monospace;font-variant-numeric:tabular-nums}
    .kicker{font-size:11px;letter-spacing:.17em;font-weight:700;color:#efc37d}
    .intro{background:linear-gradient(0deg,#142025d4,transparent 40%);border-block:clamp(12px,3vh,32px) solid #141b20}
    .cinema{position:absolute;left:6%;bottom:7%}.rule{display:block;width:39px;height:4px;background:#ffb65f;margin-bottom:16px}
    h1,h2{font-size:clamp(36px,5vw,70px);margin:4px 0 9px;line-height:1.2;letter-spacing:.06em}
    p{color:#eee8d8;line-height:1.55;margin:8px 0 16px}button{color:#f6ead1;background:#192123d9;border:1px solid #e8c79777;
    padding:8px 12px;font:inherit;pointer-events:auto;cursor:pointer}button:hover{background:#3c443e}button span{color:#dbb57a;font-size:11px}
    header,aside,.ammo,.vitals,.guns,.help,.notice,.cross,.hit{position:absolute}
    header{top:22px;left:25px;text-shadow:0 1px 4px #222}header strong{display:block;font-size:21px;margin:4px 0 8px}
    .route,.bar{height:3px;background:#dbd9c968}.route{width:140px}.route i,.bar i{display:block;height:100%;background:#efbd79}
    .distance{font-size:12px;margin-top:4px}aside{right:25px;top:20px;text-align:right;text-shadow:0 1px 4px #172020}
    .cash{font-size:28px;color:#ffda93;font-weight:bold}small{font-size:12px}
    .cross,.hit{left:50%;top:50%;transform:translate(-50%,-50%)}.cross{display:none;width:13px;height:13px;
      background:linear-gradient(#f9f9e7,#f9f9e7) center/2px 100% no-repeat,linear-gradient(#f9f9e7,#f9f9e7) center/100% 2px no-repeat;
      filter:drop-shadow(0 1px 1px #111)}[data-aim=true] .cross{display:block;width:3px;height:3px;border-radius:50%;background:#f3d38e;box-shadow:0 0 2px #342820}
    .hit{font:32px Consolas;color:#ffca78}.notice{top:57%;width:100%;text-align:center;color:#ffdc9c;text-shadow:0 1px 4px #201b12}
    .scope{position:absolute;left:50%;top:50%;width:75vmin;height:75vmin;border-radius:50%;transform:translate(-50%,-50%);
      box-shadow:0 0 0 9px #23272a,0 0 0 150vmax #0b1013f5;pointer-events:none;background:linear-gradient(90deg,transparent calc(50% - 1px),#222 50%,transparent calc(50% + 1px)),linear-gradient(transparent calc(50% - 1px),#222 50%,transparent calc(50% + 1px))}
    .scope b{position:absolute;bottom:10%;width:100%;text-align:center;color:#e7d6a6;font:15px Consolas}
    .scope{z-index:0}.guns,.vitals,.ammo,header,aside,.help,.notice,.hit{z-index:1}
    .vitals{left:25px;bottom:56px}.hp,.ammo b{font-size:34px;line-height:1.1}.bar{width:90px}.bar i{background:#a2d0ba}
    .ammo{bottom:52px;right:25px;text-align:right}.ammo small{margin-left:5px}.guns{bottom:54px;left:50%;transform:translateX(-50%);display:flex;gap:5px}
    .guns button{font-size:12px;white-space:nowrap;padding:7px 9px}.guns [aria-pressed=true]{border-color:#f3bd74;box-shadow:inset 0 -2px #f3bd74}
    em{font-style:normal;color:#e4c28d}.help{bottom:14px;width:100%;text-align:center;font-size:12px;color:#f5efd9;text-shadow:0 1px 4px #172023}
    .result{background:#111c22ab}.card{position:absolute;left:9%;top:30%;border-left:3px solid #ebad63;padding:6px 24px}
    .capture,.capture:hover{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;background:transparent}
    .capture span{position:absolute;left:50%;bottom:32%;transform:translateX(-50%);background:#192123e8;
      border:1px solid #d8b58099;color:#f6ead1;padding:8px 15px;white-space:normal;font:14px "Microsoft YaHei UI",sans-serif}
    .market{position:absolute;inset:0;display:grid;place-items:center;pointer-events:auto;background:#10191dd9}
    .ledger{width:min(460px,92%);max-height:94%;overflow:auto;background:#252f2e;border-top:4px solid #caa26c;padding:22px 26px;box-shadow:0 12px 46px #101615}
    .market-head,.balance,.stock-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .market-head h2{font-size:28px;margin:5px 0 10px}.market-head button{font-size:12px}
    .balance{padding:10px 0 14px;color:#d6cbac}.balance strong{font:700 24px Consolas;color:#ffda93}
    .stock-row{padding:12px 0;border-top:1px solid #a3a68a45}.stock-row strong,.stock-row small{display:block}
    .stock-row small{margin-top:3px;color:#c3c7b9}.stock-row button{min-width:96px}.stock-row button:disabled{opacity:.65;cursor:default}
    .ledger p{font-size:12px;color:#c9c7b8;margin:12px 0 0}
    [hidden]{display:none!important}
    @media(max-width:700px){.guns{bottom:95px}.help{font-size:10px}.vitals{left:14px}.ammo{right:14px}}
  `,
};
export const hud:Plugin.Object={
  name:'voxel-zombie/hud',inject:['gameHost'],apply(ctx){
    const host=ctx.gameHost!,root=host.uiRoot,port=host.presentationPort??host.port;
    if(!root)throw new Error('Missing street HUD root');
    ctx.effect(()=>{
      let stored:Wallet|null=null;
      try {stored=restoreWallet(JSON.parse(localStorage.getItem(saveKey)??'null'));} catch { /* Storage may be unavailable. */ }
      const gameCanvas=()=>host.canvas instanceof HTMLCanvasElement?host.canvas:document.querySelector<HTMLCanvasElement>('canvas#app');
      function focusGame(){
        const canvas=gameCanvas();
        if(!canvas)return;
        if(!canvas.hasAttribute('tabindex'))canvas.tabIndex=-1;
        canvas.focus({preventScroll:true});
      }
      let chosen:number[]=[];
      const mounted=mountUi(hudAsset,{root,layer:50,onAction(action){
        if(action==='capture'){
          const canvas=gameCanvas();
          if(!canvas || el('.hud').dataset.phase!=='run')return;
          focusGame();
          try {
            if(typeof canvas.requestPointerLock!=='function'){captureError();return;}
            Promise.resolve(canvas.requestPointerLock()).catch(captureError);
          }catch{captureError();}
          return;
        }
        if(['skip','retry',...GUNS].includes(action)||action.startsWith('wave-'))focusGame();
        if(action==='shop-close')port?.postMessage({type:'choose'});
        else if(action==='custom-wave'){
          const input=el('[data-other] input') as HTMLInputElement;
          if(input.reportValidity())port?.postMessage({type:'wave',level:input.valueAsNumber});
        }
        else if(action==='return-shop')port?.postMessage({type:'supply'});
        else if(action.startsWith('wave-'))port?.postMessage({type:'wave',level:chosen[Number(action.slice(5))]});
        else if(action.startsWith('buy-'))port?.postMessage({type:'gun',gun:action.slice(4)});
        else if(GUNS.includes(action as Gun))port?.postMessage({type:'gun',gun:action});
        else if(action==='skip'||action==='retry')port?.postMessage({type:action});
      }});
      if(!mounted.ok)throw mounted.error;
      const ui=mounted.value, shadow=ui.host.shadowRoot!;
      const el=(s:string)=>shadow.querySelector<HTMLElement>(s)!;
      const set=(s:string,t:string)=>{const e=el(s);if(e.textContent!==t)e.textContent=t;};
      function captureError(){
        if(!ui.host.isConnected || document.pointerLockElement===gameCanvas())return;
        set('.capture span','鼠标锁定未成功。点击重试，或在独立浏览器窗口打开试玩链接。');
      }
      function syncCapture(){
        const captured=document.pointerLockElement!==null && document.pointerLockElement===gameCanvas();
        el('.capture').hidden=captured;
        if(!captured)set('.capture span','点击画面控制视角');
      }
      const release=()=>{
        if(document.pointerLockElement && document.pointerLockElement===gameCanvas())document.exitPointerLock();
      };
      // Discard individual cursor-warp packets before the engine sums motion for a frame.
      // Small successive events from a fast, intentional turn still reach the input backend.
      const filterWarp=(e:PointerEvent)=>{
        const canvas=gameCanvas();
        if(!canvas || e.target!==canvas || document.pointerLockElement!==canvas || e.pointerType!=='mouse')return;
        const limit=Math.max(220,Math.min(440,canvas.clientWidth*.32));
        if(!Number.isFinite(e.movementX)||!Number.isFinite(e.movementY)||Math.hypot(e.movementX,e.movementY)>limit)e.stopImmediatePropagation();
      };
      window.addEventListener('pointermove',filterWarp,true);
      document.addEventListener('pointerlockchange',syncCapture);
      document.addEventListener('pointerlockerror',captureError);
      syncCapture();
      const restore=()=>port?.postMessage({type:'restore',wallet:stored});
      let previousShots=0, audio:AudioContext|undefined;
      const unlockAudio=()=>{try{audio??=new AudioContext();void audio.resume().catch(()=>{});}catch{}};
      function shotSound(g:Gun){
        if(!audio||audio.state!=='running')return;
        const t=audio.currentTime, duration=g==='shotgun'?.18:.095;
        const osc=audio.createOscillator(),gain=audio.createGain();
        osc.type='sawtooth';osc.frequency.setValueAtTime(g==='g18'?180:115,t);osc.frequency.exponentialRampToValueAtTime(32,t+duration);
        gain.gain.setValueAtTime(.095,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
        osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+duration);
        osc.onended=()=>{osc.disconnect();gain.disconnect();};
      }
      function update(event:MessageEvent){
        const data=event.data;
        if(data?.type==='save'){
          stored=restoreWallet(data.wallet);
          try{localStorage.setItem(saveKey,JSON.stringify(stored));}catch{}
          return;
        }
        if(data?.type!=='state')return;
        const s=data as State;if(!s.ready)restore();
        const h=el('.hud');h.dataset.phase=s.phase;h.dataset.aim=String(s.aiming);
        el('.market').hidden=s.phase!=='supply';el('.waves').hidden=s.phase!=='choose';
        if(s.phase!=='run')release();
        set('[data-first]',s.bestWave?'最高已守住第 '+s.bestWave+' 波':'第 1 波　·　普通丧尸 × '+waveCount(1));
        set('.market h2',s.kills===s.total?'第 '+s.wave+' 波已守住':'哨塔军需处');
        chosen=s.choices;
        const other=el('[data-other] input') as HTMLInputElement;
        other.max=String(s.bestWave+1);
        el('[data-other]').hidden=s.bestWave<2;
        set('[data-other-count]',other.validity.valid?'普通丧尸 × '+waveCount(other.valueAsNumber):'请选择已解锁波次');
        set('[data-record]','最高已守住 '+s.bestWave+' 波。可重复挑战积累赏金。');
        for(let i=0;i<3;i++){
          const row=el('[data-choice="'+i+'"]');row.hidden=i>=chosen.length;
          if(!row.hidden){set('[data-choice="'+i+'"] strong','第 '+chosen[i]+' 波');set('[data-choice="'+i+'"] small','普通丧尸 × '+waveCount(chosen[i]));}
        }
        el('.scope').hidden=!(s.phase==='run' && s.weapon==='mosin' && s.aiming);
        set('[data-mag]',s.zoom+'×　V 切换倍率');
        if(s.shots>previousShots)shotSound(s.weapon);previousShots=s.shots;
        el('.damage').hidden=s.hurt<=0;el('.hit').hidden=s.hitMarker<=0;
        set('header strong','第 '+s.wave+' 波');set('.distance','普通丧尸　'+s.kills+' / '+s.total+' 已击退');el('.route i').style.width=s.kills/s.total*100+'%';
        set('.hp',String(s.hp));el('.bar i').style.width=s.hp+'%';set('.cash','$'+s.cash);
        set('[data-gun]',s.reload>0?'换弹中':ARMORY[s.weapon].name+(s.weapon==='mosin'?' · '+s.zoom+'× [V]':''));set('[data-loaded]',String(s.loaded));set('[data-spare]','/ '+s.spare);
        set('.notice',s.notice);set('[data-balance]','$'+s.cash);
        for(const gun of GUNS){
          const button=el('[data-ui-action="'+gun+'"]');button.setAttribute('aria-pressed',String(gun===s.weapon));
          const owned=s.owned.includes(gun),price=ARMORY[gun].price;
          button.hidden=!owned;
          const buy=el('[data-ui-action="buy-'+gun+'"]') as HTMLButtonElement;
          buy.disabled=gun===s.weapon || (!owned && s.cash<price);
          buy.textContent=gun===s.weapon?'已装备':owned?'装备':s.cash<price?'$'+price+' · 差 $'+(price-s.cash):'购买 $'+price;
        }
        if(s.phase==='down'){
          set('.result h2','铁网已被攻破');
          set('[data-summary]','第 '+s.wave+' 波　·　击退 '+s.kills+' / '+s.total+'　·　保留赏金 $'+s.cash);
        }
      }
      const marketKey=(e:KeyboardEvent)=>{
        if(e.code==='Escape' && document.pointerLockElement && document.pointerLockElement===gameCanvas()){
          release();return;
        }
        if(el('.market').hidden || !['Escape','KeyB'].includes(e.code)||e.repeat)return;
        e.preventDefault();e.stopImmediatePropagation();focusGame();port?.postMessage({type:'choose'});
      };
      window.addEventListener('keydown',marketKey,true);
      const menu=(e:Event)=>{if(el('.hud').dataset.phase==='run')e.preventDefault();};
      window.addEventListener('contextmenu',menu);
      window.addEventListener('pointerdown',unlockAudio,{once:true});
      port?.addEventListener('message',update);port?.start();restore();port?.postMessage({type:'status'});
      return ()=>{window.removeEventListener('keydown',marketKey,true);window.removeEventListener('contextmenu',menu);window.removeEventListener('pointerdown',unlockAudio);
        window.removeEventListener('pointermove',filterWarp,true);
        document.removeEventListener('pointerlockchange',syncCapture);document.removeEventListener('pointerlockerror',captureError);
        release();port?.removeEventListener('message',update);void audio?.close().catch(()=>{});ui.dispose();};
    });
  },
};

