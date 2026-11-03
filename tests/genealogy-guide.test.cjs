/* Beginner relationship guide: readable kinship, reference trees and preserved saves.
 * PLAYWRIGHT_PATH=/path/to/playwright node tests/genealogy-guide.test.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'genealogy-guide-review');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const key = 'wars-of-the-roses-manuscript-v1';
const errors = [], measurements = [];
const layoutOnly = process.argv.includes('--layout-only');
let fixtureId = 0;
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const mobileIndex = page => page.locator('.mobile-reader-nav').getAttribute('data-mobile-page').then(Number);
const members = nodes => nodes.flatMap(node => [node.person, ...(node.spouse ? [node.spouse] : []), ...members(node.children || [])]);
const guideMembers = sheet => [...new Set(sheet.groups.flatMap(group => members(group.roots)))];
const houseNames = {plantagenet:'金雀花王室',lancaster:'兰开斯特',york:'约克',neville:'内维尔',beaufort:'博福特',tudor:'都铎',mortimer:'莫蒂默',woodville:'伍德维尔'};
async function settle(page) {
  await page.waitForTimeout(180);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function click(page, action, scope = '') {
  let control = page.locator(scope + '[data-action="' + action + '"]:visible').first();
  if (!await control.count() && action === 'resume-bookmark') control = page.locator('[data-action="mobile-resume"]:visible').first();
  if (!await control.count() && !scope && await page.locator('[data-action="mobile-tools"]:visible').count()) {
    await page.locator('[data-action="mobile-tools"]:visible').click();
    control = page.locator('[data-action="' + action + '"]:visible').first();
  }
  await control.click();
  await page.locator('.page-turn').waitFor({ state: 'detached' });
  await settle(page);
}
async function choose(page, selector) {
  await page.locator(selector).first().click();
  await page.locator('.page-turn').waitFor({ state: 'detached' });
  await settle(page);
}
async function openDirectory(page) {
  await click(page, 'open-book');
  await page.locator('.routes-book').waitFor();
  await settle(page);
}
async function fixture(page, saved) {
  // Install once after the outgoing page's pagehide save. Further reloads then
  // verify genuine persistence rather than replacing state again.
  await page.addInitScript(({ key, saved, token }) => {
    if (!sessionStorage.getItem(token)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(token, 'used');
    }
  }, { key, saved, token: 'guide-fixture-' + (++fixtureId) });
  await page.reload();
}
async function mode(page, name) {
  await choose(page, '[data-action="genealogy-mode"][data-mode="' + name + '"]');
  assert.equal(await page.locator('[data-action="genealogy-mode"][data-mode="' + name + '"]').getAttribute('aria-pressed'), 'true');
}
async function guideSheet(page, index) {
  await choose(page, '[data-action="genealogy-guide"][data-index="' + index + '"]');
  assert.equal(await page.locator('[data-action="genealogy-guide"][data-index="' + index + '"]').getAttribute('aria-pressed'), 'true');
}
async function detailSheet(page, index) {
  await choose(page, '[data-action="genealogy-sheet"][data-index="' + index + '"]');
  await click(page, 'genealogy-expand-all');
}
async function person(page, id) {
  await choose(page, '.genealogy-person[data-person="' + id + '"]');
}
async function step(page, index) {
  await choose(page, '.mobile-reader-nav [data-mobile-index="' + index + '"]');
  assert.equal(await mobileIndex(page), index);
}
async function frame(page, label) {
  const row = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}; };
    const pages = [...document.querySelectorAll('.open-book>.page')];
    const visible = pages.filter(n => getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().width > 0);
    return { width:innerWidth, height:innerHeight, documentWidth:document.documentElement.scrollWidth,
      book:rect('.open-book'), header:rect('.reading-header'),
      navigation:rect(innerWidth <= 760 ? '.mobile-reader-nav' : '.book-base'),
      leaves:visible.map(n => ({width:n.querySelector('.leaf-content').clientWidth,scrollWidth:n.querySelector('.leaf-content').scrollWidth,inert:n.inert})),
      hidden:pages.filter(n => !visible.includes(n)).map(n => ({inert:n.inert,hidden:n.getAttribute('aria-hidden')})) };
  });
  assert.ok(row.documentWidth <= row.width + 1, label + ': no horizontal document overflow');
  assert.ok(row.book.x >= -1 && row.book.right <= row.width + 1, label + ': book fits width');
  assert.ok(row.book.y >= -1 && row.book.bottom <= row.height + 1, label + ': book fits height');
  assert.ok(row.navigation.y >= 0 && row.navigation.bottom <= row.height + 1, label + ': navigation stays reachable');
  row.leaves.forEach(leaf => assert.ok(leaf.scrollWidth <= leaf.width + 2, label + ': no clipped leaf width ' + JSON.stringify(leaf)));
  if (row.width <= 760) {
    assert.equal(row.leaves.length, 1, label + ': exactly one leaf is displayed');
    assert.equal(row.leaves[0].inert, false, label + ': active leaf is interactive');
    assert.ok(row.hidden.every(leaf => leaf.inert || leaf.hidden === 'true'), label + ': hidden leaf does not receive input');
    assert.ok(row.navigation.y >= row.book.bottom - 1, label + ': mobile controls do not cover prose');
  }
  measurements.push({label,...row});
}
async function initialFamilyFits(page, label) {
  const row = await page.evaluate(() => {
    const area = document.querySelector('.genealogy-map-page .leaf-content').getBoundingClientRect();
    return [...document.querySelectorAll('.guide-family-tree .genealogy-person')].map(node => {
      const r = node.getBoundingClientRect();
      return {person:node.dataset.person,top:r.top,bottom:r.bottom,visibleTop:area.top,visibleBottom:area.bottom};
    });
  });
  assert.ok(row.every(node => node.top >= node.visibleTop - 1 && node.bottom <= node.visibleBottom + 1), label + ': parents and children are visible together on the standard first screen ' + JSON.stringify(row));
  measurements.push({label,nodes:row});
}
async function tail(page, selector, label) {
  const target = page.locator(selector).last();
  await target.scrollIntoViewIfNeeded();
  await settle(page);
  for (let i = 0; i < 30; i++) {
    const remaining = await target.evaluate(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const line = [...range.getClientRects()].filter(r => r.height > 0).at(-1);
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
    const line = [...range.getClientRects()].filter(r => r.height > 0).at(-1);
    const body = node.closest('.leaf-content'), r = body.getBoundingClientRect();
    return {top:line.top,bottom:line.bottom,visibleTop:r.top,visibleBottom:r.bottom,font:parseFloat(getComputedStyle(node).fontSize)};
  });
  assert.ok(row.top >= row.visibleTop - 1 && row.bottom <= row.visibleBottom + 1, label + ': actual final prose line is readable ' + JSON.stringify(row));
  measurements.push({label,...row});
}
async function shot(page, name) { await page.screenshot({path:path.join(out, name + '.png'),fullPage:true}); }
async function freshPage(browser, options = {}) {
  const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce',...options});
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  return page;
}

(async () => {
  fs.mkdirSync(out, {recursive:true});
  const browser = await chromium.launch({headless:true});
  let page;
  try {
    page = await freshPage(browser);
    const {data, guide} = await page.evaluate(() => ({data:window.BOOK_GENEALOGY,guide:window.BOOK_GENEALOGY_GUIDE}));
    assert.equal(guide.sheets.length, 4);
    assert.equal(Object.keys(data.people).length, 42);
    const visited = new Set();
    const saved = await page.evaluate(() => {
      const engine = new window.BookEngine(window.BOOK_DATA);
      engine.selectRole('edward');
      engine.actGame('choose-option', window.RoleGames.meta('edward',0).options[1].id);
      engine.setStoryPage(1); engine.setReadingSide('interaction');
      return engine.serialize();
    });
    if (!layoutOnly) {
    await openDirectory(page);
    const initial = await state(page);
    await click(page, 'genealogy', '.routes-book ');
    assert.equal(await page.locator('[data-action="genealogy-mode"][data-mode="guide"]').getAttribute('aria-pressed'), 'true', 'entry starts with the beginner guide');
    assert.equal(await page.locator('[data-action="genealogy-guide"][aria-pressed="true"]').getAttribute('data-index'), '0');
    assert.equal(await page.locator('.genealogy-person[data-person="edward3"]').count(), 0, 'new readers begin with war participants rather than a distant ancestor');
    assert.deepEqual(await state(page), initial, 'opening the guide preserves the fresh save');
    for (let index = 0; index < guide.sheets.length; index++) {
      await guideSheet(page, index);
      const sheet = guide.sheets[index];
      const rendered = await page.locator('.genealogy-person').evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.person))]);
      assert.deepEqual(rendered.sort(), guideMembers(sheet).sort());
      assert.ok(rendered.length >= 5 && rendered.length <= 8, 'each small guide remains a manageable family group');
      assert.ok((await page.locator('.genealogy-book').innerText()).includes(sheet.question), 'the current relationship question is stated in the open spread');
      const explanation = await page.locator('.guide-explanation').innerText();
      assert.ok(explanation.includes(sheet.takeaway));
      sheet.explain.forEach(line => assert.ok(explanation.includes(line), 'plain-language explanation is complete'));
      assert.ok(await page.locator('.guide-descent').count() > 0, 'parent-child arrows also have relationship words');
      assert.match(await page.locator('.guide-groups').innerText(), /儿子|女儿|子女/, 'family words are visible beside the tree');
      assert.equal(await page.locator('[data-action="genealogy-guide-previous"]').isDisabled(), index === 0);
      assert.equal(await page.locator('[data-action="genealogy-guide-next"]').isDisabled(), index === 3);
      await frame(page, 'desktop guide ' + index);
      if (index < 2) await initialFamilyFits(page,'standard first view guide ' + index);
      await tail(page, '.guide-explain-prose p', 'desktop explanation ' + index);
      await page.locator('.genealogy-person-page .leaf-content').evaluate(node => node.scrollTop = 0);
      await shot(page, 'guide-' + (index + 1) + '-desktop');
    }
    await guideSheet(page, 0);
    await click(page, 'genealogy-guide-next');
    assert.equal(await page.locator('[data-action="genealogy-guide"][aria-pressed="true"]').getAttribute('data-index'), '1');
    await click(page, 'genealogy-guide-previous');
    assert.equal(await page.locator('[data-action="genealogy-guide"][aria-pressed="true"]').getAttribute('data-index'), '0');
    await page.locator('[data-reading-heading]').focus();
    await page.keyboard.press('ArrowRight');
    await page.locator('.page-turn').waitFor({state:'detached'}); await settle(page);
    assert.equal(await page.locator('[data-action="genealogy-guide"][aria-pressed="true"]').getAttribute('data-index'), '1', 'keyboard advances the beginner guide');
    const groups = await page.locator('.guide-family-group').allTextContents();
    assert.match(groups[0], /安茹的玛格丽特/); assert.match(groups[0], /亨利六世/); assert.match(groups[0], /威斯敏斯特的爱德华/);
    assert.match(groups[1], /玛格丽特·博福特/); assert.match(groups[1], /埃德蒙·都铎/); assert.match(groups[1], /亨利七世/);
    assert.match(await page.locator('.guide-explanation').innerText(), /不是同一个人/);
    await guideSheet(page, 3);
    assert.equal(await page.locator('.genealogy-person[data-person="anneNeville"]').count(), 2, 'the same Anne appears in two expressly sequential marriages');
    assert.match(await page.locator('.guide-groups').innerText(), /第一段婚姻/);
    assert.match(await page.locator('.guide-groups').innerText(), /第二段婚姻/);
    assert.deepEqual(await state(page), initial, 'reading all four guides does not select a route or grant unlocks');
    console.log('PASS four beginner guides, explicit kinship and distinct Margarets / sequential marriages');

    // The complete 42-person reference remains available behind the simple guide.
    await mode(page, 'detail');
    for (let index = 0; index < data.sheets.length; index++) {
      await detailSheet(page, index);
      const expected = [...new Set(members(data.sheets[index].roots))];
      const rendered = await page.locator('.genealogy-person').evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.person))]);
      assert.deepEqual(rendered.sort(), expected.sort(), 'detailed sheet retains every relative');
      for (const id of expected) {
        await person(page, id);
        assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people[id].bio), 'complete biography for ' + id);
        const card = page.locator('.genealogy-person[data-person="' + id + '"]').first();
        assert.equal(await card.getAttribute('data-house'), data.people[id].house, id + ': selection retains the family identity');
        assert.equal(await card.getAttribute('aria-pressed'), 'true');
        assert.equal(await card.locator('.genealogy-seal-portrait').count(), 1, id + ': person has a human icon');
        assert.equal(await card.locator('.genealogy-seal-mark').count(), 1, id + ': family has a symbol');
        const badge = card.locator('.genealogy-house-badge');
        assert.equal((await badge.innerText()).trim(), houseNames[data.people[id].house], id + ': family is written out, not colour alone');
        const visible = await badge.evaluate(node => {
          const r = node.getBoundingClientRect(), style = getComputedStyle(node);
          return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        });
        assert.ok(visible, id + ': family label remains rendered after selection');
        visited.add(id);
      }
    }
    assert.equal(visited.size, 42);
    await detailSheet(page, 3); await person(page, 'warwick');
    assert.match(await page.locator('.genealogy-allegiance').innerText(), /约克[\s\S]*兰开斯特[\s\S]*1461[\s\S]*1470/, 'Warwick belongs to Neville while his alliance changes over time');
    await shot(page, 'warwick-house-and-allegiance');
    await person(page, 'anneNeville');
    assert.match(await page.locator('.genealogy-allegiance').innerText(), /内维尔[\s\S]*1470[\s\S]*兰开斯特[\s\S]*1472[\s\S]*约克/, 'Anne retains her own family and her sequential marriages are explained');
    await detailSheet(page, 2); await person(page, 'elizabethYork');
    assert.equal(await page.locator('.genealogy-person[data-person="elizabethYork"]').first().getAttribute('data-house'), 'york');
    assert.match(await page.locator('.genealogy-allegiance').innerText(), /约克公主[\s\S]*都铎王后[\s\S]*1486[\s\S]*出身仍是约克/, 'Elizabeth’s dynasty of birth is distinct from her marriage');
    await detailSheet(page, 1); await person(page, 'joanBeaufort');
    const joanFamily = await page.locator('.genealogy-close-family').innerText();
    assert.match(joanFamily, /父亲[\s\S]*冈特的约翰/, 'Joan has her father in the structured relationship list');
    assert.match(joanFamily, /母亲[\s\S]*凯瑟琳·斯温福德/, 'Joan has her mother in the structured relationship list');
    await mode(page, 'guide');
    for (let index = 0; index < guide.sheets.length; index++) {
      await guideSheet(page, index);
      await click(page, 'genealogy-guide-detail');
      assert.equal(await page.locator('[data-action="genealogy-mode"][data-mode="detail"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-action="genealogy-sheet"][aria-pressed="true"]').getAttribute('data-index'), String(guide.sheets[index].detailSheet));
      const selected = await page.locator('.genealogy-person[aria-pressed="true"]').count();
      assert.ok(selected > 0, 'opening a complete family sheet selects someone who actually appears in that tree');
      await mode(page, 'guide');
    }
    await guideSheet(page, 1); await person(page, 'margaretAnjou');
    await click(page, 'genealogy-guide-summary');
    assert.ok((await page.locator('.guide-explanation').innerText()).includes(guide.sheets[1].takeaway));
    assert.equal(await page.locator('.guide-explanation h2').evaluate(node => document.activeElement === node), true, 'returning to explanation moves focus to its heading');
    await person(page, 'margaretAnjou');
    await choose(page, '[data-action="genealogy-jump"][data-person="margaretBeaufort"]');
    assert.equal(await page.locator('[data-action="genealogy-mode"][data-mode="detail"]').getAttribute('aria-pressed'), 'true');
    assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people.margaretBeaufort.bio));
    assert.equal(await page.locator('.genealogy-person[data-person="margaretBeaufort"][aria-pressed="true"]').first().isVisible(), true);
    await mode(page, 'guide');
    await guideSheet(page, 2); await person(page, 'elizabethYork');
    const family = await page.locator('.genealogy-close-family').innerText();
    assert.match(family, /父亲[\s\S]*爱德华四世/);
    assert.match(family, /母亲[\s\S]*伊丽莎白·伍德维尔/);
    await choose(page, '[data-action="genealogy-find"][data-person="edward4"]');
    assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people.edward4.bio), 'named relationship opens the actual father');
    assert.equal(await page.locator('[data-action="genealogy-mode"][data-mode="detail"]').getAttribute('aria-pressed'), 'true');
    await mode(page, 'guide');
    for (const [id, relative] of Object.entries(data.people).filter(([,person]) => person.role)) {
      const index = guide.sheets.findIndex(sheet => guideMembers(sheet).includes(id));
      await guideSheet(page, index); await person(page, id);
      const before = await state(page);
      await click(page, 'genealogy-role');
      assert.equal(await page.locator('[data-action="preview-role"][data-role="' + relative.role + '"]').getAttribute('aria-pressed'), 'true');
      assert.deepEqual(await state(page), before, 'preface preview does not select ' + relative.role);
      await click(page, 'genealogy');
      if (await page.locator('[data-action="genealogy-mode"][data-mode="guide"]').getAttribute('aria-pressed') !== 'true') await mode(page, 'guide');
    }
    console.log('PASS detailed 42-person reference, guide cross-links and six safe preface previews');

    for (const route of ['character','chronicle']) {
      const seed = route === 'character' ? saved : {...saved,mode:'chronicle',chronicleIndex:4,chronicleRead:[0,4],chronicleSide:'timeline'};
      await fixture(page, seed); await openDirectory(page); await click(page, 'genealogy');
      await guideSheet(page, 3); await person(page, 'warwick');
      await mode(page, 'detail'); await detailSheet(page, 2); await person(page, 'elizabethYork');
      await mode(page, 'guide'); await guideSheet(page, 1);
      await click(page, 'routes');
      assert.deepEqual(await state(page), seed, route + ': guide leaves save, draft, story page and unlocks untouched');
      await click(page, 'resume-bookmark');
      assert.equal(await page.locator(route === 'character' ? '.reading-book' : '.chronicle-book').count(), 1);
      assert.deepEqual(await state(page), seed);
      await click(page, 'genealogy'); await page.reload(); await openDirectory(page);
      assert.deepEqual(await state(page), seed, route + ': refresh from guide retains original bookmark');
    }
    console.log('PASS character / panorama save preservation including pending choice and reading side');
    }

    for (const [width,height,font] of [[1366,768,'standard'],[1280,620,'standard'],[900,650,'large']]) {
      await page.setViewportSize({width,height});
      await fixture(page, {...saved,fontSize:font}); await openDirectory(page); await click(page, 'genealogy');
      for (let index = 0; index < 4; index++) {
        await guideSheet(page,index); await frame(page,width + ' guide ' + index);
        if (width === 1366 && index < 2) await initialFamilyFits(page,'standard first view guide ' + index);
        await shot(page,'guide-' + (index+1) + '-desktop-' + width);
        await tail(page,'.guide-group-caption',width + ' tree caption ' + index);
        await tail(page,'.guide-explain-prose p',width + ' explanation ' + index);
      }
      await shot(page,'guide-desktop-' + width);
    }
    await page.close();
    page = await freshPage(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    for (const [width,height,font] of [[390,844,'standard'],[320,568,'large']]) {
      await page.setViewportSize({width,height});
      await fixture(page,{...saved,fontSize:font}); await openDirectory(page); await click(page,'genealogy');
      const before = await state(page);
      for (let index = 0; index < 4; index++) {
        await guideSheet(page,index);
        assert.equal(await mobileIndex(page),0,'selecting a guide opens its relationship tree');
        await frame(page,width + ' mobile tree ' + index);
        await shot(page,'guide-' + (index+1) + '-mobile-start-' + width);
        await tail(page,'.guide-group-caption',width + ' mobile tree final caption ' + index);
        await step(page,1);
        await frame(page,width + ' mobile explanation ' + index);
        await tail(page,'.guide-explain-prose p',width + ' mobile explanation final line ' + index);
        await click(page,'genealogy-return-tree');
        assert.equal(await mobileIndex(page),0);
        const id = guideMembers(guide.sheets[index]).at(-1);
        await person(page,id);
        assert.equal(await mobileIndex(page),1,'person click turns to detail leaf');
        assert.ok((await page.locator('.genealogy-detail').innerText()).includes(data.people[id].bio));
        await tail(page,'.genealogy-relations li',width + ' person relationships final line ' + index);
        await tail(page,'.genealogy-detail-note',width + ' person final note ' + index);
        await frame(page,width + ' mobile selected person ' + index);
        await click(page,'genealogy-return-tree');
        assert.equal(await mobileIndex(page),0,'return turns to the actual tree leaf');
        const target = page.locator('.genealogy-person[data-person="' + id + '"][aria-pressed="true"]').first();
        const hit = await target.evaluate(node => {
          const r = node.getBoundingClientRect(), at = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return {top:r.top,bottom:r.bottom,height:innerHeight,focus:document.activeElement===node,hit:at===node||node.contains(at)};
        });
        assert.ok(hit.top >= 0 && hit.bottom <= hit.height && hit.focus && hit.hit,width + ': returning reveals and focuses selected person ' + JSON.stringify(hit));
        if (index === 1 || index === 3) await shot(page,'guide-' + (index+1) + '-mobile-' + width);
      }
      assert.deepEqual(await state(page),before,width + ': mobile graph/detail navigation does not alter progress');
      await mode(page,'detail'); await detailSheet(page,2); await person(page,'elizabethYork');
      assert.equal(await mobileIndex(page),1);
      await frame(page,width + ' mobile detailed reference');
      await click(page,'genealogy-return-tree'); await mode(page,'guide');
      assert.equal(await mobileIndex(page),0);
      await click(page,'routes'); await click(page,'resume-bookmark');
      assert.equal(await mobileIndex(page),2,'resuming returns to the saved interaction leaf');
      assert.deepEqual(await state(page),before,'mobile reference detour preserves pending choice and original reading side');
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,layoutOnly?'layout-report.json':'report.json'),JSON.stringify({guides:4,people:visited.size,layoutOnly,errors,measurements},null,2));
    if (fs.existsSync(path.join(out,'failure.png'))) fs.unlinkSync(path.join(out,'failure.png'));
    console.log('PASS short desktop, large font, mobile 390 / 320: readable final lines, one active leaf, reachable controls; 0 runtime errors');
  } catch (error) {
    console.error('Runtime errors:',errors);
    if (page) await page.screenshot({path:path.join(out,'failure.png'),timeout:3000,fullPage:true}).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
