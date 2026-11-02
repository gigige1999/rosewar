/* Shared picture frames for the user's local chapter paintings. */
(() => {
  const keys = ['01-st-albans', '02-towton', '03-barnet', '04-tower', '05-bosworth', '06-union', '07-stoke'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function render(index, label = '') {
    const src = window.BOOK_ART?.chapters?.[keys[index]];
    const title = label.replace(/\s*·\s*预留图版/g, '') || '章节图版';
    return `<div class="art-reserve${src ? ' has-art' : ''}" role="img" aria-label="${escape(title)}" data-art-slot="${keys[index]}"><span class="art-reserve-label">ILLUMINATION &nbsp; · &nbsp; ${String(index + 1).padStart(2, '0')}</span>${src ? `<img src="${escape(src)}" alt="${escape(title)}" decoding="async">` : ''}</div>`;
  }
  window.ArtFrames = { render };
})();
