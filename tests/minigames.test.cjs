const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const project = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
const roleIds = ['margaret', 'warwick', 'edward', 'beaufort', 'richard', 'elizabeth'];

function loadGames() {
  const context = vm.createContext({ window: {} });
  for (const filename of ['assets/ornaments.js', 'minigames.js']) vm.runInContext(fs.readFileSync(path.join(project, filename), 'utf8'), context);
  return context.window.RoleGames;
}

// This helper deliberately lives only in tests. Every solution executes the same
// public actions as the reader; no completion counters or game internals are set.
function solveActions(games, role, index, suppliedState) {
  let state = suppliedState || games.initial(role, index);
  const actions = [];
  const act = (action, value) => {
    const result = games.reduce(role, index, state, action, value);
    assert.equal(result.changed, true, `${role}/${index}: ${action} must do useful work`);
    state = result.state; actions.push({ action, value });
  };
  if (games.isSolved(role, index, state)) return actions;
  if (role === 'margaret' || role === 'richard') {
    const name = role === 'margaret' ? 'march' : 'leap', size = role === 'margaret' ? 20 : 16;
    const queue = [{ state, actions: [] }], seen = new Set([state.path.at(-1)]);
    while (queue.length) {
      const candidate = queue.shift();
      for (let value = 0; value < size; value++) {
        if (seen.has(value)) continue;
        const next = games.reduce(role, index, candidate.state, name, String(value));
        if (!next.changed) continue;
        const history = [...candidate.actions, { action: name, value: String(value) }];
        if (games.isSolved(role, index, next.state)) return history;
        seen.add(value); queue.push({ state: next.state, actions: history });
      }
    }
    throw new Error(`${role}/${index}: route is not solvable`);
  }
  if (role === 'warwick') {
    [0, 1, 2].forEach(i => { act('seal-select', String(i)); act('seal-place', i === 2 ? 'right' : 'left'); });
  } else if (role === 'edward') {
    for (let ring = 0; ring < 3; ring++) {
      while (state.rings[ring] !== 0) act('rotate', ring + ':' + (state.rings[ring] <= 3 ? '-1' : '1'));
    }
  } else if (role === 'beaufort') {
    const marks = Array.from(games.render(role, index, state).matchAll(/data-rg-x="([\d.]+)" data-rg-y="([\d.]+)"/g));
    assert.equal(marks.length, 3);
    for (const match of marks) act('candle-move', { x: Number(match[1]), y: Number(match[2]) });
  } else if (role === 'elizabeth') {
    const threads = Array.from(games.render(role, index, state).matchAll(/data-game-action="weave" data-game-value="(\d+)"[^>]*aria-label="[^"]*当前(红线|白线)，纹样应为(红线|白线)/g));
    assert.equal(threads.length, 20);
    for (const match of threads) if (match[2] !== match[3]) act('weave', match[1]);
  }
  assert.equal(games.isSolved(role, index, state), true, `${role}/${index}: solution must match actual board`);
  return actions;
}

module.exports = { loadGames, solveActions, roleIds };

if (require.main === module) {
  const games = loadGames();
  for (const role of roleIds) {
    for (let chapter = 0; chapter < 7; chapter++) {
      test(`${role} / chapter ${chapter + 1}: play, refresh, solve and keep solved state`, () => {
        let state = games.initial(role, chapter);
        assert.equal(games.isSolved(role, chapter, state), false, 'every chapter begins with an unfinished board');
        assert.equal(games.isSolved(role, chapter, { solved: true, count: 99, found: [0, 1, 2] }), false);
        const actions = solveActions(games, role, chapter, state);
        assert.ok(actions.length >= 2 && actions.length <= 24, 'the chapter stays a short, playable vignette');
        for (const { action, value } of actions) {
          const before = plain(state);
          const next = games.reduce(role, chapter, state, action, value);
          assert.deepEqual(plain(state), before, 'reducers do not mutate the saved state');
          assert.equal(next.changed, true);
          state = games.sanitize(role, chapter, plain(next.state));
          assert.deepEqual(plain(state), plain(next.state), 'refresh preserves every legal move');
        }
        assert.equal(games.isSolved(role, chapter, state), true);
        assert.equal(games.reduce(role, chapter, state, 'reset', '').changed, false, 'solved evidence remains stable');
        assert.ok(games.render(role, chapter, state).includes('rg-solved'));
      });
    }
  }

  test('route games reject teleportation and recover only the legal prefix of a save', () => {
    for (const role of ['margaret', 'richard']) {
      const fresh = games.initial(role, 0), action = role === 'margaret' ? 'march' : 'leap';
      const goal = role === 'margaret' ? 4 : 3;
      assert.equal(games.reduce(role, 0, fresh, action, String(goal)).changed, false);
      assert.equal(games.reduce(role, 0, fresh, action, '-1').changed, false);
      assert.equal(games.reduce(role, 0, fresh, action, '999').changed, false);
      assert.equal(games.reduce(role, 0, fresh, action, 'not-a-number').changed, false);
      assert.deepEqual(plain(games.sanitize(role, 0, { path: [...fresh.path, goal] })), plain(fresh));
      const legal = solveActions(games, role, 0)[0];
      const first = games.reduce(role, 0, fresh, legal.action, legal.value).state;
      const corrupted = { path: [...first.path, 999, goal] };
      assert.deepEqual(plain(games.sanitize(role, 0, corrupted)), plain(first));
      const undo = games.reduce(role, 0, first, 'undo', '');
      assert.equal(undo.changed, true); assert.deepEqual(plain(undo.state), plain(fresh));
      assert.equal(games.reduce(role, 0, fresh, 'undo', '').changed, false);
    }
  });

  test('scale requires all distinct seals in actual balance and can move a placed seal', () => {
    let state = games.initial('warwick', 0);
    assert.equal(games.isSolved('warwick', 0, state), false, 'an empty balance is not completion');
    assert.equal(games.reduce('warwick', 0, state, 'seal-place', 'left').changed, false);
    assert.equal(games.reduce('warwick', 0, state, 'seal-select', '3').changed, false);
    assert.equal(games.reduce('warwick', 0, state, 'seal-place', { index: -1, side: 'left' }).changed, false);
    for (let index = 0; index < 3; index++) state = games.reduce('warwick', 0, state, 'seal-place', { index, side: 'left' }).state;
    assert.equal(games.isSolved('warwick', 0, state), false);
    state = games.reduce('warwick', 0, state, 'seal-place', { index: 2, side: 'right' }).state;
    assert.equal(games.isSolved('warwick', 0, state), true);
    assert.equal(games.isSolved('warwick', 0, { places: [1, 1, 1], balanced: true }), false);
    assert.deepEqual(plain(games.sanitize('warwick', 0, { places: [1, 2, 3], selected: 10 })), plain(games.initial('warwick', 0)));
  });

  test('sun rings couple, reverse exactly, and validate all three actual angles', () => {
    const fresh = games.initial('edward', 0), next = games.reduce('edward', 0, fresh, 'rotate', '0:1').state;
    assert.equal(next.rings[0], (fresh.rings[0] + 1) % 6);
    assert.equal(next.rings[1], (fresh.rings[1] + 1) % 6);
    assert.equal(next.rings[2], fresh.rings[2]);
    const reversed = games.reduce('edward', 0, next, 'rotate', '0:-1').state;
    assert.deepEqual(plain(reversed.rings), plain(fresh.rings));
    assert.equal(games.reduce('edward', 0, fresh, 'rotate', '9:1').changed, false);
    assert.equal(games.reduce('edward', 0, fresh, 'rotate', '0:6').changed, false);
    assert.equal(games.isSolved('edward', 0, { rings: [0, 0, 2], turns: 999 }), false);
    assert.equal(games.isSolved('edward', 0, { rings: [0, 0, 6] }), false);
  });

  test('secret letter requires three different illuminated locations, not three clicks', () => {
    let state = games.initial('beaufort', 0);
    const actions = solveActions(games, 'beaufort', 0);
    state = games.reduce('beaufort', 0, state, actions[0].action, actions[0].value).state;
    const again = games.reduce('beaufort', 0, state, actions[0].action, actions[0].value);
    assert.equal(again.changed, false); assert.equal(again.state.illuminations.length, 1);
    assert.equal(games.isSolved('beaufort', 0, again.state), false);
    assert.equal(games.reduce('beaufort', 0, state, 'candle-move', { x: -10, y: 10 }).changed, false);
    const forged = { candle: { x: 50, y: 50 }, illuminations: [{ id: 0, x: 0, y: 0 }, { id: 1, x: 0, y: 0 }, { id: 2, x: 0, y: 0 }] };
    assert.equal(games.sanitize('beaufort', 0, forged).illuminations.length, 0);
    const duplicate = { ...state, illuminations: Array(3).fill(state.illuminations[0]) };
    assert.equal(games.sanitize('beaufort', 0, duplicate).illuminations.length, 1);
    assert.equal(games.isSolved('beaufort', 0, duplicate), false);
  });

  test('secret letter is completely playable with keyboard movement alone', () => {
    for (let chapter = 0; chapter < 7; chapter++) {
      let state = games.initial('beaufort', chapter);
      // Sweep the writing in rows using ten-percent arrow-key steps.
      for (let i = 0; i < 10; i++) state = games.reduce('beaufort', chapter, state, 'candle-step', 'left').state;
      for (let i = 0; i < 10; i++) state = games.reduce('beaufort', chapter, state, 'candle-step', 'up').state;
      for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 10; col++) state = games.reduce('beaufort', chapter, state, 'candle-step', row % 2 ? 'left' : 'right').state;
        state = games.reduce('beaufort', chapter, state, 'candle-step', 'down').state;
      }
      assert.equal(games.isSolved('beaufort', chapter, state), true, `keyboard sweep finds chapter ${chapter + 1} marks`);
    }
  });

  test('weaving changes threads, leaves frame and heart fixed, and begins with four to six repairs', () => {
    for (let chapter = 0; chapter < 7; chapter++) {
      const fresh = games.initial('elizabeth', chapter), actions = solveActions(games, 'elizabeth', chapter);
      assert.ok(actions.length >= 4 && actions.length <= 6);
      assert.equal(games.reduce('elizabeth', chapter, fresh, 'weave', '0').changed, false);
      assert.equal(games.reduce('elizabeth', chapter, fresh, 'weave', '12').changed, false);
      assert.equal(games.reduce('elizabeth', chapter, fresh, 'weave', '25').changed, false);
      const changed = games.reduce('elizabeth', chapter, fresh, actions[0].action, actions[0].value).state;
      const reversed = games.reduce('elizabeth', chapter, changed, actions[0].action, actions[0].value).state;
      assert.deepEqual(plain(reversed), plain(fresh));
      assert.deepEqual(plain(games.sanitize('elizabeth', chapter, { cells: Array(25).fill(0) })), plain(fresh));
    }
  });

  test('all actions reject unknown payloads; reset and sanitization stay deterministic', () => {
    for (const role of roleIds) {
      const fresh = games.initial(role, 0);
      assert.equal(games.reduce(role, 0, fresh, 'not-an-action', { solved: true }).changed, false);
      for (const broken of [null, undefined, false, [], 'saved', { solved: true }]) assert.deepEqual(plain(games.sanitize(role, 0, broken)), plain(fresh));
      const first = solveActions(games, role, 0)[0];
      const progressed = games.reduce(role, 0, fresh, first.action, first.value).state;
      const reset = games.reduce(role, 0, progressed, 'reset', '');
      assert.equal(reset.changed, true); assert.deepEqual(plain(reset.state), plain(fresh));
      const html = games.render(role, 0, fresh, { hint: true });
      assert.ok(html.includes('data-game-action=')); assert.ok(html.includes('aria-label=')); assert.ok(html.includes('rg-hint'));
      assert.ok(!html.includes('<script'));
    }
    assert.equal(games.meta('unknown'), null);
    assert.equal(games.render('unknown', 0, {}), '');
    assert.equal(games.isSolved('unknown', 0, { solved: true }), false);
  });
}
