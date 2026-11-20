import assert from 'node:assert/strict';
const read='voxel-zombie.street';
export default async function playthrough(play){
  const {page}=play, state=()=>play.state(read);
  const advance=seconds=>play.advance(seconds,{stepSeconds:.065,read});
  const shot=async name=>{
    await play.advance(.016,{stepSeconds:.016,read,render:true});
    return play.screenshot(name);
  };
  const press=key=>play.keyboard.press(key);
  const hold=async(key,seconds)=>{
    await page.keyboard.down(key);
    try{return await advance(seconds);}finally{await page.keyboard.up(key);}
  };
  const captureMouse=async()=>{
    await page.locator('.capture').waitFor({state:'visible'});
    await page.mouse.click(640,360);
    await page.waitForFunction(()=>document.pointerLockElement===document.querySelector('canvas#app'));
  };
  const ready=async()=>{
    await play.waitFor(s=>s.ready,{read});
    if((await state()).phase==='intro')await press('Space');
    await play.waitFor(s=>s.phase==='run',{read});
  };
  await play.waitFor(s=>s.ready,{read});
  if((await state()).phase==='intro'){
    await shot('opening-flyover');
  }
  await ready();
  let s=await state();
  assert.equal(s.total,1000);assert.equal(s.door,'closed');
  assert.equal(new Set(s.bodies.map(b=>b.outfit)).size,21);
  assert.ok(s.x< -8 && s.feet>=4);await shot('FB-014-upstairs-spawn');
  await press('Digit2');assert.equal((await state()).weapon,'g18');
  await press('KeyB');await play.waitFor(s=>s.shop,{read});
  assert.equal(await page.locator('[data-ui-action="buy-ak"]').isDisabled(),true);
  await shot('FB-010-merchant');
  await page.locator('[data-ui-action="shop-close"]').click();
  await play.waitFor(s=>!s.shop,{read});
  // Resume captured camera control after interacting with the merchant.
  await captureMouse();
  await page.mouse.move(600,350);await advance(.12);
  const before=await state();
  await page.mouse.move(640,365,{steps:3});await advance(.1);s=await state();
  assert.ok(Math.abs(s.yaw-before.yaw)>.025 && Math.abs(s.pitch-before.pitch)>.012,'Captured mouse look '+JSON.stringify([s.yaw,s.pitch,before.yaw,before.pitch]));
  await shot('FB-002-captured-mouse-look');
  let mx=640,my=365;
  const look=async(yaw,pitch)=>{
    // The first move after a reload may only establish the browser's pointer origin.
    for(let attempt=0;attempt<4;attempt++){
      const v=await state(),dx=Math.round((yaw-v.yaw)/.0023),dy=Math.round((pitch-v.pitch)/.0023);
      if(Math.abs(dx)+Math.abs(dy)<=2)return;
      mx+=dx;my-=dy;await page.mouse.move(mx,my,{steps:3});await advance(.12);
    }
    const v=await state();
    assert.ok(Math.abs(v.yaw-yaw)+Math.abs(v.pitch-pitch)<.008,'Look '+JSON.stringify([v.yaw,v.pitch,yaw,pitch]));
  };
  // A fresh run begins centered. Reload also exercises the normal wallet restore.
  await play.reload();await ready();await captureMouse();mx=640;my=360;await hold('KeyW',1.4);
  s=await state();assert.ok(s.canOpen && s.z>0 && s.door==='closed',JSON.stringify([s.z,s.door,s.canOpen]));
  await press('KeyE');assert.equal((await state()).door,'open');
  await shot('FB-007-street-crowd');
  const chest=await state(), torso=chest.bodies[1];
  await look(Math.atan2(torso.x-chest.x,chest.z-torso.z),Math.atan2(1.12-chest.eye[1],Math.hypot(torso.x-chest.x,chest.z-torso.z)));
  await page.mouse.down({button:'left'});await advance(.46);await page.mouse.up({button:'left'});
  s=await state();assert.ok(s.shots>=2 && s.kills===0 && s.bodies.some(b=>b.hits.some((n,part)=>part!==1 && n>0)));
  s=await advance(.12);
  assert.ok(s.bodies.some(b=>!b.dead && b.hits.some((n,part)=>part!==1 && n>0) && b.chestWounds>0),'Surviving dressed body should have visible wound geometry');
  await shot('FB-007-damaged-uniform');
  // Compare the actual scene entities in the idle pose and at mid-reload.
  const resting=(await state()).viewRig;
  const handSeparation=rig=>Math.hypot(...rig[1].map((n,i)=>n-rig[0][i]));
  await page.keyboard.down('KeyR');
  try{
    const middle=await play.waitFor(s=>s.reload>.20 && s.reload<.43,{read});
    assert.ok(handSeparation(middle.viewRig)>handSeparation(resting)+.07,'Support hand must move relative to the gun');
    await page.screenshot({path:'artifacts/play/scripts/playthrough/FB-003-reload-midpoint.png'});
  }finally{await page.keyboard.up('KeyR');}
  await shot('FB-003-reload-hand');
  await advance(1);assert.equal((await state()).loaded,17);
  // Aim at the central street zombie from the open doorway.
  const target=(await state()).bodies[1];
  const v=await state();await look(Math.atan2(target.x-v.x,v.z-target.z),Math.atan2(1.70-v.eye[1],Math.hypot(v.z-target.z,target.x-v.x)));
  await page.mouse.down({button:'left'});await advance(1.85);await page.mouse.up({button:'left'});
  s=await state();assert.ok(s.kills>0,'Head volley '+JSON.stringify([s.shots,s.lastImpact,s.yaw,s.pitch,s.z,s.bodies.slice(0,3)]));
  assert.equal(s.cash,s.kills*15);await shot('FB-006-head-kill');
  const jumpOut=async()=>{
    await page.keyboard.down('KeyW');
    try{await press('Space');await advance(.75);}finally{await page.keyboard.up('KeyW');}
    return advance(.8);
  };
  await look(0,0);s=await jumpOut();
  assert.equal(s.door,'locked');assert.equal(s.feet,0);await shot('FB-014-street-landing');
  s=await hold('KeyS',.7);assert.ok(s.z<0);
  await press('KeyB');await press('KeyE');await press('KeyT');
  s=await state();assert.ok(!s.shop && s.door==='locked' && s.z<0);
  await hold('KeyW',1.1);await advance(12);assert.equal((await state()).phase,'down');await shot('overrun');
  await press('Enter');assert.equal((await state()).door,'closed');
  // Exercise an existing player's funded save in the temporary play browser.
  await page.evaluate(()=>localStorage.setItem('voxel-zombie.street.v1',JSON.stringify({cash:150,owned:['g18'],best:0})));
  await play.reload();await ready();await press('KeyB');
  const buy=async(g,cash)=>{
    await page.locator('[data-ui-action="buy-'+g+'"]').click();
    await play.waitFor(s=>s.weapon===g && s.cash===cash,{read});
  };
  await buy('ak',60);await buy('shotgun',0);
  await page.locator('[data-ui-action="shop-close"]').click();await play.waitFor(s=>!s.shop,{read});
  // A keyboard user can resume immediately after purchasing and closing the panel.
  await page.locator('.market').waitFor({state:'hidden'});
  const focus=await page.evaluate(()=>[document.activeElement?.tagName,document.activeElement?.shadowRoot?.activeElement?.tagName]);
  s=await hold('KeyW',1.3);
  assert.ok(s.canOpen,'Movement after purchase '+JSON.stringify([s.x,s.z,s.door,s.shop,s.yaw,focus]));
  await press('KeyE');assert.equal((await state()).door,'open');
  await captureMouse();
  for(const [i,g] of ['g18','ak','shotgun'].entries()){
    await press('Digit'+(i+1));await advance(.26);
    assert.ok(await page.locator('.cross').isHidden(),'Hip fire must not display a reticle');
    await page.mouse.down({button:'right'});
    try{
      await advance(.5);assert.ok((await state()).aiming);
      await page.locator('.cross').waitFor({state:'visible'});
      await shot('FB-008-sights-'+g);
    }finally{await page.mouse.up({button:'right'});}
    await advance(.25);
    await page.mouse.down({button:'left'});const fired=await advance(.065);await page.mouse.up({button:'left'});
    assert.equal(fired.weapon,g);assert.ok(fired.kick>0 && Math.hypot(fired.lastSpread.x,fired.lastSpread.y)>0);
    await shot('FB-00'+(i===2?'9':'8')+'-'+g);await advance(.85);
  }
  s=await jumpOut();assert.equal(s.door,'locked');
  await hold('KeyW',3.5);mx=640;my=360;await look(1.94,.18);await shot('FB-013-burning-ruins');await look(0,0);await hold('KeyW',4.5);await shot('FB-005-avenue-to-sea');
  s=await state();
  const walkX=s.x;
  s=await hold('KeyW',(s.z+82)/5.65);
  assert.ok(Math.abs(s.z+82)<1);
  s=await hold('KeyA',.9);
  assert.ok(s.x< -12.7 && s.x>=-13.18);
  await page.keyboard.down('KeyA');
  try{await press('Space');s=await advance(.25);assert.ok(s.feet>0 && s.x>=-13.18);}
  finally{await page.keyboard.up('KeyA');}
  const edgeX=s.x;await advance(.8);
  mx=640;my=360;await look(-Math.PI/2,0);
  await shot('FB-011-side-street-depth');
  await look(0,0);await hold('KeyD',(walkX-edgeX)/5.65);
  await shot('FB-011-rain-and-fog');
  s=await hold('KeyW',60);s=await hold('KeyW',60);
  // Turn at the waterfront instead of holding forward against the pier boundary.
  s=await hold('KeyW',(s.z+985.4)/5.65);assert.ok(s.z<-984 && s.phase==='run','Avenue '+JSON.stringify([s.x,s.z,s.hp,s.phase]));
  await page.keyboard.down('KeyW');
  try{await press('Space');await hold('KeyD',2.20);}finally{await page.keyboard.up('KeyW');}
  await hold('KeyW',4);
  s=await state();assert.equal(s.phase,'escaped',JSON.stringify([s.x,s.z,s.hp,s.phase]));
  const savedCash=s.cash;await shot('FB-001-waterfront-escape');
  await play.reload();await ready();s=await state();
  assert.equal(s.cash,savedCash);assert.equal(s.best,1000);assert.equal(s.door,'closed');
  assert.ok(s.owned.includes('ak') && s.owned.includes('shotgun'));
  await shot('reloaded-safehouse');
  // Recheck the outfit at street level after impact particles have faded.
  await captureMouse();mx=640;my=360;
  await hold('KeyW',1.3);await press('KeyE');
  await jumpOut();
  const near=await state(),guard=near.bodies[0];
  await look(Math.atan2(guard.x-near.x,near.z-guard.z),Math.atan2(1.02-near.eye[1],Math.hypot(near.z-guard.z,guard.x-near.x)));
  await page.mouse.down({button:'right'});await advance(.23);
  await page.mouse.down({button:'left'});await advance(.54);await page.mouse.up({button:'left'});
  await page.mouse.up({button:'right'});
  const wounded=await advance(.43);
  assert.ok(wounded.bodies[0].chestWounds>0 && !wounded.bodies[0].dead,'Close uniform wound');
  await look(wounded.yaw+.18,wounded.pitch-.10);
  await play.advance(.16,{stepSeconds:.032,read,render:true});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await shot('FB-007-close-wound');
  return {distance:s.total,appearances:new Set(s.bodies.map(b=>b.outfit)).size,crowd:s.bodies.length,owned:s.owned};
}
