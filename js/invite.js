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

function wallRot(id) {
  let n = 0;
  for (const c of String(id || "")) n = (n + c.charCodeAt(0)) % 13;
  return n - 6;
}

function wallSpreadSlot(i, n) {
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

const RSVP_KEY = "widd-rsvp";
const WALL_KEY = "widd-wall";
const BY_KEY = "widd-by";
const GOLD_INK = "#D4A017";
// ponytail: public counter, 6-month TTL on GET; Worker KV epoch if rsvp.endpoint is live
const WALL_EPOCH_GET = "https://abacus.jasoncameron.dev/get/sssssssssss-github-io/widd-wall";

const $ = (id) => document.getElementById(id);

async function loadConfig() {
  const res = await fetch("data/wedding.json?v=11", { cache: "no-store" });
  if (!res.ok) throw new Error("wedding.json");
  return res.json();
}

function applyShare(cfg) {
  const title = cfg.share?.title || cfg.title || "婚礼请柬";
  const desc = cfg.share?.description || "一封信，等你拆";
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
  set('meta[property="og:image"]', "content", abs(cfg.share?.ogImage || cfg.share?.image));
  set('meta[name="twitter:image"]', "content", abs(cfg.share?.ogImage || cfg.share?.image));
  const thumb = document.querySelector(".share-thumb");
  if (thumb && cfg.share?.image) {
    thumb.src = cfg.share.image;
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

function wallEndpoint(cfg) {
  return cfg.wall?.endpoint || cfg.rsvp?.endpoint || "";
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

async function fetchWallEpoch(getUrl) {
  try {
    const res = await fetch(getUrl || WALL_EPOCH_GET, { cache: "no-store" });
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error();
    const data = await res.json();
    return Number(data.value) || 0;
  } catch {
    return 0;
  }
}

async function bumpWallEpoch(getUrl) {
  const res = await fetch(wallHitUrl(getUrl || WALL_EPOCH_GET), { cache: "no-store" });
  if (!res.ok) throw new Error();
  const data = await res.json();
  return Number(data.value) || 0;
}

function wallCard(item, i, fly, slot) {
  const src = item && item.img;
  if (!dataImageOk(src)) return "";
  const rot = wallRot(item.id || String(i));
  const pos = slot || wallSpreadSlot(i, i + 1);
  return `<figure class="wall-card${fly ? " is-in" : ""}" style="--rot:${rot}deg;--w:${pos.w}%;left:${pos.left}%;top:${pos.top}%">
    <img src="${src}" alt="">
  </figure>`;
}

function paintWallBoard(items, flyId) {
  const board = $("wallBoard");
  if (!board) return;
  const rows = (items || [])
    .filter((row) => dataImageOk(row && row.img))
    .slice()
    .sort((a, b) => {
      const ta = String(a.at || "");
      const tb = String(b.at || "");
      if (ta && tb && ta !== tb) return ta.localeCompare(tb);
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  const n = rows.length;
  board.innerHTML = rows
    .map((row, i) => wallCard(row, i, row.id === flyId, wallSpreadSlot(i, n)))
    .join("");
}

async function loadWallItems(url) {
  const local = readLocalWall();
  if (!url) return local;
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const remote = Array.isArray(data.items) ? data.items : [];
    const byId = new Map();
    for (const row of remote.concat(local)) {
      if (row && row.id) byId.set(row.id, row);
    }
    return [...byId.values()];
  } catch {
    return local;
  }
}

function fitWallPad(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 280;
  const h = canvas.clientHeight || Math.max(160, Math.round(w * 0.42));
  if (w < 8 || h < 8) return canvas.getContext("2d");
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = GOLD_INK;
  ctx.fillStyle = GOLD_INK;
  return ctx;
}

function padPoint(canvas, e) {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
  const r = canvas.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return { x: 0, y: 0 };
  if (innerHeight > innerWidth + 8) {
    return {
      x: (t.clientY - r.top) * (canvas.clientWidth / r.height),
      y: (r.right - t.clientX) * (canvas.clientHeight / r.width),
    };
  }
  return {
    x: (t.clientX - r.left) * (canvas.clientWidth / r.width),
    y: (t.clientY - r.top) * (canvas.clientHeight / r.height),
  };
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
  const stamp = (x, y, w) => {
    ctx.beginPath();
    ctx.fillStyle = GOLD_INK;
    ctx.arc(x, y, w / 2, 0, Math.PI * 2);
    ctx.fill();
    state.dirty = true;
  };
  const ribbon = (a, b, w0, w1) => {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / 1.2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stamp(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, w0 + (w1 - w0) * t);
    }
  };
  const down = (e) => {
    e.preventDefault();
    drawing = true;
    const p = padPoint(canvas, e);
    const w = widthOf(e, p);
    last = { x: p.x, y: p.y, w, t: e.timeStamp || Date.now() };
    stamp(p.x, p.y, w);
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

function exportWallPad(canvas) {
  const tryPng = (w, h) => {
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext("2d");
    t.clearRect(0, 0, w, h);
    t.drawImage(canvas, 0, 0, w, h);
    const png = tmp.toDataURL("image/png");
    return dataImageOk(png) ? png : "";
  };
  return tryPng(400, 160) || tryPng(280, 112) || tryPng(200, 80);
}

async function postWall(url, body) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
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
  const url = wallEndpoint(cfg);
  const host = isWallHost(location.search, cfg.wallHost);
  const by = wallBy();
  const epochUrl = cfg.wallEpoch || WALL_EPOCH_GET;
  wall.innerHTML = `<div class="wall-box">
      <h2>签名墙</h2>
      <div class="wall-yard">
        <div class="wall-xi" aria-hidden="true">囍</div>
        <div class="wall-veil" aria-hidden="true"></div>
        <div class="wall-frame">
          <div class="wall-board" id="wallBoard"></div>
        </div>
      </div>
      <div class="wall-actions">
        <button type="button" id="wallOpen">签字</button>
        <button type="button" id="wallMine">撤下我的</button>
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

  const canvas = $("wallPad");
  const pad = { dirty: false };
  let ctx = canvas.getContext("2d");
  bindWallPad(canvas, ctx, pad);

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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ctx = fitWallPad(canvas);
        pad.dirty = false;
      });
    });
  };

  const refresh = async (flyId) => {
    const epoch = await fetchWallEpoch(epochUrl);
    let items = wallAfterWipe(await loadWallItems(url), epoch);
    writeLocalWall(items);
    paintWallBoard(items, flyId);
    return items;
  };

  $("wallOpen").addEventListener("click", openSheet);
  $("wallCancel").addEventListener("click", closeSheet);
  $("wallClear").addEventListener("click", () => {
    ctx = fitWallPad(canvas);
    pad.dirty = false;
    $("wallSheetHint").textContent = "";
  });

  refresh();
  setInterval(refresh, 20000);

  $("wallMine").addEventListener("click", async () => {
    if (!window.confirm("确定撤下你留下的签名？")) return;
    const hint = $("wallHint");
    writeLocalWall(wallWithoutMine(readLocalWall(), by, !url));
    await postWall(url, { kind: "wall-mine", by });
    await refresh();
    hint.textContent = "已撤下你的签名";
  });

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
      shared = (await postWall(url, { kind: "wall-wipe", host: cfg.wallHost })) || shared;
      await refresh();
      hint.textContent = shared ? "墙上已清空" : "本机已清，别人手机需能联网才会一起清";
    });
  }

  $("wallPin").addEventListener("click", async () => {
    const btn = $("wallPin");
    const sheetHint = $("wallSheetHint");
    const hint = $("wallHint");
    const name = guest || "来宾";
    if (!pad.dirty) {
      sheetHint.textContent = "请先手写签名";
      return;
    }
    const img = exportWallPad(canvas);
    if (!dataImageOk(img)) {
      sheetHint.textContent = "签名未能保存，请再写一次";
      return;
    }
    const epoch = await fetchWallEpoch(epochUrl);
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      img,
      at: new Date().toISOString(),
      by,
      epoch,
    };
    btn.disabled = true;
    let shared = false;
    if (url) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "wall", name, img, by, epoch }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json().catch(() => ({}));
        if (data.id) item.id = data.id;
        shared = true;
      } catch {
        shared = false;
      }
    }
    try {
      if (!shared) writeLocalWall(readLocalWall().concat(item));
      else writeLocalWall(readLocalWall().filter((row) => row.img !== img));
    } catch {}
    let items = [];
    try {
      items = wallAfterWipe(await loadWallItems(url), epoch);
    } catch {
      items = readLocalWall();
    }
    if (!items.some((row) => row.img === img || row.id === item.id)) items.push(item);
    const flyId = (items.find((row) => row.img === img) || item).id;
    paintWallBoard(items, flyId);
    pad.dirty = false;
    hint.textContent = "已上墙";
    btn.disabled = false;
    closeSheet();
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

function openLetter() {
  const gate = $("gate");
  const env = $("envelope");
  const seal = $("seal");
  const letter = $("letter");

  seal.classList.add("is-bloom");
  env.classList.add("is-open");
  setTimeout(() => {
    gate.classList.add("is-gone");
    letter.hidden = false;
  }, 900);
}

let foilStarted = false;
const tapXi = [];

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
      petalPath(ctx, p);
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
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#E8C85A";
  ctx.lineWidth = Math.max(1.1, s * 0.12);
  ctx.strokeText("囍", 0, 0);
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

function bindGate() {
  const go = () => {
    $("seal").disabled = true;
    openLetter();
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
  bindGate();
  bindTapXi();
  startFoil($("foil"));
}

main().catch(() => {
  $("gate").querySelector(".gate-hint").textContent = "信笺未至，请用本地服务打开";
});
