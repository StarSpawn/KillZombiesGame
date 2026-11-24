import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Drive the engine-owned page in a disposable browser profile, using only DOM and input assertions.
const sdk=createRequire(import.meta.resolve('@forgeax/engine'));
const kit=pathToFileURL(sdk.resolve('@forgeax/engine-devkit/package.json'));
const {createBrowserCapture}=await import(new URL('dist/index.mjs',kit).href);
const outputDir=await mkdtemp(join(tmpdir(),'outpost-input-'));
const session=await createBrowserCapture(process.cwd()).open({headless:true,width:1280,height:720,outputDir,
  viteCacheDir:join(outputDir,'vite'),generatedRoot:join(process.cwd(),'.forgeax','generated','tech-smoke')});
const page=session.page,errors=[];
console.log('Playtest images:',outputDir);
const shot=name=>page.screenshot({path:join(outputDir,name+'.png')});
page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(30000);
const click=id=>page.locator('[data-ui-action="'+id+'"]:visible').first().click();
const step=async(code,ms)=>{await page.keyboard.down(code);await page.waitForTimeout(ms);await page.keyboard.up(code);};
try{
  await page.locator('html[data-forgeax-input="open"]').waitFor({state:'attached',timeout:120000});
  await page.evaluate(()=>localStorage.setItem('voxel-zombie.street.v1',JSON.stringify({cash:12000,bestWave:3,owned:['g18','mosin']})));
  await page.reload();await page.locator('html[data-forgeax-input="open"]').waitFor({state:'attached',timeout:120000});
  await click('skip');await click('return-shop');
  const ids=['pouch','ak','truck','shotgun','lmg','radio','rocket','heavy','strike','twin','infantry','salvo','barrage','mortar','tower','strafe','cannon','reserve','airdrop','bomb','car','crew','flak','tank'];
  for(const id of ids){
    await click('inspect-'+id);await click('buy-'+id);
    await page.locator('[data-ui-action="inspect-'+id+'"][data-state="owned"]').waitFor();
  }
  console.log('All 26 technologies unlocked via the game UI.');
  for(const width of [680,1280]){
    await page.setViewportSize({width,height:720});
    const panel=await page.locator('.tree-ledger').boundingBox();
    const details=await page.locator('.dossier').boundingBox();
    assert.ok(panel && panel.x>=0 && panel.x+panel.width<=width+1);
    assert.ok(details && details.x>=0 && details.x+details.width<=width+1);
  }
  const slots=page.locator('.loadout');
  await slots.locator('[data-slot="primary"]').selectOption('lmg');
  await slots.locator('[data-slot="secondary"]').selectOption('shotgun');
  await click('inspect-shotgun');
  await page.locator('[data-ui-action="buy-shotgun"]:disabled').waitFor();
  await shot('FB-025-wave-loadout');
  await click('shop-close');await click('wave-1');await click('capture');
  const held=page.locator('[data-gun]');
  assert.equal(await page.locator('.guns button:visible').count(),2);
  await page.keyboard.press('Digit1');await held.filter({hasText:'轻机枪'}).waitFor();
  await page.mouse.wheel(0,100);await held.filter({hasText:'霰弹枪'}).waitFor();
  await page.mouse.wheel(0,-100);await held.filter({hasText:'轻机枪'}).waitFor();
  await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();
  await page.keyboard.press('KeyR');await page.waitForTimeout(4400);
  assert.ok(Number((await page.locator('[data-spare]').textContent()).replace(/\D/g,''))<180);
  await step('KeyD',590);await step('KeyS',1050);
  await page.locator('.interact').filter({hasText:'领取补给'}).waitFor();
  await page.keyboard.press('KeyE');await page.locator('.field-status').filter({hasText:'2/3'}).waitFor();
  for(let i=0;i<14 && !(await page.locator('.field-status').textContent()).includes('付费空投');i++){
    await page.keyboard.press('KeyQ');await page.waitForTimeout(250);
  }
  await page.keyboard.press('KeyT');
  await page.locator('.field-status').filter({hasText:'空投抵达'}).waitFor();
  await page.mouse.down();await page.waitForTimeout(700);await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('canvas')!==null);
  assert.ok(Number(await page.locator('[data-loaded]').textContent())<60);
  await step('KeyR',120);
  await page.locator('[data-loaded]').filter({hasText:/^60$/}).waitFor();
  await page.locator('.field-status').filter({hasText:/空投抵达|空投已落地/}).waitFor({state:'hidden'});
  assert.equal((await page.locator('[data-spare]').textContent()).trim(),'/ 180');
  await step('KeyW',1400);
  await page.locator('.interact').filter({hasText:'无后坐力炮'}).waitFor();
  await page.keyboard.press('KeyE');await page.locator('.interact').filter({hasText:'离座'}).waitFor();
  await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();
  await page.locator('[data-loaded]').filter({hasText:/^5$/}).waitFor();
  await page.keyboard.press('KeyE');await step('KeyA',525);
  await page.locator('.interact').filter({hasText:'操控重机枪'}).waitFor();
  await page.keyboard.press('KeyE');await held.filter({hasText:'重机枪'}).waitFor();
  const belt=Number(await page.locator('[data-loaded]').textContent());
  await shot('FB-021-heavy-ring');
  await page.mouse.move(650,345,{steps:2});await page.mouse.move(830,370,{steps:4});await page.waitForTimeout(250);
  await shot('FB-021-heavy-traverse');
  await page.mouse.down();await page.waitForTimeout(520);await page.mouse.up();
  const spent=belt-Number(await page.locator('[data-loaded]').textContent());
  assert.ok(spent>0 && spent<=4,'controlled heavy rate, spent '+spent);
  await page.keyboard.press('KeyE');
  // Rotate toward the right-hand fighting position from the centre of the walkway.
  await page.mouse.move(1330,330,{steps:12});await page.waitForTimeout(250);
  await shot('FB-020-023-shared-sentry');
  await step('KeyW',1300);await shot('FB-023-shouldered-rifle');
  await page.reload();await page.locator('html[data-forgeax-input="open"]').waitFor({state:'attached'});await click('skip');await click('return-shop');
  await page.locator('[data-ui-action="inspect-tank"][data-state="owned"]').waitFor();
  assert.equal(await page.locator('.node[data-state="owned"]').count(),26);assert.deepEqual(errors,[]);
  console.log('Passed: 26 technologies, responsive ledger, two-slot loadout, wheel changes, firing, truck and airdrop pickups, independent mounted weapons, persisted purchases.');
}catch(error){
  for(const selector of ['.hud','.distance','.field-status','.interact','.notice','[data-gun]','[data-loaded]','[data-spare]']){
    const item=page.locator(selector).first();
    if(await item.count())console.error(selector,selector==='.hud'?await item.getAttribute('data-phase'):await item.textContent());
  }
  console.error(await page.evaluate(()=>({status:document.documentElement.dataset.forgeaxInput,body:document.body.innerText.slice(0,350),
    error:document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.slice(-1100)})),errors);
  throw error;
}finally{await session.close();}
