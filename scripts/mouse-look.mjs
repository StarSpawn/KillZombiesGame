import assert from 'node:assert/strict';

export default async function verifyMouseLook(play) {
  const { page } = play;
  const read = 'voxel-zombie.street';
  const state = () => play.state(read);
  const locked = () => page.evaluate(() => document.pointerLockElement === document.querySelector('canvas#app'));
  const checkLock = async expected => {
    await page.waitForFunction(want =>
      (document.pointerLockElement === document.querySelector('canvas#app')) === want, expected, { timeout: 3500 });
    assert.equal(await locked(), expected);
  };
  await play.waitFor(s => s.ready, { read });
  if ((await state()).phase === 'intro') await play.keyboard.press('Space');
  await play.waitFor(s => s.phase === 'run' && !s.shop, { read });
  const enter = async () => {
    const before = await state();
    await page.mouse.click(640, 360);
    await checkLock(true);
    assert.equal((await state()).shots, before.shots, 'Entering mouse control must not fire');
  };
  await checkLock(false);
  const idle = await state();
  await page.mouse.move(520, 310);
  await page.mouse.move(610, 365, { steps: 4 });
  await play.advance(.10, { read });
  assert.equal((await state()).yaw, idle.yaw, 'Released pointer must leave the camera still');
  await enter();
  const before = await state();
  // One large packet imitates a cursor warp at capture; ordinary samples must still accumulate.
  await page.mouse.move(1640,360);
  await play.advance(.10,{read});
  assert.equal((await state()).yaw,before.yaw,'A single 1000-pixel jump must be discarded');
  await page.mouse.move(1640 + 3600, 385, { steps: 36 });
  await play.advance(.10, { read });
  const turned = await state();
  const angle = Math.abs(turned.yaw - before.yaw);
  assert.ok(angle > 2 * Math.PI, 'Same-direction turn must exceed 360 degrees: ' + angle);
  assert.ok(Math.abs(turned.pitch - before.pitch) > .01, 'Vertical motion must change pitch');
  await checkLock(true);
  await play.screenshot('FB-002-continuous-turn');
  await page.keyboard.press('Escape');
  await checkLock(false);
  await page.mouse.move(590, 300);
  await play.advance(.12, { read });
  assert.equal((await state()).yaw, turned.yaw, 'Mouse released with Escape must not turn the camera');
  await enter();
  await play.keyboard.press('KeyB');
  await play.waitFor(s => s.shop, { read });
  await checkLock(false);
  await page.locator('[data-ui-action="shop-close"]').click();
  await play.waitFor(s => !s.shop, { read });
  await enter();
  await page.keyboard.press('Escape');
  await checkLock(false);
  await play.reload();
  await play.waitFor(s => s.ready, { read });
  if ((await state()).phase === 'intro') await play.keyboard.press('Space');
  await play.waitFor(s => s.phase === 'run', { read });
  await enter();
  return { degrees: Math.round(angle * 180 / Math.PI), viewport: page.viewportSize(), recapturedAfterReload: true };
}
