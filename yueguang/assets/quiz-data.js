/* ============================================================
   站点配置：变现入口都在这里，改完保存刷新即生效
   留空 = 对应模块不显示
   ============================================================ */
const SITE = {
  brand: '',
  wechatId: '',
  qrcodeUrl: '',
  adClient: '',
  adSlotId: '',
  unlockUrl: '',
  unlockPrice: '¥9.9',
  siteUrl: 'https://xiaohei-buhei.github.io/yueguang'
};

function track(name) { if (typeof window.gtag === 'function') { window.gtag('event', name); } }

function adHTML() { return ''; }
function renderAd() {}

function payCardHTML(r) {
  if (!SITE.unlockUrl) return '';
  return '<div class="paycard">'
    + '<div class="pb">EXTENDED REPORT / 深度版</div>'
    + '<h3>「' + r.name + '」的那条街</h3>'
    + '<p class="lead">免费版告诉你「你像谁」，深度版告诉你「为什么像、现实里怎么走」。</p>'
    + '<ul>'
    + '<li>四维拆解：你和这个人最像的两处、最不像的一处</li>'
    + '<li>剧中三场戏对照：换成你会怎么做，代价是什么</li>'
    + '<li>现实版：亲情、爱情、钱这三件事上，你的默认反应与止损线</li>'
    + '<li>一张可以打印的「今年要改的一件事」清单</li>'
    + '</ul>'
    + '<a class="buy" href="' + SITE.unlockUrl + '" target="_blank" rel="noopener" onclick="track(\'unlock_click\')">获取深度版 · ' + SITE.unlockPrice + '</a>'
    + '<p class="fine">电子内容，付款后立即查看，不支持退款；免费版永久可测。</p>'
    + '</div>';
}

function gzhHTML() {
  if (!SITE.brand && !SITE.wechatId) return '';
  const qr = SITE.qrcodeUrl
    ? '<div class="qr"><img src="' + SITE.qrcodeUrl + '" alt="公众号二维码"></div>'
    : '<div class="qr">二维码<br>待上传</div>';
  return '<div class="gzh"><div class="txt">'
    + '<b>关注「' + (SITE.brand || '公众号') + '」拿完整人物档</b>'
    + '<p>这里只放了一套题。公众号里有 8 个人的完整解析、每周一个新测试，以及这套题从 0 到 1 的做法。</p>'
    + (SITE.wechatId ? '<p><b>ID</b> ' + SITE.wechatId + '</p>' : '')
    + '</div>' + qr + '</div>';
}

/* ============================================================
   数据层：四维 / 12 道二选一 / 8 个人物 / 隐藏形态
   ============================================================ */
const DIMS = [
  { id: 'EX', name: '表达方式', pos: 'S', neg: 'H', posLab: '说出口', negLab: '咽下去' },
  { id: 'LB', name: '爱的姿态', pos: 'Z', neg: 'Y', posLab: '争取',   negLab: '成全' },
  { id: 'KD', name: '待人尺度', pos: 'O', neg: 'M', posLab: '先顾人', negLab: '先顾自己' },
  { id: 'SD', name: '生活底色', pos: 'U', neg: 'G', posLab: '往外走', negLab: '留原地' }
];

/* 每题 = 一个具体情境（s）+ 两个做法（a / b）。
   v 是「选项 A」在相关维度上的方向（+1 靠正向字母，-1 靠反向字母），B 自动取反 */
const QUESTIONS = [
  { id: 'q1', tag: '哨子',
    s: '你和一个人约在街口。你们之间有个只有两个人懂的哨声：两短一长。今晚降温，你在风里站了四十分钟，手机一直没响。',
    a: { t: '再吹一遍那个哨。他若听见，自然会来；没听见，也就算了。', v: { EX: -1, LB: 1 } },
    b: { t: '直接走到他门口敲门，告诉他你在这儿等了多久。', v: { EX: 1, LB: -1 } } },

  { id: 'q2', tag: '一句话',
    s: '一桌人吃饭，有人当着所有人说了一句很难听的话，明摆着是冲你来的。桌上突然没人说话，筷子都停在半空。',
    a: { t: '把那句话咽下去，转头给他夹一筷子菜，先把场面圆回来。', v: { EX: -1, KD: 1 } },
    b: { t: '把筷子放下，把那句话原样说回去，说清你不接受。', v: { EX: 1, KD: -1 } } },

  { id: 'q3', tag: '他要走',
    s: '他拿到了外地的机会，明早的车。行李摊在床上，他一边叠衣服，一边问你：我这样走，你会不会怪我。',
    a: { t: '帮他把箱子扣好，替他打听那边的落脚处，笑着说：去吧。', v: { LB: 1, SD: -1 } },
    b: { t: '说：那我跟你一起走，明天我也收行李。', v: { LB: -1, SD: 1 } } },

  { id: 'q4', tag: '夜里',
    s: '半夜，家里出了事，钱和脸面都挂不住。天亮之前，必须有人拿一个主意出来，所有人都在等你说。',
    a: { t: '先把这一夜怎么过算清楚：谁吃饭、谁去医院、谁去跟人低头。', v: { KD: 1, SD: -1 } },
    b: { t: '先想自己：这件事之后我要去哪，这个家我还留不留。', v: { KD: -1, SD: 1 } } },

  { id: 'q5', tag: '生母',
    s: '你终于找到那个生你却没养你的人。她住在城另一头，开门的时候，看你的眼神里没有认出来。',
    a: { t: '站在门口，把准备了很多年的话咽回去，看一眼就走。', v: { EX: -1, SD: -1 } },
    b: { t: '坐下来，把憋了十几年的话，一句一句全说完。', v: { EX: 1, SD: 1 } } },

  { id: 'q6', tag: '朋友',
    s: '你和最好的朋友，喜欢上同一个人。那个人先来找你，说想跟你试试看。',
    a: { t: '你退了。你告诉那个人：我朋友比我更配你。', v: { LB: 1, KD: 1 } },
    b: { t: '你去争。你告诉朋友：就这件事，我不让。', v: { LB: -1, KD: -1 } } },

  { id: 'q7', tag: '误会',
    s: '整条街都在传一件你根本没做过的事。连当事人都信了，见面绕着走，也不接你电话。',
    a: { t: '不解释。信不信是他们的事，你照旧过你的日子。', v: { EX: -1, LB: 1 } },
    b: { t: '找上门去，哪怕吵一架，也要把那天的事一句一句说清。', v: { EX: 1, LB: -1 } } },

  { id: 'q8', tag: '借钱',
    s: '有人上门，向你借一笔不小的钱，说是救急。你知道这个人平时不太靠谱，可眼前他确实难。',
    a: { t: '借了，只留一句「先用着，不够再说」，之后再没提过。', v: { EX: -1, KD: 1 } },
    b: { t: '借，但把数目、还期、怎么还都讲清楚，还让他写下来。', v: { EX: 1, KD: -1 } } },

  { id: 'q9', tag: '婚礼',
    s: '你心里那个人要结婚了，请帖送到你手上，酒席就摆在十分钟路外的酒楼。',
    a: { t: '去。坐最后一排，红包给最厚的一封，敬完酒先走。', v: { LB: 1, SD: -1 } },
    b: { t: '去。坐第一桌，散席后把他叫到一边，问一句：你想清楚了吗。', v: { LB: -1, SD: 1 } } },

  { id: 'q10', tag: '一间店',
    s: '家里的店开了十几年，生意一天比一天淡。有人出价，让你把店顶出去，条件不算差。',
    a: { t: '不顶。把店重新整一遍，接着开，开到开不动为止。', v: { KD: 1, SD: -1 } },
    b: { t: '顶出去。拿着这笔钱，去另一个城市，从零开始。', v: { KD: -1, SD: 1 } } },

  { id: 'q11', tag: '订婚',
    s: '他订婚了。消息是别人告诉你的，不是他自己说的。第二天在街上碰见，他笑着跟你打招呼。',
    a: { t: '说「早就知道了」，笑着道一声喜，找个理由先走。', v: { EX: -1, LB: 1 } },
    b: { t: '当场问他：这件事，你为什么没跟我说过。', v: { EX: 1, LB: -1 } } },

  { id: 'q12', tag: '他回来',
    s: '几年之后他回来了，站在你门口，说这些年一直没放下。他手上没戴戒指，也没说以后怎么办。',
    a: { t: '说：你过得好就行，别管我。然后给他倒杯水，聊点别的。', v: { LB: 1, KD: 1 } },
    b: { t: '说：那你现在讲清楚，你要什么，别让我猜。', v: { LB: -1, KD: -1 } } }
];

/* 八个人物。变体按「往外走 / 留原地」二分 */
const CHARACTERS = {
  wenchu: {
    code: 'MO-01', name: '文初', en: 'THE QUIET ONE',
    sig: { EX: 'H', LB: 'Y', KD: 'O', SD: 'G' },
    vaxis: 'SD', variants: [{ letter: 'G', name: '守在原处' }, { letter: 'U', name: '远走他方' }],
    rarity: 15,
    tagline: '你把最想说的话，全留在了哨声里。',
    see: '街坊都说你脾气好、笑得暖。没人知道，你沉默的时候在想谁。',
    self: '你不是不会说，你是怕说出来，她就没有退路了。',
    strengths: ['别人的难处你看得见，还替人遮住', '答应的事一定做到，从不声张', '最难的时候还能笑一下，让别人安心'],
    blindspots: ['退惯了，退到后来连自己要什么都没说清', '把「为她好」当理由，替别人做了决定'],
    place: '街口那家店门口，谁都找得到你',
    role: '这条街上最靠得住的人、所有人的哥哥',
    nemesis: '把话说得很满、转头就忘的人'
  },
  junhao: {
    code: 'MO-02', name: '祝君好', en: 'THE SUNSHINE',
    sig: { EX: 'S', LB: 'Z', KD: 'O', SD: 'U' },
    vaxis: 'SD', variants: [{ letter: 'U', name: '走出去' }, { letter: 'G', name: '留在这条街' }],
    rarity: 13,
    tagline: '你想要的东西，从来都是伸手去拿的。',
    see: '「她一进门，整条街都亮了。」你是那种让人愿意靠近的人。',
    self: '你不是不懂事，你只是不肯把喜欢装成不喜欢。',
    strengths: ['喜欢就说，难过也不藏', '对谁都能搭把手，不看身份', '敢在最难看的时候把话说开'],
    blindspots: ['太直，容易没看见别人为你退的那一步', '被宠惯了，偶尔把别人的好当成应该'],
    place: '街心，走两步就有人在叫你',
    role: '这条街的女儿、朋友里最亮的那个',
    nemesis: '什么都不说、让你自己猜的人'
  },
  shajiao: {
    code: 'MO-03', name: '朱莎娇', en: 'THE MATRIARCH',
    sig: { EX: 'S', LB: 'Y', KD: 'O', SD: 'G' },
    vaxis: 'SD', variants: [{ letter: 'G', name: '守着这间店' }, { letter: 'U', name: '把人都送走' }],
    rarity: 14,
    tagline: '你嘴上最硬，做的事最软。',
    see: '「她骂你，也护你。」街坊都知道，这人刀子嘴。',
    self: '你不是爱算计，你是知道这条街上的钱来得不容易。',
    strengths: ['一眼看出谁在打什么主意', '再难也把家撑住，不让人看笑话', '骂完人转身就把最好的留给他'],
    blindspots: ['「为你好」说得太顺口，忘了问对方要不要', '习惯自己扛，不肯示弱'],
    place: '后台、自家店里，永远在忙的那个位置',
    role: '一家之主、街坊的主心骨',
    nemesis: '光会说漂亮话、不肯花力气的人'
  },
  lixin: {
    code: 'MO-04', name: '司徒礼信', en: 'THE OUTSIDER',
    sig: { EX: 'H', LB: 'Z', KD: 'O', SD: 'U' },
    vaxis: 'SD', variants: [{ letter: 'U', name: '追出去' }, { letter: 'G', name: '留下来陪' }],
    rarity: 11,
    tagline: '你不说漂亮话，但该做的事一件没落下。',
    see: '「他讲道理，不讲情面。」有人觉得你冷，也有人靠你赢过。',
    self: '你不是没有感情，你只是觉得喜欢一个人，该让她过得更好。',
    strengths: ['再乱也能理出头绪', '认准的事，一步一步做到', '不占人便宜，也不让人占'],
    blindspots: ['太讲道理，错过该抱一下的时候', '把「尊重她的选择」当成不开口的借口'],
    place: '桌前，摊开本子，先记下来再说',
    role: '外面来的人、把规矩带进这条街的人',
    nemesis: '答应得好听、事到临头就缩的人'
  },
  jinsheng: {
    code: 'MO-05', name: '金胜', en: 'THE STREET KID',
    sig: { EX: 'H', LB: 'Z', KD: 'M', SD: 'U' },
    vaxis: 'SD', variants: [{ letter: 'U', name: '杀出这条街' }, { letter: 'G', name: '困在原地' }],
    rarity: 12,
    tagline: '你把苦咽下去，把狠摆出来。',
    see: '「他不好惹，但对兄弟真。」街上的人这么说你，语气有点复杂。',
    self: '你不是天生横，你只是很早就知道，没人在你身后。',
    strengths: ['护得住自己人，谁动他就翻脸', '最烂的局面里也能找到活路', '记仇，也记恩'],
    blindspots: ['太怕被看轻，容易用力过猛', '把「我不需要谁」说得太真，最后真的没人靠近'],
    place: '街边、后门，站着就能看住全场',
    role: '这条街的狠角色、兄弟里最讲义气的',
    nemesis: '看不起你出身、还要你感恩的人'
  },
  yiwen: {
    code: 'MO-06', name: '江依文', en: 'THE ALL-IN',
    sig: { EX: 'S', LB: 'Z', KD: 'M', SD: 'U' },
    vaxis: 'SD', variants: [{ letter: 'U', name: '押上全部' }, { letter: 'G', name: '转身走开' }],
    rarity: 10,
    tagline: '你爱一个人，是把整条命押上去。',
    see: '「她疯起来谁都拦不住。」朋友心疼你，也怕你。',
    self: '你不是不知道会输，你只是不甘心只做旁观的那一个。',
    strengths: ['喜欢就全力以赴，不留余地', '敢做别人不敢做的选择', '受了伤也能自己站起来'],
    blindspots: ['把爱当成全部，别的都往后放', '越得不到，越不肯放手'],
    place: '他出现的地方，你总在附近',
    role: '爱得最烈的那个、故事里最不肯认输的人',
    nemesis: '把你一片真心当消遣的人'
  },
  zhanhui: {
    code: 'MO-07', name: '祝展辉', en: 'THE DISTANT ONE',
    sig: { EX: 'S', LB: 'Y', KD: 'M', SD: 'U' },
    vaxis: 'SD', variants: [{ letter: 'U', name: '走得更远' }, { letter: 'G', name: '停在体面里' }],
    rarity: 11,
    tagline: '你说话得体，退得也体面。',
    see: '「他是个好人，就是远。」认识你的人，客气里带一点距离。',
    self: '你不是不爱，你是习惯了把感情放进「以后再说」。',
    strengths: ['把场面处理得体面，不让人难堪', '答应的事会兑现，只是时间晚一点', '看得清局势，不轻易下注'],
    blindspots: ['太体面，真正的心里话一句没说', '把「等以后」当承诺，让别人等太久'],
    place: '主位，隔着桌子说话的位置',
    role: '从外面回来的人、所有人客客气气的那位',
    nemesis: '逼你当场表态、不给你退路的人'
  },
  hailin: {
    code: 'MO-08', name: '汪海琳', en: 'THE STEADY',
    sig: { EX: 'H', LB: 'Y', KD: 'M', SD: 'G' },
    vaxis: 'SD', variants: [{ letter: 'G', name: '守着柜台' }, { letter: 'U', name: '跟他走' }],
    rarity: 14,
    tagline: '你不吵不闹，但你把日子过得很稳。',
    see: '「她脾气最好。」可大家都知道，最好脾气的那个，往往最委屈。',
    self: '你不是没想法，你只是觉得有些话说出来，大家都不好过。',
    strengths: ['稳，谁慌你都不慌', '记得每个人的口味和习惯', '不抢功，事却做得最细'],
    blindspots: ['太能忍，忍到别人以为你不在意', '总把自己排在最后'],
    place: '柜台后，安安静静的那个位置',
    role: '这条街上最让人放心的那一个',
    nemesis: '得寸进尺、把你的忍让当默认的人'
  }
};

/* 四维组合 → 人物 的先验（与向量匹配共同决定结果） */
const TYPE_PRIOR = {
  HYOG: 'wenchu',   HYOU: 'wenchu',
  SZOU: 'junhao',   SZOG: 'junhao',
  SYOG: 'shajiao',  SYOU: 'shajiao',
  HZOU: 'lixin',    HZOG: 'lixin',
  HZMU: 'jinsheng', HZMG: 'jinsheng',
  SZMU: 'yiwen',    SZMG: 'yiwen',
  SYMU: 'zhanhui',  SYMG: 'zhanhui',
  HYMG: 'hailin',   HYMU: 'hailin'
};

const EXTREMES = {
  S: { need: 'S', label: '直白派', note: '你把话摆在明处，也把关系置于明处。' },
  H: { need: 'H', label: '闷葫芦', note: '你心里那句话，可能已经放了十年。' },
  Z: { need: 'Z', label: '不肯让', note: '你不觉得退一步就海阔天空，你只觉得再退就没位置了。' },
  Y: { need: 'Y', label: '成全癖', note: '你太会替别人选，选到最后自己成了那个被决定的人。' },
  O: { need: 'O', label: '心太软', note: '别人的难处你总能看见，自己的难处你总说没事。' },
  M: { need: 'M', label: '先顾己', note: '你不是自私，你是知道没人替你兜底。' },
  U: { need: 'U', label: '想走的人', note: '这条街再好，你心里也有一条更远的路。' },
  G: { need: 'G', label: '离不开这条街', note: '你不是走不了，是这里有一个人你放不下。' }
};
