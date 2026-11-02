/* Reading unlocks are shared; every witness keeps a separate playable manuscript. */
(function (root) {
  'use strict';
  function emptyState() {
    return {
      version: 4, role: null, chapter: 0, completed: [], selections: {},
      legacyCompleted: [], legacyGames: {}, legacyChoices: {}, ending: false, sound: false, mode: null,
      chronicleIndex: 0, chronicleRead: [], fontSize: 'standard', coverLanguage: 'zh', games: {}, storyPages: {},
      readingSides: {}, chronicleSide: 'illustration'
    };
  }
  function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function copy(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  // These are evidence from the retired quiz edition, never answers to the new decisions.
  const OLD_CHOICES = {
    margaret: [null, 'scotland', null, 'unknown', 'tudor', null, 'unfinished'],
    warwick: [null, 'edward', null, 'dead', null, 'union', 'grandson'],
    edward: ['royal_power', null, 'changed', null, 'richard', null, 'resistance'],
    beaufort: [null, 'child', 'brittany', null, 'william', null, 'watchful'],
    richard: ['influence', null, 'edward', null, null, 'niece', 'simnel'],
    elizabeth: ['kinship', 'sequence', null, 'record', 'bloodline', null, null]
  };

  class BookEngine {
    constructor(data, saved) {
      this.data = data && Array.isArray(data.roles) && Array.isArray(data.chapters) ? data : { roles: [], chapters: [] };
      this.state = emptyState();
      this._restore(saved);
    }
    get chapter() { return this.data.chapters[this.state.chapter] || null; }
    get role() { return this.data.roles.find(role => role.id === this.state.role) || null; }
    get game() { return copy(this._gameState(this.state.role, this.state.chapter, true)); }
    get storyPage() { return this.state.storyPages[this.state.role]?.[this.chapter?.id] || 0; }
    get readingSide() { return this.state.readingSides[this.state.role]?.[this.chapter?.id] || 'story'; }
    setReadingSide(side) {
      if (!this.role || !this.chapter || this.state.mode !== 'character' || !this.isUnlocked(this.state.chapter)
          || !['story', 'interaction'].includes(side)) return false;
      this.state.readingSides[this.state.role] ||= {};
      this.state.readingSides[this.state.role][this.chapter.id] = side;
      return true;
    }
    setChronicleSide(side) {
      if (this.state.mode !== 'chronicle' || !['illustration', 'timeline'].includes(side)) return false;
      this.state.chronicleSide = side;
      return true;
    }
    storyPageCount(roleId = this.state.role, index = this.state.chapter) {
      return root.BOOK_STORIES?.[roleId]?.chapters?.[index]?.pages?.length || 1;
    }
    setStoryPage(index) {
      if (!this.role || !this.chapter || this.state.mode !== 'character' || !this.isUnlocked(this.state.chapter)
          || !Number.isInteger(index) || index < 0 || index >= this.storyPageCount()) return false;
      this.state.storyPages[this.state.role] ||= {};
      this.state.storyPages[this.state.role][this.chapter.id] = index;
      return true;
    }
    _validIndex(index) { return Number.isInteger(index) && index >= 0 && index < this.data.chapters.length; }
    _validRole(id) { return this.data.roles.some(role => role.id === id); }
    _gameState(roleId, index, create = false) {
      if (!this._validRole(roleId) || !this._validIndex(index) || !root.RoleGames) return null;
      const chapterId = this.data.chapters[index].id;
      const games = this.state.games[roleId];
      if (games && Object.prototype.hasOwnProperty.call(games, chapterId)) return games[chapterId];
      if (!create) return null;
      const initial = root.RoleGames.initial(roleId, index);
      if (!this.state.games[roleId]) this.state.games[roleId] = {};
      this.state.games[roleId][chapterId] = copy(initial);
      return this.state.games[roleId][chapterId];
    }
    _solved(roleId, index) {
      const state = this._gameState(roleId, index);
      if (!state || !root.RoleGames) return false;
      try { return root.RoleGames.isSolved(roleId, index, copy(state)) === true; }
      catch (_) { return false; }
    }
    _restoreGames(raw, target, api, completedOnly = false) {
      if (!record(raw) || !api) return;
      this.data.roles.forEach(role => {
        if (!record(raw[role.id])) return;
        this.data.chapters.forEach((chapter, index) => {
          if (!Object.prototype.hasOwnProperty.call(raw[role.id], chapter.id)) return;
          try {
            const clean = api.sanitize(role.id, index, copy(raw[role.id][chapter.id]));
            if (!record(clean) || (completedOnly && !api.isSolved(role.id, index, clean))) return;
            if (!target[role.id]) target[role.id] = {};
            target[role.id][chapter.id] = copy(clean);
          } catch (_) { /* One corrupt activity must not discard the rest of the book. */ }
        });
      });
    }
    _legacySolved(roleId, index) {
      const chapter = this.data.chapters[index];
      const state = chapter && this.state.legacyGames[roleId]?.[chapter.id];
      if (!state || !root.HeraldicGames) return false;
      try { return root.HeraldicGames.isSolved(roleId, index, copy(state)) === true; }
      catch (_) { return false; }
    }
    _restoreLegacyChoices(raw, fromGames = false) {
      if (!record(raw)) return;
      this.data.roles.forEach(role => this.data.chapters.forEach((chapter, index) => {
        const old = raw[role.id]?.[chapter.id], expected = OLD_CHOICES[role.id]?.[index];
        if (!record(old) || !expected || old.activityId !== role.id + '-' + index) return;
        const selected = fromGames ? old.payload?.selected : old.selected;
        if (selected !== expected || (fromGames && old.payload?.decisionVersion)) return;
        this.state.legacyChoices[role.id] ||= {};
        this.state.legacyChoices[role.id][chapter.id] = { activityId: old.activityId, selected };
      }));
    }
    decisions(roleId = this.state.role) {
      if (!this._validRole(roleId) || !root.RoleGames) return [];
      return this.data.chapters.flatMap((chapter, index) => {
        const meta = root.RoleGames.meta(roleId, index), state = this._gameState(roleId, index);
        if (meta?.kind !== 'choice' || !state || !this._solved(roleId, index)) return [];
        const option = meta.options.find(item => item.id === state.payload.selected);
        if (!option) return [];
        return [{ index, chapterId: chapter.id, title: meta.title, sceneDate: meta.sceneDate,
          ...copy(option), historical: option.id === meta.historicalChoice, historicalNote: meta.historicalNote }];
      });
    }
    // The original answers are retained only to validate and migrate version-one saves.
    _cleanSelection(chapter, selected) {
      if (!Array.isArray(selected) || !chapter || !chapter.puzzle) return [];
      const puzzle = chapter.puzzle;
      const allowed = new Set((puzzle.options || []).map(option => option.id));
      const clean = [...new Set(selected.filter(id => typeof id === 'string' && allowed.has(id)))];
      return clean.slice(0, puzzle.type === 'choice' ? 1 : puzzle.type === 'pair' ? 2 : allowed.size);
    }
    _matches(chapter, selected) {
      if (!chapter || !chapter.puzzle || !Array.isArray(selected)) return false;
      const puzzle = chapter.puzzle;
      const answer = Array.isArray(puzzle.answer) ? puzzle.answer : [puzzle.answer];
      const allowed = new Set((puzzle.options || []).map(option => option.id));
      if (!answer.length || answer.some(id => typeof id !== 'string' || !allowed.has(id))) return false;
      if (new Set(answer).size !== answer.length || new Set(selected).size !== selected.length) return false;
      if (selected.length !== answer.length) return false;
      if (puzzle.type === 'choice') return answer.length === 1 && selected[0] === answer[0];
      if (puzzle.type === 'pair') return answer.length === 2 && answer.every(id => selected.includes(id));
      if (puzzle.type === 'order') return answer.every((id, index) => id === selected[index]);
      return false;
    }
    _restore(saved) {
      if (typeof saved === 'string') {
        try { saved = JSON.parse(saved); } catch (_) { return; }
      }
      if (!record(saved) || ![1, 2, 3, 4].includes(saved.version)) return;
      this.state.sound = saved.sound === true;
      this.state.fontSize = saved.fontSize === 'large' ? 'large' : 'standard';
      this.state.coverLanguage = saved.coverLanguage === 'en' ? 'en' : 'zh';
      this.state.chronicleSide = saved.chronicleSide === 'timeline' ? 'timeline' : 'illustration';
      if (record(saved.readingSides)) this.data.roles.forEach(role => {
        if (!record(saved.readingSides[role.id])) return;
        this.data.chapters.forEach(chapter => {
          const side = saved.readingSides[role.id][chapter.id];
          if (!['story', 'interaction'].includes(side)) return;
          this.state.readingSides[role.id] ||= {};
          this.state.readingSides[role.id][chapter.id] = side;
        });
      });
      if (record(saved.storyPages)) this.data.roles.forEach(role => {
        if (!record(saved.storyPages[role.id])) return;
        this.data.chapters.forEach((chapter, index) => {
          const page = saved.storyPages[role.id][chapter.id];
          if (!Number.isInteger(page) || page < 0 || page >= this.storyPageCount(role.id, index)) return;
          this.state.storyPages[role.id] ||= {};
          this.state.storyPages[role.id][chapter.id] = page;
        });
      });
      const validRole = this._validRole(saved.role);
      if (saved.version === 1 && !validRole) return;
      this.state.role = validRole ? saved.role : null;
      this.state.mode = saved.version === 1 ? 'character'
        : saved.mode === 'chronicle' ? 'chronicle'
          : saved.mode === 'character' && validRole ? 'character' : null;
      if (saved.version >= 2) {
        this.state.chronicleIndex = this._validIndex(saved.chronicleIndex) ? saved.chronicleIndex : 0;
        this.state.chronicleRead = Array.isArray(saved.chronicleRead)
          ? [...new Set(saved.chronicleRead.filter(index => this._validIndex(index)))].sort((a, b) => a - b) : [];
        // Earlier miniature positions prove reading history, never completion of a new activity.
        this._restoreGames(saved.version === 2 ? saved.games : saved.legacyGames, this.state.legacyGames, root.HeraldicGames, true);
        if (saved.version >= 3) {
          this._restoreGames(saved.games, this.state.games, root.RoleGames);
          this._restoreLegacyChoices(saved.legacyChoices);
          if (saved.version === 3) this._restoreLegacyChoices(saved.games, true);
        }
      }
      const rawSelections = record(saved.selections) ? saved.selections : {};
      const legacy = saved.version === 1 ? saved.completed : saved.legacyCompleted;
      const claimedLegacy = Array.isArray(legacy) ? legacy : [];
      const cleaned = new Map();
      this.data.chapters.forEach(chapter => cleaned.set(chapter.id, this._cleanSelection(chapter, rawSelections[chapter.id])));
      for (const chapter of this.data.chapters) {
        const raw = rawSelections[chapter.id];
        const selection = cleaned.get(chapter.id);
        const intact = Array.isArray(raw) && raw.length === selection.length && raw.every((id, index) => id === selection[index]);
        if (!claimedLegacy.includes(chapter.id) || !intact || !this._matches(chapter, selection)) break;
        this.state.legacyCompleted.push(chapter.id);
      }
      // A saved completion flag is never enough: reconstruct the continuous reading trail.
      for (let index = 0; index < this.data.chapters.length; index++) {
        const chapter = this.data.chapters[index];
        const proven = this.state.legacyCompleted.includes(chapter.id)
          || this.data.roles.some(role => this._solved(role.id, index) || this._legacySolved(role.id, index)
            || this.state.legacyChoices[role.id]?.[chapter.id]);
        if (!proven) break;
        this.state.completed.push(chapter.id);
      }
      const lastUnlocked = Math.max(0, Math.min(this.state.completed.length, this.data.chapters.length - 1));
      this.data.chapters.slice(0, lastUnlocked + 1).forEach(chapter => {
        const selection = cleaned.get(chapter.id);
        if (selection.length) this.state.selections[chapter.id] = selection;
      });
      this.state.chapter = Number.isInteger(saved.chapter) && saved.chapter >= 0 ? Math.min(saved.chapter, lastUnlocked) : 0;
      const lastIndex = this.data.chapters.length - 1;
      this.state.ending = saved.ending === true && this.state.mode === 'character'
        && this.state.completed.length === this.data.chapters.length && this.isComplete(lastIndex);
      if (this.state.ending) this.state.chapter = lastIndex;
    }
    selectRole(id) {
      if (!this._validRole(id)) return false;
      this.state.role = id;
      this.state.mode = 'character';
      this.state.ending = false;
      return true;
    }
    actGame(action, payload) {
      const current = this.game;
      if (!this.role || !this.chapter || this.state.mode !== 'character' || !this.isUnlocked(this.state.chapter) || !root.RoleGames) {
        return { state: current, changed: false, message: '请先翻开一位见证人的手稿。' };
      }
      const result = root.RoleGames.reduce(this.state.role, this.state.chapter, current, action, payload);
      if (!result || !record(result.state)) return { state: current, changed: false, message: '这一笔尚未留下痕迹。' };
      const clean = root.RoleGames.sanitize(this.state.role, this.state.chapter, result.state);
      this.state.games[this.state.role][this.chapter.id] = copy(clean);
      if (this.isComplete() && !this.state.completed.includes(this.chapter.id)) this.state.completed.push(this.chapter.id);
      this.state.ending = false;
      return { state: this.game, changed: result.changed === true, message: typeof result.message === 'string' ? result.message : '' };
    }
    isComplete(index = this.state.chapter) {
      return this._validIndex(index) && this._solved(this.state.role, index);
    }
    isUnlocked(index) {
      return this._validIndex(index) && (index === 0 || this.data.chapters.slice(0, index).every(chapter => this.state.completed.includes(chapter.id)));
    }
    goTo(index) {
      if (!this.isUnlocked(index)) return false;
      this.state.chapter = index;
      this.state.ending = false;
      return true;
    }
    openChronicle(index = this.state.chronicleIndex) {
      if (!this._validIndex(index)) return false;
      this.state.mode = 'chronicle';
      this.state.chronicleIndex = index;
      if (!this.state.chronicleRead.includes(index)) this.state.chronicleRead.push(index);
      this.state.chronicleRead.sort((a, b) => a - b);
      this.state.ending = false;
      return true;
    }
    next() {
      if (this.state.mode !== 'character' || !this.isComplete()) return false;
      if (this.state.chapter < this.data.chapters.length - 1) return this.goTo(this.state.chapter + 1);
      this.state.ending = true;
      return true;
    }
    previous() {
      if (this.state.mode !== 'character') return false;
      if (this.state.ending) return this.goTo(this.state.chapter);
      return this.goTo(this.state.chapter - 1);
    }
    reset() { this.state = emptyState(); return this.serialize(); }
    serialize() { return copy(this.state); }
  }
  root.BookEngine = BookEngine;
})(typeof window !== 'undefined' ? window : globalThis);
