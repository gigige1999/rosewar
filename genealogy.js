/* A family register in four leaves. Lines represent kinship, never allegiance. */
window.Genealogy = (() => {
  'use strict';
  const data = window.BOOK_GENEALOGY;
  const guide = window.BOOK_GENEALOGY_GUIDE;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const houses = {plantagenet:'金雀花王室',lancaster:'兰开斯特',york:'约克',neville:'内维尔',beaufort:'博福特',tudor:'都铎',mortimer:'莫蒂默',woodville:'伍德维尔'};
  const running = (left, right) => `<div class="page-running"><span>${left}</span><span>${right}</span></div>`;
  const button = (action, text, extra = '', cls = 'text-button') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  function personNode(id, selected, relation = '') {
    const person = data.people[id];
    return `<button class="genealogy-person${person.role ? ' genealogy-core' : ''}" data-action="genealogy-person" data-person="${escape(id)}" aria-pressed="${selected === id}" aria-label="${escape(person.name)}${person.role ? '，六位主角之一' : ''}，查看人物关系">${person.role ? '<i aria-hidden="true">✦</i>' : ''}${relation ? `<span class="genealogy-kin-label">${escape(relation)}</span>` : ''}<span class="genealogy-name">${escape(person.name)}</span><small>${escape(person.tag)}</small></button>`;
  }
  const family = Object.fromEntries(Object.keys(data.people).map(id => [id, { parents: new Set(), spouses: new Set(), children: new Set() }]));
  function indexFamily(nodes, parents = []) {
    nodes.forEach(node => {
      parents.forEach(parent => { family[node.person].parents.add(parent); family[parent].children.add(node.person); });
      if (node.spouse) { family[node.person].spouses.add(node.spouse); family[node.spouse].spouses.add(node.person); }
      if (node.children) indexFamily(node.children, [node.person, ...(node.spouse ? [node.spouse] : [])]);
    });
  }
  data.sheets.forEach(sheet => indexFamily(sheet.roots));
  const childLabel = id => guide.gender[id] === 'female' ? '女儿' : '儿子';
  function kinship(id) {
    const relatives = family[id];
    const links = ids => [...ids].map(person => button('genealogy-find', escape(data.people[person].name), `data-person="${escape(person)}"`, 'genealogy-relative-link')).join('');
    const parents = [...relatives.parents];
    const siblings = new Set();
    parents.forEach(parent => family[parent].children.forEach(child => { if (child !== id) siblings.add(child); }));
    const rows = [
      ['父亲', parents.filter(person => guide.gender[person] === 'male')],
      ['母亲', parents.filter(person => guide.gender[person] === 'female')],
      [relatives.spouses.size > 1 ? '先后配偶' : '配偶', relatives.spouses],
      ['子女', relatives.children], ['兄弟姐妹', siblings]
    ].filter(([, ids]) => [...ids].length);
    return `<dl class="genealogy-close-family">${rows.map(([label, ids]) => `<div><dt>${label}</dt><dd>${links(ids)}</dd></div>`).join('')}</dl><p class="genealogy-family-note">只列本图连线表达的亲属；兄弟姐妹也可能同父异母或同母异父，未列出的亲人可参看下方身世。</p>`;
  }
  function modeNavigation(mode) {
    return `<nav class="genealogy-mode" aria-label="家谱阅读方式">${button('genealogy-mode', '先看懂关系', `data-mode="guide" aria-pressed="${mode === 'guide'}"`)}${button('genealogy-mode', '查完整家谱 · 42 人', `data-mode="detail" aria-pressed="${mode === 'detail'}"`)}</nav>`;
  }
  function tree(nodes, selected, expanded, path = '', open = true) {
    const overview = !path && nodes.length === 1 && nodes[0].children?.length && !Array.from(expanded || []).some(key => key.includes('-'));
    return `<ul class="${path ? 'genealogy-children' : `genealogy-tree${overview ? ' genealogy-tree-overview' : ''}`}" ${overview ? `style="--family-branches:${nodes[0].children.length}"` : ''} ${open ? '' : 'hidden'}>${nodes.map((node, index) => {
      const branchPath = path ? `${path}-${index}` : String(index);
      const branchOpen = expanded ? expanded.has(branchPath) : !path;
      return `<li class="genealogy-branch" data-branch="${branchPath}">${node.label ? `<p class="genealogy-edge-note">${escape(node.label)}</p>` : ''}<div class="genealogy-node${node.spouse ? ' genealogy-couple' : ''}">${personNode(node.person, selected, path ? childLabel(node.person) : '')}${node.spouse ? `<span class="genealogy-marriage" aria-label="夫妻"><span aria-hidden="true">═</span><small>夫妻</small></span>${personNode(node.spouse, selected)}` : ''}</div>${node.children?.length ? `${button('genealogy-toggle', branchOpen ? '收起后代 ↑' : `展开分支 · ${node.children.length} 条 ↓`, `data-path="${branchPath}" aria-expanded="${branchOpen}" aria-label="${escape(data.people[node.person].name)}：${branchOpen ? '收起' : '展开'}后代"`, 'genealogy-toggle')}${tree(node.children, selected, expanded, branchPath, branchOpen)}` : ''}</li>`;
    }).join('')}</ul>`;
  }
  function detail(id) {
    const person = data.people[id];
    const portrait = person.role && window.BOOK_ART?.characters?.[person.role];
    const icon = person.role && window.BOOK_DATA.roles.find(role => role.id === person.role)?.symbol || 'feather';
    return `<div class="genealogy-person-heading${portrait ? ' has-portrait' : ''}">${portrait ? `<img class="genealogy-portrait" src="${escape(portrait)}" alt="${escape(person.name)}的肖像">` : `<div class="genealogy-initial" aria-hidden="true">${window.Ornaments.icon(icon)}</div>`}<div><span class="eyebrow">${escape(houses[person.house] || person.house || '家族纪事')}${person.role ? ' · 六位主角之一' : ''}</span><h2 tabindex="-1">${escape(person.name)}</h2><p class="genealogy-years">${escape(person.years)}</p><p class="genealogy-identity">${escape(person.tag)}</p></div></div>${kinship(id)}<p class="genealogy-bio">${escape(person.bio)}</p><section class="genealogy-relations" aria-label="关键亲属关系"><h3>这与故事有什么关系</h3><ul>${person.relations.map(line => `<li>${escape(line)}</li>`).join('')}</ul></section>${person.seeAlso?.length ? `<nav class="genealogy-crosslinks" aria-label="接着看另一支家族"><span>顺着这条线，再翻一页</span>${person.seeAlso.map(link => button('genealogy-jump', `${escape(link.label)} →`, `data-index="${link.sheet}" data-person="${escape(link.person)}"`)).join('')}</nav>` : ''}${person.role ? button('genealogy-role', `翻开此人的前传 ${window.Ornaments.icon('arrowRight')}`, `data-role="${escape(person.role)}"`, 'primary-button genealogy-read-role') : ''}<p class="genealogy-detail-note">家族图谱可自由翻阅，不影响故事进度。</p>`;
  }
  function guideTree(nodes, selected, depth = 0) {
    return `<ul class="guide-family-tree guide-depth-${depth}">${nodes.map(node => `<li>${node.label ? `<p class="guide-relationship-label">${escape(node.label)}</p>` : ''}<div class="guide-family-node${node.spouse ? ' guide-family-couple' : ''}">${personNode(node.person, selected)}${node.spouse ? `<span class="guide-marriage-label">夫妻</span>${personNode(node.spouse, selected)}` : ''}</div>${node.children?.length ? `<div class="guide-descent">↓ ${node.spouse ? '他们' : guide.gender[node.person] === 'female' ? '她' : '他'}的${node.children.length === 1 ? childLabel(node.children[0].person) : '子女'}</div>${guideTree(node.children, selected, depth + 1)}` : ''}</li>`).join('')}</ul>`;
  }
  function guideTabs(index) {
    return `<nav class="genealogy-guide-tabs" aria-label="四步看懂人物关系">${guide.sheets.map((sheet, i) => button('genealogy-guide', `<b>${i + 1}</b><span>${escape(sheet.title)}</span>`, `data-index="${i}" aria-pressed="${index === i}"`)).join('')}</nav>`;
  }
  function guideDetail(index, selected) {
    if (selected) return button('genealogy-guide-summary', '← 回到这一图的说明', '', 'text-button guide-back-summary') + detail(selected);
    const sheet = guide.sheets[index];
    return `<section class="guide-explanation"><span class="eyebrow">第 ${index + 1} 问 / 共 4 问</span><h2 tabindex="-1">${escape(sheet.question)}</h2><p class="guide-takeaway">${escape(sheet.takeaway)}</p><div class="guide-explain-prose">${sheet.explain.map(line => `<p>${escape(line)}</p>`).join('')}</div><p class="guide-reading-tip">点图中的姓名，可以查看他的父母、配偶、子女，或进入主角的前传。</p>${button('genealogy-guide-detail', `追溯这一家的完整家谱 →`, `data-index="${sheet.detailSheet}"`, 'primary-button guide-detail-link')}<p class="genealogy-detail-note">小图只列理解这一问所需的人物；完整家谱保留全部 42 人。</p></section>`;
  }
  function renderGuide(index, selected) {
    const sheet = guide.sheets[index];
    return `<section class="page left-page genealogy-map-page genealogy-guide-page guide-sheet-${index}" aria-label="入门人物关系图">${running('PEOPLE BEFORE PEDIGREES','先认人 · 再读史')}${modeNavigation('guide')}${guideTabs(index)}<div class="genealogy-heading guide-heading"><h1 data-reading-heading tabindex="-1">${index + 1}. ${escape(sheet.title)}</h1></div><p class="guide-legend">夫妻相连，箭头向下指向孩子。✦ 是可选主角。</p><div class="guide-groups">${sheet.groups.map(group => `<section class="guide-family-group"><h3>${escape(group.title)}</h3>${guideTree(group.roots, selected)}<p class="guide-group-caption">${escape(group.caption)}</p></section>`).join('')}</div><nav class="story-pagination genealogy-pagination" aria-label="入门关系图翻页">${button('genealogy-guide-previous','← 上一图',index === 0 ? 'disabled' : '', 'story-page-button')}<span>入门 ${index + 1} / 4</span>${button('genealogy-guide-next','下一图 →',index === 3 ? 'disabled' : '', 'story-page-button')}</nav><div class="page-number">${index + 1}</div></section><section class="page right-page genealogy-person-page" aria-label="入门关系说明">${running('READ THE RELATIONSHIPS','把关系说清楚')}${button('genealogy-return-tree','↑ 回到关系图','','text-button genealogy-return-tree')}<div class="genealogy-detail">${guideDetail(index, selected)}</div><div class="page-number">${index + 1} · 注</div></section>`;
  }
  function navigation(index) {
    return `<nav class="story-pagination genealogy-pagination" aria-label="家族分谱翻页">${button('genealogy-previous','← 前一支',index === 0 ? 'disabled' : '', 'story-page-button')}<span>分谱 ${index + 1} / ${data.sheets.length}</span>${button('genealogy-next','后一支 →',index === data.sheets.length - 1 ? 'disabled' : '', 'story-page-button')}</nav>`;
  }
  function render(index, selected, expanded) {
    const sheet = data.sheets[index];
    return `<section class="page left-page genealogy-map-page" aria-label="家族树">${running('THE FAMILY REGISTER','卷首 · 家族图谱')}${modeNavigation('detail')}<div class="genealogy-heading"><h1 data-reading-heading tabindex="-1">${escape(sheet.title)}</h1><p>${escape(sheet.subtitle)}</p></div><nav class="genealogy-tabs" aria-label="选择家族分谱">${data.sheets.map((item, i) => button('genealogy-sheet', `${String(i + 1).padStart(2,'0')} ${escape(item.title)}`, `data-index="${i}" aria-pressed="${index === i}"`)).join('')}</nav><p class="genealogy-legend"><span>│ 父母 → 子女</span><span>═ 夫妻</span><span>✦ 主角</span></p><div class="genealogy-tree-tools"><span>点名字读身世，点支系看子女</span>${button('genealogy-expand-all','展开全部')}${button('genealogy-collapse-all','收起支系')}</div><div class="genealogy-tree-wrap">${tree(sheet.roots, selected, expanded)}</div><div class="genealogy-notes"><p>${escape(sheet.intro)}</p>${sheet.notes.map(note => `<p>${escape(note)}</p>`).join('')}</div>${navigation(index)}<div class="page-number">${['iii','v','vii','ix'][index]}</div></section><section class="page right-page genealogy-person-page" aria-label="人物与亲属关系">${running('NAMES BEHIND THE CROWN','人物 · 关系释读')}${button('genealogy-return-tree','↑ 回到家族树','','text-button genealogy-return-tree')}<div class="genealogy-detail">${detail(selected)}</div><div class="page-number">${['iv','vi','viii','x'][index]}</div></section>`;
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
  function findSheet(id) {
    const contains = nodes => nodes.some(node => node.person === id || node.spouse === id || node.children && contains(node.children));
    return data.sheets.findIndex(sheet => contains(sheet.roots));
  }
  return { render, detail, renderGuide, guideDetail, guides: guide.sheets, findSheet, tree: (index, selected, expanded) => tree(data.sheets[index].roots, selected, expanded), paths, initialPaths, sheets: data.sheets, people: data.people };
})();
