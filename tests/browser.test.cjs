/* PLAYWRIGHT_PATH=/path/to/playwright node tests/browser.test.cjs --desktop-only
 * Legacy mobile branches assume simultaneous story/game leaves and desktop
 * toolbar access. Use mobile-reader.test.cjs and history-reader.test.cjs for
 * the current single-leaf mobile reader; these branches are retained as notes.
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadGames, solveActions } = require('./activities.test.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output', 'preview-v3');
fs.mkdirSync(output, { recursive: true });
const url = pathToFileURL(path.join(root, 'index.html')).href;
const storageKey = 'wars-of-the-roses-manuscript-v1';
const games = loadGames();
const desktopOnly = process.argv.includes('--desktop-only');
const errors = [];
const click = (page, action) => page.locator('[data-action="' + action + '"]').first().click();
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
const shot = (page, name) => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
const noOverflow = async (page, label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label + ': horizontal overflow');
async function readable(page, selector, label) {
  const sizes = await page.locator(selector).evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
  assert.ok(sizes.length && sizes.every(size => size >= 17), label + ': readable text at least 17px; got ' + sizes.join(','));
  return Math.min(...sizes);
}
async function fitBook(page, label) {
  // Chromium can publish the new innerHeight before recomputing svh after a resize.
  // Match the stabilized layout audit instead of measuring the preceding viewport.
  await page.waitForTimeout(160);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds = await page.evaluate(() => {
    const box = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }; };
    return { width: innerWidth, height: innerHeight, book: box('.open-book'), base: box('.book-base'), header: box('.reading-header'), scrollY };
  });
  assert.ok(bounds.header.y >= -1, label + ': header above viewport ' + JSON.stringify(bounds));
  assert.ok(bounds.book.y >= 0 && bounds.book.bottom + 10 <= bounds.height, label + ': outer book frame must fit ' + JSON.stringify(bounds));
  assert.ok(bounds.book.x >= 8 && bounds.book.right + 8 <= bounds.width, label + ': book frame width must fit');
  assert.ok(bounds.base.y >= 0 && bounds.base.bottom <= bounds.height + 1, label + ': bottom navigation must fit ' + JSON.stringify(bounds));
  await noOverflow(page, label);
}
async function open(page, destination = 'open-book') {
  await click(page, 'open-book');
  await page.locator('.skip-intro,.reading-screen').first().waitFor();
  if (await page.locator('.skip-intro').count()) {
    await page.locator('.skip-intro').click({ timeout: 1800 }).catch(() => {});
  }
  await page.locator('.routes-book').waitFor();
  if (destination === 'open-chronicle') await page.locator('.history-milestones [data-action="chronicle-goto"][data-index="0"]').click();
  else if (await page.locator('[data-action="resume-bookmark"]').count()) await click(page, 'resume-bookmark');
}
async function choose(page, role) { await click(page, 'roles'); await page.locator('[data-role="' + role + '"]').click(); await click(page, 'choose-role'); }
async function goto(page, index) {
  await click(page, 'timeline');
  await page.locator('.timeline-list [data-action="goto"][data-index="' + index + '"]').click();
}
async function perform(page, action, value) {
  if (action === 'memory-ready') {
    await page.locator('.ma-memory-seal:not(:disabled)').first().waitFor({ state: 'visible', timeout: 8000 });
  } else if (action === 'candle-move') {
    const letter = page.locator('.rg-letter');
    await letter.scrollIntoViewIfNeeded();
    const box = await letter.boundingBox();
    assert.ok(box && box.width && box.height);
    const x = box.x + box.width * value.x / 100, y = box.y + box.height * value.y / 100;
    if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  } else {
    assert.ok(typeof value !== 'object', 'new game action needs a real DOM interaction: ' + action);
    await page.locator('[data-game-action="' + action + '"][data-game-value="' + value + '"]').first().click();
  }
}
async function solve(page, role, index, chapters, previewAlternative = false) {
  const saved = await state(page), meta = games.meta(role, index);
  if (previewAlternative && meta.type === 'choice') {
    const alternative = meta.options.find(option => option.id !== meta.historicalChoice);
    await perform(page, 'choose-option', alternative.id);
    assert.equal(await page.locator('.game-complete').count(), 0, 'previewing a decision keeps it editable until the reader confirms');
    assert.equal(await page.locator('[data-action="next"]').first().isDisabled(), true);
  }
  const current = (await state(page)).games[role]?.[chapters[index].id] || saved.games[role]?.[chapters[index].id];
  for (const move of solveActions(games, role, index, current)) await perform(page, move.action, move.value);
  await page.locator('.game-complete').waitFor();
  assert.equal(await page.locator('.revealed-fact').count(), 1);
  const after = await state(page);
  assert.equal(games.isSolved(role, index, after.games[role][chapters[index].id]), true);
}
async function newPage(browser, options, label, saved) {
  const page = await browser.newPage(options);
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(label + ': ' + error.message));
  if (saved) await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: saved });
  await page.goto(url);
  return page;
}
async function previewDirectoryMode(page, role, index, chapters) {
  await click(page, 'chronicle'); await click(page, 'roles');
  await page.locator('[data-role="' + (role === 'edward' ? 'margaret' : 'edward') + '"]').click();
  assert.equal((await state(page)).role, role);
  assert.equal((await state(page)).mode, 'chronicle');
  await click(page, 'timeline');
  assert.equal(await page.locator('.timeline-list [data-action="chronicle-goto"]').count(), 7,
    'previewing a witness retains the free historical timeline until a role is explicitly chosen');
  await click(page, 'dismiss');
  await page.locator('[data-action="preview-role"][data-role="' + role + '"]').click();
  await click(page, 'choose-role');
  assert.equal((await state(page)).chapter, 0, 'a mission chosen from history starts at chapter one');
  await goto(page, index);
  assert.equal(await page.locator('.game-board').isVisible(), true);
  assert.equal((await state(page)).mode, 'character');
  assert.equal((await state(page)).role, role);
  const before = (await state(page)).games[role]?.[chapters[index].id];
  const move = solveActions(games, role, index, before)[0];
  assert.ok(move);
  await perform(page, move.action, move.value);
  assert.notDeepEqual((await state(page)).games[role][chapters[index].id], before);
}
async function observePageTurn(page) {
  // Arm before clicking: a slow automation round-trip may outlast the 680ms sheet.
  await page.evaluate(() => {
    window.__testedPageTurn = null;
    const observer = new MutationObserver(() => {
      const sheet = document.querySelector('.page-turn');
      if (!sheet) return;
      window.__testedPageTurn = { animation: getComputedStyle(sheet).animationName, inert: sheet.inert };
      observer.disconnect();
    });
    observer.observe(document.getElementById('app'), { childList: true, subtree: true });
  });
  await click(page, 'next');
  await page.waitForFunction(() => window.__testedPageTurn !== null);
  const observed = await page.evaluate(() => window.__testedPageTurn);
  assert.notEqual(observed.animation, 'none', 'the temporary page sheet runs its CSS animation');
  assert.equal(observed.inert, true, 'the animated copy cannot steal reading input');
  await page.locator('.page-turn').waitFor({ state: 'detached' });
}
async function normalAnimation(page, data) {
  await click(page, 'open-book');
  await page.locator('.intro-screen').waitFor();
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('.intro-rose .petals-red').evaluate(node => getComputedStyle(node).animationName), 'bloom');
  await shot(page, '10-rose-prologue');
  await page.locator('.routes-book').waitFor({ timeout: 10000 });
  await click(page, 'roles'); await page.locator('.page-turn').waitFor({ state: 'detached' });
  await click(page, 'choose-role'); await page.locator('.page-turn').waitFor({ state: 'detached' });
  await solve(page, 'margaret', 0, data.chapters);
  await observePageTurn(page);
  assert.equal(await page.locator('.chapter-year').innerText(), '1461');
  await fitBook(page, 'normal animation after turn');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  let active;
  try {
    if (process.argv.includes('--animation-only')) {
      const animated = active = await newPage(browser, { viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' }, 'animation');
      const data = await animated.evaluate(() => window.BOOK_DATA);
      await normalAnimation(animated, data);
      assert.deepEqual(errors, []);
      console.log('PASS normal rose prologue, observed page-turn animation, next chapter and viewport bounds; 0 runtime errors');
      return;
    }
    if (process.argv.includes('--affected-layout')) {
      for (const mobile of (desktopOnly ? [false] : [false, true])) {
        const sample = active = await newPage(browser, mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' } : { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, mobile ? 'affected-mobile' : 'affected-desktop');
        await open(sample); await choose(sample, 'margaret');
        const data = await sample.evaluate(() => window.BOOK_DATA);
        for (let index = 0; index <= 5; index++) {
          const kind = games.meta('margaret', index).kind;
          if (['supplies', 'fragments'].includes(kind)) {
            assert.equal(await sample.locator('.ma-activity.ma-kind-' + kind).count(), 1);
            assert.equal(await sample.locator('.ma-activity.ma-' + kind).count(), 0, 'activity shell cannot inherit the inner grid class');
            const sizes = mobile ? [[320, 740], [390, 844]] : [[1280, 720], [1366, 768], [1440, 900]];
            for (const [width, height] of sizes) {
              await sample.setViewportSize({ width, height });
              await sample.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
              if (mobile) await noOverflow(sample, width + 'px corrected ' + kind); else await fitBook(sample, width + ' corrected ' + kind);
              if (!mobile && width === 1366) await shot(sample, '03-game-' + kind + '-1366');
            }
            await shot(sample, (mobile ? '07-mobile-' : '03-game-') + kind);
          }
          await solve(sample, 'margaret', index, data.chapters);
          if (index < 5) await click(sample, 'next');
        }
        console.log('PASS corrected supplies / fragments grids, real controls and ' + (mobile ? '390px / 320px' : 'all three desktop viewport bounds'));
      }
      assert.deepEqual(errors, []);
      return;
    }
    if (process.argv.includes('--responsive-only')) {
      const fixturePage = active = await newPage(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, 'responsive-fixture');
      const data = await fixturePage.evaluate(() => window.BOOK_DATA);
      // A validated first-edition reading bookmark unlocks browsing, never the new activities.
      const readingBookmark = { version: 1, role: 'margaret', chapter: 0, ending: false, sound: false, completed: data.chapters.map(item => item.id), selections: Object.fromEntries(data.chapters.map(item => [item.id, Array.isArray(item.puzzle.answer) ? item.puzzle.answer : [item.puzzle.answer]])) };
      await fixturePage.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: readingBookmark });
      await fixturePage.reload(); await open(fixturePage);
      assert.equal((await state(fixturePage)).completed.length, 7, 'legacy reading bookmark loads before the application and survives pagehide');
      const seen = new Set(), locations = [];
      data.roles.forEach(role => data.chapters.forEach((_, index) => { const info = games.meta(role.id, index); if (info.type === 'game' && !seen.has(info.kind)) { seen.add(info.kind); locations.push({ role: role.id, index, kind: info.kind }); } }));
      for (const width of [390, 320]) {
        await fixturePage.setViewportSize({ width, height: width === 390 ? 844 : 740 });
        for (const item of locations) {
          await choose(fixturePage, item.role); await goto(fixturePage, item.index);
          await noOverflow(fixturePage, width + 'px ' + item.kind);
          await readable(fixturePage, '.story-paragraph', width + 'px ' + item.kind);
          assert.equal(await fixturePage.locator('.game-complete').count(), 0, 'layout fixture does not solve new activities');
          if (width === 390) await shot(fixturePage, '07-mobile-' + item.kind);
        }
        await click(fixturePage, 'chronicle'); await fixturePage.locator('.history-year-index [data-action="chronicle-goto"][data-index="4"]').click();
        await noOverflow(fixturePage, width + 'px chronicle');
        await readable(fixturePage, '.history-reading-copy .history-paragraph', width + 'px chronicle');
        await shot(fixturePage, '08-chronicle-' + width);
        await click(fixturePage, 'font-size'); await noOverflow(fixturePage, width + 'px large chronicle'); await click(fixturePage, 'font-size');
      }
      const letter = locations.find(item => item.kind === 'candle');
      await choose(fixturePage, letter.role); await goto(fixturePage, letter.index);
      await solve(fixturePage, letter.role, letter.index, data.chapters);
      await shot(fixturePage, '09-touch-letter');
      console.log('PASS responsive remainder: 12 unfinished mechanisms at 390px / 320px, 17px+ prose, free chronicle and real touch letter');
      const animated = active = await newPage(browser, { viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' }, 'animation');
      await click(animated, 'open-book'); await animated.locator('.intro-screen').waitFor();
      await animated.waitForTimeout(1600);
      assert.equal(await animated.locator('.intro-rose .petals-red').evaluate(node => getComputedStyle(node).animationName), 'bloom');
      await shot(animated, '10-rose-prologue');
      await animated.locator('.routes-book').waitFor({ timeout: 10000 });
      await click(animated, 'roles'); await animated.locator('.page-turn').waitFor({ state: 'detached' });
      await click(animated, 'choose-role'); await animated.locator('.page-turn').waitFor({ state: 'detached' });
      await solve(animated, 'margaret', 0, data.chapters);
      await observePageTurn(animated);
      assert.equal(await animated.locator('.chapter-year').innerText(), '1461');
      await fitBook(animated, 'normal animated turn');
      await click(animated, 'chronicle'); await animated.locator('.page-turn').waitFor({ state: 'detached' });
      await animated.locator('.history-year-index [data-action="chronicle-goto"][data-index="3"]').click(); await animated.locator('.page-turn').waitFor({ state: 'detached' });
      await fitBook(animated, '1366×768 chronicle'); await shot(animated, '06-chronicle-1366');
      const compact = active = await newPage(browser, { viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' }, 'compact-reserves', readingBookmark);
      await open(compact);
      for (const index of [2, 5]) {
        await goto(compact, index);
        const kind = games.meta('margaret', index).kind;
        await fitBook(compact, '1366×768 unfinished ' + kind);
        await shot(compact, '03-game-' + kind + '-1366');
      }
      assert.deepEqual(errors, []);
      console.log('PASS normal rose prologue and page-turn animation; no browser runtime errors');
      return;
    }
    const page = active = await newPage(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, 'desktop');
    await shot(page, '01-cover');
    await open(page);
    assert.equal(await page.locator('.routes-book').isVisible(), true);
    await fitBook(page, '1440×900 reading routes');
    await shot(page, '02-routes');
    await choose(page, 'margaret');
    const data = await page.evaluate(() => window.BOOK_DATA);
    assert.equal((await state(page)).version, 4);
    const standard = await readable(page, '.story-paragraph', 'default chapter');
    await click(page, 'font-size');
    await page.waitForFunction(size => [...document.querySelectorAll('.story-paragraph')].every(node => parseFloat(getComputedStyle(node).fontSize) > size), standard);
    await fitBook(page, '1440×900 larger type');
    await click(page, 'font-size');
    assert.equal(await page.locator('.story-page.left-page').count(), 1);
    assert.equal(await page.locator('.interaction-page.right-page .game-board').count(), 1);
    assert.ok(await page.locator('.story-page .art-reserve').count());
    assert.equal(await page.locator('.story-page .art-reserve svg').count(), 0, 'archived vector scenes are not displayed');
    assert.equal(await page.locator('.story-page .art-reserve img').count(), 1, 'user-provided chapter painting is displayed');

    const seenKinds = new Set(), gameLocations = [];
    for (const [roleNumber, role] of data.roles.entries()) {
      if ((await state(page)).role !== role.id) await choose(page, role.id);
      assert.equal((await state(page)).chapter, 0);
      let choices = 0, gameCount = 0;
      for (let index = 0; index < data.chapters.length; index++) {
        assert.equal((await state(page)).chapter, index);
        assert.deepEqual(await page.locator('.story-paragraph').allTextContents(), await page.evaluate(({role,index}) => window.BOOK_STORIES[role].chapters[index].pages[0].paragraphs, {role:role.id,index}));
        assert.equal(await page.locator('.game-complete').count(), 0);
        assert.equal(await page.locator('[data-action="next"]').first().isDisabled(), true);
        const meta = games.meta(role.id, index);
        if (meta.type === 'choice') choices++; else gameCount++;
        for (const [width, height] of [[1440, 900], [1366, 768], [1280, 720]]) {
          await page.setViewportSize({ width, height });
          await fitBook(page, role.id + '/' + index + ' at ' + width + '×' + height);
          await readable(page, '.story-paragraph', role.id + '/' + index);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        const positions = await page.evaluate(() => ({ story: document.querySelector('.story-page').getBoundingClientRect().x, game: document.querySelector('.interaction-page').getBoundingClientRect().x }));
        assert.ok(positions.story < positions.game, 'prose is left, activity is right');
        if (meta.type === 'game' && !seenKinds.has(meta.kind)) {
          seenKinds.add(meta.kind); gameLocations.push({ role: role.id, index, kind: meta.kind });
          await shot(page, '03-game-' + meta.kind);
        }
        if (meta.type === 'choice' && choices === 1) await shot(page, '04-question-' + role.id);
        if (page.locator('[data-rg-drag="0"]') && await page.locator('[data-rg-drag="0"]').count()) {
          await page.locator('[data-rg-drag="0"]').dragTo(page.locator('[data-rg-drop="left"]'));
          assert.equal((await state(page)).games[role.id][data.chapters[index].id].payload.places[0], 1, 'seal drag reaches its pan');
        }
        await solve(page, role.id, index, data.chapters, true);
        assert.equal((await state(page)).completed.length, roleNumber === 0 ? index + 1 : 7);
        if (index === 3) {
          await page.reload(); await open(page);
          assert.equal(await page.locator('.game-complete').isVisible(), true);
        }
        await fitBook(page, role.id + '/' + index + ' solved');
        await click(page, 'next');
      }
      assert.equal(choices, 4); assert.equal(gameCount, 3);
      assert.equal((await state(page)).ending, true);
      assert.ok((await page.locator('.ending-prose').last().innerText()).includes(role.ending));
      await fitBook(page, role.id + ' ending');
      console.log('PASS ' + role.id + ': 3 different games + 4 previewed and confirmed decisions, save recovery and ending');
    }
    assert.equal(seenKinds.size, 12, 'the book offers twelve distinct miniature mechanisms');
    const completedSave = await state(page);
    await shot(page, '05-ending');
    console.log('PASS 42 mixed activities; all twelve mechanics used through real controls; 1440×900 / 1366×768 / 1280×720 book boundaries fit');

    // Partially play a new miniature and retain its position across refresh and witnesses.
    const partial = active = await newPage(browser, { viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' }, 'partial');
    await open(partial);
    const location = gameLocations.find(item => solveActions(games, item.role, item.index).length > 1);
    await choose(partial, location.role);
    for (let index = 0; index < location.index; index++) { await solve(partial, location.role, index, data.chapters); await click(partial, 'next'); }
    const move = solveActions(games, location.role, location.index)[0];
    await perform(partial, move.action, move.value);
    const partialState = (await state(partial)).games[location.role][data.chapters[location.index].id];
    await partial.reload(); await open(partial);
    assert.deepEqual((await state(partial)).games[location.role][data.chapters[location.index].id], partialState);
    const alternate = data.roles.find(role => role.id !== location.role).id;
    await choose(partial, alternate);
    assert.equal((await state(partial)).chapter, 0, 'choosing a different witness begins that life at chapter one');
    assert.equal(await partial.locator('.game-complete').count(), 0);
    await choose(partial, location.role);
    if (location.index) await goto(partial, location.index);
    assert.deepEqual((await state(partial)).games[location.role][data.chapters[location.index].id], partialState);
    await previewDirectoryMode(partial, location.role, location.index, data.chapters);
    console.log('PASS independent partial saves and chronicle → preview-only witness → directory → playable character mode');

    const chronicle = active = await newPage(browser, { viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' }, 'chronicle');
    await open(chronicle, 'open-chronicle');
    assert.equal((await state(chronicle)).role, null);
    for (const index of [6, 0, 4, 3, 5, 1, 2]) {
      await chronicle.locator('.history-year-index [data-action="chronicle-goto"][data-index="' + index + '"]').click();
      assert.equal((await state(chronicle)).chronicleIndex, index);
      assert.equal((await state(chronicle)).completed.length, 0);
      await fitBook(chronicle, 'chronicle/' + index);
    }
    assert.deepEqual((await state(chronicle)).chronicleRead, [0, 1, 2, 3, 4, 5, 6]);
    await readable(chronicle, '.history-reading-copy .history-paragraph', 'chronicle');
    assert.ok(await chronicle.locator('.art-reserve').count());
    await shot(chronicle, '06-chronicle-1366');
    await click(chronicle, 'font-size');
    await chronicle.reload(); await open(chronicle);
    assert.equal((await state(chronicle)).mode, 'chronicle');
    assert.equal((await state(chronicle)).role, null);
    assert.equal((await state(chronicle)).fontSize, 'large');
    await choose(chronicle, 'richard');
    assert.equal((await state(chronicle)).chapter, 0);
    await click(chronicle, 'timeline');
    assert.equal(await chronicle.locator('.timeline-list button:disabled').count(), 6);
    await click(chronicle, 'dismiss');
    await click(chronicle, 'sound'); assert.equal((await state(chronicle)).sound, true);
    await click(chronicle, 'sound'); assert.equal((await state(chronicle)).sound, false);
    await click(chronicle, 'timeline'); await click(chronicle, 'about'); await click(chronicle, 'restart-confirm'); await click(chronicle, 'dismiss');
    assert.equal((await state(chronicle)).mode, 'character');
    await click(chronicle, 'timeline'); await click(chronicle, 'about'); await click(chronicle, 'restart-confirm'); await click(chronicle, 'restart');
    assert.equal((await state(chronicle)).mode, null); assert.deepEqual((await state(chronicle)).games, {});
    console.log('PASS free chronicle, illustration reserves, no game unlocks, larger-text recovery, sound and reset');

    // Legacy responsive inspection; current single-leaf mobile coverage lives
    // in mobile-reader.test.cjs / history-reader.test.cjs.
    if (!desktopOnly) {
    // Reuse the untouched save produced by the real desktop playthrough for responsive inspection.
    const mobile = active = await newPage(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, 'mobile', completedSave);
    await open(mobile);
    for (const width of [390, 320]) {
      await mobile.setViewportSize({ width, height: width === 390 ? 844 : 740 });
      for (const item of gameLocations) {
        await choose(mobile, item.role); await goto(mobile, item.index);
        await noOverflow(mobile, width + 'px ' + item.kind);
        await readable(mobile, '.story-paragraph', width + 'px ' + item.kind);
        if (width === 390) await shot(mobile, '07-mobile-' + item.kind);
      }
      await click(mobile, 'chronicle');
      await mobile.locator('.history-year-index [data-action="chronicle-goto"][data-index="4"]').click();
      await noOverflow(mobile, width + 'px chronicle');
      await readable(mobile, '.history-reading-copy .history-paragraph', width + 'px chronicle');
      await shot(mobile, '08-chronicle-' + width);
      await click(mobile, 'font-size'); await noOverflow(mobile, width + 'px large type'); await click(mobile, 'font-size');
    }
    const letter = gameLocations.find(item => games.render(item.role, item.index, games.initial(item.role, item.index)).includes('rg-letter'));
    assert.ok(letter);
    const touch = active = await newPage(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, 'touch');
    await open(touch); await choose(touch, letter.role);
    for (let index = 0; index <= letter.index; index++) { await solve(touch, letter.role, index, data.chapters); if (index < letter.index) await click(touch, 'next'); }
    await shot(touch, '09-touch-letter');
    console.log('PASS mobile 390px / 320px: twelve boards, natural page flow, no horizontal overflow, real touch secret letter');
    }

    const animated = active = await newPage(browser, { viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' }, 'animation');
    await normalAnimation(animated, data);
    assert.deepEqual(errors, []);
    console.log(desktopOnly ? 'PASS DESKTOP: 42 mixed activities, twelve mechanics, decision previews and confirmation, independent saves, chronology modes, complete book frame and normal animations.' : 'PASS ALL v4: 42 mixed activities, twelve mechanics, decision previews and confirmation, independent saves, chronology modes, complete desktop book frame, responsive layouts and normal animations.');
  } catch (error) {
    console.error('Runtime errors:', errors);
    if (active && !active.isClosed()) await shot(active, 'failure').catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
