/* A focused visual regression in an isolated browser; never alters reader saves. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output', 'cover-portrait-review');
const storageKey = 'wars-of-the-roses-manuscript-v1';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [], measurements = [];
  let active;
  try {
    const page = active = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    const click = action => page.locator('[data-action="' + action + '"]').first().click();
    const screenshot = name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
    const readState = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'no horizontal overflow');
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const frame = async () => {
      await settle();
      const rect = await page.locator('.open-book').boundingBox();
      const nav = await page.locator('.book-base').boundingBox();
      const entry = await page.locator('[data-action="choose-role"]').boundingBox();
      assert.ok(rect.x >= 0 && rect.y >= 0 && rect.y + rect.height + 8 <= page.viewportSize().height, 'desktop book fully fits');
      assert.ok(nav.y + nav.height <= page.viewportSize().height + 1, 'desktop navigation fully fits');
      assert.ok(entry.y >= rect.y && entry.y + entry.height <= rect.y + rect.height, 'character entry remains fully visible without scrolling');
      assert.equal(await page.locator('[data-action="choose-role"]').evaluate(node => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return hit === node || node.contains(hit);
      }), true, 'fixed entry is not covered by the page footer');
      await noOverflow();
    };
    const open = async action => {
      await click('open-book');
      await page.locator('.routes-book').waitFor();
      if (action === 'open-chronicle') await page.locator('.routes-book [data-action="chronicle"]').click();
    };
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await page.locator('.cover-title').innerText(), '玫瑰战争');
    assert.equal(await page.locator('.cover-aside,.cover-masthead,.cover-footer,.cover-kicker').count(), 0, 'decorative copy around the binding removed');
    await noOverflow(); await screenshot('cover-zh-desktop');

    await page.locator('[data-action="cover-language"][data-language="en"]').click();
    assert.match(await page.locator('.cover-title').innerText(), /THE WARS\s+OF THE ROSES/);
    assert.equal(await page.locator('.cover-screen').getAttribute('lang'), 'en');
    assert.equal(await page.locator('[data-language="en"]').getAttribute('aria-pressed'), 'true');
    assert.equal((await readState()).coverLanguage, 'en');
    assert.equal(await page.locator('.open-invitation').innerText(), 'Open the book');
    assert.equal(await page.locator('.cover-chronicle-link').count(), 0, 'both reading routes are chosen inside the book');
    await screenshot('cover-en-desktop');
    await page.reload();
    assert.equal(await page.locator('.cover-screen').getAttribute('lang'), 'en', 'cover language survives refresh');
    console.log('PASS minimal Chinese/English cover, language persistence');

    await open('open-book');
    assert.match(await page.locator('.route-heading').first().innerText(), /走进一个人/);
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN', 'only the cover changes language');
    await click('roles');
    const roles = await page.evaluate(() => window.BOOK_DATA.roles.map(role => ({ id: role.id, name: role.name })));
    for (const role of roles) {
      await page.locator('[data-role="' + role.id + '"]').click();
      const image = page.locator('.role-arch img');
      const measured = await image.evaluate(async node => {
        await node.decode();
        const rect = node.getBoundingClientRect();
        return { width: rect.width, height: rect.height, naturalWidth: node.naturalWidth, fit: getComputedStyle(node).objectFit, alt: node.alt };
      });
      assert.ok(measured.width >= 160 && measured.height >= 215, role.id + ' has a legible enlarged portrait');
      assert.ok(measured.naturalWidth > 0 && measured.fit === 'contain');
      assert.ok(measured.alt.includes(role.name));
      measurements.push({ viewport: '1280×720', role: role.id, ...measured });
      await frame();
    }
    await screenshot('portrait-desktop');
    console.log('PASS six enlarged complete portraits and 1280×720 book frame');
    await click('close-book');
    assert.equal(await page.locator('.cover-screen').getAttribute('lang'), 'en');
    await page.locator('[data-action="cover-language"][data-language="zh"]').click();
    assert.equal((await readState()).coverLanguage, 'zh');
    await page.reload();
    assert.equal(await page.locator('.cover-screen').getAttribute('lang'), 'zh-CN');

    await page.setViewportSize({ width: 320, height: 740 });
    await page.locator('[data-action="cover-language"][data-language="en"]').click();
    await noOverflow(); await screenshot('cover-en-mobile');
    await open('open-chronicle');
    assert.equal(await page.locator('.chronicle-book').count(), 1, 'English cover opens the route directory before the free chronicle');
    await click('roles');
    for (const role of roles) {
      await page.locator('[data-role="' + role.id + '"]').click();
      const measured = await page.locator('.role-arch img').evaluate(async node => {
        await node.decode(); const rect = node.getBoundingClientRect();
        return { width: rect.width, height: rect.height, fit: getComputedStyle(node).objectFit };
      });
      assert.ok(measured.width >= 175 && measured.height >= 230);
      assert.equal(measured.fit, 'contain');
      await noOverflow();
      measurements.push({ viewport: '320×740', role: role.id, ...measured });
    }
    await screenshot('portrait-mobile');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ errors, measurements }, null, 2));
    console.log('PASS: minimal cover, Chinese/English switching and refresh, Chinese inner pages, all six enlarged complete portraits, 1280×720 frame and 320px layout; 0 runtime errors.');
  } catch (error) {
    console.error('Runtime errors:', errors);
    if (active && !active.isClosed()) await active.screenshot({ path: path.join(output, 'failure.png'), timeout: 3000 }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
