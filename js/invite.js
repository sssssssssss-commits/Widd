function guestFromSearch(search) {
  const raw = String(search || "");
  const q = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  return (q.get("to") || "").trim().slice(0, 20);
}

function remaining(now, then) {
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

function coupleLine(groom, bride) {
  const a = `${groom?.family || ""}${groom?.name || ""}`.trim();
  const b = `${bride?.family || ""}${bride?.name || ""}`.trim();
  return [a, b].filter(Boolean).join(" 与 ");
}

function mapLinks({ name, address, lat, lng }) {
  const n = encodeURIComponent(name || "婚礼");
  const a = encodeURIComponent(address || "");
  return {
    amap: `https://uri.amap.com/marker?position=${lng},${lat}&name=${n}&src=widd&coordinate=gaode&callnative=1`,
    tencent: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${n};addr:${a}&referer=widd`,
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function escAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

function clipText(v, n) {
  return String(v ?? "").trim().slice(0, n);
}

function dataImageOk(s, max) {
  max = max || 120000;
  return (
    typeof s === "string" &&
    s.length >= 80 &&
    s.length <= max &&
    /^data:image\/(jpeg|jpg|png);base64,/i.test(s)
  );
}

function inkBounds(data, w, h) {
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

function darkPixelCount(data, threshold) {
  threshold = threshold || 40;
  const cut = threshold * 3;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 12) continue;
    if (data[i] + data[i + 1] + data[i + 2] < cut) n += 1;
  }
  return n;
}

function wallHash(id) {
  let n = 2166136261;
  const s = String(id || "0");
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function wallRot(id) {
  return (wallHash(id) % 21) - 10;
}

function wallMineCount(items, by) {
  const id = String(by || "");
  if (!id) return 0;
  return (Array.isArray(items) ? items : []).filter((row) => String(row?.by || "") === id).length;
}

function wallSpreadSlot(i, n) {
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

function strokeWidthFromTouch(input, minW, maxW) {
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

function isWallHost(search, key) {
  const k = String(key || "");
  if (!k) return false;
  const raw = String(search || "");
  const q = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  return q.get("host") === k;
}

function wallHitUrl(getUrl) {
  return String(getUrl || "").replace("/get/", "/hit/");
}

function wallAfterWipe(items, epoch) {
  const n = Number(epoch) || 0;
  return (Array.isArray(items) ? items : []).filter((row) => (Number(row?.epoch) || 0) >= n);
}

function wallWithoutMine(items, by, dropUntagged) {
  const id = String(by || "");
  return (Array.isArray(items) ? items : []).filter((row) => {
    const owner = String(row?.by || "");
    if (owner) return owner !== id;
    return !dropUntagged;
  });
}

function wallExceptHidden(items, hidden) {
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

const RSVP_KEY = "widd-rsvp";
const WALL_KEY = "widd-wall";
const BY_KEY = "widd-by";
const GOLD_INK = "#F6D34A";
const INK_EDGE = "#1A120C";
// ponytail: public counter, 6-month TTL on GET; Worker KV epoch if rsvp.endpoint is live
const WALL_EPOCH_GET = "https://abacus.jasoncameron.dev/get/sssssssssss-github-io/widd-wall";

const $ = (id) => document.getElementById(id);

async function loadConfig() {
  const res = await fetch("data/wedding.json?v=22", { cache: "no-store" });
  if (!res.ok) throw new Error("wedding.json");
  return res.json();
}

function applyShare(cfg) {
  const title = cfg.share?.title || cfg.title || "婚礼请柬";
  const desc = cfg.share?.description || "锦书遥寄，待君亲启。";
  const origin = (cfg.share?.origin || "").replace(/\/$/, "");
  const abs = (p) => {
    if (!p) return p;
    if (/^https?:\/\//.test(p)) return p;
    return origin ? `${origin}/${p.replace(/^\//, "")}` : p;
  };
  document.title = title;
  const set = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el && val) el.setAttribute(attr, val);
  };
  set('meta[name="description"]', "content", desc);
  set('meta[property="og:title"]', "content", title);
  set('meta[property="og:description"]', "content", desc);
  if (origin) set('meta[property="og:url"]', "content", `${origin}/`);
  const img = abs(cfg.share?.ogImage || cfg.share?.image);
  set('meta[property="og:image"]', "content", img);
  set('meta[property="og:image:secure_url"]', "content", img);
  set('meta[itemprop="image"]', "content", img);
  set('meta[name="twitter:image"]', "content", img);
  set('link[rel="image_src"]', "href", img);
  const thumb = document.querySelector(".share-thumb");
  if (thumb && img) {
    thumb.src = img;
    thumb.alt = title;
  }
}

function renderNames(cfg) {
  const cell = (who, label) =>
    `<div class="person"><small>${label}</small><span class="name">${who.family}${who.name}</span></div>`;
  $("names").innerHTML =
    cell(cfg.groom, "新郎") + '<div class="amp" aria-hidden="true">囍</div>' + cell(cfg.bride, "新娘");
}

function renderScrolls(photos) {
  $("scrolls").innerHTML = (photos || [])
    .map(
      (p) => `<article class="scroll">
        <figure>
          <div class="rod"></div>
          <img src="${p.src}" alt="${p.caption || ""}" loading="lazy">
          <figcaption>${p.caption || ""}</figcaption>
        </figure>
      </article>`,
    )
    .join("");
}

function renderVenues(venues) {
  $("venues").innerHTML = (venues || [])
    .map((v) => {
      const { amap, tencent } = mapLinks(v);
      return `<article class="venue">
        <div class="label">${v.label || "席设"}</div>
        <h2>${v.name}</h2>
        <address>${v.address || ""}</address>
        <div class="navs">
          <a href="${amap}">高德出发</a>
          <a href="${tencent}">腾讯地图</a>
        </div>
      </article>`;
    })
    .join("");
}

function renderRsvp(cfg, guest) {
  const box = $("rsvp");
  const endpoint = cfg.rsvp?.endpoint || "";
  const survey = cfg.rsvp?.surveyUrl || "";
  const done = sessionStorage.getItem(RSVP_KEY);

  if (endpoint) {
    box.innerHTML = `<form class="rsvp-box" id="rsvpForm">
      <h2>回执</h2>
      <label for="rsvpName">姓名</label>
      <input id="rsvpName" name="name" maxlength="20" required value="${escAttr(guest)}">
      <div class="choices">
        <label><input type="radio" name="attending" value="yes" checked> 赴宴</label>
        <label><input type="radio" name="attending" value="no"> 歉辞</label>
      </div>
      <label for="rsvpCount">人数</label>
      <input id="rsvpCount" name="count" type="number" min="1" max="20" value="1">
      <label for="rsvpNotes">忌口或嘱咐</label>
      <textarea id="rsvpNotes" name="notes" maxlength="200"></textarea>
      <button type="submit">落笔</button>
      <div class="stamp" id="stamp">已复</div>
    </form>`;
    const form = $("rsvpForm");
    if (done) stampDone();
    form.addEventListener("submit", (e) => submitRsvp(e, endpoint, guest));
    form.querySelectorAll('[name="attending"]').forEach((r) => {
      r.addEventListener("change", () => {
        $("rsvpCount").disabled = form.querySelector('[name="attending"]:checked')?.value === "no";
      });
    });
    return;
  }

  if (survey) {
    box.innerHTML = `<div class="rsvp-box">
      <h2>回执</h2>
      <a class="rsvp-link" href="${survey}">写下回执</a>
    </div>`;
    return;
  }

  box.hidden = true;
}

async function submitRsvp(e, endpoint, guest) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button");
  btn.disabled = true;
  const body = {
    name: form.name.value.trim(),
    attending: form.attending.value === "yes",
    count: form.attending.value === "yes" ? Number(form.count.value) || 1 : 0,
    notes: form.notes.value.trim(),
    to: guest,
  };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(res.status);
    sessionStorage.setItem(RSVP_KEY, "1");
    stampDone();
  } catch {
    btn.disabled = false;
    btn.textContent = "再试一次";
  }
}

function stampDone() {
  const form = $("rsvpForm");
  if (!form) return;
  form.querySelector("button").disabled = true;
  const stamp = $("stamp");
  if (stamp) stamp.classList.add("is-on");
}

function wallEndpoints(cfg) {
  const out = [];
  const add = (u) => {
    const s = String(u || "").trim();
    if (s && out.indexOf(s) < 0) out.push(s);
  };
  const extra = cfg.wall?.endpoints;
  if (Array.isArray(extra)) extra.forEach(add);
  add(cfg.wall?.endpoint);
  add(cfg.rsvp?.endpoint);
  try {
    const last = sessionStorage.getItem("widd-wall-url");
    if (last && out.indexOf(last) > 0) {
      out.splice(out.indexOf(last), 1);
      out.unshift(last);
    }
  } catch {}
  return out;
}

function rememberWallUrl(url) {
  try {
    if (url) sessionStorage.setItem("widd-wall-url", url);
  } catch {}
}

function readLocalWall() {
  try {
    const rows = JSON.parse(localStorage.getItem(WALL_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLocalWall(rows) {
  try {
    localStorage.setItem(WALL_KEY, JSON.stringify(rows.slice(-80)));
  } catch {}
}

function wallBy() {
  try {
    let id = localStorage.getItem(BY_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(BY_KEY, id);
    }
    return id;
  } catch {
    return `tmp-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function bust(url) {
  if (!url) return url;
  return `${url}${url.indexOf("?") >= 0 ? "&" : "?"}t=${Date.now()}`;
}

async function fetchTimed(url, opts, ms) {
  const wait = Number(ms) || 4000;
  const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ac ? setTimeout(() => ac.abort(), wait) : null;
  const req = opts ? Object.assign({}, opts) : {};
  delete req.cache;
  try {
    if (!ac) {
      return await Promise.race([
        fetch(url, req),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), wait)),
      ]);
    }
    return await fetch(url, Object.assign(req, { signal: ac.signal }));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchWallEpoch(getUrl) {
  try {
    const res = await fetchTimed(bust(getUrl || WALL_EPOCH_GET), null, 2500);
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error();
    const data = await res.json();
    return Number(data.value) || 0;
  } catch {
    return 0;
  }
}

async function bumpWallEpoch(getUrl) {
  const res = await fetchTimed(bust(wallHitUrl(getUrl || WALL_EPOCH_GET)));
  if (!res.ok) throw new Error();
  const data = await res.json();
  return Number(data.value) || 0;
}

function wallPaintRows(items) {
  return (items || [])
    .filter((row) => dataImageOk(row && row.img))
    .slice()
    .sort((a, b) => {
      const ta = String(a.at || "");
      const tb = String(b.at || "");
      if (ta && tb && ta !== tb) return ta.localeCompare(tb);
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
}

function wallCard(item, i, fly, slot) {
  const src = item && item.img;
  if (!dataImageOk(src)) return "";
  const key = item.id || String(i);
  const rot = wallRot(key);
  const pos = slot || wallSpreadSlot(i, i + 1);
  return `<figure class="wall-card${fly ? " is-in" : ""}" style="--rot:${rot}deg;--w:${pos.w}%;--h:${pos.h}%;left:${pos.left}%;top:${pos.top}%">
    <img src="${src}" alt="">
  </figure>`;
}

function paintWallBoard(items, flyId) {
  const board = $("wallBoard");
  if (!board) return;
  const rows = wallPaintRows(items);
  const n = rows.length;
  board.innerHTML = rows
    .map((row, i) => wallCard(row, i, row.id === flyId, wallSpreadSlot(i, n)))
    .join("");
}

function loadKeepImg(src) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

function drawKeepContained(ctx, im, dx, dy, dw, dh) {
  const ir = (im.width || 1) / (im.height || 1);
  const br = dw / dh;
  let w = dw;
  let h = dh;
  let x = dx;
  let y = dy;
  if (ir > br) {
    h = dw / ir;
    y = dy + (dh - h) / 2;
  } else {
    w = dh * ir;
    x = dx + (dw - w) / 2;
  }
  const o = Math.max(1, w * 0.008);
  ctx.save();
  ctx.shadowColor = "#1A120C";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = o;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(im, x, y, w, h);
  ctx.shadowOffsetX = -o;
  ctx.drawImage(im, x, y, w, h);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = o;
  ctx.drawImage(im, x, y, w, h);
  ctx.shadowOffsetY = -o;
  ctx.drawImage(im, x, y, w, h);
  ctx.restore();
  ctx.drawImage(im, x, y, w, h);
}

async function snapshotWall(items) {
  const yard = document.querySelector(".wall-yard");
  const cssW = (yard && yard.clientWidth) || 360;
  const W = Math.min(1200, Math.max(720, Math.round(cssW * 2.4)));
  const H = Math.round((W * 1005) / 738);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F6F1E6";
  ctx.fillRect(0, 0, W, H);
  const paper = await loadKeepImg("assets/wall.jpg?v=1");
  if (paper) {
    const ir = (paper.width || 1) / (paper.height || 1);
    const br = W / H;
    let dw = W;
    let dh = H;
    let dx = 0;
    let dy = 0;
    if (ir > br) {
      dh = W / ir;
      dy = (H - dh) / 2;
    } else {
      dw = H * ir;
      dx = (W - dw) / 2;
    }
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(paper, dx, dy, dw, dh);
    ctx.restore();
  }
  const bx = W * 0.075;
  const by = H * 0.075;
  const bw = W * 0.85;
  const bh = H * 0.85;
  const rows = wallPaintRows(items);
  const n = rows.length;
  for (let i = 0; i < n; i++) {
    const im = await loadKeepImg(rows[i].img);
    if (!im) continue;
    const slot = wallSpreadSlot(i, n);
    const cw = (bw * slot.w) / 100;
    const ch = (bh * slot.h) / 100;
    const cx = bx + (bw * slot.left) / 100 + cw / 2;
    const cy = by + (bh * slot.top) / 100 + ch / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((wallRot(rows[i].id || String(i)) * Math.PI) / 180);
    drawKeepContained(ctx, im, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  }
  const png = canvas.toDataURL("image/png");
  if (!png || png.length < 80) throw new Error("empty");
  return png;
}

async function loadWallItems(urls) {
  const local = readLocalWall();
  const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
  if (!list.length) return { ok: false, items: local };
  const tryOne = async (url) => {
    const res = await fetchTimed(bust(url), null, 4000);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error();
    rememberWallUrl(url);
    return { ok: true, items: data.items, url };
  };
  if (list.length === 1) {
    try {
      return await tryOne(list[0]);
    } catch {
      return { ok: false, items: local };
    }
  }
  const got = await Promise.all(
    list.map((url) =>
      tryOne(url).catch(() => null),
    ),
  );
  for (let i = 0; i < got.length; i++) {
    if (got[i]) return got[i];
  }
  return { ok: false, items: local };
}

async function postWall(urls, body) {
  const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
  let conflict = null;
  for (let i = 0; i < list.length; i++) {
    try {
      const res = await fetchTimed(
        list[i],
        {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: JSON.stringify(body),
        },
        4000,
      );
      if (res.status === 409) {
        conflict = { ok: false, status: 409, res, url: list[i] };
        continue;
      }
      if (!res.ok) continue;
      rememberWallUrl(list[i]);
      return { ok: true, res, url: list[i] };
    } catch {}
  }
  return conflict || { ok: false };
}

function ptsBounds(pts) {
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

function strokeGoldInk(ctx, pts) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (!pts || !pts.length) return;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    ctx.beginPath();
    ctx.fillStyle = INK_EDGE;
    ctx.arc(p.x, p.y, p.w / 2 + Math.max(1.15, p.w * 0.26), 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    ctx.beginPath();
    ctx.fillStyle = GOLD_INK;
    ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintGoldInk(ctx, pts, w, h) {
  ctx.clearRect(0, 0, w, h);
  strokeGoldInk(ctx, pts);
}

function exportWallPad(pts) {
  const box = ptsBounds(pts);
  if (!box) return "";
  const gap = 8;
  const width = box.maxX - box.minX + gap * 2;
  const height = box.maxY - box.minY + gap * 2;
  if (width < 4 || height < 4) return "";
  const tryPng = (tw, th, scale) => {
    const tmp = document.createElement("canvas");
    tmp.width = tw;
    tmp.height = th;
    const t = tmp.getContext("2d", { alpha: true });
    t.clearRect(0, 0, tw, th);
    t.setTransform(scale, 0, 0, scale, (-box.minX + gap) * scale, (-box.minY + gap) * scale);
    strokeGoldInk(t, pts);
    const png = tmp.toDataURL("image/png");
    return dataImageOk(png) ? png : "";
  };
  const scale = Math.min(2, 360 / Math.max(width, height, 1));
  const tw = Math.max(8, Math.round(width * scale));
  const th = Math.max(8, Math.round(height * scale));
  return (
    tryPng(tw, th, scale) ||
    tryPng(Math.max(8, Math.round(tw * 0.65)), Math.max(8, Math.round(th * 0.65)), scale * 0.65)
  );
}

function fitWallPad(canvas, state, wipe) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 280;
  const h = canvas.clientHeight || Math.max(160, Math.round(w * 0.42));
  const pts = !wipe && state && state.pts ? state.pts.slice() : [];
  const dirty = !wipe && state && state.dirty;
  if (w < 8 || h < 8) return canvas.getContext("2d");
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state) {
    state.pts = pts;
    state.dirty = !!dirty;
  }
  paintGoldInk(ctx, pts, w, h);
  return ctx;
}

function cssQuarterTurn(transform) {
  const t = String(transform || "");
  if (!t || t === "none") return false;
  const m = /^matrix\((.+)\)$/.exec(t);
  if (!m) return /rotate\(\s*90deg\s*\)/i.test(t);
  const p = m[1].split(",").map((s) => Number(s.trim()));
  if (p.length < 4) return false;
  return Math.abs(p[0]) < 0.35 && Math.abs(p[3]) < 0.35 && Math.abs(p[1]) > 0.65;
}

function padMapTouch(rect, clientX, clientY, cw, ch, rotated) {
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

function padPoint(canvas, e) {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
  const r = canvas.getBoundingClientRect();
  const sheet = canvas.closest ? canvas.closest(".wall-sheet") : null;
  const rotated = cssQuarterTurn(sheet && getComputedStyle(sheet).transform);
  return padMapTouch(r, t.clientX, t.clientY, canvas.clientWidth, canvas.clientHeight, rotated);
}

function touchSample(e) {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  const force = t ? Number(t.force || t.webkitForce || 0) : Number(e.pressure || 0);
  const radius = t
    ? Math.max(
        Number(t.radiusX) || 0,
        Number(t.radiusY) || 0,
        Number(t.webkitRadiusX) || 0,
        Number(t.webkitRadiusY) || 0,
      )
    : Number(e.width || 0);
  return { force, radius };
}

function bindWallPad(canvas, ctx, state) {
  let drawing = false;
  let last = null;
  if (!state.pts) state.pts = [];
  const cssBox = () => ({
    w: canvas.clientWidth || 280,
    h: canvas.clientHeight || 160,
  });
  const paint = () => {
    const box = cssBox();
    paintGoldInk(canvas.getContext("2d"), state.pts, box.w, box.h);
  };
  const widthOf = (e, p) => {
    const h = canvas.clientHeight || 280;
    const mid = Math.max(3.6, h / 34);
    const minW = mid * 0.7;
    const maxW = mid * 1.42;
    const sample = touchSample(e);
    let speed = 0.12;
    if (last) {
      const dt = Math.max(4, (e.timeStamp || Date.now()) - last.t);
      speed = Math.hypot(p.x - last.x, p.y - last.y) / dt;
    }
    const raw = strokeWidthFromTouch(
      { force: sample.force, radius: sample.radius, speed },
      minW,
      maxW,
    );
    return last ? last.w * 0.22 + raw * 0.78 : raw;
  };
  const ribbon = (a, b, w0, w1) => {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / 1.2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      state.pts.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        w: w0 + (w1 - w0) * t,
      });
    }
    state.dirty = true;
    paint();
  };
  const down = (e) => {
    e.preventDefault();
    drawing = true;
    const p = padPoint(canvas, e);
    const w = widthOf(e, p);
    last = { x: p.x, y: p.y, w, t: e.timeStamp || Date.now() };
    state.pts.push({ x: p.x, y: p.y, w });
    state.dirty = true;
    paint();
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = padPoint(canvas, e);
    const w = widthOf(e, p);
    ribbon(last, p, last.w, w);
    last = { x: p.x, y: p.y, w, t: e.timeStamp || Date.now() };
  };
  const up = () => {
    drawing = false;
    last = null;
  };
  const opts = { passive: false };
  let touchAt = 0;
  const mouseDown = (e) => {
    if (Date.now() - touchAt < 800) return;
    down(e);
  };
  const mouseMove = (e) => {
    if (Date.now() - touchAt < 800) return;
    move(e);
  };
  canvas.addEventListener("touchstart", (e) => {
    touchAt = Date.now();
    down(e);
  }, opts);
  canvas.addEventListener("touchmove", (e) => {
    touchAt = Date.now();
    move(e);
  }, opts);
  canvas.addEventListener("touchend", up);
  canvas.addEventListener("touchcancel", up);
  canvas.addEventListener("mousedown", mouseDown);
  canvas.addEventListener("mousemove", mouseMove);
  canvas.addEventListener("mouseup", up);
  canvas.addEventListener("mouseleave", up);
}

function renderWall(cfg, guest) {
  const soon = $("wallSoon");
  const wall = $("wall");
  if (cfg.signatureWall !== true) {
    soon.hidden = false;
    wall.hidden = true;
    return;
  }
  soon.hidden = true;
  wall.hidden = false;
  const urls = wallEndpoints(cfg);
  const url = urls[0] || "";
  const host = isWallHost(location.search, cfg.wallHost);
  const by = wallBy();
  const epochUrl = cfg.wallEpoch || WALL_EPOCH_GET;
  wall.innerHTML = `<div class="wall-box">
      <h2>签名墙</h2>
      <div class="wall-yard">
        <div class="wall-frame">
          <div class="wall-board" id="wallBoard"></div>
        </div>
      </div>
      <div class="wall-actions">
        <button type="button" id="wallOpen">签字</button>
        <button type="button" id="wallMine">撤下我的</button>
        ${host ? `<button type="button" id="wallSave">保存签名墙</button>` : ""}
        ${host ? `<button type="button" id="wallWipe">清空全部</button>` : ""}
      </div>
      <p class="wall-hint" id="wallHint"></p>
    </div>`;

  let sheet = $("wallSheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "wallSheet";
    sheet.className = "wall-sheet";
    sheet.hidden = true;
    sheet.innerHTML = `<div class="wall-sheet-stage">
      <div class="wall-sheet-pad">
        <canvas id="wallPad" width="800" height="360" aria-label="手写签名"></canvas>
      </div>
      <div class="wall-sheet-side">
        <p class="wall-sheet-title">题字</p>
        <p class="wall-sheet-hint" id="wallSheetHint"></p>
        <button type="button" id="wallCancel">取消</button>
        <button type="button" id="wallClear">重写</button>
        <button type="button" id="wallPin">完成</button>
      </div>
    </div>`;
    document.body.appendChild(sheet);
  }

  let keep = $("wallKeep");
  if (!keep) {
    keep = document.createElement("div");
    keep.id = "wallKeep";
    keep.className = "wall-keep";
    keep.hidden = true;
    keep.innerHTML = `<p class="wall-keep-hint">长按图片保存到相册</p>
      <img id="wallKeepImg" alt="签名墙">
      <button type="button" id="wallKeepClose">关闭</button>`;
    document.body.appendChild(keep);
    $("wallKeepClose").addEventListener("click", () => {
      keep.hidden = true;
      const img = $("wallKeepImg");
      if (img) img.removeAttribute("src");
    });
  }

  const canvas = $("wallPad");
  const pad = { dirty: false };
  let ctx = canvas.getContext("2d");
  bindWallPad(canvas, ctx, pad);
  let epochCache = 0;
  const pending = [];
  const hidden = { ids: new Set(), imgs: new Set() };
  let writeGen = 0;

  const hideRows = (rows) => {
    for (let i = 0; i < (rows || []).length; i++) {
      const row = rows[i];
      if (row && row.id) hidden.ids.add(row.id);
      if (row && row.img) hidden.imgs.add(row.img);
    }
  };

  const mergePending = (items) => {
    const rows = wallExceptHidden(items || [], hidden);
    const keep = [];
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      if (hidden.ids.has(p.id) || hidden.imgs.has(p.img)) continue;
      if (rows.some((row) => row.id === p.id || row.img === p.img)) continue;
      rows.push(p);
      keep.push(p);
    }
    pending.length = 0;
    for (let i = 0; i < keep.length; i++) pending.push(keep[i]);
    return rows;
  };

  const closeSheet = () => {
    sheet.hidden = true;
    document.body.classList.remove("is-signing");
    try {
      screen.orientation.unlock();
    } catch {}
  };

  const openSheet = () => {
    sheet.hidden = false;
    document.body.classList.add("is-signing");
    $("wallSheetHint").textContent = "";
    try {
      const ori = screen.orientation;
      if (ori && ori.lock) ori.lock("landscape").catch(() => {});
    } catch {}
    const boot = (wipe) => {
      ctx = fitWallPad(canvas, pad, wipe);
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => boot(true));
    });
    setTimeout(() => boot(!pad.dirty), 160);
  };

  const refitPad = () => {
    if (sheet.hidden) return;
    ctx = fitWallPad(canvas, pad, false);
  };
  addEventListener("resize", refitPad, { passive: true });
  try {
    if (window.visualViewport) visualViewport.addEventListener("resize", refitPad, { passive: true });
  } catch {}

  const refresh = async (flyId) => {
    const gotP = loadWallItems(urls);
    const epochP = fetchWallEpoch(epochUrl);
    const got = await gotP;
    epochCache = await epochP;
    let items = got.ok ? got.items : wallAfterWipe(got.items, epochCache);
    items = mergePending(items);
    writeLocalWall(items);
    paintWallBoard(items, flyId);
    return items;
  };

  $("wallOpen").addEventListener("click", () => {
    if (wallMineCount(readLocalWall(), by) >= 3) {
      $("wallHint").textContent = "每人最多留下三幅";
      return;
    }
    openSheet();
  });
  $("wallCancel").addEventListener("click", closeSheet);
  $("wallClear").addEventListener("click", () => {
    ctx = fitWallPad(canvas, pad, true);
    $("wallSheetHint").textContent = "";
  });

  refresh();
  setInterval(refresh, 8000);

  $("wallMine").addEventListener("click", () => {
    if (!window.confirm("确定撤下你留下的签名？")) return;
    writeGen += 1;
    const mine = readLocalWall().filter((row) => String(row.by || "") === by || !row.by);
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      if (!mine.some((row) => row.id === p.id || row.img === p.img)) mine.push(p);
    }
    hideRows(mine);
    pending.length = 0;
    const next = wallExceptHidden(wallWithoutMine(readLocalWall(), by, true), hidden);
    writeLocalWall(next);
    paintWallBoard(next);
    $("wallHint").textContent = "已撤下你的签名";
    const ids = mine.map((row) => row.id).filter(Boolean);
    postWall(urls, { kind: "wall-mine", by, ids });
  });

  const saveBtn = $("wallSave");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const hint = $("wallHint");
      hint.textContent = "正在生成…";
      saveBtn.disabled = true;
      try {
        const items = await refresh();
        const png = await snapshotWall(items);
        const img = $("wallKeepImg");
        img.src = png;
        keep.hidden = false;
        hint.textContent = "";
        if (!/MicroMessenger/i.test(navigator.userAgent)) {
          const a = document.createElement("a");
          a.href = png;
          a.download = "widd-wall.png";
          a.click();
        }
      } catch {
        hint.textContent = "保存失败，请再试一次";
      }
      saveBtn.disabled = false;
    });
  }

  const wipeBtn = $("wallWipe");
  if (wipeBtn) {
    wipeBtn.addEventListener("click", async () => {
      if (!window.confirm("确定清空所有人的签名？别人手机上的也会一起清掉。")) return;
      const hint = $("wallHint");
      writeLocalWall([]);
      paintWallBoard([]);
      let shared = false;
      try {
        await bumpWallEpoch(epochUrl);
        shared = true;
      } catch {}
      shared = (await postWall(urls, { kind: "wall-wipe", host: cfg.wallHost })).ok || shared;
      await refresh();
      hint.textContent = shared ? "墙上已清空" : "本机已清，别人手机需能联网才会一起清";
    });
  }

  $("wallPin").addEventListener("click", () => {
    const sheetHint = $("wallSheetHint");
    const hint = $("wallHint");
    const name = guest || "来宾";
    if (!pad.dirty) {
      sheetHint.textContent = "请先手写签名";
      return;
    }
    const img = exportWallPad(pad.pts);
    if (!dataImageOk(img)) {
      sheetHint.textContent = "签名未能保存，请再写一次";
      return;
    }
    if (wallMineCount(readLocalWall(), by) >= 3) {
      sheetHint.textContent = "每人最多留下三幅";
      return;
    }
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      img,
      at: new Date().toISOString(),
      by,
      epoch: epochCache,
    };
    const g = writeGen;
    pending.push(item);
    writeLocalWall(mergePending(readLocalWall()));
    paintWallBoard(readLocalWall(), item.id);
    pad.dirty = false;
    hint.textContent = "正在同步…";
    closeSheet();
    if (!url) {
      hint.textContent = "已上墙";
      return;
    }
    postWall(urls, { kind: "wall", name, img, by, epoch: item.epoch })
      .then(async (sent) => {
        if (g !== writeGen) {
          if (sent.ok) {
            const data = await sent.res.json().catch(() => ({}));
            const extra = data.id ? [data.id] : [];
            postWall(urls, { kind: "wall-mine", by, ids: [item.id].concat(extra) });
          }
          return;
        }
        if (!sent.ok) {
          if (sent.status === 409) {
            for (let i = pending.length - 1; i >= 0; i--) {
              if (pending[i].id === item.id) pending.splice(i, 1);
            }
            writeLocalWall(readLocalWall().filter((row) => row.id !== item.id && row.img !== img));
            paintWallBoard(readLocalWall());
            hint.textContent = "每人最多留下三幅";
            return;
          }
          throw new Error();
        }
        const data = await sent.res.json().catch(() => ({}));
        if (data.id) item.id = data.id;
        hint.textContent = "已上墙";
        refresh(item.id);
      })
      .catch(() => {
        if (g !== writeGen) return;
        hint.textContent = "已留在本机，未能同步到网上";
      });
  });
}

function startClepsydra(iso) {
  const then = Date.parse(iso);
  const paint = () => {
    const t = remaining(Date.now(), then);
    $("d").textContent = t.days;
    $("h").textContent = pad2(t.hours);
    $("m").textContent = pad2(t.minutes);
    $("s").textContent = pad2(t.seconds);
    $("whenPast").hidden = !t.past;
    $("clepsydra").hidden = t.past;
  };
  paint();
  setInterval(paint, 1000);
}

let blessOn = false;

function blessLines(cfg) {
  const rows = Array.isArray(cfg && cfg.blessing) ? cfg.blessing : [];
  return rows.map((s) => String(s || "").trim()).filter(Boolean);
}

function startBless(cfg) {
  if (blessOn) return;
  const lines = blessLines(cfg);
  const root = $("bless");
  const lane = $("blessLane");
  if (!lines.length || !root || !lane) return;
  blessOn = true;
  root.hidden = false;
  root.removeAttribute("aria-hidden");
  const still = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (still) root.classList.add("is-still");
  const kind = ["is-edge", "is-near", "is-now", "is-near", "is-edge"];
  lane.innerHTML = kind
    .map((k) => `<p class="bless-line ${k}">&nbsp;</p>`)
    .join("");
  const slots = lane.children;
  let cur = 0;
  let watch = 0;
  let lock = 0;
  const holdMs = (text) => (still ? 2800 : Math.round(3600 + String(text).length * 140));
  const paint = (i) => {
    for (let s = 0; s < 5; s++) {
      const idx = i + s - 2;
      const t = idx >= 0 && idx < lines.length ? lines[idx] : "";
      slots[s].textContent = t || "\u00a0";
      slots[s].className = "bless-line " + kind[s];
    }
  };
  const step = () => {
    paint(cur);
    clearTimeout(watch);
    const mine = ++lock;
    watch = setTimeout(() => {
      if (mine === lock) advance();
    }, holdMs(lines[cur]));
  };
  const rest = () => {
    lock += 1;
    clearTimeout(watch);
    watch = setTimeout(() => {
      cur = 0;
      step();
    }, 3000);
  };
  const advance = () => {
    lock += 1;
    clearTimeout(watch);
    cur += 1;
    if (cur < lines.length) step();
    else rest();
  };
  paint(0);
  void lane.offsetWidth;
  step();
}

function openLetter(cfg) {
  const gate = $("gate");
  const env = $("envelope");
  const seal = $("seal");
  const letter = $("letter");

  seal.classList.add("is-bloom");
  env.classList.add("is-open");
  bgmPlay();
  setTimeout(() => {
    gate.classList.add("is-gone");
    letter.hidden = false;
    startBless(cfg);
  }, 900);
}

let foilStarted = false;
const tapXi = [];
let bgmPlay = () => {};

function bindBgm() {
  const audio = $("bgm");
  const tog = $("bgmTog");
  if (!audio || !tog) return;
  audio.volume = 0.72;
  const disc = tog.querySelector(".bgm-disc") || tog;
  const key = "widd-bgm";
  let on = true;
  try {
    on = localStorage.getItem(key) !== "0";
  } catch (err) {}
  let live = false;
  let ang = 0;
  let last = 0;
  let raf = 0;
  const spin = (now) => {
    if (!on || !live) {
      raf = 0;
      last = 0;
      return;
    }
    if (!last) last = now;
    ang = (ang + ((now - last) * 360) / 2800) % 360;
    last = now;
    const t = "rotate(" + ang + "deg)";
    disc.style.webkitTransform = t;
    disc.style.transform = t;
    raf = requestAnimationFrame(spin);
  };
  const stopSpin = () => {
    live = false;
    last = 0;
    ang = 0;
    disc.style.webkitTransform = "";
    disc.style.transform = "";
  };
  const goSpin = () => {
    if (!on) return;
    const was = live;
    live = true;
    if (!raf) raf = requestAnimationFrame(spin);
    if (!was) paint();
  };
  const paint = () => {
    tog.classList.toggle("is-off", !on);
    tog.classList.toggle("is-play", on && live);
    tog.setAttribute("aria-pressed", on ? "true" : "false");
    tog.setAttribute("aria-label", on ? "关闭音乐" : "打开音乐");
  };
  const play = () => {
    if (!on) {
      audio.pause();
      stopSpin();
      paint();
      return;
    }
    const p = audio.play();
    if (p && p.then) p.then(goSpin).catch(function () {});
    else goSpin();
  };
  const wxPlay = () => {
    try {
      if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        window.WeixinJSBridge.invoke("getNetworkType", {}, play);
        return;
      }
    } catch (err) {}
    play();
  };
  bgmPlay = wxPlay;
  paint();
  audio.addEventListener("playing", goSpin);
  audio.addEventListener("timeupdate", goSpin);
  audio.addEventListener("pause", () => {
    if (!on) {
      stopSpin();
      paint();
    }
  });
  tog.addEventListener("click", (e) => {
    e.stopPropagation();
    on = !on;
    try {
      localStorage.setItem(key, on ? "1" : "0");
    } catch (err) {}
    if (on) wxPlay();
    else {
      audio.pause();
      stopSpin();
    }
    paint();
  });
  document.addEventListener("WeixinJSBridgeReady", wxPlay, false);
  document.addEventListener(
    "touchstart",
    function once() {
      document.removeEventListener("touchstart", once, false);
      wxPlay();
    },
    false,
  );
}

function startFoil(canvas) {
  if (!canvas) return;
  const boot = () => {
    if (foilStarted) return;
    if ((innerWidth || 0) < 20) {
      setTimeout(boot, 80);
      return;
    }
    foilStarted = true;
    runFoil(canvas);
  };
  boot();
  document.addEventListener("WeixinJSBridgeReady", boot, false);
  document.addEventListener(
    "touchstart",
    function onTouch() {
      document.removeEventListener("touchstart", onTouch, false);
      boot();
    },
    false,
  );
}

function runFoil(canvas) {
  const ctx = canvas.getContext("2d");
  const PETAL = ["#C23B32", "#D4564A", "#C4453C", "#E07A6A"];
  const PETAL_HI = ["#E8A8A0", "#F2C4BC", "#E89088", "#F6D4CC"];
  const GOLD = ["#E8C85A", "#F4DC8A", "#D4A93A", "#F8E7A8", "#C9A24A"];
  const PETAL_SHEET = [
    [2, 2, 50, 56],
    [54, 2, 56, 53],
    [112, 2, 56, 46],
    [170, 2, 56, 53],
    [2, 60, 56, 47],
    [60, 60, 49, 56],
    [111, 60, 56, 49],
    [169, 60, 56, 39],
    [2, 118, 56, 46],
    [60, 118, 56, 40],
    [118, 118, 56, 40],
    [176, 118, 55, 56],
    [2, 176, 56, 44],
    [60, 176, 56, 51],
    [118, 176, 51, 56],
    [171, 176, 56, 36],
    [2, 234, 56, 50],
    [60, 234, 52, 56],
    [114, 234, 56, 53],
    [172, 234, 45, 56],
    [219, 234, 56, 37],
    [2, 292, 55, 56],
    [59, 292, 56, 56],
  ];
  const sheet = new Image();
  let sheetOk = false;
  sheet.onload = () => {
    sheetOk = true;
  };
  sheet.src = "assets/petals.png?v=1";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const fit = () => {
    const w = innerWidth || 320;
    const h = innerHeight || 568;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  addEventListener("resize", fit, { passive: true });

  const petals = Array.from({ length: 16 }, (_, i) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    s: 5.2 + Math.random() * 4.4,
    vy: 0.28 + Math.random() * 0.38,
    amp: 0.35 + Math.random() * 0.5,
    sway: 42 + Math.random() * 36,
    spin: (Math.random() - 0.5) * 0.025,
    a: 0.62 + Math.random() * 0.28,
    c: PETAL[i % PETAL.length],
    hi: PETAL_HI[i % PETAL_HI.length],
    kind: i % PETAL_SHEET.length,
    rot: Math.random() * Math.PI * 2,
    ph: Math.random() * 1000,
  }));

  const motes = Array.from({ length: 58 }, (_, i) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    w: 1.9 + Math.random() * 2.6,
    h: 0.75 + Math.random() * 0.9,
    vy: 0.12 + Math.random() * 0.22,
    a: 0.55 + Math.random() * 0.38,
    c: GOLD[i % GOLD.length],
    ph: Math.random() * 1000,
    twk: 18 + Math.random() * 22,
    rot: Math.random() * Math.PI,
    spin: 0.008 + Math.random() * 0.016,
  }));

  const petalPath = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(0.58 + 0.42 * Math.abs(Math.sin(p.ph)), 1);
    const w = p.s;
    const h = p.s * 1.72;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.bezierCurveTo(-w * 1.02, h * 0.1, -w * 0.5, -h * 0.52, 0, -h * 0.12);
    ctx.bezierCurveTo(w * 0.5, -h * 0.52, w * 1.02, h * 0.1, 0, h * 0.5);
    ctx.fillStyle = p.c;
    ctx.globalAlpha = p.a * 0.9;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.3);
    ctx.bezierCurveTo(-w * 0.42, 0.02 * h, -w * 0.18, -h * 0.22, 0, -h * 0.02);
    ctx.bezierCurveTo(w * 0.18, -h * 0.22, w * 0.42, 0.02 * h, 0, h * 0.3);
    ctx.fillStyle = p.hi;
    ctx.globalAlpha = p.a * 0.32;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.36);
    ctx.quadraticCurveTo(w * 0.03, h * 0.04, 0, -h * 0.06);
    ctx.strokeStyle = "rgba(232,200,90,0.5)";
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = p.a * 0.75;
    ctx.stroke();
    ctx.restore();
  };

  const drawPetal = (ctx, p) => {
    const sp = PETAL_SHEET[p.kind];
    if (!sheetOk || !sp) {
      petalPath(ctx, p);
      return;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(0.62 + 0.38 * Math.abs(Math.sin(p.ph)), 1);
    ctx.globalAlpha = p.a;
    const long = p.s * 1.85;
    const k = long / Math.max(sp[2], sp[3]);
    const dw = sp[2] * k;
    const dh = sp[3] * k;
    ctx.drawImage(sheet, sp[0], sp[1], sp[2], sp[3], -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  const mote = (ctx, g, t) => {
    const tw = 0.58 + 0.42 * (0.5 + 0.5 * Math.sin(t / g.twk + g.ph));
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    ctx.scale(1, 0.38 + 0.62 * Math.abs(Math.cos(g.rot * 0.85)));
    ctx.globalAlpha = g.a * tw;
    ctx.beginPath();
    ctx.moveTo(0, -g.h);
    ctx.lineTo(g.w, 0);
    ctx.lineTo(0, g.h);
    ctx.lineTo(-g.w, 0);
    ctx.closePath();
    ctx.fillStyle = g.c;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -g.h * 0.55);
    ctx.lineTo(g.w * 0.42, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = "#fff6d0";
    ctx.globalAlpha = g.a * tw * 0.5;
    ctx.fill();
    ctx.restore();
  };

  let t = 0;
  const draw = (move) => {
    t += 1;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const g of motes) {
      if (move) {
        g.y += g.vy;
        g.x += Math.sin(t / 62 + g.ph) * 0.14;
        g.rot += g.spin;
        if (g.y > innerHeight + 8) {
          g.y = -8;
          g.x = Math.random() * innerWidth;
        }
      }
      mote(ctx, g, t);
    }
    for (const p of petals) {
      if (move) {
        p.y += p.vy;
        p.x += Math.sin((t + p.ph) / p.sway) * p.amp;
        p.rot += p.spin;
        p.ph += 0.04;
        if (p.y > innerHeight + 20) {
          p.y = -20;
          p.x = Math.random() * innerWidth;
        }
      }
      drawPetal(ctx, p);
    }
    for (let i = tapXi.length - 1; i >= 0; i--) {
      const x = tapXi[i];
      if (move) {
        x.life += 1;
        x.vy += 0.09;
        x.y += x.vy;
        x.x += x.vx + Math.sin(x.life / 7) * 0.2;
        x.rot += x.spin;
        const fade = x.life / x.max;
        x.a = fade < 0.55 ? 1 : Math.max(0, 1 - (fade - 0.55) / 0.45);
        if (x.life >= x.max || x.a <= 0) tapXi.splice(i, 1);
      }
      drawXi(ctx, x);
    }
    ctx.globalAlpha = 1;
  };

  setInterval(() => draw(true), 33);
  draw(true);
}

function drawXi(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.a;
  const s = p.s;
  ctx.font = s + "px Songti SC, STSong, SimSun, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#C23B32";
  ctx.fillText("囍", 0, 0);
  ctx.restore();
}

function bindTapXi() {
  const spawn = (x, y) => {
    tapXi.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.1,
      vy: 0.6 + Math.random() * 0.5,
      rot: (Math.random() - 0.5) * 0.5,
      spin: (Math.random() - 0.5) * 0.05,
      s: 11 + Math.random() * 3,
      a: 1,
      life: 0,
      max: 38 + Math.random() * 16,
    });
    if (tapXi.length > 28) tapXi.splice(0, tapXi.length - 28);
  };
  const fromEvent = (e) => {
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    spawn(t.clientX, t.clientY);
  };
  let touchAt = 0;
  document.addEventListener(
    "touchstart",
    (e) => {
      if (document.body.classList.contains("is-signing")) return;
      const el = e.target;
      if (el && el.closest && el.closest("button, a, input, textarea, canvas")) return;
      touchAt = Date.now();
      fromEvent(e);
    },
    { passive: true, capture: true },
  );
  document.addEventListener(
    "mousedown",
    (e) => {
      if (Date.now() - touchAt < 800) return;
      fromEvent(e);
    },
    true,
  );
}

function bindGate(cfg) {
  const go = () => {
    $("seal").disabled = true;
    openLetter(cfg);
  };
  $("seal").addEventListener("click", go);
  // ponytail: ?open=1 skips the seal for content preview; remove once guests only get the share link
  if (new URLSearchParams(location.search).has("open")) go();
}

async function main() {
  const cfg = await loadConfig();
  const guest = guestFromSearch(location.search);
  applyShare(cfg);
  $("address").textContent = guest ? `恭请 ${guest}` : "恭请光临";
  renderNames(cfg);
  $("opener").textContent = cfg.opener || "";
  $("whenText").textContent = cfg.datetimeText || "";
  renderScrolls(cfg.photos);
  renderVenues(cfg.venues);
  renderRsvp(cfg, guest);
  renderWall(cfg, guest);
  $("colophon").innerHTML = `${coupleLine(cfg.groom, cfg.bride)}<br>${(cfg.datetimeText || "").split(/\s+/)[0] || ""}`;
  startClepsydra(cfg.datetime);
  bindBgm();
  bindGate(cfg);
  bindTapXi();
  startFoil($("foil"));
}

main().catch(() => {
  $("gate").querySelector(".gate-hint").textContent = "信笺未至，请用本地服务打开";
});
