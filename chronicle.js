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
  function render(index = 0) {
    index = Math.min(entries.length - 1, Math.max(0, Number(index) || 0));
    const current = entries[index];
    return `<section class="page left-page chronicle-page" aria-label="${escape(current.year)} 年纪事画页">
      <div class="page-running"><span>无名编年史</span><span>CHRONICA · ${String(index + 1).padStart(2, '0')}</span></div>
      <div class="chronicle-frontispiece">
        <p class="chronicle-overline">越过阵营，读一场战争的始末</p>
        <div class="chronicle-year">${current.year}</div>
        <figure class="chronicle-figure">${window.ArtFrames.render(index, current.title + ' · 预留图版')}<figcaption>${escape(current.caption)}</figcaption></figure>
        <h2 class="chronicle-title" data-reading-heading tabindex="-1">${escape(current.title)}</h2>
        <p class="chronicle-date">${escape(current.date)}</p>
        <p class="chronicle-marginal">${escape(current.marginal)}</p>
      </div>
      <div class="page-number">${String(index * 2 + 1).padStart(2, '0')} · CHRONICLE</div>
    </section>
    <section class="page right-page chronicle-page" aria-label="战争时间轴">
      <div class="page-running"><span>一部王国的编年史</span><span>1455 — 1487</span></div>
      <div class="chronicle-timeline-heading"><h3>时间的针脚</h3><p>轻触年份，展开这一页历史。</p></div>
      <ol class="chronicle-timeline">${entries.map((entry, entryIndex) => `<li class="chronicle-event${entryIndex === index ? ' is-current' : ''}">
        <button type="button" class="chronicle-node" data-action="chronicle-goto" data-index="${entryIndex}" aria-expanded="${entryIndex === index}"${entryIndex === index ? ' aria-current="step"' : ''} aria-controls="chronicle-entry-${entryIndex}"><span class="chronicle-node-year">${entry.year}</span><span class="chronicle-node-title">${escape(entry.short)}</span><span class="chronicle-node-mark" aria-hidden="true">${entryIndex === index ? '−' : '+'}</span></button>
        <div id="chronicle-entry-${entryIndex}" class="chronicle-event-content"${entryIndex !== index ? ' hidden' : ''}>${entryIndex === index ? `${entry.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}<div class="chronicle-consequence"><span>此后</span><p>${escape(entry.consequence)}</p></div>` : ''}</div>
      </li>`).join('')}</ol>
      <p class="chronicle-reader-note">这里没有谜题，也没有被选中的立场。沿着时间，读完每一次王冠易手。</p>
      <div class="page-number">${String(index * 2 + 2).padStart(2, '0')} · CHRONICLE</div>
    </section>`;
  }
  window.Chronicle = { entries, render };
})();
