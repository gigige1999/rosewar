// Capture the current edition without changing the user's browser or bookmark.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'design-v2');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => { throw error; });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    const shot = async name => { await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); console.log(name); };
    await shot('cover');
    await page.locator('[data-action="open-book"]').first().click();
    await page.locator('[data-action="skip-intro"]').click();
    await shot('routes');
    await page.locator('.route-button[data-action="chronicle"]').click();
    await shot('chronicle');
    for (const role of ['margaret', 'warwick', 'edward', 'beaufort', 'richard', 'elizabeth']) {
      await page.locator('.toolbar [data-action="roles"]').click();
      await page.locator(`[data-role="${role}"]`).click();
      if (role === 'margaret') await shot('roles');
      await page.locator('[data-action="choose-role"]').click();
      await shot(role);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('mobile-weave');
    await page.locator('.toolbar [data-action="chronicle"]').click();
    await shot('mobile-chronicle');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
