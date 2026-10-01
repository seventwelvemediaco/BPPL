// 2D engineering drawing sheets (A3 landscape, first-angle projection) composed from orthographic outline views
// rendered by the 3D viewer. Sheet 1: general arrangement. Sheet 2: section A–A and parts list.

const SW = 2480, SH = 1754;                      // A3 at 150 dpi
const F = { x0: 118, y0: 59, x1: 2421, y1: 1695 }; // drawing frame (20 mm binding margin on the left, 10 mm elsewhere)
const RC = 1380;                                  // left edge of the right-hand column (title block width 1041 px ≈ 176 mm)
const TB = { y0: 1395 };                          // title block top
const FONT = 'Arial, Helvetica, sans-serif';

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
const addv = (a, b, k = 1) => a.map((v, i) => v + b[i] * k);

function text(ctx, s, x, y, size = 21, { bold = false, align = 'left', base = 'alphabetic', color = '#000', rot = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(s, 0, 0); ctx.restore();
}
function line(ctx, x1, y1, x2, y2, w = 2, dash = []) {
  ctx.save(); ctx.lineWidth = w; ctx.setLineDash(dash); ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
const chain = (ctx, x1, y1, x2, y2) => line(ctx, x1, y1, x2, y2, 1.4, [36, 7, 5, 7]);
function arrow(ctx, x, y, ang, len = 18, half = 4.5) {   // filled arrowhead with its tip at (x, y), pointing along ang
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-len, -half); ctx.lineTo(-len, half); ctx.closePath(); ctx.fill(); ctx.restore();
}
// linear dimension between two points with extension lines; side offset is applied perpendicular to the measured line
function dimension(ctx, ax, ay, bx, by, off, label) {
  const horiz = Math.abs(by - ay) < Math.abs(bx - ax);
  const ox = horiz ? 0 : off, oy = horiz ? off : 0, g = 6 * Math.sign(off || 1);
  line(ctx, ax + (horiz ? 0 : g), ay + (horiz ? g : 0), ax + ox + (horiz ? 0 : 8 * Math.sign(off)), ay + oy + (horiz ? 8 * Math.sign(off) : 0), 1.2);
  line(ctx, bx + (horiz ? 0 : g), by + (horiz ? g : 0), bx + ox + (horiz ? 0 : 8 * Math.sign(off)), by + oy + (horiz ? 8 * Math.sign(off) : 0), 1.2);
  const x1 = ax + ox, y1 = ay + oy, x2 = bx + ox, y2 = by + oy;
  line(ctx, x1, y1, x2, y2, 1.4);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  arrow(ctx, x2, y2, ang); arrow(ctx, x1, y1, ang + Math.PI);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  if (horiz) text(ctx, label, mx, my - 9, 22, { align: 'center' });
  else text(ctx, label, mx - 9, my, 22, { align: 'center', rot: -Math.PI / 2 });
}
function table(ctx, x, y, widths, rows, rowH = 30, size = 18, headRows = 1) {
  const W = widths.reduce((a, b) => a + b, 0);
  rows.forEach((r, i) => {
    const yy = y + i * rowH;
    if (i < headRows) { ctx.fillStyle = '#efefef'; ctx.fillRect(x, yy, W, rowH); }
    line(ctx, x, yy, x + W, yy, i === 0 ? 2.4 : 1);
    let xx = x;
    r.forEach((cell, j) => {
      const s = String(cell ?? '');
      ctx.save(); ctx.beginPath(); ctx.rect(xx + 4, yy, widths[j] - 8, rowH); ctx.clip();
      text(ctx, s, xx + 8, yy + rowH / 2 + 1, size, { base: 'middle', bold: i < headRows });
      ctx.restore();
      xx += widths[j];
    });
  });
  const y1 = y + rows.length * rowH;
  line(ctx, x, y1, x + W, y1, 2.4);
  let xx = x; [0, ...widths].forEach((w, j) => { xx += w; line(ctx, xx - (j === 0 ? 0 : 0), y, xx, y1, j === 0 || j === widths.length ? 2.4 : 1); });
  line(ctx, x, y, x, y1, 2.4);
  return y1;
}
// first-angle projection symbol (ISO 5456-2): end view circles on the left, truncated cone on the right
function firstAngle(ctx, x, y, s = 1) {
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.arc(x, y, 22 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 11 * s, 0, Math.PI * 2); ctx.stroke();
  const tx = x + 44 * s;
  ctx.beginPath(); ctx.moveTo(tx, y - 22 * s); ctx.lineTo(tx + 62 * s, y - 11 * s); ctx.lineTo(tx + 62 * s, y + 11 * s); ctx.lineTo(tx, y + 22 * s); ctx.closePath(); ctx.stroke();
  ctx.restore();
  chain(ctx, x - 32 * s, y, tx + 72 * s, y); chain(ctx, x, y - 32 * s, x, y + 32 * s);
}

function frame(ctx, sheetNo, sheets, info) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SW, SH);
  line(ctx, 30, 30, SW - 30, 30, 1); line(ctx, SW - 30, 30, SW - 30, SH - 30, 1); line(ctx, SW - 30, SH - 30, 30, SH - 30, 1); line(ctx, 30, SH - 30, 30, 30, 1);
  ctx.save(); ctx.lineWidth = 4.2; ctx.strokeRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); ctx.restore();
  // reference zones: numbers across, letters down
  const cols = 8, rows = 6, zw = (F.x1 - F.x0) / cols, zh = (F.y1 - F.y0) / rows;
  for (let i = 0; i < cols; i++) {
    const cx = F.x0 + (i + 0.5) * zw;
    text(ctx, String(i + 1), cx, F.y0 - 16, 20, { align: 'center' }); text(ctx, String(i + 1), cx, F.y1 + 32, 20, { align: 'center' });
    if (i) { line(ctx, F.x0 + i * zw, F.y0, F.x0 + i * zw, F.y0 - 22, 1.5); line(ctx, F.x0 + i * zw, F.y1, F.x0 + i * zw, F.y1 + 22, 1.5); }
  }
  for (let j = 0; j < rows; j++) {
    const cy = F.y0 + (j + 0.5) * zh, L = 'ABCDEF'[j];
    text(ctx, L, F.x0 - 30, cy + 7, 20, { align: 'center' }); text(ctx, L, F.x1 + 30, cy + 7, 20, { align: 'center' });
    if (j) { line(ctx, F.x0, F.y0 + j * zh, F.x0 - 22, F.y0 + j * zh, 1.5); line(ctx, F.x1, F.y0 + j * zh, F.x1 + 22, F.y0 + j * zh, 1.5); }
  }
  // centring marks
  [[SW / 2, 30, SW / 2, F.y0], [SW / 2, F.y1, SW / 2, SH - 30], [30, SH / 2, F.x0, SH / 2], [F.x1, SH / 2, SW - 30, SH / 2]].forEach(m => line(ctx, ...m, 3));

  // title block
  const x = RC, y = TB.y0, w = F.x1 - RC, h = F.y1 - TB.y0;
  ctx.save(); ctx.lineWidth = 3.4; ctx.strokeRect(x, y, w, h); ctx.restore();
  const r1 = y + 92, r2 = r1 + 66, r3 = r2 + 66;
  line(ctx, x, r1, x + w, r1, 2); line(ctx, x, r2, x + w, r2, 1.4); line(ctx, x, r3, x + w, r3, 1.4);
  text(ctx, 'BHAGYODAY PUMPS PVT. LTD.', x + 18, y + 40, 32, { bold: true });
  text(ctx, 'Plot 400, Jai Bharat Ind. Compound, Naroda–Kathwada Road, Naroda, Ahmedabad 382 330, India', x + 18, y + 72, 17);
  text(ctx, 'TITLE', x + 14, r1 + 18, 14, { color: '#444' });
  text(ctx, info.title, x + 14, r1 + 50, 25, { bold: true });
  const cells = [['MODEL', info.model], ['DRG. NO.', info.drgNo + (sheets > 1 ? `-${sheetNo}` : '')], ['REV.', '0']];
  const cw = [w * 0.42, w * 0.42, w * 0.16];
  let cx = x;
  cells.forEach(([k, v], i) => { if (i) line(ctx, cx, r2, cx, r3, 1.4); text(ctx, k, cx + 12, r2 + 18, 14, { color: '#444' }); text(ctx, v, cx + 12, r2 + 50, 22, { bold: true }); cx += cw[i]; });
  const f2 = [['SCALE', 'NTS'], ['UNITS', 'mm'], ['SHEET', `${sheetNo} OF ${sheets}`], ['SIZE', 'A3'], ['DATE', info.date], ['DRAWN', 'BPPL 3D (auto)']];
  const fw = (w - 150) / f2.length; cx = x;
  f2.forEach(([k, v], i) => { if (i) line(ctx, cx, r3, cx, y + h, 1.4); text(ctx, k, cx + 10, r3 + 18, 14, { color: '#444' }); text(ctx, v, cx + 10, r3 + 48, 19, { bold: true }); cx += fw; });
  line(ctx, cx, r3, cx, y + h, 1.4);
  text(ctx, 'PROJECTION', cx + 10, r3 + 18, 14, { color: '#444' });
  firstAngle(ctx, cx + 38, r3 + 48, 0.62);
}

function viewLabel(ctx, v, x, y, title, scale = 'NTS') {
  text(ctx, title, x + v.w / 2, y + v.h + 44, 26, { bold: true, align: 'center' });
  const tw = ctx.measureText ? title.length * 15 : 0;
  line(ctx, x + v.w / 2 - tw / 2 - 8, y + v.h + 52, x + v.w / 2 + tw / 2 + 8, y + v.h + 52, 1.6);
  text(ctx, `SCALE ${scale}`, x + v.w / 2, y + v.h + 78, 18, { align: 'center' });
}
function drawAxes(ctx, v, ox, oy, axes) {
  (axes || []).forEach(([a, b]) => {
    const [x1, y1] = v.toPx(a), [x2, y2] = v.toPx(b);
    if (Math.hypot(x2 - x1, y2 - y1) < 6) { chain(ctx, ox + x1 - 40, oy + y1, ox + x1 + 40, oy + y1); chain(ctx, ox + x1, oy + y1 - 40, ox + x1, oy + y1 + 40); }
    else chain(ctx, ox + x1, oy + y1, ox + x2, oy + y2);
  });
}
const mm = m => `≈ ${Math.round(m * 1000)}`;

export function composeSheets(viewer, info) {
  const d = viewer.drawing;
  const up = [0, 1, 0], look = d.elev.map(v => -v), right = norm(cross(look, up));
  const planUp = cross(right, [0, -1, 0]);
  const defs = { elev: { dir: d.elev, up }, plan: { dir: [0, 1, 0], up: planUp }, end: { dir: right, up } };
  const m = Object.fromEntries(Object.entries(defs).map(([k, v]) => [k, viewer.draftView({ ...v, measure: true })]));

  // ---------------- sheet 1: general arrangement
  const c1 = document.createElement('canvas'); c1.width = SW; c1.height = SH;
  const ctx = c1.getContext('2d');
  frame(ctx, 1, 2, info);
  const availW = RC - F.x0 - 60 - 110 - 110, availH = F.y1 - F.y0 - 110 - 120 - 110 - 20;
  const s = Math.min(availW / (m.end.wM + m.elev.wM), availH / (m.elev.hM + m.plan.hM));
  const V = Object.fromEntries(Object.entries(defs).map(([k, v]) => [k, viewer.draftView({ ...v, pxPerM: s })]));
  const endX = F.x0 + 50, elevX = endX + V.end.w + 110, topY = F.y0 + 110, planY = topY + V.elev.h + 125;
  ctx.drawImage(V.end.canvas, endX, topY);
  ctx.drawImage(V.elev.canvas, elevX, topY);
  ctx.drawImage(V.plan.canvas, elevX, planY);
  drawAxes(ctx, V.elev, elevX, topY, d.axes); drawAxes(ctx, V.plan, elevX, planY, d.axes); drawAxes(ctx, V.end, endX, topY, d.axes);
  viewLabel(ctx, V.elev, elevX, topY, 'ELEVATION');
  viewLabel(ctx, V.plan, elevX, planY, 'PLAN');
  viewLabel(ctx, V.end, endX, topY, 'END VIEW (FROM RIGHT)');
  dimension(ctx, elevX, topY, elevX + V.elev.w, topY, -52, `${mm(V.elev.wM)} REF`);
  dimension(ctx, elevX + V.elev.w, topY, elevX + V.elev.w, topY + V.elev.h, Math.max(40, Math.min(56, RC - 46 - (elevX + V.elev.w))), `${mm(V.elev.hM)} REF`);
  dimension(ctx, elevX, planY, elevX, planY + V.plan.h, -125, `${mm(V.plan.hM)} REF`);   // left of the plan, clear of the A–A arrows
  // section cutting plane A–A shown on the plan
  const n = d.section.n, p0 = n.map(v => v * d.section.c), dirIn = norm(cross(n, up));
  const [ax1, ay1] = V.plan.toPx(addv(p0, dirIn, -3)), [ax2, ay2] = V.plan.toPx(addv(p0, dirIn, 3));
  const clip = (x, y) => [Math.min(Math.max(x, -50), V.plan.w + 50), Math.min(Math.max(y, -50), V.plan.h + 50)];
  const [sx1, sy1] = clip(ax1, ay1), [sx2, sy2] = clip(ax2, ay2);
  chain(ctx, elevX + sx1, planY + sy1, elevX + sx2, planY + sy2);
  const [qx, qy] = V.plan.toPx(addv(p0, n, -0.2)), [rx, ry] = V.plan.toPx(p0), ang = Math.atan2(qy - ry, qx - rx);
  [[sx1, sy1], [sx2, sy2]].forEach(([x, y]) => {
    const X = elevX + x, Y = planY + y, ex = X + Math.cos(ang) * 50, ey = Y + Math.sin(ang) * 50;
    line(ctx, X - (sx2 - sx1) * 0.03, Y - (sy2 - sy1) * 0.03, X, Y, 6);
    line(ctx, X, Y, ex, ey, 2); arrow(ctx, ex, ey, ang, 22, 6);
    text(ctx, 'A', ex + Math.cos(ang) * 26, ey + Math.sin(ang) * 26 + 10, 34, { bold: true, align: 'center' });
  });

  // isometric (reference) in the right column
  const isoDir = norm(addv(addv(d.elev, right, 0.85), up, 0.9));
  const iboxW = F.x1 - RC - 60, iboxH = 560;
  const mi = viewer.draftView({ dir: isoDir, up, measure: true });
  const iso = viewer.draftView({ dir: isoDir, up, pxPerM: Math.min(iboxW / mi.wM, iboxH / mi.hM) * 0.9 });
  const isoX = RC + (F.x1 - RC - iso.w) / 2, isoY = F.y0 + 40;
  ctx.drawImage(iso.canvas, isoX, isoY);
  text(ctx, 'ISOMETRIC VIEW (REFERENCE)', RC + (F.x1 - RC) / 2, isoY + iso.h + 40, 24, { bold: true, align: 'center' });
  // technical data
  const tdY = isoY + iso.h + 70;
  const tw = [ (F.x1 - RC - 40) * 0.46, (F.x1 - RC - 40) * 0.54 ];
  const tEnd = table(ctx, RC + 20, tdY, tw, [['TECHNICAL DATA', 'VALUE'], ...info.techData], 30, 18);
  // notes
  const notes = [
    'NOTES',
    '1. General arrangement generated from the BPPL 3D model. Not for manufacture.',
    '2. Dimensions marked REF are indicative envelope sizes only.',
    '3. Plunger dia., stroke, pressure and flow from BPPL capacity charts.',
    '4. Certified GA drawing with foundation details on request.',
  ];
  let ny = Math.min(tEnd + 34, TB.y0 - notes.length * 26 - 8);
  notes.forEach((t, i) => { text(ctx, t, RC + 20, ny, i ? 17 : 19, { bold: i === 0 }); ny += 26; });

  // ---------------- sheet 2: section A–A and parts list
  const c2 = document.createElement('canvas'); c2.width = SW; c2.height = SH;
  const ct = c2.getContext('2d');
  frame(ct, 2, 2, info);
  const secDef = { dir: d.section.n, up, section: d.section };
  const ms = viewer.draftView({ ...secDef, measure: true });
  const sbW = RC - F.x0 - 160, sbH = F.y1 - F.y0 - 420;
  const sec = viewer.draftView({ ...secDef, pxPerM: Math.min(sbW / ms.wM, sbH / ms.hM) * 0.95 });
  const secX = F.x0 + (RC - F.x0 - sec.w) / 2, secY = F.y0 + 200 + Math.max(0, (sbH - sec.h) / 2 - 60);
  ct.drawImage(sec.canvas, secX, secY);
  drawAxes(ct, sec, secX, secY, [d.axes[0]]);
  viewLabel(ct, sec, secX, secY, 'SECTION  A – A');
  // leader to the plunger with real chart data
  const [lx, ly] = sec.toPx(d.plunger), LX = secX + lx, LY = secY + ly, TX = Math.min(LX + 160, RC - 580), TY = secY - 70;
  ct.save(); ct.fillStyle = '#000'; ct.beginPath(); ct.arc(LX, LY, 5, 0, Math.PI * 2); ct.fill(); ct.restore();
  line(ct, LX, LY, TX, TY, 1.6); line(ct, TX, TY, TX + 520, TY, 1.6);
  text(ct, info.plungerNote, TX + 8, TY - 10, 22, { bold: true });
  dimension(ct, secX, secY + sec.h, secX + sec.w, secY + sec.h, 140, `${mm(sec.wM)} REF`);
  // parts list
  const pw = [70, 110, (F.x1 - RC - 40) - 70 - 110 - 150 - 70, 150, 70];
  const rows = [['ITEM', 'PART NO.', 'DESCRIPTION', 'MATERIAL', 'QTY'], ...info.bom];
  const rowH = Math.min(30, Math.floor((TB.y0 - F.y0 - 90) / rows.length));
  text(ct, 'PARTS LIST', RC + 20, F.y0 + 44, 26, { bold: true });
  table(ct, RC + 20, F.y0 + 64, pw, rows, rowH, Math.min(17, rowH - 9));
  return [c1, c2];
}
