/* Original, offline heraldic games. The figures are hand-drawn SVG, not AI illustrations. */
(function (root) {
  'use strict';

  const ROLES = ['margaret', 'warwick', 'edward', 'beaufort', 'richard', 'elizabeth'];
  const TEXT = {
    margaret: { title: '王冠的退路', description: '你是王后的护送者。一枚王冠，要穿过被战火截断的道路。', instruction: '点击与王冠上下左右相邻的道路，把它送到拱门。城墙不可通行；走错了可以退一步。', hint: '先观察封锁的位置。只能上下左右行走，旧路可以返回。' },
    warwick: { title: '造王者的天平', description: '军队、财富与盟约，都在你的指间成为砝码。', instruction: '先点一枚封印，再点左盘或右盘；也可以直接拖入秤盘。让三枚封印全部入盘，并使两侧重量相等。', hint: '最大的那枚封印，恰好抵得上另外两枚。已放置的封印也可以重新移动。' },
    edward: { title: '三日同辉', description: '雪地里升起三个太阳。将散乱的光芒，转成约克家的旗帜。', instruction: '转动三圈日轮，让三个金色光点都回到正上方。外环会带动中环，中环会带动内环。', hint: '由外向内调整：先让外环归位，再调中环，最后只调内环。每一格为六分之一圈。' },
    beaufort: { title: '烛下的密信', description: '看似平常的一封信，藏着一位母亲为儿子留下的路。', instruction: '把烛光移到三处淡金墨痕上，读出隐藏的暗语。可触摸拖动；也可用方向键或下方箭头移动。', hint: '密信上有三处细小的花押。让烛焰接近它们，暗语就会留下；不必一直按住。' },
    richard: { title: '白野猪的险步', description: '棋盘没有安全的直路。你必须像骑士一样，越过眼前的封锁。', instruction: '点击发光的落点，让白野猪以骑士的“日”字步抵达王冠：两格直行，再横移一格。', hint: '野猪可以跳过城墙，但不能落在墙上。点过的格子仍可返回；亮点就是当前合法落点。' },
    elizabeth: { title: '两朵玫瑰，一方织锦', description: '旧王朝留下两种颜色。你将把它们编织成同一朵花。', instruction: '对照小纹样，点击织锦上的红白线结来换色。修好少数错线，让两层花瓣吻合。', hint: '金色花心不需要修改。逐瓣比较小纹样，红线与白线只需点一下就能互换。' }
  };
  const CROWN_MAPS = [
    { start: 15, goal: 4, walls: [1, 6, 8, 11, 13, 18] },
    { start: 0, goal: 19, walls: [2, 3, 6, 7, 16, 18] },
    { start: 19, goal: 0, walls: [1, 2, 3, 6, 8, 16] },
    { start: 4, goal: 15, walls: [1, 6, 8, 11, 13, 18] },
    { start: 15, goal: 4, walls: [1, 3, 6, 8, 11, 18] },
    { start: 0, goal: 19, walls: [1, 3, 8, 11, 13, 16] },
    { start: 19, goal: 0, walls: [2, 3, 6, 8, 13, 16] }
  ];
  const KNIGHT_MAPS = [
    { start: 12, goal: 3, walls: [2, 7, 10] },
    { start: 0, goal: 15, walls: [3, 6, 12] },
    { start: 15, goal: 0, walls: [1, 6, 13] },
    { start: 3, goal: 12, walls: [0, 5, 14] },
    { start: 12, goal: 3, walls: [4, 7, 9] },
    { start: 0, goal: 15, walls: [2, 8, 13] },
    { start: 15, goal: 0, walls: [1, 7, 12] }
  ];
  const WEIGHTS = [[1, 2, 3], [2, 3, 5], [3, 4, 7], [2, 5, 7], [1, 4, 5], [3, 5, 8], [4, 5, 9]];
  const CLUES = [
    ['听取风声', '保全血脉', '等待时机'], ['越过海峡', '隐去姓名', '守住希望'],
    ['寄出密信', '联结旧友', '谨慎落印'], ['辨认盟约', '留下一线', '静候回音'],
    ['藏好姓名', '守住门径', '以信为盟'], ['一纸婚约', '海上的帆', '红白同枝'],
    ['承接旧名', '系起两家', '记住代价']
  ];
  const LETTERS = [
    ['愿您庄园的麦穗仍然低垂，', '愿今夜的风没有惊动庭院。', '请替我问候那位远行的亲人，', '有些话，唯有烛火能够记住。'],
    ['旅途漫长，请保重身体。', '海边的潮汐从不按人意停歇。', '若春天迟迟不来，也请等待；', '花园里仍留着一块空地。'],
    ['旧友的消息已平安收到。', '请将回信交给可信的来客。', '我们仍照料着往年的花木，', '枝头的颜色，不必写得太明。'],
    ['风改变方向，门仍须轻叩。', '请把窗边的灯留得久一些。', '倘若来人问起庭院的旧事，', '只说我们记得春天。'],
    ['近来夜深，愿君安稳入睡。', '请把那本旧书留在原处。', '夹在书页里的花已经干了，', '名字却不该被风带走。'],
    ['大海那边或许已有消息。', '愿两座花园共迎一个春天。', '请将此信读罢后付与烛火，', '留下的承诺，比墨迹长久。'],
    ['新枝长出，旧根仍在地下。', '愿家人记得这漫长的冬天。', '若后世只看见盛开的花，', '请告诉他们，泥土曾有裂痕。']
  ];
  const WEAVE_ACTIVE = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23];
  const WEAVE_INNER = [6, 7, 8, 11, 13, 16, 17, 18];
  const SEAL_NAMES = ['军队', '财赋', '盟约'];
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const integer = value => typeof value === 'number' && Number.isInteger(value);
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const chapter = value => integer(value) && value >= 0 ? value % 7 : 0;
  const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
  const bounded = (value, low, high) => typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high;
  const icon = name => root.Ornaments ? root.Ornaments.icon(name) : '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5L29 17L43 18L33 28L36 42L24 35L12 42L15 28L5 18L19 17Z" fill="currentColor"/></svg>';
  function svg(body, className, viewBox = '0 0 320 180') { return '<svg viewBox="' + viewBox + '" class="' + className + '" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">' + body + '</svg>'; }
  function button(action, value, content, attributes = '') { return '<button type="button" data-game-action="' + action + '" data-game-value="' + escape(value) + '" ' + attributes + '>' + content + '</button>'; }
  function indexValue(value) { return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value; }
  function config(roleId, index) { return roleId === 'margaret' ? CROWN_MAPS[chapter(index)] : KNIGHT_MAPS[chapter(index)]; }
  function distance(a, b, cols) { return [Math.abs(a % cols - b % cols), Math.abs(Math.floor(a / cols) - Math.floor(b / cols))]; }
  function legalStep(roleId, index, from, to) {
    const map = config(roleId, index), cols = roleId === 'margaret' ? 5 : 4, size = roleId === 'margaret' ? 20 : 16;
    if (!integer(from) || !integer(to) || to < 0 || to >= size || from < 0 || from >= size || map.walls.includes(to)) return false;
    const [dx, dy] = distance(from, to, cols);
    return roleId === 'margaret' ? dx + dy === 1 : (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
  }
  function cluePositions(index) {
    const n = chapter(index);
    return [{ x: 21 + n * 3 % 18, y: 24 }, { x: 64 + n * 2 % 17, y: 49 }, { x: 29 + n * 5 % 24, y: 75 }];
  }
  function near(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) <= 13; }
  function weaveTarget(index) {
    const n = chapter(index), target = Array(25).fill(-1);
    WEAVE_ACTIVE.forEach(i => { target[i] = WEAVE_INNER.includes(i) ? 0 : 1; });
    // Different illuminators reverse individual petal accents in later chapters.
    const accents = [[1, 6], [3, 8], [15, 16], [19, 18], [21, 17], [23, 13]];
    if (n > 0) accents[n - 1].forEach(i => { target[i] = 1 - target[i]; });
    target[12] = 2;
    return target;
  }
  function initial(roleId, index) {
    const n = chapter(index);
    if (roleId === 'margaret' || roleId === 'richard') return { path: [config(roleId, n).start] };
    if (roleId === 'warwick') return { places: [0, 0, 0], selected: null };
    if (roleId === 'edward') return { rings: [(n % 4) + 1, ((n * 2 + 1) % 5) + 1, ((n * 3 + 2) % 5) + 1], turns: 0 };
    if (roleId === 'beaufort') return { candle: { x: 50, y: 91 }, illuminations: [] };
    if (roleId === 'elizabeth') {
      const cells = weaveTarget(n), editable = WEAVE_ACTIVE.filter(i => i !== 12);
      for (let k = 0; k < 4 + n % 3; k++) { const cell = editable[(n * 3 + k * 3) % editable.length]; cells[cell] = 1 - cells[cell]; }
      return { cells };
    }
    return {};
  }
  function sanitize(roleId, index, saved) {
    const fresh = initial(roleId, index);
    if (!record(saved)) return fresh;
    if (roleId === 'margaret' || roleId === 'richard') {
      if (!Array.isArray(saved.path) || saved.path[0] !== fresh.path[0]) return fresh;
      const result = { path: [fresh.path[0]] };
      for (const next of saved.path.slice(1, 501)) {
        if (!legalStep(roleId, index, result.path[result.path.length - 1], next)) break;
        result.path.push(next);
        if (next === config(roleId, index).goal) break;
      }
      return result;
    }
    if (roleId === 'warwick') {
      if (Array.isArray(saved.places) && saved.places.length === 3 && saved.places.every(value => [0, 1, 2].includes(value))) fresh.places = saved.places.slice();
      fresh.selected = integer(saved.selected) && saved.selected >= 0 && saved.selected < 3 ? saved.selected : null;
    } else if (roleId === 'edward') {
      if (Array.isArray(saved.rings) && saved.rings.length === 3 && saved.rings.every(value => integer(value) && value >= 0 && value < 6)) fresh.rings = saved.rings.slice();
      fresh.turns = integer(saved.turns) && saved.turns >= 0 && saved.turns < 10000 ? saved.turns : 0;
    } else if (roleId === 'beaufort') {
      if (record(saved.candle) && bounded(saved.candle.x, 0, 100) && bounded(saved.candle.y, 0, 100)) fresh.candle = { x: saved.candle.x, y: saved.candle.y };
      if (Array.isArray(saved.illuminations)) {
        const locations = cluePositions(index), seen = new Set();
        saved.illuminations.slice(0, 30).forEach(mark => {
          if (!record(mark) || !integer(mark.id) || mark.id < 0 || mark.id > 2 || seen.has(mark.id) || !bounded(mark.x, 0, 100) || !bounded(mark.y, 0, 100) || !near(mark, locations[mark.id])) return;
          seen.add(mark.id); fresh.illuminations.push({ id: mark.id, x: mark.x, y: mark.y });
        });
      }
    } else if (roleId === 'elizabeth') {
      const target = weaveTarget(index);
      if (Array.isArray(saved.cells) && saved.cells.length === 25 && saved.cells.every((value, i) => target[i] === -1 || target[i] === 2 ? value === target[i] : value === 0 || value === 1)) fresh.cells = saved.cells.slice();
    }
    return fresh;
  }
  function isSolved(roleId, index, saved) {
    if (!ROLES.includes(roleId)) return false;
    const state = sanitize(roleId, index, saved);
    if (roleId === 'margaret' || roleId === 'richard') return state.path[state.path.length - 1] === config(roleId, index).goal;
    if (roleId === 'warwick') {
      const weights = WEIGHTS[chapter(index)];
      return state.places.every(Boolean) && weights.reduce((sum, weight, i) => sum + (state.places[i] === 1 ? weight : -weight), 0) === 0;
    }
    if (roleId === 'edward') return state.rings.every(value => value === 0);
    if (roleId === 'beaufort') return [0, 1, 2].every(id => state.illuminations.some(mark => mark.id === id));
    return state.cells.every((value, i) => value === weaveTarget(index)[i]);
  }
  function illuminate(state, index) {
    const newIds = [];
    cluePositions(index).forEach((spot, id) => {
      if (near(state.candle, spot) && !state.illuminations.some(mark => mark.id === id)) {
        state.illuminations.push({ id, x: state.candle.x, y: state.candle.y }); newIds.push(id);
      }
    });
    return newIds;
  }
  function reduce(roleId, index, saved, action, payload) {
    const state = sanitize(roleId, index, saved), before = JSON.stringify(state);
    let message = '';
    const result = () => ({ state, changed: before !== JSON.stringify(state), message });
    if (!ROLES.includes(roleId)) return result();
    if (isSolved(roleId, index, state)) { message = '这一页的机关已经解开。'; return result(); }
    if (action === 'reset') return { state: initial(roleId, index), changed: JSON.stringify(initial(roleId, index)) !== before, message: '重新摆好。这一次，慢慢来。' };
    if (roleId === 'margaret' || roleId === 'richard') {
      if (action === 'undo' && state.path.length > 1) state.path.pop();
      if (action === (roleId === 'margaret' ? 'march' : 'leap')) {
        const to = indexValue(payload), from = state.path[state.path.length - 1];
        if (legalStep(roleId, index, from, to)) {
          if (state.path.length >= 500) { message = '道路已画得太长，退一步或重置后继续。'; return result(); }
          state.path.push(to); message = to === config(roleId, index).goal ? (roleId === 'margaret' ? '王冠抵达门后。暂时的退让，也是一种守护。' : '白野猪走到了王冠前。棋局之外，命运尚未落定。') : '';
        } else message = roleId === 'margaret' ? '这一步无法通行。请走相邻的道路，绕过城墙。' : '野猪须走“日”字步，也不能落在城墙上。';
      }
    } else if (roleId === 'warwick') {
      if (action === 'seal-select') {
        const selected = indexValue(payload);
        if (integer(selected) && selected >= 0 && selected < 3) { state.selected = selected; message = '已拿起' + SEAL_NAMES[selected] + '封印。将它放到一个秤盘。'; }
      }
      if (action === 'seal-place') {
        const selected = record(payload) ? indexValue(payload.index) : state.selected;
        const side = record(payload) ? payload.side : payload;
        const place = ({ left: 1, right: 2, tray: 0 })[side];
        if (integer(selected) && selected >= 0 && selected < 3 && place !== undefined) { state.places[selected] = place; state.selected = null; message = isSolved(roleId, index, state) ? '秤梁归于平静。每一份盟约，都有它的分量。' : '封印落下，天平又倾向了一边。'; }
        else message = '先拿起一枚封印，再把它放入秤盘。';
      }
    } else if (roleId === 'edward' && action === 'rotate') {
      const parts = typeof payload === 'string' ? payload.split(':').map(Number) : Array.isArray(payload) ? payload : [];
      const ring = parts[0], step = parts[1];
      if (integer(ring) && ring >= 0 && ring < 3 && (step === 1 || step === -1)) {
        state.rings[ring] = modulo(state.rings[ring] + step, 6);
        if (ring < 2) state.rings[ring + 1] = modulo(state.rings[ring + 1] + step, 6);
        state.turns = Math.min(9999, state.turns + 1);
        message = isSolved(roleId, index, state) ? '三重光芒交叠，太阳照亮了书页。' : '';
      }
    } else if (roleId === 'beaufort') {
      if (action === 'candle-move' && record(payload) && bounded(payload.x, 0, 100) && bounded(payload.y, 0, 100)) state.candle = { x: payload.x, y: payload.y };
      if (action === 'candle-step') {
        const delta = ({ left: [-10, 0], right: [10, 0], up: [0, -10], down: [0, 10] })[payload];
        if (delta) state.candle = { x: Math.max(0, Math.min(100, state.candle.x + delta[0])), y: Math.max(0, Math.min(100, state.candle.y + delta[1])) };
      }
      if (['candle-move', 'candle-step', 'candle-reveal'].includes(action)) {
        const discoveries = illuminate(state, index);
        if (discoveries.length) message = '烛光显出了暗语：「' + discoveries.map(id => CLUES[chapter(index)][id]).join('」「') + '」。';
        else if (action === 'candle-reveal') message = '此处只有寻常笔迹。试着靠近淡金色的花押。';
      }
    } else if (roleId === 'elizabeth' && action === 'weave') {
      const cell = indexValue(payload), target = weaveTarget(index);
      if (integer(cell) && cell >= 0 && cell < 25 && (target[cell] === 0 || target[cell] === 1)) {
        state.cells[cell] = 1 - state.cells[cell];
        message = isSolved(roleId, index, state) ? '红白线交织成花。两种颜色，都被留在了这一页。' : '';
      }
    }
    return result();
  }
  function renderRoute(roleId, index, state, solved) {
    const map = config(roleId, index), cols = roleId === 'margaret' ? 5 : 4, size = cols * 4;
    const here = state.path[state.path.length - 1], isCrown = roleId === 'margaret';
    const wall = svg('<path d="M7 40V13H14V20H21V13H28V20H35V13H42V40ZM6 41H43M12 28H38M22 28V39M12 21V28M32 21V28"/><path d="M15 33H18M28 33H31"/>', 'rg-wall', '0 0 48 48');
    const gate = svg('<path d="M7 43V19L24 6L41 19V43M13 43V24C13 10 35 10 35 24V43M21 21V43M27 21V43M13 29H35M13 36H35M4 43H44"/>', 'rg-gate', '0 0 48 48');
    const cells = Array.from({ length: size }, (_, cell) => {
      const blocked = map.walls.includes(cell), current = cell === here, goal = cell === map.goal, possible = !solved && legalStep(roleId, index, here, cell), visited = state.path.includes(cell);
      const title = '第' + (Math.floor(cell / cols) + 1) + '行第' + (cell % cols + 1) + '列，' + (current ? (isCrown ? '王冠所在' : '白野猪所在') : blocked ? '城墙' : goal ? (isCrown ? '安全拱门' : '王冠') : possible ? '可抵达的道路' : '道路');
      const content = current ? icon(isCrown ? 'crown' : 'boar') : blocked ? wall : goal ? (isCrown ? gate : icon('crown')) : possible ? '<span class="rg-landing" aria-hidden="true">✧</span>' : visited ? '<span class="rg-footprint" aria-hidden="true">·</span>' : '<span class="rg-tile-flourish" aria-hidden="true">·</span>';
      return button(isCrown ? 'march' : 'leap', cell, content, 'class="rg-tile ' + (blocked ? 'rg-blocked ' : '') + (current ? 'rg-current ' : '') + (goal ? 'rg-goal ' : '') + (possible ? 'rg-possible ' : '') + (visited ? 'rg-visited' : '') + '" aria-label="' + title + '" ' + ((blocked || solved || current) ? 'disabled' : ''));
    }).join('');
    return '<div class="rg-map-caption"><span>' + (isCrown ? '穿越封锁' : '骑士的步法') + '</span><span>' + (state.path.length - 1) + ' 步</span></div><div class="rg-route rg-route-' + cols + '" role="group" aria-label="' + (isCrown ? '王冠护送地图' : '白野猪棋盘') + '">' + cells + '</div><div class="rg-route-legend"><span>✧ 可抵达</span><span>' + (isCrown ? '拱门是终点' : '王冠是终点') + '</span></div><div class="rg-tools">' + button('undo', '', '↶ 退一步', 'class="rg-small-button" ' + (solved || state.path.length < 2 ? 'disabled' : '')) + '</div>';
  }
  function renderScale(index, state, solved) {
    const weights = WEIGHTS[chapter(index)], left = weights.reduce((sum, value, i) => sum + (state.places[i] === 1 ? value : 0), 0), right = weights.reduce((sum, value, i) => sum + (state.places[i] === 2 ? value : 0), 0);
    const tilt = Math.max(-12, Math.min(12, (right - left) * 2));
    const scale = svg('<path d="M160 49V150M130 158H190M144 150H176M150 46L160 30L170 46Z"/><g transform="rotate(' + tilt + ' 160 58)"><path d="M55 58H265M57 54L50 58L57 62M263 54L270 58L263 62"/><circle cx="160" cy="58" r="7" fill="var(--rg-paper)"/><path d="M66 58L38 115H94ZM254 58L226 115H282Z"/><path d="M35 115Q66 151 97 115ZM223 115Q254 151 285 115Z" fill="var(--rg-gold)" fill-opacity=".24"/></g><path d="M157 19L160 14L163 19L160 24Z"/>', 'rg-scale-svg');
    const pan = (side, value, total) => button('seal-place', side, '<span class="rg-pan-name">' + (value === 1 ? '左盘' : '右盘') + '</span><strong>' + total + '</strong><span class="rg-pan-seals">' + state.places.map((place, i) => place === value ? '<span>' + SEAL_NAMES[i] + ' ' + weights[i] + '</span>' : '').join('') + '</span>', 'class="rg-pan" data-rg-drop="' + side + '" aria-label="' + (value === 1 ? '左盘' : '右盘') + '，重量' + total + '，放入所选封印" ' + (solved ? 'disabled' : ''));
    const seals = weights.map((weight, i) => button('seal-select', i, icon(['crown', 'key', 'seal'][i]) + '<span>' + SEAL_NAMES[i] + '</span><strong>' + weight + '</strong><small>' + (state.places[i] === 1 ? '在左盘' : state.places[i] === 2 ? '在右盘' : '待放置') + '</small>', 'class="rg-seal ' + (state.selected === i ? 'rg-selected' : '') + '" draggable="' + !solved + '" data-rg-drag="' + i + '" aria-pressed="' + (state.selected === i) + '" aria-label="' + SEAL_NAMES[i] + '封印，重量' + weight + '" ' + (solved ? 'disabled' : ''))).join('');
    return '<div class="rg-scale" aria-hidden="true">' + scale + '</div><div class="rg-pans">' + pan('left', 1, left) + pan('right', 2, right) + '</div><div class="rg-scale-status">' + (left === right ? (state.places.every(Boolean) ? '两侧平衡' : '天平静止 · 仍有封印未入盘') : (left > right ? '左盘较重' : '右盘较重')) + '</div><div class="rg-seal-tray" role="group" aria-label="三枚封印">' + seals + '</div><div class="rg-tools">' + button('seal-place', 'tray', '放回桌面', 'class="rg-small-button" data-rg-drop="tray" ' + (solved || state.selected === null ? 'disabled' : '')) + '</div>';
  }
  function renderSun(state, solved) {
    const radii = [100, 72, 44], ringNames = ['外环', '中环', '内环'];
    let body = '<path d="M160 4L154 16H166Z" fill="var(--rg-gold)"/><path d="M160 19V30"/>';
    radii.forEach((r, i) => {
      body += '<circle cx="160" cy="128" r="' + r + '" stroke-width="' + (i === 0 ? '2' : '1.5') + '"/><circle cx="160" cy="128" r="' + (r - 6) + '" stroke-opacity=".28"/>';
      for (let n = 0; n < 6; n++) { const angle = n * Math.PI / 3; body += '<circle cx="' + (160 + r * Math.sin(angle)) + '" cy="' + (128 - r * Math.cos(angle)) + '" r="2" fill="currentColor"/>'; }
      body += '<g transform="rotate(' + state.rings[i] * 60 + ' 160 128)"><path d="M160 ' + (128 - r + 12) + 'V' + (128 - r - 7) + '" stroke="var(--rg-red)" stroke-width="3"/><circle cx="160" cy="' + (128 - r) + '" r="7" fill="var(--rg-gold)" stroke="var(--rg-red)"/><path d="M160 ' + (128 - r - 4) + 'V' + (128 - r + 4) + 'M156 ' + (128 - r) + 'H164" stroke="var(--rg-paper)"/></g>';
    });
    body += '<circle cx="160" cy="128" r="20" fill="var(--rg-gold)" fill-opacity=".28"/><path d="M151 124Q154 120 157 124M163 124Q166 120 169 124M160 123V132H164M154 138Q160 142 166 138" stroke-linecap="round"/><path d="M160 102V96M160 154V160M134 128H128M186 128H192"/>';
    const controls = ringNames.map((name, i) => '<div class="rg-ring-control"><span>' + name + '<small>' + (i === 0 ? '牵动中环' : i === 1 ? '牵动内环' : '独立转动') + '</small></span>' + button('rotate', i + ':-1', '↶', 'class="rg-turn" aria-label="' + name + '逆时针一格" ' + (solved ? 'disabled' : '')) + button('rotate', i + ':1', '↷', 'class="rg-turn" aria-label="' + name + '顺时针一格" ' + (solved ? 'disabled' : '')) + '<span class="rg-ring-position">' + (state.rings[i] === 0 ? '已归位' : '第 ' + state.rings[i] + ' 格') + '</span></div>').join('');
    return '<div class="rg-sundial">' + svg(body, 'rg-sun-svg', '0 0 320 244') + '</div><div class="rg-ring-controls">' + controls + '</div>';
  }
  function renderLetter(index, state, solved) {
    const n = chapter(index), positions = cluePositions(n), found = state.illuminations.map(mark => mark.id);
    const spots = positions.map((spot, id) => '<span class="rg-secret-mark ' + (found.includes(id) ? 'rg-discovered' : '') + '" style="left:' + spot.x + '%;top:' + spot.y + '%" data-rg-clue="' + id + '" data-rg-x="' + spot.x + '" data-rg-y="' + spot.y + '" data-rg-found="' + found.includes(id) + '"><span aria-hidden="true">❦</span>' + (found.includes(id) ? '<strong>' + CLUES[n][id] + '</strong>' : '') + '</span>').join('');
    const controls = '<div class="rg-candle-controls" role="group" aria-label="移动烛光">' + button('candle-step', 'left', '←', 'aria-label="烛光向左"') + button('candle-step', 'up', '↑', 'aria-label="烛光向上"') + button('candle-reveal', '', '探照', 'class="rg-reveal" aria-label="在当前位置探照"') + button('candle-step', 'down', '↓', 'aria-label="烛光向下"') + button('candle-step', 'right', '→', 'aria-label="烛光向右"') + '</div>';
    return '<div class="rg-letter ' + (solved ? 'rg-letter-solved' : '') + '" tabindex="0" role="group" aria-label="烛光密信：可用方向键移动，回车探照。三处花押位于信纸的上部、中部和下部。" data-rg-active="' + !solved + '" style="--rg-light-x:' + state.candle.x + '%;--rg-light-y:' + state.candle.y + '%"><span class="rg-letter-salutation">致一位旧友</span><div class="rg-letter-lines" aria-hidden="true">' + LETTERS[n].map(line => '<p>' + line + '</p>').join('') + '</div>' + spots + '<span class="rg-candle" aria-hidden="true"><i></i></span><span class="rg-letter-signature" aria-hidden="true">M. B.</span></div>' + (solved ? '' : controls) + '<div class="rg-found-clues" aria-label="已发现的暗语">' + [0, 1, 2].map(id => '<span class="' + (found.includes(id) ? 'rg-found' : '') + '">' + (found.includes(id) ? CLUES[n][id] : '尚未显影') + '</span>').join('') + '</div><p class="rg-footnote">虚构密信 · 象征她的谨慎与筹谋</p>';
  }
  function renderWeave(index, state, solved) {
    const target = weaveTarget(index), correct = target.filter((value, i) => value !== -1 && value !== 2 && value === state.cells[i]).length;
    const pattern = values => values.map(value => '<span class="rg-thread rg-thread-' + value + '" aria-hidden="true"></span>').join('');
    const reference = '<figure class="rg-weave-reference"><figcaption>织工留下的纹样</figcaption><div class="rg-pattern" role="img" aria-label="目标红白玫瑰纹样">' + pattern(target) + '</div><p>红瓣与白瓣<br>共同围住花心</p></figure>';
    const board = state.cells.map((value, i) => value === -1 || value === 2 ? '<span class="rg-thread rg-thread-' + value + '" ' + (value === 2 ? 'role="img" aria-label="金色花心"' : 'aria-hidden="true"') + '>' + (value === 2 ? '✣' : '') + '</span>' : button('weave', i, '<span aria-hidden="true">' + (value ? '╳' : '＋') + '</span>', 'class="rg-thread rg-thread-' + value + '" aria-label="第' + (Math.floor(i / 5) + 1) + '行第' + (i % 5 + 1) + '列，当前' + (value ? '红线' : '白线') + '，纹样应为' + (target[i] ? '红线' : '白线') + '，点击换色" ' + (solved ? 'disabled' : ''))).join('');
    return '<div class="rg-weave-layout">' + reference + '<div class="rg-loom" role="group" aria-label="红白玫瑰织锦">' + board + '</div></div><div class="rg-weave-status">' + (correct === 20 ? '每一根线，都找到了归处。' : '还有 ' + (20 - correct) + ' 处错线，等待你的手指。') + '</div><div class="rg-thread-key"><span><i class="rg-thread-1"></i>红玫瑰</span><span><i class="rg-thread-0"></i>白玫瑰</span></div>';
  }
  function render(roleId, index, saved, options = {}) {
    if (!ROLES.includes(roleId)) return '';
    const state = sanitize(roleId, index, saved), solved = options.solved === true || isSolved(roleId, index, state);
    let body;
    if (roleId === 'margaret' || roleId === 'richard') body = renderRoute(roleId, index, state, solved);
    else if (roleId === 'warwick') body = renderScale(index, state, solved);
    else if (roleId === 'edward') body = renderSun(state, solved);
    else if (roleId === 'beaufort') body = renderLetter(index, state, solved);
    else body = renderWeave(index, state, solved);
    return '<div class="rg-game rg-game-' + roleId + (solved ? ' rg-solved' : '') + '">' + body + (options.hint ? '<p class="rg-hint">' + TEXT[roleId].hint + '</p>' : '') + '</div>';
  }
  function bind(container, callback) {
    if (!container || typeof container.querySelector !== 'function' || typeof callback !== 'function') return () => {};
    const removers = [];
    const listen = (node, event, handler) => { node.addEventListener(event, handler); removers.push(() => node.removeEventListener(event, handler)); };
    const letter = container.querySelector('.rg-letter[data-rg-active="true"]');
    if (letter) {
      const explore = event => {
        if (event.type === 'pointermove' && event.pointerType === 'touch' && !event.buttons) return;
        const rect = letter.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
        letter.style.setProperty('--rg-light-x', x + '%'); letter.style.setProperty('--rg-light-y', y + '%');
        const undiscovered = Array.from(letter.querySelectorAll('[data-rg-clue][data-rg-found="false"]'));
        if (undiscovered.some(mark => near({ x, y }, { x: Number(mark.dataset.rgX), y: Number(mark.dataset.rgY) }))) callback('candle-move', { x, y });
      };
      listen(letter, 'pointerdown', explore); listen(letter, 'pointermove', explore);
      listen(letter, 'keydown', event => {
        const direction = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' })[event.key];
        if (direction) { event.preventDefault(); event.stopPropagation(); callback('candle-step', direction); }
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); callback('candle-reveal', ''); }
      });
    }
    let dragged = null;
    container.querySelectorAll('[data-rg-drag]').forEach(seal => {
      listen(seal, 'dragstart', event => { dragged = Number(seal.dataset.rgDrag); if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(dragged)); } });
      listen(seal, 'dragend', () => { dragged = null; container.querySelectorAll('.rg-drag-over').forEach(node => node.classList.remove('rg-drag-over')); });
    });
    container.querySelectorAll('[data-rg-drop]').forEach(pan => {
      listen(pan, 'dragover', event => { if (dragged !== null) { event.preventDefault(); pan.classList.add('rg-drag-over'); } });
      listen(pan, 'dragleave', () => pan.classList.remove('rg-drag-over'));
      listen(pan, 'drop', event => { event.preventDefault(); pan.classList.remove('rg-drag-over'); if (dragged !== null) callback('seal-place', { index: dragged, side: pan.dataset.rgDrop }); dragged = null; });
    });
    return () => removers.forEach(remove => remove());
  }
  root.RoleGames = Object.freeze({ meta: roleId => TEXT[roleId] ? { ...TEXT[roleId] } : null, initial, reduce, isSolved, sanitize, render, bind });
})(typeof window !== 'undefined' ? window : globalThis);
