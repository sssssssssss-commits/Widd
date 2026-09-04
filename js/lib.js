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

export function wallSpreadSlot(i, n) {
  const count = Math.max(Number(n) || 1, i + 1);
  const w = count > 20 ? 9.2 : count > 10 ? 10.8 : 12;
  const h = w * 0.42;
  const gap = 1.15;
  let cols = Math.floor((100 - gap) / (w + gap));
  if (cols < 3) cols = 3;
  if (cols % 2 === 0) cols -= 1;
  const row = Math.floor(i / cols);
  const k = i % cols;
  const colOff = k === 0 ? 0 : Math.ceil(k / 2) * (k % 2 === 1 ? -1 : 1);
  const rowOff = row === 0 ? 0 : Math.ceil(row / 2) * (row % 2 === 1 ? -1 : 1);
  let left = 50 + colOff * (w + gap) - w / 2;
  let top = 50 + rowOff * (h + gap) - h / 2;
  left = Math.min(100 - w - 0.3, Math.max(0.3, left));
  top = Math.min(100 - h - 0.3, Math.max(0.3, top));
  return { left, top, w, h };
}

export function wallBoxesOverlap(a, b, pad = 0.5) {
  return (
    a.left < b.left + b.w - pad &&
    a.left + a.w - pad > b.left &&
    a.top < b.top + b.h - pad &&
    a.top + a.h - pad > b.top
  );
}

export function strokeWidthFromTouch(input, minW = 2.2, maxW = 11) {
  const lo = Number(minW) || 2.2;
  const hi = Number(maxW) || 11;
  const force = Number(input && input.force) || 0;
  const radius = Number(input && input.radius) || 0;
  const speed = Number(input && input.speed) || 0;
  let t = 0.5;
  if (radius > 1.2) t = Math.max(0, Math.min(1, (radius - 6) / 22));
  else if (force > 0.05 && force < 0.97) t = Math.min(1, force);
  else t = Math.max(0, Math.min(1, 1 - (speed - 0.03) / 0.55));
  t = 0.34 + t * 0.32;
  return lo + (hi - lo) * t;
}
