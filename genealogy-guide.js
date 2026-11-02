/* Four small reading trees before the complete register. No skipped generations. */
window.BOOK_GENEALOGY_GUIDE = {
  sheets: [
    {
      title: '先分清两家',
      question: '战争开始时，谁在守住王位，谁在挑战国王？',
      takeaway: '亨利六世一家想保住王位；约克公爵先争掌权，后来争王位，最终称王的是他的儿子爱德华四世。',
      groups: [
        {
          title: '兰开斯特一家 · 在位的国王',
          caption: '1455 年，亨利六世仍是国王。玛格丽特是他的妻子，两人有一个儿子。',
          roots: [{ person: 'henry6', spouse: 'margaretAnjou', children: [
            { person: 'edwardWestminster', label: '他们的独子 · 期待继位的王储' }
          ] }]
        },
        {
          title: '约克一家 · 后来的挑战者',
          caption: '这里只列父亲与两个儿子；孩子的母亲是塞西莉·内维尔，其他兄弟姐妹见详细家谱。',
          roots: [{ person: 'richardYork', children: [
            { person: 'edward4', label: '兄长 · 1461 年成为国王' },
            { person: 'richard3', label: '弟弟 · 1483 年才成为国王' }
          ] }]
        }
      ],
      explain: [
        '开战之初，双方争的是谁能掌握亨利六世身边的权力，并不是一开始就各有一位国王。约克公爵后来提出王位要求，却在称王前战死，儿子爱德华接着争夺王位。',
        '爱德华四世与理查三世是亲兄弟；兰开斯特王储爱德华则是另一家的孩子。看到“爱德华”，先看他的父母和头衔。',
        '亨利六世与约克公爵理查是远房亲戚，并不是亲兄弟。他们有更早的共同王室祖先；想追溯两家为何都声称有继承权，再读详细家谱。'
      ],
      detailSheet: 1,
      defaultPerson: 'henry6'
    },
    {
      title: '两位玛格丽特',
      question: '名字相同的两位母亲，究竟在为谁争取未来？',
      takeaway: '安茹的玛格丽特是亨利六世的妻子；玛格丽特·博福特是亨利七世的母亲。她们不是同一个人。',
      groups: [
        {
          title: '安茹的玛格丽特 · 国王的妻子',
          caption: '她为丈夫亨利六世和儿子爱德华争取支持。',
          roots: [{ person: 'margaretAnjou', spouse: 'henry6', children: [
            { person: 'edwardWestminster', label: '独子 · 1471 年死亡，未能继位' }
          ] }]
        },
        {
          title: '玛格丽特·博福特 · 新王的母亲',
          caption: '她与埃德蒙·都铎的儿子叫亨利。这里省略她的其他婚姻。',
          roots: [{ person: 'margaretBeaufort', spouse: 'edmundTudor', children: [
            { person: 'henry7', label: '独子 · 1485 年成为国王' }
          ] }]
        }
      ],
      explain: [
        '王储爱德华于 1471 年死亡后，亨利六世这一家的父子直系不再有继承人。安茹的玛格丽特也失去了丈夫与独子。',
        '后来取胜的是另一条支系的亨利·都铎，也就是亨利七世。他不是亨利六世的儿子，母亲是玛格丽特·博福特。',
        '1486 年，亨利七世娶了爱德华四世的女儿——约克的伊丽莎白。新婚姻把都铎与约克王室连接起来。'
      ],
      detailSheet: 1,
      defaultPerson: 'margaretAnjou'
    },
    {
      title: '父亲、叔父与孩子',
      question: '理查三世与塔中王子、约克的伊丽莎白是什么关系？',
      takeaway: '爱德华四世是这三个孩子的父亲，理查三世是他们的叔父；最上方的约克公爵理查是祖父。',
      groups: [
        {
          title: '约克家三代 · 同名的理查要分清',
          caption: '第一代夫人是塞西莉·内维尔；三个孩子的母亲是伊丽莎白·伍德维尔。为先看清父亲与叔父，此图省去两位母亲和其他子女。',
          roots: [{ person: 'richardYork', label: '祖父 · 从未成为国王', children: [
            { person: 'edward4', label: '父亲 · 理查三世的哥哥', children: [
              { person: 'elizabethYork', label: '姐姐 · 后来嫁给亨利七世' },
              { person: 'edward5', label: '弟弟 · 塔中王子之一' },
              { person: 'richardShrewsbury', label: '更小的弟弟 · 另一位塔中王子' }
            ] },
            { person: 'richard3', label: '叔父 · 爱德华四世的弟弟' }
          ] }]
        }
      ],
      explain: [
        '1483 年，爱德华四世去世，儿子爱德华五世本应继位。叔父理查先负责主持政务，后来孩子们的继承资格遭到否定，理查成为理查三世。',
        '爱德华五世与弟弟理查进入伦敦塔后不再公开出现。他们最终遭遇了什么、由谁负责，至今仍有争议。',
        '约克的伊丽莎白是两位王子的姐姐，不是他们的母亲。她与母亲都叫伊丽莎白，母亲的姓氏是伍德维尔。'
      ],
      detailSheet: 2,
      defaultPerson: 'elizabethYork'
    },
    {
      title: '沃里克的两个女儿',
      question: '为什么同一个伯爵，会与两边的王室都有亲戚关系？',
      takeaway: '沃里克有两个女儿：长女嫁给约克的乔治；次女安妮先嫁兰开斯特王储，守寡后再嫁理查三世。',
      groups: [
        {
          title: '沃里克一家 · 两个女儿，三段婚姻',
          caption: '两位女儿的母亲是安妮·比彻姆，此图省略。次女安妮画了两次，是同一个人在不同年份的婚姻。',
          roots: [{ person: 'warwick', label: '父亲 · 帮别人争王位的伯爵', children: [
            { person: 'isabel', spouse: 'george', label: '长女 · 1469 年嫁给乔治' },
            { person: 'anneNeville', spouse: 'edwardWestminster', label: '次女安妮 · 第一段婚姻 · 1470—1471' },
            { person: 'anneNeville', spouse: 'richard3', label: '同一位安妮 · 第二段婚姻 · 1472—1485' }
          ] }]
        }
      ],
      explain: [
        '乔治是爱德华四世与理查三世的兄弟。他娶了伊莎贝尔，因此沃里克成了他的岳父。沃里克本人不是国王，却能凭军队和盟友帮助别人称王。',
        '沃里克与爱德华四世决裂后，转而支持亨利六世。安妮与兰开斯特王储的第一段婚姻，帮助巩固了这次联盟。',
        '1471 年，沃里克与王储先后死亡。安妮次年才嫁给理查；这不是她同时嫁给两个人，也不是沃里克有三个女儿。'
      ],
      detailSheet: 3,
      defaultPerson: 'warwick'
    }
  ],
  gender: {
    edward3: 'male', lionel: 'male', philippa: 'female', rogerMortimer: 'male',
    anneMortimer: 'female', edmundLangley: 'male', richardCambridge: 'male', johnGaunt: 'male',
    blanche: 'female', katherine: 'female', henry4: 'male', henry5: 'male', henry6: 'male',
    margaretAnjou: 'female', edwardWestminster: 'male', johnBeaufortEarl: 'male', johnBeaufortDuke: 'male',
    margaretBeaufort: 'female', edmundTudor: 'male', henry7: 'male', richardYork: 'male', cecily: 'female',
    edward4: 'male', elizabethWoodville: 'female', elizabethYork: 'female', edward5: 'male',
    richardShrewsbury: 'male', george: 'male', isabel: 'female', edwardWarwick: 'male', margaretPole: 'female',
    richard3: 'male', anneNeville: 'female', edwardMiddleham: 'male', ralph: 'male', joanBeaufort: 'female',
    richardSalisbury: 'male', aliceMontagu: 'female', warwick: 'male', anneBeauchamp: 'female', arthur: 'male', henry8: 'male'
  }
};
