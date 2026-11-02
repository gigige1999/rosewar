/* Seven original vector illuminations. Hand-authored SVG, not model-generated images.
   Architecture, figures and objects are narrative compositions rather than historical reconstructions. */
(() => {
  'use strict';
  let serial = 0;
  const C = { ink:'#594638', dark:'#392e29', red:'#81363b', wine:'#622b32', gold:'#b3945e', pale:'#f2e5c9', paper:'#e1cc9f', sand:'#c7ad7b', sage:'#85856a', stone:'#c1b598', white:'#ece3ce' };
  const star = (x,y,r=8) => `<path d="M${x} ${y-r}l${r/3} ${r*2/3} ${r*2/3} ${r/3}-${r*2/3} ${r/3}-${r/3} ${r*2/3}-${r/3}-${r*2/3}-${r*2/3}-${r/3} ${r*2/3}-${r/3}Z" fill="${C.gold}" stroke="none"/>`;
  const rose = (x,y,r=24,color=C.red) => `<g transform="translate(${x} ${y})"><path d="M0 ${r*.75}Q-${r*.9} ${r*1.9}-${r*.25} ${r*2.4}M0 ${r*.9}Q${r*.6} ${r*1.4} ${r*.8} ${r*1.9}" fill="none" stroke="${C.sage}" stroke-width="3"/><path d="M-${r*.3} ${r*1.8}q-${r*.9}-${r*.8}-${r*.8} ${r*.05}q${r*.2} ${r*.65} ${r*.8} 0M${r*.35} ${r*1.4}q${r*.9}-${r*.6} ${r*.8} ${r*.2}q-${r*.35} ${r*.5}-${r*.8}-${r*.2}" fill="${C.sage}"/>${[0,72,144,216,288].map(angle=>`<path transform="rotate(${angle})" d="M0 0C-${r*1.5}-${r*.3}-${r*.8}-${r*1.6} 0-${r}C${r*.8}-${r*1.6} ${r*1.5}-${r*.3} 0 0Z" fill="${color}" stroke-width="1.5"/>`).join('')}<circle r="${r*.36}" fill="${C.gold}"/><circle r="${r*.12}" fill="${C.dark}" stroke="none"/></g>`;
  const crown = (x,y,s=1,rotate=0) => `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${s})"><path d="M-33 12l-8-38 24 18 17-26 17 26 24-18-8 38Z" fill="${C.gold}"/><path d="M-33 12h66v12h-66Z" fill="${C.paper}"/><path d="M-24 18h48M-16-7l8 15M16-7 8 8" fill="none"/><circle cx="0" cy="-34" r="4" fill="${C.red}"/><circle cx="-40" cy="-26" r="4" fill="${C.red}"/><circle cx="40" cy="-26" r="4" fill="${C.red}"/><path d="M0-8 5 0 0 8-5 0Z" fill="${C.red}"/></g>`;
  const person = (x,y,robe=C.red,s=1,options={}) => `<g transform="translate(${x} ${y}) scale(${s})">${options.halo?`<circle cx="0" cy="-63" r="27" fill="none" stroke="${C.gold}"/>`:''}<path d="M-15-39 15-39 33 46H-33Z" fill="${robe}"/><path d="M-9-30-13 40M8-29 13 40M-18-23-30 11M18-23 30 11" fill="none"/><path d="M-16-38-30-10-41 3-33 12-14-4M16-38 30-10 41 3 33 12 14-4" fill="${robe}"/><path d="M-41 3q-12-3-11 4 5 9 19 5M41 3q12-3 11 4-5 9-19 5" fill="${C.paper}"/><path d="M-12 46-15 56H-1V46M12 46l3 10H1V46" fill="${C.dark}"/><path d="M-7-43v-9H7v9" fill="${C.paper}"/><ellipse cy="-67" rx="17" ry="23" fill="${C.paper}"/><path d="M-16-69q-3-24 14-24 21 0 20 22l-11-12-13 6-10 8" fill="${options.hair||C.dark}"/><path d="M-11-65h7M5-65h6M0-64v9h4M-4-48h8" stroke-width="1.3" fill="none"/>${options.crowned?crown(0,-85,.5):''}${options.veil?`<path d="M-18-75q1-26 18-25 20 0 19 25l12 43-16 6-1-49Q0-94-14-75l-1 49-16-6Z" fill="${C.pale}"/>`:''}</g>`;
  const tower = (x,y,w=76,h=230,prefix='') => `<g transform="translate(${x} ${y})"><path d="M0 0H${w}V${h}H0Z" fill="${C.stone}"/><path d="M-5-18h15v-11h14v11h${w-48}v-11h14v11h15V0H-5Z" fill="${C.stone}"/><path d="M${w/2-10} 41q10-21 20 0v35h-20Z" fill="${C.dark}"/><path d="M${w/2-10} 112q10-21 20 0v35h-20Z" fill="${C.dark}"/><path d="M0 22h${w}M0 86h${w}M0 157h${w}M${w*.28} 0v22M${w*.7} 22v30M${w*.2} 65v21M${w*.73} 86v28M${w*.23} 136v21M${w*.72} 157v37M0 194h${w}" opacity=".48" fill="none"/></g>`;
  const bowman = (x,y,robe,s=1,direction=1) => `<g transform="translate(${x} ${y}) scale(${s*direction} ${s})">${person(0,0,robe,1,{})}<path d="M35-79Q88-24 35 24L35-79Z" fill="none" stroke-width="3"/><path d="M4-25h96m-8-5 8 5-8 5M28-32l-25 7 25 7" fill="none" stroke-width="2"/><path d="M-13-78 0-96 18-78Z" fill="${C.sage}"/></g>`;
  const letter = (x,y,angle=0,seal=C.wine) => `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-49" y="-29" width="98" height="63" fill="${C.pale}"/><path d="M-49-29 0 8 49-29M-49 34-10 2M49 34 10 2" fill="none"/><circle cy="8" r="11" fill="${seal}"/><path d="M-5 5 0 0 5 5 0 13Z" fill="none" stroke="${C.paper}" stroke-width="1"/></g>`;
  const grass = (x,y,s=1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0q-2-17-10-20M0 0q-1-27 4-30M0 0q8-18 14-19" fill="none" stroke="${C.sage}" stroke-width="2.5"/>`;
  const scenes = [
    {
      title:'1455 · 圣奥尔本斯的街巷', description:'羊皮纸色街道两侧是尖顶房屋与集市布棚，两队持剑人物隔街相望；国王站在高处，一顶裂开的王冠悬于城门上方。原创建构的平面矢量叙事画。',
      draw: p => `<path d="M35 55h530v480H35Z" fill="${C.paper}"/><path d="M36 238 300 164 566 238v300H36Z" fill="${C.sand}"/>
        <path d="M211 537 278 241h45l68 296Z" fill="${C.pale}"/>
        <path d="M47 192h128v205H47ZM424 182h127v208H424Z" fill="${C.stone}"/>
        <path d="M42 192 111 124l70 68ZM418 182 486 114l71 68Z" fill="${C.wine}"/>
        <path d="M75 218h72v115H75ZM450 210h72v115h-72Z" fill="${C.paper}"/>
        <path d="M111 193v141M75 257h72M486 182v146M450 251h72M47 347h128M424 341h127" fill="none"/>
        <path d="M40 331h143l26 37H33ZM415 329h144l11 37H394Z" fill="${C.red}"/>
        <path d="m65 331-7 37m30-37-3 37m31-37v37m28-37 6 37m29-37 13 37M442 329l-9 37m34-37-4 37m28-37 2 37m28-37 8 37" stroke="${C.paper}" stroke-width="12"/>
        <path d="M55 369v81m113-81v81M431 367v80m107-80v80M53 408h117M428 410h112" fill="none" stroke-width="4"/>
        <path d="M215 249V132q84-75 169 0v117h-34v-97q-51-43-101 0v97Z" fill="${C.stone}"/>
        <path d="M220 194h28m103 0h28M230 139h21m98 0h24" fill="none"/>
        ${person(300,239,C.wine,.75,{crowned:true})}${person(226,363,C.red,.9,{})}${person(373,362,C.sage,.9,{})}
        <path d="m191 362 78-86m-9 4 17 17m-14-27 7 6M408 361l-77-84m9 4-16 16m14-28-7 6" fill="none" stroke-width="3"/>
        ${person(140,479,C.wine,.78,{})}${person(458,479,C.sage,.78,{})}
        ${crown(300,99,.68)}<path d="m299 73-7 12 9 7-5 18" fill="none" stroke="${C.wine}" stroke-width="3"/>
        <path d="M282 424h36m-43 30h50m-56 32h63M291 370h16" fill="none" opacity=".45"/>
        <path d="m350 482 9-15 13 7-7 14Z" fill="${C.red}"/>${star(194,104,7)}${star(406,101,7)}`
    },
    {
      title:'1461 · 陶顿的雪与弓', description:'斜落的雪花穿过平面的山坡，红色与浅色旗帜分立两侧，弓手隔着积雪相向，远处王冠像寒冷的太阳。原创建构的平面矢量叙事画。',
      draw: p => `<path d="M34 40h532v500H34Z" fill="${C.stone}"/>
        <path d="M35 262q133-113 265-18 124-105 267 0v295H35Z" fill="${C.sage}"/>
        <path d="M30 287q126-103 270-19 131-100 274-7v280H30Z" fill="${C.white}"/>
        <path d="M28 391q137-79 278-19 147-67 269-8M28 470q128-50 275-10 151-64 273-21" fill="none" stroke="${C.sand}" stroke-width="3"/>
        <path d="M126 148v258m348-266v257" fill="none" stroke-width="4"/>
        <path d="M127 152q55-23 111 0v81q-57-24-111 0Z" fill="${C.red}"/><path d="M475 142q-57-22-112 0v81q57-23 112 0Z" fill="${C.pale}"/>
        <path d="M180 169v47m-18-24h36" stroke="${C.gold}" stroke-width="3"/>${star(417,179,21)}
        ${bowman(167,375,C.wine,1,1)}${bowman(425,375,C.sage,1,-1)}${bowman(95,476,C.red,.7,1)}${bowman(508,463,C.stone,.7,-1)}
        <path d="M228 258h91m-9-5 9 5-9 5M391 307h-95m9-5-9 5 9 5M237 410h86m-8-5 8 5-8 5" fill="none" stroke-width="2"/>
        <circle cx="300" cy="125" r="44" fill="${C.paper}" stroke="${C.gold}"/><circle cx="300" cy="125" r="37" fill="none" stroke="${C.gold}"/>${crown(300,131,.59)}
        ${Array.from({length:48},(_,i)=>{const x=48+(i*79)%510,y=76+(i*43)%425;return `<path d="m${x} ${y} 6-8" stroke="${C.pale}" stroke-width="3"/>`;}).join('')}
        <path d="m274 480 36-29 4 41M291 474l23 18" fill="none" opacity=".7"/>${grass(350,517,.8)}`
    },
    {
      title:'1471 · 雾后的三封信', description:'横贯画面的雾带遮住三座远景，前景长桌上依次放着三封黑蜡信；两端是沉默的披袍人物，窗外的旗帜已经倒下。原创建构的平面矢量叙事画。',
      draw: p => `<path d="M34 40h532v500H34Z" fill="${C.stone}"/>
        <path d="M54 294V168q64-114 128 0v126M237 294V142q63-114 126 0v152M419 294V168q63-114 126 0v126" fill="${C.sage}" stroke="${C.ink}" stroke-width="12"/>
        <path d="M97 272v-87l78 28-78 23m159 48 58-74m-46 7 36 29" fill="none" stroke-width="3"/>
        <path d="M98 186 175 214 98 238Z" fill="${C.red}"/>${tower(449,217,42,97,p)}
        <path d="M43 231q83-26 166 0t166 0 190 0M34 268q84-23 165 0t167 0 200 0M34 304q82-23 166 0t167 0 200 0" stroke="${C.pale}" opacity=".65" stroke-width="24" fill="none"/>
        <path d="M30 346h542v196H30Z" fill="${C.paper}"/><path d="M38 350h524M38 367h524" fill="none" stroke="${C.gold}"/>
        ${person(91,392,C.wine,1.01,{veil:true})}${person(509,392,C.dark,1.01,{})}
        <path d="M120 383h360l28 90H92Z" fill="${C.sand}"/><path d="M92 473h416v18H92ZM117 491v54m366-54v54" fill="${C.dark}"/>
        ${letter(194,422,-9,C.dark)}${letter(300,421,0,C.dark)}${letter(407,422,8,C.dark)}
        <path d="M285 324h30l-5 53h-20Z" fill="${C.gold}"/><path d="M300 324v-26q-17-17 0-33 17 16 0 33" fill="${C.pale}"/>
        <path d="M142 505q70-16 139 0m34 0q68-16 138 0" fill="none" stroke="${C.gold}"/>
        ${star(208,113,9)}${star(392,113,9)}<path d="M272 103h56M283 112h34" stroke="${C.gold}"/>`
    },
    {
      title:'1483 · 空塔与双灯', description:'两座石塔隔着空庭院并立，每个深色窗洞里悬着一盏灯。庭院里有两双小鞋与合拢的书，人物与命运均未被画出。原创建构的平面矢量叙事画，不对塔中王子的命运作定论。',
      draw: p => `<path d="M34 40h532v500H34Z" fill="${C.sage}"/>
        <circle cx="300" cy="126" r="39" fill="${C.pale}"/><path d="M312 91q-44 33 4 68a39 39 0 0 1-4-68Z" fill="${C.sand}" stroke="none"/>
        <path d="M35 464 300 343l265 121v79H35Z" fill="${C.paper}"/>
        <path d="m89 541 210-198 216 198M35 485h530M35 515h530M185 542l114-199 117 199" fill="none" stroke="${C.sand}"/>
        ${tower(73,204,158,285,p)}${tower(369,204,158,285,p)}
        <path d="M108 394V270q44-81 88 0v124ZM404 394V270q44-81 88 0v124Z" fill="${C.dark}"/>
        <path d="M152 237v55m296-55v55" fill="none" stroke="${C.gold}"/>
        <path d="M137 296h30l-5 37h-20ZM433 296h30l-5 37h-20Z" fill="${C.gold}"/><path d="M152 310q-13-12 0-25 13 13 0 25ZM448 310q-13-12 0-25 13 13 0 25Z" fill="${C.pale}"/>
        <path d="M232 404V269q68-87 136 0v135" fill="none" stroke="${C.stone}" stroke-width="19"/>
        <path d="M257 432h86v-10q-45-8-86 0Z" fill="${C.red}"/><path d="M257 432h86v8h-86Z" fill="${C.pale}"/>
        <path d="M259 476q16 0 16 10h-34v-9l9-10h9ZM312 475q16 0 16 10h-34v-9l9-10h9Z" fill="${C.wine}"/>
        <path d="M287 492q15 0 15 9h-33v-8l9-10h9ZM336 490q15 0 15 9h-33v-8l9-10h9Z" fill="${C.wine}"/>
        ${star(258,196,7)}${star(342,196,7)}${star(184,134,8)}${star(413,134,8)}
        <path d="m283 363 17-22 17 22M291 354l9 9 9-9" fill="none" stroke="${C.gold}"/>`
    },
    {
      title:'1485 · 博斯沃思的坠冠', description:'白野猪旗斜立在战场上，另一侧是红色旗帜；折断的枪杆、盾牌与一顶坠落的王冠散落于平面山丘前景，远处军队如剪影排列。原创建构的平面矢量叙事画。',
      draw: p => `<path d="M34 40h532v500H34Z" fill="${C.paper}"/>
        <circle cx="301" cy="129" r="45" fill="${C.gold}"/><path d="M35 273q120-98 264-32 133-99 270-19v319H35Z" fill="${C.sage}"/>
        <path d="M35 349q122-70 264-9 129-66 270-17v218H35Z" fill="${C.sand}"/>
        ${[0,1,2,3,4,5,6,7].map(i=>`<g transform="translate(${64+i*67} ${269+(i%2)*17})"><path d="M0-34v54M-9-17h18M-5 20-13 51M5 20l13 31" stroke-width="3" fill="none"/><circle cy="-9" r="9" fill="${C.stone}"/><path d="M-11 4h22l9 25h-40Z" fill="${i<4?C.wine:C.dark}"/></g>`).join('')}
        <g transform="rotate(-13 168 437)"><path d="M168 121v331" stroke-width="5"/><path d="M170 124q76-30 149 0l-13 54 13 49q-77-27-149 0Z" fill="${C.wine}"/>
        <path d="M205 171q1-26 30-24 30-5 42 14l14 2-7 16-15 2-5 17h-11v-18h-22l-8 17h-10l3-21-15-1-8-11 12-2ZM204 157l-10-14m46 3 7-14 9 16" fill="${C.white}"/><circle cx="279" cy="167" r="2" fill="${C.dark}" stroke="none"/></g>
        <path d="M457 153v292m0-281 78 25-78 36" stroke-width="4" fill="none"/><path d="m460 166 75 23-75 35Z" fill="${C.red}"/>
        <path d="m71 492 121-79m-109 14 74 80M364 443l138 59m-132-64-9 20" fill="none" stroke-width="4"/>
        <path d="M126 453q45-34 88-5v51q-44 36-88 0Z" fill="${C.wine}"/><path d="M170 432v81m-39-50h79" stroke="${C.gold}" stroke-width="5"/>
        ${crown(313,465,1.12,17)}${grass(413,497,1)}${grass(252,521,.7)}
        <path d="m287 401 15-9 19 5-6 11Z" fill="${C.red}"/><path d="m381 514 13-11 12 5-9 13Z" fill="${C.red}"/>`
    },
    {
      title:'1486 · 红白玫瑰的联枝', description:'教堂般的金色圆拱里，身披暗红与浅色衣袍的一对人物伸手相接，两条红白玫瑰枝在他们之间交缠，中央开出一朵结合的花。原创建构的平面矢量叙事画。',
      draw: p => `<path d="M34 40h532v500H34Z" fill="${C.paper}"/>
        <path d="M69 501V233q0-160 231-160 231 0 231 160v268" fill="${C.sand}" stroke="${C.gold}" stroke-width="12"/>
        <path d="M95 501V233q0-136 205-136 205 0 205 136v268" fill="${C.pale}"/>
        <path d="M105 214h390M300 99v77M185 124l38 68m192-68-38 68" fill="none" stroke="${C.gold}" stroke-width="3"/>
        <path d="M73 503h454v18H73Z" fill="${C.gold}"/><path d="M110 520h380v20H110Z" fill="${C.sand}"/>
        ${person(164,375,C.wine,1.46,{crowned:true,hair:C.dark})}${person(437,375,C.pale,1.46,{veil:true})}
        <path d="M196 332q38-6 62 25l31 0 6 13-41 6-53-14Z" fill="${C.wine}"/><path d="M404 331q-39-5-63 26l-30 0-6 13 41 6 52-14Z" fill="${C.pale}"/>
        <path d="M257 357q17-6 33 2l10 5 10-5q17-8 32-2l-6 19-24 2-12-7-12 7-25-2Z" fill="${C.paper}"/>
        <path d="M263 490q-6-74 38-106 47-33 19-97M337 490q4-74-39-105-49-35-19-98" fill="none" stroke="${C.sage}" stroke-width="4"/>
        <path d="M283 449q-49-9-42-39 35 0 42 39M320 448q48-9 41-38-35 0-41 38M283 321q-35-8-27-30 28 1 27 30M320 321q34-8 28-30-28 1-28 30" fill="${C.sage}"/>
        ${rose(255,263,25,C.red)}${rose(346,263,25,C.white)}${rose(300,212,40,C.red)}
        <g transform="translate(300 212)">${[0,72,144,216,288].map(angle=>`<path transform="rotate(${angle})" d="M0 0C-24-3-16-35 0-22C16-35 24-3 0 0Z" fill="${C.white}" stroke-width="1.3"/>`).join('')}<circle r="8" fill="${C.gold}"/></g>
        ${star(222,172,9)}${star(379,172,9)}<path d="M250 482h100M266 492h68" stroke="${C.gold}"/>`
    },
    {
      title:'1487 · 斯托克的破旗与新芽', description:'破损旗帜垂落在画面左侧，前景一只旧头盔旁长出三株嫩芽。右侧成人与孩子望向远处新亮起的村镇，天空中的玫瑰不再完整。原创建构的平面矢量叙事画。',
      draw: p => `<path d="M34 40h532v500H34Z" fill="${C.paper}"/>
        <path d="M35 272q119-57 266-4 141-78 268-9v282H35Z" fill="${C.sage}"/>
        <path d="M35 355q146-89 272-27 127-27 263 27v187H35Z" fill="${C.sand}"/>
        <path d="M245 542 307 316h26l93 226Z" fill="${C.pale}"/>
        <g transform="translate(293 200)"><path d="M-59 56V-9h37v65M23 56V-9h37v65M-25 56v-98h50v98" fill="${C.stone}"/><path d="M-32-42 0-80l32 38M-65-9-40-35-16-9M16-9l25-26L67-9" fill="${C.wine}"/><path d="M-7 56V20q7-14 14 0v36" fill="${C.dark}"/><path d="M-9-17H9v21H-9Z" fill="${C.pale}"/></g>
        <path d="M118 125v274l-17 33 14 27-17 75" fill="none" stroke-width="5"/>
        <path d="M121 129q65-24 128-2l-17 25 15 21-26 7 15 25-24-2 9 27q-49-20-100 0Z" fill="${C.wine}"/>
        <path d="m172 141-9 27 9 19-14 26m33-70-8 29 10 20" fill="none" stroke="${C.paper}"/>
        ${person(430,382,C.pale,1.06,{veil:true})}${person(496,410,C.wine,.65,{})}
        <path d="M450 386q14-21 27 14" fill="none" stroke-width="5" stroke="${C.paper}"/>
        <path d="M117 473q-5-47 40-47 43 0 45 47l-25 11h-40Z" fill="${C.stone}"/><path d="M157 428v53m-36-15h74m-65-15h55" fill="none"/>
        <path d="M239 515v-52m55 52v-77m55 77v-49" fill="none" stroke="${C.sage}" stroke-width="4"/>
        <path d="M239 483q-34-2-28-24 27 1 28 24m0-5q32-2 28-23-25 1-28 23M294 475q-39-4-34-29 34 2 34 29m0-18q35-1 33-26-30 1-33 26M349 490q-34-2-29-24 27 1 29 24m0-14q27-2 25-21-24 1-25 21" fill="${C.sage}"/>
        <path d="M213 518q25-8 53 0m-1 5q31-10 59 0m-1-5q27-8 52 0" fill="none"/>
        ${rose(410,132,21,C.red)}${star(220,110,7)}${star(351,111,7)}${grass(66,518,.8)}`
    }
  ];
  function scene(index, className = '') {
    const item = scenes[Math.max(0,Math.min(scenes.length-1,Number(index)||0))];
    const p = `chronicle-art-${++serial}`;
    const safeClass = String(className).replace(/[^\w\s-]/g, '');
    return `<svg class="${safeClass}" viewBox="0 0 600 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${p}-title ${p}-desc" data-art-kind="original-vector">
      <title id="${p}-title">${item.title}</title><desc id="${p}-desc">${item.description}</desc>
      <defs><clipPath id="${p}-arch"><path d="M34 540V224C34 115 153 39 300 39S566 115 566 224V540Z"/></clipPath><pattern id="${p}-grain" width="39" height="43" patternUnits="userSpaceOnUse"><path d="m4 7 4 1m19 17 5-1M9 34l3-1" fill="none" stroke="${C.ink}" stroke-width=".65" opacity=".24"/><circle cx="31" cy="6" r=".8" fill="${C.ink}" opacity=".22"/><circle cx="19" cy="38" r=".6" fill="${C.ink}" opacity=".2"/></pattern></defs>
      <g fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 545V224C22 108 146 26 300 26S578 108 578 224V545Z" stroke="${C.gold}"/><path d="M27 545V224C27 111 149 32 300 32S573 111 573 224V545Z" stroke="${C.gold}" stroke-width=".7"/>
      <g clip-path="url(#${p}-arch)">${item.draw(p)}<path d="M34 40h532v500H34Z" fill="url(#${p}-grain)" stroke="none"/></g>
      <path d="M34 540V224C34 115 153 39 300 39S566 115 566 224V540Z" stroke="${C.ink}" stroke-width="2"/>
      <path d="M43 531h514M42 548h516" stroke="${C.gold}" stroke-width="1"/>${star(300,18,8)}${star(17,379,7)}${star(583,379,7)}</g>
    </svg>`;
  }
  window.ChronicleArt = { scene, scenes: scenes.map(({title,description})=>({title,description})) };
})();
