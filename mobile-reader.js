/* A single manuscript leaf on a small screen; the two live pages stay intact. */
window.MobileReader = (() => {
  'use strict';
  const media = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollPositions = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  let config, screen, book, nav, activePage, activeKey, activeIndex = -1;
  let cleanup = [], animations = [], ghost, pendingSnapshot, pendingScroll;
  let locked = false, releaseTimer, gesture, lastTouchTurn = -Infinity;
  const keyFor = (value, index = value.index) => `${value.key}:${index}`;
  const visiblePage = () => book?.querySelector('.page.mobile-leaf-active');
  const canTurn = () => media.matches && config && !locked && (!config.canNavigate || config.canNavigate());
  function saveScroll() {
    const body = activePage?.querySelector('.leaf-content');
    if (body && activeKey != null) scrollPositions.set(`${activeKey}:${activeIndex}`, body.scrollTop);
  }
  function snapshot(page) {
    if (!page || !media.matches || reduced.matches) return null;
    const copy = page.cloneNode(true);
    copy.classList.remove('page', 'mobile-leaf-active', 'mobile-leaf-hidden');
    copy.classList.add('mobile-page-ghost');
    copy.removeAttribute('hidden'); copy.removeAttribute('inert');
    copy.setAttribute('aria-hidden', 'true'); copy.inert = true;
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    copy.querySelectorAll('[autofocus]').forEach(node => node.removeAttribute('autofocus'));
    return { node: copy, scroll: page.querySelector('.leaf-content')?.scrollTop || 0 };
  }
  function stopAnimation() {
    animations.forEach(animation => animation.cancel()); animations = [];
    ghost?.remove(); ghost = null;
    clearTimeout(releaseTimer); locked = false;
    book?.classList.remove('mobile-turning');
  }
  function animate(page, direction, previous) {
    stopAnimation();
    if (!media.matches || reduced.matches || !page?.animate) return;
    locked = true;
    book.classList.add('mobile-turning');
    if (previous?.node) {
      ghost = previous.node; book.append(ghost);
      const body = ghost.querySelector('.leaf-content'); if (body) body.scrollTop = previous.scroll;
      animations.push(ghost.animate([
        { transform: 'translate3d(0,0,0)', opacity: 1 },
        { transform: `translate3d(${-direction * 15}%,0,0)`, opacity: .25 }
      ], { duration: 300, easing:'cubic-bezier(.22,.68,.15,1)', fill:'forwards' }));
    }
    animations.push(page.animate([
      { transform:`translate3d(${direction * (previous ? 82 : 10)}%,0,0)`, opacity: previous ? 1 : .65, boxShadow:`${-direction * 16}px 0 28px #50361d35` },
      { transform:'translate3d(0,0,0)', opacity:1, boxShadow:'0 0 0 #50361d00' }
    ], { duration:300, easing:'cubic-bezier(.22,.68,.15,1)', fill:'both' }));
    releaseTimer = setTimeout(() => {
      animations.forEach(animation => animation.cancel()); animations = [];
      ghost?.remove(); ghost = null; locked = false;
      book?.classList.remove('mobile-turning');
    }, 315);
  }
  function navigation() {
    if (!nav || !config) return;
    const last = config.index === config.steps.length - 1;
    const advance = last && config.onAdvance && config.advanceLabel;
    const retreat = config.index === 0 && config.onRetreat && config.retreatLabel;
    const focused = nav.contains(document.activeElement) ? { index:document.activeElement.dataset.mobileIndex, action:document.activeElement.dataset.mobileAction } : null;
    nav.dataset.mobilePage = String(config.index);
    nav.setAttribute('aria-label', '书页翻阅');
    nav.innerHTML = `<div class="mobile-page-tabs" role="group" aria-label="这一叠书页">${config.steps.map((step, index) => `<button type="button" data-mobile-index="${index}" aria-pressed="${index === config.index}"${index === config.index ? ' aria-current="page"' : ''}><i aria-hidden="true"></i><span>${escape(step.label)}</span></button>`).join('')}</div><div class="mobile-page-controls"><button type="button" class="mobile-page-previous${retreat ? ' mobile-page-retreat' : ''}" data-mobile-action="${retreat ? 'retreat' : 'previous'}" data-action="${retreat ? 'mobile-retreat' : 'mobile-previous'}" ${retreat ? config.retreatDisabled ? 'disabled' : '' : config.index === 0 ? 'disabled' : ''}><span aria-hidden="true">←</span> ${escape(retreat ? config.retreatLabel : '前一页')}</button><span class="mobile-page-position" aria-live="off">${config.index + 1}<i>/</i>${config.steps.length}</span><button type="button" class="mobile-page-next${advance ? ' mobile-page-advance' : ''}" data-mobile-action="${advance ? 'advance' : 'next'}" data-action="${advance ? 'mobile-advance' : 'mobile-next'}" ${advance ? config.advanceDisabled ? 'disabled' : '' : last ? 'disabled' : ''}>${escape(advance ? config.advanceLabel : '后一页')} <span aria-hidden="true">→</span></button></div>`;
    if (focused) {
      const restored = focused.index != null ? nav.querySelector(`[data-mobile-index="${focused.index}"]`) : nav.querySelector(`[data-mobile-action="${focused.action}"]`);
      (restored && !restored.disabled ? restored : nav.querySelector('[aria-current="page"]'))?.focus({preventScroll:true});
    }
  }
  function setVisibility() {
    if (!book || !config) return;
    const mobile = media.matches;
    screen.classList.toggle('mobile-reader-screen', mobile);
    document.documentElement.classList.toggle('mobile-reader-open', mobile);
    nav.hidden = !mobile;
    book.classList.toggle('mobile-paged-book', mobile);
    const side = config.steps[config.index]?.side || 'left';
    const nextPage = book.querySelector(`:scope > .${side}-page`);
    book.querySelectorAll(':scope > .page').forEach(page => {
      const shown = !mobile || page === nextPage;
      page.classList.toggle('mobile-leaf-active', mobile && shown);
      page.classList.toggle('mobile-leaf-hidden', mobile && !shown);
      page.inert = mobile && !shown;
      if (shown) page.removeAttribute('aria-hidden'); else page.setAttribute('aria-hidden','true');
    });
    activePage = nextPage; activeKey = config.key; activeIndex = config.index;
    if (!mobile) stopAnimation();
  }
  function sync(next) {
    if (!screen || !book) { mount(next); return; }
    const previousConfig = config;
    const changed = next.key !== activeKey || next.index !== activeIndex;
    if (changed && !pendingScroll) saveScroll();
    const previous = changed ? pendingSnapshot || snapshot(activePage) : null;
    const direction = next.key === activeKey ? next.index < activeIndex ? -1 : 1 : 1;
    config = next;
    setVisibility(); navigation();
    if (media.matches && changed) {
      const body = activePage?.querySelector('.leaf-content');
      if (body) body.scrollTop = next.resetScroll ? 0 : scrollPositions.get(keyFor(next)) || 0;
      animate(activePage, direction, previous);
      const focused = document.activeElement;
      if (focused?.closest('.mobile-leaf-hidden')) {
        activePage?.querySelector('.leaf-content')?.focus({ preventScroll:true });
      }
    } else if (next.resetScroll && media.matches) {
      const body = activePage?.querySelector('.leaf-content'); if (body) body.scrollTop = 0;
    }
    pendingSnapshot = null; pendingScroll = null;
    if (previousConfig && changed) screen.dispatchEvent(new CustomEvent('mobilepagechange', { detail:{ index:config.index, side:config.steps[config.index].side } }));
  }
  function request(index, advance = false, retreat = false) {
    if (!canTurn()) return;
    if (retreat) {
      if (!config.onRetreat || config.retreatDisabled) return;
      saveScroll(); config.onRetreat(); return;
    }
    if (advance) {
      if (!config.onAdvance || config.advanceDisabled) return;
      saveScroll(); config.onAdvance(); return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= config.steps.length || index === config.index) return;
    saveScroll();
    pendingScroll = true; pendingSnapshot = snapshot(activePage);
    config.onNavigate(index);
    // A refused route must not leave a detached visual snapshot behind.
    pendingSnapshot = null; pendingScroll = null;
  }
  function onNavClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    event.preventDefault(); event.stopPropagation();
    if (button.dataset.mobileIndex != null) request(Number(button.dataset.mobileIndex));
    else if (button.dataset.mobileAction === 'previous') request(config.index - 1);
    else if (button.dataset.mobileAction === 'next') request(config.index + 1);
    else if (button.dataset.mobileAction === 'advance') request(config.index, true);
    else if (button.dataset.mobileAction === 'retreat') request(config.index, false, true);
  }
  const ignored = 'button,a,input,textarea,select,summary,[contenteditable="true"],[draggable="true"],.game-board,.game-panel,.mobile-reader-nav';
  function touchStart(event) {
    gesture = null;
    if (!canTurn() || event.touches.length !== 1 || event.target.closest(ignored)) return;
    const point = event.touches[0];
    // Leave the browser's edge-back gesture untouched.
    if (point.clientX < 20 || point.clientX > innerWidth - 20) return;
    gesture = { x:point.clientX, y:point.clientY, at:performance.now(), axis:null, dx:0, dy:0 };
  }
  function touchMove(event) {
    if (!gesture || event.touches.length !== 1) { gesture = null; return; }
    const point = event.touches[0];
    gesture.dx = point.clientX - gesture.x; gesture.dy = point.clientY - gesture.y;
    if (!gesture.axis && Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) > 12) {
      gesture.axis = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6 ? 'x' : 'y';
    }
    if (gesture.axis === 'x' && event.cancelable) event.preventDefault();
  }
  function touchEnd(event) {
    if (!gesture) return;
    const movement = gesture; gesture = null;
    const point = event.changedTouches?.[0];
    if (point) { movement.dx = point.clientX - movement.x; movement.dy = point.clientY - movement.y; }
    if (movement.axis === 'y' || performance.now() - movement.at > 950 || Math.abs(movement.dx) < 54 || Math.abs(movement.dx) <= Math.abs(movement.dy) * 1.7) return;
    if (!canTurn()) return;
    const next = config.index + (movement.dx < 0 ? 1 : -1);
    if (next < 0 || next >= config.steps.length) return;
    if (event.cancelable) event.preventDefault();
    lastTouchTurn = performance.now(); request(next);
  }
  function cancelTouch() { gesture = null; }
  function suppressClick(event) {
    if (performance.now() - lastTouchTurn < 400) { event.preventDefault(); event.stopPropagation(); }
  }
  function resize() {
    if (!config) return;
    saveScroll(); setVisibility(); navigation();
    if (media.matches) {
      const body = activePage?.querySelector('.leaf-content');
      if (body) body.scrollTop = scrollPositions.get(keyFor(config)) || 0;
      window.scrollTo(0,0);
    }
  }
  function mount(next) {
    release();
    screen = document.querySelector('.reading-screen'); book = screen?.querySelector('.open-book');
    if (!screen || !book || !next?.steps?.length) return;
    config = next;
    nav = document.createElement('nav'); nav.className = 'mobile-reader-nav';
    screen.append(nav);
    setVisibility(); navigation();
    if (media.matches) {
      const body = activePage?.querySelector('.leaf-content');
      if (body) body.scrollTop = next.resetScroll ? 0 : scrollPositions.get(keyFor(next)) || 0;
      window.scrollTo(0,0);
    }
    const scroll = event => {
      if (!media.matches || event.target !== activePage?.querySelector('.leaf-content')) return;
      saveScroll();
    };
    nav.addEventListener('click',onNavClick);
    book.addEventListener('touchstart',touchStart,{passive:true});
    book.addEventListener('touchmove',touchMove,{passive:false});
    book.addEventListener('touchend',touchEnd,{passive:false});
    book.addEventListener('touchcancel',cancelTouch,{passive:true});
    book.addEventListener('click',suppressClick,true);
    book.addEventListener('scroll',scroll,true);
    window.addEventListener('resize',resize,{passive:true});
    cleanup = [
      () => nav?.removeEventListener('click',onNavClick),
      () => book?.removeEventListener('touchstart',touchStart),
      () => book?.removeEventListener('touchmove',touchMove),
      () => book?.removeEventListener('touchend',touchEnd),
      () => book?.removeEventListener('touchcancel',cancelTouch),
      () => book?.removeEventListener('click',suppressClick,true),
      () => book?.removeEventListener('scroll',scroll,true),
      () => window.removeEventListener('resize',resize)
    ];
  }
  function release() {
    saveScroll(); stopAnimation(); cleanup.forEach(fn => fn()); cleanup = [];
    if (book) book.querySelectorAll(':scope > .page').forEach(page => {
      page.classList.remove('mobile-leaf-active','mobile-leaf-hidden'); page.inert = false; page.removeAttribute('aria-hidden');
    });
    screen?.classList.remove('mobile-reader-screen'); book?.classList.remove('mobile-paged-book');
    document.documentElement.classList.remove('mobile-reader-open');
    nav?.remove();
    config = null; screen = null; book = null; nav = null; activePage = null; activeKey = null; activeIndex = -1;
    pendingSnapshot = null; pendingScroll = null; gesture = null;
  }
  function show(side, options = {}) {
    if (!config) return;
    const index = config.steps.findIndex(step => step.side === side);
    if (index < 0) return;
    sync({ ...config, index, resetScroll:options.resetScroll });
  }
  function remember() {
    if (!config || pendingScroll) return;
    saveScroll(); pendingScroll = true;
    if (!pendingSnapshot) pendingSnapshot = snapshot(activePage);
  }
  function enter(direction = 1) {
    if (media.matches && activePage) animate(activePage, direction < 0 ? -1 : 1, null);
  }
  function clearPositions() {
    scrollPositions.clear();
    const body = activePage?.querySelector('.leaf-content'); if (body) body.scrollTop = 0;
  }
  return { mount, sync, release, show, remember, enter, clearPositions, isMobile:() => media.matches, isTurning:() => locked };
})();
