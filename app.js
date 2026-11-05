/* 血与花之书 — an offline manuscript, told by six imperfect witnesses. */
(() => {
  'use strict';
  const DATA = window.BOOK_DATA;
  const app = document.getElementById('app');
  const dialog = document.getElementById('folio-dialog');
  const STORE = 'wars-of-the-roses-manuscript-v1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORE)); } catch (_) { /* A fresh book is still readable. */ }
  const book = new window.BookEngine(DATA, stored);
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  let view = 'cover';
  let previewRole = book.state.role || DATA.roles[0].id;
  let busy = false;
  let introTimer;
  let toastTimer;
  let storageNotice = false;
  let audioContext, drone, droneGain;
  let biographyPage = 0;
  let mobileRoutePage = 0, mobileRolePage = 0, mobileGenealogyPage = 0, mobileEndingPage = 0;
  let genealogySheet = 0;
  let genealogyMode = 'guide', genealogyGuide = 0;
  let genealogyPerson = window.Genealogy.sheets[0].defaultPerson;
  const genealogyExpanded = {};
  const returnTrail = [];
  let atlasPlace = null;
  let restartRolePath = false;
  const genealogyExpansion = () => genealogyExpanded[genealogySheet] ||= window.Genealogy.initialPaths(genealogySheet);
  let unbindGame = null;
  let gameHint = false;
  let releaseLeaves = null;
  let leafObserver = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const icon = (name, cls = '') => window.Ornaments.icon(name, cls);
  const rose = (cls = '') => window.Ornaments.rose(cls);
  const button = (action, text, cls = 'text-button', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  const announce = message => { document.getElementById('announcer').textContent = message; };
  const toast = message => {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3400);
  };
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(book.serialize())); }
    catch (_) { if (!storageNotice) { toast('浏览器未允许保存进度；本次仍可完整阅读。'); storageNotice = true; } }
  }
  function media(kind, id, alt) {
    const src = window.BOOK_ART?.[kind]?.[id];
    return src ? `<img src="${escape(src)}" alt="${escape(alt)}" decoding="async">` : '';
  }
  app.addEventListener('error', event => { if (event.target.tagName === 'IMG') event.target.remove(); }, true);
  function cover() {
    window.MobileReader?.release();
    releaseLeaves?.(); releaseLeaves = null;
    unbindGame?.(); unbindGame = null;
    view = 'cover';
    const hasBookmark = Boolean(book.state.mode), english = book.state.coverLanguage === 'en';
    const bookmarkLabel = book.state.mode === 'chronicle' ? `${english ? 'Chronicle' : '历史全景'} · ${DATA.chapters[book.state.chronicleIndex].year}` : book.role ? `${escape(english ? book.role.en : book.role.name)} · ${book.state.ending ? (english ? 'Epilogue' : '尾声') : escape(book.chapter.year)}` : '';
    app.innerHTML = `<main class="cover-screen cover-quiet${english ? ' cover-edition-en' : ''}" lang="${english ? 'en' : 'zh-CN'}">
      <nav class="cover-language" aria-label="${english ? 'Cover language — inner pages are in Chinese' : '封面语言 · 内页为中文'}"><button data-action="cover-language" data-language="zh" aria-pressed="${!english}" lang="zh-CN">中文</button><span aria-hidden="true">/</span><button data-action="cover-language" data-language="en" aria-pressed="${english}" lang="en">EN</button></nav>
      <section class="cover-stage" aria-label="${english ? 'The Wars of the Roses, a closed book' : '玫瑰战争的合拢书本'}">
        <button class="closed-book" data-action="open-book" aria-label="${english ? 'Open the contents — Chinese text' : '翻开书本，进入卷首目录'}">
          <span class="cover-front"><span class="cover-spine"></span><span class="cover-frame"></span>
            <span class="cover-topline">A CHRONICLE OF TWO HOUSES</span>
            <span class="cover-title">${english ? 'THE WARS<br>OF THE ROSES' : '玫瑰战争'}</span><span class="cover-english">${english ? 'ENGLAND · 1455 — 1487' : 'THE WARS OF THE ROSES'}</span>
            <span class="cover-rose">${rose()}</span>
            <span class="cover-subtitle">${english ? 'A BOOK OF BLOOD & BLOOM' : '血与花之书'}</span><span class="cover-year">MCDLV — MCDLXXXVII</span>
          </span>
        </button>
        ${button('open-book', `${english ? 'Open the book' : '翻开此书'}${icon('arrowRight')}`, 'open-invitation')}
        ${hasBookmark ? `<p class="cover-caption">${bookmarkLabel}</p>` : ''}
      </section>
    </main>`;
  }
  function openBook() {
    if (busy) return;
    busy = true;
    pageSound();
    document.querySelector('.cover-screen').classList.add('opening');
    setTimeout(() => {
      busy = false;
      view = 'intro';
      app.innerHTML = `<main class="intro-screen"><span class="eyebrow">Sic transit gloria mundi</span><div class="intro-rose" aria-hidden="true">${rose()}</div><div class="intro-copy">白花记得王冠，红花记得血。<span>而泥土，记得所有人的名字。</span></div><div class="intro-progress" aria-label="正在翻开书页"></div>${button('skip-intro', '略过序幕 →', 'skip-intro')}</main>`;
      introTimer = setTimeout(finishIntro, reducedMotion ? 1300 : 5100);
    }, reducedMotion ? 20 : 850);
  }
  function finishIntro() {
    if (view !== 'intro') return;
    clearTimeout(introTimer);
    returnTrail.length = 0;
    mobileRoutePage = 0;
    view = 'routes';
    render(); save();
    announce('历史里程碑。先读战争缘起，再展开七段历史；也可以接着上次的书签阅读。');
  }
  function header() {
    return `<header class="reading-header">${view!=='routes'?button('reader-back','←','reader-back-button','aria-label="返回来处"'):''}${button('close-book', `${icon('rose')}<span>血与花之书</span>`, 'brand-button', 'aria-label="合上书本，保存书签"')}
    <nav class="toolbar" aria-label="书本工具" id="book-tools">${book.state.mode && view==='routes'?button('resume-bookmark','续读','text-button'):''}${button('routes', '目录', `text-button ${view === 'routes' ? 'current-route' : ''}`)}${button('genealogy', '家谱', `text-button ${view === 'genealogy' ? 'current-route' : ''}`)}${button('chronicle', '历史全景', `text-button ${view === 'chronicle' ? 'current-route' : ''}`)}${button('roles', '人物')}${button('timeline', '年表')}${book.role ? button('decision-journal', '手稿') : ''}<span class="toolbar-divider"></span>${button('font-size', '字', 'icon-button font-toggle', `aria-label="${book.state.fontSize === 'large' ? '恢复标准大字' : '进一步放大字号'}" aria-pressed="${book.state.fontSize === 'large'}"`)}${button('sound', icon(book.state.sound ? 'sound' : 'muted'), 'icon-button', `aria-label="${book.state.sound ? '关闭' : '开启'}声音" aria-pressed="${book.state.sound}"`)}${button('fullscreen', icon('expand'), 'icon-button fullscreen-toggle', 'aria-label="切换全屏"')}${button('about', '书前记', 'text-button mobile-menu-about')}</nav>${button('mobile-tools','更多','mobile-tools-button','aria-expanded="false" aria-controls="book-tools"')}</header>`;
  }
  function running(left, right) { return `<div class="page-running"><span>${left}</span><span>${right}</span></div>`; }
  function spreadNavigation() {
    if (view === 'routes') return { previous:'close-book', next:'history-start', label:'卷首 · 两朵玫瑰' };
    if (view === 'chronicle') return { previous:book.state.chronicleIndex ? 'chronicle-previous' : 'routes', next:book.state.chronicleIndex === 6 ? 'roles' : 'chronicle-next', label:`${DATA.chapters[book.state.chronicleIndex].year} · ${book.state.chronicleIndex + 1} / 7` };
    if (view === 'reading') return { previous:book.state.chapter ? 'previous' : 'roles', next:'next', disabled:!book.isComplete(), label:`${book.chapter.year} · ${book.state.chapter + 1} / 7`, reason:'完成这一页的互动后，继续翻阅' };
    if (view === 'roles') return { previous:'reader-back', next:'choose-role', label:'人物 · ' + (DATA.roles.find(role=>role.id===previewRole)?.name || '') };
    if (view === 'ending') return { previous:'previous', next:'roles', label:'尾声' };
    const guided = genealogyMode === 'guide', index = guided ? genealogyGuide : genealogySheet;
    return { previous:index ? guided ? 'genealogy-guide-previous' : 'genealogy-previous' : 'reader-back', next:index < 3 ? guided ? 'genealogy-guide-next' : 'genealogy-next' : 'reader-back', label:`家谱 · ${index + 1} / 4` };
  }
  function moveSpread(direction) {
    if (busy || dialog.open) return;
    const navigation = spreadNavigation(), action = direction < 0 ? navigation.previous : navigation.next;
    if (direction > 0 && navigation.disabled) return;
    act(action);
    if (direction < 0 && innerWidth <= 760 && !['reader-back','close-book'].includes(action)) {
      setLeafSide(1); syncMobile(); save();
    }
  }
  function setLeafSide(index) {
    if (view === 'reading') book.setReadingSide(index ? 'interaction' : 'story');
    else if (view === 'chronicle') book.setChronicleSide(index ? 'timeline' : 'illustration');
    else if (view === 'roles') mobileRolePage = index;
    else if (view === 'genealogy') mobileGenealogyPage = index;
    else if (view === 'routes') mobileRoutePage = index;
    else if (view === 'ending') mobileEndingPage = index;
  }
  function mobileConfig() {
    const nav = spreadNavigation();
    const config = { view, key:view, steps:[{label:'左页',side:'left'},{label:'右页',side:'right'}], index:0,
      onNavigate:navigateMobile, canNavigate:()=>!busy && !dialog.open,
      onAdvance:()=>moveSpread(1), onRetreat:()=>moveSpread(-1),
      advanceLabel:'后一页', retreatLabel:'前一页', advanceDisabled:nav.disabled,
      advanceDisabledReason:nav.reason, positionLabel:nav.label,
      swipeRetreat:true, swipeAdvance:!['roles','ending'].includes(view) };
    if (view === 'reading') { config.key=`reading:${book.role.id}:${book.chapter.id}`; config.index=book.readingSide === 'interaction' ? 1 : 0; }
    else if (view === 'chronicle') { config.key=`chronicle:${book.state.chronicleIndex}`; config.index=book.state.chronicleSide === 'timeline' ? 1 : 0; }
    else if (view === 'roles') { config.key=`roles:${previewRole}`; config.index=mobileRolePage; }
    else if (view === 'genealogy') { config.key=`genealogy:${genealogyMode}:${genealogyMode==='guide'?genealogyGuide:genealogySheet}`; config.index=mobileGenealogyPage; }
    else if (view === 'routes') config.index=mobileRoutePage;
    else if (view === 'ending') { config.key=`ending:${book.role.id}`; config.index=mobileEndingPage; }
    if (['reading','chronicle'].includes(view)) {
      const chapterIndex=view==='reading'?book.state.chapter:book.state.chronicleIndex;
      config.positionLabel=DATA.chapters[chapterIndex].year;
      config.pageOffset=chapterIndex*2; config.pageTotal=14;
    } else if(view==='genealogy') {
      config.positionLabel='家族图谱'; config.pageOffset=(genealogyMode==='guide'?genealogyGuide:genealogySheet)*2; config.pageTotal=8;
    }
    // Choosing a witness remains an explicit tap, after the last history leaf.
    if (view === 'chronicle' && book.state.chronicleIndex === 6) config.swipeAdvance=false;
    return config;
  }
  function syncMobile() {
    window.MobileReader?.sync(mobileConfig());
    requestAnimationFrame(syncLeafControls);
  }
  function navigateMobile(index) {
    if (busy || dialog.open || ![0,1].includes(index)) return;
    document.querySelector('.reading-header')?.classList.remove('mobile-tools-open');
    document.querySelector('[data-action="mobile-tools"]')?.setAttribute('aria-expanded','false');
    window.MobileReader?.remember();
    setLeafSide(index); save(); syncMobile(); pageSound();
    announce(`${index ? '右' : '左'}页，${spreadNavigation().label}。`);
  }
  function mobileDirectoryBookmark() {
    return book.state.mode ? `<div class="mobile-directory-extras">${button('mobile-resume', `接着上次的书签读${icon('arrowRight')}`, 'text-button mobile-bookmark')}</div>` : '';
  }
  function routePages() {
    return window.Chronicle.overview(atlasPlace);
  }
  function rolePages() {
    const role = DATA.roles.find(item => item.id === previewRole) || DATA.roles[0];
    return `<section class="page left-page role-page">${running('DRAMATIS PERSONAE', '卷首 · 人物')}
      <div class="role-frontispiece"><div class="role-portrait-heading"><div class="role-arch portrait-reserve" aria-label="${escape(role.name)}的肖像"><span>PORTRAIT</span>${media('characters', role.id, role.name + '的手抄本肖像')}</div>
        <div class="role-identity"><span class="eyebrow">${escape(role.en)}</span><h2>${escape(role.name)}</h2><span class="role-years">${escape(role.years)}</span><span class="role-epithet">${escape(role.epithet)}</span></div></div>
        <div class="role-biography">${biographyCopy(role)}</div>
      </div><div class="page-number">✦</div>
    </section>
    <section class="page right-page role-page">${running('CHOOSE YOUR WITNESS', '六人 · 六种目光')}
      <h1 class="selection-heading">换一双眼睛，重走历史</h1><p class="selection-intro">选一个人，从他的牵挂出发。向后翻页，开始这一生。</p>
      <div class="role-grid" role="group" aria-label="选择叙述人物">${DATA.roles.map(item => `<button class="role-card" data-action="preview-role" data-role="${item.id}" aria-pressed="${item.id === role.id}">${media('characters',item.id,item.name+'的肖像')}<strong>${escape(item.name)}</strong><small>${escape(item.faction)}</small></button>`).join('')}</div>
      ${roleMission(role.id)}
      <p class="fiction-note">没有标准答案，只有你愿意承担的代价。<br>真实历史与架空后果分别标注，决定自动记入手稿。</p>
      <div class="page-number">i</div>
    </section>`;
  }
  function roleMission(roleId) {
    const mission = window.BOOK_HISTORY?.missions.find(item => item.role === roleId);
    return mission ? `<aside class="role-mission"><span class="eyebrow">这一回，你要守住什么</span><h3>${escape(mission.title)}</h3><p>${escape(mission.description)}</p></aside>` : '';
  }
  function chapterPages() {
    const chapter = book.chapter, index = book.state.chapter, role = book.role;
    return `<section class="page left-page chapter-page story-page" aria-label="故事与人物视角">${running('THE WARS OF THE ROSES', `CHAPTER ${roman[index]}`)}
      <div class="story-opening"><div class="chapter-page-heading"><span class="chapter-year">${escape(chapter.year)}</span><h2 tabindex="-1" data-reading-heading>${escape(chapter.title)}</h2><p class="chapter-date">${escape(chapter.date)}</p></div>
      <figure class="chapter-scene">${window.ArtFrames.render(index, chapter.title)}</figure></div>
      <div class="story-copy">${storyCopy()}</div>
      <div class="page-number">${String(index * 2 + 1).padStart(2, '0')}</div>
    </section>
    <section class="page right-page chapter-page interaction-page" aria-label="本章互动">${running(`${escape(role.name)} · 之页`, `第 ${roman[index]} 章`)}
      ${gamePanel()}
      <div class="story-revelation">${revelation()}</div><div class="page-number">${String(index * 2 + 2).padStart(2, '0')}</div>
    </section><div class="book-ribbon" aria-hidden="true"><span>${roman[index]}</span></div>`;
  }
  function biographyCopy(role) {
    const pages = window.BOOK_STORIES?.[role.id]?.introduction || [role.description];
    return `<p class="biography-summary">${escape(role.description)}</p><details class="reader-detail biography-detail"><summary>读他的完整前传</summary>${pages.map(text=>`<p class="biography-prose">${escape(text)}</p>`).join('')}</details>`;
  }
  function storyCopy() {
    const pages = window.BOOK_STORIES?.[book.role.id]?.chapters?.[book.state.chapter]?.pages || [];
    return `<p class="story-brief">${escape(pages[0]?.paragraphs[0] || book.chapter.summary)}</p><details class="reader-detail story-detail"><summary>走进${escape(book.role.name)}的这一年</summary>${pages.map(page=>`<section><h3 class="story-section-title">${escape(page.title)}</h3>${page.paragraphs.map(text=>`<p class="story-paragraph">${escape(text)}</p>`).join('')}</section>`).join('')}<p class="story-context-note">史事为叙述基础；人物内心与场景化描写为文学推演。</p>${decisionThread()}</details>`;
  }
  function rememberReturn() {
    if (['cover','intro'].includes(view)) return;
    window.MobileReader?.remember();
    returnTrail.push({view, previewRole,biographyPage,mobileRoutePage,mobileRolePage,mobileGenealogyPage,mobileEndingPage,
      genealogyMode,genealogyGuide,genealogySheet,genealogyPerson,atlasPlace,restartRolePath,
      mode:book.state.mode,role:book.state.role,chapter:book.state.chapter,ending:book.state.ending,
      chronicleIndex:book.state.chronicleIndex,chronicleSide:book.state.chronicleSide,
      storyPage:book.storyPage,readingSide:book.readingSide,chroniclePage:book.chroniclePage,
      details:[...document.querySelectorAll('.open-book>.page details')].map(node=>node.open),
      scroll:[...document.querySelectorAll('.open-book>.page .leaf-content')].map(n=>n.scrollTop)});
    if (returnTrail.length > 12) returnTrail.shift();
  }
  function returnToPreviousView() {
    const previous = returnTrail.pop();
    if (!previous) { act('routes'); return; }
    turn(() => {
      ({view,previewRole,biographyPage,mobileRoutePage,mobileRolePage,mobileGenealogyPage,mobileEndingPage,
        genealogyMode,genealogyGuide,genealogySheet,genealogyPerson,atlasPlace,restartRolePath} = previous);
      // The contents is a landing page, not a second bookmark. Returning there
      // keeps the history or character position the reader just reached.
      if (previous.view !== 'routes') {
        for (const key of ['mode','role','chapter','ending','chronicleIndex','chronicleSide']) book.state[key] = previous[key];
        if (previous.mode === 'character') { book.setStoryPage(previous.storyPage); book.setReadingSide(previous.readingSide); }
        if (previous.mode === 'chronicle') book.setChroniclePage(previous.chroniclePage);
      }
    },true);
    requestAnimationFrame(()=>{
      document.querySelectorAll('.open-book>.page details').forEach((node,i)=>{node.open=previous.details[i] || false;});
      document.querySelectorAll('.open-book>.page .leaf-content').forEach((n,i)=>{n.scrollTop=previous.scroll[i]||0;});
      syncLeafControls();
    });
  }
  function selectAtlasPlace(id) {
    const index = view === 'chronicle' ? book.state.chronicleIndex : 0;
    const detail = document.querySelector('.atlas-place-detail');
    if (!detail || !window.HistoryAtlas.places.some(p=>p.id===id)) return;
    atlasPlace=id;
    document.querySelector('.history-atlas').outerHTML=window.HistoryAtlas.render(index,id);
    const selectedDetail=document.querySelector('.atlas-place-detail');
    syncLeafControls();
    const heading=selectedDetail.querySelector('h3,h4');
    heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true});
    const body=selectedDetail.closest('.leaf-content') || selectedDetail.closest('dialog');
    if(body) body.scrollTo({top:body.scrollTop+selectedDetail.getBoundingClientRect().top-body.getBoundingClientRect().top-8,behavior:reducedMotion?'instant':'smooth'});
  }
  function changeGenealogy(index, person) {
    if (!Number.isInteger(index) || !window.Genealogy.sheets[index]) return;
    const backwards = index < genealogySheet;
    turn(() => {
      genealogyMode = 'detail';
      genealogySheet = index;
      genealogyPerson = person && window.Genealogy.people[person] ? person : window.Genealogy.sheets[index].defaultPerson;
      mobileGenealogyPage = person ? 1 : 0;
      if (person) window.Genealogy.paths(index, person).forEach(path => genealogyExpansion().add(path));
      view = 'genealogy';
    }, backwards);
    if (person) requestAnimationFrame(() => {
      const detailBody = document.querySelector('.genealogy-person-page .leaf-content');
      if (detailBody) detailBody.scrollTop = 0;
      const node = document.querySelector('.genealogy-person[aria-pressed="true"]');
      const body = node?.closest('.leaf-content');
      if (body && innerWidth > 760) body.scrollTop += node.getBoundingClientRect().top - body.getBoundingClientRect().top - 20;
    });
    announce(`家族图谱：${window.Genealogy.sheets[index].title}。点名字阅读人物关系。`);
  }
  function changeGenealogyGuide(index) {
    if (!Number.isInteger(index) || !window.Genealogy.guides[index]) return;
    const backwards = index < genealogyGuide;
    turn(() => {
      genealogyMode = 'guide'; genealogyGuide = index; genealogyPerson = null;
      mobileGenealogyPage = 0; view = 'genealogy';
    }, backwards, true);
    announce(`入门关系第 ${index + 1} 图：${window.Genealogy.guides[index].question}`);
  }
  function selectGenealogyPerson(id) {
    if (view !== 'genealogy' || !window.Genealogy.people[id]) return;
    window.MobileReader?.remember();
    genealogyPerson = id;
    document.querySelectorAll('.genealogy-person').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.person === id)));
    const detail = document.querySelector('.genealogy-detail');
    detail.innerHTML = genealogyMode === 'guide' ? window.Genealogy.guideDetail(genealogyGuide, id) : window.Genealogy.detail(id);
    detail.closest('.leaf-content').scrollTop = 0;
    mobileGenealogyPage = 1;
    window.MobileReader?.sync({ ...mobileConfig(), resetScroll: true });
    if (innerWidth <= 760) detail.querySelector('h2').focus({ preventScroll: true });
    syncLeafControls();
    announce(`${window.Genealogy.people[id].name}。人物与亲属关系已展开。`);
  }
  function refreshGenealogyTree(focusPath) {
    if (view !== 'genealogy' || genealogyMode !== 'detail') return;
    const wrapper = document.querySelector('.genealogy-tree-wrap'), body = wrapper.closest('.leaf-content');
    const scroll = body.scrollTop;
    wrapper.innerHTML = window.Genealogy.tree(genealogySheet, genealogyPerson, genealogyExpansion());
    body.scrollTop = scroll;
    if (focusPath) wrapper.querySelector(`[data-path="${CSS.escape(focusPath)}"]`)?.focus({ preventScroll: true });
    syncLeafControls();
  }
  function gamePanel(message = '') {
    const roleId = book.role.id, meta = window.RoleGames.meta(roleId, book.state.chapter), solved = book.isComplete();
    const isChoice = meta.type === 'choice' || meta.kind === 'choice';
    return `<section class="game-panel${solved ? ' game-complete' : ''}${isChoice ? ' choice-panel' : ''}" aria-labelledby="game-title"><div class="game-panel-heading"><span>${isChoice ? '命运的抉择' : '纸上的片刻'}</span><span>${solved ? isChoice ? '✦ 已落笔' : '✦ 已完成' : isChoice ? '每条路，都有代价' : '不计时 · 慢慢来'}</span></div><h3 id="game-title">${escape(meta.title)}</h3>${isChoice && meta.sceneDate ? `<p class="decision-scene-date">${escape(meta.sceneDate)} · 心境为文学想象</p>` : ''}<p class="game-stakes">${escape(meta.stakes || meta.description)}</p><p class="game-instruction">${escape(meta.instruction)}</p><div class="game-board" data-activity-kind="${escape(meta.kind)}">${window.RoleGames.render(roleId, book.state.chapter, book.game, { solved })}</div><div class="game-foot"><span class="game-message" role="status">${isChoice ? '' : escape(message || (solved ? '这一页已经留下你的痕迹。' : ''))}</span>${!solved ? button('game-hint', gameHint ? '收起' : isChoice ? '听见心里的另一声' : '一点提示', 'hint-button', `aria-expanded="${gameHint}"`) : icon('seal')}</div>${gameHint && !solved ? `<p class="game-hint">${escape(meta.hint)}</p>` : ''}${solved ? button('game-revisit-prompt', isChoice ? '重走此刻，重新落笔' : '重走此刻，再玩一次', 'game-reset') : !isChoice ? button('game-reset', '重新摆放', 'game-reset') : ''}</section>`;
  }
  function revelation() {
    return book.isComplete() ? `<div class="revealed-fact"><span class="revelation-label">${icon('seal')}历史底本 · 史官续记</span><p>${escape(book.chapter.fact)}</p></div>` : `<p class="unrevealed-note">${icon('feather')}${window.RoleGames.meta(book.role.id, book.state.chapter).kind === 'choice' ? '落笔之后，读一读你的后果与真实历史。' : '让手上的片刻，为这一页留下记忆。'}</p>`;
  }
  function decisionThread() {
    const previous = book.decisions().filter(entry => entry.index < book.state.chapter).at(-1);
    if (!previous) return '';
    return `<aside class="decision-echo"><span>${icon('feather')}${previous.historical ? '上一笔的余响 · 沿着史实' : '上一笔的余响 · 架空推演'}</span><p>${escape(previous.echo)}</p>${button('decision-journal', '展开我的手稿 →', 'text-button')}</aside>`;
  }
  function decisionLedger() {
    const entries = book.decisions();
    if (!entries.length) return '<p class="dialog-description">你还没有落下决定。人物路线中的每次选择，都将把动机、代价与另一种可能留在这里。</p>';
    return `<ol class="decision-ledger">${entries.map(entry => `<li><span class="decision-ledger-date">${escape(entry.sceneDate)} · ${entry.historical ? '沿着史实' : '架空支线'}</span><h3>${escape(entry.title)}</h3><p class="decision-ledger-choice">${escape(entry.text)}</p><p>${escape(entry.consequence)}</p><div class="decision-ledger-echo">${escape(entry.echo)}</div><details><summary>对照历史中的那一笔</summary><p>${escape(entry.historicalNote)}</p></details></li>`).join('')}</ol>`;
  }
  function decisionJournal() {
    if (!book.role) return;
    openDialog(`${escape(book.role.name)} · 你的手稿`, 'The paths you chose', `<p class="dialog-description">这是你在不同人生关口留下的决定。每一处架空支线独立从标明年代的处境出发；历史底本仍沿真实年份展开。</p>${decisionLedger()}`);
  }
  function mountGame() {
    const container = document.querySelector('.game-board');
    if (container && window.RoleGames.bind) unbindGame = window.RoleGames.bind(container, playGame);
  }
  function refreshGame(message = '') {
    const active = document.activeElement;
    const focus = active?.matches('[data-game-action]') ? { action: active.dataset.gameAction, value: active.dataset.gameValue } : active?.matches('.rg-letter') ? { letter: true } : null;
    unbindGame?.(); unbindGame = null;
    const panel = document.querySelector('.game-panel');
    if (panel) {
      leafObserver?.unobserve(panel);
      panel.outerHTML = gamePanel(message);
      const replacement = document.querySelector('.game-panel');
      if (replacement) leafObserver?.observe(replacement);
    }
    const note = document.querySelector('.story-revelation');
    if (note) note.innerHTML = revelation();
    const footer = document.querySelector('.book-base');
    if (footer) footer.outerHTML = base();
    mountGame();
    syncMobile();
    syncLeafControls();
    if (focus?.letter) document.querySelector('.rg-letter')?.focus({ preventScroll: true });
    else if (focus) document.querySelector(`[data-game-action="${CSS.escape(focus.action)}"][data-game-value="${CSS.escape(focus.value || '')}"]`)?.focus({ preventScroll: true });
  }
  function playGame(action, payload) {
    if (busy || view !== 'reading') return;
    const wasComplete = book.isComplete();
    const result = book.actGame(action, payload);
    if (result.changed) { save(); refreshGame(result.message); }
    else if (result.message) { const message = document.querySelector('.game-message'); if (message) message.textContent = result.message; }
    if (!wasComplete && book.isComplete()) {
      pageSound();
      const decision = window.RoleGames.meta(book.role.id, book.state.chapter).kind === 'choice';
      announce(decision ? '你的决定已记入手稿。选择的后果与历史对照已经显现。' : '这一页已完成，可以翻往下一章。');
      if (decision) {
        const outcome = document.querySelector('.ma-decision-outcome'), body = outcome?.closest('.leaf-content');
        if (outcome && body) {
          outcome.setAttribute('tabindex', '-1');
          outcome.focus({ preventScroll: true });
          if (getComputedStyle(body).overflowY === 'auto') body.scrollTo({ top: body.scrollTop + outcome.getBoundingClientRect().top - body.getBoundingClientRect().top - 12, behavior: reducedMotion ? 'instant' : 'smooth' });
          else outcome.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' });
        }
      }
    }
  }
  function endingPages() {
    const role = book.role;
    return `<section class="page left-page">${running('THE LAST LEAF', '尾声 · 花开之后')}<div class="ending-art">${window.ArtFrames.render(6, '尾声 · 预留图版')}</div><h1 class="ending-heading">王冠会易主。<br>玫瑰仍会开。</h1><p class="ending-quote">白与红，终于长在同一根枝上。<br><span class="micro">但泥土之下，仍是未尽的往事。</span></p><p class="ending-prose">1487 年的斯托克会战，通常被视为玫瑰战争的最后一场主要会战。都铎王朝站稳了脚跟，争位的阴影却没有立刻消散。历史很少在最后一页，真正结束。</p><div class="page-number">15</div></section>
    <section class="page right-page">${running('A LIFE BETWEEN THE LINES', '你的见证者')}<h2 class="ending-role">${escape(role.name)}</h2><span class="role-years">${escape(role.years)}</span><p class="ending-prose">${escape(role.ending)}</p><div class="voice"><span class="voice-label">合卷之语 · 文学创作</span><p>${escape(role.motto)}</p></div>
      <section class="ending-manuscript"><span class="eyebrow">你的另一卷</span><h3>这些决定，留下了你。</h3>${book.decisions().length ? `<p>${escape(book.decisions().at(-1).echo)}</p>` : '<p>旧书签留住了阅读进度；回到人物章节，可以为新的困境亲自落笔。</p>'}${button('decision-journal', '重读我的选择与结局 →', 'text-button')}</section><div class="colophon">这页记录人物的真实终点；你的架空支线保存在手稿中。人物内心、对话与未曾发生的后果为文学创作。</div>
      <div class="ending-actions">${button('roles', `换一双眼睛${icon('arrowRight')}`, 'primary-button')}${button('timeline', '重读大事记')}${button('about', '史料与书前记')}</div><div class="finis">Finis. &nbsp; ✧</div><div class="page-number">16</div></section>`;
  }
  function base() {
    const nav=spreadNavigation();
    return `<nav class="book-base spread-navigation" aria-label="整组书页翻阅">${button('reader-previous', '← 前一页', 'reader-turn')}<span class="reader-position">${escape(nav.label)}${nav.disabled ? '<small>完成右页互动后继续</small>' : view==='roles' ? '<small>向后翻页，以此人开始</small>' : ''}</span>${button('reader-next','后一页 →','reader-turn',nav.disabled ? `disabled title="${escape(nav.reason)}"` : '')}</nav>`;
  }
  function render() {
    window.MobileReader?.release();
    releaseLeaves?.(); releaseLeaves = null;
    unbindGame?.(); unbindGame = null;
    document.documentElement.dataset.textSize = book.state.fontSize;
    if (view === 'cover') { cover(); return; }
    const pageName = view === 'genealogy' ? '卷首家族图谱' : view === 'chronicle' ? '上帝视角：图文时间轴' : view === 'routes' ? '历史里程碑与战争导读' : view === 'roles' ? '卷首人物选择' : view === 'ending' ? '尾声' : `第${roman[book.state.chapter]}章：${escape(book.chapter.title)}`;
    app.innerHTML = `<main class="reading-screen">${header()}<article class="open-book ${view}-book" aria-label="${pageName}">${view === 'genealogy' ? genealogyMode === 'guide' ? window.Genealogy.renderGuide(genealogyGuide, genealogyPerson) : window.Genealogy.render(genealogySheet, genealogyPerson, genealogyExpansion()) : view === 'chronicle' ? window.Chronicle.render(book.state.chronicleIndex) : view === 'routes' ? routePages() : view === 'roles' ? rolePages() : view === 'ending' ? endingPages() : chapterPages()}</article>${base()}</main>`;
    mountLeaves();
    window.MobileReader?.mount(mobileConfig());
    if (view === 'reading') mountGame();
  }
  function syncLeafControls() {
    document.querySelectorAll('.open-book > .page').forEach(page => {
      const body=page.querySelector('.leaf-content'), hint=page.querySelector('.leaf-scroll-hint');
      if(!body || !hint) return;
      const more=body.scrollHeight-body.clientHeight>3 && body.scrollTop+body.clientHeight<body.scrollHeight-4;
      hint.hidden=!more; page.classList.toggle('leaf-has-more',more);
    });
  }
  function mountLeaves() {
    const disposers = [], observer = new ResizeObserver(syncLeafControls);
    leafObserver = observer;
    document.querySelectorAll('.open-book > .page').forEach((page, index) => {
      page.querySelectorAll('.story-pagination,.genealogy-return-tree').forEach(node=>node.remove());
      if (view === 'routes' && index===1) page.insertAdjacentHTML('beforeend', mobileDirectoryBookmark());
      const running = page.querySelector('.page-running'), number = page.querySelector('.page-number');
      const body = document.createElement('div');
      body.className = 'leaf-content'; body.id = `leaf-content-${index}`;
      body.tabIndex = 0; body.setAttribute('role', 'region');
      body.setAttribute('aria-label', page.getAttribute('aria-label') || (index ? '右页内容' : '左页内容'));
      Array.from(page.children).filter(node => node !== running && node !== number).forEach(node => body.append(node));
      const footer = document.createElement('div'); footer.className = 'leaf-footer';
      if (number) footer.append(number);
      footer.insertAdjacentHTML('beforeend','<span class="leaf-scroll-hint" hidden>向下阅读 ↓</span>');
      page.append(body, footer);
      body.addEventListener('scroll', syncLeafControls, { passive: true });
      disposers.push(() => body.removeEventListener('scroll', syncLeafControls));
      observer.observe(body); Array.from(body.children).forEach(node => observer.observe(node));
    });
    window.addEventListener('resize', syncLeafControls);
    requestAnimationFrame(syncLeafControls);
    releaseLeaves = () => { observer.disconnect(); leafObserver = null; disposers.forEach(fn => fn()); window.removeEventListener('resize', syncLeafControls); };
  }
  function turn(change, backwards = false, resetMobileScroll = false) {
    if (busy) return;
    const leaf = document.querySelector(backwards ? '.left-page' : '.right-page')?.cloneNode(true);
    change();
    gameHint = false;
    save();
    render();
    if (resetMobileScroll) window.MobileReader?.sync({ ...mobileConfig(), resetScroll: true });
    pageSound();
    const heading = innerWidth <= 760
      ? document.querySelector('.mobile-leaf-active [data-reading-heading], .mobile-leaf-active .selection-heading, .mobile-leaf-active .ending-heading, .mobile-leaf-active h2')
      : document.querySelector('[data-reading-heading], .selection-heading, .ending-heading');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    if (innerWidth <= 760) window.MobileReader?.enter(backwards ? -1 : 1);
    if (leaf && !reducedMotion && innerWidth > 760) {
      busy = true;
      const sheet = document.createElement('div');
      sheet.className = `page-turn${backwards ? ' backwards' : ''}`;
      sheet.setAttribute('aria-hidden', 'true');
      sheet.inert = true;
      sheet.appendChild(leaf);
      document.querySelector('.open-book').appendChild(sheet);
      setTimeout(() => { sheet.remove(); busy = false; }, 680);
    }
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    announce(view === 'ending' ? '故事已抵达尾声。' : view === 'chronicle' ? `历史全景，${window.Chronicle.entries[book.state.chronicleIndex].year}，${window.Chronicle.entries[book.state.chronicleIndex].title}` : view === 'reading' ? `${book.chapter.year}，${book.chapter.title}` : view === 'routes' ? '战争导读与历史里程碑。' : view === 'roles' ? '选择人物与使命。' : '查阅人物关系。');
  }
  function openDialog(title, eyebrow, body) {
    dialog.className = 'dialog';
    dialog.innerHTML = `<div class="dialog-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="dialog-title">${title}</h2></div>${button('dismiss', icon('close'), 'icon-button', 'aria-label="合上夹页"')}</div>${body}`;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-action="dismiss"]')?.focus();
  }
  function timeline() {
    const free = ['routes','chronicle'].includes(view) || book.state.mode === 'chronicle' || !book.role;
    openDialog('书中目录', 'A chronology · 1455—1487', `<p class="dialog-description">${free ? '上帝视角可以直接阅读任意年份。' : '人物路线交替展开人生抉择与小游戏；历史全景可自由翻阅。'}</p><ol class="timeline-list">${DATA.chapters.map((chapter, i) => `<li class="${book.isComplete(i) ? 'complete' : ''}"><button data-action="${free ? 'chronicle-goto' : 'goto'}" data-index="${i}" ${free || book.isUnlocked(i) ? '' : 'disabled'}><span class="timeline-year">${chapter.year}</span><span class="timeline-title">${escape(chapter.title)}</span><span class="timeline-status">${free ? '翻阅' : book.isComplete(i) ? '已揭开' : book.isUnlocked(i) ? '可翻阅' : '待揭开'}</span></button></li>`).join('')}</ol>${button('chronicle', '直接阅读历史全景')}${button('about', '史料与书前记')}`);
  }
  function about() {
    openDialog('书前记', 'A note from the scribe', `<p class="dialog-description">玫瑰战争并非一条笔直的红白分界。忠诚会转向，血缘会缠绕，幸存本身也是一种选择。</p><p class="dialog-description">本书的年份、战役与人物结局依据通行历史叙述整理；所有第一人称独白均为虚构。对未出生、尚幼、流亡或已去世者，使用追读、回望或编者续注，不把文学旁白当作真实证言。塔中王子的最终命运仍无定论。图标为叙事纹章，并非严格的历史纹章复原。</p><p class="dialog-description">可以对照阅读：</p><ul class="dialog-sources"><li>Encyclopaedia Britannica：Wars of the Roses</li><li>Historic Royal Palaces：The Princes in the Tower</li><li>Westminster Abbey：Henry VII & Elizabeth of York</li><li>A. J. Pollard：《The Wars of the Roses》</li></ul><p class="dialog-note">更详细的参考入口与创作边界见项目 SOURCES.md。<br>进度保存在当前浏览器；更换设备或清除浏览器数据不会保留书签。</p>${button('restart-confirm', '从头重读，清除本机书签', 'text-button')}`);
  }
  function soundToggle() {
    book.state.sound = !book.state.sound;
    if (book.state.sound) startSound(); else stopSound();
    save();
    const el = document.querySelector('[data-action="sound"]');
    if (el) { el.innerHTML = icon(book.state.sound ? 'sound' : 'muted'); el.setAttribute('aria-pressed', String(book.state.sound)); el.setAttribute('aria-label', `${book.state.sound ? '关闭' : '开启'}声音`); }
  }
  function ensureAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    audioContext ||= new Audio();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  function startSound() {
    const ctx = ensureAudio();
    if (!ctx || drone) return;
    droneGain = ctx.createGain();
    droneGain.gain.value = .012;
    droneGain.connect(ctx.destination);
    drone = [130.81, 196].map(frequency => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = frequency; o.connect(droneGain); o.start(); return o; });
  }
  function stopSound() { drone?.forEach(o => { try { o.stop(); } catch (_) {} }); drone = null; droneGain?.disconnect(); }
  function pageSound() {
    if (!book.state.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    startSound();
    const length = Math.floor(ctx.sampleRate * .24), buffer = ctx.createBuffer(1, length, ctx.sampleRate), samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * .09 * Math.sin(Math.PI * i / length);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1200; source.connect(filter); filter.connect(ctx.destination); source.start();
    source.onended = () => { source.disconnect(); filter.disconnect(); };
  }
  async function act(action, target) {
    if (busy && !['sound', 'dismiss'].includes(action)) return;
    const destination = ({genealogy:'genealogy',roles:'roles','genealogy-role':'roles','mission-role':'roles',chronicle:'chronicle','chronicle-goto':'chronicle'})[action];
    if (destination && destination !== view) rememberReturn();
    if (action !== 'mobile-tools') {
      const header = document.querySelector('.reading-header');
      header?.classList.remove('mobile-tools-open');
      header?.querySelector('[data-action="mobile-tools"]')?.setAttribute('aria-expanded', 'false');
    }
    switch (action) {
      case 'mobile-tools': {
        const header = document.querySelector('.reading-header');
        const open = header.classList.toggle('mobile-tools-open');
        target.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'cover-language': {
        if (view !== 'cover' || !['zh', 'en'].includes(target.dataset.language)) break;
        book.state.coverLanguage = target.dataset.language;
        save(); cover();
        document.querySelector(`[data-action="cover-language"][data-language="${book.state.coverLanguage}"]`)?.focus({ preventScroll: true });
        break;
      }
      case 'leaf-down':
      case 'leaf-up': {
        const body = target.closest('.page')?.querySelector('.leaf-content');
        if (body) body.scrollTo({ top: action === 'leaf-up' ? 0 : body.scrollTop + body.clientHeight * .8, behavior: reducedMotion ? 'instant' : 'smooth' });
        break;
      }
      case 'open-book': openBook(); break;
      case 'open-chronicle': if (view === 'cover') openBook(); else act('chronicle'); break;
      case 'skip-intro': finishIntro(); break;
      case 'close-book': save(); stopSound(); cover(); window.scrollTo(0, 0); break;
      case 'reader-previous': if(innerWidth<=760) window.MobileReader?.move(-1); else moveSpread(-1); break;
      case 'reader-next': if(innerWidth<=760) window.MobileReader?.move(1); else moveSpread(1); break;
      case 'history-start': act('chronicle-goto',{dataset:{index:'0'}}); break;
      case 'reader-back': if(view==='genealogy' && mobileGenealogyPage && innerWidth<=760) act('genealogy-return-tree'); else returnToPreviousView(); break;
      case 'history-map': openDialog('战争的足迹','BRITANNIA · '+(view==='chronicle'?DATA.chapters[book.state.chronicleIndex].year:'1455—1487'),window.HistoryAtlas.render(view==='chronicle'?book.state.chronicleIndex:0,atlasPlace)); dialog.classList.add('atlas-dialog'); break;
      case 'routes': if (dialog.open) dialog.close(); returnTrail.length=0; turn(() => { mobileRoutePage = 0; view = 'routes'; atlasPlace=null; }, true,true); break;
      case 'atlas-place': selectAtlasPlace(target.dataset.place); break;
      case 'atlas-return': { const map=document.querySelector('.history-atlas-map,.atlas-map'); map?.setAttribute('tabindex','-1'); map?.focus({preventScroll:true}); map?.scrollIntoView({block:'start',behavior:reducedMotion?'instant':'smooth'}); break; }
      case 'genealogy': if (dialog.open) dialog.close(); changeGenealogyGuide(genealogyGuide); break;
      case 'genealogy-mode': if (target.dataset.mode === 'detail') changeGenealogy(genealogySheet); else changeGenealogyGuide(genealogyGuide); break;
      case 'genealogy-guide': changeGenealogyGuide(Number(target.dataset.index)); break;
      case 'genealogy-guide-previous': changeGenealogyGuide(genealogyGuide - 1); break;
      case 'genealogy-guide-next': changeGenealogyGuide(genealogyGuide + 1); break;
      case 'genealogy-guide-detail': changeGenealogy(Number(target.dataset.index), window.Genealogy.guides[genealogyGuide].defaultPerson); break;
      case 'genealogy-find': changeGenealogy(window.Genealogy.findSheet(target.dataset.person), target.dataset.person); break;
      case 'genealogy-guide-summary': {
        genealogyPerson = null;
        document.querySelectorAll('.genealogy-person').forEach(node => node.setAttribute('aria-pressed', 'false'));
        document.querySelector('.genealogy-detail').innerHTML = window.Genealogy.guideDetail(genealogyGuide, null);
        window.MobileReader?.sync({ ...mobileConfig(), resetScroll: true });
        document.querySelector('.genealogy-person-page .leaf-content').scrollTop = 0;
        document.querySelector('.guide-explanation h2')?.focus({ preventScroll: true });
        syncLeafControls(); break;
      }
      case 'genealogy-sheet': changeGenealogy(Number(target.dataset.index)); break;
      case 'genealogy-previous': if (view === 'genealogy') changeGenealogy(genealogySheet - 1); break;
      case 'genealogy-next': if (view === 'genealogy') changeGenealogy(genealogySheet + 1); break;
      case 'genealogy-person': selectGenealogyPerson(target.dataset.person); break;
      case 'genealogy-toggle': {
        const path = target.dataset.path, expanded = genealogyExpansion();
        if (expanded.has(path)) expanded.delete(path); else expanded.add(path);
        refreshGenealogyTree(path);
        announce(expanded.has(path) ? '后代分支已展开。' : '后代分支已收起。');
        break;
      }
      case 'genealogy-expand-all': genealogyExpanded[genealogySheet] = window.Genealogy.paths(genealogySheet); refreshGenealogyTree(); announce('这一页的全部后代已展开。'); break;
      case 'genealogy-collapse-all': genealogyExpanded[genealogySheet] = window.Genealogy.initialPaths(genealogySheet); refreshGenealogyTree(); document.querySelector('.genealogy-map-page .leaf-content').scrollTop = 0; announce('已收起后代，保留主要家族分支。'); break;
      case 'genealogy-jump': changeGenealogy(Number(target.dataset.index), target.dataset.person); break;
      case 'genealogy-return-tree': {
        window.MobileReader?.remember();
        if (genealogyMode === 'detail') {
          window.Genealogy.paths(genealogySheet, genealogyPerson).forEach(path => genealogyExpansion().add(path));
          refreshGenealogyTree();
        }
        mobileGenealogyPage = 0; syncMobile();
        const node = document.querySelector('.genealogy-person[aria-pressed="true"]') || document.querySelector('.genealogy-heading h1');
        node?.focus({ preventScroll: true });
        const body = node?.closest('.leaf-content');
        if (body) body.scrollTo({ top: body.scrollTop + node.getBoundingClientRect().top - body.getBoundingClientRect().top - body.clientHeight / 2 + node.offsetHeight / 2, behavior: reducedMotion ? 'instant' : 'smooth' });
        break;
      }
      case 'genealogy-role':
        if (DATA.roles.some(role => role.id === target.dataset.role)) {
          restartRolePath = book.state.mode !== 'character';
          previewRole = target.dataset.role; biographyPage = 0; mobileRolePage = 0;
          turn(() => { view = 'roles'; });
        }
        break;
      case 'mobile-resume':
      case 'resume-bookmark': if (book.state.mode) turn(() => { view = book.state.mode === 'chronicle' ? 'chronicle' : book.state.ending ? 'ending' : 'reading'; }); break;

      case 'chronicle': if (dialog.open) dialog.close(); turn(() => { book.openChronicle(); view = 'chronicle'; }); break;
      case 'chronicle-goto': {
        const index = Number(target.dataset.index);
        if (!Number.isInteger(index) || index < 0 || index >= DATA.chapters.length) break;
        if (dialog.open) dialog.close();
        turn(() => { book.openChronicle(index); book.setChronicleSide('illustration'); book.setChroniclePage(0); atlasPlace=null; view = 'chronicle'; }, index < book.state.chronicleIndex,true);
        break;
      }
      case 'chronicle-next': if (view === 'chronicle' && book.state.chronicleIndex < 6) turn(() => { book.openChronicle(book.state.chronicleIndex + 1); book.setChronicleSide('illustration'); book.setChroniclePage(0); atlasPlace=null; },false,true); break;
      case 'chronicle-previous': if (view === 'chronicle' && book.state.chronicleIndex > 0) turn(() => { book.openChronicle(book.state.chronicleIndex - 1); book.setChronicleSide('illustration'); book.setChroniclePage(0); atlasPlace=null; },true,true); else if (view==='chronicle') act('routes'); break;
      case 'font-size': {
        book.state.fontSize = book.state.fontSize === 'large' ? 'standard' : 'large';
        document.documentElement.dataset.textSize = book.state.fontSize;
        target.setAttribute('aria-pressed', String(book.state.fontSize === 'large'));
        target.setAttribute('aria-label', book.state.fontSize === 'large' ? '恢复标准大字' : '进一步放大字号');
        save(); toast(book.state.fontSize === 'large' ? '已切换为更大的阅读字号' : '已恢复标准大字'); break;
      }
      case 'preview-role': if(!DATA.roles.some(role=>role.id===target.dataset.role)) break; previewRole = target.dataset.role; biographyPage = 0; mobileRolePage = 0; render(); if (innerWidth > 760) document.querySelector(`[data-role="${previewRole}"]`)?.focus({ preventScroll: true }); else { window.MobileReader?.sync({ ...mobileConfig(), resetScroll: true }); window.MobileReader?.enter(1); } break;
      case 'choose-role': {
        const starting = restartRolePath || book.state.ending || previewRole !== book.state.role;
        const chapter = starting ? 0 : book.state.chapter;
        book.selectRole(previewRole); book.goTo(chapter);
        if (starting) { book.setReadingSide('story'); book.setStoryPage(0); }
        restartRolePath=false; returnTrail.length=0;
        turn(() => { view = 'reading'; }, false, starting); break;
      }
      case 'roles': restartRolePath=['chronicle','routes'].includes(view); previewRole = book.state.role || DATA.roles[0].id; biographyPage = 0; mobileRolePage = 0; turn(() => { view = 'roles'; }, true,true); break;
      case 'mission-role': if(DATA.roles.some(role=>role.id===target.dataset.role)){restartRolePath=true; previewRole=target.dataset.role; biographyPage=0; mobileRolePage=0;turn(()=>{view='roles';},false,true);} break;
      case 'return-reading': view = book.state.mode === 'chronicle' ? 'chronicle' : book.state.ending ? 'ending' : 'reading'; render(); break;
      case 'game-hint': gameHint = !gameHint; refreshGame(); document.querySelector('[data-action="game-hint"]')?.focus({ preventScroll: true }); break;
      case 'game-reset': playGame('reset', ''); break;
      case 'game-revisit-prompt': if (view === 'reading' && book.isComplete()) {
        openDialog('重回这个瞬间', 'Another path', `<p class="dialog-description">重新体验当前这一页。你可以作出另一种决定，或再玩一次小游戏；重新落笔后，这一页的手稿会记录新的选择。已读章节与其他人物的记录会保留。</p>${button('game-revisit', '重新体验这一页', 'primary-button')} ${button('dismiss', '保留这一笔')}`);
        break;
      } break;
      case 'game-revisit': if (view === 'reading' && book.revisitActivity()) {
        if (dialog.open) dialog.close();
        gameHint = false; save(); refreshGame();
        const heading = document.querySelector('#game-title');
        heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true});
        const body = heading?.closest('.leaf-content'); if (body) body.scrollTop = 0;
        syncLeafControls(); announce('回到选择之前。你可以重新体验这一页。');
      } break;
      case 'next': if (view === 'reading' && book.isComplete()) turn(() => { book.next(); if (!book.state.ending) { book.setReadingSide('story'); book.setStoryPage(0); } mobileEndingPage = 0; view = book.state.ending ? 'ending' : 'reading'; }, false, true); break;
      case 'previous': if (view === 'ending') turn(() => { book.goTo(DATA.chapters.length - 1); book.setReadingSide('story'); book.setStoryPage(0); view = 'reading'; },true,true); else if (view === 'reading' && book.state.chapter > 0) turn(() => { book.previous(); book.setReadingSide('story'); book.setStoryPage(0); },true,true); break;
      case 'goto': {
        const index = Number(target.dataset.index);
        if (book.state.role && book.isUnlocked(index)) { if (dialog.open) dialog.close(); turn(() => { book.selectRole(book.state.role); book.goTo(index); view = 'reading'; }, index < book.state.chapter); }
        break;
      }
      case 'timeline': timeline(); break;
      case 'decision-journal': decisionJournal(); break;
      case 'about': about(); break;
      case 'dismiss': dialog.close(); break;
      case 'sound': soundToggle(); break;
      case 'fullscreen': try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('可使用浏览器的全屏模式继续阅读。'); } catch (_) { toast('当前浏览器未允许全屏；可以继续阅读。'); } break;
      case 'restart-confirm': openDialog('重写这本书？', 'A new beginning', `<p class="dialog-description">将清除本机的人物小游戏与全景阅读书签，回到合拢的封面。</p>${button('restart', '清除书签，重新开始', 'primary-button')} &nbsp; ${button('dismiss', '保留书签')}`); break;
      case 'restart': dialog.close(); stopSound(); book.reset(); returnTrail.length=0; atlasPlace=null; previewRole = DATA.roles[0].id; mobileRoutePage = mobileRolePage = mobileGenealogyPage = mobileEndingPage = 0; save(); cover(); window.MobileReader?.clearPositions(); window.scrollTo(0, 0); announce('书签已清除。'); break;
    }
  }
  document.addEventListener('click', event => {
    const gameTarget = event.target.closest('button[data-game-action]');
    if (gameTarget && !gameTarget.disabled) { playGame(gameTarget.dataset.gameAction, gameTarget.dataset.gameValue); return; }
    const target = event.target.closest('button[data-action]');
    if (target && !target.disabled) act(target.dataset.action, target);
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.target.closest('.game-board') || dialog.open || busy || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      document.querySelector('.reading-header')?.classList.remove('mobile-tools-open');
      document.querySelector('[data-action="mobile-tools"]')?.setAttribute('aria-expanded', 'false');
    }
    if (innerWidth <= 760 && window.MobileReader && ['ArrowLeft', 'ArrowRight'].includes(event.key) && !['cover','intro'].includes(view)) {
      event.preventDefault(); window.MobileReader.move(event.key === 'ArrowRight' ? 1 : -1);
      return;
    }
    if (!['cover','intro'].includes(view) && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); moveSpread(event.key==='ArrowRight'?1:-1);
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); });
  window.addEventListener('pagehide', save);
  cover();
})();
