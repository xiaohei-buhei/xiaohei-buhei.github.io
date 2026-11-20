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
  siteUrl: 'https://xiaohei-buhei.github.io'           // 站点地址，用于分享文案自传播
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
    + '<h3>「' + r.name + '」的下一步：把职场路径往前推三年</h3>'
    + '<p class="lead">免费版告诉你「你是谁」，深度版告诉你「接下来怎么走」。</p>'
    + '<ul>'
    + '<li>同类人格的 3 年路径推演：继续做执行，还是转管理</li>'
    + '<li>和另外 7 类同事沟通的话术模板，照着说就行</li>'
    + '<li>你这一类人最容易踩的 3 个坑，以及提前避开的方法</li>'
    + '<li>一张可打印的年度复盘表</li>'
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
   数据层：四维定义 / 题库 / 八种职场原型 / 隐藏形态
   ============================================================ */
const DIMS = [
  { id: 'EI', name: '表达方式', pos: 'E', neg: 'I', posLab: '外放', negLab: '内敛' },
  { id: 'SN', name: '关注焦点', pos: 'S', neg: 'N', posLab: '落地', negLab: '抽象' },
  { id: 'TF', name: '决策依据', pos: 'T', neg: 'F', posLab: '理性', negLab: '共情' },
  { id: 'JP', name: '工作节奏', pos: 'J', neg: 'P', posLab: '秩序', negLab: '随性' }
];

/* 每题的维度符号 sign=+1 表示「越同意越靠近正向字母」，-1 表示反向表述 */
const QUESTIONS = [
  { id: 'q1',  tag: '会议', dim: 'EI', sign:  1, w: { lead: 2, captain: 1 },
    text: '周会上被点名「你有什么想法」，你能当场讲出三条，而且越讲越顺。' },
  { id: 'q2',  tag: '精力', dim: 'EI', sign: -1, w: { craftsman: 2, anchor: 1 },
    text: '连开三场会后，你只想戴上耳机，假装自己不在线。' },
  { id: 'q3',  tag: '关系', dim: 'EI', sign:  1, w: { glue: 2, lead: 1 },
    text: '团建时你天然负责张罗座位、拉群、加微信。' },
  { id: 'q4',  tag: '沟通', dim: 'EI', sign: -1, w: { craftsman: 2, strategist: 1 },
    text: '跨部门有事，你宁可写一整段文字，也不想打那个电话。' },
  { id: 'q5',  tag: '交付', dim: 'SN', sign:  1, w: { captain: 2, craftsman: 1 },
    text: '老板说「先做个大概方案」，你先问的是：预算多少、几号交、做到什么程度。' },
  { id: 'q6',  tag: '想象', dim: 'SN', sign: -1, w: { strategist: 2, spark: 1 },
    text: '通勤路上你常想三年后这行会变成什么样，越想越精神。' },
  { id: 'q7',  tag: '判断', dim: 'SN', sign:  1, w: { craftsman: 2, strategist: 1, anchor: 1 },
    text: '你更信上周那张数据表，不太信会上那句「我觉得」。' },
  { id: 'q8',  tag: '直觉', dim: 'SN', sign: -1, w: { glue: 2, operator: 1 },
    text: '一句含糊的需求，你能听出对方真正想要的那个「感觉」。' },
  { id: 'q9',  tag: '真话', dim: 'TF', sign:  1, w: { captain: 2, strategist: 1 },
    text: '同事方案有明显漏洞，你会当场指出来，气氛有点尴尬也照说。' },
  { id: 'q10', tag: '关系', dim: 'TF', sign: -1, w: { glue: 2, anchor: 1 },
    text: '组里谁状态不对，你通常比 HR 更早发现。' },
  { id: 'q11', tag: '取舍', dim: 'TF', sign:  1, w: { strategist: 2, operator: 1 },
    text: '做取舍时，你先算投入产出，再考虑大家的心情。' },
  { id: 'q12', tag: '取舍', dim: 'TF', sign: -1, w: { glue: 2, lead: 1 },
    text: '「正确」和「体面」只能选一个，你常常选体面。' },
  { id: 'q13', tag: '节奏', dim: 'JP', sign:  1, w: { anchor: 2, captain: 1 },
    text: '你的待办清单有颜色、有优先级、有截止时间。' },
  { id: 'q14', tag: '节奏', dim: 'JP', sign: -1, w: { spark: 2, operator: 1 },
    text: '任务总拖到最后一晚，然后在压力里爆发式完成。' },
  { id: 'q15', tag: '秩序', dim: 'JP', sign:  1, w: { anchor: 2, craftsman: 1 },
    text: '计划被打乱会让你烦躁，哪怕只是会议临时改了时间。' },
  { id: 'q16', tag: '适应', dim: 'JP', sign: -1, w: { spark: 2, operator: 1 },
    text: '被临时拉进一个完全没准备的会，你反而觉得有点意思。' }
];

const OPTIONS = [
  { v: -2, label: '完全不像我', key: 'A' },
  { v: -1, label: '不太像',     key: 'B' },
  { v:  0, label: '说不清',     key: 'C' },
  { v:  1, label: '有点像',     key: 'D' },
  { v:  2, label: '就是我',     key: 'E' }
];

/* 八种职场原型。变体按「你更偏人还是更偏事」二分：people / task */
const ARCHETYPES = {
  lead: {
    code: 'WP-01', name: '台前主角', en: 'THE FRONT',
    vaxis: 'SN', variants: [{ letter: 'S', name: '务实型主角' }, { letter: 'N', name: '愿景型主角' }],
    rarity: 12,
    tagline: '你不一定最懂，但你一开口，会议室就有了结论。',
    colleagues: '同事觉得你是「那个能把事情说明白的人」。方案卡住的时候，大家会先看你一眼，再等你说第一句。',
    self: '只有你自己知道，开场前那三分钟，你在洗手间里把话默背了一遍。',
    strengths: ['把复杂的事讲成一句人话，让外行也能点头', '冷场时敢先开口，替所有人挡下沉默', '知道谁在等一个眼神，也递得出去'],
    blindspots: ['容易把「讲清楚了」当成「做完了」', '会把别人不接话，解读成不认同'],
    desk: '靠过道、能随时站起来说话的位置',
    role: '汇报、对外沟通、跨部门牵头',
    nemesis: '全程低头不表态，会后单独找你「其实我觉得」的人'
  },
  strategist: {
    code: 'WP-02', name: '冷面军师', en: 'THE QUIET ENGINE',
    vaxis: 'JP', variants: [{ letter: 'J', name: '推演型军师' }, { letter: 'P', name: '临场军师' }],
    rarity: 10,
    tagline: '别人在讨论方案，你在心里已经把三种结局演完了。',
    colleagues: '「他好像早就想过了」——同事最常这样评价你。开会你话不多，但你说出那句，往往就是结论。',
    self: '你不是冷淡，你只是在等一个值得开口的时机。',
    strengths: ['信息不全时，也能先搭出一个可用框架', '对风险有近乎生理性的敏感', '不被情绪带走，能把争议拉回事实'],
    blindspots: ['推演太久，错过开口的窗口', '容易低估「先做出来再改」的价值'],
    desk: '角落、背靠墙、屏幕不被人从后面看到',
    role: '策略、方案设计、复盘与风险控制',
    nemesis: '不做功课就上会，还特别自信的人'
  },
  craftsman: {
    code: 'WP-03', name: '隐形匠人', en: 'THE CRAFTSMAN',
    vaxis: 'JP', variants: [{ letter: 'J', name: '流程工匠' }, { letter: 'P', name: '救火工匠' }],
    rarity: 17,
    tagline: '你不抢功，但东西一到你手上，就变得能用。',
    colleagues: '每次出问题，大家第一个想到你。不是因为你职级高，是因为你知道它到底怎么运转。',
    self: '你在意的不是被看见，是那版东西交出去的时候，自己心里过得去。',
    strengths: ['把含糊的需求，落成能执行的一二三四', '对细节的耐心远超常人', '答应过的事，基本不会掉链子'],
    blindspots: ['不太会「汇报」，做了十分被看见三分', '被临时插队时，容易闷着不说'],
    desk: '安静、有一块第二屏、离打印机不远',
    role: '交付、技术实现、质量把关',
    nemesis: '只会画饼、把「大概」当需求的同事'
  },
  operator: {
    code: 'WP-04', name: '曲线操盘手', en: 'THE OPERATOR',
    vaxis: 'SN', variants: [{ letter: 'S', name: '资源玩家' }, { letter: 'N', name: '规则黑客' }],
    rarity: 8,
    tagline: '直线走不通的时候，你知道还有哪扇门没锁。',
    colleagues: '「这事找他，可能有办法。」流程卡住、资源不够、时间不够，你总能找到那条不怎么漂亮但很有效的路。',
    self: '你不是爱走捷径，你只是受不了「明明可以」却被一道流程挡着。',
    strengths: ['对人和资源的连接关系，异常清楚', '能在规则缝隙里找到可行解', '临场反应快，不怕场面失控'],
    blindspots: ['绕过流程久了，会被人当成不可控', '容易把「搞定」当成「做好了」'],
    desk: '靠门口、随时能起身出去找人',
    role: '跨团队协调、资源争取、危机处理',
    nemesis: '一句「按规定就是这样」，把所有人的路都堵死的人'
  },
  glue: {
    code: 'WP-05', name: '团队粘合剂', en: 'THE GLUE',
    vaxis: 'JP', variants: [{ letter: 'J', name: '后勤大管家' }, { letter: 'P', name: '情绪缓冲垫' }],
    rarity: 18,
    tagline: '团队没散，很多时候是因为你在中间垫着。',
    colleagues: '你是那个会记得谁最近状态不好的人。群里的火药味，通常在你一句玩笑之后降下来。',
    self: '你也会累，只是你更怕别人难受。',
    strengths: ['能接住情绪，也能把情绪翻译成需求', '天然知道每个人真正在意什么', '冲突里，能让双方都下得来台'],
    blindspots: ['习惯性接活，边界越接越模糊', '会把「大家都好」放在「事情做好」前面'],
    desk: '团队正中间、抬眼能看见所有人',
    role: '项目管理、客户成功、团队协作',
    nemesis: '把情绪当软弱、出了事只会甩锅的人'
  },
  captain: {
    code: 'WP-06', name: '冲锋队长', en: 'THE CAPTAIN',
    vaxis: 'SN', variants: [{ letter: 'S', name: '指标突击队长' }, { letter: 'N', name: '前瞻指挥官' }],
    rarity: 13,
    tagline: '指标压下来的那天，你先站起来说：这个我来。',
    colleagues: '你像那个永远在推进度的人。会开不完、事推不动的时候，大家会等你拍板。',
    self: '你也会怕，只是你知道，你一犹豫，队形就散了。',
    strengths: ['把目标拆成别人听得懂的下一步', '敢在不确定的时候先承担', '对结果负责，不推给客观原因'],
    blindspots: ['节奏太快，容易把人当资源用', '不太容得下「慢一点但更好」的方案'],
    desk: '白板旁边、能看到全组进度的位置',
    role: '业务负责人、项目攻坚、团队管理',
    nemesis: '每次都说「再看看」，把决定一直往后拖的人'
  },
  spark: {
    code: 'WP-07', name: '混沌变量', en: 'THE SPARK',
    vaxis: 'SN', variants: [{ letter: 'N', name: '灵感喷泉' }, { letter: 'S', name: '气氛发动机' }],
    rarity: 7,
    tagline: '你不在流程里，但你常常是流程被改写的原因。',
    colleagues: '你的想法一半被否，一半后来成了主线。开会时大家既期待你开口，又有点怕你开口。',
    self: '你不是不靠谱，你只是受不了按部就班地把同一件事做第三遍。',
    strengths: ['所有人都没思路时，你敢先抛出可能性', '对新鲜事物上手极快', '能把沉闷的场面点着'],
    blindspots: ['热情消退得也快，收尾常要别人接手', '讨厌重复性工作，细节上容易翻车'],
    desk: '不固定的位置，最好能随时换个地方坐',
    role: '创意、增长、新业务探索',
    nemesis: '一切都要先走审批、再排期两个月的流程'
  },
  anchor: {
    code: 'WP-08', name: '定海神针', en: 'THE ANCHOR',
    vaxis: 'JP', variants: [{ letter: 'J', name: '流程守护者' }, { letter: 'P', name: '团队压舱石' }],
    rarity: 15,
    tagline: '出事的时候，最后一个还坐在工位上的通常是你。',
    colleagues: '你话不多，但大家都知道，交给你的事不用再问第二遍。',
    self: '你不是没有想法，你只是更在意「别让它塌」。',
    strengths: ['稳定输出，情绪几乎不外溢', '对流程和历史遗留问题，心里有本账', '关键时刻顶得住，不慌'],
    blindspots: ['不太主动争取，容易被当成理所当然', '变化来得太快时，会先抵触再适应'],
    desk: '固定、熟悉、抽屉里有全套备用线',
    role: '运营、客服、后台支撑、老项目维护',
    nemesis: '一天一个新方向、改完就忘的人'
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
  E: { need: 'E', label: '社交电量异常', note: '你的存在感本身就是一种办公设备。' },
  I: { need: 'I', label: '静默模式', note: '你不是不合群，你只是需要一间没有人的会议室。' },
  S: { need: 'S', label: '现实主义满级', note: '「先落地」是你的口头禅，也是你的护身符。' },
  N: { need: 'N', label: '脑内小剧场', note: '你已经在脑内把这个项目做完三遍了。' },
  T: { need: 'T', label: '情绪防火墙', note: '你把「对事不对人」执行到了令人敬畏的程度。' },
  F: { need: 'F', label: '共情过载', note: '你替所有人考虑完之后，才想起自己也在加班。' },
  J: { need: 'J', label: '控制欲超标', note: '你的日历比公司制度更严格。' },
  P: { need: 'P', label: '截止日期驱动', note: '你的效率与 deadline 的距离成反比。' }
};
