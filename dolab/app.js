/* مخطط الدولاب — تقسيم داخلي تفاعلي يُصدَّر صورةً وPDF */
'use strict';

const VER = 3;
const LS_KEY = 'dolab_v3';
const PT = 1.8;            // سماكة اللوح (سم)
const GAPC = 8;            // فراغ رمزي للركن في الرسم الممدود
const INK = '#17343A', INK2 = '#5B6E72', ACC = '#E8753F', ACC2 = '#2F7F86';
const WOOD = '#C9AE84', WOOD_L = '#E3D2B4';
const FONT = "'Sakkal', 'Geeza Pro', Tahoma, sans-serif";

const TYPES = {
  rail:      { n: 'علّاقة',        c: '#BCD7EC', h: 90,  min: 35, hang: 1, d: 'مساحة تعليق تحت رف' },
  long:      { n: 'تعليق طويل',    c: '#A8C9E5', h: 140, min: 80, hang: 1, d: 'دشاديش وفساتين وجاكيتات' },
  pull:      { n: 'علّاقة سحب',    c: '#CBE1F2', h: 60,  min: 35, d: 'للخانات الضيّقة، تُسحب للأمام' },
  lift:      { n: 'علّاقة نزّالة', c: '#B1D0EA', h: 110, min: 80, hang: 1, d: 'تنزل بمقبض لمستوى الطفل' },
  drawer:    { n: 'درج',            c: '#F5C6A5', h: 20,  min: 8 },
  socks:     { n: 'درج جواريب',    c: '#F5D96F', h: 12,  min: 8 },
  shoe:      { n: 'درج جوتي',      c: '#B5DEC6', h: 20,  min: 12 },
  shoeshelf: { n: 'رف أحذية',      c: '#CFEBDA', h: 36,  min: 16 },
  shelves:   { n: 'رفوف',           c: '#DCD1EC', h: 100, min: 15, k: 3 },
  bin:       { n: 'صناديق',         c: '#E6DCF3', h: 40,  min: 12 },
  toys:      { n: 'صناديق ألعاب',  c: '#F2B1AE', h: 45,  min: 18 },
  hamper:    { n: 'سلة غسيل',      c: '#CFE0E6', h: 55,  min: 28 },
  hooks:     { n: 'خطافات',         c: '#DDEBF6', h: 40,  min: 18 },
  gap:       { n: 'فراغ',            c: 'transparent', h: 20, min: 4 },
};
const PALETTE = ['drawer', 'rail', 'shelves', 'socks', 'shoe', 'long', 'pull', 'lift', 'shoeshelf', 'bin', 'toys', 'hamper', 'hooks', 'gap'];

const SCHEMES = [
  { n: 'خشب', c1: '#F1E6D2', c2: '#F1E6D2', lf: '#E7D9C0', h: '#8B5E34', hs: 'bar' },
  { n: 'سماء', c1: '#BCD7EC', c2: '#FFFFFF', lf: '#E9F1F7', h: '#FFFFFF', hs: 'cloud' },
  { n: 'غابة', c1: '#B9CDB0', c2: '#E3CFA9', lf: '#EFE4CF', h: '#A7774A', hs: 'knob' },
  { n: 'مشمش', c1: '#F1C3A3', c2: '#F4E9D8', lf: '#F7EFE3', h: '#8A5A3B', hs: 'loop' },
  { n: 'أبيض', c1: '#FFFFFF', c2: '#FFFFFF', lf: '#FFFFFF', h: 'rainbow', hs: 'knob' },
];
const RAINBOW = ['#E25D4B', '#F2A73B', '#E9C82F', '#5BB672', '#4A90D9', '#8A63C9'];

// ───── عناصر ─────
const it = (t, h, l, x) => Object.assign({ t, h: h == null ? TYPES[t].h : h, l: l || '' }, x || {});
const fill = (t, l, k) => it(t, TYPES[t].h, l, k ? { f: 1, k } : { f: 1 });
const drawers = (n, h) => Array.from({ length: n }, () => it('drawer', h || 20));

const QUICK = [
  { n: 'تعليق مزدوج', items: () => [it('drawer', 20), it('rail', 66, 'تعليق في متناوله'), fill('rail', 'تعليق علوي')] },
  { n: 'أدراج ورفوف', items: () => [it('shoe', 20), ...drawers(3), fill('shelves', 'مطويّات', 4)] },
  { n: 'تعليق طويل', items: () => [it('shoeshelf', 36), fill('long', '')] },
  { n: 'عمود صغائر', items: () => [it('hamper', 45), it('drawer', 15, 'داخلية'), it('socks', 12), fill('shelves', '', 5)] },
  { n: 'علّاقة سحب', items: () => [it('shoe', 18), it('socks', 12), it('pull', 60), fill('shelves', '', 3)] },
  { n: 'ألعاب', items: () => [it('toys', 45), it('toys', 40), fill('shelves', 'كتب', 3)] },
  { n: 'رفوف كاملة', items: () => [fill('shelves', 'مطويّات', 6)] },
];

// ───── القوالب ─────
const L_PARTS = () => [{ name: 'الجزء الأول', w: 150, n: 3 }, { name: 'الجزء الثاني', w: 200, n: 4 }];
const BASE = (o) => Object.assign({ v: VER, name: 'دولاب الأطفال', H: 240, plinth: 10, loft: 40, depth: 80, corner: true, scheme: 0, parts: L_PARTS() }, o);
const sec = (a, b, items, loft) => ({ a, b, items, loft: loft || '' });

const PRESETS = [
  { g: 'دولاب أطفال زاوية L (150 + 200، أبواب 50)', n: 'المتوازن', d: 'لطفل واحد من 4 إلى 10 سنوات: اليوميّ تحت 110 سم، والطويل حول الركن المفتوح من الداخل.', make: () => BASE({ secs: [
    sec(0, 0, [it('shoe', 18), it('drawer', 18, 'بناطيل'), it('drawer', 18, 'تيشيرتات'), it('socks', 12), fill('shelves', 'ملابس مطويّة', 4)], 'موسمي'),
    sec(1, 1, [it('drawer', 20), it('rail', 66, 'تعليق في متناوله'), fill('rail', 'تعليق علوي')], 'مقاسات قادمة'),
    sec(2, 3, [it('shoeshelf', 36, 'أحذية المناسبات'), fill('long', 'دشاديش وفساتين وجاكيتات')], 'حقائب سفر'),
    sec(4, 4, [it('toys', 42, 'صندوق ألعاب'), it('rail', 66, 'ملابس اليوم'), fill('shelves', 'بطانيات', 2)], 'ألعاب مخزّنة'),
    sec(5, 5, [it('drawer', 18), it('drawer', 18), it('drawer', 18, 'بيجامات'), it('drawer', 14, 'داخلية'), fill('shelves', 'مطويّات', 3)], 'أغطية الشتاء'),
    sec(6, 6, [it('hamper', 50), it('hooks', 42, 'حقيبة المدرسة'), fill('shelves', 'كتب وأغراض', 3)], 'موسمي'),
  ] }) },
  { g: 'دولاب أطفال زاوية L (150 + 200، أبواب 50)', n: 'ينمو معه', d: 'لعمر 2–6: علّاقات منخفضة يرفعها الأهل مع العمر، وركن ألعاب.', make: () => BASE({ secs: [
    sec(0, 0, [it('shoe', 16, 'جوتي يومي'), it('socks', 12), it('rail', 48, 'تعليق منخفض'), fill('shelves', 'رفوف تُنقل', 3)], 'مقاسات قادمة'),
    sec(1, 1, [it('bin', 30, 'سلّتان بالصور'), it('rail', 48, 'تعليق منخفض'), fill('rail', 'مقاسات أكبر')], 'مقاسات قادمة'),
    sec(2, 3, [it('toys', 36, 'ألعاب كبيرة'), it('toys', 38, 'ألعاب يومية'), fill('shelves', 'كتب وبطانيات', 3)], 'ألعاب بالتناوب'),
    sec(4, 4, [it('drawer', 18, 'بناطيل'), it('drawer', 18, 'تيشيرتات'), it('drawer', 18, 'بيجامات'), it('drawer', 14, 'داخلية'), fill('shelves', 'للأهل', 3)], 'موسمي'),
    sec(5, 5, [it('shoeshelf', 38, 'أحذية سحّاب'), it('rail', 50), fill('rail', 'تعليق علوي')], 'موسمي'),
    sec(6, 6, [it('hamper', 32), it('hooks', 40, 'خطافات منخفضة'), fill('shelves', '', 3)], 'ذكريات'),
  ] }) },
  { g: 'دولاب أطفال زاوية L (150 + 200، أبواب 50)', n: 'طفلان', d: 'البابان 1 و2 للأصغر، و5–7 للأكبر، والركن مشترك للمناسبات.', make: () => BASE({ name: 'دولاب الطفلين', secs: [
    sec(0, 0, [it('shoe', 18), it('socks', 12), it('drawer', 16, 'داخلية'), it('drawer', 16, 'بيجامات'), fill('shelves', 'مطويّات الأصغر', 4)], 'الأصغر'),
    sec(1, 1, [it('drawer', 20), it('rail', 66, 'تعليق الأصغر'), fill('rail', 'تعليق علوي')], 'الأصغر'),
    sec(2, 3, [it('shoeshelf', 30, 'أحذية المناسبات'), fill('long', 'تعليق طويل مشترك')], 'مشترك'),
    sec(4, 4, [it('drawer', 20), it('rail', 88, 'تعليق الأكبر'), fill('rail', 'تعليق علوي')], 'الأكبر'),
    sec(5, 5, [it('shoe', 20), it('drawer', 20, 'بناطيل'), it('drawer', 20, 'تيشيرتات'), it('drawer', 18, 'بيجامات'), it('socks', 12), fill('shelves', 'مطويّات الأكبر', 2)], 'الأكبر'),
    sec(6, 6, [it('hamper', 52, 'سلة مشتركة'), fill('shelves', 'كتب', 4)], 'الأكبر'),
  ] }) },
  { g: 'دولاب أطفال زاوية L (150 + 200، أبواب 50)', n: 'التخزين الأقصى', d: 'أدراج وصناديق ألعاب أكثر، وتعليق مركّز في خانة الباب 2.', make: () => BASE({ secs: [
    sec(0, 0, [it('shoe', 18), it('drawer', 16), it('drawer', 16), it('socks', 12), fill('shelves', 'سلال قماش', 4)], 'موسمي'),
    sec(1, 1, [it('drawer', 20), it('rail', 66), fill('rail', 'تعليق علوي')], 'مقاسات قادمة'),
    sec(2, 3, [it('bin', 26, 'بطانيات'), it('toys', 32), it('toys', 32, 'ألعاب تركيب'), fill('shelves', 'كتب وموسمي', 3)], 'حقائب سفر'),
    sec(4, 4, [it('shoe', 20), ...drawers(4, 18), it('socks', 12), fill('shelves', '', 2)], 'ألعاب مخزّنة'),
    sec(5, 5, [it('toys', 40), it('toys', 40), fill('shelves', 'رفوف تخزين', 3)], 'أغطية'),
    sec(6, 6, [it('hamper', 48), it('pull', 76, 'زي المدرسة'), fill('shelves', '', 2)], 'موسمي'),
  ] }) },
  { g: 'دولاب أطفال زاوية L (150 + 200، أبواب 50)', n: 'الخليجي', d: 'دشاديش حول الركن، وعلّاقة نزّالة للمناسبات، وعمود للغتر والقحافي.', make: () => BASE({ secs: [
    sec(0, 0, [it('shoe', 18, 'نعال'), it('socks', 12), it('drawer', 14, 'قحافي'), it('drawer', 14, 'فانيلات'), fill('shelves', 'غتر وأشمغة', 4)], 'موسمي'),
    sec(1, 1, [...drawers(2, 18), it('gap', 12), fill('lift', 'دشاديش المناسبات')], 'بشوت'),
    sec(2, 3, [it('shoeshelf', 24, 'أحذية وصنادل'), it('long', 118, 'دشاديش يومية'), fill('rail', 'جاكيتات الشتاء')], 'حقائب سفر'),
    sec(4, 4, [it('shoe', 20, 'جوتي المدرسة'), ...drawers(3), fill('shelves', 'بيجامات', 3)], 'موسمي'),
    sec(5, 5, [it('drawer', 20), it('rail', 66, 'ملابس يومية'), fill('rail', 'زي المدرسة')], 'أغطية'),
    sec(6, 6, [it('hamper', 50), it('hooks', 42, 'عقال وحزام'), fill('shelves', '', 3)], 'موسمي'),
  ] }) },
  { g: 'هياكل فارغة', n: 'زاوية L فارغة', d: '150 بثلاثة أبواب + 200 بأربعة أبواب (كل باب 50)، كل باب خانة.', make: () => BASE({ secs: null }) },
  { g: 'هياكل فارغة', n: 'مستقيم 200 — 4 أبواب', d: 'دولاب واحد بعرض 200 سم، أبواب 50.', make: () => BASE({ name: 'دولاب', corner: false, parts: [{ name: 'الدولاب', w: 200, n: 4 }], secs: null }) },
  { g: 'هياكل فارغة', n: 'مستقيم 150 — 3 أبواب', d: 'دولاب واحد بعرض 150 سم، أبواب 50.', make: () => BASE({ name: 'دولاب', corner: false, parts: [{ name: 'الدولاب', w: 150, n: 3 }], secs: null }) },
  { g: 'هياكل فارغة', n: 'مستقيم 250 — 5 أبواب بلا سندرة', d: 'أبواب 50 كاملة الارتفاع 230 سم.', make: () => BASE({ name: 'دولاب', loft: 0, corner: false, parts: [{ name: 'الدولاب', w: 250, n: 5 }], secs: null }) },
];

// ───── الحالة ─────
let S, sel = 0, view = 'in', zoom = 1, clip = null;
const undo = [];
const $ = (q) => document.querySelector(q);
const cv = $('#cv');
const stage = $('#stage');

function singles(st) {
  const n = st.parts.reduce((a, p) => a + p.n, 0);
  return Array.from({ length: n }, (_, i) => sec(i, i, [], ''));
}
function normalize(st) {
  st.v = VER;
  if (!Array.isArray(st.secs) || !st.secs.length) st.secs = singles(st);
  st.secs.sort((x, y) => x.a - y.a);
  return st;
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} }
function snap() { undo.push(JSON.stringify(S)); if (undo.length > 60) undo.shift(); $('#btnUndo').disabled = false; }
function doUndo() {
  if (!undo.length) return;
  S = JSON.parse(undo.pop()); sel = Math.min(sel, S.secs.length - 1);
  $('#btnUndo').disabled = !undo.length; refresh(true); toast('تراجعتُ خطوة');
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }

// ───── الهندسة ─────
function geo(st) {
  st = st || S;
  const gap = st.corner && st.parts.length > 1 ? GAPC : 0;
  const totalW = st.parts.reduce((a, p) => a + p.w, 0) + gap * (st.parts.length - 1);
  const doors = [], parts = [];
  let xr = totalW;
  st.parts.forEach((p, pi) => {
    const dw = p.w / p.n;
    parts.push({ x0: xr - p.w, x1: xr, pi, first: doors.length, last: doors.length + p.n - 1 });
    for (let j = 0; j < p.n; j++) doors.push({ pi, j, x0: xr - (j + 1) * dw, x1: xr - j * dw, w: dw });
    xr -= p.w + gap;
  });
  const z0 = st.plinth + PT;
  const zt = st.H - (st.loft > 0 ? st.loft : 0);
  const z1 = zt - PT;
  return { gap, totalW, doors, parts, z0, z1, zt, inner: z1 - z0 };
}
function span(s, g) { const d0 = g.doors[s.b], d1 = g.doors[s.a]; return { x0: d0.x0, x1: d1.x1, cross: d0.pi !== d1.pi }; }
function doorsW(s, g) { let w = 0; for (let i = s.a; i <= s.b; i++) w += g.doors[i].w; return w; }
function crossings(s, g) { return g.doors[s.b].pi - g.doors[s.a].pi; }
function netW(s, g) { return doorsW(s, g) - PT; }
function railLen(s, g) { const c = crossings(s, g); return c ? doorsW(s, g) + c * S.depth : netW(s, g); }
function layout(s, g) {
  let fixed = 0, fi = -1;
  s.items.forEach((x, i) => { if (x.f && fi < 0) fi = i; else fixed += x.h; });
  const rem = g.inner - fixed;
  let z = g.z0; const rows = [];
  s.items.forEach((x, i) => {
    const h = i === fi ? Math.max(TYPES[x.t].min, rem) : x.h;
    rows.push({ x, i, za: z, zb: z + h, h }); z += h;
  });
  return { rows, used: z - g.z0, free: g.z1 - z, over: Math.max(0, z - g.z1) };
}
function doorLabel(s) { return s.a === s.b ? `الباب ${s.a + 1}` : `الأبواب ${s.a + 1}–${s.b + 1}`; }
const r1 = (v) => (Math.round(v * 10) / 10).toString();

function stats(st) {
  st = st || S;
  const g = geo(st);
  let rail = 0, pulls = 0, dr = 0, shoes = 0, socks = 0, shelves = 0, over = 0;
  for (const s of st.secs) {
    const w = netW(s, g), dw = doorsW(s, g);
    const L = layout(s, g); if (L.over > 0.5) over++;
    for (const { x } of L.rows) {
      const t = x.t;
      if (TYPES[t].hang) rail += railLen(s, g);
      else if (t === 'pull') { pulls++; rail += Math.min(60, st.depth - 20); }
      else if (t === 'drawer') dr++;
      else if (t === 'shoe') shoes += Math.floor(w / 15) * 3;
      else if (t === 'shoeshelf') shoes += Math.floor((crossings(s, g) ? dw + st.depth : w) / 15) * (x.h >= 30 ? 2 : 1);
      else if (t === 'socks') socks += Math.floor(w / 9) * 6;
      else if (t === 'shelves') shelves += (x.k || 1);
    }
  }
  return { rail: rail / 100, pulls, dr, shoes, socks, shelves, over, secs: st.secs.length };
}

// ───── الرسم ─────
function setFont(ctx, px, w) { ctx.font = `${w || 400} ${px}px ${FONT}`; }
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function box(ctx, x, y, w, h, fillC, stroke, lw, r) {
  rr(ctx, x, y, w, h, r || 0);
  if (fillC && fillC !== 'transparent') { ctx.fillStyle = fillC; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function ln(ctx, x1, y1, x2, y2, c, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = c; ctx.lineWidth = w || 1;
  ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}
// نصّ يتقلّص ليتّسع، وينكسر سطرين إن لزم
function label(ctx, txt, cx, cy, maxW, maxH, base, weight, color, halo) {
  if (!txt || maxW < 10 || maxH < 7) return;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  try { ctx.direction = 'rtl'; } catch (e) {}
  const words = String(txt).split(' ');
  for (let px = base; px >= 7; px -= 0.5) {
    setFont(ctx, px, weight);
    let lines = null;
    if (ctx.measureText(txt).width <= maxW && px * 1.15 <= maxH) lines = [txt];
    else if (words.length > 1 && px * 2.3 <= maxH) {
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
        const m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
        if (m <= maxW && (!best || m < best.m)) best = { m, l: [a, b] };
      }
      if (best) lines = best.l;
    }
    if (lines) {
      const lh = px * 1.12;
      lines.forEach((l, i) => {
        const y = cy + (i - (lines.length - 1) / 2) * lh;
        if (halo) { ctx.lineWidth = Math.max(2, px * 0.28); ctx.strokeStyle = halo; ctx.lineJoin = 'round'; ctx.strokeText(l, cx, y); }
        ctx.fillStyle = color || INK; ctx.fillText(l, cx, y);
      });
      return;
    }
  }
}

function drawHangers(ctx, X0, X1, Yr, Yb, long, s) {
  const step = Math.max(9, 6.5 * s);
  const n = Math.max(1, Math.floor((X1 - X0 - 4) / step));
  const g = (X1 - X0) / (n + 1);
  const hw = Math.min(g * 0.42, 2.2 * s + 2);
  ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.6, s * 0.18);
  for (let i = 1; i <= n; i++) {
    const cx = X0 + g * i, top = Yr + Math.max(2, s * 1.4);
    ctx.beginPath(); ctx.moveTo(cx - hw, top); ctx.lineTo(cx, Yr + 0.5); ctx.lineTo(cx + hw, top); ctx.closePath(); ctx.stroke();
    const bw = hw * (long ? 1.18 : 1.05), sh = top + (Yb - top) * 0.25;
    ctx.beginPath();
    if (long) { ctx.moveTo(cx - hw * 0.9, top); ctx.lineTo(cx - bw, Yb); ctx.lineTo(cx + bw, Yb); ctx.lineTo(cx + hw * 0.9, top); }
    else { ctx.moveTo(cx - hw, top); ctx.lineTo(cx - hw * 1.3, sh); ctx.lineTo(cx - hw * 0.85, sh + 2); ctx.lineTo(cx - hw * 0.85, Yb); ctx.lineTo(cx + hw * 0.85, Yb); ctx.lineTo(cx + hw * 0.85, sh + 2); ctx.lineTo(cx + hw * 1.3, sh); ctx.lineTo(cx + hw, top); }
    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawItem(ctx, row, x0, x1, X, Y, s, opt) {
  const { x } = row, T = TYPES[x.t];
  const X0 = X(x0 + PT / 2), X1 = X(x1 - PT / 2), W = X1 - X0;
  const Yt = Y(row.zb), Yb = Y(row.za), Hh = Yb - Yt;
  const ins = Math.max(1, 0.5 * s);
  const fs = opt.fs;
  const name = x.l || T.n;
  const panel = (z) => box(ctx, X0, Y(z), W, Math.max(1.5, PT * s), WOOD, 'rgba(23,52,58,.55)', 0.6);
  switch (x.t) {
    case 'rail': case 'long': case 'lift': {
      box(ctx, X0, Yt, W, Hh, T.c);
      panel(row.zb);
      const Yr = Yt + PT * s + Math.max(2, s * 1.5);
      if (x.t === 'lift') {
        ln(ctx, X0 + 3, Yr, X1 - 3, Yr, INK, Math.max(1.5, s * 0.6));
        ln(ctx, X0 + 3, Yr, X0 + 3 + 4 * s, Yr + 9 * s, INK, Math.max(1, s * 0.35));
        ln(ctx, X1 - 3, Yr, X1 - 3 - 4 * s, Yr + 9 * s, INK, Math.max(1, s * 0.35));
        drawHangers(ctx, X0 + 5 * s, X1 - 5 * s, Yr + 9 * s, Yb - ins * 2, true, s);
        const ax = X1 - 9 * s;
        ln(ctx, ax, Yr + 12 * s, ax, Yr + 26 * s, ACC, Math.max(1.4, s * 0.5));
        ctx.beginPath(); ctx.moveTo(ax - 3 * s, Yr + 23 * s); ctx.lineTo(ax, Yr + 28 * s); ctx.lineTo(ax + 3 * s, Yr + 23 * s); ctx.fillStyle = ACC; ctx.fill();
      } else {
        ln(ctx, X0 + 3, Yr, X1 - 3, Yr, INK, Math.max(1.5, s * 0.6));
        drawHangers(ctx, X0 + 3, X1 - 3, Yr, Yb - ins * 2, x.t === 'long', s);
      }
      label(ctx, name, (X0 + X1) / 2, (Yr + Yb) / 2, W - 6, Hh * 0.6, fs, 700, INK, T.c);
      break;
    }
    case 'pull': {
      box(ctx, X0, Yt, W, Hh, T.c);
      panel(row.zb);
      const cx = (X0 + X1) / 2, Yr = Yt + PT * s + 3;
      ln(ctx, cx - Math.min(W * 0.3, 10 * s), Yr + 4, cx + Math.min(W * 0.3, 10 * s), Yr + 4, INK, Math.max(1.3, s * 0.5));
      ln(ctx, cx, Yr, cx, Yr + 4, INK, Math.max(1.3, s * 0.5));
      drawHangers(ctx, cx - 6 * s, cx + 6 * s, Yr + 5, Yb - ins * 2, false, s);
      label(ctx, name, cx, (Yr + Yb) / 2 + 4, W - 6, Hh * 0.5, fs, 700, INK, T.c);
      break;
    }
    case 'drawer': case 'socks': case 'shoe': {
      box(ctx, X0 + ins, Yt + ins * 0.6, W - ins * 2, Hh - ins * 1.2, T.c, INK, Math.max(0.8, s * 0.22), Math.max(1.5, s * 0.4));
      if (x.t === 'socks') {
        ctx.save(); ctx.globalAlpha = 0.3; const n = Math.floor(W / Math.max(5, 3.2 * s));
        for (let i = 1; i < n; i++) ln(ctx, X0 + W * i / n, Yt + ins * 2, X0 + W * i / n, Yb - ins * 2, INK, 0.6); ctx.restore();
      }
      if (x.t === 'shoe') {
        ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = INK;
        for (let px = X0 + 3 * s; px < X1 - 2 * s; px += Math.max(5, 2.8 * s)) { ctx.beginPath(); ctx.arc(px, Yb - ins - Math.max(2, s), Math.max(0.6, s * 0.25), 0, 7); ctx.fill(); }
        ctx.restore();
      }
      const hw = Math.min(W * 0.22, 6 * s + 4);
      box(ctx, (X0 + X1) / 2 - hw, Yt + ins + Math.max(2, s), hw * 2, Math.max(1.6, s * 0.6), INK, null, 0, 2);
      label(ctx, name + (opt.heights ? ` ${r1(row.h)}` : ''), (X0 + X1) / 2, (Yt + Yb) / 2 + Math.max(1, s * 0.6), W - 8, Hh - Math.max(4, s * 2.5), fs, 700, INK, null);
      break;
    }
    case 'shoeshelf': {
      box(ctx, X0, Yt, W, Hh, T.c);
      const tiers = row.h >= 30 ? [row.za, row.za + row.h / 2] : [row.za];
      tiers.forEach((z, k) => {
        if (k) box(ctx, X0, Y(z) - s * 0.6, W, Math.max(1.2, s * 1.2), WOOD_L, 'rgba(23,52,58,.45)', 0.5);
        for (let px = X0 + 3 * s; px < X1 - 7 * s; px += 7 * s) {
          const yb = Y(z) - s * 0.9;
          ctx.beginPath(); ctx.moveTo(px, yb); ctx.lineTo(px, yb - 3 * s); ctx.quadraticCurveTo(px + s, yb - 3.6 * s, px + 2 * s, yb - 3 * s);
          ctx.lineTo(px + 3 * s, yb - 1.4 * s); ctx.quadraticCurveTo(px + 5.6 * s, yb - 1 * s, px + 5.6 * s, yb); ctx.closePath();
          ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.6, s * 0.15); ctx.stroke();
        }
      });
      label(ctx, name, (X0 + X1) / 2, Yt + Math.min(Hh * 0.3, 10 * s), W - 6, Hh * 0.45, fs, 700, INK, T.c);
      break;
    }
    case 'shelves': {
      box(ctx, X0, Yt, W, Hh, T.c);
      const k = Math.max(1, x.k || 1), step = row.h / k;
      for (let i = 1; i <= k; i++) panel(row.za + step * i);
      if (s > 0.55) {
        ctx.save(); ctx.globalAlpha = 0.6;
        for (let i = 0; i < k; i++) {
          const zb = row.za + step * i + PT / 2;
          if (step < 14) continue;
          const stacks = Math.max(1, Math.floor((x1 - x0 - 6) / 24));
          for (let si = 0; si < stacks; si++) {
            const xc = x0 + PT + 3 + (si + 0.5) * (x1 - x0 - PT * 2 - 6) / stacks;
            for (let j = 0; j < 3; j++) box(ctx, X(xc - 6), Y(zb + 1 + j * 2.6 + 2.3), 12 * s, 2.3 * s, '#fff', INK, 0.5, 1);
          }
        }
        ctx.restore();
      }
      const lz = k > 1 ? row.za + step * (k - 1) + step * 0.62 : (row.za + row.zb) / 2;
      label(ctx, name === T.n ? `${T.n} (${k})` : name, (X0 + X1) / 2, Y(lz), W - 6, Math.min(step * s * 0.55, 40), fs, 700, INK, T.c);
      break;
    }
    case 'bin': case 'toys': case 'hamper': {
      const p = Math.max(1.5, s);
      box(ctx, X0 + p, Yt + p, W - p * 2, Hh - p * 2, T.c, INK, Math.max(0.8, s * 0.22), Math.max(3, s * 1.4));
      if (x.t === 'hamper') {
        ctx.save(); rr(ctx, X0 + p, Yt + p, W - p * 2, Hh - p * 2, Math.max(3, s * 1.4)); ctx.clip(); ctx.globalAlpha = 0.25;
        for (let d = -Hh; d < W; d += Math.max(5, 2.6 * s)) ln(ctx, X0 + d, Yb, X0 + d + Hh, Yt, INK, 0.7);
        ctx.restore();
      } else box(ctx, (X0 + X1) / 2 - 3.2 * s, Yt + p + 1.6 * s, 6.4 * s, 1.6 * s, '#FFFDF8', INK, 0.7, 2);
      label(ctx, name, (X0 + X1) / 2, (Yt + Yb) / 2 + s, W - 8, Hh - 6 * s, fs, 700, INK, T.c);
      break;
    }
    case 'hooks': {
      box(ctx, X0, Yt, W, Hh, T.c);
      const n = Math.max(1, Math.min(4, Math.floor(W / (8 * s))));
      for (let i = 1; i <= n; i++) {
        const hx = X0 + W * i / (n + 1), hy = Yt + 3 * s;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy + 3 * s); ctx.quadraticCurveTo(hx, hy + 5 * s, hx + 2 * s, hy + 4 * s);
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, s * 0.5); ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      }
      label(ctx, name, (X0 + X1) / 2, (Yt + Yb) / 2 + 3 * s, W - 6, Hh * 0.6, fs, 700, INK, T.c);
      break;
    }
    case 'gap': {
      ctx.save(); ctx.setLineDash([3, 3]); box(ctx, X0 + 2, Yt + 1, W - 4, Hh - 2, null, 'rgba(23,52,58,.25)', 0.8); ctx.restore();
      if (opt.heights) label(ctx, `${name} ${r1(row.h)}`, (X0 + X1) / 2, (Yt + Yb) / 2, W - 6, Hh - 2, fs * 0.85, 400, INK2);
      break;
    }
  }
}

function hatch(ctx, x, y, w, h, c, step) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.strokeStyle = c; ctx.lineWidth = 0.8;
  for (let d = -h; d < w; d += step) { ctx.beginPath(); ctx.moveTo(x + d, y + h); ctx.lineTo(x + d + h, y); ctx.stroke(); }
  ctx.restore();
}

/* يرسم الدولاب كاملاً. o: {ox, oy (موضع x=0 وz=H بالبكسل), s (بكسل/سم), view, sel, numbers, dims, scale, fs, heights} */
function drawWardrobe(ctx, o, st) {
  st = st || S;
  const prev = S; S = st;
  const g = geo(st), H = st.H, s = o.s;
  const X = (x) => o.ox + x * s, Y = (z) => o.oy + (H - z) * s;
  const sc = SCHEMES[st.scheme || 0];
  const fs = o.fs || Math.max(9, Math.min(15, s * 3.6));
  // الأرض
  ln(ctx, X(-4), Y(0), X(g.totalW + 4), Y(0), INK, Math.max(1, s * 0.4));
  // فراغ الركن
  if (g.gap) for (let i = 0; i < g.parts.length - 1; i++) {
    const gx0 = X(g.parts[i + 1].x1), gx1 = X(g.parts[i].x0);
    hatch(ctx, gx0, Y(H), gx1 - gx0, H * s, 'rgba(232,117,63,.35)', Math.max(4, s * 2));
    ln(ctx, gx0, Y(H) - 6, gx0, Y(0), ACC, 0.8, [4, 3]); ln(ctx, gx1, Y(H) - 6, gx1, Y(0), ACC, 0.8, [4, 3]);
  }
  for (const p of g.parts) {
    const PX0 = X(p.x0), PW = (p.x1 - p.x0) * s;
    box(ctx, PX0, Y(H), PW, H * s, '#FFFFFF');
    box(ctx, PX0 + 1, Y(st.plinth), PW - 2, st.plinth * s, '#D7C4A2', 'rgba(23,52,58,.5)', 0.6);
    if (st.loft > 0) box(ctx, PX0, Y(H), PW, st.loft * s, '#F3EDE2');
  }
  // أي طرف جزء مفتوح على الركن؟
  const openR = {}, openL = {};
  for (const sct of st.secs) {
    const d0 = g.doors[sct.a], d1 = g.doors[sct.b];
    for (let pi = d0.pi; pi < d1.pi; pi++) { openL[pi] = 1; openR[pi + 1] = 1; }
  }
  if (o.view !== 'doors') {
    st.secs.forEach((sct, si) => {
      const sp = span(sct, g), L = layout(sct, g);
      for (const row of L.rows) {
        if (row.za >= g.z1) break;
        const cl = Math.min(row.zb, g.z1);
        ctx.save(); ctx.beginPath(); ctx.rect(X(sp.x0), Y(cl), (sp.x1 - sp.x0) * s, (cl - row.za) * s); ctx.clip();
        drawItem(ctx, row, sp.x0, sp.x1, X, Y, s, { fs, heights: o.heights });
        ctx.restore();
      }
      if (L.over > 0.5) {
        hatch(ctx, X(sp.x0), Y(g.z1), (sp.x1 - sp.x0) * s, Math.max(6, 6 * s), 'rgba(200,50,20,.7)', 4);
        label(ctx, `زيادة ${r1(L.over)} سم`, X((sp.x0 + sp.x1) / 2), Y(g.z1) + Math.max(10, 9 * s), (sp.x1 - sp.x0) * s - 4, 16, fs * 0.9, 700, '#B2401C', '#fff');
      }
      // الركن فوق المحتوى
      if (sp.cross && g.gap) for (let pi = g.doors[sct.a].pi; pi < g.doors[sct.b].pi; pi++) {
        const gx0 = X(g.parts[pi + 1].x1), gx1 = X(g.parts[pi].x0);
        ctx.save(); ctx.globalAlpha = 0.55; box(ctx, gx0, Y(g.z1), gx1 - gx0, g.inner * s, '#FFF7EF'); ctx.restore();
        hatch(ctx, gx0, Y(g.z1), gx1 - gx0, g.inner * s, 'rgba(232,117,63,.45)', Math.max(4, s * 2));
      }
      // السندرة
      if (st.loft > 0) {
        const lz0 = g.zt + PT, lz1 = H - PT, n = Math.max(1, Math.round((sp.x1 - sp.x0) / 36));
        const bx0 = X(sp.x0 + PT / 2 + 1.5), bw = ((sp.x1 - sp.x0) - PT - 3) * s / n;
        for (let i = 0; i < n; i++) box(ctx, bx0 + i * bw + 1, Y(lz1 - 4), bw - 2, Math.max(4, (lz1 - lz0 - 6) * s), 'rgba(255,255,255,.75)', 'rgba(23,52,58,.45)', 0.7, Math.max(2, s));
        if (sct.loft) label(ctx, sct.loft, X((sp.x0 + sp.x1) / 2), Y((lz0 + lz1) / 2), (sp.x1 - sp.x0) * s - 8, (lz1 - lz0) * s * 0.6, fs * 0.9, 400, INK2, '#F3EDE2');
      }
    });
    // الألواح
    for (const p of g.parts) {
      const PX0 = X(p.x0), PW = (p.x1 - p.x0) * s, t = Math.max(1.5, PT * s);
      const hz = [st.plinth + PT / 2, H - PT / 2]; if (st.loft > 0) hz.push(g.zt);
      for (const z of hz) box(ctx, PX0, Y(z + PT / 2), PW, t, WOOD, 'rgba(23,52,58,.6)', 0.6);
      if (!openR[p.pi]) box(ctx, X(p.x1) - t, Y(H), t, (H - st.plinth) * s, WOOD, 'rgba(23,52,58,.6)', 0.6);
      else ln(ctx, X(p.x1), Y(g.zt), X(p.x1), Y(st.plinth), INK, 1, [4, 3]);
      if (!openL[p.pi]) box(ctx, PX0, Y(H), t, (H - st.plinth) * s, WOOD, 'rgba(23,52,58,.6)', 0.6);
      else ln(ctx, PX0, Y(g.zt), PX0, Y(st.plinth), INK, 1, [4, 3]);
    }
    for (let i = 0; i < st.secs.length - 1; i++) {
      const a = st.secs[i], b = st.secs[i + 1];
      if (g.doors[a.b].pi !== g.doors[b.a].pi) continue;
      const x = g.doors[a.b].x0, t = Math.max(1.5, PT * s);
      box(ctx, X(x) - t / 2, Y(H), t, (H - st.plinth) * s, WOOD, 'rgba(23,52,58,.6)', 0.6);
    }
  } else {
    // الأبواب مغلقة
    const hz = Math.min(100, (g.zt - st.plinth) * 0.45 + st.plinth);
    st.secs.forEach((sct) => {
      const n = sct.b - sct.a + 1;
      for (let i = sct.a; i <= sct.b; i++) {
        const d = g.doors[i], m = i - sct.a, part = g.parts[d.pi];
        const X0 = X(d.x0) + 1, X1 = X(d.x1) - 1;
        const col = i % 2 ? sc.c2 : sc.c1;
        box(ctx, X0, Y(g.zt) + 1, X1 - X0, (g.zt - st.plinth) * s - 2, col, INK, Math.max(0.8, s * 0.3), 1.5);
        if (st.loft > 0) box(ctx, X0, Y(H) + 1, X1 - X0, st.loft * s - 2, sc.lf, INK, Math.max(0.8, s * 0.3), 1.5);
        let side; // 'L' مقبض على يسار الباب، 'R' يمينه
        if (n === 1) side = i === part.first ? 'L' : (i === part.last ? 'R' : 'L');
        else if (n % 2 && m === (n - 1) / 2) side = 'L';
        else side = m < n / 2 ? 'L' : 'R';
        const hx = side === 'L' ? X0 + Math.max(4, 2.2 * s) : X1 - Math.max(4, 2.2 * s);
        const hc = sc.h === 'rainbow' ? RAINBOW[i % RAINBOW.length] : sc.h, Yh = Y(hz);
        if (sc.hs === 'bar') box(ctx, hx - Math.max(1, s * 0.5), Yh - 6 * s, Math.max(2, s), 12 * s, hc, null, 0, 2);
        else if (sc.hs === 'knob') { ctx.beginPath(); ctx.arc(hx, Yh, Math.max(2.5, 1.4 * s), 0, 7); ctx.fillStyle = hc; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke(); }
        else if (sc.hs === 'loop') { ctx.beginPath(); const dir = side === 'L' ? 1 : -1; ctx.moveTo(hx, Yh - 4 * s); ctx.quadraticCurveTo(hx + dir * 4 * s, Yh, hx, Yh + 4 * s); ctx.strokeStyle = hc; ctx.lineWidth = Math.max(1.5, s * 0.8); ctx.stroke(); }
        else if (sc.hs === 'cloud') {
          const r = Math.max(1.4, s * 0.9); ctx.beginPath();
          ctx.arc(hx - r, Yh, r, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(hx, Yh - r * 0.6, r * 1.15, Math.PI, 0); ctx.arc(hx + r, Yh, r, Math.PI * 1.5, Math.PI * 0.5); ctx.closePath();
          ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
        }
        if (st.loft > 0) box(ctx, (X0 + X1) / 2 - 4 * s, Y(g.zt) - Math.max(5, 4 * s), 8 * s, Math.max(1.5, s * 0.7), INK, null, 0, 2);
      }
    });
  }
  // التحديد
  if (o.sel != null && st.secs[o.sel]) {
    const sp = span(st.secs[o.sel], g);
    ctx.save(); ctx.strokeStyle = ACC; ctx.lineWidth = 3; ctx.setLineDash([]);
    rr(ctx, X(sp.x0) + 1.5, Y(H) + 1.5, (sp.x1 - sp.x0) * s - 3, (H - st.plinth) * s - 3, 4); ctx.stroke(); ctx.restore();
  }
  // أرقام الأبواب
  if (o.numbers) {
    const r = Math.max(7, Math.min(o.fs ? fs * 0.6 : 11, s * 3.4));
    g.doors.forEach((d, i) => {
      const cx = X((d.x0 + d.x1) / 2), cy = Y(H) - r - 5;
      const inSel = o.sel != null && st.secs[o.sel] && i >= st.secs[o.sel].a && i <= st.secs[o.sel].b;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = inSel ? ACC : INK; ctx.fill();
      setFont(ctx, r * 1.15, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), cx, cy + 0.5);
    });
  }
  // المقاسات أسفل الرسم
  if (o.dims) {
    const fy = Y(0) + Math.max(12, fs * 1.1);
    st.secs.forEach((sct) => {
      const sp = span(sct, g), w = (sp.x1 - sp.x0) * s;
      ln(ctx, X(sp.x0) + 2, fy - 7, X(sp.x1) - 2, fy - 7, INK2, 0.8);
      ln(ctx, X(sp.x0) + 2, fy - 10, X(sp.x0) + 2, fy - 4, INK2, 0.8); ln(ctx, X(sp.x1) - 2, fy - 10, X(sp.x1) - 2, fy - 4, INK2, 0.8);
      const t = sp.cross ? `L ≈${Math.round(railLen(sct, g))}` : `${r1(netW(sct, g))}`;
      label(ctx, t, X((sp.x0 + sp.x1) / 2), fy + fs * 0.45, w - 4, fs * 1.1, Math.max(9, fs * 0.8), 400, INK2);
    });
    g.parts.forEach((p) => {
      const P = st.parts[p.pi];
      label(ctx, `${P.name} · ${P.w} سم · ${P.n} أبواب`, X((p.x0 + p.x1) / 2), fy + Math.max(20, fs * 1.9), (p.x1 - p.x0) * s, Math.max(18, fs * 1.2), Math.max(10, fs * 0.95), 700, INK);
    });
  }
  // مقياس الارتفاع
  if (o.scale) {
    const xs = X(-5);
    ln(ctx, xs, Y(0), xs, Y(H), INK2, 0.8);
    setFont(ctx, Math.max(8.5, Math.min(o.fs ? fs * 0.75 : 11, s * 3)), 400); ctx.fillStyle = INK2; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let z = 0; z <= H; z += 10) ln(ctx, xs - (z % 50 ? 3 : 6), Y(z), xs, Y(z), INK2, 0.8);
    const marks = [0, 50, 100, 150, 200, 250, H]; if (st.loft > 0) marks.push(g.zt);
    [...new Set(marks)].filter((z) => z <= H).forEach((z) => ctx.fillText(String(Math.round(z)), xs - 8, Y(z)));
  }
  S = prev;
}

// ───── الشاشة ─────
const M = { l: 40, r: 12, t: 34, b: 54 };
let curS = 1;
function stageMax() { return window.innerWidth >= 900 ? window.innerHeight - 190 : Math.min(window.innerHeight * 0.42, 420); }
function fitScale() {
  const g = geo();
  const sw = stage.clientWidth - 4, sh = stageMax() - 4;
  return Math.max(0.4, Math.min((sw - M.l - M.r) / g.totalW, (sh - M.t - M.b) / S.H));
}
function draw() {
  const g = geo();
  curS = fitScale() * zoom;
  const s = curS;
  const w = Math.ceil(M.l + g.totalW * s + M.r), h = Math.ceil(M.t + S.H * s + M.b);
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  stage.style.height = (zoom === 1 ? Math.min(h + 4, stageMax()) : stageMax()) + 'px';
  document.documentElement.style.setProperty('--stick', (document.querySelector('.top').offsetHeight + document.querySelector('.stickybox').offsetHeight) + 'px');
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#FFFDF8'; ctx.fillRect(0, 0, w, h);
  drawWardrobe(ctx, { ox: M.l, oy: M.t, s, view, sel, numbers: true, dims: true, scale: true });
}
function hitTest(ev) {
  const r = cv.getBoundingClientRect();
  const px = ev.clientX - r.left, py = ev.clientY - r.top;
  const x = (px - M.l) / curS, z = S.H - (py - M.t) / curS;
  if (z < -5 || z > S.H + 30) return -1;
  const g = geo();
  for (let i = 0; i < S.secs.length; i++) { const sp = span(S.secs[i], g); if (x >= sp.x0 && x <= sp.x1) return i; }
  return -1;
}

function renderStats() {
  const t = stats();
  const it2 = (v, l) => `<span class="stat"><b>${v}</b>${l}</span>`;
  $('#stats').innerHTML = it2(r1(t.rail), 'م تعليق') + it2(t.dr, 'أدراج') + it2(t.shoes, 'زوج جوتي') + it2(t.socks, 'زوج جواريب')
    + it2(t.secs, 'خانات') + (t.over ? `<span class="stat" style="border-color:#E2876A"><b style="color:#B2401C">${t.over}</b>خانة زائدة الارتفاع</span>` : '');
  const g = geo();
  $('#dimsLabel').textContent = `${S.name} · ${S.parts.map((p) => p.w).join(' + ')} × ${S.H} × ${S.depth} سم`;
  document.title = `${S.name} — مخطط الدولاب`;
  void g;
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function renderPanel() {
  const P = $('#panel');
  const g = geo(), sc = S.secs[sel];
  if (!sc) { P.innerHTML = '<p class="empty">اختر خانة من الرسم</p>'; return; }
  const L = layout(sc, g), sp = span(sc, g);
  const w = netW(sc, g);
  const capTxt = L.over > 0.5 ? `زيادة ${r1(L.over)} سم` : `المتبقي ${r1(L.free)} سم`;
  const prevSec = S.secs[sel - 1], nextSec = S.secs[sel + 1];
  const canR = prevSec && (g.doors[prevSec.b].pi === g.doors[sc.a].pi || S.corner);
  const canL = nextSec && (g.doors[sc.b].pi === g.doors[nextSec.a].pi || S.corner);
  const warn = [];
  if (sc.items.some((x) => TYPES[x.t].hang) && w < 45 && !sp.cross) warn.push('الخانة أضيق من علّاقة الطفل (45 سم): ادمجها مع جارتها أو استعمل «علّاقة سحب».');
  const topD = L.rows.filter((r) => ['drawer', 'socks', 'shoe'].includes(r.x.t)).reduce((m, r) => Math.max(m, r.zb), 0);
  if (topD > 110) warn.push(`أعلى درج على ${Math.round(topD)} سم: الأفضل للطفل ألا يتجاوز 100–110.`);
  if (sp.cross) warn.push('خانة ركن: الأدراج لا تمرّ عبر الركن، فاجعل فيها تعليقاً طويلاً أو رفوفاً.');
  const items = L.rows.slice().reverse().map((r) => {
    const x = r.x, T = TYPES[x.t], i = r.i;
    const isOver = r.zb > g.z1 + 0.5;
    return `<li class="it${isOver ? ' over' : ''}" data-i="${i}">
      <i class="sw" style="background:${T.c === 'transparent' ? 'repeating-linear-gradient(45deg,#fff 0 4px,#eee 4px 8px)' : T.c}"></i>
      <div class="nm"><input data-a="label" value="${esc(x.l)}" placeholder="${esc(T.n)}" aria-label="اسم العنصر"><small>${Math.round(r.za)}–${Math.round(r.zb)}</small></div>
      <button class="del" data-a="del" aria-label="حذف">✕</button>
      <div class="ctl">
        ${x.f ? `<span>يملأ المتبقي (${r1(r.h)} سم)</span>` : `<span>الارتفاع</span><span class="step"><button data-a="h-">−</button><input data-a="h" type="number" inputmode="numeric" value="${r1(x.h)}"><button data-a="h+">+</button></span>`}
        ${x.t === 'shelves' ? `<span>رفوف</span><span class="step"><button data-a="k-">−</button><input data-a="k" type="number" inputmode="numeric" value="${x.k || 1}"><button data-a="k+">+</button></span>` : ''}
        <label class="chk"><input type="checkbox" data-a="fill" ${x.f ? 'checked' : ''}>تلقائي</label>
        <span class="mv"><button data-a="up" aria-label="أعلى">▲</button><button data-a="down" aria-label="أسفل">▼</button></span>
      </div></li>`;
  }).join('');
  P.innerHTML = `
    <div class="ph"><div><b>${doorLabel(sc)}${sp.cross ? ' · ركن' : ''}</b>
      <span class="meta">عرض ${r1(doorsW(sc, g))} سم (صافي ≈${sp.cross ? Math.round(railLen(sc, g)) + ' على شكل L' : r1(w)}) · الارتفاع الداخلي ${r1(g.inner)}</span></div>
      <span class="cap${L.over > 0.5 ? ' bad' : ''}">${capTxt}</span></div>
    <div class="acts">
      <button data-a="mergeR" ${canR ? '' : 'disabled'}>دمج مع اليمين ▶</button>
      <button data-a="split" ${sc.a === sc.b ? 'disabled' : ''}>فصل</button>
      <button data-a="mergeL" ${canL ? '' : 'disabled'}>◀ دمج مع اليسار</button>
    </div>
    ${warn.map((m) => `<div class="warn">${m}</div>`).join('')}
    <h4>تعبئة سريعة</h4>
    <div class="quick">${QUICK.map((q, i) => `<button data-q="${i}">${q.n}</button>`).join('')}</div>
    <h4>المحتوى <small>من الأعلى إلى الأسفل</small></h4>
    ${items ? `<ul class="items">${items}</ul>` : '<p class="empty">الخانة فارغة — أضف عناصر من الأسفل أو اختر تعبئة سريعة</p>'}
    <h4>أضف عنصراً</h4>
    <div class="palette">${PALETTE.map((t) => `<button data-add="${t}"><i style="background:${TYPES[t].c === 'transparent' ? '#fff' : TYPES[t].c}"></i>${TYPES[t].n}</button>`).join('')}</div>
    <div class="row3">
      <button data-a="copy">نسخ الخانة</button>
      <button data-a="paste" ${clip ? '' : 'disabled'}>لصق</button>
      <button data-a="clear" ${sc.items.length ? '' : 'disabled'}>تفريغ</button>
    </div>
    ${S.loft > 0 ? `<label class="fld"><span>ملاحظة السندرة فوق هذه الخانة</span><input data-a="loft" value="${esc(sc.loft || '')}" placeholder="مثلاً: موسمي، حقائب سفر"></label>` : ''}`;
}

function refresh(panel) { draw(); renderStats(); if (panel !== false) renderPanel(); save(); }

// ───── أفعال الخانة ─────
function merge(dir) {
  const sc = S.secs[sel], j = dir === 'R' ? sel - 1 : sel + 1, nb = S.secs[j];
  if (!nb) return;
  const g = geo();
  const a = Math.min(sc.a, nb.a), b = Math.max(sc.b, nb.b);
  if (g.doors[a].pi !== g.doors[b].pi && !S.corner) { toast('لا يمكن دمج جزأين منفصلين'); return; }
  snap();
  const items = sc.items.length ? sc.items : nb.items;
  if (sc.items.length && nb.items.length) toast('اعتُمد محتوى الخانة المحدّدة');
  const m = { a, b, items, loft: sc.loft || nb.loft || '' };
  S.secs.splice(Math.min(sel, j), 2, m);
  sel = Math.min(sel, j);
  refresh();
}
function split() {
  const sc = S.secs[sel];
  if (sc.a === sc.b) return;
  snap();
  const parts = [];
  for (let i = sc.a; i <= sc.b; i++) parts.push(sec(i, i, i === sc.a ? sc.items : [], sc.loft));
  S.secs.splice(sel, 1, ...parts);
  toast('فُصلت الأبواب؛ المحتوى بقي في الأولى');
  refresh();
}
function addItem(t) {
  snap();
  const sc = S.secs[sel], x = it(t);
  if (t === 'shelves') x.k = 2;
  const fi = sc.items.findIndex((y) => y.f);
  if (fi >= 0) sc.items.splice(fi, 0, x); else sc.items.push(x);
  const L = layout(sc, geo());
  if (L.over > 0.5) toast(`لا يتّسع: الخانة زائدة ${r1(L.over)} سم — قلّل الارتفاعات`);
  refresh();
}

$('#panel').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const sc = S.secs[sel]; if (!sc) return;
  if (b.dataset.q != null) { snap(); sc.items = QUICK[+b.dataset.q].items(); refresh(); return; }
  if (b.dataset.add) { addItem(b.dataset.add); return; }
  const a = b.dataset.a; if (!a) return;
  const li = b.closest('.it'), i = li ? +li.dataset.i : -1, x = li ? sc.items[i] : null;
  switch (a) {
    case 'mergeR': return merge('R');
    case 'mergeL': return merge('L');
    case 'split': return split();
    case 'copy': clip = JSON.stringify(sc.items); toast('نُسخ محتوى الخانة'); renderPanel(); return;
    case 'paste': if (!clip) return; snap(); sc.items = JSON.parse(clip); refresh(); toast('لُصق المحتوى'); return;
    case 'clear': snap(); sc.items = []; refresh(); return;
    case 'del': snap(); sc.items.splice(i, 1); refresh(); return;
    case 'up': if (i < sc.items.length - 1) { snap(); [sc.items[i], sc.items[i + 1]] = [sc.items[i + 1], sc.items[i]]; refresh(); } return;
    case 'down': if (i > 0) { snap(); [sc.items[i], sc.items[i - 1]] = [sc.items[i - 1], sc.items[i]]; refresh(); } return;
    case 'h-': case 'h+': snap(); x.f = 0; x.h = Math.max(TYPES[x.t].min, Math.round((x.h + (a === 'h+' ? 1 : -1) * (x.h >= 40 ? 5 : 1)))); refresh(); return;
    case 'k-': case 'k+': snap(); x.k = Math.max(1, Math.min(12, (x.k || 1) + (a === 'k+' ? 1 : -1))); refresh(); return;
  }
});
$('#panel').addEventListener('change', (e) => {
  const el = e.target, a = el.dataset.a, sc = S.secs[sel]; if (!a || !sc) return;
  const li = el.closest('.it'), x = li ? sc.items[+li.dataset.i] : null;
  if (a === 'h') { snap(); const v = parseFloat(el.value); if (v > 0) { x.h = Math.max(TYPES[x.t].min, v); x.f = 0; } refresh(); }
  else if (a === 'k') { snap(); x.k = Math.max(1, Math.min(12, parseInt(el.value, 10) || 1)); refresh(); }
  else if (a === 'fill') {
    snap();
    if (el.checked) { sc.items.forEach((y) => { y.f = 0; }); x.f = 1; }
    else { const L = layout(sc, geo()); x.h = Math.round(L.rows.find((r) => r.x === x).h); x.f = 0; }
    refresh();
  }
  else if (a === 'label' || a === 'loft') { save(); }
});
$('#panel').addEventListener('input', (e) => {
  const el = e.target, a = el.dataset.a, sc = S.secs[sel]; if (!sc) return;
  if (a === 'label') { sc.items[+el.closest('.it').dataset.i].l = el.value.slice(0, 30); draw(); }
  else if (a === 'loft') { sc.loft = el.value.slice(0, 30); draw(); }
});

cv.addEventListener('click', (e) => {
  const i = hitTest(e);
  if (i >= 0 && i !== sel) { sel = i; draw(); renderPanel(); if (window.innerWidth < 900) $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

$('#viewSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  view = b.dataset.v; [...$('#viewSeg').children].forEach((x) => x.classList.toggle('on', x === b)); draw();
});
$('#zIn').onclick = () => { zoom = Math.min(4, zoom * 1.35); draw(); };
$('#zOut').onclick = () => { zoom = Math.max(1, zoom / 1.35); draw(); };
$('#zFit').onclick = () => { zoom = 1; draw(); };
$('#btnUndo').onclick = doUndo;
window.addEventListener('resize', () => { clearTimeout(draw._t); draw._t = setTimeout(draw, 120); });

// ───── الأوراق ─────
function openSheet(id) { const s = $(id); s.classList.add('open'); s.setAttribute('aria-hidden', 'false'); }
function closeSheet(el) { const s = el.closest ? el.closest('.sheet') : el; s.classList.remove('open'); s.setAttribute('aria-hidden', 'true'); }
document.querySelectorAll('.sheet').forEach((s) => s.addEventListener('click', (e) => {
  if (e.target === s || e.target.closest('[data-close]')) closeSheet(s);
}));

// الأبعاد
let draft = null;
function renderSetup() {
  $('#fName').value = draft.name; $('#fH').value = draft.H; $('#fD').value = draft.depth; $('#fPl').value = draft.plinth; $('#fLoft').value = draft.loft;
  $('#fCorner').checked = !!draft.corner;
  $('#partsList').innerHTML = draft.parts.map((p, i) => `
    <div class="part" data-i="${i}">
      <div class="pn"><input data-k="name" value="${esc(p.name)}" aria-label="اسم الجزء">${draft.parts.length > 1 ? '<button data-k="rm">حذف</button>' : ''}</div>
      <label class="fld"><span>الطول</span><input data-k="w" type="number" inputmode="numeric" value="${p.w}"></label>
      <label class="fld"><span>عدد الأبواب</span><input data-k="n" type="number" inputmode="numeric" value="${p.n}"></label>
      <div class="dw">عرض الباب ≈ ${r1(p.w / p.n)} سم</div>
    </div>`).join('');
  $('#schemes').innerHTML = SCHEMES.map((c, i) => `<button data-sc="${i}" class="${i === draft.scheme ? 'on' : ''}"><span class="sw2"><i style="background:${c.c1}"></i><i style="background:${c.c2}"></i><i style="background:${c.lf}"></i></span>${c.n}</button>`).join('');
}
$('#btnSetup').onclick = () => { draft = JSON.parse(JSON.stringify(S)); renderSetup(); openSheet('#sheetSetup'); };
$('#partsList').addEventListener('input', (e) => {
  const el = e.target, i = +el.closest('.part').dataset.i, k = el.dataset.k; if (!k) return;
  if (k === 'name') draft.parts[i].name = el.value.slice(0, 24);
  else { draft.parts[i][k] = parseFloat(el.value) || 0; el.closest('.part').querySelector('.dw').textContent = `عرض الباب ≈ ${r1(draft.parts[i].w / Math.max(1, draft.parts[i].n))} سم`; }
});
$('#partsList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k="rm"]'); if (!b) return;
  draft.parts.splice(+b.closest('.part').dataset.i, 1); renderSetup();
});
$('#addPart').onclick = () => { draft.parts.push({ name: `الجزء ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][draft.parts.length] || draft.parts.length + 1}`, w: 100, n: 2 }); renderSetup(); };
$('#schemes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; draft.scheme = +b.dataset.sc; renderSetup(); });
$('#applySetup').onclick = () => {
  const num = (id, lo, hi, def) => { const v = parseFloat($(id).value); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def; };
  draft.name = ($('#fName').value || 'دولاب').slice(0, 40);
  draft.H = num('#fH', 120, 330, 280); draft.depth = num('#fD', 30, 120, 60); draft.plinth = num('#fPl', 0, 25, 10); draft.loft = num('#fLoft', 0, 120, 0);
  draft.corner = $('#fCorner').checked;
  for (const p of draft.parts) {
    p.w = Math.max(30, Math.min(600, p.w || 100)); p.n = Math.max(1, Math.min(12, Math.round(p.n || 1)));
    if (p.w / p.n < 20) { toast(`أبواب «${p.name}» أضيق من 20 سم`); return; }
  }
  if (draft.H - draft.plinth - draft.loft < 60) { toast('الجسم أقصر من 60 سم — راجع القاعدة والسندرة'); return; }
  const same = draft.parts.length === S.parts.length && draft.parts.every((p, i) => p.n === S.parts[i].n);
  if (!same) {
    if (!confirm('تغيّر عدد الأبواب، وسيُعاد تقسيم الخانات من جديد (فارغة). متابعة؟')) return;
    draft.secs = singles(draft);
  }
  snap(); S = normalize(draft); sel = Math.min(sel, S.secs.length - 1); zoom = 1;
  closeSheet($('#sheetSetup')); refresh(); toast('طُبّقت الأبعاد');
};

// القوالب
function renderPresets() {
  let html = '', grp = '';
  PRESETS.forEach((p, i) => {
    if (p.g !== grp) { grp = p.g; html += `<p class="psec">${grp}</p>`; }
    html += `<button class="preset" data-p="${i}"><canvas data-pv="${i}" width="220" height="180"></canvas><div><b>${p.n}</b><span>${p.d}</span></div></button>`;
  });
  $('#presetList').innerHTML = html;
  document.querySelectorAll('[data-pv]').forEach((c) => {
    const st = normalize(PRESETS[+c.dataset.pv].make()), g = geo(st);
    const ctx = c.getContext('2d'), s = Math.min(200 / g.totalW, 165 / st.H);
    ctx.fillStyle = '#FFFDF8'; ctx.fillRect(0, 0, 220, 180);
    drawWardrobe(ctx, { ox: (220 - g.totalW * s) / 2, oy: 8, s, view: 'in', fs: 7 }, st);
  });
}
$('#btnPresets').onclick = () => { renderPresets(); openSheet('#sheetPresets'); };
$('#presetList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  if (!confirm('سيحلّ القالب محل التصميم الحالي (يمكنك التراجع بعدها). متابعة؟')) return;
  snap(); S = normalize(PRESETS[+b.dataset.p].make()); sel = 0; zoom = 1;
  closeSheet($('#sheetPresets')); refresh(); toast(`طُبّق قالب «${PRESETS[+b.dataset.p].n}»`);
});

// ───── التصدير ─────
let expBlobs = {};
function sectionRows(st) {
  const g = geo(st);
  return st.secs.map((sc) => {
    const L = layout(sc, g);
    const names = [];
    let run = 0;
    const flush = () => { if (run) names.push(run === 1 ? 'درج' : run === 2 ? 'درجان' : `${run} أدراج`); run = 0; };
    L.rows.forEach(({ x, h }) => {
      if (x.t === 'drawer' && !x.l) { run++; return; }
      flush();
      if (x.t === 'gap') return;
      const T = TYPES[x.t];
      names.push((x.l || T.n) + (x.t === 'shelves' ? ` (${x.k || 1})` : '') + (T.hang ? ` ${Math.round(h)}` : ''));
    });
    flush();
    return { d: doorLabel(sc).replace('الأبواب ', '').replace('الباب ', ''), w: span(sc, g).cross ? `L ≈${Math.round(railLen(sc, g))}` : r1(netW(sc, g)), c: names.join(' · ') || '—', over: L.over > 0.5 };
  });
}
function legendItems() { return ['rail', 'drawer', 'socks', 'shoe', 'shelves', 'toys', 'hamper', 'bin']; }

function drawHeader(ctx, W, title, sub, pad) {
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, pad * 2.6);
  try { ctx.direction = 'rtl'; } catch (e) {}
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  setFont(ctx, pad * 0.95, 700); ctx.fillStyle = '#fff'; ctx.fillText(title, W - pad, pad * 1.0);
  setFont(ctx, pad * 0.5, 400); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(sub, W - pad, pad * 1.9);
  ctx.textAlign = 'left'; setFont(ctx, pad * 0.45, 400); ctx.fillText(new Date().toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' }), pad, pad * 1.3);
}
function drawStatsRow(ctx, x, y, w, pad) {
  const t = stats();
  const cells = [[r1(t.rail) + ' م', 'تعليق'], [t.dr, 'أدراج'], [t.shoes, 'زوج جوتي'], [t.socks, 'زوج جواريب'], [t.shelves, 'رفوف']];
  const cw = w / cells.length;
  cells.forEach(([v, l], i) => {
    const cx = x + w - cw * (i + 0.5);
    box(ctx, cx - cw / 2 + 6, y, cw - 12, pad * 1.9, '#fff', '#E3DCCF', 2, 14);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    setFont(ctx, pad * 0.78, 700); ctx.fillStyle = ACC; ctx.fillText(String(v), cx, y + pad * 0.7);
    setFont(ctx, pad * 0.46, 400); ctx.fillStyle = INK2; ctx.fillText(l, cx, y + pad * 1.42);
  });
}
function drawLegend(ctx, x, y, w, pad) {
  const ks = legendItems(); const cw = w / 4;
  ks.forEach((k, i) => {
    const r = Math.floor(i / 4), c = i % 4;
    const cx = x + w - cw * c - 8, cy = y + r * pad * 0.9;
    box(ctx, cx - pad * 0.6, cy - pad * 0.25, pad * 0.6, pad * 0.5, TYPES[k].c, INK, 1.2, 4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; setFont(ctx, pad * 0.48, 400); ctx.fillStyle = INK;
    ctx.fillText(TYPES[k].n, cx - pad * 0.8, cy);
  });
}
function drawTable(ctx, x, y, w, rows, pad, maxH) {
  const c1 = pad * 2.2, c2 = pad * 2.6;
  setFont(ctx, pad * 0.5, 700);
  ctx.fillStyle = INK; ctx.fillRect(x, y, w, pad * 1.1);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('الباب', x + w - c1 / 2, y + pad * 0.55); ctx.fillText('العرض', x + w - c1 - c2 / 2, y + pad * 0.55);
  ctx.textAlign = 'right'; ctx.fillText('المحتوى (من الأسفل للأعلى)', x + w - c1 - c2 - pad * 0.4, y + pad * 0.55);
  let yy = y + pad * 1.1;
  const cw = w - c1 - c2 - pad * 0.8;
  for (const r of rows) {
    setFont(ctx, pad * 0.48, 400);
    const words = r.c.split(' '); const lines = []; let cur = '';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > cw && cur) { lines.push(cur); cur = wd; } else cur = t; }
    if (cur) lines.push(cur);
    const rh = Math.max(pad * 1.05, lines.length * pad * 0.7 + pad * 0.4);
    if (maxH && yy + rh > y + maxH) break;
    box(ctx, x, yy, w, rh, r.over ? '#FFF1EC' : '#fff', '#D8D0C2', 1.5);
    ctx.textAlign = 'center'; setFont(ctx, pad * 0.52, 700); ctx.fillStyle = INK;
    ctx.fillText(r.d, x + w - c1 / 2, yy + rh / 2);
    setFont(ctx, pad * 0.48, 400); ctx.fillText(r.w, x + w - c1 - c2 / 2, yy + rh / 2);
    ctx.textAlign = 'right';
    lines.forEach((l, i) => ctx.fillText(l, x + w - c1 - c2 - pad * 0.4, yy + pad * 0.55 + i * pad * 0.7 + (rh - lines.length * pad * 0.7 - pad * 0.4) / 2));
    yy += rh;
  }
  return yy;
}

// صورة طولية للجوال: الداخل + الأبواب + الأرقام + الجدول
function renderPNG() {
  const W = 1500, pad = 44, g = geo();
  const s = (W - pad * 2 - 70) / g.totalW;
  const dH = S.H * s + 150;
  const rows = sectionRows(S);
  const c = document.createElement('canvas');
  const tmp = c.getContext('2d'); setFont(tmp, pad * 0.48, 400);
  const tblH = pad * 1.1 + rows.reduce((a, r) => a + Math.max(pad * 1.05, Math.ceil(tmp.measureText(r.c).width / (W - pad * 2 - pad * 5.6)) * pad * 0.7 + pad * 0.5), 0);
  const Ht = pad * 2.6 + 30 + dH + 40 + dH * 0.62 + 60 + pad * 2 + 30 + pad * 2 + tblH + pad * 2;
  c.width = W; c.height = Math.ceil(Ht);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFDF8'; ctx.fillRect(0, 0, W, c.height);
  drawHeader(ctx, W, S.name, `${S.parts.map((p) => `${p.name} ${p.w} سم (${p.n} أبواب)`).join(' + ')} · ارتفاع ${S.H} · عمق ${S.depth}`, pad);
  let y = pad * 2.6 + 30;
  sectionTitle(ctx, 'التقسيم الداخلي', W - pad, y, pad); y += 26;
  drawWardrobe(ctx, { ox: pad + 60, oy: y + 30, s, view: 'in', numbers: true, dims: true, scale: true, fs: 19, heights: true });
  y += dH + 40;
  sectionTitle(ctx, 'الواجهة والأبواب', W - pad, y, pad); y += 20;
  const s2 = s * 0.6, w2 = g.totalW * s2;
  drawWardrobe(ctx, { ox: (W - w2) / 2, oy: y + 30, s: s2, view: 'doors', numbers: true, dims: false, fs: 14 });
  y += dH * 0.62 + 60;
  drawStatsRow(ctx, pad, y, W - pad * 2, pad); y += pad * 2 + 30;
  drawLegend(ctx, pad, y, W - pad * 2, pad); y += pad * 2;
  y = drawTable(ctx, pad, y, W - pad * 2, rows, pad) + 70;
  setFont(ctx, 18, 400); ctx.fillStyle = INK2; ctx.textAlign = 'center'; ctx.fillText('مخطط الدولاب · haydarvsky.github.io/family/dolab · الأبعاد بالسنتيمتر', W / 2, y - 28);
  const out = document.createElement('canvas'); out.width = W; out.height = Math.min(c.height, Math.ceil(y));
  out.getContext('2d').drawImage(c, 0, 0);
  return out;
}
function sectionTitle(ctx, t, x, y, pad) {
  try { ctx.direction = 'rtl'; } catch (e) {}
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; setFont(ctx, pad * 0.62, 700); ctx.fillStyle = INK; ctx.fillText(t, x, y);
  const w = ctx.measureText(t).width; box(ctx, x - w, y + pad * 0.42, Math.min(80, w), 4, ACC, null, 0, 2);
}

// صفحات A4 أفقية (150 نقطة/بوصة)
function renderPDFPages() {
  const W = 1754, Hp = 1240, pad = 46, g = geo();
  const pages = [];
  // ١: الداخل
  {
    const c = document.createElement('canvas'); c.width = W; c.height = Hp; const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFDF8'; ctx.fillRect(0, 0, W, Hp);
    drawHeader(ctx, W, S.name + ' — التقسيم الداخلي', `${S.parts.map((p) => `${p.name} ${p.w} سم (${p.n} أبواب)`).join(' + ')} · ارتفاع ${S.H} · عمق ${S.depth} · الأبعاد بالسنتيمتر`, pad);
    const side = 440, top = pad * 2.6 + 40, avW = W - side - pad * 3 - 70, avH = Hp - top - 150;
    const s = Math.min(avW / g.totalW, avH / S.H);
    drawWardrobe(ctx, { ox: pad + 70 + (avW - g.totalW * s) / 2, oy: top + 30, s, view: 'in', numbers: true, dims: true, scale: true, fs: 18, heights: true });
    const sx = W - pad - side;
    let y = top;
    sectionTitle(ctx, 'الأرقام', W - pad, y, pad); y += 40;
    const t = stats();
    [[r1(t.rail) + ' م', 'طول التعليق'], [t.dr, 'أدراج ملابس'], [t.shoes, 'زوج جوتي (تقريباً)'], [t.socks, 'زوج جواريب'], [t.shelves, 'رفوف'], [t.secs, 'خانات']].forEach(([v, l]) => {
      box(ctx, sx, y, side, 62, '#fff', '#E3DCCF', 2, 12);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; setFont(ctx, 24, 400); ctx.fillStyle = INK; ctx.fillText(l, W - pad - 20, y + 31);
      ctx.textAlign = 'left'; setFont(ctx, 32, 700); ctx.fillStyle = ACC; ctx.fillText(String(v), sx + 20, y + 33);
      y += 74;
    });
    y += 20; sectionTitle(ctx, 'المفتاح', W - pad, y, pad); y += 46;
    legendItems().forEach((k, i) => {
      const cy = y + i * 40;
      box(ctx, W - pad - 34, cy - 12, 34, 24, TYPES[k].c, INK, 1.5, 5);
      ctx.textAlign = 'right'; setFont(ctx, 23, 400); ctx.fillStyle = INK; ctx.fillText(TYPES[k].n, W - pad - 48, cy);
    });
    pages.push(c);
  }
  // ٢: الأبواب + الجدول
  {
    const c = document.createElement('canvas'); c.width = W; c.height = Hp; const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFDF8'; ctx.fillRect(0, 0, W, Hp);
    drawHeader(ctx, W, S.name + ' — الواجهة وجدول الخانات', `اللون: ${SCHEMES[S.scheme || 0].n} · ${S.secs.length} خانات · ${g.doors.length} أبواب`, pad);
    const top = pad * 2.6 + 40, half = (W - pad * 3) / 2;
    const s = Math.min((half - 40) / g.totalW, (Hp - top - 140) / S.H);
    sectionTitle(ctx, 'الواجهة', pad + half, top, pad);
    drawWardrobe(ctx, { ox: pad + (half - g.totalW * s) / 2, oy: top + 70, s, view: 'doors', numbers: true, dims: true, fs: 16 });
    sectionTitle(ctx, 'محتوى كل خانة', W - pad, top, pad);
    drawTable(ctx, W - pad - half, top + 40, half, sectionRows(S), 44, Hp - top - 120);
    setFont(ctx, 18, 400); ctx.fillStyle = INK2; ctx.textAlign = 'center'; ctx.fillText('مخطط الدولاب · haydarvsky.github.io/family/dolab', W / 2, Hp - 26);
    pages.push(c);
  }
  return pages;
}

function b64ToBytes(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
// PDF بصفحات صور JPEG — بلا مكتبات
function buildPDF(canvases) {
  const enc = new TextEncoder();
  const chunks = []; let len = 0; const offs = [];
  const push = (d) => { const u = typeof d === 'string' ? enc.encode(d) : d; chunks.push(u); len += u.length; };
  const PW = 841.89, PH = 595.28;
  const n = canvases.length;
  const objId = (k) => k; // 1 كتالوج، 2 صفحات، ثم ثلاثة لكل صفحة
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const kids = canvases.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  offs[1] = len; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offs[2] = len; push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${n} >>\nendobj\n`);
  canvases.forEach((cv2, i) => {
    const p = 3 + i * 3, ct = p + 1, im = p + 2;
    const jpg = b64ToBytes(cv2.toDataURL('image/jpeg', 0.92).split(',')[1]);
    const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
    offs[p] = len; push(`${p} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>\nendobj\n`);
    offs[ct] = len; push(`${ct} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
    offs[im] = len; push(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${cv2.width} /Height ${cv2.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
    push(jpg); push('\nendstream\nendobj\n');
  });
  const total = 3 + n * 3;
  const xref = len;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let k = 1; k < total; k++) x += String(offs[objId(k)]).padStart(10, '0') + ' 00000 n \n';
  push(x); push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: 'application/pdf' });
}

function fileBase() { return (S.name || 'دولاب').replace(/[\\/:*?"<>|]/g, '').trim() || 'دولاب'; }
async function prepareExport() {
  $('#expPng').disabled = true; $('#expPdf').disabled = true; expBlobs = {};
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 30));
  const png = renderPNG();
  $('#expPrev').src = png.toDataURL('image/jpeg', 0.7);
  png.toBlob((b) => { expBlobs.png = b; $('#expPng').disabled = false; }, 'image/png');
  setTimeout(() => { expBlobs.pdf = buildPDF(renderPDFPages()); $('#expPdf').disabled = false; }, 40);
}
function deliver(blob, name) {
  if (!blob) return;
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch((e) => { if (e && e.name !== 'AbortError') download(blob, name); });
  } else download(blob, name);
}
function download(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
  toast('بدأ التنزيل');
}
$('#btnExport').onclick = () => { openSheet('#sheetExport'); prepareExport(); };
$('#expPng').onclick = () => deliver(expBlobs.png, fileBase() + '.png');
$('#expPdf').onclick = () => deliver(expBlobs.pdf, fileBase() + '.pdf');

// رابط المشاركة
function encodeState() {
  const json = JSON.stringify(S);
  const b = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return location.origin + location.pathname + '#d=' + b;
}
function decodeState(h) {
  const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(h); if (!m) return null;
  let b = m[1].replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
  return JSON.parse(decodeURIComponent(escape(atob(b))));
}
$('#expLink').onclick = async () => {
  const url = encodeState();
  try { await navigator.clipboard.writeText(url); toast('نُسخ الرابط — أرسله لمن تشاء'); }
  catch (e) { if (navigator.share) navigator.share({ url, title: S.name }).catch(() => {}); else prompt('انسخ الرابط:', url); }
};
$('#btnReset').onclick = () => {
  if (!confirm('بدء تصميم فارغ بالأبعاد نفسها؟ (يمكنك التراجع)')) return;
  snap(); S.secs = singles(S); sel = 0; closeSheet($('#sheetExport')); refresh(); toast('الخانات فارغة الآن');
};

// ───── البدء ─────
function load() {
  try {
    const fromHash = decodeState(location.hash);
    if (fromHash && fromHash.parts) { history.replaceState(null, '', location.pathname); toast('فُتح التصميم من الرابط'); return normalize(fromHash); }
  } catch (e) { console.warn(e); }
  try { const j = JSON.parse(localStorage.getItem(LS_KEY)); if (j && j.parts && j.secs) return normalize(j); } catch (e) {}
  return normalize(PRESETS[0].make());
}
S = load();
sel = Math.min(1, S.secs.length - 1);
$('#btnUndo').disabled = true;
refresh();
const ff = [new FontFace('Sakkal', "url('fonts/sakkal-400.woff2')", { weight: '400' }), new FontFace('Sakkal', "url('fonts/sakkal-700.woff2')", { weight: '700' })];
Promise.all(ff.map((f) => f.load().then((x) => document.fonts.add(x)).catch(() => {}))).then(() => draw());
