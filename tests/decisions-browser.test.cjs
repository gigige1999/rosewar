const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'decisions-review');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const key = 'wars-of-the-roses-manuscript-v1';
let fixtureId = 0;
// Main browser regression covers pointer navigation; this supplement also
// verifies that the journal and reading controls work from the keyboard.
const click = async (page, action) => {
  const control = page.locator('[data-action="' + action + '"]').first();
  await control.waitFor({state:'visible'});
  assert.equal(await control.isEnabled(),true);
  await control.focus(); await page.keyboard.press('Enter');
};
async function open(page) {
  await click(page, 'open-book');
  await page.locator('.routes-book').waitFor();
  await click(page, 'resume-bookmark');
  await page.locator('.game-board').waitFor();
}
async function seed(page, role, index, font = 'standard') {
  const saved = await page.evaluate(({ role, index, font }) => {
    const data = window.BOOK_DATA;
    const evidence = {
      version: 1, role, chapter: index, completed: data.chapters.map(ch => ch.id),
      selections: Object.fromEntries(data.chapters.map(ch => [ch.id, Array.isArray(ch.puzzle.answer) ? ch.puzzle.answer : [ch.puzzle.answer]]))
    };
    const engine = new window.BookEngine(data, evidence); engine.state.fontSize = font;
    return engine.serialize();
  }, { role, index, font });
  // The reader saves on pagehide. Install the fixture once, after that old page
  // has saved, while leaving later reloads free to exercise genuine persistence.
  await page.addInitScript(({key,saved,token}) => {
    if (!sessionStorage.getItem(token)) {
      localStorage.setItem(key,JSON.stringify(saved));
      sessionStorage.setItem(token,'used');
    }
  }, {key,saved,token:'decision-fixture-'+(++fixtureId)});
  await page.reload(); await open(page);
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  let active;
  try {
    const page = active = await browser.newPage({ viewport: { width:1280, height:720 }, reducedMotion:'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    const roles = await page.evaluate(() => window.BOOK_DATA.roles.map(role => role.id));
    for (const role of roles) {
      if (process.argv.includes('--remaining') && role !== 'elizabeth') continue;
      const index = await page.evaluate(role => window.ACTIVITY_DATA.activities[role].findIndex(item => item.kind === 'choice'), role);
      await seed(page, role, index);
      const meta = await page.evaluate(({role,index}) => window.RoleGames.meta(role,index), {role,index});
      const alternate = meta.options.find(option => option.id !== meta.historicalChoice);
      assert.equal(await page.locator('.ma-decision-outcome').count(), 0);
      assert.equal(await page.locator('.ma-history-note').count(), 0, 'history is not an answer cue');
      await page.locator('[data-game-action="choose-option"][data-game-value="' + alternate.id + '"]').click();
      assert.ok((await page.locator('.ma-inner-voice').innerText()).includes(alternate.motive));
      assert.equal(await page.locator('.game-complete').count(), 0);
      assert.equal(await page.locator('[data-action="next"]').first().isDisabled(), true);
      await page.reload(); await open(page);
      assert.ok((await page.locator('.ma-inner-voice').innerText()).includes(alternate.motive), 'intention survives refresh');
      const confirm = page.locator('[data-game-action="decision-confirm"]');
      await confirm.focus(); await page.keyboard.press('Enter');
      await page.locator('.game-complete').waitFor();
      const outcome = await page.locator('.ma-decision-outcome').innerText();
      assert.ok(outcome.includes(alternate.consequence));
      assert.ok(outcome.includes('架空推演'));
      assert.equal(await page.locator('[data-action="next"]').first().isDisabled(), false);
      await page.locator('.ma-history-note summary').first().click();
      assert.ok((await page.locator('.ma-history-note').first().innerText()).includes(meta.historicalNote));
      await page.locator('.ma-other-roads summary').click();
      await page.waitForTimeout(80);
      const overflow = await page.locator('.interaction-page .leaf-content').evaluate(node => node.scrollHeight > node.clientHeight + 3);
      if (overflow) assert.equal(await page.locator('.interaction-page .leaf-scroll-controls').isVisible(), true, 'expanded comparison updates continuation after the game panel was replaced');
      if (role === 'margaret') await page.screenshot({ path:path.join(out,'decision-desktop.png'), fullPage:true });
      await click(page, 'decision-journal');
      assert.ok((await page.locator('.decision-ledger').innerText()).includes(alternate.consequence));
      assert.equal(await page.locator('.decision-ledger>li').count(), 1);
      await click(page, 'dismiss');
      await click(page, 'next');
      await click(page, 'story-next');
      assert.ok((await page.locator('.decision-echo').innerText()).includes(alternate.echo), 'choice has a later reading echo');
      await page.reload(); await open(page);
      await click(page, 'decision-journal');
      assert.equal(await page.locator('.decision-ledger>li').count(), 1, 'confirmed choice survives refresh');
      await click(page, 'dismiss');
      console.log(role + ': alternate decision, preview/save, keyboard confirm, consequence, historical note, journal, next-chapter echo passed');
    }
    for (const width of [900,390,320]) {
      await page.setViewportSize({width,height:width===900?650:844});
      await seed(page,'margaret',1,'large');
      const meta = await page.evaluate(() => window.RoleGames.meta('margaret',1));
      await page.locator('[data-game-action="choose-option"][data-game-value="'+meta.historicalChoice+'"]').click();
      await page.locator('[data-game-action="decision-confirm"]').click();
      assert.ok((await page.locator('.ma-decision-outcome').innerText()).includes('历史中的选择'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false,'no horizontal overflow at '+width);
      const last = page.locator('.chapter-continue');
      await last.scrollIntoViewIfNeeded();
      assert.ok(await last.isVisible());
      if (width===900) {
        assert.equal(await page.locator('.interaction-page .leaf-scroll-controls').isVisible(),true);
        const bounds=await page.locator('.book-base').boundingBox();
        assert.ok(bounds.y+bounds.height<=650+1);
      }
      await page.screenshot({path:path.join(out,'decision-'+width+'.png'),fullPage:true});
      await click(page,'decision-journal');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false);
      await page.screenshot({path:path.join(out,'journal-'+width+'.png'),fullPage:true});
      await click(page,'dismiss');
    }
    assert.deepEqual(errors,[]);
    console.log('Decision desktop/short-window/mobile, large text, journal, save and all six nonhistorical branches passed.');
  } catch (error) {
    console.error('Runtime errors:', errors);
    if(active) await active.screenshot({path:path.join(out,'failure.png'),timeout:3000}).catch(()=>{});
    throw error;
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
