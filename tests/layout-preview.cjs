// Visual QA for compact folios, using an isolated browser and no user bookmark.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'design-v3');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    const action = name => page.locator('[data-action="' + name + '"]').first().click();
    const shot = async name => {
      await page.screenshot({ path: path.join(out, name + '.png') });
      console.log(name, await page.locator('.page').evaluateAll(nodes => nodes.map(n => ({height:n.clientHeight, content:n.scrollHeight}))));
    };
    await action('open-book'); await action('skip-intro'); await shot('routes');
    await action('roles'); await shot('roles');
    await action('choose-role'); await shot('story-game');
    await action('chronicle'); await shot('chronicle');
    await page.setViewportSize({width:1280,height:720}); await shot('chronicle-720');
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(out,'mobile-chronicle.png'),fullPage:true});
    if(errors.length) throw Error(errors.join('\n'));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
