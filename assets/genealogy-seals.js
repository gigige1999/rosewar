/* Original manuscript-style reading symbols, not reconstructed portraits or arms. */
window.GenealogySeals = (() => {
  'use strict';

  const kings = new Set(['edward3', 'henry4', 'henry5', 'henry6', 'edward4', 'richard3', 'henry7', 'henry8']);
  const queens = new Set(['margaretAnjou', 'elizabethWoodville', 'elizabethYork', 'anneNeville']);
  const young = new Set(['edwardWestminster', 'edward5', 'richardShrewsbury', 'edwardWarwick', 'edwardMiddleham', 'arthur']);
  const matrons = new Set(['margaretBeaufort', 'cecily', 'joanBeaufort', 'katherine']);

  const face = '<path d="M16 21v5c0 5 3 8 6 8s6-3 6-8v-5"/><path d="M19 25h.4m5.2 0h.4M22 26v3h1m-3 2h4" stroke-width=".8"/>';
  const shoulders = '<path d="M11 47v-5c0-5 5-8 8-9l3 4 3-4c3 1 8 4 8 9v5" fill="currentColor" fill-opacity=".11"/><path d="m17 35 5 12 5-12M22 38v9"/><path d="m13 42 3 5m13-5 2 5" opacity=".4"/>';
  const drapedShoulders = '<path d="M10 47c0-5 3-9 7-12h10c4 3 7 7 7 12" fill="currentColor" fill-opacity=".13"/><path d="m16 37 6 7 6-7m-6 7v3M13 42l3 5m15-5-3 5"/>';
  const crown = '<path d="m14 18-1-7 5 4 4-7 4 7 5-4-1 7Z" fill="currentColor" fill-opacity=".2"/><path d="M14 20h16M22 10v2"/>';
  const variants = {
    king: `${shoulders}<path d="M15 21c-2 4-2 8-1 12m15-12c2 4 2 8 1 12"/>${face}${crown}<path d="m19 32 3 3 3-3"/>`,
    queen: `${drapedShoulders}<path d="M15 19c-3 6-4 13-4 20l6-4m12-16c3 6 4 13 4 20l-6-4" fill="currentColor" fill-opacity=".09"/>${face}${crown}`,
    lord: `${shoulders}<path d="M14 23c-1 5-1 7 1 10m14-10c1 5 1 7-1 10"/>${face}<path d="M13 22v-5c2-4 14-6 17-2l1 7Z" fill="currentColor" fill-opacity=".19"/><path d="m13 19 17-2M17 15l2 3"/>`,
    lady: `${drapedShoulders}<path d="M12 36V22c0-7 4-12 10-12s10 5 10 12v14l-5-3m-10 0-5 3" fill="currentColor" fill-opacity=".1"/>${face}<path d="m15 22 7-7 7 7M22 12v3M14 29v7m16-7v7"/>`,
    youth: '<path d="M12 47v-4c0-5 5-8 10-8s10 3 10 8v4" fill="currentColor" fill-opacity=".11"/><path d="m17 36 5 5 5-5m-5 5v6M15 23v6c0 5 3 8 7 8s7-3 7-8v-6"/><path d="M13 27V21c0-5 4-8 9-8s9 3 9 8v6l-3-4-2-6-4 5-5-3-1 6Z" fill="currentColor" fill-opacity=".16"/><path d="M18 27h.4m6.8 0h.4M22 28v3m-2 2h4" stroke-width=".8"/><path d="m15 43 2 4m12-4-2 4" opacity=".4"/>',
    matron: `${drapedShoulders}<path d="M10 39 12 20c1-7 5-10 10-10s9 3 10 10l2 19-7-4H17Z" fill="currentColor" fill-opacity=".13"/><path d="M14 22c0-5 3-9 8-9s8 4 8 9l-2 8-6 8-6-8Z"/>${face}<path d="m16 33 6 7 6-7M12 24l-1 11m21-11 1 11"/>`
  };

  function portrait(id) {
    const gender = window.BOOK_GENEALOGY_GUIDE?.gender?.[id];
    const variant = kings.has(id) ? 'king' : queens.has(id) ? 'queen' : young.has(id) ? 'youth' : matrons.has(id) ? 'matron' : gender === 'female' ? 'lady' : 'lord';
    return `<svg class="genealogy-seal-portrait" data-seal="${variant}" viewBox="0 0 44 54" fill="none" stroke="currentColor" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 50V23C3 11 11 3 22 3s19 8 19 20v27Z" fill="currentColor" fill-opacity=".035" opacity=".75"/><path d="M5.5 48V23C5.5 12.5 12.5 5.5 22 5.5S38.5 12.5 38.5 23V48Z" stroke-width=".5" opacity=".38"/>${variants[variant]}<path d="M9 47h26M17 50h10" stroke-width=".65" opacity=".55"/></svg>`;
  }

  const petals = (fill = 'none', opacity = '1') => Array.from({ length: 5 }, (_, i) => `<path d="M12 12C7 10 6 5 9 3c2-1 5-1 6 1 3 3 0 6-3 8Z" transform="rotate(${i * 72} 12 12)" fill="${fill}" fill-opacity="${opacity}"/>`).join('');
  const rose = (solid = false) => `${petals(solid ? 'currentColor' : 'var(--seal-paper, #eee3c9)', solid ? '.32' : '1')}<circle cx="12" cy="12" r="3" fill="currentColor" fill-opacity=".15"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>`;
  const marks = {
    lancaster: rose(true),
    york: rose(false),
    tudor: `${petals('currentColor', '.32')}<g transform="translate(5.4 5.4) scale(.55)">${rose(false)}</g>`,
    neville: '<path d="M4 3h16v9c0 5-4 8-8 10-4-2-8-5-8-10Z" fill="currentColor" fill-opacity=".06"/><path d="m6 5 12 13M18 5 6 18" stroke-width="2.2"/><path d="m6 5 12 13M18 5 6 18" stroke="var(--seal-paper, #eee3c9)" stroke-width=".65"/>',
    beaufort: '<path d="M5 7h14v11H5ZM5 11h14M5 15h14M8 7v14m4-14v14m4-14v14M3 8v10m18-10v10"/><path d="m5 7-1-4 4 2 4-3 4 3 4-2-1 4" fill="currentColor" fill-opacity=".16"/>',
    plantagenet: '<path d="M8 21 15 4M11 14 5 10m8 0 6-3m-9 10 8-3"/><path d="M5 10C2 8 3 5 6 6c3-1 4 2 2 4Zm13-3c-2-3 1-5 3-3 3 1 2 4-1 4ZM17 15c-1-3 2-5 4-3 2 2 0 4-2 4ZM14 5c-3-1-2-4 0-4 3-1 4 2 2 4Z" fill="currentColor" fill-opacity=".18"/>',
    mortimer: '<path d="M4 3h16v9c0 5-4 8-8 10-4-2-8-5-8-10Z" fill="currentColor" fill-opacity=".06"/><path d="M4 7h16M4 11h16M6 16h12" stroke-width="2"/><path d="M9 3v5h6V3" fill="var(--seal-paper, #eee3c9)"/>',
    woodville: '<path d="M7 21 18 4M11 15C3 16 3 9 5 7c5 0 8 4 6 8Zm3-5c-1-5 3-7 7-7 1 5-2 8-7 7ZM8 19c4-5 8-4 11-2-2 4-7 6-11 2Z" fill="currentColor" fill-opacity=".12"/><path d="m6 9 4 5m6-6 3-3m-8 13 5-1" stroke-width=".65"/>'
  };

  function mark(house) {
    return `<svg class="genealogy-seal-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${marks[house] || marks.plantagenet}</svg>`;
  }

  return { portrait, mark };
})();
