/* Historical reading: a history-first entry, all 21 leaves, a working atlas,
 * independent bookmarks and character missions. Test the source or an extracted ZIP:
 * PLAYWRIGHT_PATH=/path/to/playwright BOOK_ENTRY_URL=http://127.0.0.1:.../ \
 *   BOOK_TEST_OUTPUT=/tmp/rosewar-history-review node tests/history-reader.test.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = process.env.BOOK_TEST_OUTPUT || path.join(root, 'output', 'history-reader-review');
const url = process.env.BOOK_ENTRY_URL || pathToFileURL(path.join(root, 'index.html')).href;
const storageKey = 'wars-of-the-roses-manuscript-v1';
const errors = [], measurements = [];
const protectedFields = ['role','chapter','completed','games','selections','legacyCompleted','legacyGames','legacyChoices','storyPages','readingSides'];
let fixtureId = 0;
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)) || new window.BookEngine(window.BOOK_DATA).serialize(), storageKey);
const mobile = page => page.viewportSize().width <= 760;
const mobileIndex = page => page.locator('.mobile-reader-nav').getAttribute('data-mobile-page').then(Number);
async function settle(page) {
  await page.locator('.page-turn').waitFor({state:'detached'});
  await page.waitForTimeout(180);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function choose(page, selector) {
  await page.locator(selector).first().click();
  await settle(page);
}
async function action(page, name, scope = '') {
  let control = page.locator(scope + '[data-action="' + name + '"]:visible').first();
  if (!await control.count() && name === 'resume-bookmark') control = page.locator('[data-action="mobile-resume"]:visible').first();
  if (!await control.count() && !scope && await page.locator('[data-action="mobile-tools"]:visible').count()) {
    await page.locator('[data-action="mobile-tools"]:visible').click();
    control = page.locator('[data-action="' + name + '"]:visible').first();
  }
  await control.click();
  await settle(page);
}
async function openOverview(page) {
  await action(page, 'open-book');
  await page.locator('.routes-book').waitFor();
  await settle(page);
}
async function fixture(page, saved) {
  // The outgoing page saves on pagehide. Install the fixture once after that;
  // subsequent reloads must test the real bookmark, not reseed it.
  await page.addInitScript(({key,saved,token}) => {
    if (!sessionStorage.getItem(token)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(token, 'used');
    }
  }, {key:storageKey,saved,token:'history-fixture-' + (++fixtureId)});
  await page.reload();
}
async function step(page, index) {
  await choose(page, '.mobile-reader-nav [data-mobile-index="' + index + '"]');
  assert.equal(await mobileIndex(page), index);
}
async function nextProse(page, index) {
  if (mobile(page)) await step(page,index);
  else await action(page,'chronicle-page-next','.history-pagination ');
}
async function nextMilestone(page, previous = false) {
  if (mobile(page)) await choose(page, '.mobile-reader-nav [data-mobile-action="chapter-' + (previous ? 'previous' : 'next') + '"]');
  else await action(page, previous ? 'chronicle-previous' : 'chronicle-next');
}
function preservesCharacter(before, after, label) {
  for (const field of protectedFields) assert.deepEqual(after[field], before[field], label + ': preserves ' + field);
}
async function frame(page, label) {
  const row = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}; };
    const pages = [...document.querySelectorAll('.open-book>.page')];
    const visible = pages.filter(node => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0);
    return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,
      book:rect('.open-book'),navigation:rect(innerWidth <= 760 ? '.mobile-reader-nav' : '.book-base'),
      leaves:visible.map(node => ({width:node.querySelector('.leaf-content').clientWidth,scrollWidth:node.querySelector('.leaf-content').scrollWidth,inert:node.inert})),
      hidden:pages.filter(node => !visible.includes(node)).map(node => ({inert:node.inert,hidden:node.getAttribute('aria-hidden')}))};
  });
  assert.ok(row.documentWidth <= row.width + 1, label + ': no horizontal document overflow');
  assert.ok(row.book.x >= -1 && row.book.right <= row.width + 1, label + ': book fits width');
  assert.ok(row.book.y >= -1 && row.book.bottom <= row.height + 1, label + ': book fits height');
  assert.ok(row.navigation.y >= 0 && row.navigation.bottom <= row.height + 1, label + ': navigation remains on screen');
  row.leaves.forEach(leaf => assert.ok(leaf.scrollWidth <= leaf.width + 2, label + ': no clipped leaf width ' + JSON.stringify(leaf)));
  if (row.width <= 760) {
    assert.equal(row.leaves.length, 1, label + ': one physical leaf is displayed');
    assert.equal(row.leaves[0].inert, false);
    assert.ok(row.hidden.every(leaf => leaf.inert || leaf.hidden === 'true'), label + ': hidden leaves cannot take input');
    assert.ok(row.navigation.y >= row.book.bottom - 1, label + ': controls do not cover the text');
  }
  measurements.push({label,...row});
}
async function tail(page, selector, label) {
  const target = page.locator(selector).last();
  await target.scrollIntoViewIfNeeded();
  await settle(page);
  for (let i = 0; i < 30; i++) {
    const remaining = await target.evaluate(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const line = [...range.getClientRects()].filter(rect => rect.height > 0).at(-1);
      return line.bottom - node.closest('.leaf-content').getBoundingClientRect().bottom;
    });
    if (remaining <= 1) break;
    const down = target.locator('xpath=ancestor::section[contains(@class,"page")][1]').locator('[data-action="leaf-down"]');
    assert.ok(await down.isVisible(), label + ': continuation control is discoverable');
    if (await down.isDisabled()) break;
    await down.click(); await settle(page);
  }
  const row = await target.evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    const line = [...range.getClientRects()].filter(rect => rect.height > 0).at(-1);
    const area = node.closest('.leaf-content').getBoundingClientRect();
    return {top:line.top,bottom:line.bottom,visibleTop:area.top,visibleBottom:area.bottom,font:parseFloat(getComputedStyle(node).fontSize)};
  });
  assert.ok(row.top >= row.visibleTop - 1 && row.bottom <= row.visibleBottom + 1, label + ': actual last line is readable ' + JSON.stringify(row));
  measurements.push({label,...row});
}
async function shot(page, name) { await page.screenshot({path:path.join(output,name + '.png'),fullPage:true}); }
async function freshPage(browser, width = 1366, height = 768) {
  const page = await browser.newPage({viewport:{width,height},isMobile:width <= 760,hasTouch:width <= 760,reducedMotion:'reduce',deviceScaleFactor:1});
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  if (process.env.BOOK_ENTRY_URL) {
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    await page.route('**/*', route => {
      const request = route.request().url();
      if (request.startsWith(new URL(url).origin + '/')) return route.continue();
      errors.push('Unexpected network resource: ' + request); return route.abort();
    });
  }
  await page.goto(url);
  return page;
}
async function inspectOverview(page, history, label) {
  assert.equal(await page.locator('.roles-book,.reading-book').count(), 0, label + ': first opening does not require a character');
  assert.match(await page.locator('.history-introduction').innerText(), /为什么.*玫瑰战争/);
  assert.ok((await page.locator('.history-introduction').innerText()).includes(history.introduction.summary));
  const detail = page.locator('.history-introduction-details');
  if (await detail.count() && await detail.getAttribute('open') === null) await detail.locator('summary').click();
  const allIntroduction = await page.locator('.history-introduction').innerText();
  history.introduction.paragraphs.forEach(paragraph => assert.ok(allIntroduction.includes(paragraph), label + ': name, badges and political origins are readable'));
  const milestones = page.locator('.history-milestones [data-action="chronicle-goto"]');
  assert.equal(await milestones.count(), 7);
  for (let i = 0; i < 7; i++) {
    const text = await milestones.nth(i).innerText();
    assert.ok(text.includes(history.milestones[i].year));
    assert.ok(text.includes(history.milestones[i].summary), label + ': the overview gives a consequence before detailed reading');
  }
  await frame(page, label);
  if (await detail.count()) await detail.locator('summary').click();
}
async function inspectProse(page, history, index, prosePage, label) {
  const expected = history.milestones[index].pages[prosePage];
  assert.equal((await state(page)).chronicleIndex, index);
  assert.equal((await state(page)).chroniclePages[index] || 0, prosePage);
  assert.ok((await page.locator('.history-reading-copy').innerText()).includes(expected.title));
  assert.deepEqual(await page.locator('.history-reading-copy p').allTextContents(), expected.paragraphs);
  assert.equal(await page.locator('.history-pagination [data-action="chronicle-page-previous"]').isDisabled(), prosePage === 0);
  if (prosePage === 2) {
    assert.equal(await page.locator('.history-pagination [data-action="chronicle-page-next"]').count(), 0);
    assert.equal(await page.locator('.history-pagination [data-action="chronicle-map"]').count(), 1, label + ': the completed prose leads to the map');
  } else assert.equal(await page.locator('.history-pagination [data-action="chronicle-page-next"]').isDisabled(), false);
  assert.equal(await page.locator('[data-game-action]').count(), 0, label + ': history is reading, without a quiz gate');
  if (mobile(page)) assert.equal(await mobileIndex(page), prosePage);
  await frame(page, label);
  await tail(page, '.history-reading-copy p', label);
}
async function readAllMilestones(page, history, label) {
  await choose(page, '.history-milestones [data-action="chronicle-goto"][data-index="0"]');
  for (let index = 0; index < 7; index++) {
    for (let prosePage = 0; prosePage < 3; prosePage++) {
      if (prosePage) await nextProse(page,prosePage);
      await inspectProse(page, history, index, prosePage, label + ' ' + history.milestones[index].year + ' page ' + (prosePage + 1));
    }
    if (index < 6) await nextMilestone(page);
  }
  assert.deepEqual((await state(page)).chronicleRead, [0,1,2,3,4,5,6]);
  await nextMilestone(page, true);
  assert.equal((await state(page)).chronicleIndex, 5, label + ': previous milestone is reachable');
  assert.equal((await state(page)).chroniclePages[5], 0, label + ': chapter navigation begins with its first explanation');
  await nextMilestone(page);
  assert.equal((await state(page)).chronicleIndex, 6);
}
async function inspectAtlas(page, places, label, all = true) {
  if (mobile(page)) await step(page, 3);
  const initial = await state(page), index = initial.chronicleIndex;
  assert.equal(await page.locator('.atlas-place-list [data-action="atlas-place"]').count(), 9);
  for (const place of all ? places : places.filter(place => ['london','dublin','stoke'].includes(place.id))) {
    await choose(page, '.atlas-place-list [data-place="' + place.id + '"]');
    assert.equal((await page.locator('.atlas-place-heading h3').innerText()).trim(), place.name);
    assert.equal(await page.locator('.atlas-place-list [data-place="' + place.id + '"]').getAttribute('aria-pressed'), 'true');
    const eventIndex = Number(await page.locator('.atlas-read-event').getAttribute('data-index'));
    assert.ok(place.related.includes(eventIndex));
    const event = place.events[eventIndex];
    assert.deepEqual(await page.locator('.atlas-prose p').allTextContents(), event.paragraphs);
    assert.ok((await page.locator('.atlas-event-date').innerText()).includes(event.date));
    const actors = await page.locator('.atlas-actors').innerText();
    event.actors.forEach(actor => assert.ok(actors.includes(actor.name) && actors.includes(actor.role), label + ': people and their current allegiance have an explanation'));
    assert.equal(await page.locator('.atlas-other-year').count(), Number(eventIndex !== index), label + ': a different year is explicitly identified');
    assert.equal((await state(page)).chronicleIndex, index, label + ': inspecting a place does not silently change milestone');
    await tail(page, '.atlas-prose p', label + ' ' + place.id);
  }
  await frame(page, label);
  preservesCharacter(initial, await state(page), label);
  await action(page, 'atlas-return');
  const mapPosition = await page.locator('.atlas-map').evaluate(node => {
    const map = node.getBoundingClientRect(), body = node.closest('.leaf-content').getBoundingClientRect();
    return {top:map.top,visibleTop:body.top,visibleBottom:body.bottom};
  });
  assert.ok(mapPosition.top >= mapPosition.visibleTop - 1 && mapPosition.top < mapPosition.visibleBottom, label + ': return to map reaches its beginning');
  await choose(page, '.atlas-place-list [data-place="dublin"]');
  await action(page, 'chronicle-goto', '.atlas-place-detail ');
  assert.equal((await state(page)).chronicleIndex, 6, label + ': the Dublin detail opens its 1487 milestone');
  assert.equal((await state(page)).chroniclePages[6], 0);
}

(async () => {
  fs.mkdirSync(output, {recursive:true});
  const browser = await chromium.launch({headless:true});
  let page;
  try {
    page = await freshPage(browser);
    const {history,places} = await page.evaluate(() => ({history:window.BOOK_HISTORY,places:window.HistoryAtlas.places}));
    assert.equal(history.milestones.length, 7);
    assert.ok(history.milestones.every(milestone => milestone.pages.length === 3));
    assert.equal(places.length, 9);
    await openOverview(page);
    const fresh = await state(page);
    await inspectOverview(page, history, 'desktop overview');
    assert.equal(await page.locator('.history-mission-invitation [data-action="mission-role"]').count(), 6);
    await shot(page, 'desktop-history-first-overview');
    await readAllMilestones(page, history, 'desktop');
    preservesCharacter(fresh, await state(page), 'all seven historical milestones');
    assert.equal((await state(page)).role, null);
    assert.deepEqual((await state(page)).completed, []);
    assert.equal(await page.evaluate(() => new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).isUnlocked(1)), false);
    await inspectAtlas(page, places, 'desktop atlas');
    await action(page, 'routes');
    await choose(page, '.history-milestones [data-index="3"]');
    await action(page, 'chronicle-page-next', '.history-pagination ');
    await action(page, 'chronicle-page-next', '.history-pagination ');
    const bookmark = await state(page);
    await action(page,'reader-back');
    assert.equal(await page.locator('.routes-book').count(),1);
    assert.deepEqual(await state(page),bookmark,'returning to the history overview retains the just-read bookmark');
    await action(page,'resume-bookmark');
    await page.reload(); await openOverview(page);
    assert.deepEqual(await state(page), bookmark, 'opening overview after refresh preserves the complete bookmark');
    await action(page, 'resume-bookmark');
    await inspectProse(page, history, 3, 2, 'desktop resumed historical bookmark');
    await shot(page, 'desktop-history-expanded-prose');
    console.log('PASS history-first overview, all 21 desktop leaves, nine places, event links and refresh / resume');

    const draft = await page.evaluate(() => {
      const engine = new window.BookEngine(window.BOOK_DATA);
      engine.selectRole('edward');
      engine.actGame('choose-option',window.RoleGames.meta('edward',0).options[1].id);
      engine.setStoryPage(1); engine.setReadingSide('interaction');
      return engine.serialize();
    });
    await fixture(page,draft); await openOverview(page);
    preservesCharacter(draft,await state(page),'overview with unfinished character decision');
    await action(page,'timeline');
    assert.equal(await page.locator('.timeline-list [data-action="chronicle-goto"]:enabled').count(),7,'history overview keeps a free historical year index despite an old character bookmark');
    await action(page,'dismiss');
    await choose(page,'.history-milestones [data-index="6"]');
    await nextProse(page,1);
    await nextProse(page,2);
    preservesCharacter(draft,await state(page),'historical detour with unfinished character decision');
    assert.deepEqual((await state(page)).completed,[]);

    // Starting a mission deliberately begins at the first chapter even when the
    // chosen character already has a later bookmark; their evidence is retained.
    const later = await page.evaluate(() => {
      const data = window.BOOK_DATA;
      const legacy = {version:1,role:'edward',chapter:4,completed:data.chapters.map(chapter=>chapter.id),
        selections:Object.fromEntries(data.chapters.map(chapter=>[chapter.id,Array.isArray(chapter.puzzle.answer)?chapter.puzzle.answer:[chapter.puzzle.answer]]))};
      const engine = new window.BookEngine(data,legacy);
      engine.setStoryPage(1); engine.setReadingSide('interaction');
      return engine.serialize();
    });
    for (const mission of history.missions) {
      await fixture(page,later); await openOverview(page);
      await choose(page,'.history-mission-invitation [data-action="mission-role"][data-role="' + mission.role + '"]');
      await page.locator('.roles-book').waitFor();
      assert.equal((await state(page)).chapter,4,'mission preview leaves the old bookmark intact until accepted');
      await action(page,'choose-role');
      await page.locator('.reading-book').waitFor();
      const selected = await state(page);
      assert.equal(selected.role,mission.role);
      assert.equal(selected.chapter,0,'mission restarts the historical route in 1455');
      assert.equal(await page.evaluate(() => new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).storyPage),0);
      assert.equal(await page.evaluate(() => new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).readingSide),'story');
    }
    console.log('PASS historical detours preserve drafts; all six character missions start at chapter one');
    const completedChoice = await page.evaluate(() => {
      const engine = new window.BookEngine(window.BOOK_DATA);
      engine.selectRole('edward');
      engine.actGame('choose-option',window.RoleGames.meta('edward',0).options[0].id);
      engine.actGame('decision-confirm','');
      engine.setReadingSide('interaction');
      return engine.serialize();
    });
    await fixture(page,completedChoice); await openOverview(page); await action(page,'resume-bookmark');
    await action(page,'game-revisit-prompt'); await action(page,'dismiss');
    assert.deepEqual((await state(page)).games,completedChoice.games,'dismissing revisit retains the completed choice');
    await action(page,'game-revisit-prompt'); await action(page,'game-revisit');
    assert.equal(await page.locator('.ma-decision-outcome').count(),0);
    assert.equal(await page.locator('[data-game-action="choose-option"]:enabled').count(),3,'completed decisions can explicitly be played again');
    await page.reload(); await openOverview(page); await action(page,'resume-bookmark');
    assert.equal(await page.evaluate(()=>new window.BookEngine(window.BOOK_DATA,JSON.parse(localStorage.getItem('wars-of-the-roses-manuscript-v1'))).isUnlocked(1)),true,'revisit and reload retain the previously read next chapter');
    await choose(page,'[data-game-action="choose-option"]:nth-child(2)');
    await choose(page,'[data-game-action="decision-confirm"]');
    assert.equal(await page.locator('.ma-decision-outcome').count(),1);
    assert.notDeepEqual((await state(page)).games.edward,completedChoice.games.edward,'a second play records a different decision');
    console.log('PASS explicit revisit, cancel, refresh, preserved chapter access and a new decision');
    await page.close();

    page = await freshPage(browser,390,844);
    await openOverview(page);
    await inspectOverview(page,history,'390 overview');
    await readAllMilestones(page,history,'390');
    await inspectAtlas(page,places,'390 atlas');
    await nextProse(page,1);
    await nextProse(page,2);
    const mobileBookmark = await state(page);
    await page.reload(); await openOverview(page);
    assert.equal(await mobileIndex(page),0,'mobile opening begins on historical milestones');
    assert.deepEqual(await state(page),mobileBookmark);
    await action(page,'resume-bookmark');
    await inspectProse(page,history,6,2,'390 resumed final milestone');
    await shot(page,'mobile-history-prose');
    await step(page,3); await shot(page,'mobile-history-atlas');
    await action(page,'routes'); await step(page,1);
    await choose(page,'.history-mission-invitation [data-role="elizabeth"]');
    await step(page,0);
    await action(page,'choose-role');
    assert.equal((await state(page)).role,'elizabeth');
    assert.equal((await state(page)).chapter,0);
    assert.equal(await mobileIndex(page),0);
    await frame(page,'390 character mission starts on story');
    console.log('PASS all 21 mobile leaves, all nine atlas places, persistent bookmarks and a mobile character mission');
    await page.close();

    page = await freshPage(browser,320,568);
    await openOverview(page); await action(page,'font-size');
    assert.equal(await page.locator('html').getAttribute('data-text-size'),'large');
    await inspectOverview(page,history,'320 large overview');
    for (const index of [0,3,6]) {
      await choose(page,'.history-milestones [data-index="' + index + '"]');
      for (let prosePage = 0; prosePage < 3; prosePage++) {
        if (prosePage) await nextProse(page,prosePage);
        await inspectProse(page,history,index,prosePage,'320 large ' + history.milestones[index].year + ' page ' + (prosePage + 1));
      }
      await action(page,'routes');
    }
    await choose(page,'.history-milestones [data-index="3"]');
    await inspectAtlas(page,places,'320 large atlas',false);
    await step(page,3); await shot(page,'small-mobile-large-atlas');
    await step(page,0); await tail(page,'.history-reading-copy p','320 final visible prose');
    await shot(page,'small-mobile-large-prose');
    console.log('PASS 320 × 568 large-type overview, nine representative prose leaves and atlas details');
    assert.deepEqual(errors,[],'no runtime errors or unexpected remote resources');
    fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify({entry:url,measurements,errors},null,2));
    console.log('PASS history reader; evidence saved to ' + output);
  } catch (error) {
    if (page && !page.isClosed()) await shot(page,'failure').catch(()=>{});
    fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({entry:url,message:error.stack,measurements,errors},null,2));
    throw error;
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
