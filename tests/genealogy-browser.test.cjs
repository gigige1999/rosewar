/* Family-tree reading, cross-links, independent bookmarks and small-screen QA.
 * PLAYWRIGHT_PATH=/path/to/playwright node tests/genealogy-browser.test.cjs --desktop-only
 * The complete-reference desktop flow remains valid. Legacy mobile branches
 * predate single-leaf paging; current mobile paths are in genealogy-guide.test.cjs
 * and mobile-reader.test.cjs, including the explicit return-to-tree action.
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'genealogy-review');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const key = 'wars-of-the-roses-manuscript-v1';
const errors = [], measurements = [];
const desktopOnly = process.argv.includes('--desktop-only');
let fixtureId = 0;
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const settle = async page => {
  await page.waitForTimeout(180);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
async function click(page, action, scope = '') {
  await page.locator(scope + '[data-action="' + action + '"]').first().click();
  await page.locator('.page-turn').waitFor({ state: 'detached' });
  await settle(page);
  // The public entry now begins with four simple relationship guides. This
  // older suite intentionally exercises the complete reference register.
  if (action === 'genealogy') {
    await page.locator('[data-action="genealogy-mode"][data-mode="detail"]').click();
    await page.locator('.page-turn').waitFor({ state: 'detached' });
    await settle(page);
  }
}
async function openDirectory(page) {
  await click(page, 'open-book');
  await page.locator('.routes-book').waitFor();
  assert.equal(await page.locator('.history-milestones [data-action="chronicle-goto"]').count(), 7);
}
async function fixture(page, saved) {
  await page.addInitScript(({ key, saved, token }) => {
    if (!sessionStorage.getItem(token)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(token, 'used');
    }
  }, { key, saved, token: 'genealogy-fixture-' + (++fixtureId) });
  await page.reload();
}
async function sheet(page, index, expand = true) {
  await page.locator('[data-action="genealogy-sheet"][data-index="' + index + '"]').first().click();
  await page.locator('.page-turn').waitFor({ state: 'detached' });
  await settle(page);
  if(expand)await click(page,'genealogy-expand-all');
}
async function person(page, id) {
  await page.locator('.genealogy-person[data-person="' + id + '"]').first().click();
  await settle(page);
}
function members(nodes) {
  return nodes.flatMap(node => [node.person, ...(node.spouse ? [node.spouse] : []), ...members(node.children || [])]);
}
async function assertFrame(page, label) {
  await settle(page);
  const row = await page.evaluate(() => {
    const rect = selector => { const r=document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}; };
    return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,
      book:rect('.open-book'),base:rect('.book-base'),header:rect('.reading-header'),
      leaves:[...document.querySelectorAll('.leaf-content')].map(n=>({width:n.clientWidth,scrollWidth:n.scrollWidth}))};
  });
  assert.equal(row.overflow,false,label+': no page horizontal overflow');
  row.leaves.forEach(leaf=>assert.ok(leaf.scrollWidth<=leaf.width+2,label+': no leaf horizontal clipping '+JSON.stringify(leaf)));
  if(row.width>760){
    assert.ok(row.book.x>=0&&row.book.right<=row.width,label+': book fits width');
    assert.ok(row.header.y>=-1&&row.book.y>=0&&row.book.bottom+7<=row.height,label+': book fits height');
    assert.ok(row.base.bottom<=row.height+1,label+': navigation fits viewport');
  }
  measurements.push({label,...row});
}
async function tail(page, selector, label) {
  const target=page.locator(selector).last();
  assert.equal(await target.count(),1,label+': prose exists');
  const leaf=target.locator('xpath=ancestor::section[contains(@class,"page")][1]');
  const body=leaf.locator('.leaf-content');
  if(await body.evaluate(n=>getComputedStyle(n).overflowY==='auto')){
    for(let i=0;i<30;i++){
      await settle(page);
      const remaining=await body.evaluate(n=>n.scrollHeight-n.clientHeight-n.scrollTop);
      if(remaining<=4)break;
      const down=leaf.locator('[data-action="leaf-down"]');
      await down.waitFor({state:'visible'});
      if(await down.isDisabled())break;
      await down.click();
    }
  }else await target.scrollIntoViewIfNeeded();
  await settle(page);
  const row=await target.evaluate(node=>{
    const range=document.createRange();range.selectNodeContents(node);
    const line=[...range.getClientRects()].filter(r=>r.height>0).at(-1);
    const body=node.closest('.leaf-content'),rect=body.getBoundingClientRect();
    const scroll=getComputedStyle(body).overflowY==='auto';
    return {top:line.top,bottom:line.bottom,visibleTop:scroll?rect.top:0,visibleBottom:scroll?rect.bottom:innerHeight};
  });
  assert.ok(row.top>=row.visibleTop-1&&row.bottom<=row.visibleBottom+1,label+': final line is readable '+JSON.stringify(row));
  measurements.push({label,...row});
}

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true});
  let page;
  try{
    page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    page.setDefaultTimeout(12000);
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    const data=await page.evaluate(()=>window.BOOK_GENEALOGY);
    assert.ok(data,'family data is loaded offline');
    if(process.argv.includes('--overview-only')){
      await openDirectory(page);await click(page,'genealogy');
      for(const [width,height,font]of [[1366,768,'standard'],[900,650,'large']]){
        await page.setViewportSize({width,height});
        if((await state(page)).fontSize!==font)await click(page,'font-size');
        for(const index of [0,2]){
          await sheet(page,index,false);await click(page,'genealogy-collapse-all');
          await assertFrame(page,width+' final overview '+index);
          await page.locator('.genealogy-map-page .leaf-content').evaluate(n=>n.scrollTop=0);
          await settle(page);
          await page.screenshot({path:path.join(out,'overview-'+width+'-'+index+'.png'),fullPage:true});
        }
      }
      assert.deepEqual(errors,[]);
      fs.writeFileSync(path.join(out,'overview-report.json'),JSON.stringify({errors,measurements},null,2));
      console.log('PASS branching overview at 1366px / 900px large text for origins and York; 0 clipping or runtime errors');
      return;
    }
    if(process.argv.includes('--layout-only')){
      await openDirectory(page);await click(page,'genealogy');
      const saved=await state(page);
      for(const [width,height,font]of [[1366,768,'standard'],[900,650,'large'],[390,844,'standard'],[320,740,'large']]){
        await page.setViewportSize({width,height});
        if((await state(page)).fontSize!==font)await click(page,'font-size');
        for(let index=0;index<4;index++){
          await sheet(page,index,false);
          await click(page,'genealogy-collapse-all');
          await assertFrame(page,width+' compact overview '+index);
          const collapsed=await page.locator('.genealogy-person:visible').count();
          const all=await page.locator('.genealogy-person').count();
          assert.ok(collapsed<all,'collapsed overview hides deeper descendants '+index);
          assert.ok(await page.locator('[data-action="genealogy-toggle"][aria-expanded="false"]').count());
          await page.locator('.genealogy-map-page .leaf-content').evaluate(n=>n.scrollTop=0);
          if(width>760)await page.screenshot({path:path.join(out,'overview-'+width+'-'+index+'.png'),fullPage:true});
          const toggle=page.locator('[data-action="genealogy-toggle"][aria-expanded="false"]:visible').first();
          await toggle.click();await settle(page);
          assert.ok(await page.locator('.genealogy-person:visible').count()>collapsed,'one branch expands its descendants');
          await click(page,'genealogy-expand-all');
          assert.equal(await page.locator('.genealogy-person:visible').count(),all,'expand-all exposes every relative');
          const last=page.locator('.genealogy-person').last(),id=await last.getAttribute('data-person');
          await last.click();await settle(page);
          assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people[id].bio));
          await assertFrame(page,width+' expanded '+index);
          await tail(page,'.genealogy-detail p',width+' compact detail '+index);
          if(width<=760){
            await click(page,'genealogy-return-tree');
            const reached=await page.locator('.genealogy-person[data-person="'+id+'"][aria-pressed="true"]').first().evaluate(node=>{const r=node.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight,focus:document.activeElement===node};});
            assert.ok(reached.top>=-1&&reached.bottom<=reached.height&&reached.focus,'mobile return reveals and focuses selected relative '+JSON.stringify(reached));
          }
          if(index===2)await page.screenshot({path:path.join(out,'expanded-'+width+'.png'),fullPage:true});
        }
      }
      // Cross-family references must reveal the target's ancestor chain even
      // when the destination opens in its compact, collapsed state.
      await page.setViewportSize({width:1366,height:768});
      for(const [id,p]of Object.entries(data.people).filter(([,p])=>p.seeAlso?.length)){
        const index=data.sheets.findIndex(s=>members(s.roots).includes(id));
        await sheet(page,index);await person(page,id);
        const link=p.seeAlso[0];
        await page.locator('[data-action="genealogy-jump"][data-index="'+link.sheet+'"][data-person="'+link.person+'"]').click();
        await page.locator('.page-turn').waitFor({state:'detached'});await settle(page);
        assert.equal(await page.locator('.genealogy-person[data-person="'+link.person+'"][aria-pressed="true"]').first().isVisible(),true,'cross-link reveals target ancestry');
      }
      const after=await state(page);after.fontSize=saved.fontSize;
      assert.deepEqual(after,saved,'branch exploration changes no stored reading progress');
      assert.deepEqual(errors,[]);
      fs.writeFileSync(path.join(out,'compact-report.json'),JSON.stringify({errors,measurements},null,2));
      console.log('PASS compact tree overview / individual branch / expand all / cross-links / mobile return / 4 sizes and saved progress; 0 runtime errors');
      return;
    }
    if(process.argv.includes('--mobile-return-only')){
      await openDirectory(page);await click(page,'genealogy');
      for(const width of [390,320]){
        await page.setViewportSize({width,height:844});await sheet(page,2);
        const node=page.locator('.genealogy-person').last(),id=await node.getAttribute('data-person');
        await node.click();await settle(page);
        await click(page,'genealogy-return-tree');
        const hit=await page.locator('.genealogy-person[data-person="'+id+'"][aria-pressed="true"]').first().evaluate(node=>{
          const r=node.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return {top:r.top,bottom:r.bottom,height:innerHeight,visible:at===node||node.contains(at),focus:document.activeElement===node};
        });
        assert.ok(hit.top>=-1&&hit.bottom<=hit.height&&hit.visible&&hit.focus,width+': return-to-tree restores the selected, focused node '+JSON.stringify(hit));
        await page.screenshot({path:path.join(out,'return-tree-'+width+'.png'),fullPage:true});
      }
      assert.deepEqual(errors,[]);
      console.log('PASS 390px / 320px selected-relative return to tree and focus; 0 runtime errors');
      return;
    }
    assert.equal(data.sheets.length,4);
    const roles=Object.entries(data.people).filter(([,p])=>p.role);
    assert.deepEqual(roles.map(([,p])=>p.role).sort(),['margaret','warwick','edward','beaufort','richard','elizabeth'].sort());
    assert.ok(Object.keys(data.people).length>20,'the trees introduce supporting relatives as well as the six witnesses');
    const allMembers=new Set(data.sheets.flatMap(s=>members(s.roots)));
    for(const id of allMembers)assert.ok(data.people[id],'every branch references a real person '+id);
    for(const [id]of roles)assert.ok(allMembers.has(id),'each protagonist can be found in a tree '+id);
    for(const p of Object.values(data.people))for(const link of p.seeAlso||[]){
      assert.ok(data.sheets[link.sheet],'cross-link has a valid sheet');
      assert.ok(members(data.sheets[link.sheet].roots).includes(link.person),'cross-link person exists on target sheet');
    }
    await openDirectory(page);
    assert.equal(await page.locator('.routes-book [data-action="genealogy"]').count(),1,'directory offers a visible family-tree introduction');
    const fresh=await state(page);
    await page.screenshot({path:path.join(out,'directory.png'),fullPage:true});
    await click(page,'genealogy','.routes-book ');
    await page.locator('.genealogy-book').waitFor();
    assert.deepEqual(await state(page),fresh,'opening genealogy neither chooses a route nor invents progress');

    const visited=new Set();
    for(let index=0;index<4;index++){
      await sheet(page,index);
      assert.equal(await page.locator('[data-action="genealogy-previous"]').isDisabled(),index===0);
      assert.equal(await page.locator('[data-action="genealogy-next"]').isDisabled(),index===3);
      const expected=[...new Set(members(data.sheets[index].roots))];
      const rendered=await page.locator('.genealogy-person').evaluateAll(nodes=>nodes.map(n=>n.dataset.person));
      assert.deepEqual([...new Set(rendered)].sort(),expected.sort(),'all family-tree relatives are rendered on sheet '+index);
      for(const id of expected){
        await person(page,id);
        const detail=await page.locator('.genealogy-detail').innerText();
        assert.ok(detail.includes(data.people[id].name),'selected person has a named detail '+id);
        assert.ok(detail.includes(data.people[id].bio),'selected biography is complete '+id);
        assert.equal(await page.locator('.genealogy-person[data-person="'+id+'"][aria-pressed="true"]').count()>0,true);
        visited.add(id);
      }
      // Selecting a visible person must keep the tree itself in place.
      const node=page.locator('.genealogy-person').last();
      await node.scrollIntoViewIfNeeded();
      const before=await page.locator('.genealogy-book .left-page .leaf-content').evaluate(n=>n.scrollTop);
      await node.click();await settle(page);
      const after=await page.locator('.genealogy-book .left-page .leaf-content').evaluate(n=>n.scrollTop);
      assert.equal(after,before,'person details preserve left-tree scroll on sheet '+index);
      await assertFrame(page,'desktop sheet '+index);
      await page.locator('.genealogy-book .left-page .leaf-content').evaluate(n=>n.scrollTop=0);
      await person(page,data.sheets[index].defaultPerson);
      await page.locator('.genealogy-book .left-page .leaf-content').evaluate(n=>n.scrollTop=0);
      await page.screenshot({path:path.join(out,'sheet-'+index+'-desktop.png'),fullPage:true});
    }
    assert.equal(visited.size,allMembers.size);
    assert.deepEqual(await state(page),fresh,'exploring every relative grants no story unlock or activity completion');
    await click(page,'genealogy-previous');
    await click(page,'genealogy-next');
    console.log('PASS four family trees and '+visited.size+' relatives: every node opens its complete biography; navigation and left-tree scroll are stable');

    for(const [id,p]of Object.entries(data.people).filter(([,p])=>p.seeAlso?.length)){
      const index=data.sheets.findIndex(s=>members(s.roots).includes(id));
      await sheet(page,index);await person(page,id);
      const link=p.seeAlso[0];
      await page.locator('[data-action="genealogy-jump"][data-index="'+link.sheet+'"][data-person="'+link.person+'"]').click();
      await page.locator('.page-turn').waitFor({state:'detached'});await settle(page);
      assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people[link.person].bio),'cross-reference opens the intended relative '+id);
      assert.ok(await page.locator('.genealogy-person[data-person="'+link.person+'"][aria-pressed="true"]').count());
    }
    await sheet(page,0);
    const keyboardPerson=page.locator('.genealogy-person').last();
    const keyboardId=await keyboardPerson.getAttribute('data-person');
    await keyboardPerson.focus();await page.keyboard.press('Enter');await settle(page);
    assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people[keyboardId].bio),'family names support keyboard activation');
    console.log('PASS cross-family references and keyboard activation');

    for(const [id,p]of roles){
      const index=data.sheets.findIndex(s=>members(s.roots).includes(id));
      await sheet(page,index);await person(page,id);
      const saved=await state(page);
      await click(page,'genealogy-role');
      await page.locator('.roles-book').waitFor();
      assert.equal(await page.locator('[data-action="preview-role"][data-role="'+p.role+'"]').getAttribute('aria-pressed'),'true');
      assert.deepEqual(await state(page),saved,'opening '+p.role+' biography does not silently start that role');
      await click(page,'genealogy');
    }
    console.log('PASS all six core people link to their own character introduction without replacing a bookmark');

    const saved=await page.evaluate(()=>{
      const engine=new window.BookEngine(window.BOOK_DATA);
      engine.selectRole('edward');
      const meta=window.RoleGames.meta('edward',0);
      engine.actGame('choose-option',meta.options[1].id);
      engine.setStoryPage(1);
      return engine.serialize();
    });
    for(const mode of ['character','chronicle']){
      const seed=mode==='character'?saved:{...saved,mode:'chronicle',chronicleIndex:4,chronicleRead:[0,4]};
      await fixture(page,seed);await openDirectory(page);await click(page,'genealogy');
      await sheet(page,2);await person(page,data.sheets[2].defaultPerson);
      await click(page,'routes');
      assert.deepEqual(await state(page),seed,'genealogy detour retains complete '+mode+' save');
      await click(page,'resume-bookmark');
      assert.equal(await page.locator(mode==='character'?'.reading-book':'.chronicle-book').count(),1);
      assert.deepEqual(await state(page),seed,'explicit resume after genealogy retains '+mode+' save');
      await click(page,'genealogy');await page.reload();await openDirectory(page);
      assert.deepEqual(await state(page),seed,'refresh from genealogy retains '+mode+' bookmark');
    }
    console.log('PASS fresh / character / chronicle storage stays unchanged, including unconfirmed decisions, story page and refresh');

    for(const [width,height,font]of [[1280,620,'standard'],[900,650,'large'],[390,844,'standard'],[320,740,'large']].filter(([width])=>!desktopOnly||width>760)){
      await page.setViewportSize({width,height});
      await fixture(page,{...saved,fontSize:font});await openDirectory(page);await click(page,'genealogy');
      for(let index=0;index<4;index++){
        await sheet(page,index);await assertFrame(page,width+' '+font+' sheet '+index);
        const last=page.locator('.genealogy-person').last();await last.click();await settle(page);
        if(width<=760){
          const heading=await page.locator('.genealogy-detail h2').evaluate(node=>{const r=node.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight};});
          assert.ok(heading.top>=-1&&heading.bottom<=heading.height,width+': selecting a relative brings the detail heading into view '+JSON.stringify(heading));
          await click(page,'genealogy-return-tree');
          const id=await last.getAttribute('data-person');
          assert.equal(await page.locator('.genealogy-person[data-person="'+id+'"][aria-pressed="true"]').first().evaluate(node=>document.activeElement===node),true,width+': return-to-tree restores keyboard focus to selected relative');
          await last.click();await settle(page);
        }
        await tail(page,'.genealogy-detail p',width+' detail '+index);
        const pager=page.locator('[data-action="genealogy-next"],[data-action="genealogy-previous"]').first();
        await pager.scrollIntoViewIfNeeded();
        const hit=await pager.evaluate(node=>{const r=node.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {height:r.height,visible:at===node||node.contains(at)};});
        assert.ok(hit.height>=34&&hit.visible,width+': page controls remain reachable');
        if(index===2){
          await page.locator('.genealogy-book .left-page .leaf-content').evaluate(n=>n.scrollTop=0);
          await page.screenshot({path:path.join(out,'tree-'+width+'.png'),fullPage:true});
        }
      }
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,desktopOnly?'desktop-report.json':'report.json'),JSON.stringify({people:allMembers.size,errors,measurements},null,2));
    if(fs.existsSync(path.join(out,'failure.png')))fs.unlinkSync(path.join(out,'failure.png'));
    console.log(desktopOnly ? 'PASS detailed reference: short desktop / large text, readable final lines and reachable navigation; 0 runtime errors' : 'PASS short desktop / large text / 390px / 320px trees, details and reachable navigation; 0 runtime errors');
  }catch(error){
    console.error('Runtime errors:',errors);
    if(page)await page.screenshot({path:path.join(out,'failure.png'),timeout:3000,fullPage:true}).catch(()=>{});
    throw error;
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
