/* Focused routing, narrative pagination and readable-tail regression.
 * PLAYWRIGHT_PATH=/path/to/playwright node tests/stories-browser.test.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadGames, solveActions } = require('./activities.test.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'stories-review');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const key = 'wars-of-the-roses-manuscript-v1';
const games = loadGames();
let fixtureId = 0;
const errors = [], measurements = [];
const click = async (page, action) => {
  const control = page.locator('[data-action="' + action + '"]').first();
  await control.click();
  await page.locator('.page-turn').waitFor({ state: 'detached' });
};
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const settle = async page => {
  await page.waitForTimeout(180);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
async function openDirectory(page) {
  await click(page, 'open-book');
  await page.locator('.routes-book').waitFor();
  assert.equal(await page.locator('.reading-book,.chronicle-book,.ending-book').count(), 0,
    'opening the book must first show the route directory, including with a bookmark');
  assert.equal(await page.locator('.routes-book [data-action="roles"]').count(), 1);
  assert.equal(await page.locator('.routes-book [data-action="chronicle"]').count(), 1);
}
async function fixture(page, saved) {
  // pagehide saves the outgoing book. Apply each fixture once on the next load,
  // then allow subsequent reloads to exercise the actual saved reading position.
  await page.addInitScript(({ key, saved, token }) => {
    if (!sessionStorage.getItem(token)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(token, 'used');
    }
  }, { key, saved, token: 'story-fixture-' + (++fixtureId) });
  await page.reload();
}
async function manuscript(page, role, chapter = 0, fontSize = 'standard', storyPage = 0) {
  return page.evaluate(({ role, chapter, fontSize, storyPage }) => {
    const data = window.BOOK_DATA;
    const legacy = { version: 1, role, chapter, completed: data.chapters.map(ch => ch.id),
      selections: Object.fromEntries(data.chapters.map(ch => [ch.id, Array.isArray(ch.puzzle.answer) ? ch.puzzle.answer : [ch.puzzle.answer]])) };
    const engine = new window.BookEngine(data, legacy);
    engine.state.fontSize = fontSize; engine.setStoryPage(storyPage);
    void engine.game;
    return engine.serialize();
  }, { role, chapter, fontSize, storyPage });
}
async function resume(page) {
  await click(page, 'resume-bookmark');
  await page.locator('.reading-book,.chronicle-book,.ending-book').waitFor();
}
async function goChapter(page, index) {
  await page.locator('.chapter-dot[data-index="' + index + '"]').click();
  await page.locator('.page-turn').waitFor({ state: 'detached' });
}
async function assertFrame(page, label) {
  await settle(page);
  const measurement = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, y:r.y, right:r.right, bottom:r.bottom }; };
    return { width:innerWidth, height:innerHeight, overflow:document.documentElement.scrollWidth > innerWidth + 1,
      book:rect('.open-book'), base:rect('.book-base'), header:rect('.reading-header') };
  });
  assert.equal(measurement.overflow, false, label + ': no horizontal overflow');
  if (measurement.width > 760) {
    assert.ok(measurement.book.x >= 0 && measurement.book.right <= measurement.width,
      label + ': book width fits ' + JSON.stringify(measurement));
    assert.ok(measurement.header.y >= -1 && measurement.book.y >= 0 && measurement.book.bottom + 8 <= measurement.height,
      label + ': book frame fits ' + JSON.stringify(measurement));
    assert.ok(measurement.base.bottom <= measurement.height + 1,
      label + ': bottom chapter navigation fits ' + JSON.stringify(measurement));
  }
  measurements.push({ label, ...measurement });
}
async function assertTail(page, leafSelector, proseSelector, label) {
  await settle(page);
  const leaf = page.locator(leafSelector), prose = leaf.locator(proseSelector).last();
  assert.equal(await prose.count(), 1, label + ': actual prose is present');
  const isScrollLeaf = await leaf.locator('.leaf-content').evaluate(node => getComputedStyle(node).overflowY === 'auto');
  if (isScrollLeaf) {
    const needed = await leaf.locator('.leaf-content').evaluate(node => node.scrollHeight > node.clientHeight + 3);
    if (needed) {
      await leaf.locator('.leaf-scroll-controls').waitFor({ state: 'visible' });
      for (let i = 0; i < 12; i++) {
        const remaining = await leaf.locator('.leaf-content').evaluate(node => node.scrollHeight - node.clientHeight - node.scrollTop);
        if (remaining <= 4) break;
        const down = leaf.locator('[data-action="leaf-down"]');
        if (await down.isDisabled()) break;
        await down.click();
        await settle(page);
      }
    }
  } else await prose.scrollIntoViewIfNeeded();
  const measure = await prose.evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()).filter(rect => rect.height > 0);
    const tail = rects.at(-1), body = node.closest('.leaf-content'), bounds = body.getBoundingClientRect();
    const scrolling = getComputedStyle(body).overflowY === 'auto';
    return { tailTop:tail.top, tailBottom:tail.bottom, visibleTop:scrolling ? bounds.top : 0,
      visibleBottom:scrolling ? bounds.bottom : innerHeight, font:parseFloat(getComputedStyle(node).fontSize) };
  });
  assert.ok(measure.tailTop >= measure.visibleTop - 1 && measure.tailBottom <= measure.visibleBottom + 1,
    label + ': final line is actually within the reading area ' + JSON.stringify(measure));
  assert.ok(measure.font >= 17, label + ': prose remains readable');
  measurements.push({ label, ...measure });
}
async function assertPager(page, leafSelector, label) {
  const leaf = page.locator(leafSelector);
  assert.equal(await leaf.locator('.leaf-footer > .story-pagination').count(), 1,
    label + ': story pagination is outside scrolling prose');
  const mobile = page.viewportSize().width <= 760;
  const button = leaf.locator('.story-page-button:not(:disabled)').first();
  if (mobile) await button.scrollIntoViewIfNeeded();
  const hit = await button.evaluate(node => {
    const rect = node.getBoundingClientRect(), atPoint = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return { height:rect.height, visible:atPoint === node || node.contains(atPoint), bottom:rect.bottom, top:rect.top };
  });
  assert.ok(hit.height >= 39 && hit.visible, label + ': usable, unobscured pagination ' + JSON.stringify(hit));
}
async function assertStory(page, expected, role, index, pageIndex) {
  assert.equal(await page.locator('.story-section-title').innerText(), expected.title);
  assert.deepEqual(await page.locator('.story-paragraph').allTextContents(), expected.paragraphs,
    role + ' chapter ' + index + ' page ' + pageIndex + ': complete narrative, not truncated summaries');
  assert.equal(await page.locator('[data-action="story-previous"]').isDisabled(), pageIndex === 0);
  assert.equal(await page.locator('[data-action="story-next"]').isDisabled(), pageIndex === 1);
  await assertTail(page, '.story-page', '.story-paragraph', role + '/' + index + '/' + pageIndex);
  await assertPager(page, '.story-page', role + '/' + index + '/' + pageIndex);
}
async function assertMobileBiographyTurn(page) {
  await click(page,'biography-next');
  await settle(page);
  const first = await page.locator('.biography-prose').evaluate(node => {
    const range=document.createRange(); range.selectNodeContents(node);
    const line=Array.from(range.getClientRects()).find(r=>r.height>0);
    return {top:line.top,bottom:line.bottom,height:innerHeight};
  });
  assert.ok(first.top >= -1 && first.bottom <= first.height,
    'mobile biography turning brings the beginning of the new text into view '+JSON.stringify(first));
}

(async () => {
  fs.mkdirSync(out, { recursive:true });
  const browser = await chromium.launch({ headless:true });
  let active;
  try {
    const page = active = await browser.newPage({ viewport:{width:1366,height:768}, reducedMotion:'reduce' });
    page.setDefaultTimeout(12000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    const data = await page.evaluate(() => ({ roles:window.BOOK_DATA.roles.map(role => role.id), chapters:window.BOOK_DATA.chapters.map(ch => ch.id), stories:window.BOOK_STORIES }));
    assert.equal(Object.keys(data.stories).length, 6);
    assert.equal(data.roles.reduce((n, role) => n + data.stories[role].chapters.reduce((m, ch) => m + ch.pages.length, 0), 0), 84);

    if (process.argv.includes('--mobile-biography-only')) {
      await openDirectory(page); await click(page,'roles');
      for (const width of [390,320]) {
        await page.setViewportSize({width,height:844});
        await page.locator('[data-role="elizabeth"]').click();
        await assertMobileBiographyTurn(page);
        await page.screenshot({path:path.join(out,'biography-turn-'+width+'.png'),fullPage:true});
      }
      assert.deepEqual(errors,[]);
      console.log('PASS 390px / 320px biography next-page brings the new paragraph beginning into view; 0 runtime errors');
      return;
    }

    await openDirectory(page);
    assert.equal(await page.locator('[data-action="resume-bookmark"]').count(), 0, 'fresh reading has no invented bookmark');
    await assertFrame(page, 'fresh directory');
    await page.screenshot({path:path.join(out,'directory-fresh.png'),fullPage:true});

    const savedCharacter = await manuscript(page,'margaret',3,'standard',1);
    await fixture(page, savedCharacter); await openDirectory(page);
    assert.deepEqual(await state(page), savedCharacter, 'opening the directory does not overwrite the character bookmark');
    assert.ok((await page.locator('[data-action="resume-bookmark"]').innerText()).includes('1483'));
    await page.screenshot({path:path.join(out,'directory-bookmark.png'),fullPage:true});
    await resume(page);
    assert.equal(await page.locator('.story-section-title').innerText(), data.stories.margaret.chapters[3].pages[1].title);

    const savedChronicle = {...savedCharacter, mode:'chronicle', chronicleIndex:4, chronicleRead:[4]};
    await fixture(page,savedChronicle); await openDirectory(page);
    assert.deepEqual(await state(page),savedChronicle,'directory preserves the complete chronicle/character bookmark');
    await resume(page);
    assert.equal(await page.locator('.chronicle-book').count(),1);
    assert.equal((await state(page)).chronicleIndex,4);

    const savedEnding = await manuscript(page,'elizabeth',6);
    let endGame = savedEnding.games.elizabeth[data.chapters[6]];
    for (const move of solveActions(games,'elizabeth',6,endGame)) endGame = games.reduce('elizabeth',6,endGame,move.action,move.value).state;
    assert.equal(games.isSolved('elizabeth',6,endGame),true);
    savedEnding.games.elizabeth[data.chapters[6]] = endGame; savedEnding.ending = true;
    await fixture(page,savedEnding); await openDirectory(page);
    assert.equal((await state(page)).ending,true,'directory preserves an ending bookmark');
    await resume(page); assert.equal(await page.locator('.ending-book').count(),1);
    console.log('PASS fresh / character / chronicle / ending always enter the directory; explicit resume keeps the saved route');

    await fixture(page,await manuscript(page,'margaret',0)); await openDirectory(page); await resume(page);
    for (const role of data.roles) {
      await click(page,'roles'); await page.locator('[data-role="'+role+'"]').click();
      for (let intro=0; intro<3; intro++) {
        assert.equal(await page.locator('.biography-prose').innerText(),data.stories[role].introduction[intro]);
        await assertTail(page,'.roles-book .left-page','.biography-prose',role+' biography '+intro);
        await assertPager(page,'.roles-book .left-page',role+' biography '+intro);
        if (role==='margaret' && intro===1) await page.screenshot({path:path.join(out,'biography-desktop.png'),fullPage:true});
        if (intro<2) await click(page,'biography-next');
      }
      await click(page,'choose-role');
      assert.equal((await state(page)).chapter,0,'a different witness starts at their beginning');
      for (let index=0; index<7; index++) {
        if (index) await goChapter(page,index);
        for (let storyPage=0; storyPage<2; storyPage++) {
          await assertStory(page,data.stories[role].chapters[index].pages[storyPage],role,index,storyPage);
          if (role==='margaret' && index===0) await page.screenshot({path:path.join(out,'story-'+storyPage+'-desktop.png'),fullPage:true});
          if (!storyPage) await click(page,'story-next');
        }
      }
    }
    console.log('PASS all 18 biography pages and 84 chapter story pages: complete text, readable final lines and fixed story navigation');

    // Preview a decision without confirming. Story turns must preserve the exact
    // live game nodes, draft choice, right scroll position and completion state.
    await fixture(page,await manuscript(page,'edward',0)); await openDirectory(page); await resume(page);
    await page.locator('[data-game-action="choose-option"]').first().click();
    const beforeGame = await state(page);
    await page.evaluate(() => {
      window.__gameNode = document.querySelector('.game-board');
      const body = document.querySelector('.interaction-page .leaf-content'); body.scrollTop = 96;
      window.__gameScroll = body.scrollTop;
    });
    await click(page,'story-next');
    const preservation = await page.evaluate(() => ({same:window.__gameNode===document.querySelector('.game-board'),
      before:window.__gameScroll, after:document.querySelector('.interaction-page .leaf-content').scrollTop}));
    assert.equal(preservation.same,true,'story paging does not recreate right-hand game DOM');
    assert.equal(preservation.after,preservation.before,'story paging preserves right-hand reading/interaction scroll');
    const afterGame=await state(page);
    assert.deepEqual(afterGame.games,beforeGame.games,'story paging preserves unconfirmed choice');
    assert.deepEqual(afterGame.completed,beforeGame.completed,'reading a story never completes an activity');
    assert.equal(afterGame.storyPages.edward[data.chapters[0]],1);
    await page.locator('.story-section-title').focus(); await page.keyboard.press('ArrowLeft');
    assert.equal((await state(page)).storyPages.edward[data.chapters[0]],0,'left-page keyboard turns story, not chapter');
    await page.keyboard.press('ArrowRight');
    assert.equal((await state(page)).storyPages.edward[data.chapters[0]],1);
    await page.reload(); await openDirectory(page); await resume(page);
    assert.equal(await page.locator('.story-section-title').innerText(),data.stories.edward.chapters[0].pages[1].title);
    assert.deepEqual((await state(page)).games,beforeGame.games,'refresh restores both the story page and pending decision');
    await click(page,'routes'); await resume(page);
    assert.equal((await state(page)).storyPages.edward[data.chapters[0]],1,'returning to contents does not reset the story position');
    console.log('PASS independent story pagination, keyboard, live game preservation, draft decision and refresh/resume');

    for (const [width,height,font] of [[1280,620,'standard'],[900,650,'large'],[390,844,'standard'],[320,740,'large']]) {
      await page.setViewportSize({width,height});
      await fixture(page,await manuscript(page,'elizabeth',5,font)); await openDirectory(page); await resume(page);
      await assertFrame(page,width+' '+font+' story');
      for (let storyPage=0;storyPage<2;storyPage++) {
        await assertStory(page,data.stories.elizabeth.chapters[5].pages[storyPage],'elizabeth',5,storyPage);
        if (font==='large') assert.ok(await page.locator('.story-paragraph').first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize)) >= 20);
        await page.screenshot({path:path.join(out,'story-'+width+'-'+storyPage+'.png'),fullPage:true});
        if (!storyPage) await click(page,'story-next');
      }
      await click(page,'roles');
      await assertFrame(page,width+' '+font+' biography');
      await assertTail(page,'.roles-book .left-page','.biography-prose',width+' biography');
      await assertPager(page,'.roles-book .left-page',width+' biography');
      if (width<=760) await assertMobileBiographyTurn(page);
      await page.screenshot({path:path.join(out,'biography-'+width+'.png'),fullPage:true});
      await click(page,'routes'); await assertFrame(page,width+' '+font+' directory');
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({errors,measurements},null,2));
    console.log('PASS short desktop / 900px / 390px / 320px, standard and large fonts, biography/story final lines; 0 runtime errors');
  } catch(error) {
    console.error('Runtime errors:',errors);
    if (active) await active.screenshot({path:path.join(out,'failure.png'),timeout:3000,fullPage:true}).catch(()=>{});
    throw error;
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
