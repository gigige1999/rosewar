/* A family register in four leaves. Lines represent kinship, never allegiance. */
window.Genealogy = (() => {
  'use strict';
  const data = window.BOOK_GENEALOGY;
  const guide = window.BOOK_GENEALOGY_GUIDE;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const houses = {plantagenet:'金雀花王室',lancaster:'兰开斯特',york:'约克',neville:'内维尔',beaufort:'博福特',tudor:'都铎',mortimer:'莫蒂默',woodville:'伍德维尔'};
  const seals = window.GenealogySeals;
  const identities = {
    edward3:'共同祖先',lionel:'王室公爵',philippa:'婚入',rogerMortimer:'马奇伯爵',anneMortimer:'公爵之母',edmundLangley:'首任公爵',richardCambridge:'剑桥伯爵',johnGaunt:'公爵',blanche:'女继承人',katherine:'子女支系',
    henry4:'首位国王',henry5:'国王',henry6:'国王',margaretAnjou:'王后',edwardWestminster:'王储',johnBeaufortEarl:'初代伯爵',johnBeaufortDuke:'初代公爵',margaretBeaufort:'新王之母',edmundTudor:'里士满伯爵',henry7:'开国之王',
    richardYork:'未称王公爵',cecily:'两王之母',edward4:'首位国王',elizabethWoodville:'约克王后',elizabethYork:'都铎王后',edward5:'塔中兄长',richardShrewsbury:'塔中弟弟',george:'克拉伦斯公爵',isabel:'沃里克长女',edwardWarwick:'年轻伯爵',margaretPole:'乔治之女',richard3:'末代国王',anneNeville:'先后联姻',edwardMiddleham:'理查三世子',
    ralph:'家族长辈',joanBeaufort:'王室后裔',richardSalisbury:'沃里克之父',aliceMontagu:'婚入',warwick:'拥王者',anneBeauchamp:'婚入',arthur:'王储',henry8:'下一代国王'
  };
  const familyNotes = {
    philippa:'她出身金雀花王室，婚入莫蒂默家族；这里按传承的支系归组。',
    johnGaunt:'他出身金雀花王室，以兰开斯特公爵的身份开出这一支。',
    katherine:'她是博福特兄妹的母亲；博福特色签指她的子女支系，并非她的出生家族。',
    margaretAnjou:'她出身法国安茹王族，嫁给亨利六世后成为兰开斯特王后。',
    aliceMontagu:'她出身蒙塔古家族，嫁给理查·内维尔；本图归入内维尔婚姻支系。',
    anneBeauchamp:'她出身比彻姆家族，嫁给理查德·内维尔；本图归入内维尔婚姻支系。'
  };
  const allegiances = {
    henry6:'兰开斯特王位的持有者。约克一方挑战的是他及儿子的继承。',
    margaretAnjou:'支持兰开斯特，争取保住丈夫与儿子的王位；1470 年与原先支持约克的沃里克结盟。',
    edwardWestminster:'兰开斯特王储，1470 年与安妮成婚，连接母亲与沃里克的新联盟。',
    richardYork:'约克一方的领袖：先争取掌权，1460 年提出王位主张；称王前已战死。',
    edward4:'约克国王。沃里克最初帮助他称王，后来成为对手；爱德华于 1471 年复位。',
    richard3:'约克家族。早年支持哥哥爱德华四世，1483 年自行称王，1485 年败于亨利·都铎。',
    warwick:'约克 → 兰开斯特：1461 年帮助爱德华四世称王，1470 年转而帮助亨利六世复辟。内维尔家族并非始终站在同一边。',
    george:'约克家族：曾与沃里克反对哥哥爱德华四世，1471 年又回到哥哥一方。',
    margaretBeaufort:'博福特出身，为儿子亨利·都铎争取支持；1483 年参与联络反对理查三世的力量。',
    henry7:'都铎一方：1485 年联合兰开斯特旧部与反对理查三世的约克人士取胜，次年与约克王室联姻。',
    elizabethYork:'约克公主 → 都铎王后：1486 年嫁给亨利七世。家族出身仍是约克，婚姻把两家连接起来。',
    elizabethWoodville:'伍德维尔出身，因与爱德华四世的婚姻成为约克王后；后来与博福特商议子女联姻。',
    cecily:'内维尔出身，嫁入约克；丈夫与儿子是约克主张的核心。不能把她的家族色当成沃里克的政治选择。',
    anneNeville:'内维尔出身。1470 年嫁兰开斯特王储；守寡后于 1472 年嫁理查，后来成为约克王后。两次婚姻不等于她能自由决定联盟。',
    isabel:'内维尔出身，1469 年嫁给约克的乔治；婚姻连接了沃里克与乔治的政治合作。',
    richardSalisbury:'支持约克公爵，1460 年韦克菲尔德战役后被处死；他的儿子沃里克后来才转盟。'
  };
  function houseBadge(house) {
    return `<span class="genealogy-house-badge" data-house="${escape(house)}">${seals.mark(house)}<span>${escape(houses[house])}</span></span>`;
  }
  function houseLegend(nodes) {
    const found = new Set();
    const visit = items => items.forEach(node => { found.add(data.people[node.person].house); if (node.spouse) found.add(data.people[node.spouse].house); if (node.children) visit(node.children); });
    visit(nodes);
    return `<aside class="genealogy-houses" aria-label="本页家族标记"><div class="genealogy-house-key">${[...found].map(houseBadge).join('')}</div><p>色签辨认家族；婚姻与转盟见人物说明。</p></aside>`;
  }
  const running = (left, right) => `<div class="page-running"><span>${left}</span><span>${right}</span></div>`;
  const button = (action, text, extra = '', cls = 'text-button') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  function personNode(id, selected, relation = '') {
    const person = data.people[id];
    return `<button class="genealogy-person${person.role ? ' genealogy-core' : ''}" data-house="${escape(person.house)}" data-action="genealogy-person" data-person="${escape(id)}" aria-pressed="${selected === id}" aria-label="${escape(person.name)}，${escape(person.tag)}，图谱归属${escape(houses[person.house])}${person.role ? '，六位主角之一' : ''}，查看人物关系">${person.role ? '<i aria-hidden="true">✦</i>' : ''}<span class="genealogy-person-seal">${seals.portrait(id)}</span><span class="genealogy-person-copy">${relation ? `<span class="genealogy-kin-label">${escape(relation)}</span>` : ''}<span class="genealogy-name">${escape(person.name)}</span><span class="genealogy-person-meta">${houseBadge(person.house)}<span class="genealogy-short-identity">${escape(identities[id])}</span></span></span></button>`;
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
    return `<div class="genealogy-person-heading${portrait ? ' has-portrait' : ''}">${portrait ? `<img class="genealogy-portrait" src="${escape(portrait)}" alt="${escape(person.name)}的肖像">` : `<div class="genealogy-person-effigy" data-house="${escape(person.house)}">${seals.portrait(id)}</div>`}<div><span class="eyebrow">家族归属${person.role ? ' · 六位主角之一' : ''}</span>${houseBadge(person.house)}<h2 tabindex="-1">${escape(person.name)}</h2><p class="genealogy-years">${escape(person.years)}</p><p class="genealogy-identity">${escape(person.tag)}</p></div></div>${familyNotes[id] ? `<p class="genealogy-family-origin">${escape(familyNotes[id])}</p>` : ''}${allegiances[id] ? `<aside class="genealogy-allegiance" data-house="${escape(person.house)}"><h3>家族与立场</h3><p>${escape(allegiances[id])}</p></aside>` : ''}${kinship(id)}<p class="genealogy-bio">${escape(person.bio)}</p><section class="genealogy-relations" aria-label="关键亲属关系"><h3>这与故事有什么关系</h3><ul>${person.relations.map(line => `<li>${escape(line)}</li>`).join('')}</ul></section>${person.seeAlso?.length ? `<nav class="genealogy-crosslinks" aria-label="接着看另一支家族"><span>顺着这条线，再翻一页</span>${person.seeAlso.map(link => button('genealogy-jump', `${escape(link.label)} →`, `data-index="${link.sheet}" data-person="${escape(link.person)}"`)).join('')}</nav>` : ''}${person.role ? button('genealogy-role', `翻开此人的前传 ${window.Ornaments.icon('arrowRight')}`, `data-role="${escape(person.role)}"`, 'primary-button genealogy-read-role') : ''}<p class="genealogy-detail-note">家族图谱可自由翻阅，不影响故事进度。</p>`;
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
    return `<section class="guide-explanation"><span class="eyebrow">第 ${index + 1} 问 / 共 4 问</span><h2 tabindex="-1">${escape(sheet.question)}</h2><p class="guide-takeaway">${escape(sheet.takeaway)}</p>${houseLegend(sheet.groups.flatMap(group => group.roots))}<div class="guide-explain-prose">${sheet.explain.map(line => `<p>${escape(line)}</p>`).join('')}</div><p class="guide-reading-tip">点图中的姓名，可以查看他的父母、配偶、子女，或进入主角的前传。</p>${button('genealogy-guide-detail', `追溯这一家的完整家谱 →`, `data-index="${sheet.detailSheet}"`, 'primary-button guide-detail-link')}<p class="genealogy-detail-note">小图只列理解这一问所需的人物；完整家谱保留全部 42 人。</p></section>`;
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
