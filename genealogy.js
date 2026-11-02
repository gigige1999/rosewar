/* A family register in four leaves. Lines represent kinship, never allegiance. */
window.Genealogy = (() => {
  'use strict';
  const data = window.BOOK_GENEALOGY;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const houses = {plantagenet:'金雀花王室',lancaster:'兰开斯特',york:'约克',neville:'内维尔',beaufort:'博福特',tudor:'都铎',mortimer:'莫蒂默',woodville:'伍德维尔'};
  const running = (left, right) => `<div class="page-running"><span>${left}</span><span>${right}</span></div>`;
  const button = (action, text, extra = '', cls = 'text-button') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  function personNode(id, selected) {
    const person = data.people[id];
    return `<button class="genealogy-person${person.role ? ' genealogy-core' : ''}" data-action="genealogy-person" data-person="${escape(id)}" aria-pressed="${selected === id}" aria-label="${escape(person.name)}${person.role ? '，六位主角之一' : ''}，查看人物关系">${person.role ? '<i aria-hidden="true">✦</i>' : ''}<span class="genealogy-name">${escape(person.name)}</span><small>${escape(person.tag)}</small></button>`;
  }
  function tree(nodes, selected, expanded, path = '', open = true) {
    const overview = !path && nodes.length === 1 && nodes[0].children?.length && !Array.from(expanded || []).some(key => key.includes('-'));
    return `<ul class="${path ? 'genealogy-children' : `genealogy-tree${overview ? ' genealogy-tree-overview' : ''}`}" ${overview ? `style="--family-branches:${nodes[0].children.length}"` : ''} ${open ? '' : 'hidden'}>${nodes.map((node, index) => {
      const branchPath = path ? `${path}-${index}` : String(index);
      const branchOpen = expanded ? expanded.has(branchPath) : !path;
      return `<li class="genealogy-branch" data-branch="${branchPath}">${node.label ? `<p class="genealogy-edge-note">${escape(node.label)}</p>` : ''}<div class="genealogy-node${node.spouse ? ' genealogy-couple' : ''}">${personNode(node.person, selected)}${node.spouse ? `<span class="genealogy-marriage" aria-label="婚姻"><span aria-hidden="true">═</span><small>婚</small></span>${personNode(node.spouse, selected)}` : ''}</div>${node.children?.length ? `${button('genealogy-toggle', branchOpen ? '收起后代 ↑' : `展开分支 · ${node.children.length} 条 ↓`, `data-path="${branchPath}" aria-expanded="${branchOpen}" aria-label="${escape(data.people[node.person].name)}：${branchOpen ? '收起' : '展开'}后代"`, 'genealogy-toggle')}${tree(node.children, selected, expanded, branchPath, branchOpen)}` : ''}</li>`;
    }).join('')}</ul>`;
  }
  function detail(id) {
    const person = data.people[id];
    const portrait = person.role && window.BOOK_ART?.characters?.[person.role];
    const icon = person.role && window.BOOK_DATA.roles.find(role => role.id === person.role)?.symbol || 'feather';
    return `<div class="genealogy-person-heading${portrait ? ' has-portrait' : ''}">${portrait ? `<img class="genealogy-portrait" src="${escape(portrait)}" alt="${escape(person.name)}的肖像">` : `<div class="genealogy-initial" aria-hidden="true">${window.Ornaments.icon(icon)}</div>`}<div><span class="eyebrow">${escape(houses[person.house] || person.house || '家族纪事')}${person.role ? ' · 六位主角之一' : ''}</span><h2 tabindex="-1">${escape(person.name)}</h2><p class="genealogy-years">${escape(person.years)}</p><p class="genealogy-identity">${escape(person.tag)}</p></div></div><p class="genealogy-bio">${escape(person.bio)}</p><section class="genealogy-relations" aria-label="关键亲属关系"><h3>记住这几条关系</h3><ul>${person.relations.map(line => `<li>${escape(line)}</li>`).join('')}</ul></section>${person.seeAlso?.length ? `<nav class="genealogy-crosslinks" aria-label="接着看另一支家族"><span>顺着这条线，再翻一页</span>${person.seeAlso.map(link => button('genealogy-jump', `${escape(link.label)} →`, `data-index="${link.sheet}" data-person="${escape(link.person)}"`)).join('')}</nav>` : ''}${person.role ? button('genealogy-role', `翻开此人的前传 ${window.Ornaments.icon('arrowRight')}`, `data-role="${escape(person.role)}"`, 'primary-button genealogy-read-role') : ''}<p class="genealogy-detail-note">家族图谱可自由翻阅，不影响故事进度。</p>`;
  }
  function navigation(index) {
    return `<nav class="story-pagination genealogy-pagination" aria-label="家族分谱翻页">${button('genealogy-previous','← 前一支',index === 0 ? 'disabled' : '', 'story-page-button')}<span>分谱 ${index + 1} / ${data.sheets.length}</span>${button('genealogy-next','后一支 →',index === data.sheets.length - 1 ? 'disabled' : '', 'story-page-button')}</nav>`;
  }
  function render(index, selected, expanded) {
    const sheet = data.sheets[index];
    return `<section class="page left-page genealogy-map-page" aria-label="家族树">${running('THE FAMILY REGISTER','卷首 · 家族图谱')}<div class="genealogy-heading"><h1 data-reading-heading tabindex="-1">${escape(sheet.title)}</h1><p>${escape(sheet.subtitle)}</p></div><nav class="genealogy-tabs" aria-label="选择家族分谱">${data.sheets.map((item, i) => button('genealogy-sheet', `${String(i + 1).padStart(2,'0')} ${escape(item.title)}`, `data-index="${i}" aria-pressed="${index === i}"`)).join('')}</nav><p class="genealogy-legend"><span>│ 亲子</span><span>═ 婚姻</span><span>✦ 主角</span></p><div class="genealogy-tree-tools"><span>点名字读身世，点支系看子女</span>${button('genealogy-expand-all','展开全部')}${button('genealogy-collapse-all','收起支系')}</div><div class="genealogy-tree-wrap">${tree(sheet.roots, selected, expanded)}</div><div class="genealogy-notes"><p>${escape(sheet.intro)}</p>${sheet.notes.map(note => `<p>${escape(note)}</p>`).join('')}</div>${navigation(index)}<div class="page-number">${['iii','v','vii','ix'][index]}</div></section><section class="page right-page genealogy-person-page" aria-label="人物与亲属关系">${running('NAMES BEHIND THE CROWN','人物 · 关系释读')}${button('genealogy-return-tree','↑ 回到家族树','','text-button genealogy-return-tree')}<div class="genealogy-detail">${detail(selected)}</div><div class="page-number">${['iv','vi','viii','x'][index]}</div></section>`;
  }
  function paths(index, person) {
    const result = new Set();
    const visit = (nodes, parent = '', ancestors = []) => nodes.forEach((node, i) => {
      const path = parent ? `${parent}-${i}` : String(i);
      if (!person && node.children?.length) result.add(path);
      if (person === node.person || person === node.spouse) ancestors.forEach(item => result.add(item));
      if (node.children?.length) visit(node.children, path, [...ancestors, path]);
    });
    visit(data.sheets[index].roots);
    return result;
  }
  function initialPaths(index) { return new Set(data.sheets[index].roots.map((_, i) => String(i))); }
  return { render, detail, tree: (index, selected, expanded) => tree(data.sheets[index].roots, selected, expanded), paths, initialPaths, sheets: data.sheets, people: data.people };
})();
