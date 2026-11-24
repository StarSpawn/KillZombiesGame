import assert from 'node:assert/strict';
export default async function playthrough(play){
  const read='voxel-zombie.street',page=play.page;
  const state=()=>play.state(read), advance=t=>play.advance(t,{read,stepSeconds:.065});
  const shot=async name=>{await play.advance(.12,{read,render:true,stepSeconds:.03});await play.screenshot(name);};
  const click=action=>page.locator('[data-ui-action="'+action+'"]').click();
  const phase=v=>play.waitFor(s=>s.phase===v,{read});
  await play.waitFor(s=>s.ready,{read});
  await click('skip');await phase('run');
  await page.locator('.capture').click();
  let mx=640,my=360;
  await page.mouse.move(mx,my);
  await page.keyboard.down('KeyD');await advance(3);await page.keyboard.up('KeyD');
  let s=await state();assert.ok(s.x>12.9 && s.x<=13);
  await page.keyboard.down('KeyA');await advance(2.30);await page.keyboard.up('KeyA');
  await advance(2.3);s=await state();
  assert.ok(s.spawned>1 && s.total===8 && s.hp===100);
  const scan=async(angle,name)=>{
    const before=await state();
    const delta=Math.round((angle-before.yaw)/.0023);
    mx+=delta;
    await page.mouse.move(mx,my,{steps:Math.max(1,Math.ceil(Math.abs(delta)/110))});
    await play.advance(.24,{read,stepSeconds:.04,render:true});
    const view=await state();assert.ok(Math.abs(view.yaw-angle)<.05);
    await shot(name);
  };
  await scan(-1.67,'FB-016-west-fence');
  await scan(-Math.PI,'FB-016-rear-rail-yard');
  await scan(-4.60,'FB-016-east-fence');
  await scan(-2*Math.PI,'FB-015-west-berlin');
  // Return yaw to its original turn before using absolute aiming targets.
  await scan(0,'FB-017-street-entrances');
  for(let i=0;i<16 && (await state()).spawned<4;i++)await advance(1);
  assert.deepEqual(new Set((await state()).bodies.map(b=>b.source)),new Set(['alley','shop','window','roof']));
  await shot('FB-018-eight-arrivals');
  for(let i=0;i<40 && !(await state()).bodies.some(b=>b.z>-23);i++)await advance(1);
  assert.ok((await state()).bodies.some(b=>b.z>-23 && b.z<-7));
  await shot('FB-017-emergence');
  await advance(3);
  await page.mouse.down({button:'right'});await advance(.24);
  const look=async(yaw,pitch)=>{
    for(let i=0;i<4;i++){
      const s=await state(),dx=Math.round((yaw-s.yaw)/.0013),dy=Math.round((pitch-s.pitch)/.0013);
      if(Math.abs(dx)+Math.abs(dy)<3)return;
      mx+=dx;my-=dy;await page.mouse.move(mx,my,{steps:Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/150))});await advance(.05);
    }
  };
  for(let i=0;i<180;i++){
    s=await state();if(s.phase!=='run')break;
    const target=s.bodies.filter(b=>!b.dead && b.z>-32).sort((a,b)=>b.z-a.z)[0];
    if(!target){await advance(.5);continue;}
    if(!s.loaded){await play.keyboard.press('KeyR');await advance(.9);continue;}
    const dx=target.x-s.x,dz=s.z-target.z;
    const height=target.y+1.69+(.045*Math.sin(i*2.4));
    await look(Math.atan2(dx+.05*Math.sin(i),dz),Math.atan2(height-s.eye[1],Math.hypot(dx,dz)));
    await page.mouse.down();await advance(.26);await page.mouse.up();await advance(.13);
  }
  await page.mouse.up({button:'right'});
  s=await state();assert.equal(s.phase,'supply','After defense '+JSON.stringify([s.phase,s.hp,s.kills,s.shots,s.bodies.map(b=>b.hits)]));
  assert.equal(s.cash,120);await shot('cleared-wave-supply');
  await click('inspect-mosin');
  assert.match(await page.locator('[data-ui-action="buy-mosin"]').innerText(),/120/);
  await click('buy-mosin');await play.waitFor(s=>s.weapon==='mosin' && s.cash===0,{read});
  await click('shop-close');await phase('choose');await shot('next-wave-options');
  assert.match(await page.locator('[data-choice="1"]').innerText(),/普通丧尸 × 12/);
  await click('wave-1');await phase('run');
  s=await state();assert.equal(s.wave,2);assert.equal(s.total,12);assert.equal(s.hp,100);
  await page.locator('.capture').click();await advance(.15);
  assert.deepEqual(s.carried,['mosin','g18']);
  await page.mouse.wheel(0,120);await advance(.18);
  assert.equal((await state()).weapon,'g18');
  await page.mouse.wheel(0,-120);await advance(.18);
  assert.equal((await state()).weapon,'mosin');
  for(let i=0;i<28 && !(await state()).bodies.some(b=>b.z>-24);i++)await advance(1.5);
  await shot('FB-019-mosin-model');await page.mouse.down({button:'right'});await advance(.42);
  let magnified=await state();assert.ok(magnified.aiming && magnified.zoom===2);
  for(const zoom of [4,6]){
    await play.keyboard.press('KeyV');await advance(.42);
    const next=await state();assert.ok(next.zoom===zoom && next.fov<magnified.fov);
    magnified=next;
  }
  const targets=magnified.bodies.filter(b=>!b.dead && b.z>-32).sort((a,b)=>b.z-a.z);
  assert.ok(targets.length);
  const aimAtChest=async()=>{
    const view=await state(),target=view.bodies.filter(b=>!b.dead && b.z>-32).sort((a,b)=>b.z-a.z)[0];
    const dx=target.x-view.x,dz=view.z-target.z,sensitivity=.0023/view.zoom;
    const turn=Math.round((Math.atan2(dx,dz)-view.yaw)/sensitivity);
    const tilt=Math.round((Math.atan2(target.y+1.13-view.eye[1],Math.hypot(dx,dz))-view.pitch)/sensitivity);
    mx+=turn;my-=tilt;await page.mouse.move(mx,my,{steps:Math.max(1,Math.ceil(Math.max(Math.abs(turn),Math.abs(tilt))/140))});await advance(.04);
  };
  for(let i=0;i<3 && !(await state()).bodies.some(b=>b.chestWounds>0);i++){
    await aimAtChest();await aimAtChest();await page.mouse.down();await advance(.12);await page.mouse.up();await advance(.82);
  }
  assert.ok((await state()).bodies.some(b=>!b.dead && b.hits[0]>0),'rifle body hit');
  await shot('FB-019-six-power-impact');
  await page.mouse.up({button:'right'});
  for(let i=0;i<22 && (await state()).hp===100;i++)await advance(3);
  s=await state();assert.ok(s.hp>0 && s.hp<100);
  await shot('attack-on-fence');await advance(35);await phase('down');
  assert.equal((await state()).hp,0);await shot('fence-breached');
  await click('retry');await phase('run');assert.equal((await state()).wave,2);
  await play.reload();await play.waitFor(s=>s.ready,{read});
  await click('skip');await phase('choose');
  assert.ok((await state()).owned.includes('mosin'));await click('wave-0');
  s=await phase('run');assert.equal(s.wave,1);
  return {firstWave:8,nextWave:12,best:s.bestWave,retained:s.owned,carried:s.carried};
}
