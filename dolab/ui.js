/* مخطط الدولاب — الواجهة: الرسم في الأعلى والتحكّم كلّه في متناول الإبهام */
'use strict';

const BLUE = '#2563EB';
let sel = -1, selItem = -1, tab = 'add', view = 'in', addTarget = 'auto', clip = null;
const undoS = [], redoS = [];
const cv = $('#cv'), viewEl = $('#view'), tray = $('#tray'), dock = $('#dock');

// ───── أيقونات القطع ─────
const ICON = {
  drawer: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 12h6"/>',
  socks: '<path d="M9 3h6v9l2.6 4.2a2.8 2.8 0 0 1-4.7 3L8.4 14A3 3 0 0 1 9 12.4z"/><path d="M9 7h6"/>',
  shoe: '<path d="M3 17v-6l4-1 3 3 7.5 1.2A3.5 3.5 0 0 1 21 17.7V18H3z"/><path d="M3 20.5h18"/>',
  shoeshelf: '<path d="M3 20h18M3 12h18"/><path d="M4 12v-3l2.5-.5 2 2 3.5.6V12M13 20v-3l2.5-.5 2 2 3.5.6V20"/>',
  rail: '<path d="M10 5a2 2 0 1 1 2 2v1.5"/><path d="M12 8.5 3 15h18z"/>',
  long: '<path d="M10 3.5a2 2 0 1 1 2 2V7"/><path d="M8.5 7h7l3 14h-13z"/>',
  pull: '<path d="M10 3.5a2 2 0 1 1 2 2V7"/><path d="M12 7 5 12h14z"/><path d="M5 18h13m-3-3 3 3-3 3"/>',
  lift: '<path d="M3 4h18"/><path d="M6 4l3 5M18 4l-3 5"/><path d="M12 11v9m-3.5-3.5L12 20l3.5-3.5"/>',
  shelves: '<path d="M4 3v18M20 3v18M4 9h16M4 15h16"/>',
  bin: '<path d="M4 8h16l-1.6 12H5.6z"/><path d="M9.5 12h5"/>',
  toys: '<rect x="3.5" y="13" width="7.5" height="7.5" rx="1"/><rect x="13" y="13" width="7.5" height="7.5" rx="1"/><rect x="8.3" y="4" width="7.5" height="7.5" rx="1"/>',
  hamper: '<path d="M4 7h16l-2 13H6z"/><path d="m7 10 9 8M17 10l-9 8"/>',
  hooks: '<path d="M12 3v9a3.2 3.2 0 1 1-3.2 3.2"/><circle cx="12" cy="3.5" r="1"/>',
  gap: '<rect x="4" y="5" width="16" height="14" rx="2" stroke-dasharray="3 3"/>',
};
const svgI = (t) => `<svg viewBox="0 0 24 24">${ICON[t] || ''}</svg>`;
const tbg = (t) => (TYPES[t].c === 'transparent' ? '#FFFFFF' : TYPES[t].c);

// ───── أدوات ─────
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1900); }
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} }
function snap() { undoS.push(JSON.stringify(S)); if (undoS.length > 80) undoS.shift(); redoS.length = 0; syncUndo(); }
function syncUndo() { $('#bUndo').disabled = !undoS.length; $('#bRedo').disabled = !redoS.length; }
function restore(json) {
  S = JSON.parse(json);
  if (sel >= S.secs.length) sel = S.secs.length - 1;
  if (sel >= 0 && selItem >= S.secs[sel].items.length) selItem = -1;
  refresh();
}
$('#bUndo').onclick = () => { if (!undoS.length) return; redoS.push(JSON.stringify(S)); restore(undoS.pop()); syncUndo(); toast('تراجعتُ خطوة'); };
$('#bRedo').onclick = () => { if (!redoS.length) return; undoS.push(JSON.stringify(S)); restore(redoS.pop()); syncUndo(); toast('أُعيدت الخطوة'); };
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const nDoors = (n) => (n === 1 ? 'باب' : n === 2 ? 'بابان' : `${n} أبواب`);
function secTitle(sc, g) {
  const ds = []; for (let i = sc.a; i <= sc.b; i++) ds.push(i + 1);
  const cross = span(sc, g).cross;
  return (ds.length === 1 ? `الباب ${ds[0]}` : `البابان ${ds.join(' و')}`.replace('البابان', ds.length > 2 ? 'الأبواب' : 'البابان')) + (cross ? ' · الزاوية' : '');
}

// ───── الرسم ─────
let VW = { ox: 0, oy: 0, s: 1 };
function draw() {
  const r = viewEl.getBoundingClientRect();
  const W = Math.max(50, r.width), Hh = Math.max(50, r.height);
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, Hh);
  const g = geo();
  const editing = sel >= 0;
  const m = editing ? { l: 34, r: 10, t: 30, b: 44 } : { l: 40, r: 14, t: 36, b: 72 };
  const s = Math.max(0.25, Math.min((W - m.l - m.r) / g.totalW, (Hh - m.t - m.b) / S.H));
  const ox = m.l + (W - m.l - m.r - g.totalW * s) / 2, oy = m.t + (Hh - m.t - m.b - S.H * s) / 2;
  VW = { ox, oy, s };
  drawWardrobe(ctx, { ox, oy, s, view, sel: null, numbers: true, dims: true, scale: true });
  const X = (x) => ox + x * s, Y = (z) => oy + (S.H - z) * s;
  if (sel >= 0) {
    // الخانات الأخرى باهتة، والمحدّدة بإطارٍ أزرق
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.55)';
    S.secs.forEach((sc, i) => { if (i === sel) return; const sp = span(sc, g); ctx.fillRect(X(sp.x0), Y(S.H) - 1, (sp.x1 - sp.x0) * s, S.H * s + 2); });
    ctx.restore();
    const sp = span(S.secs[sel], g);
    ctx.save(); ctx.strokeStyle = BLUE; ctx.lineWidth = 3;
    rr(ctx, X(sp.x0) + 1.5, Y(S.H) + 1.5, (sp.x1 - sp.x0) * s - 3, (S.H - S.plinth) * s - 3, 5); ctx.stroke(); ctx.restore();
    if (selItem >= 0 && view === 'in') {
      const it2 = itemRects(g).find((q) => q.si === sel && q.ii === selItem);
      if (it2) {
        ctx.save(); ctx.fillStyle = 'rgba(37,99,235,.14)'; ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5;
        rr(ctx, X(it2.x0) + 2, Y(it2.zb) + 1, (it2.x1 - it2.x0) * s - 4, (it2.zb - it2.za) * s - 2, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
  }
}
function itemRects(g) {
  const out = [];
  S.secs.forEach((sc, si) => {
    const sp = span(sc, g);
    layout(sc, g).rows.forEach((r) => {
      if (r.za >= g.z1) return;
      const rx = r.side ? sideRange(sc, g, r.side) : sp;
      out.push({ si, ii: r.i, side: r.side, x0: rx.x0, x1: rx.x1, za: r.za, zb: Math.min(r.zb, g.z1) });
    });
  });
  return out;
}
function hitTest(ev) {
  const r = cv.getBoundingClientRect(), g = geo();
  const x = (ev.clientX - r.left - VW.ox) / VW.s, z = S.H - (ev.clientY - r.top - VW.oy) / VW.s;
  if (z < -4 || z > S.H + 4 || x < -3 || x > g.totalW + 3) return null;
  if (view === 'in') {
    const hits = itemRects(g).filter((q) => x >= q.x0 && x <= q.x1 && z >= q.za && z <= q.zb);
    if (hits.length) { const h = hits.find((q) => q.side) || hits[0]; return { si: h.si, ii: h.ii }; }
  }
  for (let i = 0; i < S.secs.length; i++) { const sp = span(S.secs[i], g); if (x >= sp.x0 - 1 && x <= sp.x1 + 1) return { si: i, ii: -1 }; }
  return null;
}
cv.addEventListener('click', (e) => {
  const h = hitTest(e);
  if (!h) { if (sel >= 0) closeTray(); return; }
  if (h.si === sel && h.ii === selItem && h.ii >= 0) { selItem = -1; renderTray(); draw(); return; }
  openTray(h.si, h.ii);
});
new ResizeObserver(() => draw()).observe(viewEl);

// ───── اللوحة السفلية ─────
function openTray(si, ii) {
  const changed = si !== sel;
  sel = si; selItem = ii;
  if (ii >= 0) tab = 'items';
  else if (changed) tab = S.secs[si].items.length ? 'items' : 'add';
  addTarget = 'auto';
  tray.hidden = false; dock.hidden = true; $('#hint').classList.add('hide'); $('#app').classList.add('editing');
  renderTray(); draw();
}
function closeTray() { sel = -1; selItem = -1; tray.hidden = true; dock.hidden = false; $('#app').classList.remove('editing'); draw(); }
$('#tClose').onclick = closeTray;
$('#tPrev').onclick = () => { if (sel > 0) openTray(sel - 1, -1); };
$('#tNext').onclick = () => { if (sel < S.secs.length - 1) openTray(sel + 1, -1); };
$('#tTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.t; renderTray(); });

function renderTray() {
  if (sel < 0) return;
  const g = geo(), sc = S.secs[sel], L = layout(sc, g), sp = span(sc, g);
  $('#tTitle').textContent = secTitle(sc, g);
  const sub = $('#tSub');
  if (L.over > 0.5) { sub.textContent = `زيادة ${r1(L.over)} سم — قلّل الارتفاعات`; sub.className = 'bad'; }
  else { sub.textContent = (sp.cross ? `زاوية مفتوحة · تعليق L ≈${Math.round(railLen(sc, g))} سم` : `داخلها ≈${r1(netW(sc, g))} سم`) + ` · المتبقي ${r1(Math.max(0, L.free))} سم`; sub.className = ''; }
  $('#tPrev').disabled = sel === 0; $('#tNext').disabled = sel === S.secs.length - 1;
  [...$('#tTabs').children].forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
  $('#tCount').textContent = sc.items.length || '';
  const B = $('#tBody');
  if (tab === 'add') B.innerHTML = addHTML(sc, g, sp);
  else if (tab === 'items') B.innerHTML = itemsHTML(sc, g, L, sp);
  else B.innerHTML = secHTML(sc, g, sp);
  if (tab === 'items' && selItem >= 0) { const el = B.querySelector('.row.on'); if (el) el.scrollIntoView({ block: 'nearest' }); }
}

function sideName(sc, g, side) { return `خلف ${sideDoors(sc, g, side).length > 1 ? 'الأبواب' : 'الباب'} ${sideDoors(sc, g, side).join(' و')}`; }
function addHTML(sc, g, sp) {
  let h = '';
  if (sp.cross) {
    const opts = [['auto', 'تلقائي'], ['L', sideName(sc, g, 'L')], ['R', sideName(sc, g, 'R')], ['shared', 'مشترك']];
    h += `<div class="target"><span>أضف في:</span>${opts.map(([v, l]) => `<button class="chip${addTarget === v ? ' on' : ''}" data-tg="${v}">${l}</button>`).join('')}</div>`;
  }
  h += `<div class="tiles">${PALETTE.map((t) => `<button class="tile" data-add="${t}"><span class="ic" style="background:${tbg(t)}">${svgI(t)}</span>${TYPES[t].n}</button>`).join('')}</div>`;
  return h;
}
function itemsHTML(sc, g, L, sp) {
  if (!sc.items.length) return `<div class="empty">الخانة فارغة<br><button class="btn pri" data-go="add">أضف أول قطعة</button></div>`;
  const rows = L.rows.slice().sort((a, b) => b.za - a.za || (a.side === 'R' ? -1 : 1));
  return `<ul class="items">${rows.map((r) => {
    const x = r.x, T = TYPES[x.t], on = r.i === selItem, over = r.zb > g.z1 + 0.5;
    const where = r.side ? ` · ${sideName(sc, g, r.side)}` : (sp.cross ? ' · مشترك' : '');
    let ed = '';
    if (on) {
      ed = `<div class="redit">
        <div class="ctlrow"><span>الارتفاع</span><div class="stepper"><button data-a="h-" aria-label="أقل">−</button><output>${r1(r.h)} <small>سم</small></output><button data-a="h+" aria-label="أكثر">+</button></div></div>
        ${x.t === 'shelves' ? `<div class="ctlrow"><span>الرفوف</span><div class="stepper"><button data-a="k-">−</button><output>${x.k || 1}</output><button data-a="k+">+</button></div></div>` : ''}
        ${sp.cross ? `<div class="ctlrow"><span>المكان</span><div class="seg3"><button data-a="side" data-v="" class="${!x.side ? 'on' : ''}">مشترك</button><button data-a="side" data-v="L" class="${x.side === 'L' ? 'on' : ''}">${sideName(sc, g, 'L').replace('خلف ', '')}</button><button data-a="side" data-v="R" class="${x.side === 'R' ? 'on' : ''}">${sideName(sc, g, 'R').replace('خلف ', '')}</button></div></div>` : ''}
        <label class="sw"><input type="checkbox" data-a="fill" ${x.f ? 'checked' : ''}>يملأ المساحة المتبقية تلقائياً</label>
        <input class="namein" data-a="label" value="${esc(x.l)}" placeholder="اسمٌ لها (اختياري) — مثلاً: بيجامات">
        <div class="acts3">
          <button data-a="up"><svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>أعلى</button>
          <button data-a="down"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>أسفل</button>
          <button data-a="del" class="del"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>حذف</button>
        </div></div>`;
    }
    return `<li class="row${on ? ' on' : ''}${over ? ' over' : ''}" data-i="${r.i}">
      <button class="rhead" data-a="open"><span class="dot" style="background:${tbg(x.t)}">${svgI(x.t)}</span>
        <span class="nm"><b>${esc(x.l || T.n)}</b><small>من ${Math.round(r.za)} إلى ${Math.round(r.zb)} سم${where}</small></span>
        <span class="hh">${x.f ? 'تلقائي' : r1(r.h)}</span>
        <svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>${ed}</li>`;
  }).join('')}</ul>`;
}
function secHTML(sc, g, sp) {
  const prev = S.secs[sel - 1], next = S.secs[sel + 1];
  const canR = prev && (g.doors[prev.b].pi === g.doors[sc.a].pi || S.corner);
  const canL = next && (g.doors[sc.b].pi === g.doors[next.a].pi || S.corner);
  let h = '';
  if (sp.cross) h += `<div class="warn">الزاوية مفتوحة من الداخل: ضع الأدراج «خلف الباب»، والتعليق الطويل أو الرفوف «مشتركاً» فوقها.</div>`;
  h += `<div class="h5">تعبئة سريعة</div><div class="quick">${QUICK.map((q, i) => `<button data-q="${i}"><i style="background:${tbg(q.items()[0].t)}"></i>${q.n}</button>`).join('')}</div>`;
  h += `<div class="h5">ترتيب الخانات</div>
    <div class="acts2"><button data-a="mergeR" ${canR ? '' : 'disabled'}>دمج مع اليمين</button><button data-a="mergeL" ${canL ? '' : 'disabled'}>دمج مع اليسار</button></div>
    <div class="acts2" style="margin-top:6px"><button data-a="split" ${sc.a === sc.b ? 'disabled' : ''}>فصل الأبواب</button><button data-a="clear" ${sc.items.length ? '' : 'disabled'}>إفراغ الخانة</button></div>
    <div class="acts2" style="margin-top:6px"><button data-a="copy" ${sc.items.length ? '' : 'disabled'}>نسخ المحتوى</button><button data-a="paste" ${clip ? '' : 'disabled'}>لصق المحتوى</button></div>`;
  if (S.loft > 0) h += `<div class="h5">السندرة فوق هذه الخانة</div><input class="namein" data-a="loft" value="${esc(sc.loft || '')}" placeholder="مثلاً: موسمي، حقائب سفر">`;
  return h;
}

// ───── أفعال اللوحة ─────
const STEP = (h) => (h < 40 ? 2 : 5);
$('#tBody').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || sel < 0) return;
  const g = geo(), sc = S.secs[sel];
  if (b.dataset.go) { tab = b.dataset.go; renderTray(); return; }
  if (b.dataset.tg) { addTarget = b.dataset.tg; renderTray(); return; }
  if (b.dataset.add) { addItem(b.dataset.add); return; }
  if (b.dataset.q != null) { snap(); sc.items = QUICK[+b.dataset.q].items(); selItem = -1; tab = 'items'; refresh(); toast(`طُبّقت «${QUICK[+b.dataset.q].n}»`); return; }
  const a = b.dataset.a; if (!a) return;
  const li = b.closest('.row'), i = li ? +li.dataset.i : -1, x = li ? sc.items[i] : null;
  switch (a) {
    case 'open': selItem = selItem === i ? -1 : i; renderTray(); draw(); return;
    case 'h-': case 'h+': {
      snap();
      const cur = x.f ? layout(sc, g).rows.find((r) => r.i === i).h : x.h;
      x.f = 0; x.h = Math.max(TYPES[x.t].min, Math.round(cur + (a === 'h+' ? 1 : -1) * STEP(cur)));
      refresh(); return;
    }
    case 'k-': case 'k+': snap(); x.k = Math.max(1, Math.min(12, (x.k || 1) + (a === 'k+' ? 1 : -1))); refresh(); return;
    case 'side': snap(); if (b.dataset.v) x.side = b.dataset.v; else delete x.side; refresh(); return;
    case 'up': case 'down': {
      // يحرّك القطعة في عمودها: خلف الباب نفسه أو المشترك
      const same = (y) => (y.side || '') === (x.side || '') || !span(sc, g).cross;
      const dir = a === 'up' ? 1 : -1;
      let j = i + dir;
      while (j >= 0 && j < sc.items.length && !same(sc.items[j])) j += dir;
      if (j < 0 || j >= sc.items.length) { toast(a === 'up' ? 'هي الأعلى' : 'هي الأسفل'); return; }
      snap(); [sc.items[i], sc.items[j]] = [sc.items[j], sc.items[i]]; selItem = j; refresh(); return;
    }
    case 'del': snap(); sc.items.splice(i, 1); selItem = -1; refresh(); toast('حُذفت القطعة'); return;
    case 'mergeR': return merge(-1);
    case 'mergeL': return merge(1);
    case 'split': return split();
    case 'clear': snap(); sc.items = []; selItem = -1; refresh(); return;
    case 'copy': clip = JSON.stringify(sc.items); toast('نُسخ المحتوى'); renderTray(); return;
    case 'paste': if (!clip) return; snap(); sc.items = JSON.parse(clip); refresh(); toast('لُصق المحتوى'); return;
  }
});
$('#tBody').addEventListener('change', (e) => {
  const el = e.target, a = el.dataset.a; if (!a || sel < 0) return;
  const g = geo(), sc = S.secs[sel], li = el.closest('.row'), x = li ? sc.items[+li.dataset.i] : null;
  if (a === 'fill') {
    snap();
    if (el.checked) { sc.items.forEach((y) => { y.f = 0; }); x.f = 1; }
    else { const r = layout(sc, g).rows.find((q) => q.x === x); x.h = Math.round(r.h); x.f = 0; }
    refresh();
  } else if (a === 'label' || a === 'loft') { save(); renderFacts(); }
});
$('#tBody').addEventListener('input', (e) => {
  const el = e.target, a = el.dataset.a; if (sel < 0) return;
  const sc = S.secs[sel];
  if (a === 'label') { sc.items[+el.closest('.row').dataset.i].l = el.value.slice(0, 30); draw(); }
  else if (a === 'loft') { sc.loft = el.value.slice(0, 30); draw(); }
});

function addItem(t) {
  snap();
  const g = geo(), sc = S.secs[sel], x = it(t);
  if (t === 'shelves') x.k = 2;
  if (span(sc, g).cross) {
    const drawerLike = ['drawer', 'socks', 'shoe', 'toys', 'hamper', 'bin'].includes(t);
    const tg = addTarget === 'auto' ? (drawerLike ? 'L' : 'shared') : addTarget;
    if (tg === 'L' || tg === 'R') x.side = tg;
  }
  const fi = sc.items.findIndex((y) => y.f);
  if (fi >= 0 && !x.side) sc.items.splice(fi, 0, x); else if (fi >= 0) sc.items.splice(fi, 0, x); else sc.items.push(x);
  selItem = sc.items.indexOf(x);
  const L = layout(sc, g);
  refresh();
  toast(L.over > 0.5 ? `لا يتّسع: زيادة ${r1(L.over)} سم — قلّل الارتفاعات` : `أُضيف «${TYPES[t].n}»${x.side ? ' ' + sideName(sc, g, x.side) : ''}`);
}
function merge(dir) {
  const sc = S.secs[sel], j = sel + dir, nb = S.secs[j]; if (!nb) return;
  const g = geo(), a = Math.min(sc.a, nb.a), b = Math.max(sc.b, nb.b);
  if (g.doors[a].pi !== g.doors[b].pi && !S.corner) { toast('لا يمكن دمج جزأين منفصلين'); return; }
  snap();
  const items = sc.items.length ? sc.items : nb.items;
  S.secs.splice(Math.min(sel, j), 2, { a, b, items, loft: sc.loft || nb.loft || '' });
  sel = Math.min(sel, j); selItem = -1; refresh(); toast('دُمجت الخانتان');
}
function split() {
  const sc = S.secs[sel]; if (sc.a === sc.b) return;
  snap();
  const parts = []; for (let i = sc.a; i <= sc.b; i++) parts.push(sec(i, i, i === sc.a ? sc.items.map((y) => { const c = Object.assign({}, y); delete c.side; return c; }) : [], sc.loft));
  S.secs.splice(sel, 1, ...parts); selItem = -1; refresh(); toast('فُصلت الأبواب');
}

// ───── الرأس والأرقام ─────
function renderFacts() {
  const t = stats();
  const c = (v, l) => `<span><b>${v}</b> ${l}</span>`;
  $('#facts').innerHTML = c(r1(t.rail), 'م تعليق') + c(t.dr, 'أدراج') + c(t.shoes, 'جوتي') + c(t.socks, 'جواريب');
  $('#dName').textContent = S.name;
  $('#dDims').textContent = `${S.corner && S.parts.length > 1 ? 'زاوية · ' : ''}${S.parts.map((p) => p.w).join(' + ')} × ${S.H} · عمق ${S.depth} · ${nDoors(S.parts.reduce((a, p) => a + p.n, 0))}`;
  document.title = `${S.name} — مخطط الدولاب`;
}
function refresh() { draw(); renderFacts(); if (sel >= 0) renderTray(); save(); }

$('#viewSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  view = b.dataset.v; [...$('#viewSeg').children].forEach((x) => x.classList.toggle('on', x === b)); draw();
});

// ───── الأوراق المنبثقة ─────
function openModal(id) { const m = $('#' + id); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); }));
dock.addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]'); if (!b) return;
  const id = b.dataset.open;
  if (id === 'mDims') { draft = JSON.parse(JSON.stringify(S)); renderDims(); }
  if (id === 'mPresets') renderPresets();
  if (id === 'mColors') renderColors();
  if (id === 'mSave') prepareExport();
  openModal(id);
});

// القياسات
let draft = null;
function stepper(key, val, unit, extra) {
  return `<div class="stepper" data-key="${key}"${extra || ''}><button data-s="-" aria-label="أقل">−</button><input class="num" type="number" inputmode="numeric" value="${val}" aria-label="${unit}"><button data-s="+" aria-label="أكثر">+</button></div>`;
}
function partInfo(st, i) {
  const f = partFill(st, i);
  if (f.left < -0.5) return { bad: true, t: `الأبواب (${st.parts[i].n} × ${st.parts[i].dw}) أعرض من الواجهة ${r1(f.front)} سم` };
  const bits = [`الواجهة ${r1(f.front)} سم`];
  if (f.cL || f.cR) bits.push(`حشوة ${r1(f.cL ? f.l : f.r)} عند الزاوية`);
  const wallF = f.cL && f.cR ? 0 : (f.cL ? f.r : f.cR ? f.l : f.l + f.r);
  if (wallF > 0.4) bits.push(f.cL || f.cR ? `وحشوة ${r1(wallF)} عند الجدار` : `حشوتان ${r1(wallF / 2)} عند الطرفين`);
  return { bad: false, t: bits.join(' · ') };
}
function renderDims() {
  const d = draft;
  let h = `<input class="namefield" id="fName" value="${esc(d.name)}" maxlength="40" placeholder="اسم التصميم">`;
  h += `<div class="card"><label class="sw"><input type="checkbox" id="fCorner" ${d.corner ? 'checked' : ''}>الأجزاء تلتقي على زاوية (L)</label>
    <div class="note">الطول يُقاس على الجدار${d.corner ? ' من الزاوية' : ''}، والأجزاء مرتّبة من اليمين إلى اليسار.</div></div>`;
  d.parts.forEach((p, i) => {
    const inf = partInfo(d, i);
    h += `<div class="card" data-p="${i}">
      <div class="cardhd"><input data-pk="name" value="${esc(p.name)}" aria-label="اسم الجزء">${d.parts.length > 1 ? '<button data-rm="1">حذف</button>' : ''}</div>
      <div class="kv"><span>الطول على الجدار</span>${stepper('w', p.w, 'الطول', ` data-p="${i}" data-st="5"`)}</div>
      <div class="kv"><span>عدد الأبواب</span>${stepper('n', p.n, 'الأبواب', ` data-p="${i}" data-st="1"`)}</div>
      <div class="kv"><span>عرض الباب</span>${stepper('dw', p.dw, 'عرض الباب', ` data-p="${i}" data-st="5"`)}</div>
      <div class="info${inf.bad ? ' bad' : ''}">${inf.t}</div></div>`;
  });
  h += `<button class="btn wide" id="addPart">＋ إضافة جزء</button>`;
  h += `<div class="card">
    <div class="kv"><span>الارتفاع الكلي</span>${stepper('H', d.H, 'الارتفاع', ' data-st="5"')}</div>
    <div class="kv"><span>العمق</span>${stepper('depth', d.depth, 'العمق', ' data-st="5"')}</div>
    <div class="kv"><span>القاعدة</span>${stepper('plinth', d.plinth, 'القاعدة', ' data-st="1"')}</div>
    <div class="kv"><span>السندرة <small style="color:var(--mute)">(0 = بلا)</small></span>${stepper('loft', d.loft, 'السندرة', ' data-st="5"')}</div></div>
    <p class="note">تغيير عدد الأبواب يعيد تقسيم الخانات فارغةً من جديد، ويمكنك التراجع بعده.</p>`;
  $('#dimsBody').innerHTML = h;
}
function readDimsInputs() {
  document.querySelectorAll('#dimsBody .stepper').forEach((st) => {
    const v = parseFloat(st.querySelector('input').value); if (!isFinite(v)) return;
    const k = st.dataset.key, p = st.dataset.p;
    if (p != null) draft.parts[+p][k] = v; else draft[k] = v;
  });
  draft.name = ($('#fName').value || 'دولاب').slice(0, 40);
  draft.corner = $('#fCorner').checked;
  document.querySelectorAll('#dimsBody [data-pk="name"]').forEach((el) => { draft.parts[+el.closest('.card').dataset.p].name = el.value.slice(0, 24); });
}
function refreshInfos() {
  document.querySelectorAll('#dimsBody .card[data-p]').forEach((c) => {
    const inf = partInfo(draft, +c.dataset.p), el = c.querySelector('.info');
    el.textContent = inf.t; el.classList.toggle('bad', inf.bad);
  });
}
$('#dimsBody').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.s) {
    const st = b.closest('.stepper'), inp = st.querySelector('input'), step = +(st.dataset.st || 1);
    inp.value = Math.max(0, (parseFloat(inp.value) || 0) + (b.dataset.s === '+' ? step : -step));
    readDimsInputs(); refreshInfos(); return;
  }
  if (b.id === 'addPart') { readDimsInputs(); draft.parts.push({ name: `الجزء ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][draft.parts.length] || draft.parts.length + 1}`, w: 100, n: 2, dw: 50 }); renderDims(); return; }
  if (b.dataset.rm) { readDimsInputs(); draft.parts.splice(+b.closest('.card').dataset.p, 1); renderDims(); }
});
$('#dimsBody').addEventListener('input', () => { readDimsInputs(); refreshInfos(); });
$('#dimsBody').addEventListener('change', (e) => { if (e.target.id === 'fCorner') { readDimsInputs(); renderDims(); } });
$('#dimsApply').onclick = () => {
  readDimsInputs();
  const d = draft, cl = (v, lo, hi, def) => (isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def);
  d.H = cl(d.H, 120, 330, 240); d.depth = cl(d.depth, 30, 120, 60); d.plinth = cl(d.plinth, 0, 25, 10); d.loft = cl(d.loft, 0, 120, 0);
  for (const [i, p] of d.parts.entries()) {
    p.w = cl(p.w, 30, 600, 100); p.n = Math.round(cl(p.n, 1, 12, 1)); p.dw = cl(p.dw, 20, 120, 50);
    if (partFill(d, i).left < -0.5) { toast(`أبواب «${p.name}» أعرض من واجهته`); return; }
  }
  if (d.H - d.plinth - d.loft < 60) { toast('الجسم أقصر من 60 سم'); return; }
  const same = d.parts.length === S.parts.length && d.parts.every((p, i) => p.n === S.parts[i].n) && !!d.corner === !!S.corner;
  if (!same) {
    d.secs = singles(d);
    if (d.corner && d.parts.length > 1) {   // الزاوية مفتوحة من الداخل: يُدمج البابان حولها
      let i0 = 0;
      for (let pi = 0; pi < d.parts.length - 1; pi++) {
        i0 += d.parts[pi].n;
        const k = d.secs.findIndex((x) => x.a === i0 - 1);
        if (k >= 0 && d.secs[k + 1]) d.secs.splice(k, 2, sec(i0 - 1, d.secs[k + 1].b, []));
      }
    }
  }
  snap(); S = normalize(d); if (sel >= S.secs.length) closeTray();
  closeModal($('#mDims')); refresh(); toast(same ? 'طُبّقت القياسات' : 'طُبّقت القياسات — الخانات فارغة');
};

// الأفكار الجاهزة
function thumb(c, st, v) {
  const g = geo(st), ctx = c.getContext('2d'), W = c.width, Hh = c.height, s = Math.min((W - 16) / g.totalW, (Hh - 14) / st.H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, Hh);
  drawWardrobe(ctx, { ox: (W - g.totalW * s) / 2, oy: 7, s, view: v || 'in', fs: 7 }, st);
}
function renderPresets() {
  let h = '', grp = '';
  PRESETS.forEach((p, i) => {
    if (p.g !== grp) { grp = p.g; h += `<div class="psec">${grp}</div>`; }
    h += `<button class="preset" data-p="${i}"><canvas width="224" height="190" data-pv="${i}"></canvas><div><b>${p.n}</b><span>${p.d}</span></div></button>`;
  });
  $('#presetsBody').innerHTML = h;
  document.querySelectorAll('[data-pv]').forEach((c) => thumb(c, normalize(PRESETS[+c.dataset.pv].make())));
}
$('#presetsBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  if (!confirm('سيحلّ هذا التقسيم محلّ تصميمك الحالي (ويمكنك التراجع). متابعة؟')) return;
  snap(); S = normalize(PRESETS[+b.dataset.p].make()); closeTray();
  closeModal($('#mPresets')); refresh(); toast(`طُبّقت فكرة «${PRESETS[+b.dataset.p].n}»`);
});

// ألوان الأبواب
function renderColors() {
  $('#colorsBody').innerHTML = `<div class="schemes">${SCHEMES.map((c, i) => `<button class="scheme${(S.scheme || 0) === i ? ' on' : ''}" data-sc="${i}"><canvas width="240" height="170" data-cv="${i}"></canvas>${c.n}</button>`).join('')}</div>`;
  document.querySelectorAll('[data-cv]').forEach((c) => thumb(c, Object.assign(JSON.parse(JSON.stringify(S)), { scheme: +c.dataset.cv }), 'doors'));
}
$('#colorsBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-sc]'); if (!b) return;
  snap(); S.scheme = +b.dataset.sc;
  view = 'doors'; [...$('#viewSeg').children].forEach((x) => x.classList.toggle('on', x.dataset.v === 'doors'));
  document.querySelectorAll('.scheme').forEach((x) => x.classList.toggle('on', x === b));
  refresh();
});

// الحفظ
let expBlobs = {};
async function prepareExport() {
  $('#expPng').disabled = true; $('#expPdf').disabled = true; expBlobs = {};
  $('#expPrev').removeAttribute('src');
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 60));
  const png = renderPNG();
  $('#expPrev').src = png.toDataURL('image/jpeg', 0.7);
  png.toBlob((b) => { expBlobs.png = b; $('#expPng').disabled = false; }, 'image/png');
  setTimeout(() => { expBlobs.pdf = buildPDF(renderPDFPages()); $('#expPdf').disabled = false; }, 60);
}
function download(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000); toast('بدأ التنزيل');
}
function deliver(blob, name) {
  if (!blob) return;
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: name }).catch((e) => { if (e && e.name !== 'AbortError') download(blob, name); });
  else download(blob, name);
}
$('#expPng').onclick = () => deliver(expBlobs.png, fileBase() + '.png');
$('#expPdf').onclick = () => deliver(expBlobs.pdf, fileBase() + '.pdf');
$('#expLink').onclick = async () => {
  const url = encodeState();
  try { await navigator.clipboard.writeText(url); toast('نُسخ الرابط'); }
  catch (e) { if (navigator.share) navigator.share({ url, title: S.name }).catch(() => {}); else prompt('انسخ الرابط:', url); }
};
$('#bReset').onclick = () => {
  if (!confirm('إفراغ كل الخانات؟ (يمكنك التراجع)')) return;
  snap(); S.secs.forEach((sc) => { sc.items = []; }); closeTray(); closeModal($('#mSave')); refresh(); toast('الخانات فارغة');
};

// ───── البدء ─────
function load() {
  try {
    const h = decodeState(location.hash);
    if (h && h.parts) { history.replaceState(null, '', location.pathname); setTimeout(() => toast('فُتح التصميم من الرابط'), 300); return normalize(h); }
  } catch (e) { console.warn(e); }
  try { const j = JSON.parse(localStorage.getItem(LS_KEY)); if (j && j.parts && j.secs) return normalize(j); } catch (e) {}
  return normalize(PRESETS[0].make());
}
S = load();
syncUndo();
refresh();
setTimeout(() => $('#hint').classList.add('hide'), 6000);
const Q = new URLSearchParams(location.search);
if (Q.get('shot') === 'tray') setTimeout(() => openTray(0, 0), 50);
if (Q.get('shot') === 'add') setTimeout(() => { openTray(1, -1); tab = 'add'; renderTray(); }, 50);
const ff = [new FontFace('Sakkal', "url('fonts/sakkal-400.woff2')", { weight: '400' }), new FontFace('Sakkal', "url('fonts/sakkal-700.woff2')", { weight: '700' })];
Promise.all(ff.map((f) => f.load().then((x) => document.fonts.add(x)).catch(() => {}))).then(() => draw());
