/* Single-leaf mobile reading: real gestures, state preservation and viewport QA.
 * PLAYWRIGHT_PATH=/path/to/playwright node tests/mobile-reader.test.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadGames, solveActions } = require('./activities.test.cjs');
const games = loadGames();
const root = path.resolve(__dirname,'..');
const output = path.join(root,'output','mobile-review');
const url = pathToFileURL(path.join(root,'index.html')).href;
const storageKey = 'wars-of-the-roses-manuscript-v1';
const errors=[], measurements=[];
let fixtureId=0;
const state = page => page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
async function settle(page, duration=200) {
  await page.waitForTimeout(duration);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function action(page,name,scope='') {
  let control=page.locator(scope+'[data-action="'+name+'"]:visible').first();
  if(!await control.count() && name==='resume-bookmark') control=page.locator('[data-action="mobile-resume"]:visible').first();
  if(!await control.count() && !scope && await page.locator('[data-action="mobile-tools"]:visible').count()) {
    await page.locator('[data-action="mobile-tools"]:visible').click();
    control=page.locator('[data-action="'+name+'"]:visible').first();
  }
  await control.click();
  await page.locator('.page-turn').waitFor({state:'detached'});
  await settle(page);
}
async function openDirectory(page) {
  await action(page,'open-book');
  await page.locator('.routes-book').waitFor();
  await settle(page);
}
async function fixture(page,saved) {
  await page.addInitScript(({key,saved,token})=>{
    if(!sessionStorage.getItem(token)){
      localStorage.setItem(key,JSON.stringify(saved));sessionStorage.setItem(token,'used');
    }
  },{key:storageKey,saved,token:'mobile-fixture-'+(++fixtureId)});
  await page.reload();
}
async function manuscript(page,role='edward',chapter=0,fontSize='standard') {
  return page.evaluate(({role,chapter,fontSize})=>{
    const data=window.BOOK_DATA;
    const legacy={version:1,role,chapter,completed:data.chapters.map(ch=>ch.id),
      selections:Object.fromEntries(data.chapters.map(ch=>[ch.id,Array.isArray(ch.puzzle.answer)?ch.puzzle.answer:[ch.puzzle.answer]]))};
    const engine=new window.BookEngine(data,legacy);
    engine.state.fontSize=fontSize;void engine.game;
    return engine.serialize();
  },{role,chapter,fontSize});
}
const mobileIndex = page => page.locator('.mobile-reader-nav').getAttribute('data-mobile-page').then(Number);
async function step(page,index) {
  await page.locator('.mobile-reader-nav [data-mobile-index="'+index+'"]').click();
  await settle(page);
  assert.equal(await mobileIndex(page),index,'mobile page navigation selects '+index);
}
async function visibleSide(page) {
  return page.evaluate(()=>{
    const leaves=[...document.querySelectorAll('.open-book>.page')].filter(n=>getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().width>0);
    return leaves.map(n=>n.classList.contains('left-page')?'left':'right');
  });
}
async function frame(page,label) {
  await settle(page);
  const measurement=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const pages=[...document.querySelectorAll('.open-book>.page')];
    const visible=pages.filter(n=>getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().width>0);
    return {width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
      book:rect('.open-book'),nav:rect('.mobile-reader-nav'),header:rect('.reading-header'),
      leaves:visible.map(n=>({inert:n.inert,bodyWidth:n.querySelector('.leaf-content').clientWidth,scrollWidth:n.querySelector('.leaf-content').scrollWidth})),
      hidden:pages.filter(n=>!visible.includes(n)).map(n=>({inert:n.inert,hidden:n.getAttribute('aria-hidden')}))};
  });
  assert.equal(measurement.leaves.length,1,label+': exactly one physical page is shown');
  assert.equal(measurement.leaves[0].inert,false,label+': active page remains interactive');
  assert.ok(measurement.hidden.every(n=>n.inert||n.hidden==='true'),label+': hidden page cannot receive focus');
  assert.ok(measurement.docWidth<=measurement.width+1,label+': no horizontal document overflow');
  assert.ok(measurement.book.y>=-1&&measurement.book.bottom<=measurement.height+1,label+': whole book fits vertically '+JSON.stringify(measurement));
  assert.ok(measurement.book.x>=-1&&measurement.book.right<=measurement.width+1,label+': whole book fits width');
  assert.ok(measurement.nav.y>=0&&measurement.nav.bottom<=measurement.height+1,label+': navigation stays on screen');
  assert.ok(measurement.nav.y>=measurement.book.bottom-1,label+': navigation does not cover prose');
  assert.ok(measurement.leaves.every(n=>n.scrollWidth<=n.bodyWidth+2),label+': no inner horizontal clipping');
  measurements.push({label,...measurement});
}
async function tail(page,selector,label) {
  const target=page.locator(selector).last();
  await target.scrollIntoViewIfNeeded();
  await settle(page);
  // A paragraph can be taller than the short-screen reading area. Merely
  // centering it is insufficient: use the reader's continuation control.
  for(let i=0;i<20;i++){
    const remaining=await target.evaluate(n=>{
      const range=document.createRange();range.selectNodeContents(n);
      const line=[...range.getClientRects()].filter(r=>r.height>0).at(-1);
      const body=n.closest('.leaf-content');return line.bottom-body.getBoundingClientRect().bottom;
    });
    if(remaining<=1)break;
    const control=target.locator('xpath=ancestor::section[contains(@class,"page")][1]').locator('[data-action="leaf-down"]');
    if(await control.isDisabled())break;
    await control.click();await settle(page);
  }
  const row=await target.evaluate(n=>{
    const range=document.createRange();range.selectNodeContents(n);
    const last=[...range.getClientRects()].filter(r=>r.height>0).at(-1);
    const body=n.closest('.leaf-content'),r=body.getBoundingClientRect();
    return {top:last.top,bottom:last.bottom,visibleTop:r.top,visibleBottom:r.bottom,font:parseFloat(getComputedStyle(n).fontSize),scroll:body.scrollTop};
  });
  assert.ok(row.top>=row.visibleTop-1&&row.bottom<=row.visibleBottom+1,label+': actual last line fits scroll viewport '+JSON.stringify(row));
  measurements.push({label,...row});
}
async function touch(page,client,selector,dx,dy=0,cancel=false) {
  const target=page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();await settle(page);
  const r=await target.boundingBox();
  assert.ok(r&&r.width&&r.height,'gesture target is visible: '+selector);
  const x=r.x+r.width*(dx<0?.76:.24),y=Math.min(page.viewportSize().height-135,Math.max(r.y+Math.min(r.height/2,45),120));
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++){
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});
    await page.waitForTimeout(14);
  }
  await client.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
  await settle(page,420);
}
async function shot(page,name){await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});}
async function freshPage(browser,{width=390,height=844,motion='reduce'}={}) {
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:motion});
  page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);return page;
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  let page;
  try{
    page=await freshPage(browser,{motion:process.argv.includes('--edges-only')?'no-preference':'reduce'});
    const client=await page.context().newCDPSession(page);
    const data=await page.evaluate(()=>({roles:window.BOOK_DATA.roles.map(r=>r.id),chapters:window.BOOK_DATA.chapters.map(ch=>ch.id),stories:window.BOOK_STORIES}));
    if(process.argv.includes('--edges-only')){
      const saved=await manuscript(page,'edward',0);
      let current=saved.games.edward[data.chapters[0]];
      for(const move of solveActions(games,'edward',0,current))current=games.reduce('edward',0,current,move.action,move.value).state;
      saved.games.edward[data.chapters[0]]=current;
      await fixture(page,saved);await openDirectory(page);await action(page,'resume-bookmark');await settle(page,450);
      await page.locator('.mobile-reader-nav [data-mobile-index="0"]').focus();
      await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
      await settle(page,450);
      assert.equal(await mobileIndex(page),1,'rapid keyboard turns obey animation lock');
      assert.equal((await state(page)).chapter,0,'keyboard cannot bypass subpages and jump to next chapter');
      await step(page,2);await settle(page,450);
      await page.locator('.mobile-reader-nav [data-mobile-index="2"]').focus();
      await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await settle(page,450);
      assert.equal((await state(page)).chapter,0,'final leaf arrows cannot activate next chapter implicitly');
      await action(page,'genealogy');await settle(page,450);
      const sheetBefore=await page.locator('.genealogy-tabs [aria-pressed="true"]').getAttribute('data-index');
      await page.locator('.genealogy-map-page .leaf-content').focus();
      await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await settle(page,450);
      assert.equal(await mobileIndex(page),1,'keyboard turns family tree to detail once');
      assert.equal(await page.locator('.genealogy-tabs [aria-pressed="true"]').getAttribute('data-index'),sheetBefore,'rapid keyboard turns cannot change family sheet');
      console.log('PASS normal-motion keyboard lock and chapter/family boundaries');

      await page.setViewportSize({width:320,height:568});await action(page,'font-size');await action(page,'roles');await settle(page,450);
      await page.locator('[data-action="preview-role"][data-role="margaret"]').click();await settle(page,450);
      assert.equal(await mobileIndex(page),1);
      await tail(page,'.biography-prose','short-screen biography before explicit reopen');
      assert.ok(await page.locator('.roles-book .left-page .leaf-content').evaluate(n=>n.scrollTop)>0,'first biography was scrolled before leaving');
      await step(page,0);await settle(page,450);
      await page.locator('[data-action="preview-role"][data-role="margaret"]').click();await settle(page,450);
      assert.equal(await mobileIndex(page),1);
      assert.equal(await page.locator('.roles-book .left-page .leaf-content').evaluate(n=>n.scrollTop),0,'explicit same-person reopen resets biography to its top');
      console.log('PASS explicit same-person biography reopen begins at the first line');

      await action(page,'routes');await settle(page,450);await step(page,1);await settle(page,450);
      await action(page,'mobile-tools');await action(page,'about','.toolbar ');
      await action(page,'restart-confirm');await action(page,'restart');
      await openDirectory(page);await settle(page,450);
      assert.equal(await mobileIndex(page),0,'restart forgets the prior right-hand directory leaf');
      assert.equal((await state(page)).mode,null,'restart clears the reading bookmark');
      await frame(page,'restarted short mobile directory');
      assert.deepEqual(errors,[]);
      fs.writeFileSync(path.join(output,'edge-report.json'),JSON.stringify({errors,measurements},null,2));
      console.log('PASS right-hand directory → more → restart opens fresh left-hand contents; 0 runtime errors');
      return;
    }
    await openDirectory(page);await frame(page,'390 directory');await shot(page,'directory-390');
    const initial=await state(page);
    // A second directory leaf is discoverable without scrolling through the first.
    await step(page,1);await frame(page,'390 panorama directory');
    assert.equal(await page.locator('.routes-book [data-action="chronicle"]').isVisible(),true);
    await step(page,0);assert.deepEqual(await state(page),initial,'turning contents does not alter a bookmark');
    console.log('PASS mobile contents fit the viewport and both reading routes are one turn away');

    await fixture(page,await manuscript(page,'edward',0));await openDirectory(page);await action(page,'resume-bookmark');
    await page.locator('.reading-book').waitFor();
    assert.equal(await mobileIndex(page),0);await frame(page,'story first leaf');
    await tail(page,'.story-paragraph','story 1 final line');await shot(page,'story-1-390');
    await step(page,1);
    assert.equal(await page.locator('.story-section-title').innerText(),data.stories.edward.chapters[0].pages[1].title);
    assert.deepEqual(await visibleSide(page),['left']);
    await tail(page,'.story-paragraph','story 2 final line');await shot(page,'story-2-390');
    await step(page,2);assert.deepEqual(await visibleSide(page),['right']);
    await page.locator('[data-game-action="choose-option"]').first().click();await settle(page);
    const draft=await state(page);
    assert.equal(await page.locator('.mobile-reader-nav [data-mobile-action="advance"]').isDisabled(),true,'a draft decision cannot skip to the next chapter');
    await page.evaluate(()=>{window.__mobileGame=document.querySelector('.game-board');const body=document.querySelector('.interaction-page .leaf-content');body.scrollTop=100;window.__mobileGameScroll=body.scrollTop;});
    await step(page,1);await step(page,0);await step(page,2);
    const preservation=await page.evaluate(()=>({same:window.__mobileGame===document.querySelector('.game-board'),scroll:document.querySelector('.interaction-page .leaf-content').scrollTop,before:window.__mobileGameScroll}));
    assert.equal(preservation.same,true,'turning leaves keeps the live game DOM');
    assert.equal(preservation.scroll,preservation.before,'turning back restores right-page scroll');
    assert.deepEqual((await state(page)).games,draft.games,'turning leaves preserves an unconfirmed decision');
    assert.deepEqual((await state(page)).completed,draft.completed,'reading pages never completes activities');
    await page.reload();await openDirectory(page);await action(page,'resume-bookmark');
    assert.equal(await mobileIndex(page),2,'refresh and explicit resume restore interaction leaf');
    assert.deepEqual((await state(page)).games,draft.games,'refresh restores decision draft');
    await shot(page,'decision-390');
    await step(page,1);await page.reload();await openDirectory(page);await action(page,'resume-bookmark');
    assert.equal(await mobileIndex(page),1,'refresh restores the story continuation leaf');
    console.log('PASS story 1 → story 2 → interaction, draft/game DOM/scroll preservation and refreshed leaf bookmark');

    // Body gestures use the touch pipeline. Vertical scroll and short/cancelled
    // movement must leave the active page alone; controls and games are excluded.
    await step(page,0);
    await touch(page,client,'.story-paragraph',-130,5);
    assert.equal(await mobileIndex(page),1,'horizontal body swipe advances one story page');
    await touch(page,client,'.story-paragraph',130,-3);
    assert.equal(await mobileIndex(page),0,'reverse horizontal swipe returns one story page');
    await touch(page,client,'.story-paragraph',12,-125);
    assert.equal(await mobileIndex(page),0,'vertical body scrolling never flips a page');
    await touch(page,client,'.story-paragraph',-22,2);
    assert.equal(await mobileIndex(page),0,'short gesture snaps back');
    await touch(page,client,'.story-paragraph',-110,0,true);
    assert.equal(await mobileIndex(page),0,'cancelled touch never commits a turn');
    await step(page,2);
    await touch(page,client,'.game-board',125,0);
    assert.equal(await mobileIndex(page),2,'game drag is not a page turn');
    console.log('PASS horizontal touch turns, reverse turns, vertical scrolling, cancellation and game gesture exclusion');

    // Further route/portrait, miniature completion and responsive checks are
    // deliberately kept in this same browser process to avoid timing contention.
    await fixture(page,await manuscript(page,'margaret',0));await openDirectory(page);await action(page,'resume-bookmark');
    await step(page,2);
    const saved=await state(page),gameState=saved.games.margaret[data.chapters[0]];
    for(const move of solveActions(games,'margaret',0,gameState)){
      await page.locator('[data-game-action="'+move.action+'"][data-game-value="'+move.value+'"]').first().click();
      await settle(page,50);
    }
    assert.equal(await page.locator('.game-complete').count(),1,'miniature remains playable within single page');
    await action(page,'next','.story-revelation ');
    assert.equal((await state(page)).chapter,1);assert.equal(await mobileIndex(page),0,'new chapter opens its first story leaf');

    for(const [width,height,font]of [[390,844,'standard'],[320,568,'large'],[430,932,'large']]){
      await page.setViewportSize({width,height});
      await fixture(page,await manuscript(page,'elizabeth',5,font));await openDirectory(page);await action(page,'resume-bookmark');
      for(const index of [0,1,2]){
        await step(page,index);await frame(page,width+' '+font+' step '+index);
        if(index<2){await tail(page,'.story-paragraph',width+' '+font+' story tail '+index);assert.ok(await page.locator('.story-paragraph').first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize))>=(font==='large'?20:18));}
      }
      await shot(page,'game-'+width);
    }
    console.log('PASS playable miniature, next chapter, 390/320-short/430 viewport and large text final lines');

    await page.setViewportSize({width:390,height:844});
    await action(page,'chronicle');
    assert.equal(await mobileIndex(page),0,'panorama starts with its painting leaf');
    await frame(page,'chronicle illustration');await step(page,1);
    await page.locator('[data-action="chronicle-goto"][data-index="4"]').click();await settle(page);
    await step(page,1);
    await tail(page,'.chronicle-event.is-current .chronicle-consequence p','chronicle timeline final line');
    const chronicle=await state(page);
    await page.reload();await openDirectory(page);await action(page,'resume-bookmark');
    assert.equal(await mobileIndex(page),1,'panorama refresh restores timeline leaf');
    assert.equal((await state(page)).chronicleIndex,4);
    assert.deepEqual((await state(page)).games,chronicle.games,'panorama detour preserves character activities');

    await action(page,'genealogy');await frame(page,'genealogy tree');
    const beforeFamily=await state(page);
    const familyPerson=page.locator('.genealogy-person:visible').first();
    await familyPerson.click();await settle(page);
    assert.equal(await mobileIndex(page),1,'family selection turns to the explanation leaf');
    await tail(page,'.genealogy-detail p','genealogy description final line');
    await action(page,'genealogy-return-tree');assert.equal(await mobileIndex(page),0);
    assert.deepEqual(await state(page),beforeFamily,'family lookup and return leave reading bookmark untouched');
    await page.locator('[data-action="genealogy-sheet"][data-index="2"]').click();await settle(page);
    await page.locator('.genealogy-person[data-person="edward4"]:visible').first().click();await settle(page);
    await action(page,'genealogy-role');
    assert.equal(await mobileIndex(page),1,'family protagonist opens that person’s first biography leaf');
    assert.equal(await page.locator('[data-action="preview-role"][data-role="edward"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await state(page),beforeFamily,'previewing a biography does not replace a saved route');
    for(const index of [1,2,3]){
      await step(page,index);await frame(page,'biography '+index);
      assert.equal(await page.locator('.biography-prose').innerText(),data.stories.edward.introduction[index-1]);
      await tail(page,'.biography-prose','biography final line '+index);
    }
    await shot(page,'biography-390');await step(page,0);await frame(page,'character chooser');
    await page.locator('[data-action="preview-role"][data-role="richard"]').click();await settle(page);
    assert.equal(await mobileIndex(page),1,'choosing another portrait turns to its biography');
    await step(page,3);
    await page.locator('.mobile-reader-nav [data-mobile-action="advance"]').click();await settle(page);
    assert.equal((await state(page)).role,'richard');assert.equal((await state(page)).chapter,0,'new protagonist begins at chapter one');
    assert.equal(await mobileIndex(page),0);
    console.log('PASS panorama two leaves and refresh, family lookup/return, three biography leaves and new character entry');

    await page.setViewportSize({width:1366,height:768});await settle(page);
    assert.deepEqual(await visibleSide(page),['left','right'],'desktop restores both leaves');
    assert.equal(await page.locator('.open-book>.page[inert]').count(),0,'desktop does not retain hidden inert leaves');
    await page.setViewportSize({width:390,height:844});await settle(page);await frame(page,'after desktop/mobile resize');
    assert.equal(await mobileIndex(page),0,'resize retains the active mobile page');
    await page.close();
    page=await freshPage(browser,{motion:'no-preference'});
    await fixture(page,await manuscript(page,'edward',0));await openDirectory(page);await action(page,'resume-bookmark');
    await settle(page,400);
    await page.locator('.mobile-reader-nav [data-mobile-index="1"]').click();
    assert.equal(await page.locator('.mobile-turning').count(),1,'normal motion uses an actual leaf transition');
    // Rapid taps while a page is moving should settle on one valid destination.
    await page.locator('.mobile-reader-nav [data-mobile-index="2"]').dispatchEvent('click');
    await settle(page,450);
    assert.equal(await mobileIndex(page),1,'rapid second tap cannot skip past a moving leaf');
    assert.equal(await page.locator('.mobile-page-ghost').count(),0,'the old visual leaf is removed after transition');
    assert.equal(await page.locator('.open-book>.page.mobile-leaf-active').count(),1);
    await step(page,2);await settle(page,400);
    await page.locator('[data-game-action="choose-option"]').first().click();await settle(page);
    assert.equal(await page.locator('.ma-inner-voice').count()>0,true,'interaction remains usable after animated turns');
    await shot(page,'animated-interaction-390');
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({errors,measurements},null,2));
    console.log('PASS desktop/mobile resize, normal-motion turns, rapid taps and playable interaction; 0 runtime errors');
  }catch(error){
    console.error('Runtime errors:',errors);
    if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true,timeout:3000}).catch(()=>{});
    throw error;
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
