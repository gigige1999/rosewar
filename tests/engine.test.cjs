const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { solveActions: solveMixed } = require('./activities.test.cjs');
const { solveActions: solveOld } = require('./minigames.test.cjs');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['assets/ornaments.js', 'content.js', 'stories-lancaster.js', 'stories-york.js', 'stories-court.js', 'minigames.js', 'activity-data.js', 'mixed-activities.js', 'engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const BookEngine = context.window.BookEngine;
const games = context.window.RoleGames;
const oldGames = context.window.HeraldicGames;
const data = context.window.BOOK_DATA;
const plain = value => JSON.parse(JSON.stringify(value));
const answerOf = chapter => Array.isArray(chapter.puzzle.answer) ? [...chapter.puzzle.answer] : [chapter.puzzle.answer];

function started(roleId = data.roles[0].id, saved) {
  const engine = new BookEngine(data, saved);
  assert.equal(engine.selectRole(roleId), true);
  return engine;
}
function actions(engine) { return solveMixed(games, engine.state.role, engine.state.chapter, engine.game); }
function solve(engine) {
  for (const move of actions(engine)) {
    const result = engine.actGame(move.action, move.value);
    assert.equal(result.changed, true, engine.state.role + ': actual action changes the miniature');
  }
  assert.equal(engine.isComplete(), true);
}
function oldSave(count = 3) {
  return {
    version: 1, role: data.roles[0].id, chapter: count,
    completed: data.chapters.slice(0, count).map(chapter => chapter.id),
    selections: Object.fromEntries(data.chapters.slice(0, count).map(chapter => [chapter.id, answerOf(chapter)])),
    ending: count === data.chapters.length, sound: true
  };
}
function versionTwoSave(count = 3) {
  const role = 'margaret', savedGames = {};
  data.chapters.slice(0, count).forEach((chapter, index) => {
    let state = oldGames.initial(role, index);
    for (const move of solveOld(oldGames, role, index, state)) state = oldGames.reduce(role, index, state, move.action, move.value).state;
    assert.equal(oldGames.isSolved(role, index, state), true);
    savedGames[chapter.id] = plain(state);
  });
  return {
    version: 2, role, chapter: Math.min(count, 6), completed: data.chapters.slice(0, count).map(chapter => chapter.id),
    selections: {}, legacyCompleted: [], games: { [role]: savedGames }, mode: 'character',
    sound: true, fontSize: 'large', ending: count === 7, chronicleIndex: 5, chronicleRead: [0, 3, 5]
  };
}
function firstMultiMoveChapter(role) {
  return data.chapters.findIndex((_, index) => solveMixed(games, role, index).length > 1);
}

test('fresh v4 keeps decisions, migrated evidence and reading modes separate', () => {
  assert.equal(data.roles.length, 6);
  assert.equal(data.chapters.length, 7);
  assert.ok(oldGames && games !== oldGames);
  const engine = new BookEngine(data);
  assert.deepEqual(plain(engine.serialize()), {
    version: 4, role: null, chapter: 0, completed: [], selections: {}, legacyCompleted: [], legacyGames: {}, legacyChoices: {},
    ending: false, sound: false, mode: null, chronicleIndex: 0, chronicleRead: [],
    fontSize: 'standard', coverLanguage: 'zh', games: {}, storyPages: {}, readingSides: {}, chronicleSide: 'illustration'
  });
  assert.equal(engine.game, null);
  assert.equal(engine.next(), false);
  assert.equal(engine.actGame('march', '1').changed, false);
});

test('story leaves retain independent role and chapter bookmarks through refresh', () => {
  let engine = started('margaret', oldSave(7));
  engine.goTo(0);
  assert.equal(engine.storyPageCount(), 2);
  assert.equal(engine.setStoryPage(1), true);
  engine.goTo(1);
  assert.equal(engine.storyPage, 0, 'a new chapter starts at its first story leaf');
  engine.selectRole('edward');
  engine.goTo(0);
  assert.equal(engine.storyPage, 0, 'another witness has an independent bookmark');
  engine.setStoryPage(1);
  engine.selectRole('margaret');
  engine.goTo(1);
  engine = new BookEngine(data, JSON.stringify(engine.serialize()));
  assert.equal(engine.storyPage, 0);
  engine.goTo(0);
  assert.equal(engine.storyPage, 1);
  engine.selectRole('edward');
  assert.equal(engine.storyPage, 1);
  engine.setStoryPage(0);
  engine.selectRole('margaret');
  assert.equal(engine.storyPage, 1);
});

test('turning story leaves never alters activity evidence or unlocks the next chapter', () => {
  const engine = started('edward');
  const option = games.meta('edward', 0).options[0].id;
  engine.actGame('choose-option', option);
  const draft = plain(engine.game);
  assert.equal(engine.setStoryPage(1), true);
  assert.deepEqual(plain(engine.game), draft);
  assert.equal(engine.isComplete(), false);
  assert.equal(engine.isUnlocked(1), false);
  assert.equal(engine.next(), false);
  assert.deepEqual(plain(engine.state.completed), []);
  engine.openChronicle(5);
  assert.equal(engine.setStoryPage(0), false, 'panorama cannot move character story leaves');
  engine.selectRole('edward');
  assert.equal(engine.storyPage, 1);
  assert.deepEqual(plain(engine.game), draft);
});

test('story bookmarks validate positions and migrate older v4 saves without data loss', () => {
  const engine = started('margaret');
  assert.equal(engine.setStoryPage(1), true);
  for (const index of [-1, 2, 3, 1.5, '1', null, NaN]) {
    assert.equal(engine.setStoryPage(index), false);
    assert.equal(engine.storyPage, 1);
  }
  const chapter = data.chapters[0].id;
  for (const invalid of [null, [], '1', 5, { margaret: [] }, { margaret: { [chapter]: '1' } }, { margaret: { [chapter]: 9 } }, { forged: { [chapter]: 1 } }]) {
    const restored = new BookEngine(data, { ...plain(engine.serialize()), storyPages: invalid });
    assert.equal(restored.storyPage, 0);
    assert.deepEqual(plain(restored.state.storyPages), {});
    assert.equal(restored.isUnlocked(1), false);
  }
  const legacy = plain(engine.serialize());
  delete legacy.storyPages;
  legacy.fontSize = 'large'; legacy.coverLanguage = 'en';
  const restored = new BookEngine(data, legacy);
  assert.equal(restored.storyPage, 0);
  assert.equal(restored.state.role, 'margaret');
  assert.equal(restored.state.fontSize, 'large');
  assert.equal(restored.state.coverLanguage, 'en');
  assert.equal(new BookEngine(data).setStoryPage(0), false);
});

test('mobile reading sides survive refresh independently of story pages, role and chapter', () => {
  let engine = started('margaret', oldSave(7));
  engine.goTo(0);
  engine.setStoryPage(1);
  assert.equal(engine.readingSide, 'story');
  assert.equal(engine.setReadingSide('interaction'), true);
  assert.equal(engine.storyPage, 1, 'opening an activity retains the story continuation bookmark');
  engine.goTo(1);
  assert.equal(engine.readingSide, 'story', 'another chapter starts on the story');
  engine.setReadingSide('interaction');
  engine.selectRole('edward');
  assert.equal(engine.readingSide, 'story', 'another witness has an independent side');
  engine = new BookEngine(data, JSON.stringify(engine.serialize()));
  engine.selectRole('margaret');
  assert.equal(engine.readingSide, 'interaction');
  engine.goTo(0);
  assert.equal(engine.readingSide, 'interaction');
  assert.equal(engine.storyPage, 1);
  engine.setReadingSide('story');
  engine.goTo(1);
  assert.equal(engine.readingSide, 'interaction', 'changing one side does not change another chapter');
  engine.openChronicle(4);
  assert.equal(engine.setChronicleSide('timeline'), true);
  assert.equal(engine.setReadingSide('story'), false, 'the panorama cannot rewrite a character side');
  engine = new BookEngine(data, engine.serialize());
  assert.equal(engine.state.chronicleSide, 'timeline');
  engine.selectRole('margaret');
  assert.equal(engine.readingSide, 'interaction');
  assert.equal(engine.setChronicleSide('illustration'), false);
});

test('mobile side bookmarks cannot complete activities or unlock chapters and reject corrupt values', () => {
  const engine = started('edward');
  const option = games.meta('edward', 0).options[0].id;
  engine.actGame('choose-option', option);
  const draft = plain(engine.game);
  assert.equal(engine.setReadingSide('interaction'), true);
  assert.deepEqual(plain(engine.game), draft);
  assert.equal(engine.isComplete(), false);
  assert.equal(engine.isUnlocked(1), false);
  assert.equal(engine.next(), false);
  for (const value of [null, 1, 'left', 'timeline', [], {}, true]) {
    assert.equal(engine.setReadingSide(value), false);
    assert.equal(engine.readingSide, 'interaction');
  }
  const chapter = data.chapters[0].id;
  const corrupted = plain(engine.serialize());
  corrupted.readingSides = { edward: { [chapter]: 'interaction', forged: 'story', [data.chapters[1].id]: 'left' }, forged: { [chapter]: 'interaction' }, margaret: [] };
  corrupted.chronicleSide = 'interaction';
  const restored = new BookEngine(data, corrupted);
  assert.deepEqual(plain(restored.state.readingSides), { edward: { [chapter]: 'interaction' } });
  assert.equal(restored.state.chronicleSide, 'illustration');
  assert.deepEqual(plain(restored.game), draft);
  assert.equal(restored.isUnlocked(1), false);
  assert.equal(restored.isComplete(), false);
  for (const invalid of [null, [], 'interaction', 5, { edward: { [chapter]: null } }]) {
    const recovered = new BookEngine(data, { ...corrupted, readingSides: invalid });
    assert.equal(recovered.readingSide, 'story');
    assert.deepEqual(plain(recovered.state.readingSides), {});
  }
  engine.openChronicle(5);
  for (const value of [null, 'story', 'right', 1, {}]) assert.equal(engine.setChronicleSide(value), false);
  assert.equal(engine.setChronicleSide('timeline'), true);
  assert.deepEqual(plain(engine.state.completed), []);
  assert.equal(engine.isUnlocked(1), false);
  const fresh = new BookEngine(data);
  assert.equal(fresh.setReadingSide('story'), false);
  assert.equal(fresh.setChronicleSide('timeline'), false);
});

test('older v4 saves default to story and illustration without changing their existing bookmarks', () => {
  const engine = started('margaret', oldSave(3));
  engine.setStoryPage(1);
  engine.openChronicle(5);
  const old = plain(engine.serialize());
  delete old.readingSides; delete old.chronicleSide;
  const recovered = new BookEngine(data, old);
  assert.equal(recovered.state.version, 4);
  assert.equal(recovered.readingSide, 'story');
  assert.equal(recovered.state.chronicleSide, 'illustration');
  assert.equal(recovered.storyPage, 1);
  assert.equal(recovered.state.chronicleIndex, 5);
  assert.deepEqual(plain(recovered.state.completed), old.completed);
  assert.deepEqual(plain(recovered.state.games), old.games);
});

for (const role of data.roles) {
  test('seven mixed activities, decision previews, save recovery and ending: ' + role.id, () => {
    let engine = started(role.id);
    let choices = 0, miniatures = 0;
    for (let index = 0; index < data.chapters.length; index++) {
      assert.equal(engine.state.chapter, index);
      assert.equal(engine.isComplete(), false);
      assert.equal(engine.isUnlocked(index), true);
      assert.equal(engine.next(), false);
      assert.equal(engine.goTo(index + 1), false);
      const moves = actions(engine);
      if (moves[0].action === 'choose-option') {
        choices++;
        const historical = games.meta(role.id, index).historicalChoice;
        const markup = games.render(role.id, index, engine.game);
        const alternative = [...markup.matchAll(/data-game-action="choose-option" data-game-value="([^"]+)"/g)].map(match => match[1]).find(id => id !== historical);
        assert.ok(alternative, 'a decision offers an alternative path');
        assert.equal(engine.actGame('choose-option', alternative).changed, true);
        assert.equal(engine.isComplete(), false, 'a preview remains editable until confirmation');
        assert.equal(engine.next(), false);
        engine = new BookEngine(data, JSON.stringify(engine.serialize()));
        assert.equal(engine.isComplete(), false, 'a preview stays editable after refresh');
      } else miniatures++;
      solve(engine);
      assert.equal(engine.state.chapter, index);
      assert.equal(engine.state.completed.length, index + 1);
      const settled = engine.game;
      assert.equal(engine.actGame('reset').changed, false);
      assert.deepEqual(plain(engine.game), plain(settled), 'resolved activity evidence remains stable');
      engine = new BookEngine(data, JSON.stringify(engine.serialize()));
      assert.equal(engine.role.id, role.id);
      assert.equal(engine.state.mode, 'character');
      assert.equal(engine.isComplete(), true);
      assert.equal(engine.next(), true);
    }
    assert.equal(choices, 4, 'each witness has four psychological decisions');
    assert.equal(miniatures, 3, 'each witness has three miniature games');
    assert.equal(engine.state.ending, true);
    engine = new BookEngine(data, engine.serialize());
    assert.equal(engine.state.ending, true);
    assert.equal(engine.previous(), true);
    assert.equal(engine.state.chapter, 6);
    assert.equal(engine.state.ending, false);
    assert.equal(engine.goTo(0), true);
    assert.equal(engine.previous(), false);
  });
}

test('different witnesses retain independent unfinished activities and reading history', () => {
  const role = data.roles[0].id, other = data.roles[1].id;
  const index = firstMultiMoveChapter(role);
  assert.ok(index >= 0);
  let engine = started(role, oldSave(7));
  assert.equal(engine.goTo(index), true);
  const first = actions(engine)[0];
  engine.actGame(first.action, first.value);
  const partial = plain(engine.game);
  engine.selectRole(other);
  assert.equal(engine.state.chapter, index);
  assert.equal(engine.isComplete(), false);
  assert.equal(engine.next(), false);
  const otherActivity = plain(engine.game);
  engine = new BookEngine(data, engine.serialize());
  assert.deepEqual(plain(engine.game), otherActivity);
  engine.selectRole(role);
  assert.deepEqual(plain(engine.game), partial);
  solve(engine);
  assert.equal(engine.state.completed.length, 7);
  engine.selectRole(other);
  assert.equal(engine.isComplete(), false);
  assert.equal(engine.selectRole('forged'), false);
  assert.equal(engine.role.id, other);
});

test('mixed witnesses can unlock one continuous story without duplicating completion entries', () => {
  let engine = started();
  data.chapters.forEach((_, index) => {
    engine.selectRole(data.roles[index % data.roles.length].id);
    solve(engine);
    assert.equal(engine.next(), true);
  });
  engine = new BookEngine(data, engine.serialize());
  assert.equal(engine.state.completed.length, 7);
  assert.equal(engine.state.ending, true);
  const other = data.roles.find(role => role.id !== engine.state.role).id;
  engine.selectRole(other);
  assert.equal(engine.state.chapter, 6);
  assert.equal(engine.state.ending, false);
  assert.equal(engine.isComplete(), false);
  assert.equal(engine.isUnlocked(6), true);
});

test('chronicle reading is free, needs no character and grants no activity unlocks', () => {
  let engine = new BookEngine(data);
  for (const index of [6, 3, 0, 6]) assert.equal(engine.openChronicle(index), true);
  assert.equal(engine.role, null);
  assert.equal(engine.state.mode, 'chronicle');
  assert.equal(engine.state.chronicleIndex, 6);
  assert.deepEqual(plain(engine.state.chronicleRead), [0, 3, 6]);
  assert.equal(engine.state.completed.length, 0);
  assert.equal(engine.isUnlocked(1), false);
  assert.equal(engine.next(), false);
  assert.equal(engine.previous(), false);
  assert.equal(engine.actGame('choose-option', 'a').changed, false);
  engine.state.fontSize = 'large'; engine.state.sound = true;
  engine = new BookEngine(data, JSON.stringify(engine.serialize()));
  assert.equal(engine.state.mode, 'chronicle');
  assert.equal(engine.state.chronicleIndex, 6);
  assert.equal(engine.state.fontSize, 'large');
  assert.equal(engine.state.sound, true);
  assert.deepEqual(plain(engine.state.chronicleRead), [0, 3, 6]);
  engine.selectRole('elizabeth');
  assert.equal(engine.state.chapter, 0);
  assert.equal(engine.state.mode, 'character');
  assert.equal(engine.isComplete(), false);
});

test('chronicle detours preserve unfinished activities and reject game actions', () => {
  const engine = started();
  const before = engine.game;
  engine.openChronicle(5);
  assert.equal(engine.actGame('reset').changed, false);
  engine.selectRole(data.roles[0].id);
  assert.deepEqual(plain(engine.game), plain(before));
  for (const index of [-1, 1.5, '0', NaN, 99]) {
    assert.equal(engine.openChronicle(index), false);
    assert.equal(engine.goTo(index), false);
  }
});

test('version-one answers preserve their reading unlocks but do not solve new activities', () => {
  const saved = oldSave(3); saved.chapter = 6;
  let engine = new BookEngine(data, saved);
  assert.equal(engine.state.version, 4);
  assert.equal(engine.state.mode, 'character');
  assert.equal(engine.state.chapter, 3);
  assert.equal(engine.state.sound, true);
  assert.deepEqual(plain(engine.state.completed), plain(saved.completed));
  assert.deepEqual(plain(engine.state.legacyCompleted), plain(saved.completed));
  assert.equal(engine.isUnlocked(3), true);
  assert.equal(engine.isUnlocked(4), false);
  assert.equal(engine.isComplete(0), false);
  assert.equal(engine.next(), false);
  engine = new BookEngine(data, engine.serialize());
  assert.deepEqual(plain(engine.state.completed), plain(saved.completed));
  assert.equal(engine.state.chapter, 3);
  solve(engine);
  engine = new BookEngine(data, engine.serialize());
  assert.equal(engine.isComplete(), true);
  assert.equal(engine.state.completed.length, 4);
});

test('version-two miniatures migrate into validated reading evidence, never new completion', () => {
  const saved = versionTwoSave(4);
  let engine = new BookEngine(data, saved);
  assert.equal(engine.state.version, 4);
  assert.equal(engine.state.chapter, 4);
  assert.equal(engine.state.sound, true);
  assert.equal(engine.state.fontSize, 'large');
  assert.equal(engine.state.chronicleIndex, 5);
  assert.deepEqual(plain(engine.state.chronicleRead), [0, 3, 5]);
  assert.deepEqual(plain(engine.state.completed), plain(saved.completed));
  assert.deepEqual(plain(engine.state.games), {});
  assert.deepEqual(plain(engine.state.legacyGames), saved.games);
  for (let index = 0; index < 4; index++) assert.equal(engine.isComplete(index), false);
  engine = new BookEngine(data, JSON.stringify(engine.serialize()));
  assert.equal(engine.state.chapter, 4);
  assert.equal(engine.state.completed.length, 4);
  solve(engine);
  engine = new BookEngine(data, engine.serialize());
  assert.equal(engine.isComplete(), true);
  assert.equal(engine.state.completed.length, 5);
});

test('an old completed edition retains every page and opens the new final activity', () => {
  for (const saved of [oldSave(7), versionTwoSave(7)]) {
    const engine = new BookEngine(data, saved);
    assert.equal(engine.state.chapter, 6);
    assert.equal(engine.state.ending, false);
    assert.equal(engine.state.completed.length, 7);
    assert.equal(engine.isUnlocked(6), true);
    assert.equal(engine.isComplete(), false);
    solve(engine);
    assert.equal(engine.next(), true);
    assert.equal(engine.state.ending, true);
  }
});

test('legacy answers and previous-game evidence must survive validation after every refresh', () => {
  const corrupt = oldSave(4); corrupt.selections[data.chapters[1].id].reverse(); corrupt.ending = true;
  const recovered = new BookEngine(data, corrupt);
  assert.deepEqual(plain(recovered.state.completed), [data.chapters[0].id]);
  assert.equal(recovered.state.chapter, 1);
  assert.equal(recovered.state.ending, false);
  const extra = oldSave(3); extra.selections[data.chapters[0].id].push('forged');
  assert.equal(new BookEngine(data, extra).state.completed.length, 0);
  const old = versionTwoSave(4); old.games.margaret[data.chapters[0].id] = { path: [15, 4], solved: true };
  assert.equal(new BookEngine(data, old).state.completed.length, 0);
  const v3 = new BookEngine(data, versionTwoSave(4)).serialize();
  v3.legacyGames.margaret[data.chapters[0].id] = { solved: true };
  assert.equal(new BookEngine(data, v3).state.completed.length, 0);
});

test('forged arrays, wrong activity identity and solved-only payloads do not unlock chapters', () => {
  const saved = started().serialize();
  saved.completed = data.chapters.map(chapter => chapter.id); saved.chapter = 6; saved.ending = true;
  saved.games = Object.fromEntries(data.roles.map(role => [role.id, Object.fromEntries(data.chapters.map(chapter => [chapter.id, { activityId: 'forged', payload: { solved: true, count: 3 } }]))]));
  saved.legacyGames = saved.games;
  saved.games.forged = { anything: { solved: true } };
  const engine = new BookEngine(data, saved);
  assert.equal(engine.state.chapter, 0);
  assert.equal(engine.state.completed.length, 0);
  assert.equal(engine.state.ending, false);
  assert.equal(engine.state.games.forged, undefined);
  data.roles.forEach(role => { engine.selectRole(role.id); assert.equal(engine.isComplete(), false); });
  const genuine = started(); solve(genuine);
  const wrongIdentity = genuine.serialize();
  wrongIdentity.games[genuine.state.role][data.chapters[0].id].activityId = 'another-person-another-chapter';
  assert.equal(new BookEngine(data, wrongIdentity).state.completed.length, 0);
});

test('malformed saves and invalid preferences normalize safely', () => {
  for (const saved of [null, undefined, true, 3, [], 'invalid JSON', '{}', { version: 20 }]) {
    const engine = new BookEngine(data, saved);
    assert.equal(engine.state.role, null); assert.equal(engine.state.chapter, 0); assert.equal(engine.state.completed.length, 0);
  }
  const saved = { version: 3, role: 'forged', mode: 'character', chapter: -1, completed: null, games: [], legacyGames: [],
    selections: [], legacyCompleted: ['forged'], sound: 'yes', ending: true, fontSize: 'enormous',
    chronicleIndex: 100, chronicleRead: [6, 6, 2, '3', -1, 100] };
  const engine = new BookEngine(data, saved);
  assert.equal(engine.state.role, null); assert.equal(engine.state.mode, null); assert.equal(engine.state.sound, false);
  assert.equal(engine.state.fontSize, 'standard'); assert.equal(engine.state.ending, false); assert.equal(engine.state.chronicleIndex, 0);
  assert.deepEqual(plain(engine.state.chronicleRead), [2, 6]);
  assert.equal(new BookEngine(null).openChronicle(), false);
});

test('game and serialized snapshots are independent; reset clears both new and legacy evidence', () => {
  const engine = started(data.roles[0].id, versionTwoSave(3));
  const actual = plain(engine.game), altered = engine.game;
  altered.activityId = 'changed';
  const saved = engine.serialize(); saved.games = {}; saved.legacyGames = {}; saved.completed.push(data.chapters[6].id);
  assert.deepEqual(plain(engine.game), actual);
  assert.equal(engine.state.completed.length, 3);
  engine.openChronicle(6); engine.state.fontSize = 'large'; engine.state.sound = true;
  assert.deepEqual(plain(engine.reset()), plain(new BookEngine(data).serialize()));
});

test('all 72 decisions accept confirmation, preserve distinct consequences and remain private to each witness', () => {
  let variants = 0;
  for (const role of data.roles) for (let index = 0; index < 7; index++) {
    const meta = games.meta(role.id, index);
    if (meta.kind !== 'choice') continue;
    assert.equal(new Set(meta.options.map(option => option.consequence)).size, 3);
    for (const option of meta.options) {
      let engine = started(role.id, oldSave(7));
      engine.goTo(index);
      assert.equal(engine.actGame('decision-confirm', '').changed, false, 'no silent default decision');
      engine.actGame('choose-option', option.id);
      assert.equal(engine.isComplete(), false);
      assert.equal(engine.decisions().length, 0, 'an unconfirmed intention is not a recorded outcome');
      engine = new BookEngine(data, engine.serialize());
      engine.actGame('decision-confirm', '');
      assert.equal(engine.isComplete(), true, 'every viable decision advances the book');
      engine = new BookEngine(data, engine.serialize());
      const entries = engine.decisions();
      assert.equal(entries.length, 1);
      assert.equal(entries[0].id, option.id);
      assert.equal(entries[0].consequence, option.consequence);
      assert.equal(entries[0].historical, option.id === meta.historicalChoice);
      assert.ok(entries[0].echo && entries[0].historicalNote);
      entries[0].consequence = 'mutated';
      assert.equal(engine.decisions()[0].consequence, option.consequence);
      assert.equal(engine.next(), true);
      engine.selectRole(data.roles.find(other => other.id !== role.id).id);
      assert.equal(engine.decisions().length, 0);
      variants++;
    }
  }
  assert.equal(variants, 72);
});

test('v3 quiz evidence keeps old reading unlocks without inventing new decisions', () => {
  const oldAnswers = [null, 'scotland', null, 'unknown', 'tudor', null, 'unfinished'];
  const engine = started();
  const saved = engine.serialize(); saved.version = 3; saved.chapter = 6; saved.ending = true;
  saved.games.margaret = {};
  for (let index = 0; index < 7; index++) {
    let activity = games.initial('margaret', index);
    if (oldAnswers[index]) activity = { activityId: 'margaret-' + index, payload: { selected: oldAnswers[index] } };
    else for (const move of solveMixed(games, 'margaret', index, activity)) activity = games.reduce('margaret', index, activity, move.action, move.value).state;
    saved.games.margaret[data.chapters[index].id] = plain(activity);
  }
  let migrated = new BookEngine(data, saved);
  assert.equal(migrated.state.version, 4);
  assert.equal(migrated.state.chapter, 6);
  assert.equal(migrated.state.completed.length, 7);
  assert.equal(migrated.state.ending, false);
  assert.equal(migrated.decisions().length, 0);
  for (const index of [1, 3, 4, 6]) assert.equal(migrated.isComplete(index), false);
  migrated = new BookEngine(data, migrated.serialize());
  assert.equal(migrated.state.completed.length, 7, 'migration proof survives future reloads');
  assert.equal(migrated.state.chapter, 6);
  const forged = plain(saved); forged.games.margaret[data.chapters[1].id].payload.selected = 'invented';
  assert.equal(new BookEngine(data, forged).state.completed.length, 1);
});

test('cover language is a validated preference independent of reading language and mode', () => {
  const engine = started('warwick');
  engine.state.coverLanguage = 'en'; engine.openChronicle(3);
  const restored = new BookEngine(data, engine.serialize());
  assert.equal(restored.state.coverLanguage, 'en');
  assert.equal(restored.state.mode, 'chronicle');
  assert.equal(restored.state.chronicleIndex, 3);
  const saved = restored.serialize(); saved.coverLanguage = 'invalid';
  assert.equal(new BookEngine(data, saved).state.coverLanguage, 'zh');
});
