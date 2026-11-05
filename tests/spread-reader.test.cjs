/* One spread per chapter: uniform navigation, retained full stories and real touch.
 * PLAYWRIGHT_PATH=/path/to/playwright BOOK_ENTRY_URL=http://127.0.0.1:.../ \
 * BOOK_TEST_OUTPUT=/tmp/rosewar-spread-review node tests/spread-reader.test.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadGames, solveActions } = require('./activities.test.cjs');
const gameRules = loadGames();
const root = path.resolve(__dirname,'..');
const url = process.env.BOOK_ENTRY_URL || pathToFileURL(path.join(root,'index.html')).href;
const output = process.env.BOOK_TEST_OUTPUT || process.env.BOOK_OUTPUT || path.join(root,'output','spread-reader-review');
const key = 'wars-of-the-roses-manuscript-v1';
const errors = [], measurements = [];
const motionOnly = process.argv.includes('--motion-only');
let fixtureId = 0;
const isMobile = page => page.viewportSize().width <= 760;
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)) || new window.BookEngine(window.BOOK_DATA).serialize(),key);
const side = page => page.locator('.mobile-reader-nav').getAttribute('data-mobile-page').then(Number);
async function settle(page) {
  await page.locator('.page-turn').waitFor({state:'detached'});
  await page.waitForTimeout(160);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function click(page,selector) { await page.locator(selector).first().click(); await settle(page); }
async function action(page,name,scope='') {
  let button = page.locator(scope+'[data-action="'+name+'"]:visible').first();
  if (!await button.count() && name === 'resume-bookmark') button = page.locator('[data-action="mobile-resume"]:visible').first();
  if (!await button.count() && !scope && await page.locator('[data-action="mobile-tools"]:visible').count()) {
    await page.locator('[data-action="mobile-tools"]:visible').click();
    button = page.locator('[data-action="'+name+'"]:visible').first();
  }
  await button.click(); await settle(page);
}
const turnSelector = (page,direction) => isMobile(page)
  ? '.mobile-reader-nav [data-mobile-action="'+(direction>0?'next':'previous')+'"],.mobile-reader-nav [data-mobile-action="'+(direction>0?'advance':'retreat')+'"]'
  : '[data-action="reader-'+(direction>0?'next':'previous')+'"]:visible';
async function turn(page,direction=1) { await click(page,turnSelector(page,direction)); }
async function open(page) { await action(page,'open-book'); await page.locator('.routes-book').waitFor(); await settle(page); }
async function milestone(page,index) {
  if(isMobile(page)&&!await page.locator('.history-milestones:visible').count())await turn(page);
  await click(page,'.history-milestones [data-index="'+index+'"]');
}
async function fixture(page,saved) {
  await page.addInitScript(({key,saved,token}) => {
    if (!sessionStorage.getItem(token)) {
      localStorage.setItem(key,JSON.stringify(saved)); sessionStorage.setItem(token,'used');
    }
  },{key,saved,token:'spread-fixture-'+(++fixtureId)});
  await page.reload();
}
async function makeSave(page,role='edward',chapter=0,fontSize='standard') {
  return page.evaluate(({role,chapter,fontSize}) => {
    const data=window.BOOK_DATA;
    const saved={version:1,role,chapter,completed:data.chapters.map(item=>item.id),
      selections:Object.fromEntries(data.chapters.map(item=>[item.id,Array.isArray(item.puzzle.answer)?item.puzzle.answer:[item.puzzle.answer]]))};
    const engine=new window.BookEngine(data,saved); engine.state.fontSize=fontSize;
    engine.setReadingSide('story'); engine.setStoryPage(0); void engine.game;
    return engine.serialize();
  },{role,chapter,fontSize});
}
async function fresh(browser,width=1366,height=768,motion='reduce') {
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=760,hasTouch:width<=760,deviceScaleFactor:1,reducedMotion:motion});
  page.setDefaultTimeout(12000); page.on('pageerror',error=>errors.push(error.message));
  if (process.env.BOOK_ENTRY_URL) {
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.route('**/*',route=>{
      const resource=route.request().url();
      if(resource.startsWith(new URL(url).origin+'/'))return route.continue();
      errors.push('Unexpected network resource: '+resource); return route.abort();
    });
  }
  await page.goto(url); return page;
}
async function shot(page,name) { await page.screenshot({path:path.join(output,name+'.png'),fullPage:true}); }
async function frame(page,label) {
  const row=await page.evaluate(()=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const pages=[...document.querySelectorAll('.open-book>.page')];
    const visible=pages.filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0);
    return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,
      book:rect(document.querySelector('.open-book')),nav:rect(document.querySelector(innerWidth<=760?'.mobile-reader-nav':'.book-base')),
      leaves:visible.map(node=>({side:node.classList.contains('left-page')?'left':'right',inert:node.inert,width:node.querySelector('.leaf-content').clientWidth,scrollWidth:node.querySelector('.leaf-content').scrollWidth})),
      hidden:pages.filter(node=>!visible.includes(node)).map(node=>({inert:node.inert,hidden:node.getAttribute('aria-hidden')}))};
  });
  assert.ok(row.documentWidth<=row.width+1,label+': no horizontal document overflow');
  assert.ok(row.book.x>=-1&&row.book.right<=row.width+1,label+': book fits width');
  assert.ok(row.book.y>=-1&&row.book.bottom<=row.height+1,label+': book fits height');
  assert.ok(row.nav.y>=0&&row.nav.bottom<=row.height+1,label+': navigation stays reachable');
  row.leaves.forEach(leaf=>assert.ok(leaf.scrollWidth<=leaf.width+2,label+': no clipped inner width'));
  assert.equal(await page.locator('.story-pagination,.history-pagination,[data-action="leaf-up"],[data-action="leaf-down"]').count(),0,label+': no competing page or scroll controls');
  if (!await page.locator('.routes-book').count()) assert.equal(await page.locator('.reading-header [data-action="reader-back"]:visible').count(),1,label+': return is consistently in the header');
  if(isMobile(page)) {
    assert.equal(row.leaves.length,1,label+': one physical page'); assert.equal(row.leaves[0].inert,false);
    assert.ok(row.hidden.every(leaf=>leaf.inert||leaf.hidden==='true'),label+': hidden page cannot receive input');
    assert.ok(row.nav.y>=row.book.bottom-1,label+': controls do not cover the book');
    assert.equal(await page.locator('.mobile-reader-nav button:visible').count(),2,label+': only previous and next at the bottom');
    assert.equal(await page.locator('.mobile-reader-nav .mobile-page-tabs,.mobile-reader-nav .mobile-reader-context').count(),0,label+': no extra mobile page system');
    assert.equal(await page.locator('.mobile-reader-nav [data-mobile-index]').count(),0);
  } else {
    assert.equal(row.leaves.length,2,label+': both pages belong to the same open chapter');
    assert.equal(await page.locator('.book-base [data-action="reader-previous"]:visible').count(),1);
    assert.equal(await page.locator('.book-base [data-action="reader-next"]:visible').count(),1);
  }
  measurements.push({label,...row});
}
async function tail(page,target,label) {
  await target.scrollIntoViewIfNeeded(); await settle(page);
  // Reading uses native scroll. Measure the actual last line after wheel input,
  // rather than accepting a visible paragraph whose bottom remains clipped.
  for(let i=0;i<24;i++) {
    const row=await target.evaluate(node=>{
      const range=document.createRange();range.selectNodeContents(node);
      const last=[...range.getClientRects()].filter(r=>r.height>0).at(-1);
      let body=node.closest('.leaf-content');
      if(!body){body=node.parentElement;while(body&&!(body.scrollHeight>body.clientHeight+1&&/auto|scroll/.test(getComputedStyle(body).overflowY)))body=body.parentElement;}
      const area=(body||document.documentElement).getBoundingClientRect();
      return {top:last.top,bottom:last.bottom,visibleTop:Math.max(area.top,0),visibleBottom:Math.min(area.bottom,innerHeight),x:area.x+area.width/2,y:Math.max(1,Math.min(innerHeight-1,area.top+area.height/2)),font:parseFloat(getComputedStyle(node).fontSize)};
    });
    if(row.top>=row.visibleTop-1&&row.bottom<=row.visibleBottom+1){measurements.push({label,...row});return;}
    await page.mouse.move(row.x,row.y); await page.mouse.wheel(0,row.bottom>row.visibleBottom?160:-160); await settle(page);
  }
  assert.fail(label+': native scrolling must expose the final text line');
}
async function expandText(page,scope,text,label) {
  const target=page.locator(scope).getByText(text,{exact:true}).last();
  assert.equal(await target.count(),1,label+': full original paragraph is retained');
  // XPath results are in document order, so expand the outermost closed detail
  // before trying to operate any nested summary through ordinary user input.
  for(let i=0;i<8;i++) {
    const closed=target.locator('xpath=ancestor::details[not(@open)]');
    if(!await closed.count())break;
    await closed.first().locator(':scope > summary').click(); await settle(page);
  }
  assert.equal(await target.isVisible(),true,label+': full text can be opened');
  return target;
}
async function historyText(page,history,index,label) {
  const milestone=history.milestones[index];
  assert.equal((await state(page)).chronicleIndex,index);
  assert.equal(await page.locator('.chronicle-book>.page').count(),2);
  const leaves=await page.locator('.chronicle-book>.page').allTextContents();
  leaves.forEach(text=>assert.ok(text.includes(milestone.year),label+': left and right belong to '+milestone.year));
  const paragraphs=milestone.pages.flatMap(item=>item.paragraphs);
  for(const paragraph of paragraphs) await expandText(page,'.chronicle-book .right-page',paragraph,label);
  await tail(page,page.locator('.chronicle-book .right-page').getByText(paragraphs.at(-1),{exact:true}),label+' full-story tail');
  await frame(page,label);
}
async function art(page,label) {
  const row=await page.locator('.history-figure,.chapter-scene').first().evaluate(node=>{
    const r=node.getBoundingClientRect(),leaf=node.closest('.leaf-content').getBoundingClientRect();
    return {width:r.width,height:r.height,leafWidth:leaf.width,loaded:[...node.querySelectorAll('img')].every(img=>img.complete&&img.naturalWidth>0)};
  });
  assert.ok(row.width>=row.leafWidth*.72,label+': illustration spans the reading page');
  assert.ok(row.height>=140,label+': illustration is large enough to read');
  assert.equal(row.loaded,true,label+': supplied illustration is loaded');
  measurements.push({label,...row});
}
async function atlas(page,places,label) {
  const before=await state(page),active=isMobile(page)?await side(page):null;
  await action(page,'history-map'); await page.locator('dialog[open]').waitFor();
  assert.equal(await page.locator('dialog[open] .atlas-place-list [data-action="atlas-place"]').count(),9);
  for(const place of places) {
    await click(page,'dialog[open] .atlas-place-list [data-place="'+place.id+'"]');
    assert.equal((await page.locator('dialog[open] .atlas-place-heading h3').innerText()).trim(),place.name);
    assert.equal(await page.locator('dialog[open] .atlas-place-list [data-place="'+place.id+'"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('dialog[open] .atlas-actors').innerText(),label+': every place explains its people');
  }
  await tail(page,page.locator('dialog[open] .atlas-prose p').last(),label+' map detail tail');
  await action(page,'dismiss','dialog[open] ');
  assert.equal(await page.locator('dialog[open]').count(),0);
  assert.deepEqual(await state(page),before,label+': map visit preserves the reading bookmark and activities');
  if(isMobile(page))assert.equal(await side(page),active,label+': map closes onto the same physical page');
}
async function touch(page,client,selector,dx,dy=0,cancel=false) {
  const target=page.locator(selector).first(); await target.scrollIntoViewIfNeeded(); await settle(page);
  const r=await target.boundingBox();
  const leaf=await target.locator('xpath=ancestor-or-self::*[contains(concat(" ",normalize-space(@class)," ")," leaf-content ")][1]').boundingBox();
  assert.ok(r&&leaf,'touch target is within a reading page');
  const top=Math.max(r.y,leaf.y),bottom=Math.min(r.y+r.height,leaf.y+leaf.height);
  assert.ok(bottom>top,'touch target is physically visible');
  const x=r.x+r.width*(dx<0?.76:.24),y=top+Math.min((bottom-top)/2,48);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++){
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});
    await page.waitForTimeout(16);
  }
  await client.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]}); await settle(page);
}
async function resumeFixture(page,saved) { await fixture(page,saved); await open(page); await action(page,'resume-bookmark'); }
async function stories(page,stories,role,index,label) {
  const original=stories[role].chapters[index].pages.flatMap(item=>item.paragraphs);
  for(const paragraph of original) await expandText(page,'.story-page',paragraph,label);
  await tail(page,page.locator('.story-page').getByText(original.at(-1),{exact:true}),label+' full-story tail');
  await frame(page,label); await art(page,label);
}
async function detours(page,label) {
  const before=await state(page),active=isMobile(page)?await side(page):null;
  await action(page,'routes'); assert.deepEqual(await state(page),before,label+': directory does not rewrite bookmarks');
  await action(page,'resume-bookmark');
  assert.deepEqual(await state(page),before,label+': explicit resume keeps activity draft');
  if(isMobile(page))assert.equal(await side(page),active);
  const readingUi=await page.evaluate(()=>({details:[...document.querySelectorAll('.open-book details')].map(node=>node.open),scroll:[...document.querySelectorAll('.open-book .leaf-content')].map(node=>node.scrollTop)}));
  await action(page,'genealogy');
  await page.locator('.genealogy-book').waitFor(); await frame(page,label+' genealogy');
  if(isMobile(page)) {
    await click(page,'.genealogy-person:visible');
    assert.equal(await side(page),1,label+': a family member opens the explanation page');
    await action(page,'reader-back','.reading-header ');
    assert.equal(await side(page),0,label+': first family return reaches the tree');
  }
  await action(page,'reader-back','.reading-header ');
  assert.equal(await page.locator('.reading-book').count(),1,label+': family lookup returns to the character');
  assert.deepEqual(await state(page),before,label+': genealogy lookup preserves character state');
  if(isMobile(page))assert.equal(await side(page),active);
  assert.deepEqual(await page.evaluate(()=>({details:[...document.querySelectorAll('.open-book details')].map(node=>node.open),scroll:[...document.querySelectorAll('.open-book .leaf-content')].map(node=>node.scrollTop)})),readingUi,label+': family return preserves expanded text and scroll position');
}
async function rapidTurn(page,direction) {
  const selector='.mobile-reader-nav .mobile-page-'+(direction>0?'next':'previous');
  // The first event is real pointer input; repeats target the freshly rendered
  // control immediately, without Playwright's animation-stability waiting.
  await page.locator(selector).click({force:true});
  await page.locator(selector).dispatchEvent('click');
  await page.locator(selector).dispatchEvent('click');
  await page.waitForTimeout(420); await settle(page);
}
async function motionChecks(page) {
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),false);
  const summaries=await page.evaluate(()=>window.Chronicle.abridged.map((entry,index)=>{
    const fragment=document.createElement('div'); fragment.innerHTML=window.Chronicle.render(index);
    const portraits=fragment.querySelector('.history-witnesses'),prose=fragment.querySelector('.history-reading-copy');
    return {index,length:[...entry.paragraphs.join('')].length,portraits:portraits?.querySelectorAll('img').length||0,
      defaultPortraits:Boolean(portraits&&!portraits.closest('details')),
      portraitsBeforeProse:Boolean(portraits&&prose&&(portraits.compareDocumentPosition(prose)&Node.DOCUMENT_POSITION_FOLLOWING))};
  }));
  assert.equal(summaries.length,7);
  for(const row of summaries){
    assert.ok(row.length>0&&row.length<=150,'milestone '+row.index+': first-read prose stays within 150 characters');
    assert.ok(row.portraits>0&&row.defaultPortraits&&row.portraitsBeforeProse,'milestone '+row.index+': people appear before prose without expanding a detail');
  }
  measurements.push({label:'seven concise summaries and default portrait order',summaries});
  await page.locator('[data-action="open-book"]').first().click();
  await page.locator('[data-action="skip-intro"]').waitFor({state:'visible'});
  await action(page,'skip-intro'); await page.locator('.routes-book').waitFor();
  await turn(page); await page.waitForTimeout(420);
  await milestone(page,0); await page.waitForTimeout(420);
  assert.equal(await side(page),0); assert.equal((await state(page)).chronicleIndex,0);
  await rapidTurn(page,1);
  assert.equal(await side(page),1,'rapid next taps move left to right exactly once');
  assert.equal((await state(page)).chronicleIndex,0,'rapid next taps cannot also cross the chapter boundary');
  await rapidTurn(page,1);
  assert.equal((await state(page)).chronicleIndex,1,'rapid boundary taps advance only one chapter');
  assert.equal(await side(page),0,'a newly entered chapter remains on its left page during repeat taps');
  await rapidTurn(page,-1);
  assert.equal((await state(page)).chronicleIndex,0,'rapid reverse boundary taps return only one chapter');
  assert.equal(await side(page),1,'reverse boundary returns to the prior right page without skipping it');
  await frame(page,'normal-motion rapid navigation'); await shot(page,'mobile-normal-motion-repeat-taps');
  assert.equal(await page.locator('.reading-header [data-action="reader-back"]:visible').count(),1);
  await action(page,'reader-back','.reading-header '); await page.waitForTimeout(420);
  assert.equal(await page.locator('.routes-book').count(),1,'the original return path survives rapid navigation');
  console.log('PASS normal animation: repeated taps commit one leaf or boundary only; reverse landing and header return remain coherent');
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true}); let page;
  try {
    if(!motionOnly){
    page=await fresh(browser);
    const {history,places,stories:sourceStories}=await page.evaluate(()=>({history:window.BOOK_HISTORY,places:window.HistoryAtlas.places,stories:window.BOOK_STORIES}));
    await open(page); await frame(page,'desktop directory');
    assert.match(await page.locator('.history-introduction').innerText(),/为什么.*玫瑰战争/);
    assert.equal(await page.locator('.history-milestones [data-action="chronicle-goto"]').count(),7);
    await milestone(page,0);
    for(let index=0;index<7;index++) {
      await art(page,'desktop history '+index);
      await historyText(page,history,index,'desktop history '+index);
      if(index<6)await turn(page);
    }
    assert.equal((await state(page)).role,null); assert.deepEqual((await state(page)).completed,[]);
    await atlas(page,places,'desktop atlas');
    await turn(page,-1); assert.equal((await state(page)).chronicleIndex,5);
    await shot(page,'desktop-unified-history-spread');
    const historical=await state(page); await page.reload(); await open(page);
    assert.deepEqual(await state(page),historical,'refresh opening stays in the overview and preserves historical bookmark');
    await action(page,'resume-bookmark'); assert.equal((await state(page)).chronicleIndex,5);

    for(const role of ['margaret','warwick','edward','beaufort','richard','elizabeth']) {
      await action(page,'roles'); await click(page,'[data-action="preview-role"][data-role="'+role+'"]');
      for(const paragraph of sourceStories[role].introduction)await expandText(page,'.role-biography',paragraph,'desktop '+role+' biography');
      await tail(page,page.locator('.role-biography').getByText(sourceStories[role].introduction.at(-1),{exact:true}),'desktop '+role+' biography tail');
      await frame(page,'desktop '+role+' biography');
    }
    await resumeFixture(page,await makeSave(page,'edward',0));
    await stories(page,sourceStories,'edward',0,'desktop character');
    await click(page,'[data-game-action="choose-option"]'); const draft=await state(page);
    await detours(page,'desktop'); assert.deepEqual((await state(page)).games,draft.games);
    await page.reload(); await open(page); await action(page,'resume-bookmark');
    assert.deepEqual((await state(page)).games,draft.games,'desktop draft survives refresh');
    await click(page,'[data-game-action="decision-confirm"]'); await turn(page);
    assert.equal((await state(page)).chapter,1);
    assert.ok((await page.locator('.story-page').innerText()).includes('1461'));
    assert.equal(await page.locator('.interaction-page #game-title').innerText(),await page.evaluate(()=>window.RoleGames.meta('edward',1).title),'both character pages advance to the same chapter');
    await turn(page,-1); assert.equal((await state(page)).chapter,0);
    await shot(page,'desktop-unified-character-spread');
    console.log('PASS desktop: seven unified spreads, preserved full prose / biographies, atlas dialog, draft and consistent return');
    await page.close();

    page=await fresh(browser,390,844); const client=await page.context().newCDPSession(page);
    await open(page); await frame(page,'390 directory');
    await milestone(page,0);
    for(let index=0;index<7;index++) {
      assert.equal(await side(page),0); await art(page,'390 history art '+index); await frame(page,'390 history art '+index);
      await turn(page); assert.equal(await side(page),1);
      await historyText(page,history,index,'390 history '+index);
      if(index<6)await turn(page);
    }
    await atlas(page,places,'390 atlas');
    await turn(page,-1); assert.equal(await side(page),0);
    await turn(page,-1); assert.equal((await state(page)).chronicleIndex,5); assert.equal(await side(page),1,'reverse from left arrives at previous chapter right');
    await turn(page); assert.equal((await state(page)).chronicleIndex,6); assert.equal(await side(page),0);
    await shot(page,'mobile-unified-history-art');
    await turn(page); await shot(page,'mobile-unified-history-prose');

    await resumeFixture(page,await makeSave(page,'edward',0));
    await stories(page,sourceStories,'edward',0,'390 character');
    await touch(page,client,'.story-brief',-125,4);
    assert.equal(await side(page),1,'horizontal prose swipe reveals the interaction page');
    await touch(page,client,'.game-stakes',125,0); assert.equal(await side(page),0);
    await touch(page,client,'.story-brief',10,-130); assert.equal(await side(page),0,'vertical scroll does not turn the page');
    await touch(page,client,'.story-brief',-20,0); assert.equal(await side(page),0,'short movement snaps back');
    await touch(page,client,'.story-brief',-125,0,true); assert.equal(await side(page),0,'cancelled touch does not commit');
    await turn(page); await touch(page,client,'.game-board',125,0); assert.equal(await side(page),1,'game-board gesture does not flip pages');
    await click(page,'[data-game-action="choose-option"]'); const mobileDraft=await state(page);
    await turn(page,-1); await turn(page); assert.deepEqual((await state(page)).games,mobileDraft.games);
    await detours(page,'390');
    await page.reload(); await open(page); await action(page,'resume-bookmark');
    assert.equal(await side(page),1); assert.deepEqual((await state(page)).games,mobileDraft.games);
    assert.equal(await page.locator(turnSelector(page,1)).isDisabled(),true,'an unfinished decision cannot silently skip its chapter');
    await click(page,'[data-game-action="decision-confirm"]');
    await touch(page,client,'.game-stakes',-125,0); assert.equal((await state(page)).chapter,1); assert.equal(await side(page),0);
    await touch(page,client,'.story-brief',125,0); assert.equal((await state(page)).chapter,0); assert.equal(await side(page),1,'reverse swipe enters previous chapter right');
    await shot(page,'mobile-unified-decision');
    await resumeFixture(page,await makeSave(page,'margaret',0)); await turn(page);
    const miniatureStart=await page.evaluate(()=>new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).game);
    const move=solveActions(gameRules,'margaret',0,miniatureStart)[0];
    await click(page,'[data-game-action="'+move.action+'"][data-game-value="'+move.value+'"]');
    const miniatureDraft=await state(page);
    assert.notDeepEqual(await page.evaluate(()=>new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).game),miniatureStart,'the miniature has a real in-progress move');
    assert.equal(await page.evaluate(()=>new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).isComplete()),false);
    await touch(page,client,'.game-board',125,0); assert.equal(await side(page),1,'miniature board input remains inside its game');
    const afterBoard=await state(page);
    await page.reload(); await open(page); await action(page,'resume-bookmark');
    assert.equal(await side(page),1); assert.deepEqual((await state(page)).games,afterBoard.games,'miniature progress also survives refresh');
    console.log('PASS 390: two leaves per chapter, reversible boundaries, real gestures, game exclusion, draft refresh and return');
    await page.close();

    page=await fresh(browser,320,568); await open(page); await action(page,'font-size');
    await frame(page,'320 large directory');
    for(const index of [0,3,6]) {
      await milestone(page,index); await art(page,'320 history '+index); await frame(page,'320 history art '+index);
      await turn(page); await historyText(page,history,index,'320 large history '+index);
      if(index===3)await atlas(page,places,'320 large atlas');
      await action(page,'routes');
    }
    await resumeFixture(page,await makeSave(page,'elizabeth',0,'large'));
    await stories(page,sourceStories,'elizabeth',0,'320 large character');
    await turn(page); await frame(page,'320 large interaction');
    await detours(page,'320 large');
    await shot(page,'small-mobile-unified-interaction');
    await action(page,'roles');
    if(isMobile(page)&&await side(page)===1)await turn(page,-1);
    for(const paragraph of sourceStories.elizabeth.introduction)await expandText(page,'.role-biography',paragraph,'320 biography');
    await tail(page,page.locator('.role-biography').getByText(sourceStories.elizabeth.introduction.at(-1),{exact:true}),'320 biography tail');
    await frame(page,'320 large biography'); await shot(page,'small-mobile-unified-biography');
    await turn(page); assert.equal(await side(page),1,'biography and picker are the two role pages');
    await click(page,'[data-action="preview-role"][data-role="edward"]');
    assert.equal(await side(page),0,'selecting a person returns to their portrait and biography');
    await turn(page); await turn(page);
    assert.equal(await page.locator('.reading-book').count(),1); assert.equal(await side(page),0);
    assert.equal((await state(page)).role,'edward'); assert.equal((await state(page)).chapter,0);
    console.log('PASS 320 × 568 large text: complete prose, atlas, biography, controls and return');
    await page.close();
    }
    page=await fresh(browser,390,844,'no-preference');
    await motionChecks(page);
    assert.deepEqual(errors,[],'no runtime errors or remote resources');
    fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify({entry:url,measurements,errors},null,2));
    console.log('PASS spread reader; evidence '+output);
  } catch(error) {
    if(page&&!page.isClosed())await shot(page,'failure').catch(()=>{});
    fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({entry:url,error:error.stack,measurements,errors},null,2)); throw error;
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
