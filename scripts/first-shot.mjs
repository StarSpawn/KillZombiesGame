import assert from 'node:assert/strict';

// Record the frame containing the actual click and its two successors in the owner browser.
export default async function firstShot(play){
  const read='voxel-zombie.street',page=play.page;
  await play.waitFor(s=>s.ready,{read});
  await page.locator('[data-ui-action="skip"]').click();
  await play.waitFor(s=>s.phase==='run',{read});
  await page.locator('.capture').click();
  const samples=[];
  for(let i=0;i<4;i++){
    await page.evaluate(()=>{
      window.shotFrameTimes=[];
      let previous=performance.now(),armed=false;
      const collect=t=>{
        if(armed)window.shotFrameTimes.push(Math.max(0,t-previous));
        previous=t;
        if(window.shotFrameTimes.length<3)requestAnimationFrame(collect);
      };
      document.addEventListener('pointerdown',()=>{armed=true;},{once:true,capture:true});
      requestAnimationFrame(collect);
    });
    await page.mouse.down();await play.advance(.075,{read,stepSeconds:.025,render:true});await page.mouse.up();
    await page.waitForFunction(()=>window.shotFrameTimes.length===3);
    samples.push(await page.evaluate(()=>window.shotFrameTimes.slice()));
    await play.advance(.30,{read,stepSeconds:.05});
  }
  const s=await play.state(read);assert.ok(s.shots>=4 && s.loaded<17);
  console.log('First-shot browser frame intervals (ms): '+JSON.stringify(samples));
  return {shots:s.shots,frameIntervalsMs:samples};
}
