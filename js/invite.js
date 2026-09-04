import { coupleLine, escAttr, guestFromSearch, mapLinks, pad2, remaining } from "./lib.js";

const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const RSVP_KEY = "widd-rsvp";

const $ = (id) => document.getElementById(id);

async function loadConfig() {
  const res = await fetch("data/wedding.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("wedding.json");
  return res.json();
}

function applyShare(cfg) {
  const title = cfg.share?.title || cfg.title || "婚礼请柬";
  const desc = cfg.share?.description || "一封信，等你拆";
  const origin = (cfg.share?.origin || "").replace(/\/$/, "");
  const abs = (p) => (origin && p ? `${origin}/${p.replace(/^\//, "")}` : p);
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
  $("stamp")?.classList.add("is-on");
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
  if (!REDUCE) setInterval(paint, 1000);
}

function openLetter() {
  const gate = $("gate");
  const env = $("envelope");
  const seal = $("seal");
  const letter = $("letter");
  const foil = $("foil");

  if (REDUCE) {
    gate.classList.add("is-gone");
    letter.hidden = false;
    startFoil(foil, true);
    return;
  }

  seal.classList.add("is-bloom");
  env.classList.add("is-open");
  setTimeout(() => {
    gate.classList.add("is-gone");
    letter.hidden = false;
    startFoil(foil, false);
  }, 900);
}

function startFoil(canvas, staticOnly) {
  const ctx = canvas.getContext("2d");
  const GOLD = ["#C4A35A", "#E8D48B", "#8A7040"];
  const fit = () => {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };
  fit();
  addEventListener("resize", fit, { passive: true });

  const n = staticOnly ? 22 : 50;
  const bits = Array.from({ length: n }, (_, i) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    s: 0.6 + Math.random() * 1.8,
    vy: 0.12 + Math.random() * 0.28,
    vx: (Math.random() - 0.5) * 0.25,
    a: 0.25 + Math.random() * 0.5,
    c: GOLD[i % GOLD.length],
    plum: i % 17 === 0,
    rot: Math.random() * Math.PI,
  }));

  const plum = (b) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.fillStyle = `rgba(140,47,43,${b.a})`;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.ellipse(0, -b.s * 2.2, b.s * 1.1, b.s * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(196,163,90,${b.a})`;
    ctx.beginPath();
    ctx.arc(0, 0, b.s * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const draw = (move) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      if (move) {
        b.y += b.vy;
        b.x += b.vx + Math.sin(b.y / 40) * 0.08;
        b.rot += 0.002;
        if (b.y > innerHeight + 8) {
          b.y = -8;
          b.x = Math.random() * innerWidth;
        }
      }
      if (b.plum) plum(b);
      else {
        ctx.fillStyle = b.c;
        ctx.globalAlpha = b.a;
        ctx.fillRect(b.x, b.y, b.s, b.s * 0.6);
        ctx.globalAlpha = 1;
      }
    }
    if (move) requestAnimationFrame(() => draw(true));
  };

  draw(!staticOnly);
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
  $("wallSoon").hidden = cfg.signatureWall === true;
  $("colophon").innerHTML = `${coupleLine(cfg.groom, cfg.bride)}<br>${(cfg.datetimeText || "").split(/\s+/)[0] || ""}`;
  startClepsydra(cfg.datetime);
  bindGate();
}

main().catch(() => {
  $("gate").querySelector(".gate-hint").textContent = "信笺未至，请用本地服务打开";
});
