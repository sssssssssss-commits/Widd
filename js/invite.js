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
  max = max || 100000;
  return (
    typeof s === "string" &&
    s.length >= 80 &&
    s.length <= max &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(s)
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

function wallSlot(i) {
  const col = i % 2;
  const row = Math.floor(i / 2) % 6;
  return { left: col === 0 ? 3 : 71, top: 5 + row * 14.2 };
}

const RSVP_KEY = "widd-rsvp";
const WALL_KEY = "widd-wall";

const $ = (id) => document.getElementById(id);

async function loadConfig() {
  const res = await fetch("data/wedding.json?v=9", { cache: "no-store" });
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

  box.innerHTML = `<p class="rsvp-hint">请直接回复邀约人</p>`;
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
  localStorage.setItem(WALL_KEY, JSON.stringify(rows.slice(-80)));
}

function wallCard(item, fly) {
  if (!dataImageOk(item.img)) return "";
  const rot = wallRot(item.id || item.name);
  return `<figure class="wall-card${fly ? " is-in" : ""}" style="--rot:${rot}deg">
    <img src="${item.img}" alt="">
    <figcaption>${escAttr(item.name || "")}</figcaption>
  </figure>`;
}

function paintWallBoard(items, flyId) {
  const board = $("wallBoard");
  const empty = $("wallEmpty");
  if (!board) return;
  board.innerHTML = items.map((row) => wallCard(row, row.id === flyId)).join("");
  if (empty) empty.hidden = items.length > 0;
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
  const h = Math.max(112, Math.round(w * 0.4));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#fff8ef";
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1a0c08";
  ctx.lineWidth = 2.6;
  return ctx;
}

function bindWallPad(canvas, ctx) {
  let drawing = false;
  let last = null;
  const pt = (e) => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const down = (e) => {
    e.preventDefault();
    drawing = true;
    last = pt(e);
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = pt(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  };
  const up = () => {
    drawing = false;
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
  const tmp = document.createElement("canvas");
  tmp.width = 400;
  tmp.height = 160;
  const t = tmp.getContext("2d");
  t.fillStyle = "#fff8ef";
  t.fillRect(0, 0, 400, 160);
  t.drawImage(canvas, 0, 0, 400, 160);
  for (const q of [0.62, 0.48, 0.36]) {
    const s = tmp.toDataURL("image/jpeg", q);
    if (s.length <= 100000) return s;
  }
  return "";
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
  wall.innerHTML = `<div class="rsvp-box wall-box">
      <h2>签名墙</h2>
      <div class="wall-board" id="wallBoard"></div>
      <p class="wall-empty" id="wallEmpty">还没有落款</p>
      <label for="wallName">芳名</label>
      <input id="wallName" maxlength="20" value="${escAttr(guest)}" autocomplete="name">
      <canvas id="wallPad" width="560" height="224" aria-label="手写签名"></canvas>
      <div class="wall-actions">
        <button type="button" id="wallClear">重写</button>
        <button type="button" id="wallSign">题上</button>
      </div>
      <p class="wall-hint" id="wallHint">${url ? "请题一字，飞入墙上" : "先留在这台手机上；配上回执地址后宾客可同看"}</p>
    </div>`;

  const canvas = $("wallPad");
  const ctx = fitWallPad(canvas);
  bindWallPad(canvas, ctx);

  $("wallClear").addEventListener("click", () => fitWallPad(canvas));

  loadWallItems(url).then((items) => paintWallBoard(items));

  $("wallSign").addEventListener("click", async () => {
    const btn = $("wallSign");
    const hint = $("wallHint");
    const name = clipText($("wallName").value, 20);
    if (!name) {
      hint.textContent = "请写下芳名";
      return;
    }
    const ink = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (darkPixelCount(ink) < 80) {
      hint.textContent = "请先在框内手写签名";
      return;
    }
    const img = exportWallPad(canvas);
    if (!dataImageOk(img)) {
      hint.textContent = "签名过大，请写得再简一些";
      return;
    }
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      img,
      at: new Date().toISOString(),
    };
    btn.disabled = true;
    let shared = false;
    if (url) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "wall", name, img }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json().catch(() => ({}));
        if (data.id) item.id = data.id;
        shared = true;
      } catch {
        shared = false;
      }
    }
    if (!shared) writeLocalWall(readLocalWall().concat(item));
    else writeLocalWall(readLocalWall().filter((row) => row.img !== img));
    const items = await loadWallItems(url);
    if (!items.some((row) => row.img === img || row.id === item.id)) items.push(item);
    const flyId = (items.find((row) => row.img === img) || item).id;
    paintWallBoard(items, flyId);
    fitWallPad(canvas);
    hint.textContent = shared ? "已上墙" : url ? "已题于本机，稍后再试同看" : "已题于本机";
    btn.disabled = false;
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
    const pad = $("wallPad");
    if (pad) fitWallPad(pad);
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
  const PETAL = ["#C23B32", "#D4564A", "#B8322C", "#E07A6A"];
  const GOLD = ["#E8C85A", "#F4DC8A", "#D4A93A"];
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

  const petals = Array.from({ length: 22 }, (_, i) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    s: 10 + Math.random() * 12,
    vy: 0.45 + Math.random() * 0.55,
    amp: 0.55 + Math.random() * 0.75,
    sway: 36 + Math.random() * 28,
    spin: (Math.random() - 0.5) * 0.04,
    a: 0.72 + Math.random() * 0.22,
    c: PETAL[i % PETAL.length],
    rot: Math.random() * Math.PI * 2,
    ph: Math.random() * 1000,
  }));

  const motes = Array.from({ length: 55 }, (_, i) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    s: 1.8 + Math.random() * 2.8,
    w: 2.5 + Math.random() * 4.5,
    h: 1.1 + Math.random() * 1.6,
    vy: 0.18 + Math.random() * 0.32,
    a: 0.7 + Math.random() * 0.3,
    c: GOLD[i % GOLD.length],
    ph: Math.random() * 1000,
    twk: 14 + Math.random() * 18,
    spark: i % 4 === 0,
    rot: Math.random() * Math.PI,
  }));

  const petalPath = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const flip = 0.72 + 0.28 * Math.sin(p.ph);
    ctx.scale(flip, 1);
    const w = p.s;
    const h = p.s * 1.55;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.48);
    ctx.bezierCurveTo(-w, h * 0.18, -w * 0.35, -h * 0.42, 0, -h * 0.52);
    ctx.bezierCurveTo(w * 0.35, -h * 0.42, w, h * 0.18, 0, h * 0.48);
    ctx.fillStyle = p.c;
    ctx.globalAlpha = p.a;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.32);
    ctx.quadraticCurveTo(w * 0.06, 0, 0, -h * 0.38);
    ctx.strokeStyle = "rgba(232,200,90,0.75)";
    ctx.lineWidth = Math.max(0.5, p.s * 0.07);
    ctx.globalAlpha = p.a * 0.9;
    ctx.stroke();
    ctx.restore();
  };

  const mote = (ctx, g, t) => {
    const tw = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t / g.twk + g.ph));
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    ctx.globalAlpha = g.a * tw;
    ctx.fillStyle = g.c;
    ctx.fillRect(-g.w, -g.h, g.w * 2, g.h * 2);
    ctx.fillStyle = "#fff6d0";
    ctx.globalAlpha = g.a * tw * 0.5;
    ctx.fillRect(-g.w, -g.h, g.w * 0.9, g.h * 0.7);
    if (g.spark) {
      ctx.globalAlpha = g.a * tw;
      ctx.strokeStyle = g.c;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-g.w * 2.4, 0);
      ctx.lineTo(g.w * 2.4, 0);
      ctx.moveTo(0, -g.w * 2.4);
      ctx.lineTo(0, g.w * 2.4);
      ctx.stroke();
    }
    ctx.restore();
  };

  let t = 0;
  const draw = (move) => {
    t += 1;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const g of motes) {
      if (move) {
        g.y += g.vy;
        g.x += Math.sin(t / 55 + g.ph) * 0.18;
        g.rot += 0.01;
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
  const r = p.s;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#C23B32";
  ctx.fill();
  ctx.strokeStyle = "#E8C85A";
  ctx.lineWidth = Math.max(0.8, r * 0.08);
  ctx.stroke();
  ctx.fillStyle = "#F7E7C6";
  ctx.font = "700 " + (r * 1.2) + "px Songti SC, STSong, SimSun, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("囍", 0, r * 0.08);
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
      s: 13 + Math.random() * 6,
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
