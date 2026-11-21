/* ============================================================
   站点配置：变现入口都在这里，改完保存刷新即生效
   留空 = 对应模块不显示，站点保持干净
   ============================================================ */
const SITE = {
  brand: '',            // 公众号名，填了才会出现「关注」模块
  wechatId: '',         // 公众号 ID 或微信号
  qrcodeUrl: '',        // 公众号二维码图片（可放同目录，写成 './qr.png'）
  adClient: '',         // AdSense 发布商 ID，例如 'ca-pub-1234567890123456'
  adSlotId: '',         // AdSense 广告位 ID，例如 '1234567890'
  unlockUrl: '',        // 深度版购买/领取链接（知识星球、小报童、微信支付页等）
  unlockPrice: '¥9.9',  // 购买按钮上显示的价格
  siteUrl: 'https://xiaohei-buhei.github.io/shejiao'   // 站点地址，用于分享文案自传播
};

function track(name) { if (typeof window.gtag === 'function') { window.gtag('event', name); } }

function adHTML() {
  if (!SITE.adClient || !SITE.adSlotId) return '';
  return '<div class="adbox"><ins class="adsbygoogle" id="adIns" style="display:block"'
    + ' data-ad-client="' + SITE.adClient + '" data-ad-slot="' + SITE.adSlotId + '"'
    + ' data-ad-format="auto" data-full-width-responsive="true"></ins>'
    + '<div style="font-size:10px;color:var(--ink-3);letter-spacing:.1em;margin-top:8px">广告</div></div>';
}

function renderAd() {
  if (!SITE.adClient || !SITE.adSlotId) return;
  if (!document.getElementById('adsbygoogle-js')) {
    const s = document.createElement('script');
    s.id = 'adsbygoogle-js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + SITE.adClient;
    s.addEventListener('load', function () { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {} });
    document.head.appendChild(s);
  } else {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }
}

function payCardHTML(r) {
  if (!SITE.unlockUrl) return '';
  return '<div class="paycard">'
    + '<div class="pb">EXTENDED REPORT / 深度版</div>'
    + '<h3>「' + r.name + '」的电量说明书</h3>'
    + '<p class="lead">免费版告诉你「你是哪一档」，深度版告诉你「这周该排几场局」。</p>'
    + '<ul>'
    + '<li>一周社交配比表：能接几场、哪类局必须留出恢复时间</li>'
    + '<li>和另外 7 类人相处的应对方式，包括怎么体面地提前撤</li>'
    + '<li>你这类型人最容易耗电的三件事，以及止损办法</li>'
    + '<li>一张可打印的电量周记表</li>'
    + '</ul>'
    + '<a class="buy" href="' + SITE.unlockUrl + '" target="_blank" rel="noopener" onclick="track(\'unlock_click\')">获取深度版 · ' + SITE.unlockPrice + '</a>'
    + '<p class="fine">电子内容，付款后立即查看，不支持退款；免费版永久可测，不付费也能拿到完整结果。</p>'
    + '</div>';
}

function gzhHTML() {
  if (!SITE.brand && !SITE.wechatId) return '';
  const qr = SITE.qrcodeUrl
    ? '<div class="qr"><img src="' + SITE.qrcodeUrl + '" alt="公众号二维码"></div>'
    : '<div class="qr">二维码<br>待上传</div>';
  return '<div class="gzh"><div class="txt">'
    + '<b>关注「' + (SITE.brand || '公众号') + '」拿完整题库</b>'
    + '<p>这里只放了一套题。公众号里有 16 种人格的完整版文案、每周一个新测试，以及这套题从 0 到 1 的做法。</p>'
    + (SITE.wechatId ? '<p><b>ID</b> ' + SITE.wechatId + '</p>' : '')
    + '</div>' + qr + '</div>';
}

/* ============================================================
   数据层：四维定义 / 题库 / 八种社交原型 / 隐藏形态
   ============================================================ */
const DIMS = [
  { id: 'EI', name: '电量来源', pos: 'E', neg: 'I', posLab: '人群充电', negLab: '独处充电' },
  { id: 'SN', name: '话题落点', pos: 'S', neg: 'N', posLab: '具体事',   negLab: '氛围感' },
  { id: 'TF', name: '社交判断', pos: 'T', neg: 'F', posLab: '讲道理',   negLab: '顾感受' },
  { id: 'JP', name: '社交节奏', pos: 'J', neg: 'P', posLab: '先安排',   negLab: '看心情' }
];

/* 每题的维度符号 sign=+1 表示「越同意越靠近正向字母」，-1 表示反向表述 */
const QUESTIONS = [
  { id: 'q1',  tag: '散场', dim: 'EI', sign:  1, w: { lead: 2, captain: 1 },
    text: '一场活动结束，你反而更精神了，还想再找几个人坐着聊会儿。' },
  { id: 'q2',  tag: '恢复', dim: 'EI', sign: -1, w: { craftsman: 2, anchor: 1 },
    text: '聚完一场，你需要躲进车里或者洗手间待十分钟，才算缓过来。' },
  { id: 'q3',  tag: '陌生人', dim: 'EI', sign:  1, w: { glue: 2, lead: 1 },
    text: '到了一个大部分人不认识的场合，你会主动找人搭话，越聊越顺。' },
  { id: 'q4',  tag: '邀约', dim: 'EI', sign: -1, w: { strategist: 2, craftsman: 1 },
    text: '能在群里打字解决的事，你绝不想单独约人见一面。' },
  { id: 'q5',  tag: '落地', dim: 'SN', sign:  1, w: { captain: 2, craftsman: 1 },
    text: '别人兴致勃勃讲一个新计划，你第一句是：具体怎么落地、谁来做。' },
  { id: 'q6',  tag: '发散', dim: 'SN', sign: -1, w: { spark: 2, strategist: 1 },
    text: '聊一件事，你常从具体细节跳到「这背后其实反映了什么」。' },
  { id: 'q7',  tag: '细节', dim: 'SN', sign:  1, w: { craftsman: 2, anchor: 1 },
    text: '你记得住上次聚会谁点了什么、谁不能喝酒这种细节。' },
  { id: 'q8',  tag: '氛围', dim: 'SN', sign: -1, w: { glue: 2, spark: 1 },
    text: '一场局气氛好不好，你说不清为什么，但一进门就能感觉到。' },
  { id: 'q9',  tag: '直话', dim: 'TF', sign:  1, w: { strategist: 2, captain: 1 },
    text: '朋友跟你倾诉，你会直接指出他哪里做错了，哪怕他当下不高兴。' },
  { id: 'q10', tag: '照顾', dim: 'TF', sign: -1, w: { glue: 2, anchor: 1 },
    text: '有人被晾在一边，你会先去照顾他的感受，哪怕话题因此断掉。' },
  { id: 'q11', tag: '拒绝', dim: 'TF', sign:  1, w: { operator: 2, strategist: 1 },
    text: '推掉一个邀约，你能给出一句干脆的理由，不绕弯子，也不内疚。' },
  { id: 'q12', tag: '取舍', dim: 'TF', sign: -1, w: { glue: 2, lead: 1 },
    text: '「说清楚」和「别伤人」只能选一个时，你通常选后者。' },
  { id: 'q13', tag: '安排', dim: 'JP', sign:  1, w: { anchor: 2, captain: 1 },
    text: '约人之前，你会先把时间、地点、人数定好，再发消息。' },
  { id: 'q14', tag: '临时', dim: 'JP', sign: -1, w: { spark: 2, operator: 1 },
    text: '你更享受「临时起意，谁也说不准今晚会去哪」这种局。' },
  { id: 'q15', tag: '变动', dim: 'JP', sign:  1, w: { anchor: 2, craftsman: 1 },
    text: '局被人临时改了时间，你会有点烦躁，哪怕最后还是去了。' },
  { id: 'q16', tag: '突发', dim: 'JP', sign: -1, w: { spark: 2, operator: 1 },
    text: '被朋友半路叫去一个完全没准备的聚会，你反而觉得有点意思。' }
];

const OPTIONS = [
  { v: -2, label: '完全不像我', key: 'A' },
  { v: -1, label: '不太像',     key: 'B' },
  { v:  0, label: '说不清',     key: 'C' },
  { v:  1, label: '有点像',     key: 'D' },
  { v:  2, label: '就是我',     key: 'E' }
];

/* 八种社交原型。变体按「你更偏人还是更偏事」二分：people / task */
const ARCHETYPES = {
  lead: {
    code: 'SE-01', name: '场控王', en: 'THE HOST',
    vaxis: 'SN', variants: [{ letter: 'S', name: '现实场控' }, { letter: 'N', name: '氛围场控' }],
    rarity: 12,
    tagline: '你一坐下，这桌就有话题了。',
    colleagues: '朋友说你是「那个能把冷场救回来的人」。人一多，大家会先看你一眼，再等你说第一句。',
    self: '只有你自己知道，进场前那三分钟，你在门口把开场的话默背了一遍。',
    strengths: ['把不认识的人聊到一处去，中间不用你介绍三遍', '冷场时敢先开口，替所有人挡下沉默', '知道谁在等一个眼神，也递得出去'],
    blindspots: ['容易把「聊得好」当成「关系好」', '散场后常觉得自己说多了，回家复盘半天'],
    desk: '靠门口、随时能起身招呼人的位置',
    role: '聚会主理人、群里活跃的那个、外联担当',
    nemesis: '全程低头玩手机，问三句答一个「嗯」的人'
  },
  strategist: {
    code: 'SE-02', name: '社交精算师', en: 'THE CALCULATOR',
    vaxis: 'JP', variants: [{ letter: 'J', name: '排期型精算' }, { letter: 'P', name: '临场型精算' }],
    rarity: 10,
    tagline: '你在心里默默算过：这场局值不值得我出门。',
    colleagues: '「他很少出现，但出现了就聊得很深」——朋友常这么评价你。你不爱凑数，只赴值得的约。',
    self: '你不是冷淡，你只是在算这一晚上的电量，够不够撑到回家。',
    strengths: ['一眼看出这局里谁是主角、谁在硬撑', '信息不全时也能判断该不该去', '不被气氛带走，能及时抽身'],
    blindspots: ['算得太久，错过本来会很好的局', '容易低估「先去了再说」的价值'],
    desk: '角落、背靠墙、出口在视线范围内',
    role: '一对一面谈、深度关系维护、把关型朋友',
    nemesis: '临时拉群、一句「都来啊」就把你算进去的人'
  },
  craftsman: {
    code: 'SE-03', name: '隐形打点者', en: 'THE FIXER',
    vaxis: 'JP', variants: [{ letter: 'J', name: '流程打点' }, { letter: 'P', name: '救场打点' }],
    rarity: 17,
    tagline: '没人注意你做了什么，但少了你，这局会乱。',
    colleagues: '订位、拼车、谁不吃辣、谁过敏，都是你在记。没人夸，但下次还是找你。',
    self: '你在意的不是被看见，是散场时没出岔子。',
    strengths: ['把一场局的所有细节提前想到', '对人情世故的颗粒度远超常人', '答应过的事，基本不会掉链子'],
    blindspots: ['不太会说「这事我安排的」，做了十分被记住三分', '被临时加活时，容易闷着不说'],
    desk: '离出口近、能顺手处理杂事的位置',
    role: '活动执行、后勤、把场子撑住的人',
    nemesis: '说「随便」却对每个安排都不满意的人'
  },
  operator: {
    code: 'SE-04', name: '关系穿针者', en: 'THE CONNECTOR',
    vaxis: 'SN', variants: [{ letter: 'S', name: '熟人网络型' }, { letter: 'N', name: '跨界引荐型' }],
    rarity: 8,
    tagline: '你想认识谁，通常三步之内就能搭上话。',
    colleagues: '「这事找他，可能有门路。」需要人、需要资源、需要一句介绍，你总能找到那条路。',
    self: '你不是爱social，你只是受不了「明明能认识」却隔着一层。',
    strengths: ['对谁和谁能聊到一块，心里有张图', '能在陌生场合迅速找到切入点', '临场反应快，不怕场面尴尬'],
    blindspots: ['认识的人多了，真正熟的没几个', '容易把「加上了」当成「有关系」'],
    desk: '靠通道、随时能起身去另一桌的位置',
    role: '引荐、撮合、跨界合作',
    nemesis: '一句「没必要认识那么多人」，把门关上的人'
  },
  glue: {
    code: 'SE-05', name: '情绪缓冲垫', en: 'THE CUSHION',
    vaxis: 'JP', variants: [{ letter: 'J', name: '后勤缓冲' }, { letter: 'P', name: '临场缓冲' }],
    rarity: 18,
    tagline: '这桌没冷掉，很多时候是因为你在中间垫着。',
    colleagues: '你是那个会注意到「他今天话很少」的人。桌上的火药味，常在你一句玩笑之后降下来。',
    self: '你也会累，只是你更怕别人难受。',
    strengths: ['能接住情绪，也能把情绪翻译成需求', '天然知道每个人真正在意什么', '冲突里，能让双方都下得来台'],
    blindspots: ['习惯性接话接活，边界越接越模糊', '会把「大家都舒服」放在「自己舒服」前面'],
    desk: '桌子正中间、抬眼能看见所有人的位置',
    role: '气氛调节、矛盾缓冲、朋友的树洞',
    nemesis: '把情绪当矫情、说话不顾场合的人'
  },
  captain: {
    code: 'SE-06', name: '组局队长', en: 'THE ORGANIZER',
    vaxis: 'SN', variants: [{ letter: 'S', name: '说走就走型' }, { letter: 'N', name: '主题局策划' }],
    rarity: 13,
    tagline: '群里那句「周六走起」，通常是你发的。',
    colleagues: '你像那个永远在推进度的人。局要黄了、人凑不齐的时候，大家等你说一句「定了」。',
    self: '你也会怕没人来，只是你知道，你一犹豫，这事就没了。',
    strengths: ['把「改天约」变成具体的时间和地点', '敢在没人吭声的时候先定下来', '对结果负责，不推给「大家太忙」'],
    blindspots: ['节奏太快，容易把不想去的人也拽上', '不太容得下「小而慢」的局'],
    desk: '能看见全场、随时能站起来拍板的位置',
    role: '组局、活动召集、把散的人聚起来',
    nemesis: '永远回「看情况」，最后谁也没去成的人'
  },
  spark: {
    code: 'SE-07', name: '电量突变体', en: 'THE MUTANT',
    vaxis: 'SN', variants: [{ letter: 'N', name: '灵感突变' }, { letter: 'S', name: '气氛突变' }],
    rarity: 7,
    tagline: '前半场你是全场最亮的，后半场你人不见了。',
    colleagues: '你的状态像信号：有时满格，有时彻底断联。朋友既期待你来，又赌不准你几点走。',
    self: '你不是不合群，你只是电量掉得比别人快，也充得比别人猛。',
    strengths: ['能把沉闷的场面一下点着', '对新面孔、新场合上手极快', '敢在所有人都没想法时先抛一个'],
    blindspots: ['热情来得快去得也快，收尾常要别人接', '讨厌重复的局，同一个圈子待久了会消失'],
    desk: '不固定，最好能随时换个地方坐',
    role: '破冰、带动气氛、把新鲜事带进圈子',
    nemesis: '一场局从头到尾按流程走、连座位都排好的人'
  },
  anchor: {
    code: 'SE-08', name: '稳定在场者', en: 'THE STEADY',
    vaxis: 'JP', variants: [{ letter: 'J', name: '固定班底' }, { letter: 'P', name: '随叫随到' }],
    rarity: 15,
    tagline: '你话不多，但你一直在，大家就放松了。',
    colleagues: '你不抢话，也不缺席。有人说「有你在我就敢去」，这句话通常是真的。',
    self: '你不是没有想法，你只是更在意「别让这场散了」。',
    strengths: ['稳定输出，情绪几乎不外溢', '对老朋友的近况，心里有本账', '场合再乱也顶得住，不慌'],
    blindspots: ['不太主动发起，容易被当成理所当然', '圈子变化太快时，会先抵触再适应'],
    desk: '固定的位置，坐下去就是你的',
    role: '老朋友、固定搭子、长期关系维护',
    nemesis: '半年不联系、突然热情似火的人'
  }
};

/* MBTI 编码 → 原型 的先验映射（与题库加权共同决定结果） */
const TYPE_PRIOR = {
  ENFJ: 'lead', ESFJ: 'lead',
  INTJ: 'strategist', INTP: 'strategist',
  ISTJ: 'craftsman', ISTP: 'craftsman',
  ESTP: 'operator', ENTP: 'operator',
  INFJ: 'glue', INFP: 'glue',
  ENTJ: 'captain', ESTJ: 'captain',
  ENFP: 'spark', ESFP: 'spark',
  ISFJ: 'anchor', ISFP: 'anchor'
};

/* 极端形态：某一维强度过高时额外解锁 */
const EXTREMES = {
  E: { need: 'E', label: '社交永动机', note: '散场对你来说不是结束，是下一场的开始。' },
  I: { need: 'I', label: '静音模式', note: '你不是不喜欢人，你只是需要一间没有人的房间。' },
  S: { need: 'S', label: '现场主义者', note: '「具体点说」是你的口头禅，也是你的护身符。' },
  N: { need: 'N', label: '脑内预演', note: '你已经在脑内把这场局演了三遍，包括怎么撤。' },
  T: { need: 'T', label: '直球选手', note: '你把「有话直说」执行到了让人有点招架不住的程度。' },
  F: { need: 'F', label: '情绪雷达', note: '你照顾完所有人的情绪，才想起自己也累了。' },
  J: { need: 'J', label: '行程控', note: '你的日历比朋友的热情更可靠。' },
  P: { need: 'P', label: '随缘派', note: '你的到场时间，和「临时起意」的距离成反比。' }
};
