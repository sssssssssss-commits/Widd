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
  const gap = 1.6;
  const cap = 50;
  // ponytail: 0.82 leaves AABB room for ±10° tilt; bump slack if overlap returns
  const slack = 0.82;
  let best = null;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellW = (100 - gap * (cols + 1)) / cols;
    const cellH = (100 - gap * (rows + 1)) / rows;
    const size = Math.min(cellW, cellH) * slack;
    if (size <= 0) continue;
    if (!best || size > best.size) best = { cols, rows, cellW, cellH, size, gap };
  }
  const size = Math.min(cap, best.size);
  const row = Math.floor(idx / best.cols);
  const col = idx % best.cols;
  const nThisRow = row === best.rows - 1 ? count - row * best.cols : best.cols;
  const rowShift = ((best.cols - nThisRow) * (best.cellW + gap)) / 2;
  const left = gap + rowShift + col * (best.cellW + gap) + (best.cellW - size) / 2;
  const top = gap + row * (best.cellH + gap) + (best.cellH - size) / 2;
  return { left, top, w: size, h: size };
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
