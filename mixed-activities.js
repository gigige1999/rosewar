/* Small, untimed manuscript activities. SVG is used only for playable objects. */
(function (root) {
  'use strict';
  const legacy = root.RoleGames;
  root.HeraldicGames = legacy;
  const LEGACY = { route: 'margaret', scales: 'warwick', sun: 'edward', candle: 'beaufort', knight: 'richard', weave: 'elizabeth' };
  const DEFAULTS = {
    supplies: { title: '有限的行囊', instruction: '选两件以上的物资，总重不超过六格。带什么上路，由你决定。', hint: '干粮照顾脚步，药草照顾伤者；银器也可能换来沿途的屋檐。' },
    memory: { title: '封印的顺序', instruction: '看封印亮起，再把记忆接下去。可以重看或展开小抄，已记住的不会丢失。', hint: '记的是先后顺序，同一个封印也可能出现两次。' },
    connect: { title: '断路重连', instruction: '点击路片使它顺时针转动，把左侧入口与右侧出口连成一条不断裂的道路。', hint: '沿入口逐格检查；相邻两块的路口必须相接。' },
    fragments: { title: '残页归位', instruction: '点选两块纸片互换，让断开的圆印、枝叶与文字重新接合。', hint: '先找到圆印的上半边，再对齐下方的纹路。' },
    archery: { title: '风中的一箭', instruction: '调整方向与力度，看圆点随风移动；落进暗红内环时松弦。', hint: '无需正中靶心，无需抢时间。' },
    pairs: { title: '记住每一枚徽记', instruction: '翻开旧物，找到彼此。两张不相同的牌会在你翻下一枚时自行合上。', hint: '记住纹章的位置；配好的牌会一直朝上。' },
    choice: { title: '页边的抉择', instruction: '听见几种心声，再决定怎样落笔。每一条路都有自己的代价。', hint: '在他所知有限的此刻，你最想保全什么？' }
  };
  const GLYPHS = ['crown', 'rose', 'key', 'sun'];
  const NAMES = ['王冠', '玫瑰', '钥匙', '太阳'];
  const ROLES = ['margaret', 'warwick', 'edward', 'beaufort', 'richard', 'elizabeth'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const int = Number.isInteger;
  const obj = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const mod = (a, b) => (a % b + b) % b;
  const idx = value => typeof value === 'string' && /^-?\d+$/.test(value) ? Number(value) : value;
  const chapter = n => int(n) && n >= 0 && n < 7 ? n : 0;
  const icon = name => root.Ornaments ? root.Ornaments.icon(name) : '<span aria-hidden="true">✦</span>';
  const button = (action, value, content, attrs = '') => '<button type="button" data-game-action="' + action + '" data-game-value="' + esc(value) + '" ' + attrs + '>' + content + '</button>';
  const svg = (body, viewBox = '0 0 320 210', extra = '') => '<svg viewBox="' + viewBox + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' + extra + '>' + body + '</svg>';
  function config(role, n) {
    const data = root.ACTIVITY_DATA || {}, entry = data.activities && data.activities[role] && data.activities[role][chapter(n)];
    if (!entry || !obj(entry)) return null;
    return { ...entry, id: entry.id || role + '-' + chapter(n), kind: entry.kind || entry.type, type: entry.kind === 'choice' || entry.type === 'choice' ? 'choice' : 'game' };
  }
  function meta(role, n) {
    if (n === undefined) {
      const info = root.ACTIVITY_DATA && root.ACTIVITY_DATA.roles && root.ACTIVITY_DATA.roles[role];
      return info ? { title: '三种小游戏 · 四次情境抉择', instruction: '', hint: '', ...info } : legacy.meta(role);
    }
    const item = config(role, n);
    if (!item) return null;
    const fallback = LEGACY[item.kind] ? legacy.meta(LEGACY[item.kind]) : DEFAULTS[item.kind] || {};
    return { ...fallback, ...item, instruction: item.instruction || fallback.instruction || '', hint: item.hint || fallback.hint || '', stakes: item.stakes || item.description || '' };
  }
  function sequence(n) { return [[0, 2, 1], [3, 0, 2], [1, 3, 0, 2], [2, 1, 2, 3], [3, 1, 0], [0, 3, 2, 0], [1, 2, 0, 3]][chapter(n)]; }
  function pairDeck(n) { return [[0, 1, 2, 1, 0, 2], [2, 0, 1, 2, 1, 0], [1, 2, 0, 0, 1, 2], [0, 2, 1, 2, 0, 1], [2, 1, 0, 1, 2, 0], [1, 0, 2, 0, 2, 1], [0, 1, 2, 2, 1, 0]][chapter(n)]; }
  const BASE_PORTS = [[1, 2], [2, 3], [0, 1], [0, 3], [0, 2], [1, 2], [0, 2], [0, 1], [0, 3]];
  const ITEMS = [
    { id: 'grain', name: '粮袋', weight: 3, food: 3, water: 0, medicine: 0, icon: 'grain', note: '粮食 3' },
    { id: 'water', name: '水罐', weight: 2, food: 0, water: 2, medicine: 0, icon: 'water', note: '饮水 2' },
    { id: 'herbs', name: '草药', weight: 1, food: 0, water: 0, medicine: 2, icon: 'herbs', note: '药品 2' },
    { id: 'silver', name: '银器', weight: 4, food: 0, water: 0, medicine: 0, icon: 'silver', note: '可换宿处与人情' },
    { id: 'bread', name: '干粮', weight: 2, food: 2, water: 0, medicine: 0, icon: 'bread', note: '粮食 2' }
  ];
  function supplies(n) { const shift = chapter(n) % 5; return ITEMS.map((_, i) => ITEMS[(i + shift) % 5]); }
  function totalSupply(n, chosen) { return supplies(n).reduce((total, item, i) => { if (chosen.includes(i)) for (const key of ['weight', 'food', 'water', 'medicine']) total[key] += item[key]; return total; }, { weight: 0, food: 0, water: 0, medicine: 0 }); }
  function supplyReady(n, chosen) { const total = totalSupply(n, chosen); return chosen.length >= 2 && total.weight <= 6; }
  function supplyStory(n, chosen) {
    const ids = chosen.map(i => supplies(n)[i].id), total = totalSupply(n, chosen);
    if (ids.includes('silver')) return '你把一部分希望交给沿途的人。银器或能换来一夜屋檐；能否遇到可信的人，仍是这趟路的悬念。';
    if (total.food && total.water && total.medicine) return '你为饥饿、口渴与伤病各留了一点余地。行囊沉了，照顾同行者的心却安稳了一些。';
    if (total.medicine) return '你给伤者留出位置。少带的补给，要靠沿路的井水、村舍与彼此的照料弥补。';
    return '你先顾眼前的饥渴。轻一些的行囊让脚步更快，也把伤病的风险留给了前路。';
  }
  function arrowConfig(n) { return { wind: [-1, 1, 2, -2, 1, -1, 2][chapter(n)], distance: [2, 3, 4, 2, 4, 3, 2][chapter(n)] }; }
  function arrowLanding(n, aim, power) { const goal = arrowConfig(n); return { x: 75 + (aim + goal.wind) * 10, y: 45 + (goal.distance - power) * 11 }; }
  function arrowHit(n, aim, power) { const at = arrowLanding(n, aim, power); return Math.hypot((at.x - 75) * 3.2, (at.y - 45) * 2.1) <= 33; }
  function initialPayload(item, n) {
    if (LEGACY[item.kind]) return legacy.initial(LEGACY[item.kind], n);
    if (item.kind === 'choice') return { selected: null, committed: false, decisionVersion: 1 };
    if (item.kind === 'supplies') return { chosen: [], sealed: false, tried: false };
    if (item.kind === 'memory') return { phase: 'idle', entered: [], mistakes: 0, mnemonic: false };
    if (item.kind === 'connect') return { turns: [1, 2, 1, 3, 1, 2, 0, 1, 3].map((v, i) => mod(v + (i % 2 ? chapter(n) : 0), 4)) };
    if (item.kind === 'fragments') return { order: [[2, 0, 3, 1], [1, 3, 0, 2], [3, 2, 0, 1]][chapter(n) % 3].slice(), selected: null };
    if (item.kind === 'archery') return { aim: 0, power: 1, shots: [] };
    if (item.kind === 'pairs') return { pairs: [], open: [] };
    return {};
  }
  function initial(role, n) { const item = config(role, n); return item ? { activityId: item.id, payload: initialPayload(item, n) } : { activityId: '', payload: {} }; }
  function sanitize(role, n, saved) {
    const item = config(role, n), fresh = initial(role, n);
    if (!item || !obj(saved) || saved.activityId !== item.id || !obj(saved.payload)) return fresh;
    const raw = saved.payload, clean = fresh.payload;
    if (LEGACY[item.kind]) fresh.payload = legacy.sanitize(LEGACY[item.kind], n, raw);
    else if (item.kind === 'choice') {
      if (raw.decisionVersion === 1) {
        if ((item.options || []).some(option => option.id === raw.selected)) clean.selected = raw.selected;
        clean.committed = raw.committed === true && clean.selected !== null;
      }
      const earlier = raw.decisionVersion === 1 ? raw.legacySelected : raw.selected;
      if (typeof earlier === 'string' && earlier.length < 100) clean.legacySelected = earlier;
    }
    else if (item.kind === 'supplies') {
      if (Array.isArray(raw.chosen)) clean.chosen = [...new Set(raw.chosen.filter(i => int(i) && i >= 0 && i < 5))].sort((a, b) => a - b);
      clean.tried = raw.tried === true; clean.sealed = raw.sealed === true && supplyReady(n, clean.chosen);
    } else if (item.kind === 'memory') {
      if (['idle', 'show', 'repeat'].includes(raw.phase)) clean.phase = raw.phase;
      if (Array.isArray(raw.entered) && raw.entered.length <= sequence(n).length && raw.entered.every((value, i) => value === sequence(n)[i])) clean.entered = raw.entered.slice();
      if (clean.phase === 'idle') clean.entered = [];
      clean.mistakes = int(raw.mistakes) && raw.mistakes >= 0 && raw.mistakes <= 999 ? raw.mistakes : 0;
      clean.mnemonic = raw.mnemonic === true;
    } else if (item.kind === 'connect') {
      if (Array.isArray(raw.turns) && raw.turns.length === 9 && raw.turns.every(v => int(v) && v >= 0 && v < 4)) clean.turns = raw.turns.slice();
    } else if (item.kind === 'fragments') {
      if (Array.isArray(raw.order) && raw.order.length === 4 && new Set(raw.order).size === 4 && raw.order.every(v => int(v) && v >= 0 && v < 4)) clean.order = raw.order.slice();
      clean.selected = int(raw.selected) && raw.selected >= 0 && raw.selected < 4 ? raw.selected : null;
    } else if (item.kind === 'archery') {
      clean.aim = int(raw.aim) && raw.aim >= -2 && raw.aim <= 2 ? raw.aim : 0;
      clean.power = int(raw.power) && raw.power >= 1 && raw.power <= 5 ? raw.power : 1;
      if (Array.isArray(raw.shots)) clean.shots = raw.shots.slice(-20).filter(shot => obj(shot) && int(shot.aim) && shot.aim >= -2 && shot.aim <= 2 && int(shot.power) && shot.power >= 1 && shot.power <= 5).map(shot => ({ aim: shot.aim, power: shot.power }));
    } else if (item.kind === 'pairs') {
      const cards = pairDeck(n), matched = new Set();
      if (Array.isArray(raw.pairs)) for (const pair of raw.pairs.slice(0, 3)) {
        if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(i => int(i) && i >= 0 && i < 6) || pair[0] === pair[1] || pair.some(i => matched.has(i)) || cards[pair[0]] !== cards[pair[1]]) continue;
        clean.pairs.push(pair.slice()); pair.forEach(i => matched.add(i));
      }
      if (Array.isArray(raw.open)) clean.open = [...new Set(raw.open.filter(i => int(i) && i >= 0 && i < 6 && !matched.has(i)))].slice(0, 2);
      if (clean.open.length === 2 && cards[clean.open[0]] === cards[clean.open[1]]) { clean.pairs.push(clean.open.slice()); clean.open = []; }
    }
    return fresh;
  }
  function roadTrace(turns) {
    const ports = BASE_PORTS.map((values, i) => values.map(p => mod(p + turns[i], 4)));
    if (!ports[3].includes(3)) return { cells: [], complete: false };
    let current = 3, incoming = 3;
    const seen = new Set();
    while (!seen.has(current)) {
      if (!ports[current].includes(incoming)) return { cells: [...seen], complete: false };
      seen.add(current);
      const out = ports[current].find(p => p !== incoming);
      if (current === 5 && out === 1) return { cells: [...seen], complete: true };
      const x = current % 3, y = Math.floor(current / 3);
      const nx = x + [0, 1, 0, -1][out], ny = y + [-1, 0, 1, 0][out];
      if (nx < 0 || nx > 2 || ny < 0 || ny > 2) return { cells: [...seen], complete: false };
      current = ny * 3 + nx; incoming = mod(out + 2, 4);
    }
    return { cells: [...seen], complete: false };
  }
  function connected(turns) { return roadTrace(turns).complete; }
  function isSolved(role, n, saved) {
    const item = config(role, n); if (!item) return false;
    const state = sanitize(role, n, saved).payload;
    if (LEGACY[item.kind]) return legacy.isSolved(LEGACY[item.kind], n, state);
    if (item.kind === 'choice') return state.committed && (item.options || []).some(option => option.id === state.selected);
    if (item.kind === 'supplies') return state.sealed && supplyReady(n, state.chosen);
    if (item.kind === 'memory') return state.phase === 'repeat' && state.entered.length === sequence(n).length && state.entered.every((value, i) => value === sequence(n)[i]);
    if (item.kind === 'connect') return connected(state.turns);
    if (item.kind === 'fragments') return state.order.every((value, i) => value === i);
    if (item.kind === 'archery') return state.shots.some(shot => arrowHit(n, shot.aim, shot.power));
    if (item.kind === 'pairs') return state.pairs.length === 3 && new Set(state.pairs.flat()).size === 6;
    return false;
  }
  function reduce(role, n, saved, action, value) {
    const item = config(role, n), state = sanitize(role, n, saved), before = JSON.stringify(state), p = state.payload;
    let message = '';
    const result = () => ({ state, changed: JSON.stringify(state) !== before, message });
    if (!item) return result();
    if (isSolved(role, n, state)) { message = '这一页已经读懂，可以继续翻阅。'; return result(); }
    if (action === 'reset') return { state: initial(role, n), changed: JSON.stringify(initial(role, n)) !== before, message: '纸上的物件已重新摆好。' };
    if (LEGACY[item.kind]) {
      const next = legacy.reduce(LEGACY[item.kind], n, p, action, value); state.payload = next.state; message = next.message; return result();
    }
    if (item.kind === 'choice') {
      if (action === 'choose-option') {
        const option = (item.options || []).find(option => option.id === value);
        if (option) { p.selected = option.id; message = option.motive || '把这一念握在手里；落笔前仍可以改变心意。'; }
      }
      if (action === 'decision-confirm' && (item.options || []).some(option => option.id === p.selected)) {
        p.committed = true;
        message = '你已在这页留下自己的选择。它的回声，将随你翻往下一页。';
      }
    } else if (item.kind === 'supplies') {
      if (action === 'supply-toggle') { const i = idx(value); if (int(i) && i >= 0 && i < 5) { p.chosen = p.chosen.includes(i) ? p.chosen.filter(v => v !== i) : [...p.chosen, i].sort((a, b) => a - b); p.tried = false; } }
      if (action === 'supply-seal') { p.tried = true; p.sealed = supplyReady(n, p.chosen); message = p.sealed ? supplyStory(n, p.chosen) : totalSupply(n, p.chosen).weight > 6 ? '行囊超重了，取舍才能让队伍上路。' : '至少带上两件物资，让这趟路有所依凭。'; }
    } else if (item.kind === 'memory') {
      if (action === 'memory-watch') p.phase = 'show';
      if (action === 'memory-ready' && p.phase === 'show') p.phase = 'repeat';
      if (action === 'memory-mnemonic') { p.mnemonic = !p.mnemonic; if (p.mnemonic && p.phase === 'idle') p.phase = 'repeat'; }
      if (action === 'memory-press' && p.phase === 'repeat') {
        const i = idx(value); if (int(i) && i >= 0 && i < 4) {
          if (i === sequence(n)[p.entered.length]) { p.entered.push(i); message = p.entered.length === sequence(n).length ? '封印串起一段记忆，消息终于可以送出。' : '又一枚记忆归位。'; }
          else { p.mistakes = Math.min(999, p.mistakes + 1); message = '停一息，已经记住的仍在。接着下一枚，也可以展开小抄。'; }
        }
      }
    } else if (item.kind === 'connect' && action === 'road-turn') {
      const i = idx(value); if (int(i) && i >= 0 && i < 9) { p.turns[i] = mod(p.turns[i] + 1, 4); if (connected(p.turns)) message = '道路接通。纸上的两端，终于能够相遇。'; }
    } else if (item.kind === 'fragments' && action === 'fragment-select') {
      const i = idx(value); if (int(i) && i >= 0 && i < 4) {
        if (p.selected === i) p.selected = null;
        else if (p.selected === null) p.selected = i;
        else { [p.order[p.selected], p.order[i]] = [p.order[i], p.order[p.selected]]; p.selected = null; if (p.order.every((v, at) => v === at)) message = '圆印重新闭合，残页恢复了原来的秩序。'; }
      }
    } else if (item.kind === 'archery') {
      if (action === 'aim-step' && [-1, 1].includes(idx(value))) p.aim = Math.max(-2, Math.min(2, p.aim + idx(value)));
      if (action === 'power-step' && [-1, 1].includes(idx(value))) p.power = Math.max(1, Math.min(5, p.power + idx(value)));
      if (action === 'shoot') {
        p.shots.push({ aim: p.aim, power: p.power }); p.shots = p.shots.slice(-20);
        const at = arrowLanding(n, p.aim, p.power);
        message = arrowHit(n, p.aim, p.power) ? '箭落在内环。无须分毫不差，你已经读懂了这阵风。' : '落点' + (at.x < 75 ? '偏左' : at.x > 75 ? '偏右' : '横向已准') + '，' + (at.y > 45 ? '偏低，试着加力。' : at.y < 45 ? '偏高，试着减力。' : '高度已准。');
      }
    } else if (item.kind === 'pairs') {
      if (action === 'pair-close' && p.open.length === 2) p.open = [];
      if (action === 'pair-flip') {
        const i = idx(value), matched = p.pairs.flat();
        if (int(i) && i >= 0 && i < 6 && !matched.includes(i) && !p.open.includes(i)) {
          if (p.open.length >= 2) p.open = [];
          p.open.push(i); if (p.open.length === 2) { if (pairDeck(n)[p.open[0]] === pairDeck(n)[p.open[1]]) { p.pairs.push(p.open.slice()); p.open = []; message = '这一对旧物，又在记忆中相遇。'; } else message = '让它们暂留片刻；翻下一枚时，这两张会自行合上。'; }
        }
      }
    }
    return result();
  }
  function itemArt(name) {
    const shapes = {
      grain: '<path d="M11 17Q6 32 12 41H36Q42 30 36 17L30 14H18Z" fill="var(--ma-gold)" fill-opacity=".2"/><path d="M17 9L20 16H29L32 9ZM15 18H33M24 25V37M24 29L19 25M24 33L29 28"/>',
      water: '<path d="M20 6H29V12L34 17V38Q25 45 15 38V18L20 12ZM18 24Q25 19 32 24M15 31Q25 35 34 31M20 9H29" fill="var(--ma-gold)" fill-opacity=".15"/>',
      herbs: '<path d="M24 42V10M24 18Q7 20 9 8Q22 7 24 18ZM24 29Q38 29 40 17Q26 15 24 29ZM24 36Q9 38 8 26Q21 23 24 36Z" fill="var(--ma-gold)" fill-opacity=".2"/><path d="M17 40L30 40"/>',
      silver: '<path d="M10 10H37Q36 28 26 30V37H34V41H14V37H22V30Q12 29 10 10ZM12 15H35M17 20L23 25L30 19" fill="var(--ma-gold)" fill-opacity=".2"/>',
      bread: '<path d="M6 32C7 10 35 7 42 27Q44 34 36 39H12Q6 38 6 32Z" fill="var(--ma-gold)" fill-opacity=".2"/><path d="M15 19L19 29M23 15L27 25M31 16L35 26M7 33H42"/>'
    };
    return svg(shapes[name], '0 0 48 48');
  }
  function renderChoice(item, p, solved) {
    const selected = (item.options || []).find(option => option.id === p.selected);
    const historicalOption = (item.options || []).find(option => option.id === (item.historicalChoice || item.answer));
    const historical = selected && selected.id === (item.historicalChoice || item.answer);
    const options = '<div class="ma-options" role="group" aria-label="决定这一次如何行动">' + (item.options || []).map((option, i) => button('choose-option', option.id, '<span class="ma-option-letter">' + ['I', 'II', 'III', 'IV'][i] + '</span><span>' + esc(option.text) + '</span>', 'class="ma-option ' + (p.selected === option.id ? 'ma-selected' : '') + '" aria-pressed="' + (p.selected === option.id) + '" ' + (solved ? 'disabled' : ''))).join('') + '</div>';
    const thought = selected && !solved ? '<aside class="ma-inner-voice" role="status"><span>这一念 · 文学想象</span><p>' + esc(selected.motive || '') + '</p></aside><div class="ma-controls">' + button('decision-confirm', '', icon('feather') + '以此落笔', 'class="ma-primary ma-commit"') + '</div><p class="ma-inline-note">落笔前，可以听听另一种心声。</p>' : '';
    const outcome = selected && solved ? '<div class="ma-decision-outcome" role="status"><span class="ma-outcome-label">' + (historical ? '历史中的选择' : '一种可能 · 架空推演') + '</span><h4>' + esc(selected.text) + '</h4><p>' + esc(selected.consequence || selected.feedback || '') + '</p>' + (selected.echo ? '<p class="ma-decision-echo"><span>这一步的回声</span>' + esc(selected.echo) + '</p>' : '') + '</div><details class="ma-history-note"><summary>历史中的那一笔：' + esc(historicalOption?.text || '') + '</summary><p>' + esc(item.historicalNote || '') + '</p><span>行动取自史事；心理与未发生的道路为文学推演。</span></details>' : '';
    const otherRoads = solved ? '<details class="ma-history-note ma-other-roads"><summary>如果当时，走向另一条路</summary>' + (item.options || []).filter(option => option.id !== p.selected).map(option => '<article><h4>' + esc(option.text) + '</h4><span>' + (option.id === (item.historicalChoice || item.answer) ? '历史中的选择' : '一种可能 · 架空推演') + '</span><p>' + esc(option.consequence || option.feedback) + '</p></article>').join('') + '</details>' : '';
    return '<div class="ma-choice">' + (!solved ? '<p class="ma-choice-prompt">' + esc(item.prompt || item.description) + '</p>' : '') + (p.legacySelected && !selected ? '<p class="ma-legacy-note">旧版阅读记录已保留。重回这个瞬间，留下你自己的决定。</p>' : '') + (solved ? '' : options) + thought + outcome + otherRoads + '</div>';
  }
  function renderSupplies(n, p, solved) {
    const total = totalSupply(n, p.chosen);
    return '<div class="ma-supply-totals"><span class="' + (total.weight > 6 ? 'ma-over' : '') + '">行囊 <b>' + total.weight + ' / 6</b></span><span>已选 <b>' + p.chosen.length + ' 件</b></span></div><div class="ma-pack-weight" aria-hidden="true">' + Array.from({length:6}, (_,i) => '<i class="' + (i < total.weight ? 'ma-packed' : '') + '"></i>').join('') + '</div><div class="ma-supplies">' + supplies(n).map((item, i) => button('supply-toggle', i, itemArt(item.icon) + '<span>' + item.name + '</span><small>重 ' + item.weight + ' · ' + item.note + '</small><em>' + (p.chosen.includes(i) ? '已装入' : '装入行囊') + '</em>', 'class="ma-supply ' + (p.chosen.includes(i) ? 'ma-selected' : '') + '" aria-pressed="' + p.chosen.includes(i) + '" ' + (solved ? 'disabled' : ''))).join('') + '</div><p class="ma-inline-note">至少带两件，总重不超过六格。你最想照顾什么？</p><div class="ma-controls">' + button('supply-seal', '', icon('seal') + (solved ? '行囊已封好' : '带着这些上路'), 'class="ma-primary" ' + (solved ? 'disabled' : '')) + '</div>' + (solved ? '<p class="ma-cargo-story">' + esc(supplyStory(n, p.chosen)) + '</p>' : p.tried ? '<p class="ma-inline-note">' + (total.weight > 6 ? '已超出载重，请取出多余物资。' : '再添一件，让这趟路多一份依凭。') + '</p>' : '');
  }
  function renderMemory(n, p, solved) {
    return '<div class="ma-memory"' + (p.phase === 'show' ? ' data-ma-watch="' + sequence(n).join(',') + '"' : '') + '><p class="ma-memory-status" aria-live="polite">' + (solved ? '暗号已完整记住' : p.phase === 'show' ? '请看，封印将依次亮起…' : p.phase === 'repeat' ? '接着记忆中的下一枚，慢慢来' : '给自己片刻，记住这串暗号') + '</p><div class="ma-memory-seals">' + GLYPHS.map((glyph, i) => button('memory-press', i, icon(glyph) + '<span>' + NAMES[i] + '</span>', 'class="ma-memory-seal" data-ma-seal="' + i + '" aria-label="' + NAMES[i] + '封印" ' + (p.phase !== 'repeat' || solved ? 'disabled' : ''))).join('') + '</div><div class="ma-memory-progress" aria-label="已记住' + p.entered.length + '枚，共' + sequence(n).length + '枚">' + sequence(n).map((value, i) => '<span class="' + (i < p.entered.length ? 'ma-memory-entered' : p.mnemonic ? 'ma-mnemonic' : '') + '"' + (p.mnemonic ? ' aria-label="第' + (i + 1) + '枚 ' + NAMES[value] + '"' : '') + '>' + (i < p.entered.length ? icon(GLYPHS[p.entered[i]]) : p.mnemonic ? icon(GLYPHS[value]) : '·') + '</span>').join('') + '</div><div class="ma-controls">' + button('memory-watch', '', p.phase === 'idle' ? '聆听封印的暗语' : '再看一次', 'class="ma-primary" ' + (p.phase === 'show' || solved ? 'disabled' : '')) + (!solved && p.phase !== 'show' ? button('memory-mnemonic', '', p.mnemonic ? '收起小抄' : '展开小抄', 'class="ma-secondary" aria-pressed="' + p.mnemonic + '"') : '') + '</div><p class="ma-inline-note">不计时 · 已记住的片段不会丢失</p></div>';
  }
  function renderRoad(p, solved) {
    const reached = roadTrace(p.turns).cells;
    return '<div class="ma-road-wrap"><span class="ma-road-entrance">入</span><div class="ma-roads" role="group" aria-label="旋转道路连接入口与出口">' + p.turns.map((turn, i) => {
      const ports = BASE_PORTS[i].map(port => mod(port + turn, 4));
      const body = '<path d="M' + [ports[0], ports[1]].map(port => [[40, 0], [80, 40], [40, 80], [0, 40]][port].join(' ')).join('L40 40L') + '" stroke-width="13" stroke="var(--ma-gold)"/><path d="M' + [ports[0], ports[1]].map(port => [[40, 0], [80, 40], [40, 80], [0, 40]][port].join(' ')).join('L40 40L') + '" stroke-width="1.4" stroke-dasharray="3 4"/><circle cx="40" cy="40" r="3" fill="var(--ma-red)"/>';
      return button('road-turn', i, svg(body, '0 0 80 80'), 'class="ma-road-tile ' + (reached.includes(i) ? 'ma-road-reached' : '') + '" data-ma-rotation="' + turn + '" aria-label="第' + (Math.floor(i / 3) + 1) + '行第' + (i % 3 + 1) + '列，路口朝' + ports.map(port => ['上', '右', '下', '左'][port]).join('与') + (reached.includes(i) ? '，已与入口相接' : '') + '，点击顺时针转动" ' + (solved ? 'disabled' : ''));
    }).join('') + '</div><span class="ma-road-exit">出</span></div><p class="ma-inline-note">沿着亮起的路往前；转一片，看看消息走到了哪里。</p>';
  }
  function fragmentArt(piece) {
    const body = '<circle cx="100" cy="100" r="64" stroke-width="4"/><circle cx="100" cy="100" r="53" stroke-width="1.5" stroke-dasharray="1 5"/><path d="M77 79L87 94L100 70L113 94L123 79L117 115H83ZM82 121H118M90 129H110" fill="var(--ma-red)" fill-opacity=".16"/><path d="M21 24Q47 21 49 47M151 47Q153 21 179 24M21 176Q47 179 49 153M151 153Q153 179 179 176M18 18H46M18 18V46M182 18H154M182 18V46M18 182H46M18 182V154M182 182H154M182 182V154"/><path d="M100 6V21M95 12H105M80 174H120M92 181H108"/><text x="100" y="155" text-anchor="middle" fill="currentColor" stroke="none" font-size="11" letter-spacing="2">MEMORIA</text>';
    return svg(body, (piece % 2 * 100) + ' ' + (Math.floor(piece / 2) * 100) + ' 100 100');
  }
  function renderFragments(p, solved) {
    return '<div class="ma-fragments" role="group" aria-label="交换四块残页还原圆形印记">' + p.order.map((piece, i) => button('fragment-select', i, fragmentArt(piece), 'class="ma-fragment ' + (p.selected === i ? 'ma-selected' : '') + '" data-ma-piece="' + piece + '" aria-label="位置' + (i + 1) + '，' + ['左上角残片，十字左侧与圆印上缘', '右上角残片，十字右侧与圆印上缘', '左下角残片，铭文前半与圆印下缘', '右下角残片，铭文后半与圆印下缘'][piece] + '" aria-pressed="' + (p.selected === i) + '" ' + (solved ? 'disabled' : ''))).join('') + '</div><p class="ma-inline-note">' + (solved ? '散落的记忆，又成了一页。' : p.selected === null ? '点一块，再点另一块：互换位置' : '已拿起残片，请点要交换的位置') + '</p>' + (!solved ? '<details class="ma-fragment-reference"><summary>借看完整的印记</summary><div aria-label="完整印记的参考图">' + [0,1,2,3].map(fragmentArt).join('') + '</div></details>' : '');
  }
  function renderArchery(n, p, solved) {
    const goal = arrowConfig(n), last = p.shots.at(-1), landing = last ? arrowLanding(n, last.aim, last.power) : null, aim = arrowLanding(n, p.aim, p.power);
    const body = '<path d="M23 51Q69 92 23 153M23 51V153M13 171H305"/><path d="M39 89L51 101L39 113M35 101H71"/><circle cx="240" cy="94.5" r="41" fill="var(--ma-gold)" fill-opacity=".13"/><circle cx="240" cy="94.5" r="33" fill="var(--ma-red)" fill-opacity=".12"/><circle cx="240" cy="94.5" r="12" fill="var(--ma-red)" fill-opacity=".3"/><path d="M240 46V143M192 94.5H288" stroke-dasharray="2 5"/>' + (!solved ? '<path d="M40 101Q140 -2 ' + aim.x * 3.2 + ' ' + aim.y * 2.1 + '" stroke="var(--ma-gold)" stroke-dasharray="2 6"/><circle class="ma-aim-marker" cx="' + aim.x * 3.2 + '" cy="' + aim.y * 2.1 + '" r="7" stroke="var(--ma-red)" stroke-width="2"/>' : '') + (landing ? '<path d="M' + (landing.x * 3.2 - 6) + ' ' + (landing.y * 2.1 - 6) + 'l12 12m-12 0l12 -12" stroke="var(--ma-red)" stroke-width="3"/>' : '');
    return '<div class="ma-archery" data-ma-wind="' + goal.wind + '" data-ma-distance="' + goal.distance + '"><div class="ma-wind">横风 ' + (goal.wind > 0 ? '→' : '←') + ' ' + Math.abs(goal.wind) + ' 格 <span>圆点预示落点</span></div>' + svg(body, '0 0 390 210') + '<div class="ma-archery-controls"><div><span>方向 <b>' + (p.aim === 0 ? '正中' : p.aim < 0 ? '左 ' + -p.aim : '右 ' + p.aim) + '</b></span>' + button('aim-step', -1, '←', 'aria-label="方向向左一格" ' + (p.aim === -2 || solved ? 'disabled' : '')) + button('aim-step', 1, '→', 'aria-label="方向向右一格" ' + (p.aim === 2 || solved ? 'disabled' : '')) + '</div><div><span>力度 <b>' + p.power + ' / 5</b></span>' + button('power-step', -1, '−', 'aria-label="减少力度" ' + (p.power === 1 || solved ? 'disabled' : '')) + button('power-step', 1, '+', 'aria-label="增加力度" ' + (p.power === 5 || solved ? 'disabled' : '')) + '</div></div><div class="ma-controls">' + button('shoot', '', solved ? '箭已落入内环' : '松弦试射', 'class="ma-primary" ' + (solved ? 'disabled' : '')) + '</div><p class="ma-inline-note">' + (solved ? '不必分毫不差，这一箭已经足够。' : arrowHit(n, p.aim, p.power) ? '风与弓弦已合拍，可以松手了。' : '移动圆点，让它落进暗红内环。') + '</p></div>';
  }
  function renderPairs(n, p, solved) {
    const matched = p.pairs.flat(), deck = pairDeck(n);
    return '<div class="ma-pair-cards">' + deck.map((type, i) => {
      const face = matched.includes(i) || p.open.includes(i);
      return button('pair-flip', i, face ? icon(GLYPHS[type]) + '<span>' + NAMES[type] + '</span>' : '<span class="ma-card-back" aria-hidden="true">✧</span><span>第 ' + (i + 1) + ' 枚</span>', 'class="ma-pair-card ' + (matched.includes(i) ? 'ma-matched' : face ? 'ma-face' : '') + '" aria-label="第' + (i + 1) + '枚，' + (face ? NAMES[type] + (matched.includes(i) ? '已配对' : '已翻开') : '未翻开') + '" ' + (solved || face ? 'disabled' : ''));
    }).join('') + '</div><p class="ma-inline-note">已找回 ' + p.pairs.length + ' / 3 对徽记' + (p.open.length === 2 ? ' · 直接翻下一枚，旧牌会自行合上' : '') + '</p>' + (p.open.length === 2 ? '<div class="ma-controls">' + button('pair-close', '', '合上这两枚', 'class="ma-secondary"') + '</div>' : '');
  }
  function render(role, n, saved, options = {}) {
    const item = config(role, n); if (!item) return '';
    const state = sanitize(role, n, saved), p = state.payload, solved = options.solved === true || isSolved(role, n, state);
    if (LEGACY[item.kind]) return '<div class="ma-activity" data-ma-kind="' + item.kind + '">' + legacy.render(LEGACY[item.kind], n, p, options) + '</div>';
    const renderers = { choice: () => renderChoice(item, p, solved), supplies: () => renderSupplies(n, p, solved), memory: () => renderMemory(n, p, solved), connect: () => renderRoad(p, solved), fragments: () => renderFragments(p, solved), archery: () => renderArchery(n, p, solved), pairs: () => renderPairs(n, p, solved) };
    return '<div class="ma-activity ma-kind-' + esc(item.kind) + (solved ? ' ma-solved' : '') + '" data-ma-kind="' + esc(item.kind) + '">' + (renderers[item.kind] ? renderers[item.kind]() : '') + (options.hint ? '<p class="ma-hint">' + esc(meta(role, n).hint) + '</p>' : '') + '</div>';
  }
  function bind(container, callback) {
    const cleanupLegacy = legacy.bind(container, callback), timers = [];
    const memory = container.querySelector('[data-ma-watch]');
    let disposed = false;
    if (memory) {
      const values = memory.dataset.maWatch.split(',').map(Number), status = memory.querySelector('.ma-memory-status');
      const later = (fn, ms) => timers.push(setTimeout(() => { if (!disposed) fn(); }, ms));
      values.forEach((value, i) => {
        later(() => { memory.querySelectorAll('.ma-lit').forEach(node => node.classList.remove('ma-lit')); const seal = memory.querySelector('[data-ma-seal="' + value + '"]'); if (seal) seal.classList.add('ma-lit'); if (status) status.textContent = '第 ' + (i + 1) + ' 枚 · ' + NAMES[value]; }, 420 + i * 1000);
        later(() => { memory.querySelectorAll('.ma-lit').forEach(node => node.classList.remove('ma-lit')); }, 1120 + i * 1000);
      });
      later(() => callback('memory-ready', ''), 520 + values.length * 1000);
    }
    return () => { disposed = true; timers.forEach(clearTimeout); cleanupLegacy(); };
  }
  root.RoleGames = Object.freeze({ meta, initial, sanitize, reduce, isSolved, render, bind });
})(typeof window !== 'undefined' ? window : globalThis);
