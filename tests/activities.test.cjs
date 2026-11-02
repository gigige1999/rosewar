const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const project = path.resolve(__dirname, '..');
const roleIds = ['margaret', 'warwick', 'edward', 'beaufort', 'richard', 'elizabeth'];
const plain = value => JSON.parse(JSON.stringify(value));
function loadContext() {
  const context = vm.createContext({ window: {}, setTimeout, clearTimeout });
  for (const filename of ['assets/ornaments.js', 'minigames.js', 'activity-data.js', 'mixed-activities.js']) vm.runInContext(fs.readFileSync(path.join(project, filename), 'utf8'), context);
  return context;
}
function loadGames() { return loadContext().window.RoleGames; }

// A test-only reader: all actions pass through the same reducers and values
// as the visible game controls. No completion property is manufactured.
function solveActions(games, role, index, suppliedState) {
  let state = suppliedState || games.initial(role, index);
  const info = games.meta(role, index), kind = info.kind, actions = [];
  const act = (action, value = '') => {
    const next = games.reduce(role, index, state, action, value);
    assert.equal(next.changed, true, `${role}/${index}: ${action} ${JSON.stringify(value)} must do useful work`);
    actions.push({ action, value }); state = next.state;
    return next;
  };
  const solved = () => games.isSolved(role, index, state);
  if (solved()) return actions;
  if (kind === 'choice') {
    if (!state.payload.selected) act('choose-option', info.historicalChoice || info.answer);
    act('decision-confirm');
  }
  else if (kind === 'route' || kind === 'knight') {
    const name = kind === 'route' ? 'march' : 'leap', size = kind === 'route' ? 20 : 16;
    const queue = [{ state, history: [] }], seen = new Set([state.payload.path.at(-1)]);
    while (queue.length) {
      const current = queue.shift();
      for (let value = 0; value < size; value++) {
        if (seen.has(value)) continue;
        const next = games.reduce(role, index, current.state, name, String(value));
        if (!next.changed) continue;
        const history = [...current.history, { action: name, value: String(value) }];
        if (games.isSolved(role, index, next.state)) return history;
        seen.add(value); queue.push({ state: next.state, history });
      }
    }
    throw new Error(`Unsolvable ${role}/${index} ${kind}`);
  } else if (kind === 'scales') {
    for (const i of [0, 1, 2]) { act('seal-select', String(i)); act('seal-place', i === 2 ? 'right' : 'left'); }
  } else if (kind === 'sun') {
    for (let ring = 0; ring < 3; ring++) while (state.payload.rings[ring] !== 0) act('rotate', ring + ':' + (state.payload.rings[ring] <= 3 ? '-1' : '1'));
  } else if (kind === 'candle') {
    const marks = [...games.render(role, index, state).matchAll(/data-rg-x="([\d.]+)" data-rg-y="([\d.]+)"/g)];
    for (const mark of marks) {
      const value = { x: Number(mark[1]), y: Number(mark[2]) };
      if (games.reduce(role, index, state, 'candle-move', value).changed) act('candle-move', value);
    }
  } else if (kind === 'weave') {
    const threads = [...games.render(role, index, state).matchAll(/data-game-action="weave" data-game-value="(\d+)"[^>]*aria-label="[^"]*当前(红线|白线)，纹样应为(红线|白线)/g)];
    for (const match of threads) if (match[2] !== match[3]) act('weave', match[1]);
  } else if (kind === 'supplies') {
    const cards = [...games.render(role, index, state).matchAll(/data-game-action="supply-toggle" data-game-value="(\d+)"[\s\S]*?<span>([^<]+)<\/span>/g)];
    for (const match of cards) if (['粮袋', '水罐', '草药'].includes(match[2]) !== state.payload.chosen.includes(Number(match[1]))) act('supply-toggle', match[1]);
    act('supply-seal');
  } else if (kind === 'memory') {
    if (state.payload.phase !== 'show') act('memory-watch');
    const watch = games.render(role, index, state).match(/data-ma-watch="([\d,]+)"/);
    assert.ok(watch, 'the game shows a real sequence before the reader repeats it');
    act('memory-ready');
    for (const seal of watch[1].split(',').slice(state.payload.entered.length)) act('memory-press', seal);
  } else if (kind === 'connect') {
    for (const i of [3, 0, 1, 4, 7, 8, 5]) {
      while (!solved() && state.payload.turns[i] !== 0) act('road-turn', String(i));
    }
  } else if (kind === 'fragments') {
    if (state.payload.selected !== null) act('fragment-select', String(state.payload.selected));
    for (let slot = 0; slot < 4 && !solved(); slot++) if (state.payload.order[slot] !== slot) { const other = state.payload.order.indexOf(slot); act('fragment-select', String(slot)); act('fragment-select', String(other)); }
  } else if (kind === 'archery') {
    const config = games.render(role, index, state).match(/data-ma-wind="(-?\d+)" data-ma-distance="(\d+)"/);
    assert.ok(config);
    const targetAim = -Number(config[1]), targetPower = Number(config[2]);
    while (state.payload.aim !== targetAim) act('aim-step', String(state.payload.aim < targetAim ? 1 : -1));
    while (state.payload.power !== targetPower) act('power-step', String(state.payload.power < targetPower ? 1 : -1));
    act('shoot');
  } else if (kind === 'pairs') {
    const known = new Map();
    const remember = cell => {
      const html = games.render(role, index, state), match = html.match(new RegExp('data-game-action="pair-flip" data-game-value="' + cell + '"[^>]*aria-label="第\\d+枚，([^"<]+?)(?:已配对|已翻开)"'));
      assert.ok(match, 'a turned card exposes its insignia'); known.set(cell, match[1]);
    };
    let guard = 0;
    while (!solved() && guard++ < 40) {
      if (state.payload.open.length === 2) { act('pair-close'); continue; }
      const matched = state.payload.pairs.flat(), available = Array.from({ length: 6 }, (_, i) => i).filter(i => !matched.includes(i) && !state.payload.open.includes(i));
      let next;
      if (state.payload.open.length === 1) {
        const open = state.payload.open[0]; remember(open);
        next = available.find(i => known.has(i) && known.get(i) === known.get(open));
      } else {
        next = available.find(i => known.has(i) && available.some(j => j !== i && known.get(j) === known.get(i)));
      }
      if (next === undefined) next = available.find(i => !known.has(i));
      if (next === undefined) next = available[0];
      act('pair-flip', String(next)); remember(next);
    }
  }
  assert.equal(solved(), true, `${role}/${index} ${kind} solved by real actions`);
  return actions;
}
module.exports = { loadGames, loadContext, solveActions, roleIds };

if (require.main === module) {
  const games = loadGames();
  test('six routes have three different games and four choices; twelve mechanisms are represented', () => {
    const kinds = new Set(); let countGames = 0, countChoices = 0;
    for (const role of roleIds) {
      const entries = Array.from({ length: 7 }, (_, n) => games.meta(role, n));
      const puzzles = entries.filter(entry => entry.type === 'game');
      assert.equal(puzzles.length, 3); assert.equal(new Set(puzzles.map(p => p.kind)).size, 3);
      assert.equal(entries.filter(entry => entry.type === 'choice').length, 4);
      for (const entry of entries) {
        assert.ok(entry.id && entry.title && entry.instruction && entry.hint && entry.stakes);
        if (entry.type === 'game') { countGames++; kinds.add(entry.kind); }
        else { countChoices++; assert.equal(entry.options.length, 3); assert.ok(entry.options.some(option => option.id === entry.historicalChoice)); assert.ok(entry.historicalNote && entry.sceneDate); assert.ok(entry.options.every(option => option.consequence && option.echo && option.motive && option.text)); }
      }
    }
    assert.equal(countGames, 18); assert.equal(countChoices, 24); assert.equal(kinds.size, 12);
  });
  for (const role of roleIds) for (let n = 0; n < 7; n++) {
    const info = games.meta(role, n);
    test(`${role} chapter ${n + 1} ${info.kind}: complete, restore every move, and reject mismatched activity`, () => {
      let state = games.initial(role, n);
      assert.equal(games.isSolved(role, n, state), false);
      assert.equal(state.activityId, info.id);
      assert.deepEqual(plain(games.sanitize(role, n, { ...state, activityId: 'other-activity' })), plain(state));
      const forged = { activityId: info.id, payload: { solved: true, count: 9, complete: true } };
      assert.equal(games.isSolved(role, n, forged), false);
      if (info.kind === 'choice') {
        const alternate = info.options.find(option => option.id !== info.historicalChoice);
        const next = games.reduce(role, n, state, 'choose-option', alternate.id);
        assert.equal(next.changed, true); assert.equal(next.message, alternate.motive);
        assert.equal(games.isSolved(role, n, next.state), false);
        state = games.sanitize(role, n, plain(next.state));
        assert.equal(state.payload.selected, alternate.id);
        assert.ok(games.render(role, n, state).includes(alternate.motive), 'uncommitted inner voice remains after restore');
        assert.ok(!games.render(role, n, state).includes(alternate.consequence), 'outcomes are not revealed before commitment');
        assert.equal(games.reduce(role, n, state, 'choose-option', 'not-an-option').changed, false);
      }
      const actions = solveActions(games, role, n, state);
      assert.ok(actions.length >= 1 && actions.length <= 35, 'all tasks are short');
      for (const { action, value } of actions) {
        const original = plain(state), next = games.reduce(role, n, state, action, value);
        assert.deepEqual(plain(state), original, 'caller state is immutable');
        assert.equal(next.changed, true);
        state = games.sanitize(role, n, plain(next.state));
        assert.deepEqual(plain(state), plain(next.state), 'refresh retains the legal board and feedback');
      }
      assert.equal(games.isSolved(role, n, state), true);
      assert.equal(games.reduce(role, n, state, 'reset', '').changed, false, 'completed evidence is stable');
      assert.equal(games.isSolved(role, (n + 1) % 7, state), false, 'proof belongs to exactly one activity');
    });
  }

  function activity(kind) { for (const role of roleIds) for (let n = 0; n < 7; n++) if (games.meta(role, n).kind === kind) return { role, n, state: games.initial(role, n) }; throw new Error('Missing kind ' + kind); }
  test('all 72 decisions have consequences, reveal history only after signing, and survive refresh', () => {
    for (const role of roleIds) for (let n = 0; n < 7; n++) {
      const info = games.meta(role, n); if (info.kind !== 'choice') continue;
      assert.equal(games.reduce(role, n, games.initial(role, n), 'decision-confirm', '').changed, false);
      for (const option of info.options) {
        let state = games.reduce(role, n, games.initial(role, n), 'choose-option', option.id).state;
        assert.equal(games.isSolved(role, n, state), false);
        assert.ok(!games.render(role, n, state).includes(info.historicalNote));
        state = games.reduce(role, n, state, 'decision-confirm', '').state;
        state = games.sanitize(role, n, plain(state));
        assert.equal(games.isSolved(role, n, state), true);
        const rendered = games.render(role, n, state);
        assert.ok(rendered.includes(option.consequence) && rendered.includes(option.echo));
        assert.ok(rendered.includes(info.historicalNote));
        assert.ok(rendered.includes(option.id === info.historicalChoice ? '历史中的选择' : '一种可能 · 架空推演'));
        assert.equal(games.reduce(role, n, state, 'choose-option', info.options.find(o => o.id !== option.id).id).changed, false);
      }
      const old = games.sanitize(role, n, {activityId:info.id,payload:{selected:info.answer}});
      assert.equal(old.payload.legacySelected, info.answer);
      assert.equal(old.payload.selected, null);
      assert.equal(games.isSolved(role, n, old), false, 'old quiz answers never silently become new personal decisions');
      assert.deepEqual(plain(games.sanitize(role, n, plain(old))), plain(old));
    }
  });
  test('supplies allow different caring priorities but require two items, light weight and commitment', () => {
    const { role, n } = activity('supplies'); let state = games.initial(role, n);
    let next = games.reduce(role, n, state, 'supply-seal', ''); assert.equal(next.changed, true); assert.equal(games.isSolved(role, n, next.state), false);
    for (let i = 0; i < 5; i++) state = games.reduce(role, n, state, 'supply-toggle', String(i)).state;
    next = games.reduce(role, n, state, 'supply-seal', ''); assert.equal(games.isSolved(role, n, next.state), false); assert.ok(next.message.includes('超重'));
    assert.equal(games.reduce(role, n, state, 'supply-toggle', '99').changed, false);
    const steps = solveActions(games, role, n), almost = steps.slice(0, -1).reduce((s, a) => games.reduce(role, n, s, a.action, a.value).state, games.initial(role, n));
    assert.equal(games.isSolved(role, n, almost), false, 'packing the right supplies still needs the reader to seal');
    let viable = 0;
    for (let mask = 0; mask < 32; mask++) {
      let load = games.initial(role, n);
      for (let i = 0; i < 5; i++) if (mask & (1 << i)) load = games.reduce(role, n, load, 'supply-toggle', String(i)).state;
      load = games.reduce(role, n, load, 'supply-seal', '').state;
      if (games.isSolved(role, n, load)) viable++;
    }
    assert.ok(viable >= 8, 'many real combinations are viable, rather than one cargo answer');
  });
  test('memory slips preserve the known prefix; the optional mnemonic and replay do not complete it', () => {
    const { role, n } = activity('memory'); let state = games.initial(role, n);
    assert.equal(games.reduce(role, n, state, 'memory-press', '0').changed, false);
    state = games.reduce(role, n, state, 'memory-watch', '').state;
    const sequence = games.render(role, n, state).match(/data-ma-watch="([\d,]+)"/)[1].split(',').map(Number);
    assert.equal(games.reduce(role, n, state, 'memory-press', String(sequence[0])).changed, false);
    state = games.reduce(role, n, state, 'memory-ready', '').state;
    state = games.reduce(role, n, state, 'memory-press', String(sequence[0])).state;
    state = games.reduce(role, n, state, 'memory-press', String((sequence[1] + 1) % 4)).state;
    assert.equal(state.payload.mistakes, 1); assert.equal(state.payload.entered.length, 1); assert.equal(games.isSolved(role, n, state), false);
    state = games.reduce(role, n, state, 'memory-mnemonic', '').state;
    assert.equal(state.payload.mnemonic, true); assert.equal(games.isSolved(role, n, state), false);
    state = games.reduce(role, n, state, 'memory-watch', '').state;
    assert.equal(games.sanitize(role, n, plain(state)).payload.entered.length, 1);
    const wrong = { activityId: state.activityId, payload: { phase: 'repeat', entered: Array(sequence.length).fill((sequence[0] + 1) % 4), mistakes: 0 } };
    assert.equal(games.isSolved(role, n, wrong), false);
  });
  test('roads require a continuous path and reject malformed rotations', () => {
    const { role, n, state } = activity('connect');
    assert.equal(games.reduce(role, n, state, 'road-turn', '-1').changed, false);
    assert.equal(games.reduce(role, n, state, 'road-turn', '9').changed, false);
    assert.equal(games.isSolved(role, n, { activityId: state.activityId, payload: { turns: Array(9).fill(1), connected: true } }), false);
    const changed = games.reduce(role, n, state, 'road-turn', '0').state;
    let restored = changed; for (let i = 0; i < 3; i++) restored = games.reduce(role, n, restored, 'road-turn', '0').state;
    assert.deepEqual(plain(restored), plain(state), 'four turns return the same road tile');
  });
  test('fragments swap distinct pieces and cannot be completed by selecting a single piece', () => {
    const { role, n, state } = activity('fragments');
    const picked = games.reduce(role, n, state, 'fragment-select', '0').state;
    assert.equal(picked.payload.selected, 0); assert.equal(games.isSolved(role, n, picked), false);
    const unpicked = games.reduce(role, n, picked, 'fragment-select', '0').state; assert.deepEqual(plain(unpicked), plain(state));
    const broken = { activityId: state.activityId, payload: { order: [0, 0, 0, 0], selected: null } };
    assert.equal(games.isSolved(role, n, broken), false);
  });
  test('archery needs a real shot with both wind compensation and force, not an aimed bow', () => {
    const { role, n, state } = activity('archery');
    const miss = games.reduce(role, n, state, 'shoot', ''); assert.equal(miss.changed, true); assert.equal(games.isSolved(role, n, miss.state), false);
    const solution = solveActions(games, role, n);
    const aimed = solution.slice(0, -1).reduce((s, a) => games.reduce(role, n, s, a.action, a.value).state, state);
    assert.equal(games.isSolved(role, n, aimed), false);
    assert.equal(games.reduce(role, n, state, 'aim-step', '500').changed, false);
    const malformed = { activityId: state.activityId, payload: { aim: 50, power: 99, shots: [{ aim: 999, power: 999, hit: true }] } };
    assert.equal(games.isSolved(role, n, malformed), false);
    let viable = 0;
    for (let aim = -2; aim <= 2; aim++) for (let power = 1; power <= 5; power++) {
      const shot = {activityId:state.activityId,payload:{aim,power,shots:[{aim,power}]}};
      if (games.isSolved(role, n, shot)) viable++;
    }
    assert.ok(viable >= 3, 'the inner ring accepts nearby shots, not just an exact numeric solution');
  });
  test('pairs keep a mismatch visible then close it automatically on the next card; duplicate proofs fail', () => {
    const { role, n, state } = activity('pairs');
    let next = games.reduce(role, n, state, 'pair-flip', '0').state;
    next = games.reduce(role, n, next, 'pair-flip', '1').state;
    assert.equal(next.payload.open.length, 2);
    const flowed = games.reduce(role, n, next, 'pair-flip', '2');
    assert.equal(flowed.changed, true); assert.deepEqual(plain(flowed.state.payload.open), [2]);
    next = games.reduce(role, n, next, 'pair-close', '').state; assert.equal(next.payload.open.length, 0);
    assert.equal(games.reduce(role, n, state, 'pair-flip', '6').changed, false);
    const forged = { activityId: state.activityId, payload: { pairs: [[0, 0], [1, 1], [2, 2]], open: [] } };
    assert.equal(games.isSolved(role, n, forged), false);
  });
}
