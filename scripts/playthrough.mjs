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
  await page.keyboard.down('KeyD');await advance(2);await page.keyboard.up('KeyD');
  let s=await state();assert.ok(s.x>3.7 && s.x<=4);
  await page.keyboard.down('KeyA');await advance(.70);await page.keyboard.up('KeyA');
  await advance(2.3);s=await state();
  assert.ok(s.spawned>1 && s.total===4 && s.hp===100);
  const scan=async(angle,name)=>{
    const before=await state();
    const delta=Math.round((angle-before.yaw)/.0023);
    mx+=delta;
    await page.mouse.move(mx,my,{steps:Math.max(1,Math.ceil(Math.abs(delta)/110))});
    await play.advance(.24,{read,stepSeconds:.04,render:true});
    const view=await state();assert.ok(Math.abs(view.yaw-angle)<.05);
    await shot(name);
  };
  await scan(-1.35,'FB-016-west-fence');
  await scan(-Math.PI,'FB-016-rear-rail-yard');
  await scan(-4.9,'FB-016-east-fence');
  await scan(-2*Math.PI,'FB-015-west-berlin');
  // Return yaw to its original turn before using absolute aiming targets.
  await scan(0,'FB-017-street-entrances');
  for(let i=0;i<15 && !(await state()).bodies.some(b=>b.z>-16);i++)await advance(1);
  assert.ok((await state()).bodies.some(b=>b.z>-16 && b.z<-7));
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
  for(let i=0;i<60;i++){
    s=await state();if(s.phase!=='run')break;
    const target=s.bodies.filter(b=>!b.dead).sort((a,b)=>b.z-a.z)[0];
    if(!target){await advance(.5);continue;}
    if(!s.loaded){await play.keyboard.press('KeyR');await advance(.9);continue;}
    const dx=target.x-s.x,dz=s.z-target.z;
    const height=1.69+(.045*Math.sin(i*2.4));
    await look(Math.atan2(dx+.05*Math.sin(i),dz),Math.atan2(height-s.eye[1],Math.hypot(dx,dz)));
    await page.mouse.down();await advance(.26);await page.mouse.up();await advance(.13);
  }
  await page.mouse.up({button:'right'});
  s=await state();assert.equal(s.phase,'supply','After defense '+JSON.stringify([s.phase,s.hp,s.kills,s.shots,s.bodies.map(b=>b.hits)]));
  assert.equal(s.cash,60);await shot('cleared-wave-supply');
  await click('buy-shotgun');await play.waitFor(s=>s.weapon==='shotgun' && s.cash===0,{read});
  await click('shop-close');await phase('choose');await shot('next-wave-options');
  assert.match(await page.locator('[data-choice="1"]').innerText(),/普通丧尸 × 6/);
  await click('wave-1');await phase('run');
  s=await state();assert.equal(s.wave,2);assert.equal(s.total,6);assert.equal(s.hp,100);
  for(let i=0;i<15 && (await state()).hp===100;i++)await advance(3);
  s=await state();assert.ok(s.hp>0 && s.hp<100);
  await shot('attack-on-fence');await advance(35);await phase('down');
  assert.equal((await state()).hp,0);await shot('fence-breached');
  await click('retry');await phase('run');assert.equal((await state()).wave,2);
  await play.reload();await play.waitFor(s=>s.ready,{read});
  await click('skip');await phase('choose');
  assert.ok((await state()).owned.includes('shotgun'));await click('wave-0');
  s=await phase('run');assert.equal(s.wave,1);
  return {firstWave:4,nextWave:6,best:s.bestWave,retained:s.owned};
}
