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

export function wallRot(id) {
  let n = 0;
  for (const c of String(id || "")) n = (n + c.charCodeAt(0)) % 13;
  return n - 6;
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

export function wallLeafSize(n) {
  const count = Math.max(1, Number(n) || 1);
  if (count <= 8) return { w: 20, h: 11 };
  if (count <= 14) return { w: 16, h: 9 };
  if (count <= 22) return { w: 13, h: 8 };
  if (count <= 36) return { w: 11, h: 7 };
  return { w: 9, h: 6 };
}

export function wallLeafSlot(i, n) {
  const count = Math.max(Number(n) || 1, i + 1);
  const { w, h } = wallLeafSize(count);
  const gap = 2.6;
  const r0 = 24 + h / 2;
  const dr = h + gap + w * 0.22;
  const rMax = Math.min(49 - w / 2, 48 - h / 2);
  const ringCap = (rad) => Math.max(5, Math.floor((2 * Math.PI * rad) / (w + gap)));
  let remain = i;
  let ring = 0;
  let r = r0;
  let cap = ringCap(r);
  while (remain >= cap && r + 0.01 < rMax) {
    remain -= cap;
    ring += 1;
    r = Math.min(rMax, r0 + ring * dr);
    cap = ringCap(r);
    if (ring > 10) break;
  }
  const angle =
    ((remain + (ring % 2) * 0.5) / cap) * Math.PI * 2 - Math.PI / 2;
  const cx = 50 + r * Math.cos(angle);
  const cy = 50 + r * Math.sin(angle);
  const left = cx - w / 2;
  const top = cy - h / 2;
  const hx = cx;
  const hy = top;
  const dx = hx - 50;
  const dy = hy - 50;
  const dist = Math.hypot(dx, dy) || 1;
  const attach = 16;
  const ax = 50 + (dx / dist) * attach;
  const ay = 50 + (dy / dist) * attach;
  const ang = Math.atan2(hy - ay, hx - ax);
  const side = i % 2 ? 1 : -1;
  return {
    left,
    top,
    w,
    h,
    hx,
    hy,
    ax,
    ay,
    c1x: ax + Math.cos(ang + side * 0.55) * dist * 0.42,
    c1y: ay + Math.sin(ang + side * 0.55) * dist * 0.42,
    c2x: hx - Math.cos(ang) * dist * 0.18,
    c2y: hy - Math.sin(ang) * dist * 0.18,
  };
}

export function wallBoxesOverlap(a, b, pad = 0.5) {
  return (
    a.left < b.left + b.w - pad &&
    a.left + a.w - pad > b.left &&
    a.top < b.top + b.h - pad &&
    a.top + a.h - pad > b.top
  );
}
