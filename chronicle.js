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

  const abridged = [
    {heading:'争的起初，是国王身边的位置', paragraphs:[
      '对法战争失利，国库吃紧，亨利六世又一度无法理政。约克公爵曾代他执政，国王恢复后却失去权力，与宠臣萨默塞特的冲突日益加深。',
      '1455年，约克一方在圣奥尔本斯获胜，萨默塞特战死，国王被俘但未被废黜。争的起初是朝政；死者家属继承的仇怨，逐渐把权力争执变成内战。'
    ], people:[{role:'margaret',note:'兰开斯特王后，王储之母'},{role:'warwick',note:'约克公爵的盟友'}]},
    {heading:'一场雪战，让两位国王分出胜负', paragraphs:[
      '约克公爵争得继承权后战死，长子爱德华接过主张。玛格丽特不肯让儿子失去王位，继续抵抗；1461年三月，爱德华也被宣布为王。',
      '陶顿风雪中，约克军大胜，死伤惨重而确数不明。亨利六世与玛格丽特退往苏格兰，爱德华六月加冕。王冠易手，旧王一家却没有放弃归来的希望。'
    ], people:[{role:'edward',note:'约克新王，承接父亲主张'},{role:'margaret',note:'维护丈夫与儿子的王位'}]},
    {heading:'拥王者倒下，旧王朝失去父子', paragraphs:[
      '沃里克与自己扶立的爱德华决裂，转而帮助亨利六世复位。1471年，爱德华从流亡中归来；昔日盟友在巴内特交战，沃里克战死。',
      '随后，兰开斯特王储死于图克斯伯里，玛格丽特被俘，亨利六世也死在伦敦塔。爱德华恢复统治；王室父子直系断绝，亨利·都铎逃往海外等待机会。'
    ], people:[{role:'warwick',note:'转盟扶立亨利六世'},{role:'edward',note:'约克国王，自流亡归来'}]},
    {heading:'父亲留下的王位，没有传到儿子手中', paragraphs:[
      '爱德华四世去世，幼子继位，叔父理查担任护国公。先王婚姻被指无效、子女继承权遭否定后，理查登基；两位王子在伦敦塔中失去可靠踪迹。',
      '王子的命运与责任归属至今无定论。约克家内部的裂痕，让亨利·都铎获得机会；他承诺迎娶王子的姐姐伊丽莎白，将两派反对者联合起来。'
    ], people:[{role:'richard',note:'王子们的叔父，约克新王'},{role:'elizabeth',note:'王子们的姐姐，约克公主'}]},
    {heading:'王冠易手，胜利还需要一个未来', paragraphs:[
      '亨利·都铎从威尔士登陆，得到兰开斯特旧部与约克反对者支持。母亲博福特此前的联络与婚约计划，帮助这支联盟形成。',
      '1485年博斯沃思会战中，威廉·斯坦利的部队支持亨利，理查三世战死。亨利十月加冕，都铎王朝开始；他仍须兑现婚约，把胜利变成能传给孩子的王权。'
    ], people:[{role:'richard',note:'约克国王，最后的冲锋者'},{role:'beaufort',note:'亨利·都铎之母'}]},
    {heading:'红与白，在婚礼中合为一朵花', paragraphs:[
      '亨利七世先加冕，再于1486年迎娶约克公主伊丽莎白。他以在位国王身份成婚，让都铎王权与约克血脉相连；红白合一的都铎玫瑰，成为王朝和解的象征。',
      '同年长子亚瑟出生，新王朝有了继承人。伊丽莎白翌年才加冕为王后，而反对者仍不肯承认都铎；婚礼把两家连接起来，却没有让刀剑立即收起。'
    ], people:[{role:'elizabeth',note:'约克公主，亨利七世之妻'},{role:'beaufort',note:'新王之母，伊丽莎白婆母'}]},
    {heading:'最后一场大会战，不是最后一次挑战', paragraphs:[
      '少年西姆内尔冒充被囚的约克家沃里克伯爵，在都柏林被拥立。林肯伯爵、部分爱尔兰支持者与海外雇佣军渡海，试图推翻都铎。',
      '1487年，叛军在斯托克战败，西姆内尔获赦。这通常是玫瑰战争最后一场主要会战；伊丽莎白同年加冕为王后。后来仍有争位者，和平需要不断维持。'
    ], people:[{role:'elizabeth',note:'约克出身的都铎王后'}]}
  ];
  function portrait(role, alt = roleNames[role]) {
    const src = window.BOOK_ART?.characters?.[role];
    return src ? `<img src="${escape(src)}" alt="${escape(alt)}" decoding="async">` : '';
  }
  function people(index) {
    return `<div class="history-witnesses" aria-label="此时的人物与关系">${abridged[index].people.map(person=>`<figure class="history-witness">${portrait(person.role)}<figcaption><strong>${escape(roleNames[person.role])}</strong><span>${escape(person.note)}</span></figcaption></figure>`).join('')}</div>`;
  }
  function finalMissions() {
    return `<section class="history-mission-invitation"><h3>现在，换一双眼睛重走历史</h3><div class="history-mission-portraits">${window.BOOK_HISTORY.missions.map(mission=>`<button type="button" data-action="mission-role" data-role="${escape(mission.role)}" aria-label="${escape(roleNames[mission.role])}：${escape(mission.title)}">${portrait(mission.role,'')}<span>${escape(roleNames[mission.role])}</span></button>`).join('')}</div><button type="button" class="text-button history-roles-button" data-action="roles">选择人物与使命 →</button></section>`;
  }

  function overview() {
    const intro = window.BOOK_HISTORY.introduction;
    return `<section class="page left-page history-overview-page" aria-label="玫瑰战争的缘起与七个历史里程碑">
      ${running('卷首 · 血与花之书','1455 — 1487')}
      <figure class="history-figure history-overview-figure">${window.ArtFrames.render(4,'博斯沃思 · 王冠易手')}</figure>
      <section class="history-introduction"><h1 data-reading-heading tabindex="-1">${escape(intro.title)}</h1><p class="history-intro-summary">兰开斯特与约克，同出金雀花王室，却为王权兵戎相见。后人以红、白玫瑰记住这场内战；都铎将两花合一，把王朝的胜利讲成和解的故事。</p><details class="history-introduction-details"><summary>两朵玫瑰背后的缘起</summary>${intro.paragraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</details></section>
      <div class="page-number">卷首 · CHRONICLE</div>
    </section><section class="page right-page history-overview-page history-directory-page" aria-label="七个历史里程碑">
      ${running('七次转折 · 一段往事','CONTENTS')}
      <div class="history-overview-heading"><h2>王冠如何易手</h2><p>循着图画与年份，翻过三十二年。</p></div>
      <ol class="history-milestones">${window.BOOK_HISTORY.milestones.map((item,index)=>`<li><button type="button" class="history-milestone" data-action="chronicle-goto" data-index="${index}"><span class="history-timeline-art" aria-hidden="true">${window.ArtFrames.render(index,entries[index].short)}</span><span class="history-milestone-copy"><span class="history-milestone-year">${escape(item.year)}</span><strong>${escape(entries[index].short)}</strong></span><i aria-hidden="true">→</i></button></li>`).join('')}</ol>
      <nav class="history-directory-links" aria-label="人物与关系"><button type="button" class="text-button" data-action="roles">人物与使命 →</button><button type="button" class="text-button" data-action="genealogy">家族图谱 →</button></nav>
      <div class="page-number">目录 · Ⅰ—Ⅶ</div>
    </section>`;
  }

  function prose(index = 0, page = 0) {
    index = validIndex(index); page = validPage(index,page);
    const current = milestone(index), section = current.pages[page];
    return `<div class="history-part-label">详读 ${page + 1} / ${current.pages.length} · ${page === 0 ? '前因' : page === current.pages.length - 1 ? '余波' : '经过'}</div><h2 class="history-section-title" tabindex="-1">${escape(section.title)}</h2>${section.paragraphs.map(paragraph=>`<p class="history-paragraph">${escape(paragraph)}</p>`).join('')}${page === current.pages.length - 1 ? `<aside class="history-afterword"><span>这一步之后</span><div>${escape(entries[index].consequence)}</div></aside>` : ''}`;
  }

  // Retained for callers of the earlier edition. A milestone now has one spread.
  function pagination() { return ''; }

  function render(index = 0) {
    index = validIndex(index);
    const current = milestone(index), entry = entries[index], brief = abridged[index];
    return `<section class="page left-page chronicle-page history-illustration-page" aria-label="${escape(current.year)} 年历史图画">
      ${running('全景纪事 · '+ current.year,'CHRONICA · '+String(index+1).padStart(2,'0'))}
      <figure class="history-figure history-chapter-figure">${window.ArtFrames.render(index,current.title)}<figcaption>${escape(entry.caption)}</figcaption></figure>
      <div class="history-story-heading"><span class="history-year">${escape(current.year)}</span><h1 data-reading-heading tabindex="-1">${escape(current.title)}</h1><p class="history-spread-summary">${escape(current.summary)}</p></div>
      <div class="page-number">${String(index*2+1).padStart(2,'0')} · ${escape(current.year)}</div>
    </section><section class="page right-page chronicle-page history-story-page" aria-label="${escape(current.year)} 年故事与人物">
      ${running('王冠之下 · 人的命运',current.year)}
      ${people(index)}
      <div class="history-reading-copy"><p class="history-date">${escape(entry.date)}</p><h2 class="history-section-title" data-reading-heading tabindex="-1">${escape(brief.heading)}</h2><div class="history-abridged">${brief.paragraphs.map(paragraph=>`<p class="history-paragraph">${escape(paragraph)}</p>`).join('')}</div></div>
      <details class="history-full-story"><summary>展开完整纪事与史料旁注</summary>${current.pages.map((section,page)=>`<section class="history-full-section"><span class="history-part-label">${['前因','经过','余波'][page]}</span><h3>${escape(section.title)}</h3>${section.paragraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</section>`).join('')}<aside class="history-source-note"><span>读史时留意</span><p>${escape(current.uncertainty)}</p></aside></details>
      <button type="button" class="text-button history-map-link" data-action="history-map" data-index="${index}"><span aria-hidden="true">⌖</span> 在地图上查看地点与阵营</button>
      ${index === entries.length-1 ? finalMissions() : ''}
      <div class="page-number">${String(index*2+2).padStart(2,'0')} · ${escape(current.year)}</div>
    </section>`;
  }
  window.Chronicle = { entries, render, overview, prose, pagination, abridged };
})();
