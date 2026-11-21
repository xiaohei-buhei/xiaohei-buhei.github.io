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
  siteUrl: 'https://xiaohei-buhei.github.io/cuican'   // 站点地址，用于分享文案自传播
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
    + '<h3>「' + r.name + '」的人设说明书</h3>'
    + '<p class="lead">免费版告诉你「你像谁」，深度版告诉你「为什么像、现实里怎么用」。</p>'
    + '<ul>'
    + '<li>四维拆解：你和这个角色最像的三处、最不像的一处</li>'
    + '<li>关系图谱：你在这张人物网里站哪一格，和另外 7 位怎么相处</li>'
    + '<li>三个真实场景的应对：被抢功、被当棋子、被要求站队</li>'
    + '<li>台词本：10 句可以照着用的场面话，不油、不硬</li>'
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
    + '<b>关注「' + (SITE.brand || '公众号') + '」拿完整人设档</b>'
    + '<p>这里只放了一套题。公众号里有 8 位角色的完整解析、每周一个新测试，以及这套题从 0 到 1 的做法。</p>'
    + (SITE.wechatId ? '<p><b>ID</b> ' + SITE.wechatId + '</p>' : '')
    + '</div>' + qr + '</div>';
}

/* ============================================================
   数据层：四维定义 / 题库 / 八位人物原型 / 隐藏形态
   ============================================================ */
const DIMS = [
  { id: 'GS', name: '目标取向', pos: 'G', neg: 'S', posLab: '争位',  negLab: '守成' },
  { id: 'MU', name: '手段偏好', pos: 'M', neg: 'U', posLab: '谋算',  negLab: '明着来' },
  { id: 'RH', name: '情感驱动', pos: 'R', neg: 'H', posLab: '先算账', negLab: '先看人' },
  { id: 'FB', name: '姿态呈现', pos: 'F', neg: 'B', posLab: '站台前', negLab: '藏幕后' }
];

/* 每题的维度符号 sign=+1 表示「越同意越靠近正向字母」，-1 表示反向表述 */
const QUESTIONS = [
  { id: 'q1',  tag: '位置', dim: 'GS', sign:  1, w: { xian: 2, xueying: 2, haiyun: 2, xiaojun: 2 },
    text: '开会时，你会先留意「这个位置该谁坐」，而不是「这件事有没有办好」。' },
  { id: 'q2',  tag: '放手', dim: 'GS', sign: -1, w: { zhichen: 2, jinghong: 2, shiya: 2, peihua: 2 },
    text: '有人要把你手里的事拿走，你的第一反应是「给他吧，别撕破脸」。' },
  { id: 'q3',  tag: '站队', dim: 'GS', sign:  1, w: { xian: 2, xueying: 2, haiyun: 2, xiaojun: 2 },
    text: '需要表态的时候，你会明确站到某一边，而不是留在中间。' },
  { id: 'q4',  tag: '守摊', dim: 'GS', sign: -1, w: { zhichen: 2, jinghong: 2, shiya: 2, peihua: 2 },
    text: '你宁愿把手里这一摊事守住、做深，也不想去抢一个更大的盘子。' },

  { id: 'q5',  tag: '借力', dim: 'MU', sign:  1, w: { xian: 2, xueying: 2, zhichen: 2, jinghong: 2 },
    text: '要做成一件事，你会先想「谁能帮我说上话」，再动手。' },
  { id: 'q6',  tag: '明说', dim: 'MU', sign: -1, w: { haiyun: 2, xiaojun: 2, shiya: 2, peihua: 2 },
    text: '你更愿意把话摆在明处，哪怕因此得罪人。' },
  { id: 'q7',  tag: '留牌', dim: 'MU', sign:  1, w: { xian: 2, xueying: 2, zhichen: 2, jinghong: 2 },
    text: '事情还没定，你会先留一张牌在自己手里。' },
  { id: 'q8',  tag: '用人', dim: 'MU', sign: -1, w: { haiyun: 2, xiaojun: 2, shiya: 2, peihua: 2 },
    text: '你受不了拐弯抹角，用人第一眼先看能力和规矩。' },

  { id: 'q9',  tag: '权衡', dim: 'RH', sign:  1, w: { xian: 2, haiyun: 2, zhichen: 2, shiya: 2 },
    text: '做决定时，你先看这件事划不划算，再看谁会不会难受。' },
  { id: 'q10', tag: '为人', dim: 'RH', sign: -1, w: { xueying: 2, xiaojun: 2, jinghong: 2, peihua: 2 },
    text: '明知不划算，你还是会为一个重要的人去做。' },
  { id: 'q11', tag: '感情牌', dim: 'RH', sign:  1, w: { xian: 2, haiyun: 2, zhichen: 2, shiya: 2 },
    text: '有人跟你打感情牌，你心里会先把这笔账算一遍。' },
  { id: 'q12', tag: '旧情', dim: 'RH', sign: -1, w: { xueying: 2, xiaojun: 2, jinghong: 2, peihua: 2 },
    text: '因为有人当年帮过你，关键时刻你会放过他一次。' },

  { id: 'q13', tag: '领功', dim: 'FB', sign:  1, w: { xian: 1, xueying: 1, haiyun: 1, xiaojun: 1, zhichen: 1, jinghong: 1, shiya: 1, peihua: 1 },
    text: '有功劳的时候，你不介意站在最前面，被人看见。' },
  { id: 'q14', tag: '让位', dim: 'FB', sign: -1, w: { xian: 1, xueying: 1, haiyun: 1, xiaojun: 1, zhichen: 1, jinghong: 1, shiya: 1, peihua: 1 },
    text: '你更习惯让别人去领那份掌声，自己在后面把事情做实。' },
  { id: 'q15', tag: '出面', dim: 'FB', sign:  1, w: { xian: 1, xueying: 1, haiyun: 1, xiaojun: 1, zhichen: 1, jinghong: 1, shiya: 1, peihua: 1 },
    text: '轮到你出面，你会把话说得很漂亮，也愿意被记住。' },
  { id: 'q16', tag: '布局', dim: 'FB', sign: -1, w: { xian: 1, xueying: 1, haiyun: 1, xiaojun: 1, zhichen: 1, jinghong: 1, shiya: 1, peihua: 1 },
    text: '你更愿意在没人注意的时候把局布好，等结果自己浮上来。' }
];

const OPTIONS = [
  { v: -2, label: '完全不像我', key: 'A' },
  { v: -1, label: '不太像',     key: 'B' },
  { v:  0, label: '说不清',     key: 'C' },
  { v:  1, label: '有点像',     key: 'D' },
  { v:  2, label: '就是我',     key: 'E' }
];

/* 八位人物。变体按「你更站在台前，还是更藏在幕后」二分：front / back */
const ARCHETYPES = {
  xian: {
    code: 'TC-01', name: '官孝贤', en: 'THE ELDEST',
    vaxis: 'FB', variants: [{ letter: 'F', name: '明面夺权' }, { letter: 'B', name: '暗地布局' }],
    rarity: 9,
    tagline: '你要的不是赢一次，是让所有人做决定前先想一下你的意思。',
    colleagues: '「他笑起来最客气，也最难猜。」认识你的人这么说。你从不把真实打算写在脸上。',
    self: '你不是天生爱斗，是很早就明白：在这样的家里，不争就等于出局。',
    strengths: ['能把一件事拆成几步，每一步都留着退路', '看得懂谁在怕什么，也知道怎么用这一点', '关键时刻敢下重手，从不拖到明天'],
    blindspots: ['算得太满，把身边人也一起算进了棋盘', '赢了局，却输掉愿意跟你说真话的人'],
    desk: '长桌主位左手边，说话前先把在场的人看一遍',
    role: '掌局的长子、拍板的人、对外谈判的那张嘴',
    nemesis: '什么都不争、却总能拿到好处的人'
  },
  xueying: {
    code: 'TC-02', name: '王雪莹', en: 'THE AMBITIOUS',
    vaxis: 'FB', variants: [{ letter: 'F', name: '明面好胜' }, { letter: 'B', name: '暗自铺路' }],
    rarity: 11,
    tagline: '你想要的东西，从来不打算等别人点头。',
    colleagues: '「她笑着的时候，你得留神。」你不否认——在这个家里，好人缘换不来位置。',
    self: '你所有的狠，都有一个很私人的理由：你想护住的那个人。',
    strengths: ['一眼看出谁跟谁不合、谁的话能借', '能为了一个人做到别人做不到的事', '被误解也不解释，继续往前走'],
    blindspots: ['爱得太用力，容易把对方也逼到墙角', '一旦被背叛，会做出连自己都后怕的事'],
    desk: '离自己人最近的位置，随时能替他把话接过去',
    role: '二少奶、幕后推手、替自己人开路的那一个',
    nemesis: '站得高、却什么都不做的人'
  },
  haiyun: {
    code: 'TC-03', name: '洪海允', en: 'THE PROSECUTOR',
    vaxis: 'FB', variants: [{ letter: 'F', name: '台前亮剑' }, { letter: 'B', name: '幕后取证' }],
    rarity: 12,
    tagline: '你手里只有一把剑，但你把它磨得很亮。',
    colleagues: '「她讲话像在庭上。」你习惯把情绪放到证据后面：先问事实，再谈感受。',
    self: '你不是不难过，你只是知道，一哭就没人再听你讲道理。',
    strengths: ['最乱的时候还能把话讲清楚', '不吃情绪这一套，也不被人带节奏', '被伤过之后，反而更清楚自己要什么'],
    blindspots: ['把「讲道理」当成唯一的安全感', '狠起来的时候，会忘记自己也会疼'],
    desk: '靠窗，桌上一份材料摊开，字斟句酌',
    role: '检控官、谈判桌对面最难缠的那个、把规则当武器的人',
    nemesis: '用感情代替道理、还要你认的人'
  },
  xiaojun: {
    code: 'TC-04', name: '官孝君', en: 'THE HEIR',
    vaxis: 'FB', variants: [{ letter: 'F', name: '站到台前' }, { letter: 'B', name: '藏锋守位' }],
    rarity: 14,
    tagline: '你也在争，只是你不肯用那种方式争。',
    colleagues: '「他不太像这个家里的人。」有人这么评价你，语气里有羡慕，也有一点替你担心。',
    self: '你不是不懂那些手段，你是每天都要重新选一次：不那样做。',
    strengths: ['烂局里守住底线，还能把事做成', '有人愿意为你冒险，因为你没卖过他们', '能忍，也能在忍够之后爆发'],
    blindspots: ['太相信「讲清楚就好了」，常低估人心的弯', '容易被最亲的人当成软处来拿捏'],
    desk: '会议室靠门的位子，先听完再说话',
    role: '二少、守业的人、被寄望又被压着的那一个',
    nemesis: '把家当成棋盘、还笑着说「为你好」的人'
  },
  zhichen: {
    code: 'TC-05', name: '官志琛', en: 'THE CHAIRMAN',
    vaxis: 'FB', variants: [{ letter: 'F', name: '明面话事' }, { letter: 'B', name: '幕后操盘' }],
    rarity: 6,
    tagline: '你不需要赢，你只需要所有人都在你摆的那张桌上。',
    colleagues: '「他一句话，能让两兄弟打起来。」在场的人都懂：他不站队，他摆桌。',
    self: '你比谁都清楚：权力不是拿来用的，是拿来让人怕的。',
    strengths: ['看得清每个人的欲望，也懂得怎么用', '一句话就能改变场面的走向', '沉得住气，不到最后不表态'],
    blindspots: ['把亲人当棋子，久了没人跟你说真话', '赢了所有人，也在防着所有人'],
    desk: '主位。你到了，别人才敢坐',
    role: '话事人、定规矩的人、所有人都绕不开的那一位',
    nemesis: '以为靠感情就能坐稳位置的人'
  },
  jinghong: {
    code: 'TC-06', name: '姚景虹', en: 'THE OPERATOR',
    vaxis: 'FB', variants: [{ letter: 'F', name: '台前副主席' }, { letter: 'B', name: '暗处蛰伏' }],
    rarity: 13,
    tagline: '每一桌你都坐得住，因为你从不把自己放在明面上。',
    colleagues: '「她好像跟谁都能聊。」没人说得清你到底站哪边——包括你自己。',
    self: '你不是没有野心，你只是更清楚：先说出口的人，先出局。',
    strengths: ['在各方之间游走，还不让人反感', '该出手时出手，平时绝不显山露水', '记性好，谁欠谁一份人情你都记得'],
    blindspots: ['长期不表态，容易被当成没有立场', '机会来了不敢一次押重，容易错过窗口'],
    desk: '主席右手边第二个位子，进退都好走',
    role: '副主席、各方都愿意卖个面子的人、等风来的那一个',
    nemesis: '把牌全摊在桌上、还要你立刻选边的人'
  },
  shiya: {
    code: 'TC-07', name: '官诗雅', en: 'THE SOCIALITE',
    vaxis: 'FB', variants: [{ letter: 'F', name: '名媛在场' }, { letter: 'B', name: '公关后台' }],
    rarity: 10,
    tagline: '你笑得最轻松，账算得最清楚。',
    colleagues: '「她什么都不争。」——说完这句，大家会停一下，再看你一眼。',
    self: '你不是不在意那个位子，你只是知道，先说不在意的人才不会被笑话。',
    strengths: ['把场面做漂亮，比谁都熟练', '不硬碰，绕过去也能到地方', '清楚自己的价码，不会贱卖'],
    blindspots: ['太在意别人怎么看你，容易被一句话带走', '把「不争」当保护色，久了真的不敢要'],
    desk: '镜头和灯光都照得到的地方',
    role: '官家千金、公关总监、场面上永远得体的那一个',
    nemesis: '当众让你下不来台、还说是为你好的人'
  },
  peihua: {
    code: 'TC-08', name: '霍佩桦', en: 'THE WATCHER',
    vaxis: 'FB', variants: [{ letter: 'F', name: '公开报道' }, { letter: 'B', name: '私下查证' }],
    rarity: 12,
    tagline: '你手里没有权，但你有一支笔。',
    colleagues: '「她认准的事，劝不动。」朋友说你不好相处，也说你值得托付。',
    self: '你不是不怕，你是怕自己有一天变成「看见了却不说」的那种人。',
    strengths: ['为了在意的人，可以把自己也搭进去', '认死理，也认人情', '敢在最不该开口的时候开口'],
    blindspots: ['把「守护」做成「替别人决定」', '太直，容易在需要迂回的时候吃闷亏'],
    desk: '现场第一排，笔记本永远摊开着',
    role: '记者、追真相的人、替别人记住的那一个',
    nemesis: '用钱和关系把话按住的人'
  }
};

/* 四维编码 → 人物 的先验映射（与题库加权共同决定结果） */
const TYPE_PRIOR = {
  GMRF: 'xian',     GMRB: 'xian',
  GMHF: 'xueying',  GMHB: 'xueying',
  GURF: 'haiyun',   GURB: 'haiyun',
  GUHF: 'xiaojun',  GUHB: 'xiaojun',
  SMRF: 'zhichen',  SMRB: 'zhichen',
  SMHF: 'jinghong', SMHB: 'jinghong',
  SURF: 'shiya',    SURB: 'shiya',
  SUHF: 'peihua',   SUHB: 'peihua'
};

/* 极端形态：某一维强度过高时额外解锁 */
const EXTREMES = {
  G: { need: 'G', label: '争位型', note: '你不是非要赢，你只是没法接受「位置被别人定了」。' },
  S: { need: 'S', label: '守成型', note: '你守的不是一个摊子，是你认定不能塌的那一块。' },
  M: { need: 'M', label: '布局者', note: '你出手之前，事情已经替你走了三步。' },
  U: { need: 'U', label: '直给派', note: '你把话摊开讲，哪怕场面要难看一会儿。' },
  R: { need: 'R', label: '算账人', note: '感情归感情，账要算清——这是你的自我保护。' },
  H: { need: 'H', label: '情义派', note: '你会为一个人做明显不划算的事，还说自己想清楚了。' },
  F: { need: 'F', label: '台前型', note: '灯打在谁身上，你从不躲。' },
  B: { need: 'B', label: '幕后型', note: '你更相信看不见的手，而不是台前的掌声。' }
};
