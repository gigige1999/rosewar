/* Test the extracted ZIP under a restrictive host CSP, then reuse gesture QA. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {spawn, spawnSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname,'..');
const output = path.join(root,'output','xiaohongshu');
const extracted = path.join(output,'verified-zip');
const archive = path.join(output,'玫瑰战争-小红书离线版.zip');
const reports = path.join(output,'qa');
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self'; connect-src 'none'; worker-src 'none'; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'};
const errors=[],measurements=[],requests=new Set();
let server,browser;
async function settle(page){await page.waitForTimeout(220);}
async function click(page,selector){await page.locator(selector).first().click();await settle(page);}
async function frame(page,label,safeBottom=0){
  const result=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
    const leaves=[...document.querySelectorAll('.open-book>.page')].filter(n=>getComputedStyle(n).display!=='none');
    return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,book:rect('.open-book'),nav:rect(innerWidth<=760?'.mobile-reader-nav':'.book-base'),leaves:leaves.map(n=>{const body=n.querySelector('.leaf-content');return {w:body.clientWidth,sw:body.scrollWidth};})};
  });
  assert.ok(result.documentWidth<=result.width+1,label+': no horizontal overflow');
  assert.ok(result.documentHeight<=result.height+1,label+': no document scroll behind book');
  assert.ok(result.book.y>=0&&result.book.bottom<=result.height-safeBottom+1,label+': book fits host viewport');
  assert.ok(result.nav.y>=result.book.bottom-1&&result.nav.bottom<=result.height-safeBottom+1,label+': controls fit above bottom safe area');
  assert.ok(result.leaves.every(leaf=>leaf.sw<=leaf.w+2),label+': no leaf overflow');
  if(result.width<=760) {
    assert.equal(result.leaves.length,1);
    assert.equal(await page.locator('.mobile-reader-nav button:visible').count(),2,label+': one previous/next control pair');
    assert.equal(await page.locator('.mobile-page-tabs,.mobile-reader-context,[data-mobile-index]').count(),0,label+': no competing mobile navigation');
  }
  measurements.push({label,...result});
}
async function lastLine(page,selector){
  const last=page.locator(selector).last();
  const geometry=await last.evaluate(n=>{
    const body=n.closest('.leaf-content');body.scrollTop=body.scrollHeight;
    const range=document.createRange();range.selectNodeContents(n);
    const r=[...range.getClientRects()].filter(r=>r.height).at(-1),b=body.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,viewTop:b.top,viewBottom:b.bottom};
  });
  assert.ok(geometry.top>=geometry.viewTop-1&&geometry.bottom<=geometry.viewBottom+1,selector+' actual final line '+JSON.stringify(geometry));
}
async function runChild(args,url,folder){
  await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,BOOK_ENTRY_URL:url,BOOK_TEST_OUTPUT:path.join(reports,folder)},stdio:'inherit'});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(args.join(' ')+' failed '+code)));
  });
}
(async()=>{
  fs.mkdirSync(reports,{recursive:true});
  fs.rmSync(extracted,{force:true,recursive:true});fs.mkdirSync(extracted,{recursive:true});
  const unzip=spawnSync('python3',['-c','import sys,zipfile\nwith zipfile.ZipFile(sys.argv[1]) as z:\n assert z.testzip() is None\n z.extractall(sys.argv[2])',archive,extracted],{encoding:'utf8'});
  assert.equal(unzip.status,0,unzip.stderr);
  server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const prefix='/offline/rosewar/';
    if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
    const local=path.resolve(extracted,pathname.slice(prefix.length)||'index.html');
    if(!local.startsWith(extracted+path.sep)||!fs.existsSync(local)||!fs.statSync(local).isFile()){errors.push('Missing '+pathname);res.writeHead(404);res.end();return;}
    requests.add(path.relative(extracted,local));
    res.writeHead(200,{'Content-Type':types[path.extname(local)]||'application/octet-stream','Content-Security-Policy':csp,'Cache-Control':'no-store'});
    fs.createReadStream(local).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/offline/rosewar/index.html`;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:680},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.setDefaultTimeout(12000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.route('**/*',route=>{
    if(route.request().url().startsWith(new URL(url).origin+'/'))return route.continue();
    errors.push('External resource '+route.request().url());return route.abort();
  });
  await page.goto(url);
  assert.equal(await page.locator('meta[http-equiv="Content-Security-Policy"]').count(),0,'CSP belongs to the host, not the package');
  const assets=await page.evaluate(async()=>{
    const paths=Object.values(window.BOOK_ART).flatMap(group=>Object.values(group));
    return Promise.all(paths.map(src=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve({src,width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error(src));img.src=src;
    })));
  });
  assert.equal(assets.length,13);assert.ok(assets.every(a=>a.width>100&&a.height>100&&a.src.endsWith('.webp')));
  await page.screenshot({path:path.join(reports,'cover-390.png')});
  for(const [width,height]of [[390,680],[320,568]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{document.documentElement.style.setProperty('--xhs-safe-top','20px');document.documentElement.style.setProperty('--xhs-safe-bottom','34px');});
    for(const language of ['en','zh']){
      await click(page,`[data-action="cover-language"][data-language="${language}"]`);
      const cover=await page.evaluate(()=>{
        const n=document.querySelector('.cover-language').getBoundingClientRect(),b=document.querySelector('.closed-book').getBoundingClientRect(),a=document.querySelector('.open-invitation').getBoundingClientRect();
        return {navTop:n.top,bookTop:b.top,bookRight:b.right,invitationBottom:a.bottom,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};
      });
      assert.ok(cover.navTop>=20&&cover.bookTop>=20&&cover.bookRight<=cover.width&&cover.invitationBottom<=cover.height-34,`safe cover ${width} ${language} ${JSON.stringify(cover)}`);
      assert.ok(cover.scrollWidth<=cover.width+1);
      measurements.push({label:`${width} ${language} safe cover`,...cover});
    }
    await page.screenshot({path:path.join(reports,`cover-safe-${width}.png`)});
  }
  await click(page,'[data-action="open-book"]');await page.locator('.routes-book').waitFor();await settle(page);
  for(const [width,height]of [[390,680],[320,568],[430,792]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{document.documentElement.style.setProperty('--xhs-safe-top','20px');document.documentElement.style.setProperty('--xhs-safe-bottom','34px');});
    await settle(page);
    await frame(page,`${width} container safe-area directory`,34);
    await click(page,'.mobile-reader-nav .mobile-page-next');await frame(page,`${width} second directory page`,34);
    await click(page,'.mobile-reader-nav .mobile-page-previous');
    await page.screenshot({path:path.join(reports,`directory-safe-${width}.png`)});
  }
  await page.setViewportSize({width:390,height:680});await settle(page);
  await click(page,'.toolbar [data-action="genealogy"]');await frame(page,'guide in reduced host viewport',34);
  await click(page,'.genealogy-person[data-person="margaretAnjou"]');
  assert.equal(await page.locator('.mobile-reader-nav').getAttribute('data-mobile-page'),'1');
  await lastLine(page,'.genealogy-detail-note');
  await click(page,'.reading-header [data-action="reader-back"]');
  assert.equal(await page.locator('.mobile-reader-nav').getAttribute('data-mobile-page'),'0');
  await page.screenshot({path:path.join(reports,'genealogy-mobile.png')});
  await page.evaluate(()=>{document.documentElement.style.removeProperty('--xhs-safe-top');document.documentElement.style.removeProperty('--xhs-safe-bottom');});
  for(const [width,height]of [[844,390],[1366,768]]){
    await page.setViewportSize({width,height});await settle(page);await frame(page,`${width} landscape or desktop`);
    assert.equal(await page.locator('[data-action="fullscreen"]').count(),0);
    await page.screenshot({path:path.join(reports,`genealogy-${width}.png`)});
  }
  assert.deepEqual(errors,[]);
  await browser.close();browser=null;
  console.log('PASS extracted ZIP: strict CSP, nested relative paths, 13 WebP images, safe areas, landscape and desktop');
  if(!process.argv.includes('--container-only')){
    await runChild(['tests/spread-reader.test.cjs'],url,'spread');
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(reports,'container-report.json'),JSON.stringify({csp,assets,measurements,requests:[...requests],errors,actualXiaohongshuDeviceTest:false},null,2));
  console.log('PASS offline container edition: CSP + assets + paging + touch + saved drafts; no runtime or resource errors');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
