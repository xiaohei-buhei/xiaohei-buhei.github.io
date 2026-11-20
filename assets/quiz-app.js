/* ============================================================
   引擎层：四维加权计分 → 原型匹配 → 变体命中 → 报告渲染
   结构参考 ACGTI（Apache-2.0）的多层加权思路，本文件为独立实现
   ============================================================ */
const ANSWER_MAX = 2;
const state = { idx: 0, answers: new Array(QUESTIONS.length).fill(null), result: null, lock: false };

/* ---------- 计分 ---------- */
function scoreDims(answers) {
  const out = {};
  DIMS.forEach(d => {
    let raw = 0, capacity = 0;
    QUESTIONS.forEach((q, i) => {
      if (q.dim !== d.id) return;
      const a = answers[i];
      if (a === null) return;
      raw += a * q.sign;
      capacity += ANSWER_MAX;
    });
    const norm = capacity ? Math.max(-1, Math.min(1, raw / capacity)) : 0;
    const dominant = norm >= 0 ? d.pos : d.neg;
    const intensity = Math.abs(norm);
    out[d.id] = {
      id: d.id, dominant, intensity,
      percentage: Math.round(50 + intensity * 50),
      posPct: norm >= 0 ? Math.round(50 + intensity * 50) : Math.round(50 - intensity * 50)
    };
  });
  return out;
}

function scoreArchetypes(answers, dims) {
  const raw = {}, cap = {};
  Object.keys(ARCHETYPES).forEach(k => { raw[k] = 0; cap[k] = 0; });
  QUESTIONS.forEach((q, i) => {
    const a = answers[i];
    if (a === null) return;
    Object.entries(q.w).forEach(([role, w]) => {
      raw[role] += a * w;
      cap[role] += ANSWER_MAX * w;
    });
  });
  const code = dims.EI.dominant + dims.SN.dominant + dims.TF.dominant + dims.JP.dominant;
  const prior = TYPE_PRIOR[code] || null;
  const scored = Object.keys(ARCHETYPES).map(id => {
    const ratio = cap[id] ? Math.max(-1, Math.min(1, raw[id] / cap[id])) : 0;
    const fromQuestions = (ratio + 1) / 2;          // 0..1
    const fromType = id === prior ? 1 : 0;
    return { id, ratio, total: 0.5 * fromQuestions + 0.5 * fromType };
  }).sort((a, b) => (b.total - a.total) || (Math.abs(b.ratio) - Math.abs(a.ratio)));
  return { ranked: scored, code, prior };
}

function computeResult(answers) {
  const dims = scoreDims(answers);
  const { ranked, code } = scoreArchetypes(answers, dims);
  const top = ranked[0], second = ranked[1] || { total: 0 };
  const avgIntensity = DIMS.reduce((s, d) => s + dims[d.id].intensity, 0) / 4;
  const margin = Math.min(0.5, Math.max(0, top.total - second.total));
  const match = Math.max(60, Math.min(96, Math.round(62 + avgIntensity * 25 + margin * 12)));
  const arch = ARCHETYPES[top.id];

  // 变体：取该原型区分轴上的主导一极
  let variant = arch.variants[0];
  const wanted = arch.variants.filter(v => dims[arch.vaxis].dominant === v.letter);
  if (wanted.length) variant = wanted[0];

  // 极端形态：至少三项逼近极值才解锁
  const hot = DIMS.map(d => ({ letter: dims[d.id].dominant, i: dims[d.id].intensity }))
                  .filter(x => x.i >= 0.85)
                  .sort((a, b) => b.i - a.i);
  const extreme = hot.length >= 3 ? EXTREMES[hot[0].letter] : null;

  // 报告编号（由答案与日期决定，同一份答案稳定不变）
  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  let h = 0;
  answers.forEach((v, i) => { h = (h * 37 + (v === null ? 0 : v + 3) + i + 11) % 8192; });
  const pid = 'WP-' + stamp + '-' + String(1000 + h).slice(-4);

  return {
    dims, arch, variant, match, code, pid,
    rarity: arch.rarity >= 15 ? '常见' : (arch.rarity >= 9 ? '少见' : '稀有'),
    extreme,
    name: variant.name
  };
}

/* ---------- 渲染：答题 ---------- */
const viewCover = document.getElementById('viewCover');
const viewQuiz = document.getElementById('viewQuiz');
const viewResult = document.getElementById('viewResult');
const docStatus = document.getElementById('docStatus');
const toastEl = document.getElementById('toast');

document.getElementById('todayText').textContent = (() => {
  const d = new Date();
  return d.getFullYear() + ' / ' + String(d.getMonth() + 1).padStart(2, '0') + ' / ' + String(d.getDate()).padStart(2, '0');
})();

function show(el) { [viewCover, viewQuiz, viewResult].forEach(v => { v.hidden = v !== el; }); window.scrollTo({ top: 0, behavior: 'smooth' }); }

function renderQuestion() {
  const q = QUESTIONS[state.idx];
  document.getElementById('qIndex').textContent = '第 ' + String(state.idx + 1).padStart(2, '0') + ' / ' + QUESTIONS.length + ' 项';
  document.getElementById('qTag').textContent = q.tag;
  document.getElementById('qFill').style.width = ((state.idx + 1) / QUESTIONS.length * 100) + '%';
  document.getElementById('qText').textContent = q.text;
  document.getElementById('qOpts').innerHTML = OPTIONS.map(o =>
    '<button class="opt' + (state.answers[state.idx] === o.v ? ' on' : '') + '" data-v="' + o.v + '" type="button">' +
    '<span class="key">' + o.key + '</span><span class="box"></span><span>' + o.label + '</span></button>'
  ).join('');
  document.getElementById('prevBtn').style.visibility = state.idx === 0 ? 'hidden' : 'visible';
  docStatus.textContent = '填写中 ' + String(state.idx + 1).padStart(2, '0') + '/16';
  viewQuiz.querySelectorAll('.opt').forEach(btn => {
    btn.addEventListener('click', () => pick(Number(btn.dataset.v)));
  });
}

function pick(v) {
  if (state.lock) return;
  state.lock = true;
  state.answers[state.idx] = v;
  viewQuiz.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === v));
  setTimeout(() => {
    state.lock = false;
    if (state.idx < QUESTIONS.length - 1) { state.idx += 1; renderQuestion(); }
    else finish();
  }, 210);
}

document.getElementById('prevBtn').addEventListener('click', () => {
  if (state.idx > 0) { state.idx -= 1; renderQuestion(); }
});

/* ---------- 渲染：结果 ---------- */
function barsHTML(dims) {
  return DIMS.map(d => {
    const s = dims[d.id];
    const pct = Math.round(Math.abs(s.percentage - 50) * 2);
    const isPos = s.dominant === d.pos;
    return '<div class="brow">' +
      '<div class="lab">' + d.name + '</div>' +
      '<div class="track"><div class="fill' + (isPos ? '' : ' neg') + '" style="width:' + pct / 2 + '%"></div></div>' +
      '<div class="val"><b>' + s.dominant + '</b> ' + s.percentage + '%</div>' +
      '</div>';
  }).join('');
}

function finish() {
  const r = computeResult(state.answers);
  state.result = r;
  const a = r.arch;
  const list = (arr, bad) => '<ul class="list' + (bad ? ' bad' : '') + '">' + arr.map((t, i) =>
    '<li><em>' + String(i + 1).padStart(2, '0') + '</em><span>' + t + '</span></li>').join('') + '</ul>';

  viewResult.innerHTML =
    '<div class="rhead">' +
      '<div class="rid">REPORT NO.<br><b>' + r.pid + '</b><br>ENGINE ACGTI-DERIVED</div>' +
      '<div class="sealmark">已 归 档</div>' +
    '</div>' +
    '<h2 class="rname">' + r.name + '</h2>' +
    '<div class="rsub">' +
      '<span>' + a.name + ' / ' + a.en + '</span>' +
      '<span>' + r.code + '</span>' +
      '<span class="hot">匹配度 ' + r.match + '%</span>' +
      '<span>' + r.rarity + '（同类约 ' + a.rarity + '%）</span>' +
    '</div>' +
    '<p class="tagline">' + a.tagline + '</p>' +
    '<div class="matchbox"><div class="num">' + r.match + '<i>%</i></div>' +
      '<div class="cap">与「' + r.name + '」的原型吻合50<br>基于 16 项作答的加权结果</div></div>' +
    '<div class="bars">' + barsHTML(r.dims) + '</div>' +
    (r.extreme ? '<div class="extreme"><span>隐藏形态</span><b>' + r.extreme.label + '</b><span>' + r.extreme.note + '</span></div>' : '') +
    '<div class="block"><h3>同事眼中的你<small>OTHERS SEE</small></h3><p>' + a.colleagues + '</p></div>' +
    '<div class="block"><h3>只有你自己知道<small>YSELF ONLY</small></h3><p>' + a.self + '</p></div>' +
    '<div class="cols">' +
      '<div><h3>你的长板</h3>' + list(a.strengths, false) + '</div>' +
      '<div><h3>你的盲区</h3>' + list(a.blindspots, true) + '</div>' +
    '</div>' +
    '<div class="facts">' +
      '<div class="f"><div class="k">天选工位</div><div class="v">' + a.desk + '</div></div>' +
      '<div class="f"><div class="k">天选岗位</div><div class="v">' + a.role + '</div></div>' +
      '<div class="f"><div class="k">最怕的同事</div><div class="v">' + a.nemesis + '</div></div>' +
    '</div>' +
    '<div class="share">' +
      '<div class="row">' +
        '<button class="btn" id="copyBtn" type="button">复制分享文案</button>' +
        '<button class="btn ghost" id="posterBtn" type="button">下载报告图</button>' +
      '</div>' +
      '<p class="sharetext" id="shareText">' + shareText(r) + '</p>' +
      '<div class="qfoot"><button class="linkish" id="againBtn" type="button">重新体检</button>' +
      '<span class="hint">娱乐测试，别拿它去评价同事</span></div>' +
    '</div>' +
    payCardHTML(r) + adHTML() + gzhHTML();

  docStatus.textContent = '已归档';
  show(viewResult);
  renderAd();
  track('finish_quiz');

  document.getElementById('copyBtn').addEventListener('click', () => copyText(shareText(r)));
  document.getElementById('posterBtn').addEventListener('click', downloadPoster);
  document.getElementById('againBtn').addEventListener('click', () => {
    state.idx = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    renderQuestion();
    docStatus.textContent = '未填写';
    show(viewQuiz);
  });
}

function shareText(r) {
  return '我的职场人格是「' + r.name + '」——' + r.arch.name + '，匹配度 ' + r.match + '%，代号 ' + r.code + '。\n' +
         '16 道题测出来的，有点准。你是哪种打工人？' + (SITE.siteUrl ? '\n' + SITE.siteUrl : '');
}

/* ---------- 交互：复制 / 海报 ---------- */
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1800);
}

function copyText(txt) {
  const done = () => toast('文案已复制，去粘贴吧');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(txt).then(done).catch(() => fallback());
  } else { fallback(); }
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动选中文案'); }
    document.body.removeChild(ta);
  }
}

function wrap(ctx, text, x, y, maxWidth, lh) {
  let line = '', yy = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

function buildPosterCanvas() {
  const r = state.result;
  if (!r) return null;
  const W = 750, H = 1280, pad = 56;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#F1F2ED'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(20,28,23,.22)'; ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.fillStyle = '#141C17';
  ctx.font = '500 15px ui-monospace,Consolas,monospace';
  ctx.fillText('WP-PERS-16 / 职场人格体检报告', pad, 74);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6C766E';
  ctx.fillText(r.pid, W - pad, 74);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(20,28,23,.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, 92); ctx.lineTo(W - pad, 92); ctx.stroke();

  // 标题
  const nameSize = r.name.length > 7 ? 56 : 64;
  ctx.fillStyle = '#141C17';
  ctx.font = '900 ' + nameSize + 'px "Noto Serif SC",serif';
  ctx.fillText(r.name, pad, 180);

  ctx.font = '400 17px "Noto Sans SC",sans-serif';
  ctx.fillStyle = '#3E4A42';
  ctx.fillText(r.arch.name + ' · ' + r.code + ' · 匹配度 ' + r.match + '%', pad, 222);

  // 四维条
  const barY0 = 300, rowH = 64, barX = 210, barW = 360;
  ctx.font = '400 16px "Noto Sans SC",sans-serif';
  DIMS.forEach((d, i) => {
    const s = r.dims[d.id], y = barY0 + i * rowH;
    ctx.fillStyle = '#3E4A42';
    ctx.fillText(d.name, pad, y + 6);
    ctx.fillStyle = '#E7EAE3'; ctx.fillRect(barX, y - 10, barW, 18);
    const w = (Math.abs(s.percentage - 50) / 50) * (barW / 2);
    ctx.fillStyle = s.dominant === d.pos ? '#2F5D50' : '#3E4A42';
    if (s.dominant === d.pos) ctx.fillRect(barX + barW / 2, y - 10, w, 18);
    else ctx.fillRect(barX + barW / 2 - w, y - 10, w, 18);
    ctx.strokeStyle = 'rgba(20,28,23,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(barX + barW / 2, y - 14); ctx.lineTo(barX + barW / 2, y + 8); ctx.stroke();
    ctx.fillStyle = '#3E4A42';
    ctx.font = '500 15px ui-monospace,Consolas,monospace';
    ctx.fillText(s.dominant + ' ' + s.percentage + '%', barX + barW + 18, y + 6);
    ctx.font = '400 16px "Noto Sans SC",sans-serif';
  });

  // 金句
  ctx.fillStyle = '#2F5D50';
  ctx.fillRect(pad, 574, 3, 56);
  ctx.fillStyle = '#141C17';
  ctx.font = '600 25px "Noto Serif SC",serif';
  wrap(ctx, r.arch.tagline, pad + 20, 604, W - pad * 2 - 30, 40);

  // 长板
  ctx.fillStyle = '#6C766E';
  ctx.font = '400 15px "Noto Sans SC",sans-serif';
  ctx.fillText('长板', pad, 700);
  ctx.fillStyle = '#141C17';
  ctx.font = '400 16px "Noto Sans SC",sans-serif';
  r.arch.strengths.forEach((t, i) => {
    ctx.fillText('0' + (i + 1) + '  ' + t, pad, 736 + i * 34);
  });

  // 盲区
  ctx.fillStyle = '#6C766E';
  ctx.font = '400 15px "Noto Sans SC",sans-serif';
  ctx.fillText('盲区', pad, 870);
  ctx.fillStyle = '#A63A2B';
  ctx.font = '400 16px "Noto Sans SC",sans-serif';
  r.arch.blindspots.forEach((t, i) => {
    ctx.fillText('0' + (i + 1) + '  ' + t, pad, 906 + i * 34);
  });

  if (r.extreme) {
    ctx.fillStyle = '#A63A2B';
    ctx.font = '600 16px "Noto Sans SC",sans-serif';
    ctx.fillText('隐藏形态 · ' + r.extreme.label, pad, 966);
  }

  // 适配信息
  ctx.fillStyle = '#6C766E';
  ctx.font = '400 15px "Noto Sans SC",sans-serif';
  ctx.fillText('天选工位：' + r.arch.desk, pad, 1010);
  ctx.fillText('天选岗位：' + r.arch.role, pad, 1044);

  // 页脚
  ctx.strokeStyle = 'rgba(20,28,23,.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, 1100); ctx.lineTo(W - pad, 1100); ctx.stroke();
  ctx.fillStyle = '#6C766E';
  ctx.font = '400 14px "Noto Sans SC",sans-serif';
  wrap(ctx, '打工人职场人格体检 · 16 项 · ' + new Date().getFullYear() + '｜娱乐测试，不构成心理诊断或人事评价', pad, 1134, W - pad * 2, 24);

  // 印章
  ctx.save();
  ctx.translate(W - 132, 1210); ctx.rotate(-0.16);
  ctx.strokeStyle = '#A63A2B'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#A63A2B'; ctx.textAlign = 'center';
  ctx.font = '700 20px "Noto Serif SC",serif';
  ctx.fillText('已归档', 0, 4);
  ctx.font = '400 11px "Noto Sans SC",sans-serif';
  ctx.fillText('WP-PERS-16', 0, 26);
  ctx.restore();

  return cv;
}

function downloadPoster() {
  const cv = buildPosterCanvas();
  if (!cv) return;
  const a = document.createElement('a');
  a.download = '职场人格报告-' + state.result.name + '.png';
  a.href = cv.toDataURL('image/png');
  a.click();
  toast('报告图已生成，长按可保存');
}

/* ---------- 启动 ---------- */
document.getElementById('startBtn').addEventListener('click', () => {
  state.idx = 0;
  renderQuestion();
  show(viewQuiz);
});
