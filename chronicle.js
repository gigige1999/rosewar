/* The unabridged reading route: historical narration, no invented witness. */
(() => {
  'use strict';
  const entries = [
    {
      id: 'st-albans', year: '1455', date: '5 月 22 日 · 圣奥尔本斯', title: '王冠，先从身边裂开', short: '街巷里的第一道裂缝',
      caption: '城门仍然敞开，王冠下的人却已拔剑。',
      paragraphs: [
        '英格兰的危机早于第一声剑响。对法战争失利、财政困顿与亨利六世的失能，使贵族围绕王政主导权争执不休。约克公爵与王室宠臣萨默塞特的对立，终于走进圣奥尔本斯的街巷。',
        '5 月 22 日，约克一方获胜，萨默塞特战死，亨利六世被俘。此时，争夺首先关乎谁能掌握国王身边的权力；国王仍是国王。鲜血却让旧日的分歧变成了无法轻易化解的仇怨。'
      ],
      consequence: '权力争执走向武装冲突。王位本身，很快也将成为战利品。',
      marginal: '玫瑰战争并非一场持续三十余年的单一战役，而是一系列冲突、停战与重新结盟。'
    },
    {
      id: 'towton', year: '1461', date: '3 月 29 日 · 陶顿', title: '雪落在两顶王冠之间', short: '约克王朝在风雪中立足',
      caption: '雪掩住了足迹，弓与旗仍然指向彼此。',
      paragraphs: [
        '1460 年，约克公爵战死，继承主张传给儿子爱德华。次年 3 月 4 日，年轻的爱德华在伦敦被宣布为王。英格兰出现两位争夺同一王位的国王，宣称必须由战场来巩固。',
        '3 月 29 日，双方在陶顿的风雪中交战。约克军获胜，亨利六世与安茹的玛格丽特退往苏格兰；爱德华于 6 月加冕为爱德华四世。陶顿死伤惨重，确切数字仍有争议。新王赢得了王国，却没有赢得永久的安全。'
      ],
      consequence: '兰开斯特失去王位；支持新王的人，也开始衡量自己应得的回报。',
      marginal: '3 月称王、3 月决战、6 月加冕，是三个不同的时刻。'
    },
    {
      id: 'barnet-tewkesbury', year: '1471', date: '4—5 月 · 巴内特与图克斯伯里', title: '一个春天，三次永别', short: '旧盟友与旧王朝的消逝',
      caption: '三封折起的信，留在雾散之后的桌上。',
      paragraphs: [
        '曾助爱德华夺位的沃里克伯爵与新王决裂，转而联手昔日的敌人玛格丽特。1470 年，亨利六世一度复位。王冠像一枚被反复移交的印章，而爱德华很快从流亡中归来。',
        '1471 年 4 月，沃里克战死于巴内特；5 月，兰开斯特王储爱德华死于图克斯伯里之战，玛格丽特被俘。亨利六世随后死于伦敦塔的囚禁中。爱德华四世恢复统治，兰开斯特王室的直接继承线遭到重创。'
      ],
      consequence: '直接的王朝对手消失了。亨利·都铎逃往布列塔尼，另一条继承线开始等待。',
      marginal: '人物死亡的具体经过存在争议；这里仅记述可以稳妥确认的死亡与囚禁事实。'
    },
    {
      id: 'princes', year: '1483', date: '4—7 月及其后 · 伦敦', title: '塔楼留下的，是空白', short: '继承危机与失去踪迹的王子',
      caption: '两盏灯映着空窗。窗外有王国，窗内没有答案。',
      paragraphs: [
        '4 月，爱德华四世去世，年幼的爱德华五世继位，叔父理查担任护国公。随后，先王的婚姻被指无效，子女的继承资格遭到否定；这是一项当时的政治与法律主张，并非没有争议的事实。',
        '理查于 7 月加冕为理查三世。爱德华五世与弟弟约克公爵进入伦敦塔后，逐渐淡出可靠记录。两位王子的最终命运与责任归属至今无定论。与此同时，亨利·都铎与约克的伊丽莎白之间的婚姻计划，为反对者提供了新的联合方向。'
      ],
      consequence: '约克家族内部的断裂，为身在海外的都铎打开了通往王位的门。',
      marginal: '1484 年《王室头衔法》才将此前否定继承资格的论证正式载入议会文本。'
    },
    {
      id: 'bosworth', year: '1485', date: '8 月 22 日 · 博斯沃思', title: '一顶落入尘土的王冠', short: '理查三世战死，亨利胜出',
      caption: '白野猪旗下，王冠比一片落叶更沉。',
      paragraphs: [
        '亨利·都铎从海外登陆，依靠兰开斯特血脉、婚约承诺与不同势力的支持争夺王位。理查三世迎战。博斯沃思的结局，取决于行军、交锋，也取决于那些尚未明确站队的军队。',
        '8 月 22 日，威廉·斯坦利的部队在关键阶段介入，支持亨利。理查战死，成为最后一位战死沙场的英格兰国王。亨利获胜并于 10 月 30 日加冕为亨利七世；王朝更换了名字，新王仍须使胜利成为稳定的统治。'
      ],
      consequence: '都铎王朝开始了。下一步，是把战场上的胜利变成可以传承的合法性。',
      marginal: '白野猪是理查的徽记；荆棘中的王冠属于后世视觉传统，不是已核实的实物下落。'
    },
    {
      id: 'union', year: '1486', date: '1 月 18 日 · 威斯敏斯特', title: '把两条血脉，缝成一朵花', short: '亨利与伊丽莎白成婚',
      caption: '两只手牵起枝条，花的颜色终于相遇。',
      paragraphs: [
        '亨利七世已经加冕，随后迎娶爱德华四世的长女——约克的伊丽莎白。这场婚姻将都铎的王权与约克的血脉联系起来，让过去敌对的继承传统得以被写进同一部家谱。',
        '红与白组合成都铎玫瑰，成为新王朝展示结合与和解的象征。但一个图案无法抹去全部旧怨：伊丽莎白在 1487 年才加冕为王后，反对亨利的势力也未因婚礼而消失。书页上的玫瑰盛开，边缘仍留着刺。'
      ],
      consequence: '联姻给新王朝一个未来；下一场战争，将检验这个未来能否站稳。',
      marginal: '红白玫瑰并不意味着战争全程双方军队都统一佩戴两种玫瑰军徽。'
    },
    {
      id: 'stoke', year: '1487', date: '6 月 16 日 · 斯托克', title: '破旗之下，仍有新芽', short: '最后一场主要会战',
      caption: '旧旗垂落。新的枝叶，尚且细小。',
      paragraphs: [
        '一个名叫兰伯特·西姆内尔的少年，被推举为王位挑战者。他冒充的是遭囚禁的沃里克伯爵爱德华·金雀花——那位著名“拥王者”的外孙。约克派支持者与海外援军，试图借他的名字重新打开王位之争。',
        '6 月 16 日，叛军在斯托克败于亨利七世。这一战通常被视为玫瑰战争最后一场主要会战。西姆内尔获赦，王朝存续下来；此后仍有新的争位者出现。结束不是所有危险消失，而是英格兰终于有了走出反复内战的可能。'
      ],
      consequence: '三十二年的篇章收束于此。和解不是命运的赠礼，而是必须不断维持的秩序。',
      marginal: '本书在这里合拢历史主线。都铎政权此后仍面对珀金·沃贝克等挑战。'
    }
  ];
  const escape = text => String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const validIndex = index => Math.min(entries.length - 1, Math.max(0, Math.trunc(Number(index) || 0)));
  const milestone = index => window.BOOK_HISTORY.milestones[validIndex(index)];
  const validPage = (index, page) => Math.min(milestone(index).pages.length - 1, Math.max(0, Math.trunc(Number(page) || 0)));
  const running = (title, number) => `<div class="page-running"><span>${escape(title)}</span><span>${escape(number)}</span></div>`;
  const roleNames = {margaret:'安茹的玛格丽特',warwick:'沃里克伯爵',edward:'爱德华四世',beaufort:'玛格丽特·博福特',richard:'理查三世',elizabeth:'约克的伊丽莎白'};

  function missionInvitation(compact = false) {
    return `<section class="history-mission-invitation"><span class="eyebrow">AFTER THE CHRONICLE</span><h2>看见历史，再成为其中一人</h2><p>同一场战争，对母亲、国王与流亡者意味着不同的事。选一项使命，读人物的前传，再从他的处境重新出发。</p>${compact ? '' : `<div class="history-mission-list">${window.BOOK_HISTORY.missions.map(mission=>`<button type="button" data-action="mission-role" data-role="${escape(mission.role)}"><span>${escape(roleNames[mission.role] || mission.role)}</span><strong>${escape(mission.title)}</strong><small>${escape(mission.description)}</small><i aria-hidden="true">→</i></button>`).join('')}</div>`}<button type="button" class="primary-button history-roles-button" data-action="roles">选择人物与使命 <span aria-hidden="true">→</span></button></section>`;
  }

  function overview(atlasPlace) {
    const intro = window.BOOK_HISTORY.introduction;
    return `<section class="page left-page history-overview-page" aria-label="玫瑰战争的缘起与七个历史里程碑">
      ${running('卷首 · 历史里程碑','1455 — 1487')}
      <section class="history-introduction"><span class="eyebrow">THE WARS OF THE ROSES</span><h1 data-reading-heading tabindex="-1">${escape(intro.title)}</h1><p>${escape(intro.summary)}</p><details class="history-introduction-details"><summary>展开缘起 · 王权、家族与两朵玫瑰</summary>${intro.paragraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</details></section>
      <div class="history-overview-heading"><h2>七次转折，一段王国往事</h2><p>点选年份，分三页读清前因、经过与余波。</p></div>
      <ol class="history-milestones">${window.BOOK_HISTORY.milestones.map((item,index)=>`<li><button type="button" class="history-milestone" data-action="chronicle-goto" data-index="${index}"><span class="history-milestone-year">${escape(item.year)}</span><span class="history-milestone-copy"><strong>${escape(item.title)}</strong><span>${escape(item.summary)}</span></span><i aria-hidden="true">→</i></button></li>`).join('')}</ol>
      <aside class="history-family-invitation"><p>名字太多时，先沿一条血脉认人。</p><button type="button" class="text-button" data-action="genealogy">先看人物关系与家族图谱 <span aria-hidden="true">→</span></button></aside>
      <div class="page-number">卷首 · CHRONICLE</div>
    </section><section class="page right-page history-overview-page history-map-page" aria-label="战争地点与人物使命">
      ${running('地图 · 人物使命','BRITANNIA')}
      ${window.HistoryAtlas.render(0,atlasPlace)}
      ${missionInvitation()}
      <div class="page-number">地图 · MISSIONS</div>
    </section>`;
  }

  function prose(index = 0, page = 0) {
    index = validIndex(index); page = validPage(index,page);
    const current = milestone(index), section = current.pages[page];
    return `<div class="history-part-label">详读 ${page + 1} / ${current.pages.length} · ${page === 0 ? '前因' : page === current.pages.length - 1 ? '余波' : '经过'}</div><h2 class="history-section-title" tabindex="-1">${escape(section.title)}</h2>${section.paragraphs.map(paragraph=>`<p class="history-paragraph">${escape(paragraph)}</p>`).join('')}${page === current.pages.length - 1 ? `<aside class="history-afterword"><span>这一步之后</span><div>${escape(entries[index].consequence)}</div></aside>` : ''}`;
  }

  function pagination(index = 0, page = 0) {
    index = validIndex(index); page = validPage(index,page);
    const count = milestone(index).pages.length;
    return `<nav class="history-pagination story-pagination" aria-label="${entries[index].year} 年历史详读翻页"><button type="button" class="story-page-button" data-action="chronicle-page-previous"${page === 0 ? ' disabled' : ''}>← 前一页</button><span>详读 ${page + 1} / ${count}</span><button type="button" class="story-page-button" data-action="${page === count - 1 ? 'chronicle-map' : 'chronicle-page-next'}">${page === count - 1 ? '地图与人物 →' : '继续读 →'}</button></nav>`;
  }

  function render(index = 0, page = 0, atlasPlace) {
    index = validIndex(index); page = validPage(index,page);
    const current = milestone(index), entry = entries[index];
    return `<section class="page left-page chronicle-page history-story-page" aria-label="${escape(current.year)} 年详细纪事">
      ${running('全景纪事 · '+ current.year,'CHRONICA · '+String(index+1).padStart(2,'0'))}
      <div class="history-story-opening${page ? ' history-continuation' : ''}"><div class="history-story-heading"><span class="history-year">${escape(current.year)}</span><h1 data-reading-heading tabindex="-1">${escape(current.title)}</h1><p class="history-date">${escape(entry.date)}</p></div><figure class="history-figure">${window.ArtFrames.render(index, current.title)}<figcaption>${escape(entry.caption)}</figcaption></figure></div>
      <div class="history-reading-copy">${prose(index,page)}</div>
      ${pagination(index,page)}<div class="page-number">${String(index+1).padStart(2,'0')} · ${escape(current.year)}</div>
    </section><section class="page right-page chronicle-page history-map-page" aria-label="${escape(current.year)} 年地图、人物与纪年">
      ${running('地图 · 页边札记',current.year+' · MARGINALIA')}
      <nav class="history-year-index" aria-label="跳转历史里程碑">${entries.map((item,i)=>`<button type="button" data-action="chronicle-goto" data-index="${i}"${i === index ? ' aria-current="step"' : ''}>${item.year}</button>`).join('')}</nav>
      ${window.HistoryAtlas.render(index,atlasPlace)}
      <section class="history-marginalia" aria-label="本节历史查阅"><details class="history-facts"><summary>展开本节纪年 <span>${current.facts.length} 个关键时刻</span></summary><ol>${current.facts.map(fact=>`<li><time>${escape(fact.date)}</time><p>${escape(fact.event)}</p></li>`).join('')}</ol></details><details class="history-actors"><summary>谁在其中，他们想守住什么 <span>${current.actors.length} 位人物</span></summary><ul>${current.actors.map(actor=>`<li><strong>${escape(actor.name)}</strong><span>${escape(actor.side)}</span><p>${escape(actor.aim)}</p></li>`).join('')}</ul></details><aside class="history-source-note"><span>读史时留意</span><p>${escape(current.uncertainty)}</p></aside></section>
      ${missionInvitation(true)}
      <button type="button" class="text-button history-family-link" data-action="genealogy">沿家谱认清关系 <span aria-hidden="true">→</span></button>
      <div class="page-number">${escape(current.year)} · ATLAS</div>
    </section>`;
  }
  window.Chronicle = { entries, render, overview, prose, pagination };
})();
