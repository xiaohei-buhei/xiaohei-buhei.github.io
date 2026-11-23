/* ============================================================
   引擎层（二选一版）：四维向量 → 人物向量匹配 → 变体 → 报告渲染
   与前三套不同：每题只有 A / B 两个选项，没有「像 / 不像」的刻度
   ============================================================ */
const state = { idx: 0, answers: new Array(QUESTIONS.length).fill(null), result: null, lock: false };

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

/* ---------- 计分 ---------- */
function scoreDims(answers) {
  const out = {};
  DIMS.forEach(d => {
    let sum = 0, count = 0;
    QUESTIONS.forEach((q, i) => {
      const v = answers[i];
      if (v === null) return;
      const opt = v === 'a' ? q.a : q.b;
      const val = opt.v[d.id];
      if (typeof val !== 'number') return;
      sum += val; count += 1;
    });
    const norm = count ? Math.max(-1, Math.min(1, sum / count)) : 0;
    out[d.id] = {
      id: d.id, norm,
      dominant: norm >= 0 ? d.pos : d.neg,
      intensity: Math.abs(norm),
      percentage: Math.round(50 + Math.abs(norm) * 50)
    };
  });
  return out;
}

function scoreChars(dims) {
  const letters = DIMS.map(d => dims[d.id].dominant).join('');
  const prior = TYPE_PRIOR[letters] || null;
  const ranked = Object.keys(CHARACTERS).map(id => {
    const c = CHARACTERS[id];
    let sum = 0;
    DIMS.forEach(d => {
      sum += dims[d.id].norm * (c.sig[d.id] === d.pos ? 1 : -1);
    });
    const align = sum / DIMS.length;               // -1 .. 1
    return { id, align, total: 0.5 * ((align + 1) / 2) + 0.5 * (id === prior ? 1 : 0) };
  }).sort((a, b) => (b.total - a.total) || (b.align - a.align));
  return { ranked, letters, prior };
}

function computeResult(answers) {
  const dims = scoreDims(answers);
  const { ranked, letters } = scoreChars(dims);
  const top = ranked[0], second = ranked[1] || { total: 0 };
  const avgAbs = DIMS.reduce((s, d) => s + dims[d.id].intensity, 0) / DIMS.length;
  const margin = Math.min(0.5, Math.max(0, top.total - second.total));
  const match = Math.max(60, Math.min(96, Math.round(62 + avgAbs * 25 + margin * 12)));
  const arch = CHARACTERS[top.id];

  let variant = arch.variants[0];
  const wanted = arch.variants.filter(v => dims[arch.vaxis].dominant === v.letter);
  if (wanted.length) variant = wanted[0];

  const hot = DIMS.map(d => ({ letter: dims[d.id].dominant, i: dims[d.id].intensity }))
                  .filter(x => x.i >= 0.8)
                  .sort((a, b) => b.i - a.i);
  const extreme = hot.length >= 3 ? EXTREMES[hot[0].letter] : null;

  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  let h = 0;
  answers.forEach((v, i) => { h = (h * 31 + (v === 'b' ? 7 : 3) + i * 5 + 11) % 8192; });
  const pid = 'MO-' + stamp + '-' + String(1000 + h).slice(-4);

  return {
    dims, arch, variant, match, letters, pid,
    rarity: arch.rarity >= 15 ? '常见' : (arch.rarity >= 9 ? '少见' : '稀有'),
    extreme,
    name: variant.name
  };
}

/* ---------- 渲染：答题 ---------- */
function renderQuestion() {
  const q = QUESTIONS[state.idx];
  document.getElementById('qIndex').textContent = '第 ' + String(state.idx + 1).padStart(2, '0') + ' / ' + QUESTIONS.length + ' 项';
  document.getElementById('qTag').textContent = q.tag;
  document.getElementById('qFill').style.width = ((state.idx + 1) / QUESTIONS.length * 100) + '%';
  document.getElementById('qText').textContent = '换成你，会选哪一边';
  const cur = state.answers[state.idx];
  document.getElementById('qOpts').innerHTML = ['a', 'b'].map(k =>
    '<button class="abtn' + (cur === k ? ' on' : '') + '" data-k="' + k + '" type="button">' +
      '<span class="k">' + (k === 'a' ? 'A' : 'B') + '</span>' +
      '<span class="t">' + q[k].t + '</span>' +
    '</button>'
  ).join('');
  document.getElementById('prevBtn').style.visibility = state.idx === 0 ? 'hidden' : 'visible';
  docStatus.textContent = '填写中 ' + String(state.idx + 1).padStart(2, '0') + '/12';
  viewQuiz.querySelectorAll('.abtn').forEach(btn => {
    btn.addEventListener('click', () => pick(btn.dataset.k));
  });
}

function pick(k) {
  if (state.lock) return;
  state.lock = true;
  state.answers[state.idx] = k;
  viewQuiz.querySelectorAll('.abtn').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  setTimeout(() => {
    state.lock = false;
    if (state.idx < QUESTIONS.length - 1) { state.idx += 1; renderQuestion(); }
    else finish();
  }, 260);
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
      '<div class="rid">REPORT NO.<br><b>' + r.pid + '</b><br>12 项二选一 · 四维向量匹配</div>' +
      '<div class="sealmark">已 归 档</div>' +
    '</div>' +
    '<h2 class="rname">' + r.name + '</h2>' +
    '<div class="rsub">' +
      '<span>' + a.name + ' / ' + a.en + '</span>' +
      '<span>' + r.letters + '</span>' +
      '<span class="hot">匹配度 ' + r.match + '%</span>' +
      '<span>' + r.rarity + '（同类约 ' + a.rarity + '%）</span>' +
    '</div>' +
    '<p class="tagline">' + a.tagline + '</p>' +
    '<div class="matchbox"><div class="num">' + r.match + '<i>%</i></div>' +
      '<div class="cap">与「' + a.name + '」的向量吻合度<br>基于 12 次二选一的加权结果</div></div>' +
    '<div class="bars">' + barsHTML(r.dims) + '</div>' +
    (r.extreme ? '<div class="extreme"><span>隐藏形态</span><b>' + r.extreme.label + '</b><span>' + r.extreme.note + '</span></div>' : '') +
    '<div class="block"><h3>别人眼里的你<small>OTHERS SEE</small></h3><p>' + a.see + '</p></div>' +
    '<div class="block"><h3>只有你自己知道<small>YSELF ONLY</small></h3><p>' + a.self + '</p></div>' +
    '<div class="cols">' +
      '<div><h3>你的长板</h3>' + list(a.strengths, false) + '</div>' +
      '<div><h3>你的盲区</h3>' + list(a.blindspots, true) + '</div>' +
    '</div>' +
    '<div class="facts">' +
      '<div class="f"><div class="k">这条街上的位置</div><div class="v">' + a.place + '</div></div>' +
      '<div class="f"><div class="k">你的身份</div><div class="v">' + a.role + '</div></div>' +
      '<div class="f"><div class="k">最怕的人</div><div class="v">' + a.nemesis + '</div></div>' +
    '</div>' +
    '<div class="share">' +
      '<div class="row">' +
        '<button class="btn" id="copyBtn" type="button">复制分享文案</button>' +
        '<button class="btn ghost" id="posterBtn" type="button">下载报告图</button>' +
      '</div>' +
      '<p class="sharetext" id="shareText">' + shareText(r) + '</p>' +
      '<div class="qfoot"><button class="linkish" id="againBtn" type="button">重新测一次</button>' +
      '<span class="hint">娱乐测试，别拿它去评价真人</span></div>' +
    '</div>' +
    payCardHTML(r) + gzhHTML();

  docStatus.textContent = '已归档';
  show(viewResult);
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
  return '我在《十月初五的月光》里最像「' + r.arch.name + '」——' + r.name + '，匹配度 ' + r.match + '%，代号 ' + r.letters + '。\n' +
         '12 道二选一的题，有点准。你最像这条街上的谁？' + (SITE.siteUrl ? '\n' + SITE.siteUrl : '');
}

/* ---------- 交互 ---------- */
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

function wrapText(ctx, text, x, y, maxWidth, lh) {
  let line = '', yy = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

/* ---------- 报告图 ---------- */
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
  ctx.fillText('MO-PERS-12 / 人物匹配报告', pad, 74);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6C766E';
  ctx.fillText(r.pid, W - pad, 74);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(20,28,23,.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, 92); ctx.lineTo(W - pad, 92); ctx.stroke();

  const nameSize = r.name.length > 7 ? 54 : 62;
  ctx.fillStyle = '#141C17';
  ctx.font = '900 ' + nameSize + 'px "Noto Serif SC",serif';
  ctx.fillText(r.name, pad, 178);

  ctx.font = '400 17px "Noto Sans SC",sans-serif';
  ctx.fillStyle = '#3E4A42';
  ctx.fillText(r.arch.name + ' · ' + r.letters + ' · 匹配度 ' + r.match + '%', pad, 220);

  const barY0 = 296, rowH = 64, barX = 210, barW = 360;
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

  ctx.fillStyle = '#2F5D50';
  ctx.fillRect(pad, 574, 3, 56);
  ctx.fillStyle = '#141C17';
  ctx.font = '600 25px "Noto Serif SC",serif';
  wrapText(ctx, r.arch.tagline, pad + 20, 604, W - pad * 2 - 30, 40);

  ctx.fillStyle = '#6C766E';
  ctx.font = '400 15px "Noto Sans SC",sans-serif';
  ctx.fillText('长板', pad, 700);
  ctx.fillStyle = '#141C17';
  ctx.font = '400 16px "Noto Sans SC",sans-serif';
  r.arch.strengths.forEach((t, i) => {
    ctx.fillText('0' + (i + 1) + '  ' + t, pad, 736 + i * 34);
  });

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

  ctx.fillStyle = '#6C766E';
  ctx.font = '400 15px "Noto Sans SC",sans-serif';
  ctx.fillText('这条街上的位置：' + r.arch.place, pad, 1010);
  ctx.fillText('你的身份：' + r.arch.role, pad, 1044);

  ctx.strokeStyle = 'rgba(20,28,23,.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, 1100); ctx.lineTo(W - pad, 1100); ctx.stroke();
  ctx.fillStyle = '#6C766E';
  ctx.font = '400 14px "Noto Sans SC",sans-serif';
  wrapText(ctx, '十月初五的月光 · 人物匹配 · 12 项 · ' + new Date().getFullYear() + '｜娱乐测试，不构成心理诊断或人物评价', pad, 1134, W - pad * 2, 24);

  ctx.save();
  ctx.translate(W - 132, 1210); ctx.rotate(-0.16);
  ctx.strokeStyle = '#A63A2B'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#A63A2B'; ctx.textAlign = 'center';
  ctx.font = '700 20px "Noto Serif SC",serif';
  ctx.fillText('已归档', 0, 4);
  ctx.font = '400 11px "Noto Sans SC",sans-serif';
  ctx.fillText('MO-PERS-12', 0, 26);
  ctx.restore();

  return cv;
}

function downloadPoster() {
  const cv = buildPosterCanvas();
  if (!cv) return;
  const a = document.createElement('a');
  a.download = '十月初五人物报告-' + state.result.arch.name + '.png';
  a.href = cv.toDataURL('image/png');
  a.click();
  toast('报告图已生成，长按可保存');
}

/* ---------- 启动 ---------- */
document.getElementById('startBtn').addEventListener('click', () => {
  state.idx = 0;
  state.answers = new Array(QUESTIONS.length).fill(null);
  renderQuestion();
  show(viewQuiz);
});
