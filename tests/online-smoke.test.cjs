/* Production acceptance: PLAYWRIGHT_PATH=/path/to/playwright node tests/online-smoke.test.cjs */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const url = process.env.BOOK_ENTRY_URL || 'https://gigige1999.github.io/rosewar/';
const output = path.join(__dirname,'..','output','deployment');
const storageKey = 'wars-of-the-roses-manuscript-v1';
const errors = [], assets = [], checks = [], screenshots = [];
const state = page => page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
const index = page => page.locator('.mobile-reader-nav').getAttribute('data-mobile-page').then(Number);
const stable = page => page.waitForTimeout(180);
async function click(page,selector) {
  await page.locator(selector).first().click();
  await stable(page);
}
async function open(page) {
  await click(page,'.closed-book');
  await page.locator('.routes-book').waitFor();
}
async function turn(page,direction=1) {
  const selector=page.viewportSize().width<=760
    ? '.mobile-reader-nav .mobile-page-'+(direction>0?'next':'previous')
    : '.book-base [data-action="reader-'+(direction>0?'next':'previous')+'"]';
  await click(page,selector);
}
async function leaf(page,target) {
  assert.ok(target===0||target===1,'a chapter has two physical leaves');
  if(await index(page)!==target)await turn(page,target?1:-1);
  assert.equal(await index(page),target);
}
async function action(page,name) {
  let control=page.locator('[data-action="'+name+'"]:visible').first();
  if(!await control.count()) {
    await click(page,'[data-action="mobile-tools"]');
    control=page.locator('[data-action="'+name+'"]:visible').first();
  }
  await control.click();await stable(page);
}
async function snapshot(page,name) {
  const file='live-history-'+name+'.png';
  await page.screenshot({path:path.join(output,file)});
  screenshots.push(file);
}
async function viewport(page,label) {
  const geometry=await page.evaluate(()=>{
    const book=document.querySelector('.open-book').getBoundingClientRect();
    const nav=document.querySelector('.mobile-reader-nav').getBoundingClientRect();
    const visible=[...document.querySelectorAll('.open-book>.page')].filter(n=>getComputedStyle(n).display!=='none');
    return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,
      book:{top:book.top,bottom:book.bottom},nav:{top:nav.top,bottom:nav.bottom},
      leaves:visible.map(n=>({inert:n.inert,w:n.querySelector('.leaf-content').clientWidth,sw:n.querySelector('.leaf-content').scrollWidth}))};
  });
  assert.equal(geometry.leaves.length,1,label+': one physical mobile leaf');
  assert.equal(await page.locator('.mobile-reader-nav button:visible').count(),2,label+': one pair of page controls');
  assert.equal(await page.locator('.mobile-page-tabs,.mobile-reader-context,[data-mobile-index]').count(),0,label+': no competing page controls');
  assert.equal(geometry.leaves[0].inert,false);
  assert.ok(geometry.documentWidth<=geometry.width+1,label+': no document overflow');
  assert.ok(geometry.leaves.every(n=>n.sw<=n.w+2),label+': no clipped horizontal text');
  assert.ok(geometry.book.top>=0&&geometry.book.bottom<=geometry.height+1,label+': book fits');
  assert.ok(geometry.nav.top>=geometry.book.bottom-1&&geometry.nav.bottom<=geometry.height+1,label+': navigation fits');
}
async function swipe(page,client,selector,dx) {
  const target=page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();await stable(page);
  const r=await target.boundingBox();
  const body=await target.locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," leaf-content ")][1]').boundingBox();
  const top=Math.max(r.y,body.y),bottom=Math.min(r.y+r.height,body.y+body.height);
  assert.ok(bottom>top,'swipe begins on visible prose');
  const x=r.x+r.width*(dx<0?.76:.24),y=top+Math.min((bottom-top)/2,40);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=5;i++){
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+2*i/5}]});
    await page.waitForTimeout(12);
  }
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  // The reader suppresses the compatibility click emitted after a touch turn.
  await page.waitForTimeout(420);
}
function observe(page) {
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(12000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const started=Date.now();
  let browser,activePage;
  const timeout=setTimeout(()=>{
    errors.push('Online smoke exceeded its 90-second execution limit');
    browser?.close().catch(()=>{});
  },90000);
  try{
    browser=await chromium.launch({headless:true});
    const desktop=activePage=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    observe(desktop);
    const response=await desktop.goto(url,{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200,'entry responds HTTP 200');
    if(new URL(url).protocol==='https:')assert.equal(new URL(desktop.url()).protocol,'https:','production stays on HTTPS');
    assert.match(await desktop.title(),/玫瑰战争/);
    const content=await desktop.evaluate(()=>({
      milestones:window.BOOK_HISTORY.milestones.length,
      pages:window.BOOK_HISTORY.milestones.map(m=>m.pages.length),
      places:window.HistoryAtlas.places.length,
      art:Object.values(window.BOOK_ART).flatMap(group=>Object.values(group))
    }));
    assert.equal(content.milestones,7);assert.deepEqual(content.pages,[3,3,3,3,3,3,3]);
    assert.equal(content.places,9);assert.equal(content.art.length,13);
    await Promise.all(content.art.map(async src=>{
      const dimensions=await desktop.evaluate(src=>new Promise((resolve,reject)=>{
        const image=new Image();const timer=setTimeout(()=>reject(new Error('Artwork timeout: '+src)),15000);
        image.onload=()=>{clearTimeout(timer);resolve({width:image.naturalWidth,height:image.naturalHeight});};
        image.onerror=()=>{clearTimeout(timer);reject(new Error('Artwork failed: '+src));};image.src=src;
      }),src);
      assert.ok(dimensions.width>100&&dimensions.height>100,src+' is a decoded painting');
      assets.push({path:src,...dimensions});
    }));
    assets.sort((a,b)=>a.path.localeCompare(b.path));
    checks.push('HTTPS/HTTP 200 entry; 7 milestones, 21 detailed pages, 9 map places and 13 decoded paintings');
    await snapshot(desktop,'cover-desktop');
    await open(desktop);
    assert.match(await desktop.locator('.routes-book .history-introduction h1').innerText(),/为什么叫作玫瑰战争/);
    assert.equal(await desktop.locator('.routes-book .right-page [data-action="chronicle-goto"]').count(),7);
    await snapshot(desktop,'overview-desktop');
    await click(desktop,'.routes-book [data-action="chronicle-goto"][data-index="3"]');
    assert.equal((await state(desktop)).chronicleIndex,3);
    assert.equal(await desktop.locator('.chronicle-book>.page').count(),2);
    assert.equal(await desktop.locator('.history-abridged .history-paragraph').count(),2);
    await click(desktop,'.history-full-story > summary');
    assert.equal(await desktop.locator('.history-full-section').count(),3,'full history remains available inside the current spread');
    assert.equal(await desktop.locator('.history-full-section p').count(),9);
    await snapshot(desktop,'1483-desktop');
    await turn(desktop,1);
    assert.equal((await state(desktop)).chronicleIndex,4,'desktop next turns the whole spread to 1485');
    await turn(desktop,-1);
    assert.equal((await state(desktop)).chronicleIndex,3);
    await click(desktop,'[data-action="history-map"]');
    await desktop.locator('dialog.atlas-dialog[open]').waitFor();
    assert.equal(await desktop.locator('dialog .atlas-place-list [data-action="atlas-place"]').count(),9);
    await click(desktop,'dialog .atlas-place-list [data-place="london"]');
    assert.match(await desktop.locator('dialog .atlas-place-detail').innerText(),/1483/);
    assert.equal(await desktop.locator('dialog .atlas-place-list [data-place="london"]').getAttribute('aria-pressed'),'true');
    await click(desktop,'dialog .atlas-place-list [data-place="dublin"]');
    assert.match(await desktop.locator('dialog .atlas-other-year').innerText(),/1487[\s\S]*1483/);
    assert.match(await desktop.locator('dialog .atlas-place-detail').innerText(),/西姆内尔/);
    await snapshot(desktop,'map-dublin-desktop');
    await click(desktop,'dialog .atlas-place-detail [data-action="chronicle-goto"]');
    assert.equal((await state(desktop)).chronicleIndex,6,'Dublin cross-year link opens the 1487 spread');
    assert.equal(await desktop.locator('dialog[open]').count(),0);
    checks.push('Desktop history-first overview; one spread per milestone; retained full history; London/Dublin map dialog and cross-year jump');
    await desktop.close();

    const mobile=activePage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    observe(mobile);
    const client=await mobile.context().newCDPSession(mobile);
    await mobile.goto(url,{waitUntil:'domcontentloaded'});await open(mobile);
    await turn(mobile,1);
    assert.equal(await index(mobile),1,'overview turns from introduction to illustrated timeline');
    await click(mobile,'.routes-book [data-action="chronicle-goto"][data-index="3"]');
    assert.equal(await index(mobile),0);
    await swipe(mobile,client,'.history-spread-summary',-125);
    assert.equal(await index(mobile),1,'real horizontal touch turns illustration to story');
    await turn(mobile,-1);
    assert.equal(await index(mobile),0);
    await turn(mobile,-1);
    assert.equal((await state(mobile)).chronicleIndex,2,'previous from the opening returns to the preceding milestone');
    assert.equal(await index(mobile),1,'backward chapter turn lands on its right leaf');
    const historicalBookmark=await state(mobile);
    await click(mobile,'.toolbar [data-action="genealogy"]');
    await click(mobile,'.genealogy-person:visible');
    assert.equal(await index(mobile),1);
    await click(mobile,'.reading-header [data-action="reader-back"]');
    assert.equal(await index(mobile),0,'person back returns to family diagram');
    await click(mobile,'.reading-header [data-action="reader-back"]');
    await mobile.locator('.chronicle-book').waitFor();
    assert.equal(await index(mobile),1,'family back restores original historical leaf');
    const returned=await state(mobile);
    assert.equal(returned.mode,'chronicle');assert.equal(returned.chronicleIndex,historicalBookmark.chronicleIndex);
    assert.equal(returned.chronicleSide,historicalBookmark.chronicleSide);
    await viewport(mobile,'historical return');await snapshot(mobile,'prose-mobile');
    checks.push('390px real touch, previous spread landing on its right leaf and top family back restore original historical page');

    await action(mobile,'routes');await turn(mobile,1);
    await click(mobile,'.history-milestones [data-action="chronicle-goto"][data-index="6"]');
    assert.equal(await index(mobile),0);
    await turn(mobile,1);
    await click(mobile,'.history-mission-invitation [data-action="roles"]');
    assert.equal(await index(mobile),0,'roles opens on its illustrated introduction');
    await turn(mobile,1);
    await click(mobile,'[data-action="preview-role"][data-role="edward"]:visible');
    assert.equal(await index(mobile),0,'selecting a portrait returns to that introduction');
    await turn(mobile,1);await turn(mobile,1);
    await mobile.locator('.reading-book').waitFor();
    const begun=await state(mobile);
    assert.equal(begun.role,'edward');assert.equal(begun.chapter,0);assert.equal(await index(mobile),0);
    await leaf(mobile,1);
    await click(mobile,'[data-game-action="choose-option"]');
    assert.equal(await mobile.locator('.ma-inner-voice').count(),1,'choice preview reveals character psychology');
    const draft=await state(mobile);
    assert.equal(await mobile.locator('.mobile-reader-nav .mobile-page-next').isDisabled(),true,'an unconfirmed preview cannot finish a chapter');
    await mobile.evaluate(()=>{window.__smokeGame=document.querySelector('.game-board');});
    await swipe(mobile,client,'.ma-inner-voice',125);
    assert.equal(await index(mobile),0,'character psychology text can swipe back to the left story leaf');
    await leaf(mobile,1);
    assert.equal(await mobile.evaluate(()=>window.__smokeGame===document.querySelector('.game-board')),true,'page turns keep the live activity DOM');
    assert.deepEqual((await state(mobile)).games,draft.games,'page turns preserve the choice draft');
    await mobile.reload({waitUntil:'domcontentloaded'});await open(mobile);
    await action(mobile,'resume-bookmark');
    assert.equal(await index(mobile),1,'reload restores the right interaction leaf');
    const restored=await state(mobile);
    assert.equal(restored.role,'edward');assert.equal(restored.chapter,0);
    assert.deepEqual(restored.games,draft.games,'reload restores unconfirmed choice');
    assert.deepEqual(restored.completed,draft.completed);
    await viewport(mobile,'restored decision');await snapshot(mobile,'draft-mobile');
    checks.push('Final milestone → two-page character selection → Edward chapter one; psychology preview, reverse touch, live DOM and choice draft survive reload');
    assert.deepEqual(errors,[],'no runtime or HTTP resource errors');
    fs.writeFileSync(path.join(output,'live-history-report.json'),JSON.stringify({url,checkedAt:new Date().toISOString(),durationMs:Date.now()-started,content:{milestones:7,pages:21,places:9},assets,checks,screenshots,errors},null,2));
    console.log('PASS online unified spreads, retained 21 history sections, 9 map places, 13 paintings, mobile swipe/back and mission draft recovery; 0 errors');
  }catch(error){
    if(activePage&&!activePage.isClosed())await activePage.screenshot({path:path.join(output,'live-history-failure.png'),timeout:1500}).catch(()=>{});
    fs.writeFileSync(path.join(output,'live-history-failure.json'),JSON.stringify({url,checkedAt:new Date().toISOString(),durationMs:Date.now()-started,checks,errors,failure:error.stack},null,2));
    throw error;
  }finally{clearTimeout(timeout);await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
