export function guestFromSearch(search) {
  const raw = String(search || "");
  const q = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  return (q.get("to") || "").trim().slice(0, 20);
}

export function remaining(now, then) {
  const ms = then - now;
  if (!Number.isFinite(ms) || ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  }
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    past: false,
  };
}

export function coupleLine(groom, bride) {
  const a = `${groom?.family || ""}${groom?.name || ""}`.trim();
  const b = `${bride?.family || ""}${bride?.name || ""}`.trim();
  return [a, b].filter(Boolean).join(" 与 ");
}

export function mapLinks({ name, address, lat, lng }) {
  const n = encodeURIComponent(name || "婚礼");
  const a = encodeURIComponent(address || "");
  return {
    amap: `https://uri.amap.com/marker?position=${lng},${lat}&name=${n}&src=widd&coordinate=gaode&callnative=1`,
    tencent: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${n};addr:${a}&referer=widd`,
  };
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function escAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

export function clipText(v, n) {
  return String(v ?? "").trim().slice(0, n);
}

export function dataImageOk(s, max = 120000) {
  return (
    typeof s === "string" &&
    s.length >= 80 &&
    s.length <= max &&
    /^data:image\/(jpeg|jpg|png);base64,/i.test(s)
  );
}

export function darkPixelCount(data, threshold = 40) {
  const cut = threshold * 3;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 12) continue;
    if (data[i] + data[i + 1] + data[i + 2] < cut) n += 1;
  }
  return n;
}

export function wallHash(id) {
  let n = 2166136261;
  const s = String(id || "0");
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

export function wallRot(id) {
  return (wallHash(id) % 21) - 10;
}

export function wallMineCount(items, by) {
  const id = String(by || "");
  if (!id) return 0;
  return (Array.isArray(items) ? items : []).filter((row) => String(row?.by || "") === id).length;
}

export function isWallHost(search, key) {
  const k = String(key || "");
  if (!k) return false;
  const raw = String(search || "");
  const q = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  return q.get("host") === k;
}

export function wallHitUrl(getUrl) {
  return String(getUrl || "").replace("/get/", "/hit/");
}

export function wallAfterWipe(items, epoch) {
  const n = Number(epoch) || 0;
  return (Array.isArray(items) ? items : []).filter((row) => (Number(row?.epoch) || 0) >= n);
}

export function wallWithoutMine(items, by, dropUntagged) {
  const id = String(by || "");
  return (Array.isArray(items) ? items : []).filter((row) => {
    const owner = String(row?.by || "");
    if (owner) return owner !== id;
    return !dropUntagged;
  });
}

export function wallExceptHidden(items, hidden) {
  const ids = hidden && hidden.ids;
  const imgs = hidden && hidden.imgs;
  const idSet = ids instanceof Set ? ids : new Set(ids || []);
  const imgSet = imgs instanceof Set ? imgs : new Set(imgs || []);
  if (!idSet.size && !imgSet.size) return Array.isArray(items) ? items.slice() : [];
  return (Array.isArray(items) ? items : []).filter((row) => {
    if (row && row.id && idSet.has(row.id)) return false;
    if (row && row.img && imgSet.has(row.img)) return false;
    return true;
  });
}

export function wallSpreadSlot(i, n) {
  const count = Math.max(1, Number(n) || 1);
  const idx = Math.max(0, Math.min(Number(i) || 0, count - 1));
  const cap = 50;
  if (count === 1) {
    return { left: 25, top: 25, w: cap, h: cap };
  }
  const golden = Math.PI * (3 - Math.sqrt(5));
  const rot = Math.abs(Math.cos(Math.PI / 18)) + Math.abs(Math.sin(Math.PI / 18));
  const pad = 0.28;
  const pts = [];
  for (let k = 0; k < count; k++) {
    const h = wallHash(String(k));
    const spin = ((h % 800) / 800 - 0.5) * 0.16;
    const stretch = 1 + (((((h / 800) | 0) % 800) / 800) - 0.5) * 0.04;
    const th = k * golden + spin;
    const r = Math.sqrt(k) * stretch;
    pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
  }
  let minCheb = Infinity;
  let maxAbs = 0;
  for (let a = 0; a < count; a++) {
    maxAbs = Math.max(maxAbs, Math.abs(pts[a].x), Math.abs(pts[a].y));
    for (let b = a + 1; b < count; b++) {
      const cheb = Math.max(Math.abs(pts[a].x - pts[b].x), Math.abs(pts[a].y - pts[b].y));
      if (cheb < minCheb) minCheb = cheb;
    }
  }
  if (!(minCheb > 0) || !(maxAbs > 0)) {
    return { left: 25, top: 25, w: cap, h: cap };
  }
  const t = maxAbs / minCheb;
  const size = Math.min(cap, Math.max(4, (50 - pad * t) / (rot * t + 0.5)));
  const u = (rot * size + pad) / minCheb;
  const p = pts[idx];
  return {
    left: Math.max(0, Math.min(100 - size, 50 + u * p.x - size / 2)),
    top: Math.max(0, Math.min(100 - size, 50 + u * p.y - size / 2)),
    w: size,
    h: size,
  };
}

export const WALL_PAGE = 15;

export function wallPageCount(n) {
  const c = Math.max(0, Number(n) || 0);
  return Math.max(1, Math.ceil(c / WALL_PAGE));
}

export function wallSlotOnWall(i, n) {
  const count = Math.max(0, Number(n) || 0);
  if (count <= 0) return { page: 0, pages: 1, local: 0, onPage: 1, ...wallSpreadSlot(0, 1) };
  const idx = Math.max(0, Math.min(Number(i) || 0, count - 1));
  const pages = Math.ceil(count / WALL_PAGE);
  const page = Math.floor(idx / WALL_PAGE);
  const local = idx % WALL_PAGE;
  const onPage = page === pages - 1 ? count - page * WALL_PAGE : WALL_PAGE;
  return { page, pages, local, onPage, ...wallSpreadSlot(local, onPage) };
}

export function wallPaintRows(items) {
  return (items || [])
    .filter((row) => dataImageOk(row && row.img))
    .slice()
    .sort((a, b) => {
      const c = String(a.at || "").localeCompare(String(b.at || ""));
      if (c) return c;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
}

export function wallBoxesOverlap(a, b, pad = 0.5) {
  return (
    a.left < b.left + b.w - pad &&
    a.left + a.w - pad > b.left &&
    a.top < b.top + b.h - pad &&
    a.top + a.h - pad > b.top
  );
}

export function cssQuarterTurn(transform) {
  const t = String(transform || "");
  if (!t || t === "none") return false;
  const m = /^matrix\((.+)\)$/.exec(t);
  if (!m) return /rotate\(\s*90deg\s*\)/i.test(t);
  const p = m[1].split(",").map((s) => Number(s.trim()));
  if (p.length < 4) return false;
  return Math.abs(p[0]) < 0.35 && Math.abs(p[3]) < 0.35 && Math.abs(p[1]) > 0.65;
}

export function padMapTouch(rect, clientX, clientY, cw, ch, rotated) {
  if (!rect || rect.width < 2 || rect.height < 2) return { x: 0, y: 0 };
  const w = Number(cw) || 0;
  const h = Number(ch) || 0;
  if (rotated) {
    return {
      x: (clientY - rect.top) * (w / rect.height),
      y: (rect.right - clientX) * (h / rect.width),
    };
  }
  return {
    x: (clientX - rect.left) * (w / rect.width),
    y: (clientY - rect.top) * (h / rect.height),
  };
}

export function inkBounds(data, w, h) {
  const width = Number(w) || 0;
  const height = Number(h) || 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

export function ptsBounds(pts) {
  if (!pts || !pts.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const r = (Number(p && p.w) || 0) / 2 + 1.2;
    const x = Number(p && p.x) || 0;
    const y = Number(p && p.y) || 0;
    if (x - r < minX) minX = x - r;
    if (y - r < minY) minY = y - r;
    if (x + r > maxX) maxX = x + r;
    if (y + r > maxY) maxY = y + r;
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

export function strokeWidthFromTouch(input, minW = 2.2, maxW = 11) {
  const lo = Number(minW) || 2.2;
  const hi = Number(maxW) || 11;
  const speed = Number(input && input.speed) || 0;
  const force = Number(input && input.force) || 0;
  const radius = Number(input && input.radius) || 0;
  let t = Math.max(0, Math.min(1, 1 - (speed - 0.03) / 0.5));
  if (force > 0.05 && force < 0.97) t = t * 0.4 + Math.min(1, force) * 0.6;
  else if (radius > 1.2) t = t * 0.72 + Math.max(0, Math.min(1, (radius - 8) / 18)) * 0.28;
  return lo + (hi - lo) * t;
}

export function buildIcsCalendar({
  title = "婚礼",
  startIso = "2026-10-06T11:18:00+08:00",
  endIso = "2026-10-06T14:30:00+08:00",
  location = "",
  description = "",
  url = "",
}) {
  const toIcsUtc = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "20261006T031800Z";
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const dtstart = toIcsUtc(startIso);
  const dtend = toIcsUtc(endIso);
  const fullDesc = [description, location ? `地点：${location}` : "", url ? `请柬：${url}` : ""]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Widd//Wedding Invite//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${title}`,
    "BEGIN:VEVENT",
    `UID:wedding-${dtstart}-widd@sumuyang.asia`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${fullDesc}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:【提醒】今日 ${title}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:【提醒】明日 ${title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function calendarOpeners({
  icsUrl = "https://sumuyang.asia/wedding.ics",
  title = "婚礼",
  startIso = "2026-10-06T11:18:00+08:00",
  endIso = "2026-10-06T14:30:00+08:00",
  location = "",
  description = "",
} = {}) {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  const webcal = String(icsUrl).replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
  const intent = [
    "intent://vnd.android.cursor.dir/event#Intent",
    "action=android.intent.action.INSERT",
    "type=vnd.android.cursor.item/event",
    `S.title=${encodeURIComponent(title)}`,
    `l.beginTime=${Number.isFinite(startMs) ? startMs : 0}`,
    `l.endTime=${Number.isFinite(endMs) ? endMs : 0}`,
    `S.eventLocation=${encodeURIComponent(location)}`,
    `S.description=${encodeURIComponent(description)}`,
    `S.browser_fallback_url=${encodeURIComponent(icsUrl)}`,
    "end",
  ].join(";");
  return { icsUrl, webcal, intent };
}

export function coverBox(elW, elH, imgW, imgH, alignX) {
  const ew = Number(elW) || 0;
  const eh = Number(elH) || 0;
  const iw = Number(imgW) || 1;
  const ih = Number(imgH) || 1;
  const s = Math.max(ew / iw, eh / ih);
  const w = iw * s;
  const h = ih * s;
  const ax = Number(alignX);
  return {
    x: Number.isFinite(ax) ? (ew - w) * ax : (ew - w) / 2,
    y: (eh - h) / 2,
    w,
    h,
  };
}

