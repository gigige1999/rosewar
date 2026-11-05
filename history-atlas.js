/* Original geographical reading diagram. Dots are places, never territorial claims. */
window.HistoryAtlas = (() => {
  'use strict';
  const years = ['1455','1461','1471','1483','1485','1486','1487'];
  const escape = text => String(text ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const factions = {lancaster:'兰开斯特',york:'约克',tudor:'都铎',alliance:'联合／转盟'};
  const places = [
    {id:'st-albans',name:'圣奥尔本斯',english:'St Albans',group:'thames',x:334,y:278,related:[0],events:{0:{date:'1455 年 5 月 22 日',title:'从伦敦北面的城镇，走向内战',
      paragraphs:['圣奥尔本斯位于伦敦以北，是通往首都的重要道路节点。约克公爵与盟友在此击败王室军队，萨默塞特公爵战死，亨利六世落入胜方掌握。','此时还不是两位国王争夺王冠。约克一方首先要排除国王身边的政敌、重新掌握王政；国王的身份仍被承认。城镇里的战斗，却为此后的报复留下了死者与亲属。'],
      actors:[{name:'约克公爵、沃里克',faction:'york',role:'要求排除萨默塞特，争取掌权'},{name:'亨利六世、萨默塞特',faction:'lancaster',role:'国王及掌握王政的重臣'}]}}},
    {id:'towton',name:'陶顿',english:'Towton',group:'north',x:307,y:195,related:[1],events:{1:{date:'1461 年 3 月 29 日',title:'越过中部，向约克城以南进军',
      paragraphs:['陶顿在约克城以南。爱德华已于 3 月在伦敦被宣布为王，但北方仍有亨利六世一方的军队；新王必须使称王的宣告在战场上站得住。','陶顿会战发生在风雪之中，约克军获胜。亨利六世与安茹的玛格丽特随后退往苏格兰，爱德华在六月加冕。战斗伤亡极重，后世流传的具体数字不宜当作确定统计。'],
      actors:[{name:'爱德华四世、沃里克',faction:'york',role:'巩固新王的王位'},{name:'亨利六世一方',faction:'lancaster',role:'维护原有王朝'}]}}},
    {id:'barnet',name:'巴内特',english:'Barnet',group:'thames',x:337,y:281,related:[2],events:{2:{date:'1471 年 4 月 14 日',title:'伦敦以北，昔日盟友成为敌人',
      paragraphs:['巴内特紧邻伦敦北面的道路。爱德华从流亡中归来、重新控制伦敦后，迎战曾帮助自己称王的沃里克。如今沃里克已转而支持亨利六世复辟。','双方在雾中交战，沃里克败亡。常见记述提到雾气和误认友军对战局的影响；地图只标地点，不把具体阵形或行军路线画成已能精确复原的事实。'],
      actors:[{name:'爱德华四世',faction:'york',role:'从流亡中归来，争取复位'},{name:'沃里克及盟军',faction:'alliance',role:'1470 年转盟后支持亨利六世'}]}}},
    {id:'tewkesbury',name:'图克斯伯里',english:'Tewkesbury',group:'midlands',x:269,y:269,related:[2],events:{2:{date:'1471 年 5 月 4 日',title:'两条河流旁，一条继承线断裂',
      paragraphs:['图克斯伯里位于塞文河与埃文河交汇附近。安茹的玛格丽特回到英格兰后，试图将自己的军队与西部支持者会合；爱德华的追击使双方在这里决战。','兰开斯特军败北，王储爱德华死亡，玛格丽特被俘。这位王储是亨利六世的独子，与胜方的爱德华四世不是同一个人。王储死亡的具体经过仍有争议。'],
      actors:[{name:'爱德华四世',faction:'york',role:'在巴内特获胜后继续追击'},{name:'玛格丽特与王储爱德华',faction:'lancaster',role:'试图保住王朝继承'}]}}},
    {id:'london',name:'伦敦与威斯敏斯特',english:'London · Westminster',group:'thames',x:342,y:287,related:[2,3,4,5],events:{
      2:{date:'1471 年 5 月',title:'战场之后，伦敦塔中的旧王',paragraphs:['巴内特与图克斯伯里的胜利，使爱德华四世重新稳固王位。亨利六世仍被囚禁在伦敦塔，随后在五月死去。','亨利通常被认为遭到杀害，但下令者与执行细节不能因此全部确定。旧王与独子的相继死亡，使兰开斯特父子直系不再拥有继承人。'],actors:[{name:'爱德华四世',faction:'york',role:'恢复统治'},{name:'亨利六世',faction:'lancaster',role:'被囚的旧王'}]},
      3:{date:'1483 年 4 月至夏季',title:'王位交接，被改写成另一场争夺',paragraphs:['爱德华四世去世后，儿子爱德华五世进入伦敦，原本等待加冕；叔父理查以护国公身份主持政务。伦敦塔当时兼有王室住所、防御设施与监禁场所的用途。','先王婚姻被指无效、孩子继承资格被否定后，理查成为理查三世，于七月在威斯敏斯特加冕。两位王子在塔中失去可靠踪迹，最终命运与责任归属仍未定论。'],actors:[{name:'理查三世',faction:'york',role:'从护国公取得王位'},{name:'爱德华五世与弟弟',faction:'york',role:'同属约克家，却失去继承地位'}]},
      4:{date:'1485 年 10 月 30 日',title:'先以国王身份加冕',paragraphs:['博斯沃思获胜后，亨利进入伦敦，并于十月在威斯敏斯特加冕为亨利七世。他需要以国王的身份召集议会、确认效忠，并处理支持者与战败者的处境。','他与约克的伊丽莎白的婚礼在次年举行。加冕先于婚姻，是理解都铎如何宣示自身王权的重要先后关系。'],actors:[{name:'亨利七世',faction:'tudor',role:'把战场胜利转化为王政'},{name:'兰开斯特旧部与约克反对派',faction:'alliance',role:'支持新王的联盟并非单一家族'}]},
      5:{date:'1486 年 1 月 18 日',title:'两条王室血脉在婚礼中相连',paragraphs:['亨利七世与爱德华四世的长女约克的伊丽莎白在威斯敏斯特成婚。新王朝借此连接都铎的王权与约克的继承传统。','红白相合的都铎玫瑰把这种结合变成易于传播的象征。伊丽莎白到 1487 年才加冕为王后，婚礼也没有让所有反对者停止争位。'],actors:[{name:'亨利七世',faction:'tudor',role:'已加冕的新王'},{name:'约克的伊丽莎白',faction:'york',role:'约克公主，婚后成为都铎王后'}]}
    }},
    {id:'milford',name:'米尔湾',english:'Mill Bay · Milford Haven',group:'wales',x:204,y:268,related:[4],events:{4:{date:'1485 年 8 月 7 日',title:'从威尔士西南，踏上争王之路',
      paragraphs:['亨利·都铎在米尔湾登陆，地点位于米尔福德港水域附近的威尔士西南海岸。他带来的海外兵力、威尔士人脉，以及沿途加入的支持者，共同构成向英格兰进军的基础。','从登陆地到博斯沃思，需要穿过威尔士与英格兰中部。图上不将整片威尔士染成都铎颜色：家族联系可以帮助招募，具体地方和个人的选择仍各不相同。'],
      actors:[{name:'亨利·都铎',faction:'tudor',role:'自海外归来争夺王位'},{name:'海外部队与沿途支持者',faction:'alliance',role:'来源不同，共同支持亨利'}]}}},
    {id:'bosworth',name:'博斯沃思',english:'Bosworth',group:'midlands',x:301,y:245,related:[4],events:{4:{date:'1485 年 8 月 22 日',title:'中部会战，王朝更名',
      paragraphs:['双方在莱斯特郡博斯沃思一带交战。理查三世拥有王位，却不能保证所有在场军队都会在关键时刻为他战斗；亨利则依靠一支由不同背景支持者组成的联盟。','威廉·斯坦利的部队在关键阶段支持亨利，理查战死。胜负也受部署、指挥与战场局势影响，不能简化成某一次转向解释全部。地图的点标示战役地区，不宣称定位了每次冲锋。'],
      actors:[{name:'理查三世',faction:'york',role:'在位的约克国王'},{name:'亨利·都铎',faction:'tudor',role:'王位挑战者'},{name:'威廉·斯坦利部',faction:'alliance',role:'关键阶段介入支持亨利'}]}}},
    {id:'stoke',name:'斯托克',english:'Stoke Field · near Newark',group:'midlands',x:316,y:229,related:[6],events:{6:{date:'1487 年 6 月 16 日',title:'纽瓦克以南，最后一场主要会战',
      paragraphs:['这里的斯托克指纽瓦克附近、特伦特河一带的战场，并不是今天常被联想到的特伦特河畔斯托克市。林肯伯爵带领的叛军与亨利七世的军队在此交战。','叛军支持的少年兰伯特·西姆内尔冒充被囚的沃里克伯爵。都铎军获胜，这场战役通常被视为玫瑰战争最后一场主要会战；后来仍有其他争位挑战。'],
      actors:[{name:'亨利七世',faction:'tudor',role:'保卫新王朝'},{name:'林肯伯爵与约克支持者',faction:'york',role:'试图推翻亨利'},{name:'爱尔兰兵与海外雇佣军',faction:'alliance',role:'加入反都铎联盟'}]}}},
    {id:'dublin',name:'都柏林',english:'Dublin',group:'ireland',x:157,y:202,related:[6],events:{6:{date:'1487 年 5 月 24 日',title:'海的另一侧，也能制造一位“国王”',
      paragraphs:['西姆内尔在都柏林被拥立加冕，冒充的是约克家年轻的沃里克伯爵。真正的伯爵仍被亨利七世囚在伦敦；这场拥立依靠的是身份主张与政治支持，而非真实继承人的在场。','约克派领导人、部分爱尔兰支持者与海外兵力随后渡海进入英格兰，最终在斯托克战败。都柏林的标记说明支持网络跨越海峡，不代表整个爱尔兰都持同一立场。'],
      actors:[{name:'西姆内尔的支持者',faction:'york',role:'借约克继承人的名义挑战都铎'},{name:'部分爱尔兰贵族与海外援军',faction:'alliance',role:'共同组成反都铎力量'}]}}}
  ];
  const defaults = ['st-albans','towton','barnet','london','bosworth','london','stoke'];
  const groups = [
    {id:'ireland',label:'都柏林',x:130,y:195,default:'dublin'},
    {id:'wales',label:'威尔士',x:200,y:275,default:'milford'},
    {id:'north',label:'陶顿',x:341,y:160,default:'towton'},
    {id:'midlands',label:'中部战场',x:280,y:235,default:'bosworth'},
    {id:'thames',label:'伦敦周边',x:365,y:307,default:'london'}
  ];
  const validIndex = index => Number.isInteger(index) && index >= 0 && index < years.length ? index : 0;
  const find = id => places.find(place => place.id === id);
  function eventAt(index, place) {
    const related = place.related.reduce((best, candidate) => Math.abs(candidate-index) < Math.abs(best-index) ? candidate : best, place.related[0]);
    return {index:related,...place.events[related]};
  }
  function badge(faction, label = factions[faction]) {
    return `<span class="atlas-faction" data-faction="${faction}"><i aria-hidden="true"></i>${escape(label)}</span>`;
  }
  function detail(index = 0, id) {
    index = validIndex(index);
    const place = find(id) || find(defaults[index]);
    const event = eventAt(index,place);
    return `<div class="atlas-place-heading"><span class="eyebrow">${escape(place.english)}</span><h3 tabindex="-1">${escape(place.name)}</h3><p class="atlas-event-date">${escape(event.date)}</p></div>${event.index !== index ? `<p class="atlas-other-year">此处展开的是 ${years[event.index]} 年的故事；当前里程碑是 ${years[index]} 年。</p>` : ''}<p class="atlas-place-thesis">${escape(event.title)}</p><div class="atlas-actors">${event.actors.map(actor => `<div>${badge(actor.faction)}<strong>${escape(actor.name)}</strong><p>${escape(actor.role)}</p></div>`).join('')}</div><div class="atlas-prose">${event.paragraphs.map(text=>`<p>${escape(text)}</p>`).join('')}</div><nav class="atlas-detail-navigation" aria-label="地点阅读导航"><button type="button" class="text-button atlas-read-event" data-action="chronicle-goto" data-index="${event.index}">${event.index === index ? '回到' : '展开'} ${years[event.index]} 年的详细纪事 →</button><button type="button" class="text-button atlas-return" data-action="atlas-return">↑ 回到地图选地点</button></nav>`;
  }
  function land() {
    return `<svg class="atlas-base-map" viewBox="0 0 420 350" role="img" aria-label="大不列颠与爱尔兰位置示意：苏格兰在北，威尔士在西，伦敦在东南；战役地点分布于英格兰北部和中部。">
      <path class="atlas-map-frame" d="M8 8H412V342H8Z M13 13H407V337H13Z"/>
      <g class="atlas-water-lines"><path d="M40 63h22m7 0h15M26 81h38m9 0h12M318 54h24m8 0h16M62 294h26m8 0h18M28 313h24m8 0h23M358 115h25m7 0h12"/></g>
      <g class="atlas-land"><path d="M277 23 270 39 279 49 265 65 278 70 293 81 287 95 269 107 274 119 288 134 297 150 312 166 319 184 322 201 337 210 360 220 367 235 358 250 344 264 356 273 369 280 360 296 339 302 321 300 297 307 277 312 260 319 241 316 220 324 197 330 181 326 187 317 203 312 214 301 234 299 247 286 240 276 222 279 207 273 198 268 194 256 208 246 217 233 224 218 225 208 239 204 250 210 259 202 253 190 248 176 239 166 225 159 215 151 206 144 207 132 195 120 192 111 203 100 195 93 202 82 197 70 201 58 212 51 215 38 231 30 240 17 251 19 258 13 265 24Z"/>
      <path d="M126 124 139 126 149 138 151 151 162 160 159 173 165 187 159 202 156 219 146 229 137 242 120 248 110 258 94 256 81 263 70 258 78 248 68 244 75 231 66 224 72 213 66 202 76 193 69 183 78 173 79 158 90 149 101 149 103 138 115 139Z"/>
      <path d="m188 73 5 9-4 10-5-7Zm-9 24 4 8-7 11-3-8Zm24 54 2 7-5 6-2-6Zm49-141 8-3 5 5-8 3Zm26 2 6-3 4 5-7 2Z"/></g>
      <g class="atlas-rivers"><path d="M292 279q20-9 35 8t25-1M263 238q-8 12 4 31t-16 16M300 213q-10 13 16 16t12-18"/></g>
      <g class="atlas-region-labels"><text x="239" y="77">苏格兰</text><text x="96" y="184">爱尔兰</text><text x="205" y="242">威尔士</text><text x="287" y="276">英格兰</text><text class="atlas-sea-name" x="130" y="97">北大西洋</text><text class="atlas-sea-name" x="104" y="302">凯尔特海</text></g>
      <g class="atlas-compass" transform="translate(366 59)"><path d="M0-18V18M-13 0H13M0-18-4-5 0-8 4-5Z"/><circle r="9"/><text x="0" y="-24">N</text></g>
      <text class="atlas-map-caption" x="25" y="330">BRITANNIA · 1455—1487</text>
    </svg>`;
  }
  function render(index = 0, selectedPlace) {
    index = validIndex(index);
    const selected = find(selectedPlace) || find(defaults[index]);
    const pins = groups.map(group => {
      const place = selected.group === group.id ? selected : places.find(place=>place.group===group.id&&place.related.includes(index)) || find(group.default);
      return {...group,place,event:eventAt(index,place)};
    });
    return `<section class="history-atlas" data-atlas-index="${index}" aria-label="${years[index]} 年的地点与阵营"><div class="atlas-heading"><div><span class="eyebrow">PLACES & ALLEGIANCES</span><h2>在地图上，认出这段历史</h2></div><span class="atlas-year">${years[index]}</span></div><p class="atlas-instruction">点地图或地名，读人物在此时的处境。相邻战场合为一处索引，下方可逐一展开。</p><div class="atlas-map">${land()}<svg class="atlas-map-routes" viewBox="0 0 420 350" aria-hidden="true" focusable="false">${pins.map(pin=>`<path class="atlas-leader${pin.place.id===selected.id?' is-selected':''}" d="M${pin.place.x} ${pin.place.y}L${pin.x} ${pin.y}"/>`).join('')}${places.map(place=>`<circle class="atlas-location${place.related.includes(index)?' is-current':''}${place.id===selected.id?' is-selected':''}" cx="${place.x}" cy="${place.y}" r="${place.id===selected.id?4.5:2.5}"/>`).join('')}</svg>${pins.map(pin=>`<button type="button" class="atlas-pin${pin.place.related.includes(index)?' is-current':''}" style="left:${pin.x/4.2}%;top:${pin.y/3.5}%" data-action="atlas-place" data-place="${pin.place.id}" aria-pressed="${pin.place.id===selected.id}" aria-label="${escape(pin.label)}，查看${escape(pin.place.name)} ${years[pin.event.index]}年的地点与阵营"><span class="atlas-pin-mark" aria-hidden="true">${pin.place.id===selected.id?'◆':'◇'}</span><span>${escape(pin.label)}</span></button>`).join('')}</div><p class="atlas-map-note">地理位置示意，非疆域或战术复原。实心点为本年相关地点。</p><nav class="atlas-place-list" aria-label="逐一查看地点">${places.map(place=>`<button type="button" data-action="atlas-place" data-place="${place.id}" aria-pressed="${selected.id===place.id}"${place.related.includes(index)?' class="is-current"':''}><span>${escape(place.name)}</span><small>${place.related.map(i=>years[i]).join(' · ')}</small></button>`).join('')}</nav><div class="atlas-legend" aria-label="叙事中的政治支持关系">${Object.keys(factions).map(faction=>badge(faction)).join('')}<p>颜色说明下文人物的支持关系，不表示土地归属或终生立场。</p></div><section class="atlas-place-detail" aria-label="地点与相关人物">${detail(index,selected.id)}</section></section>`;
  }
  return {render,detail,places};
})();
