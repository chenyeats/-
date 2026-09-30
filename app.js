(() => {
  // ================= 存储 =================
  const LS = 'weekend-explorer-v1';
  const defaults = {
    prefs: { city: '上海', interests: ['展览', '市集', 'CityWalk'], budget: 150, people: 2, student: true, nickname: '我' },
    onboarded: false,
    day: '六',
    joined: [],        // 已加入的队伍 id
    myTeams: [],       // 自己发起的队伍
    checkins: [],      // 打卡记录
    myGuides: [],      // 自己写的攻略
    liked: [],         // 点赞的攻略
    favs: [],          // 收藏的活动
    guideLikes: {},    // 攻略额外点赞数
  };
  let S;
  try { S = Object.assign({}, defaults, JSON.parse(localStorage.getItem(LS) || '{}')); } catch { S = { ...defaults }; }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch { toast('存储空间不足，图片可能未保存'); } };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const actById = (id) => ACTIVITIES.find((a) => a.id === id);
  const palette = ['#5b5bf0', '#e17055', '#00b894', '#0984e3', '#d63031', '#a29bfe', '#fdcb6e', '#636e72'];
  const colorOf = (name) => palette[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length];
  const priceOf = (a) => (S.prefs.student ? a.student : a.price);
  let tab = 'discover';
  let filter = '全部';
  let teamFilter = '全部';
  let guideSort = 'hot';

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ================= 天气 =================
  // 使用 Open-Meteo 免费接口获取本周末真实预报；失败时回退为模拟数据
  const WX = {};
  const wxCode = (c) => {
    if (c === 0) return ['☀️', '晴'];
    if (c <= 2) return ['🌤️', '多云'];
    if (c === 3) return ['☁️', '阴'];
    if (c <= 48) return ['🌫️', '雾'];
    if (c <= 67 || (c >= 80 && c <= 82)) return ['🌧️', '雨'];
    if (c <= 77 || c === 85 || c === 86) return ['❄️', '雪'];
    return ['⛈️', '雷雨'];
  };
  function weekendDates() {
    const now = new Date();
    const dow = now.getDay(); // 0 周日
    const toSat = dow === 0 ? -1 : 6 - dow;
    const sat = new Date(now); sat.setDate(now.getDate() + toSat);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { 六: f(sat), 日: f(sun) };
  }
  async function loadWeather(city) {
    if (WX[city]) return WX[city];
    const { lat, lon } = CITIES[city];
    const dates = weekendDates();
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=10`;
      const r = await fetch(url);
      const j = await r.json();
      const out = {};
      for (const k of ['六', '日']) {
        const i = j.daily.time.indexOf(dates[k]);
        if (i < 0) throw new Error('no date');
        const code = j.daily.weathercode[i];
        out[k] = { date: dates[k], code, icon: wxCode(code)[0], text: wxCode(code)[1], max: Math.round(j.daily.temperature_2m_max[i]), min: Math.round(j.daily.temperature_2m_min[i]), rain: j.daily.precipitation_probability_max[i] ?? 0, real: true };
      }
      WX[city] = out;
    } catch (e) {
      WX[city] = {
        六: { date: dates['六'], icon: '🌤️', text: '多云', max: 24, min: 17, rain: 10, real: false },
        日: { date: dates['日'], icon: '🌧️', text: '雨', max: 21, min: 16, rain: 80, real: false },
      };
    }
    return WX[city];
  }
  const isBadWx = (w) => w && (w.rain >= 60 || /雨|雪/.test(w.text));
  const isHot = (w) => w && w.max >= 33;
  const isCold = (w) => w && w.max <= 5;

  // ================= 推荐算法 =================
  // 兴趣 + 天气 + 预算 + 人数 + 开放时间 的多因子打分，并给出「推荐理由」
  function score(a, day) {
    const p = S.prefs; const w = (WX[p.city] || {})[day];
    let s = 50; const why = []; const warn = [];
    if (p.interests.includes(a.type)) { s += 22; why.push(`你喜欢${a.type}`); }
    const price = priceOf(a);
    if (price <= p.budget) { s += 12; if (price === 0) why.push('免费'); else if (price <= p.budget * 0.5) why.push('预算很宽裕'); }
    else { s -= 25; warn.push(`超预算 ¥${price - p.budget}`); }
    if (p.student && a.student < a.price) { s += 5; why.push('学生价'); }
    if (p.people >= a.group[0] && p.people <= a.group[1]) { s += 8; if (p.people >= 4 && a.group[0] >= 3) why.push('适合你们人数'); }
    else if (p.people < a.group[0]) { s -= 6; warn.push(`需 ${a.group[0]} 人，可去组队`); }
    else { s -= 8; warn.push('人数偏多'); }
    if (w) {
      if (isBadWx(w)) { if (a.indoor) { s += 15; why.push('室内不怕雨'); } else { s -= 20; warn.push(`${w.text}天慎选`); } }
      else if (isHot(w)) { if (a.indoor) { s += 10; why.push('室内避暑'); } else { s -= 8; warn.push('天气炎热'); } }
      else if (isCold(w)) { if (a.indoor) s += 6; }
      else if (!a.indoor) { s += 10; why.push(`${w.text}适合出门`); }
    }
    if (!a.days.includes(day)) { s -= 40; warn.push(`周${day}不开放`); }
    return { s: Math.max(1, Math.min(99, Math.round(s))), why, warn };
  }
  function ranked(day = S.day) {
    return ACTIVITIES.filter((a) => a.city === S.prefs.city)
      .map((a) => ({ a, ...score(a, day) }))
      .sort((x, y) => y.s - x.s);
  }

  // 周末行程生成：每天挑 1 个主活动 + 1 个轻量活动，控制总预算
  function makePlan(jitter = 0) {
    const budget = S.prefs.budget * 2;
    const used = new Set(); let total = 0; const plan = {};
    for (const d of ['六', '日']) {
      plan[d] = [];
      const list = ranked(d).filter((x) => x.a.days.includes(d) && !used.has(x.a.id))
        .map((x) => ({ ...x, r: x.s + Math.random() * jitter })).sort((p, q) => q.r - p.r);
      let hours = 0;
      for (const x of list) {
        if (plan[d].length >= 2) break;
        const pr = priceOf(x.a);
        if (total + pr > budget || hours + x.a.dur > 8 || x.s < 45) continue;
        plan[d].push(x); used.add(x.a.id); total += pr; hours += x.a.dur;
      }
    }
    return { plan, total, budget };
  }

  // ================= 通用组件 =================
  function actCard(x) {
    const a = x.a; const pr = priceOf(a);
    return `<div class="card act" data-act="${a.id}">
      <div class="cover" style="background:${a.color}22">${a.emoji}</div>
      <div class="grow">
        <h3>${esc(a.title)}</h3>
        <div class="meta">${a.type} · ${a.area} · ${a.indoor ? '室内' : '户外'} · 约${a.dur}h</div>
        <div><span class="price">${pr === 0 ? '免费' : '¥' + pr}</span>${pr < a.price ? ` <s class="muted">¥${a.price}</s>` : ''}</div>
        <div>${x.why.slice(0, 3).map((w) => `<span class="tag ok">✓ ${w}</span>`).join('')}${x.warn.slice(0, 2).map((w) => `<span class="tag warn">! ${w}</span>`).join('')}</div>
      </div>
      <div class="score">${x.s}% 匹配</div>
    </div>`;
  }

  function openSheet(title, html, onMount) {
    const sh = $('#sheet');
    sh.innerHTML = `<div class="sheet-head"><b>${title}</b><button class="close" data-close>✕</button></div>${html}`;
    sh.classList.add('show'); $('#mask').classList.add('show');
    sh.scrollTop = 0;
    onMount && onMount(sh);
  }
  function closeSheet() { $('#sheet').classList.remove('show'); $('#mask').classList.remove('show'); }
  $('#mask').onclick = () => { if (S.onboarded) closeSheet(); };
  $('#sheet').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });

  // ================= 发现页 =================
  async function renderDiscover() {
    const v = $('#view');
    const wx = await loadWeather(S.prefs.city);
    if (tab !== 'discover') return;
    const w = wx[S.day];
    let tip = `周${S.day}${w.text} ${w.min}~${w.max}°C，降水概率 ${w.rain}%。`;
    tip += isBadWx(w) ? '已优先推荐室内活动 ☔' : isHot(w) ? '天气炎热，室内活动加权 🧊' : '天气不错，适合户外走走 🌿';
    const types = ['全部', ...new Set(ACTIVITIES.filter((a) => a.city === S.prefs.city).map((a) => a.type))];
    let list = ranked();
    if (filter === '室内') list = list.filter((x) => x.a.indoor);
    else if (filter === '免费') list = list.filter((x) => priceOf(x.a) === 0);
    else if (filter !== '全部') list = list.filter((x) => x.a.type === filter);

    v.innerHTML = `
      <div class="hero">
        <h1>嗨 ${esc(S.prefs.nickname)}，这周末去哪玩？</h1>
        <p>预算 ¥${S.prefs.budget}/人 · ${S.prefs.people} 人出行 · ${S.prefs.interests.join('/') || '随便逛逛'} <u data-edit style="cursor:pointer">修改</u></p>
        <div class="wx-row">
          ${['六', '日'].map((d) => `<button class="wx ${S.day === d ? 'sel' : ''}" data-day="${d}">
            <div class="d">周${d} ${wx[d].date.slice(5)}</div>
            <div class="t">${wx[d].icon} ${wx[d].max}°</div>
            <div class="s">${wx[d].text} · 降水 ${wx[d].rain}%</div></button>`).join('')}
        </div>
        <div class="wx-tip">${tip}${w.real ? '' : '（离线示例天气）'}</div>
      </div>
      <button class="plan-btn" data-plan>✨ 一键生成我的周末行程</button>
      <div class="filters">${[...types, '室内', '免费'].map((t) => `<button class="chip ${filter === t ? 'on' : ''}" data-filter="${t}">${t}</button>`).join('')}</div>
      <h2>为你推荐 · 周${S.day} <small>按匹配度排序</small></h2>
      ${list.length ? list.map(actCard).join('') : '<div class="empty"><div>🫥</div>这个分类暂时没有活动</div>'}
      <p class="muted" style="text-align:center">活动为示例数据 · 天气来自 Open-Meteo 实时预报</p>`;

    v.querySelectorAll('[data-day]').forEach((b) => (b.onclick = () => { S.day = b.dataset.day; save(); render(); }));
    v.querySelectorAll('[data-filter]').forEach((b) => (b.onclick = () => { filter = b.dataset.filter; render(); }));
    $('[data-plan]', v).onclick = () => showPlan();
    $('[data-edit]', v).onclick = () => showPrefs(false);
  }

  function showPlan(jitter = 0) {
    const { plan, total, budget } = makePlan(jitter);
    const wx = WX[S.prefs.city];
    const html = ['六', '日'].map((d) => `
      <div class="plan-day">
        <b>周${d} ${wx[d].icon} ${wx[d].text} ${wx[d].min}~${wx[d].max}°</b>
        ${plan[d].length ? plan[d].map((x, i) => `<div class="plan-item" data-act="${x.a.id}">
            <div class="e">${x.a.emoji}</div>
            <div class="grow"><div><b>${i === 0 ? '上午' : '下午'}</b> · ${esc(x.a.title)}</div>
            <div class="muted">${x.a.area} · 约${x.a.dur}h · ${priceOf(x.a) ? '¥' + priceOf(x.a) : '免费'}</div></div>
            <span class="tag">${x.s}%</span></div>`).join('')
          : '<div class="plan-item muted">这天适合在宿舍躺平 😴（没有合适活动）</div>'}
      </div>`).join('');
    openSheet('✨ 你的周末行程', `
      <div class="plan-sum">预计人均花费 <b style="font-size:20px">¥${total}</b> / 预算 ¥${budget}（两天）<br>
      <span style="opacity:.8;font-size:13px">已根据天气、预算、兴趣和人数自动编排，可点击查看详情</span></div>
      <div style="margin-top:14px">${html}</div>
      <div class="actions"><button class="btn ghost" data-replan>换一换</button><button class="btn" data-share-plan>分享给室友</button></div>`,
      (sh) => {
        $('[data-replan]', sh).onclick = () => showPlan(30);
        $('[data-share-plan]', sh).onclick = () => {
          const txt = `我的周末计划🧭\n` + ['六', '日'].map((d) => `周${d}：` + (plan[d].map((x) => x.a.title).join(' → ') || '休息')).join('\n') + `\n人均约 ¥${total}，一起吗？`;
          copy(txt);
        };
      });
  }

  function copy(txt) {
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('已复制，去微信粘贴给好友吧'), () => { prompt('复制下面的内容', txt); });
  }

  // ================= 活动详情 =================
  function showAct(id) {
    const a = actById(id); const x = { a, ...score(a, S.day) };
    const teams = allTeams().filter((t) => t.actId === id);
    const guides = allGuides().filter((g) => g.actIds.includes(id));
    const fav = S.favs.includes(id);
    const checked = S.checkins.some((c) => c.actId === id);
    openSheet(esc(a.title), `
      <div class="detail-cover" style="background:${a.color}22">${a.emoji}</div>
      <div style="margin-top:10px">${x.why.map((w) => `<span class="tag ok">✓ ${w}</span>`).join('')}${x.warn.map((w) => `<span class="tag warn">! ${w}</span>`).join('')}${a.tags.map((t) => `<span class="tag gray">${t}</span>`).join('')}</div>
      <div class="kv">
        <div><b class="price">${priceOf(a) ? '¥' + priceOf(a) : '免费'}</b><span>人均${S.prefs.student && a.student < a.price ? '(学生)' : ''}</span></div>
        <div><b>${a.dur}h</b><span>建议时长</span></div>
        <div><b>${a.group[0]}-${a.group[1]}人</b><span>适合人数</span></div>
      </div>
      <div class="card"><b>📍 ${a.area} · ${a.indoor ? '室内' : '户外'} · 周${a.days.join('/周')}开放</b><p style="margin:6px 0 0">${esc(a.desc)}</p></div>
      <h2>💡 学长学姐的小贴士</h2>
      <div class="card"><ul class="tips" style="margin:0;padding-left:18px">${a.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <h2>👥 正在组队 <small>${teams.length} 支队伍</small></h2>
      ${teams.length ? teams.map(teamCard).join('') : '<div class="card muted">还没有人组队，来当第一个队长吧～</div>'}
      <h2>📖 相关攻略</h2>
      ${guides.length ? guides.map(guideCard).join('') : '<div class="card muted">暂无攻略，打卡后来写第一篇吧</div>'}
      <div class="actions">
        <button class="btn ghost" data-fav>${fav ? '💜 已收藏' : '🤍 收藏'}</button>
        <button class="btn ghost" data-share>🔗 分享</button>
        <button class="btn dark" data-newteam>👥 发起组队</button>
        <button class="btn" data-check>${checked ? '📸 再次打卡' : '📸 去打卡'}</button>
      </div>`,
      (sh) => {
        bindTeamBtns(sh, () => showAct(id));
        bindGuideCards(sh);
        $('[data-fav]', sh).onclick = () => { S.favs = fav ? S.favs.filter((f) => f !== id) : [...S.favs, id]; save(); toast(fav ? '已取消收藏' : '已收藏'); showAct(id); };
        $('[data-share]', sh).onclick = () => copy(`【周末去哪儿】${a.title}\n📍${a.area}｜${priceOf(a) ? '¥' + priceOf(a) : '免费'}｜${a.desc}\n${location.href.split('#')[0]}#act=${a.id}`);
        $('[data-newteam]', sh).onclick = () => showNewTeam(id);
        $('[data-check]', sh).onclick = () => showCheckin(id);
      });
  }

  // ================= 组队 =================
  const allTeams = () => [...S.myTeams, ...SEED_TEAMS].map((t) => ({ ...t, members: S.joined.includes(t.id) && !t.members.includes(S.prefs.nickname) ? [...t.members, S.prefs.nickname] : t.members }));
  function teamCard(t) {
    const a = actById(t.actId); const full = t.members.length >= t.need;
    const mine = S.myTeams.some((m) => m.id === t.id); const joined = S.joined.includes(t.id);
    const slots = Math.max(0, t.need - t.members.length);
    return `<div class="card team">
      <div class="row between"><h3>${esc(t.title)}</h3>${full ? '<span class="tag ok">已满员</span>' : `<span class="tag warn">差 ${slots} 人</span>`}</div>
      <div class="muted" data-act="${a.id}" style="cursor:pointer">${a.emoji} ${esc(a.title)} ›</div>
      <div class="muted">🕘 周${t.day} ${esc(t.time)} · 队长 ${esc(t.host)}${t.school ? '（' + esc(t.school) + '）' : ''}</div>
      ${t.note ? `<div style="font-size:13px;margin-top:4px">“${esc(t.note)}”</div>` : ''}
      <div class="bar"><div style="width:${Math.min(100, (t.members.length / t.need) * 100)}%"></div></div>
      <div class="row between">
        <div class="avatars">${t.members.map((m) => `<i style="background:${colorOf(m)}">${esc(m[0])}</i>`).join('')}${Array.from({ length: Math.min(slots, 4) }, () => '<i class="slot">+</i>').join('')}</div>
        ${mine ? '<span class="tag">我发起的</span>' : joined ? `<button class="btn sm ghost" data-leave="${t.id}">已加入 · 退出</button>` : `<button class="btn sm" data-join="${t.id}" ${full ? 'disabled' : ''}>${full ? '满员' : '加入'}</button>`}
      </div>
    </div>`;
  }
  function bindTeamBtns(root, rerender) {
    root.querySelectorAll('[data-join]').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation(); S.joined.push(b.dataset.join); save(); toast('🎉 加入成功！已拉你进群聊（示例）'); rerender();
    }));
    root.querySelectorAll('[data-leave]').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation(); S.joined = S.joined.filter((j) => j !== b.dataset.leave); save(); toast('已退出队伍'); rerender();
    }));
  }
  function renderTeam() {
    const v = $('#view');
    const cityActs = new Set(ACTIVITIES.filter((a) => a.city === S.prefs.city).map((a) => a.id));
    let teams = allTeams().filter((t) => cityActs.has(t.actId));
    if (teamFilter === '差人中') teams = teams.filter((t) => t.members.length < t.need);
    if (teamFilter === '我的') teams = teams.filter((t) => S.joined.includes(t.id) || S.myTeams.some((m) => m.id === t.id));
    if (teamFilter === '周六' || teamFilter === '周日') teams = teams.filter((t) => '周' + t.day === teamFilter);
    v.innerHTML = `
      <div class="hero" style="background:linear-gradient(135deg,#00b894,#0984e3)">
        <h1>一个人也能出发 👋</h1>
        <p>剧本杀差人、徒步想找伴、吃饭想多点几个菜？找同校/同城搭子一起。</p>
        <button class="plan-btn" style="background:#fff;color:#0984e3" data-new>＋ 发起组队</button>
      </div>
      <div class="filters">${['全部', '差人中', '周六', '周日', '我的'].map((t) => `<button class="chip ${teamFilter === t ? 'on' : ''}" data-tf="${t}">${t}</button>`).join('')}</div>
      <h2>${S.prefs.city} · 正在组队 <small>${teams.length} 支</small></h2>
      ${teams.length ? teams.map(teamCard).join('') : '<div class="empty"><div>🏕️</div>暂无队伍，发起一个吧</div>'}
      <p class="muted" style="text-align:center">🛡️ 安全提示：首次见面请选择公共场所，出行前在「我的」开启行程分享</p>`;
    v.querySelectorAll('[data-tf]').forEach((b) => (b.onclick = () => { teamFilter = b.dataset.tf; render(); }));
    $('[data-new]', v).onclick = () => showNewTeam();
    bindTeamBtns(v, render);
  }
  function showNewTeam(actId) {
    const acts = ACTIVITIES.filter((a) => a.city === S.prefs.city);
    openSheet('👥 发起组队', `
      <div class="field"><label>去哪儿</label><select id="nt-act">${acts.map((a) => `<option value="${a.id}" ${a.id === actId ? 'selected' : ''}>${a.emoji} ${esc(a.title)}</option>`).join('')}</select></div>
      <div class="field"><label>队伍标题</label><input id="nt-title" maxlength="30" placeholder="例：周六佘山轻徒步，i 人友好" /></div>
      <div class="row"><div class="field grow"><label>哪天</label><select id="nt-day"><option value="六">周六</option><option value="日">周日</option></select></div>
      <div class="field grow"><label>总人数</label><input id="nt-need" type="number" min="2" max="20" value="4" /></div></div>
      <div class="field"><label>集合时间地点</label><input id="nt-time" maxlength="30" placeholder="例：09:00 地铁站 2 号口" /></div>
      <div class="field"><label>学校（可选，同校更安心）</label><input id="nt-school" maxlength="12" placeholder="例：复旦" /></div>
      <div class="field"><label>备注</label><input id="nt-note" maxlength="40" placeholder="AA / 节奏 / 需要带什么" /></div>
      <button class="btn" style="width:100%" id="nt-ok">发布队伍</button>`, (sh) => {
      $('#nt-day', sh).value = S.day;
      $('#nt-ok', sh).onclick = () => {
        const aid = $('#nt-act', sh).value; const a = actById(aid);
        const t = {
          id: 'u' + Date.now(), actId: aid, title: $('#nt-title', sh).value.trim() || `一起去${a.title}`, host: S.prefs.nickname,
          school: $('#nt-school', sh).value.trim(), day: $('#nt-day', sh).value, time: $('#nt-time', sh).value.trim() || '时间地点群里商量',
          need: Math.max(2, Math.min(20, +$('#nt-need', sh).value || 4)), members: [S.prefs.nickname], note: $('#nt-note', sh).value.trim(),
        };
        S.myTeams.unshift(t); save(); closeSheet(); toast('✅ 队伍已发布'); tab = 'team'; teamFilter = '我的'; render();
      };
    });
  }

  // ================= 打卡 =================
  const BADGES = [
    { e: '🌱', n: '初次出发', ok: (c) => c.length >= 1 },
    { e: '🖼️', n: '看展达人', ok: (c) => c.filter((x) => actById(x.actId)?.type === '展览').length >= 2 },
    { e: '🥾', n: '户外玩家', ok: (c) => c.filter((x) => !actById(x.actId)?.indoor).length >= 3 },
    { e: '💰', n: '省钱高手', ok: (c) => c.filter((x) => x.cost <= 30).length >= 2 },
    { e: '🎭', n: '多面体验', ok: (c) => new Set(c.map((x) => actById(x.actId)?.type)).size >= 4 },
    { e: '👥', n: '社交达人', ok: () => S.joined.length + S.myTeams.length >= 2 },
    { e: '✍️', n: '攻略作者', ok: () => S.myGuides.length >= 1 },
    { e: '🏆', n: '城市探索家', ok: (c) => new Set(c.map((x) => x.actId)).size >= 8 },
  ];
  function renderCheckin() {
    const v = $('#view'); const c = S.checkins;
    const cost = c.reduce((n, x) => n + (+x.cost || 0), 0);
    const cityActs = ACTIVITIES.filter((a) => a.city === S.prefs.city);
    const explored = cityActs.filter((a) => c.some((x) => x.actId === a.id)).length;
    // 近 12 周热力
    const weeks = Array.from({ length: 24 }, (_, i) => {
      const end = Date.now() - (23 - i) * 7 * 864e5 / 2; const start = end - 7 * 864e5 / 2;
      const n = c.filter((x) => x.ts > start && x.ts <= end).length; return n >= 3 ? 3 : n;
    });
    v.innerHTML = `
      <div class="hero" style="background:linear-gradient(135deg,#f78ca0,#f9a64a)">
        <h1>我的周末足迹 👣</h1>
        <p>${S.prefs.city}已探索 ${explored}/${cityActs.length} 个地点，继续解锁吧！</p>
        <div class="bar" style="background:rgba(255,255,255,.3)"><div style="background:#fff;width:${(explored / cityActs.length) * 100}%"></div></div>
        <button class="plan-btn" style="background:#fff;color:#e8604c" data-new>📸 记录一次打卡</button>
      </div>
      <h2>数据看板</h2>
      <div class="stats"><div><b>${c.length}</b><span>打卡次数</span></div><div><b>${new Set(c.map((x) => actById(x.actId)?.type)).size}</b><span>玩过的类型</span></div><div><b>¥${cost}</b><span>累计花费</span></div></div>
      <div class="card" style="margin-top:8px"><div class="muted">活跃度（近 12 周）</div><div class="heat">${weeks.map((n) => `<i class="l${n}"></i>`).join('')}</div></div>
      <h2>成就徽章 <small>${BADGES.filter((b) => b.ok(c)).length}/${BADGES.length}</small></h2>
      <div class="badges">${BADGES.map((b) => `<div class="badge ${b.ok(c) ? 'got' : ''}"><div>${b.e}</div>${b.n}</div>`).join('')}</div>
      <h2>打卡时间线</h2>
      ${c.length ? `<div class="timeline">${c.map((x, i) => { const a = actById(x.actId); return `<div class="tl card">
        <div class="row between"><b>${a.emoji} ${esc(a.title)}</b><span class="muted">${new Date(x.ts).toLocaleDateString('zh-CN')}</span></div>
        <div class="muted"><span class="stars">${'★'.repeat(x.rate)}${'☆'.repeat(5 - x.rate)}</span> · ${x.mood} · 花费 ¥${x.cost}${x.with ? ' · 和 ' + esc(x.with) : ''}</div>
        ${x.note ? `<div style="margin-top:4px">${esc(x.note)}</div>` : ''}
        ${x.photo ? `<img src="${x.photo}" alt="打卡照片" />` : ''}
        <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-toguide="${i}">✍️ 转为攻略</button><button class="btn sm ghost" data-del="${i}">删除</button></div>
      </div>`; }).join('')}</div>` : '<div class="empty"><div>🗺️</div>还没有打卡记录<br>去「发现」找个活动出发吧</div>'}`;
    $('[data-new]', v).onclick = () => showCheckin();
    v.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { if (confirm('删除这条打卡？')) { S.checkins.splice(+b.dataset.del, 1); save(); render(); } }));
    v.querySelectorAll('[data-toguide]').forEach((b) => (b.onclick = () => showNewGuide(S.checkins[+b.dataset.toguide])));
  }
  function resizeImage(file, max = 800) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement('canvas'); cv.width = img.width * k; cv.height = img.height * k;
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.7));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  function showCheckin(actId) {
    const acts = ACTIVITIES.filter((a) => a.city === S.prefs.city);
    let rate = 5, photo = '', mood = '开心';
    openSheet('📸 打卡记录', `
      <div class="field"><label>去了哪里</label><select id="ck-act">${acts.map((a) => `<option value="${a.id}" ${a.id === actId ? 'selected' : ''}>${a.emoji} ${esc(a.title)}</option>`).join('')}</select></div>
      <div class="field"><label>评分</label><div class="star-pick">${[1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" class="on">★</button>`).join('')}</div></div>
      <div class="field"><label>心情</label><div class="opts">${['开心', '治愈', '超值', '累但值得', '一般', '踩雷'].map((m) => `<button class="chip ${m === mood ? 'on' : ''}" data-mood="${m}">${m}</button>`).join('')}</div></div>
      <div class="row"><div class="field grow"><label>实际花费 (¥)</label><input id="ck-cost" type="number" min="0" /></div>
      <div class="field grow"><label>和谁一起</label><input id="ck-with" maxlength="20" placeholder="室友 / 搭子" /></div></div>
      <div class="field"><label>照片</label><label class="photo-pick" id="ck-pp">📷 点击上传一张照片<input type="file" accept="image/*" hidden id="ck-file" /></label></div>
      <div class="field"><label>一句话感受</label><textarea id="ck-note" maxlength="200" placeholder="记录下此刻吧～"></textarea></div>
      <button class="btn" style="width:100%" id="ck-ok">完成打卡</button>`, (sh) => {
      const setCost = () => { $('#ck-cost', sh).value = priceOf(actById($('#ck-act', sh).value)); };
      setCost(); $('#ck-act', sh).onchange = setCost;
      sh.querySelectorAll('[data-star]').forEach((b) => (b.onclick = () => { rate = +b.dataset.star; sh.querySelectorAll('[data-star]').forEach((s) => s.classList.toggle('on', +s.dataset.star <= rate)); }));
      sh.querySelectorAll('[data-mood]').forEach((b) => (b.onclick = () => { mood = b.dataset.mood; sh.querySelectorAll('[data-mood]').forEach((s) => s.classList.toggle('on', s === b)); }));
      $('#ck-file', sh).onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        photo = await resizeImage(f);
        $('#ck-pp', sh).innerHTML = `<img src="${photo}" alt="预览" />`;
      };
      $('#ck-ok', sh).onclick = () => {
        const before = BADGES.filter((b) => b.ok(S.checkins)).length;
        S.checkins.unshift({ actId: $('#ck-act', sh).value, rate, mood, cost: +$('#ck-cost', sh).value || 0, with: $('#ck-with', sh).value.trim(), note: $('#ck-note', sh).value.trim(), photo, ts: Date.now() });
        save(); closeSheet();
        const after = BADGES.filter((b) => b.ok(S.checkins)).length;
        toast(after > before ? '🏅 打卡成功，解锁新徽章！' : '✅ 打卡成功');
        tab = 'checkin'; render();
      };
    });
  }

  // ================= 攻略 =================
  const allGuides = () => [...S.myGuides, ...SEED_GUIDES];
  const likesOf = (g) => g.likes + (S.liked.includes(g.id) ? 1 : 0);
  function guideCard(g) {
    return `<div class="card guide row" data-guide="${g.id}" style="align-items:flex-start">
      <div class="gc">${g.cover}</div>
      <div class="grow"><h3>${esc(g.title)}</h3>
        <div class="muted">by ${esc(g.author)} · 人均 ¥${g.budget}</div>
        <div>${g.tags.map((t) => `<span class="tag gray">#${esc(t)}</span>`).join('')}</div></div>
      <span class="like ${S.liked.includes(g.id) ? 'on' : ''}">♥ ${likesOf(g)}</span>
    </div>`;
  }
  function bindGuideCards(root) { root.querySelectorAll('[data-guide]').forEach((el) => (el.onclick = (e) => { e.stopPropagation(); showGuide(el.dataset.guide); })); }
  function renderGuide() {
    const v = $('#view');
    let gs = allGuides().filter((g) => g.city === S.prefs.city);
    gs = guideSort === 'hot' ? gs.sort((a, b) => likesOf(b) - likesOf(a)) : guideSort === 'cheap' ? gs.sort((a, b) => a.budget - b.budget) : gs.filter((g) => S.myGuides.includes(g));
    v.innerHTML = `
      <div class="hero" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe)">
        <h1>学长学姐的真实攻略 📖</h1>
        <p>不看广告看经验：路线、避坑、省钱都在这。</p>
        <button class="plan-btn" style="background:#fff;color:#6c5ce7" data-new>✍️ 分享我的攻略</button>
      </div>
      <div class="seg">${[['hot', '🔥 最热'], ['cheap', '💰 最省钱'], ['mine', '我写的']].map(([k, n]) => `<button class="${guideSort === k ? 'on' : ''}" data-gs="${k}">${n}</button>`).join('')}</div>
      <h2>${S.prefs.city}攻略 <small>${gs.length} 篇</small></h2>
      ${gs.length ? gs.map(guideCard).join('') : '<div class="empty"><div>📝</div>还没有攻略，写下第一篇吧</div>'}`;
    v.querySelectorAll('[data-gs]').forEach((b) => (b.onclick = () => { guideSort = b.dataset.gs; render(); }));
    $('[data-new]', v).onclick = () => showNewGuide();
    bindGuideCards(v);
  }
  function showGuide(id) {
    const g = allGuides().find((x) => x.id === id); const liked = S.liked.includes(id);
    openSheet('攻略详情', `
      <div class="row" style="margin-bottom:10px"><div class="gc" style="width:56px;height:56px;border-radius:14px;background:var(--pri-soft);display:grid;place-items:center;font-size:28px">${g.cover}</div>
      <div class="grow"><b style="font-size:17px">${esc(g.title)}</b><div class="muted">by ${esc(g.author)} · 人均 ¥${g.budget}</div></div></div>
      <div class="guide-body">${esc(g.content)}</div>
      <h2>涉及地点</h2>
      ${g.actIds.map((aid) => { const a = actById(aid); return a ? `<div class="plan-item" data-act="${a.id}"><div class="e">${a.emoji}</div><div class="grow">${esc(a.title)}<div class="muted">${a.area} · ${priceOf(a) ? '¥' + priceOf(a) : '免费'}</div></div>›</div>` : ''; }).join('')}
      <div class="actions">
        <button class="btn ghost" data-like>${liked ? '❤️' : '🤍'} 有用 ${likesOf(g)}</button>
        <button class="btn" data-follow>🧭 照着这篇去玩</button>
      </div>`, (sh) => {
      $('[data-like]', sh).onclick = () => { S.liked = liked ? S.liked.filter((x) => x !== id) : [...S.liked, id]; save(); showGuide(id); if (tab === 'guide') render(); };
      $('[data-follow]', sh).onclick = () => { S.favs = [...new Set([...S.favs, ...g.actIds])]; save(); toast('已把攻略里的地点加入收藏 💜'); };
    });
  }
  function showNewGuide(fromCheckin) {
    const acts = ACTIVITIES.filter((a) => a.city === S.prefs.city);
    const covers = ['🍂', '🌸', '🏙️', '⛰️', '🎨', '🍜', '🎸', '🌊'];
    let cover = covers[0];
    openSheet('✍️ 分享攻略', `
      <div class="field"><label>封面</label><div class="opts">${covers.map((c, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-cv="${c}" style="font-size:20px">${c}</button>`).join('')}</div></div>
      <div class="field"><label>标题</label><input id="ng-title" maxlength="30" placeholder="例：¥50 玩转西岸一整天" /></div>
      <div class="field"><label>涉及活动</label><select id="ng-act">${acts.map((a) => `<option value="${a.id}">${a.emoji} ${esc(a.title)}</option>`).join('')}</select></div>
      <div class="field"><label>人均花费 (¥)</label><input id="ng-budget" type="number" min="0" value="50" /></div>
      <div class="field"><label>正文（路线 / 时间安排 / 避坑 / 省钱）</label><textarea id="ng-content" style="min-height:140px" placeholder="09:00 出发...\n💡 避坑：..."></textarea></div>
      <div class="field"><label>标签（空格分隔）</label><input id="ng-tags" placeholder="省钱 雨天 一人也行" /></div>
      <button class="btn" style="width:100%" id="ng-ok">发布攻略</button>`, (sh) => {
      sh.querySelectorAll('[data-cv]').forEach((b) => (b.onclick = () => { cover = b.dataset.cv; sh.querySelectorAll('[data-cv]').forEach((x) => x.classList.toggle('on', x === b)); }));
      if (fromCheckin) {
        const a = actById(fromCheckin.actId);
        $('#ng-act', sh).value = a.id; $('#ng-budget', sh).value = fromCheckin.cost;
        $('#ng-title', sh).value = `${a.title}｜${fromCheckin.mood}的一天`;
        $('#ng-content', sh).value = `${fromCheckin.note || ''}\n\n评分：${'★'.repeat(fromCheckin.rate)}\n💡 小贴士：${a.tips[0]}`;
      }
      $('#ng-ok', sh).onclick = () => {
        const title = $('#ng-title', sh).value.trim(); const content = $('#ng-content', sh).value.trim();
        if (!title || !content) return toast('标题和正文不能为空');
        S.myGuides.unshift({ id: 'ug' + Date.now(), actIds: [$('#ng-act', sh).value], city: S.prefs.city, title, author: S.prefs.nickname, cover, budget: +$('#ng-budget', sh).value || 0, likes: 0, content, tags: $('#ng-tags', sh).value.split(/\s+/).filter(Boolean).slice(0, 4) });
        save(); closeSheet(); toast('📖 攻略已发布，感谢分享！'); tab = 'guide'; guideSort = 'mine'; render();
      };
    });
  }

  // ================= 我的 =================
  function renderMe() {
    const v = $('#view'); const p = S.prefs;
    v.innerHTML = `
      <div class="card profile" style="margin-top:4px"><div class="av">${esc(p.nickname[0])}</div>
        <div class="grow"><b style="font-size:17px">${esc(p.nickname)}</b><div class="muted">${p.city} · ${p.student ? '🎓 学生认证' : '未认证学生'} · 打卡 ${S.checkins.length} 次</div></div>
        <button class="btn sm ghost" data-prefs>编辑</button></div>
      <h2>我的偏好</h2>
      <div class="card">
        <div class="list-item" data-prefs><span>兴趣</span><span class="muted">${p.interests.join('、') || '未设置'} ›</span></div>
        <div class="list-item" data-prefs><span>单日预算</span><span class="muted">¥${p.budget}/人 ›</span></div>
        <div class="list-item" data-prefs><span>出行人数</span><span class="muted">${p.people} 人 ›</span></div>
      </div>
      <h2>💜 我的收藏 <small>${S.favs.length}</small></h2>
      ${S.favs.length ? S.favs.map((id) => actById(id)).filter(Boolean).map((a) => `<div class="plan-item" data-act="${a.id}"><div class="e">${a.emoji}</div><div class="grow">${esc(a.title)}<div class="muted">${a.city} · ${a.area}</div></div>›</div>`).join('') : '<div class="card muted">还没有收藏</div>'}
      <h2>更多</h2>
      <div class="card">
        <div class="list-item" data-safe><span>🛡️ 出行安全 · 一键分享行程给家人</span><span class="muted">›</span></div>
        <div class="list-item" data-about><span>💡 产品设计说明</span><span class="muted">›</span></div>
        <div class="list-item" data-reset><span>🔄 清空数据重新体验</span><span class="muted">›</span></div>
      </div>`;
    v.querySelectorAll('[data-prefs]').forEach((b) => (b.onclick = () => showPrefs(false)));
    $('[data-safe]', v).onclick = () => {
      const t = allTeams().filter((x) => S.joined.includes(x.id) || S.myTeams.some((m) => m.id === x.id));
      copy(`【行程报备】我这周末的安排：\n${t.map((x) => `周${x.day} ${x.time} ${actById(x.actId).title}（${x.members.length}人同行）`).join('\n') || '暂无组队行程'}\n—— 来自「周末去哪儿」`);
    };
    $('[data-about]', v).onclick = showAbout;
    $('[data-reset]', v).onclick = () => { if (confirm('确定清空所有本地数据？')) { localStorage.removeItem(LS); location.reload(); } };
  }
  function showAbout() {
    openSheet('💡 产品设计说明', `
      <div class="card">
        <b>🎯 解决的痛点</b>
        <ul class="tips" style="padding-left:18px;margin:6px 0 0">
          <li><b>信息分散</b>：展览/市集/演出/徒步分散在小红书、大众点评、公众号 → 聚合到一个列表</li>
          <li><b>决策成本高</b>：天气、预算、人数都要自己算 → 多因子打分 + 推荐理由 + 一键生成行程</li>
          <li><b>没人一起</b>：想去但室友没空、剧本杀凑不齐 → 组队广场，显示“差几人”</li>
          <li><b>玩完就忘</b>：→ 打卡时间线、徽章、探索进度，打卡可一键转攻略</li>
          <li><b>攻略广告多</b>：→ 同城学生写的真实攻略，按“最省钱”排序</li>
        </ul>
      </div>
      <div class="card" style="margin-top:10px">
        <b>🧠 推荐逻辑</b>
        <p class="muted" style="margin:6px 0 0">基础分 50 → 兴趣命中 +22、在预算内 +12（超预算 −25）、学生价 +5、人数匹配 +8、雨天室内 +15 / 户外 −20、晴天户外 +10、高温室内 +10、当天不开放 −40。每一项都会转成用户看得懂的“推荐理由”或“风险提示”。</p>
      </div>
      <div class="card" style="margin-top:10px">
        <b>🔁 核心闭环</b>
        <p class="muted" style="margin:6px 0 0">发现（推荐/行程）→ 组队（找搭子）→ 出发 → 打卡（记录/徽章）→ 攻略（沉淀内容）→ 反哺下一位用户的发现</p>
      </div>
      <div class="card" style="margin-top:10px">
        <b>🛠️ 技术说明（雏形）</b>
        <p class="muted" style="margin:6px 0 0">纯前端 SPA，数据存于浏览器 localStorage；天气接入 Open-Meteo 实时预报；活动/组队/攻略为示例数据。后续可接入后端、活动方入驻、学生认证、群聊与地图。</p>
      </div>`);
  }

  // ================= 偏好 / 引导 =================
  function showPrefs(first) {
    const p = { ...S.prefs, interests: [...S.prefs.interests] };
    openSheet(first ? '👋 欢迎来到周末去哪儿' : '⚙️ 我的偏好', `
      ${first ? '<div class="ob-hero"><div>🧭</div><h3>30 秒告诉我你的喜好</h3><p class="muted">我会结合本周末天气，为你挑出最合适的去处</p></div>' : ''}
      <div class="field"><label>昵称</label><input id="pf-nick" maxlength="10" value="${esc(p.nickname)}" /></div>
      <div class="field"><label>所在城市</label><div class="opts">${Object.keys(CITIES).map((c) => `<button class="chip ${p.city === c ? 'on' : ''}" data-city="${c}">${c}</button>`).join('')}</div></div>
      <div class="field"><label>感兴趣的活动（多选）</label><div class="opts">${INTERESTS.map((i) => `<button class="chip ${p.interests.includes(i.key) ? 'on' : ''}" data-int="${i.key}">${i.emoji} ${i.key}</button>`).join('')}</div></div>
      <div class="field"><label>单日预算：<b id="pf-bv">¥${p.budget}</b> / 人</label><input type="range" id="pf-budget" min="0" max="300" step="10" value="${p.budget}" style="width:100%" /></div>
      <div class="field"><label>通常几个人出行</label><div class="opts">${[1, 2, 3, 4, 6, 8].map((n) => `<button class="chip ${p.people === n ? 'on' : ''}" data-ppl="${n}">${n === 1 ? '独自' : n === 8 ? '8人+' : n + '人'}</button>`).join('')}</div></div>
      <div class="field"><label><input type="checkbox" id="pf-stu" ${p.student ? 'checked' : ''} style="width:auto" /> 我是在校学生（显示学生优惠价）</label></div>
      <button class="btn" style="width:100%" id="pf-ok">${first ? '开始探索 →' : '保存'}</button>`, (sh) => {
      if (first) $('[data-close]', sh).style.display = 'none';
      const single = (attr, key, cast = (x) => x) => sh.querySelectorAll(`[data-${attr}]`).forEach((b) => (b.onclick = () => { p[key] = cast(b.dataset[attr]); sh.querySelectorAll(`[data-${attr}]`).forEach((x) => x.classList.toggle('on', x === b)); }));
      single('city', 'city'); single('ppl', 'people', Number);
      sh.querySelectorAll('[data-int]').forEach((b) => (b.onclick = () => { const k = b.dataset.int; p.interests = p.interests.includes(k) ? p.interests.filter((x) => x !== k) : [...p.interests, k]; b.classList.toggle('on'); }));
      $('#pf-budget', sh).oninput = (e) => { p.budget = +e.target.value; $('#pf-bv', sh).textContent = '¥' + p.budget; };
      $('#pf-ok', sh).onclick = () => {
        p.nickname = $('#pf-nick', sh).value.trim() || '我'; p.student = $('#pf-stu', sh).checked;
        S.prefs = p; S.onboarded = true; save(); closeSheet(); tab = 'discover'; filter = '全部'; render();
        if (first) toast('已为你生成专属推荐 ✨');
      };
    });
  }
  $('#cityBtn').onclick = () => {
    openSheet('📍 切换城市', `<div class="opts">${Object.keys(CITIES).map((c) => `<button class="chip ${S.prefs.city === c ? 'on' : ''}" data-c="${c}" style="padding:10px 20px">${c}</button>`).join('')}</div><p class="muted">更多城市陆续开放中…</p>`, (sh) => {
      sh.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { S.prefs.city = b.dataset.c; filter = '全部'; save(); closeSheet(); render(); }));
    });
  };

  // ================= 路由 =================
  const views = { discover: renderDiscover, team: renderTeam, checkin: renderCheckin, guide: renderGuide, me: renderMe };
  function render() {
    $('#cityName').textContent = S.prefs.city;
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    views[tab]();
  }
  $('#tabbar').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.tab; window.scrollTo(0, 0); render(); };
  // 全局：点击任意 data-act 打开活动详情
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && !e.target.closest('[data-join],[data-leave]')) showAct(el.dataset.act);
  });

  render();
  if (!S.onboarded) showPrefs(true);
  const m = location.hash.match(/act=(\w+)/);
  if (m && actById(m[1]) && S.onboarded) { S.prefs.city = actById(m[1]).city; render(); setTimeout(() => showAct(m[1]), 300); }
})();
