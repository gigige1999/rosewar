// Image integration QA; isolated browser, no changes to the reader's save.
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output','art-review');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art-manifest.json'),'utf8'));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  const click=a=>page.locator('[data-action="'+a+'"]').first().click();
  const images=async()=>{
   const result=await page.locator('.open-book img').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{await img.decode();return {src:decodeURI(new URL(img.src).pathname),w:img.naturalWidth,h:img.naturalHeight,fit:getComputedStyle(img).objectFit};})));
   assert.ok(result.length);assert.ok(result.every(i=>i.w>0&&i.h>0&&i.fit==='contain'));return result;
  };
  const frame=async()=>{
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const rect=await page.locator('.book-base').boundingBox();assert.ok(rect.y+rect.height<=page.viewportSize().height+1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  };
  const shot=n=>page.screenshot({path:path.join(out,n+'.png'),fullPage:true});
  await click('open-chronicle');await page.locator('.chronicle-book').waitFor();
  for(let i=0;i<7;i++){
   await page.locator('.chronicle-node[data-index="'+i+'"]').click();
   const [img]=await images();assert.ok(img.src.endsWith(manifest.chapters[i].src));await frame();await shot('chapter-'+(i+1));
  }
  await click('roles');
  for(const role of manifest.characters){
   await page.locator('[data-role="'+role.id+'"]').click();
   const [img]=await images();assert.ok(img.src.endsWith(role.src));await frame();await shot('portrait-'+role.id);
  }
  await click('choose-role');await images();await frame();await shot('story-desktop');
  await page.setViewportSize({width:1280,height:720});await images();await frame();await shot('story-720');
  await page.setViewportSize({width:390,height:844});await images();await shot('story-mobile');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await click('chronicle');await images();await shot('chronicle-mobile');
  await page.setViewportSize({width:1366,height:768});
  await click('routes');await images();await frame();await shot('routes');
  // Review all supplied compositions together, including the images' own details.
  const all=[...manifest.chapters,...manifest.characters];
  await page.setViewportSize({width:1200,height:1100});
  await page.setContent('<html><body style="margin:0;padding:20px;background:#e7dcc2;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">'+all.map(a=>'<figure style="margin:0;height:245px;text-align:center"><img style="width:100%;height:220px;object-fit:contain" src="'+pathToFileURL(path.join(root,a.src)).href+'"><figcaption>'+a.id+'</figcaption></figure>').join('')+'</body></html>');
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await shot('contact-sheet');
  assert.deepEqual(errors,[]);
  console.log('PASS: all 13 local paintings decoded and mapped; complete-image display, desktop frame bounds, mobile layout, route reuse; 0 runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
