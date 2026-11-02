// Read-only layout audit in an isolated browser. No user's localStorage is touched.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output','layout-review');
const label=process.argv.includes('--after')?'after':'before';
fs.mkdirSync(out,{recursive:true});
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(root,'content.js'),'utf8'),ctx);
const data=ctx.window.BOOK_DATA;
const bookmark={version:1,role:'margaret',chapter:0,ending:false,sound:false,completed:data.chapters.map(c=>c.id),selections:Object.fromEntries(data.chapters.map(c=>[c.id,Array.isArray(c.puzzle.answer)?c.puzzle.answer:[c.puzzle.answer]]))};
const sizes=[[1366,768],[1280,720],[1024,768],[900,650]];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),results=[],errors=[],issues=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(save=>localStorage.setItem('wars-of-the-roses-manuscript-v1',JSON.stringify(save)),bookmark);
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-action="open-book"]').first().click();await page.locator('.reading-screen').waitFor();
  const click=a=>page.locator('[data-action="'+a+'"]').first().click();
  const measure=async(kind,role,index)=>{
   for(const font of ['standard','large']){
    if(await page.locator('html').getAttribute('data-text-size')!==font)await click('font-size');
    for(const [width,height] of sizes){
     await page.setViewportSize({width,height});
     // Headless viewport changes can publish svh values later than the first rAF.
     await page.waitForTimeout(160);
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     await page.locator('.open-book>.left-page').evaluate(n=>{n.scrollTop=0;const b=n.querySelector('.leaf-content');if(b)b.scrollTop=0;});
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
     const metrics=await page.evaluate(()=>{
      const p=document.querySelector('.open-book>.left-page'),b=p.querySelector('.leaf-content')||p,r=b.getBoundingClientRect(),style=getComputedStyle(b);
      const visibleBottom=r.top+b.clientTop+b.clientHeight;
      const targets=[...p.querySelectorAll('.story-summary,.voice p,.role-description,.role-game-preview p,.chronicle-marginal,.ending-prose')];
      const text=targets.map(n=>{const range=document.createRange();range.selectNodeContents(n);const boxes=[...range.getClientRects()],last=boxes.at(-1)||n.getBoundingClientRect();return {selector:n.className||n.parentElement.className,text:n.textContent,bottom:last.bottom,clipped:Math.max(0,last.bottom-visibleBottom),size:getComputedStyle(n).fontSize};});
      const controls=p.querySelector('.leaf-scroll-controls'),footer=p.querySelector('.leaf-footer');
      return {pageHeight:p.clientHeight,bodyHeight:b.clientHeight,contentHeight:b.scrollHeight,pageBottom:visibleBottom,paddingBottom:style.paddingBottom,overflow:style.overflowY,scrollTop:b.scrollTop,text,hiddenText:text.filter(t=>t.clipped>1).length,controlsVisible:controls?!controls.hidden:false,footerBottom:footer?.getBoundingClientRect().bottom,bookBottom:document.querySelector('.open-book').getBoundingClientRect().bottom,navBottom:document.querySelector('.book-base').getBoundingClientRect().bottom};
     });
     const row={kind,role,index,font,width,height,...metrics};results.push(row);
     if(label==='after'){
      if(metrics.navBottom>height+1||metrics.bookBottom+9>height)issues.push({kind,role,index,font,width,problem:'frame overflow'});
      if(width===1366&&font==='standard'&&((kind==='story'&&index===2&&role==='beaufort')||(kind==='roles'&&role==='beaufort')))await page.screenshot({path:path.join(out,'after-'+kind+'-1366.png'),fullPage:true});
      if(metrics.contentHeight>metrics.bodyHeight+3){
       if(!metrics.controlsVisible)issues.push({kind,role,index,font,width,problem:'missing scroll cue'});
       if(metrics.footerBottom>height)issues.push({kind,role,index,font,width,problem:'footer out of viewport'});
       const down=page.locator('.open-book>.left-page [data-action="leaf-down"]');
       for(let step=0;step<12&&await down.isEnabled();step++){await down.click();await page.waitForTimeout(35);}
       row.reached=await page.locator('.open-book>.left-page').evaluate(p=>{const b=p.querySelector('.leaf-content'),r=b.getBoundingClientRect(),last=[...b.querySelectorAll('.story-summary,.voice p,.role-description,.role-game-preview p,.chronicle-marginal,.ending-prose')].at(-1);const range=document.createRange();range.selectNodeContents(last);const tail=[...range.getClientRects()].at(-1);return {scrollTop:b.scrollTop,tail:tail.bottom,bodyBottom:r.bottom,endLabel:p.querySelector('[data-action="leaf-down"]').textContent,atEnd:b.scrollTop+b.clientHeight>=b.scrollHeight-4};});
       if(!row.reached.atEnd||row.reached.tail>row.reached.bodyBottom+1)issues.push({kind,role,index,font,width,problem:'final line unreachable',reached:row.reached});
       await page.locator('.open-book>.left-page [data-action="leaf-up"]').click();await page.waitForTimeout(35);
       if(await page.locator('.open-book>.left-page .leaf-content').evaluate(b=>b.scrollTop)>1)issues.push({kind,role,index,font,width,problem:'return to top failed'});
      }
     }
     if(width===900&&font==='large'&&((kind==='story'&&index===2&&role==='beaufort')||(kind==='roles'&&role==='beaufort')||(kind==='chronicle'&&index===3))) await page.screenshot({path:path.join(out,label+'-'+kind+'-worst.png'),fullPage:true});
    }
   }
  };
  for(const role of data.roles){
   await click('roles');await page.locator('[data-role="'+role.id+'"]').click();await measure('roles',role.id,null);
   await click('choose-role');
   for(let i=0;i<7;i++){
    await page.locator('.chapter-dot[data-index="'+i+'"]').click();await measure('story',role.id,i);
   }
   console.log('audited '+role.id);
  }
  await click('chronicle');for(let i=0;i<7;i++){await page.locator('.chronicle-node[data-index="'+i+'"]').click();await measure('chronicle',null,i);}
  if(label==='after'){
   await click('roles');await page.locator('[data-role="margaret"]').click();await click('choose-role');await page.locator('.chapter-dot[data-index="1"]').click();
   await page.setViewportSize({width:820,height:540});await page.waitForTimeout(200);
   if(await page.locator('html').getAttribute('data-text-size')!=='large')await click('font-size');
   const left=page.locator('.story-page .leaf-content');await left.evaluate(n=>n.scrollTop=80);await page.waitForTimeout(50);const scrollBefore=await left.evaluate(n=>n.scrollTop);
   const option=page.locator('[data-game-action="choose-option"]').first();await option.click();
   if(Math.abs(await left.evaluate(n=>n.scrollTop)-scrollBefore)>1)issues.push({problem:'right game redraw changed left scroll'});
   for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await page.waitForTimeout(200);
    const mobile=await page.locator('.story-page').evaluate(p=>{const b=p.querySelector('.leaf-content');return {horizontal:document.documentElement.scrollWidth>innerWidth+1,overflow:getComputedStyle(b).overflowY,client:b.clientHeight,content:b.scrollHeight};});
    if(mobile.horizontal||mobile.content>mobile.client+2)issues.push({problem:'mobile clips story',width,mobile});
    if(width===390)await page.screenshot({path:path.join(out,'after-story-mobile.png'),fullPage:true});
   }
  }
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({label,errors,issues,results},null,2));
  const hidden=results.filter(r=>r.hiddenText),summary=sizes.flatMap(([width,height])=>['standard','large'].map(font=>{const rows=results.filter(r=>r.width===width&&r.font===font);return {width,height,font,hidden:rows.filter(r=>r.hiddenText).length,total:rows.length,maxClip:Math.max(...rows.flatMap(r=>r.text.map(t=>t.clipped)))};}));
  console.log(JSON.stringify({summary,worst:hidden.sort((a,b)=>Math.max(...b.text.map(t=>t.clipped))-Math.max(...a.text.map(t=>t.clipped))).slice(0,3),errors,issues},null,2));
  if(issues.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
