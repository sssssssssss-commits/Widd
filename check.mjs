import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  clipText,
  coupleLine,
  darkPixelCount,
  dataImageOk,
  escAttr,
  guestFromSearch,
  isWallHost,
  mapLinks,
  pad2,
  remaining,
  wallAfterWipe,
  wallBoxesOverlap,
  wallSpreadSlot,
  wallPageCount,
  wallSlotOnWall,
  wallPaintRows,
  WALL_PAGE,
  wallHitUrl,
  wallMineCount,
  wallRot,
  wallWithoutMine,
  wallExceptHidden,
  strokeWidthFromTouch,
  cssQuarterTurn,
  padMapTouch,
  inkBounds,
  ptsBounds,
  buildIcsCalendar,
  calendarOpeners,
  coverBox,
} from "./js/lib.js";

assert.equal(guestFromSearch("?to=张三"), "张三");
assert.equal(guestFromSearch("?to=%E6%9D%8E%E5%9B%9B"), "李四");
assert.equal(guestFromSearch(""), "");
assert.equal(guestFromSearch("?to=一二三四五六七八九十一二三四五六七八九十一"), "一二三四五六七八九十一二三四五六七八九十");

assert.deepEqual(remaining(0, 0), { days: 0, hours: 0, minutes: 0, seconds: 0, past: true });
assert.deepEqual(remaining(1000, 500), { days: 0, hours: 0, minutes: 0, seconds: 0, past: true });
assert.deepEqual(remaining(0, 90_061_000), { days: 1, hours: 1, minutes: 1, seconds: 1, past: false });

assert.equal(pad2(3), "03");
assert.equal(coupleLine({ family: "苏", name: "超凡" }, { family: "杨", name: "雨洁" }), "苏超凡 与 杨雨洁");

const links = mapLinks({ name: "锦绣厅", address: "某路", lat: 31.2, lng: 121.4 });
assert.match(links.amap, /121\.4,31\.2/);
assert.match(links.amap, /%E9%94%A6%E7%BB%A3%E5%8E%85/);
assert.match(links.tencent, /31\.2,121\.4/);
assert.match(links.tencent, /referer=widd/);

assert.equal(escAttr(`张"三`), "张&quot;三");
assert.equal(escAttr("<x>"), "&lt;x&gt;");

assert.equal(clipText("  张三  ", 20), "张三");
assert.equal(clipText("一二三四五六七八九十一", 4), "一二三四");
assert.equal(dataImageOk("data:image/jpeg;base64,QQ=="), false);
assert.equal(
  dataImageOk(`data:image/jpeg;base64,${"A".repeat(80)}=`),
  true,
);
assert.equal(dataImageOk("data:image/png;base64," + "A".repeat(80), 100000), true);
assert.equal(wallRot("abc"), wallRot("abc"));
assert.ok(Math.abs(wallRot("sig-1")) <= 10);
assert.equal(wallMineCount([{ by: "a" }, { by: "a" }, { by: "a" }, { by: "b" }], "a"), 3);
assert.equal(wallMineCount([], "a"), 0);

assert.equal(isWallHost("?host=xi8k2m", "xi8k2m"), true);
assert.equal(isWallHost("?open=1&host=xi8k2m", "xi8k2m"), true);
assert.equal(isWallHost("?host=no", "xi8k2m"), false);
assert.equal(isWallHost("", "xi8k2m"), false);
assert.equal(isWallHost("?host=xi8k2m", ""), false);
assert.equal(
  wallHitUrl("https://example.test/get/ns/key"),
  "https://example.test/hit/ns/key",
);
assert.deepEqual(
  wallAfterWipe([{ epoch: 0 }, { epoch: 2 }, { epoch: 3 }], 2).map((r) => r.epoch),
  [2, 3],
);
assert.deepEqual(
  wallWithoutMine([{ by: "a" }, { by: "b" }, {}], "a", true).map((r) => r.by),
  ["b"],
);
assert.equal(wallWithoutMine([{ by: "a" }, {}], "a", false).length, 1);
assert.deepEqual(
  wallExceptHidden(
    [{ id: "1", img: "a" }, { id: "2", img: "b" }],
    { ids: ["1"], imgs: ["b"] },
  ).map((r) => r.id),
  [],
);
assert.equal(wallExceptHidden([{ id: "3" }], { ids: ["1"], imgs: [] }).length, 1);

assert.ok(strokeWidthFromTouch({ force: 0.9, radius: 0, speed: 0 }) > strokeWidthFromTouch({ force: 0.2, radius: 0, speed: 0 }));
assert.ok(strokeWidthFromTouch({ force: 0, radius: 24, speed: 0.12 }) > strokeWidthFromTouch({ force: 0, radius: 8, speed: 0.12 }));
assert.ok(strokeWidthFromTouch({ force: 0, radius: 0, speed: 0.05 }) > strokeWidthFromTouch({ force: 0, radius: 0, speed: 0.8 }));
const thick = strokeWidthFromTouch({ speed: 0.03 }, 4, 8);
const thin = strokeWidthFromTouch({ speed: 0.8 }, 4, 8);
assert.ok(thick / thin > 1.4 && thick / thin < 2.6);

const first = wallSpreadSlot(0, 1);
assert.ok(Math.abs(first.w - 62) < 1.2);
assert.ok(Math.abs(first.h - 62) < 1.2);
assert.ok(Math.abs(first.left + first.w / 2 - 50) < 1.2);
assert.ok(Math.abs(first.top + first.h / 2 - 50) < 1.2);
assert.ok(first.w * first.h >= 2300);
assert.ok(wallSpreadSlot(0, 4).w < first.w);
assert.ok(wallSpreadSlot(0, 9).w < wallSpreadSlot(0, 4).w);
assert.ok(wallSpreadSlot(0, 16).w < wallSpreadSlot(0, 9).w);
assert.ok(wallSpreadSlot(0, 9).w > 16);
assert.ok(wallSpreadSlot(0, 15).w > 12);
assert.equal(wallPageCount(0), 1);
assert.equal(wallPageCount(15), 1);
assert.equal(wallPageCount(16), 2);
assert.equal(wallPageCount(30), 2);
assert.equal(wallPageCount(31), 3);
{
  const a = wallSlotOnWall(0, 16);
  const b = wallSlotOnWall(15, 16);
  assert.equal(a.page, 0);
  assert.equal(a.pages, 2);
  assert.equal(a.onPage, 15);
  assert.equal(b.page, 1);
  assert.equal(b.onPage, 1);
  assert.ok(Math.abs(a.w - wallSpreadSlot(0, 15).w) < 0.01);
  assert.ok(Math.abs(b.w - 62) < 1.2);
  assert.ok(a.w > 12);
  assert.ok(a.w > wallSpreadSlot(0, 16).w);
}
{
  const png = "data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const mixed = [
    { id: "b", at: "2026-01-02T00:00:00.000Z", img: png },
    { id: "a", at: "2026-01-01T00:00:00.000Z", img: png },
    { id: "c", at: "2026-01-02T00:00:00.000Z", img: png },
  ];
  const once = wallPaintRows(mixed).map((r) => r.id).join(",");
  const twice = wallPaintRows(mixed.slice().reverse()).map((r) => r.id).join(",");
  assert.equal(once, "a,b,c");
  assert.equal(twice, once);
}
{
  const near = wallSpreadSlot(0, 9);
  const far = wallSpreadSlot(8, 9);
  const dist = (s) => {
    const x = s.left + s.w / 2 - 50;
    const y = s.top + s.h / 2 - 50;
    return x * x + y * y;
  };
  assert.ok(dist(near) < dist(far));
  const xs = new Set(Array.from({ length: 9 }, (_, i) => wallSpreadSlot(i, 9).left.toFixed(1)));
  assert.ok(xs.size >= 6);
}

for (const n of [1, 2, 3, 4, 5, 9, 16, 30]) {
  const slots = Array.from({ length: n }, (_, i) => wallSpreadSlot(i, n));
  for (let i = 0; i < n; i++) {
    const s = slots[i];
    assert.ok(s.left >= -0.2 && s.left + s.w <= 100.2, `n=${n} i=${i} x`);
    assert.ok(s.top >= -0.2 && s.top + s.h <= 100.2, `n=${n} i=${i} y`);
    for (let j = i + 1; j < n; j++) {
      assert.equal(wallBoxesOverlap(s, slots[j], s.w * 0.37), false, `n=${n} ${i}/${j}`);
    }
  }
}

for (const n of [16, 30, 31]) {
  const pages = wallPageCount(n);
  for (let p = 0; p < pages; p++) {
    const onPage = p === pages - 1 ? n - p * WALL_PAGE : WALL_PAGE;
    const slots = Array.from({ length: onPage }, (_, i) => wallSpreadSlot(i, onPage));
    for (let i = 0; i < onPage; i++) {
      for (let j = i + 1; j < onPage; j++) {
        assert.equal(wallBoxesOverlap(slots[i], slots[j], slots[i].w * 0.37), false, `page n=${n} p=${p} ${i}/${j}`);
      }
    }
  }
}

const ink = new Uint8ClampedArray([10, 10, 10, 255, 250, 248, 239, 255]);
assert.equal(darkPixelCount(ink), 1);

assert.equal(cssQuarterTurn("none"), false);
assert.equal(cssQuarterTurn("matrix(0, 1, -1, 0, 12, 8)"), true);
assert.equal(cssQuarterTurn("matrix(1, 0, 0, 1, 0, 0)"), false);
const box = { left: 0, top: 0, right: 100, width: 100, height: 200 };
assert.deepEqual(padMapTouch(box, 50, 0, 200, 100, true), { x: 0, y: 50 });
assert.deepEqual(padMapTouch(box, 0, 0, 200, 100, false), { x: 0, y: 0 });

const pix = new Uint8ClampedArray(4 * 4);
pix[4 * 3 + 3] = 255;
assert.deepEqual(inkBounds(pix, 2, 2), { minX: 1, minY: 1, maxX: 1, maxY: 1 });
assert.equal(inkBounds(new Uint8ClampedArray(16), 2, 2), null);
assert.deepEqual(ptsBounds([{ x: 10, y: 20, w: 4 }]), { minX: 6.8, minY: 16.8, maxX: 13.2, maxY: 23.2 });
assert.equal(ptsBounds([]), null);

const icsSample = buildIcsCalendar({
  title: "苏超凡 与 杨雨洁 婚礼",
  startIso: "2026-10-06T11:18:00+08:00",
  endIso: "2026-10-06T14:30:00+08:00",
  location: "陕西省宝鸡市东营村",
  description: "良辰吉时，恭候光临！",
  url: "https://sumuyang.asia",
});
assert.match(icsSample, /BEGIN:VCALENDAR/);
assert.match(icsSample, /END:VCALENDAR/);
assert.match(icsSample, /SUMMARY:苏超凡 与 杨雨洁 婚礼/);
assert.match(icsSample, /DTSTART:20261006T031800Z/);
assert.match(icsSample, /DTEND:20261006T063000Z/);
assert.match(icsSample, /TRIGGER:-PT2H/);
assert.match(icsSample, /TRIGGER:-P1D/);
assert.match(icsSample, /LOCATION:陕西省宝鸡市东营村/);

const openers = calendarOpeners({
  icsUrl: "https://sumuyang.asia/wedding.ics",
  title: "苏超凡 与 杨雨洁 婚礼",
  startIso: "2026-10-06T11:18:00+08:00",
  endIso: "2026-10-06T14:30:00+08:00",
  location: "陕西省宝鸡市东营村",
  description: "良辰吉时，敬请光临！",
});
assert.equal(openers.webcal, "webcal://sumuyang.asia/wedding.ics");
assert.match(openers.intent, /^intent:\/\//);
assert.match(openers.intent, /action=android\.intent\.action\.INSERT/);
assert.match(openers.intent, new RegExp(`l\\.beginTime=${Date.parse("2026-10-06T11:18:00+08:00")}`));
assert.match(openers.intent, /S\.title=/);
assert.match(openers.intent, /browser_fallback_url=/);

{
  const tall = coverBox(390, 844, 625, 1024);
  assert.ok(Math.abs(tall.h - 844) < 1);
  assert.ok(tall.w > 390);
  assert.ok(tall.x < 0);
  assert.ok(Math.abs(tall.y) < 1);
  const wide = coverBox(1024, 768, 625, 1024);
  assert.ok(wide.w >= 1024 - 1);
  assert.ok(wide.y <= 0);
  const right = coverBox(390, 844, 625, 1024, 1);
  assert.ok(Math.abs(right.x + right.w - 390) < 1);
  const xi = right.x + right.w * 0.9136;
  assert.ok(xi > 40 && xi < 390);
}

{
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./css/invite.css", import.meta.url), "utf8");
  const js = readFileSync(new URL("./js/invite.js", import.meta.url), "utf8");
  assert.match(html, /assets\/cover\.jpg\?v=4/);
  assert.match(html, /width="625"/);
  assert.match(html, /id="flaps"/);
  assert.match(html, /祝福墙 · 即将开启/);
  assert.doesNotMatch(html, /seal-face/);
  assert.doesNotMatch(html, /签名墙/);
  assert.match(html, /calendar\.jpg\?v=3/);
  assert.match(html, /width="1024"/);
  assert.match(html, /cal-img/);
  assert.match(html, /gate-tap/);
  assert.match(html, /<b>丨<\/b><i>·<\/i><span>轻触开启<\/span><i>·<\/i><b>丨<\/b>/);
  assert.doesNotMatch(html, /gate-tap[\s\S]{0,80}—/);
  assert.doesNotMatch(html, /「/);
  assert.doesNotMatch(html, /」/);
  assert.match(html, /轻触开启/);
  assert.doesNotMatch(html, /轻触打开/);
  assert.match(js, /1680/);
  assert.match(css, /\.gate-tap[\s\S]{0,240}z-index:\s*7/);
  assert.match(css, /\.gate-tap[\s\S]{0,520}color:\s*#F4DC8A/);
  assert.match(css, /letter-rise/);
  assert.match(js, /letter\.classList\.add\("is-in"\)/);
  assert.match(js, /paintWhen/);
  assert.doesNotMatch(html, /cal-img[^>]+loading="lazy"/);
  assert.match(html, /苏超凡 与 杨雨洁/);
  assert.match(css, /\.bless-line[\s\S]{0,240}font-family:\s*"WiddJin"/);
  assert.doesNotMatch(js, /is-now/);
  assert.doesNotMatch(css, /\.bless-line\.is-now/);
  assert.doesNotMatch(html, /id="address"/);
  assert.doesNotMatch(html, /id="opener"/);
  assert.match(css, /\.names \.name[\s\S]{0,160}font-family:\s*"WiddName"/);
  assert.match(css, /--name:\s*clamp\(2\.6rem, 11vw, 4\.9rem\)/);
  assert.match(css, /\.names \.name[\s\S]{0,360}scaleY\(1\.14\)/);
  assert.match(css, /\.names-row/);
  assert.match(css, /WiddWall/);
  assert.match(css, /flap-top/);
  assert.match(css, /writing-mode:\s*vertical-rl/);
  assert.doesNotMatch(js, /新郎/);
  assert.doesNotMatch(js, /names-roles/);
  const bless = JSON.parse(readFileSync(new URL("./data/wedding.json", import.meta.url), "utf8")).blessing;
  assert.equal(bless[1], "很开心这一天您专为我们而来");
  assert.equal(bless[3], "在时间的长河和空间的维度里");
  assert.equal(bless[5], "我觉得很幸运很幸福");
  assert.match(css, /\.bless-line[\s\S]{0,200}font-size:\s*1\.4rem/);
  assert.match(css, /\.wall-box h2[\s\S]{0,200}font-size:\s*2\.8rem/);
  assert.match(css, /\.cal-img/);
  assert.match(css, /--seal-y/);
  assert.match(js, /COVER_W = 625/);
  assert.match(js, /COVER_H = 1024/);
  assert.match(js, /SEAL_PX = 0\.9136/);
  assert.match(js, /<h2>祝福墙<\/h2>/);
  assert.match(js, /id="wallOpen">祝福</);
  assert.match(js, /id="wallMine">撤下</);
  assert.doesNotMatch(js, /撤下我的/);
  assert.doesNotMatch(js, /id="wallOpen">签字</);
  assert.match(css, /\.wall-box h2[\s\S]{0,280}color:\s*#C23B32/);
  assert.doesNotMatch(css, /\.wall-box h2[\s\S]{0,360}-webkit-text-stroke/);
  assert.match(css, /\.wall-actions button[\s\S]{0,700}border-radius:\s*999px/);
  assert.match(css, /\.wall-actions button[\s\S]{0,400}font-size:\s*1\.125rem/);
  assert.match(css, /\.wall-actions button[\s\S]{0,280}Heiti SC/);
  assert.doesNotMatch(css, /WiddCao/);
  assert.doesNotMatch(html, /cao\.woff/);
  assert.match(html, /flap-cut/);
  assert.match(js, /is-burst[\s\S]{0,180}is-open/);
  assert.doesNotMatch(js, /prefers-reduced-motion/);
  assert.doesNotMatch(js, /}, 220\)/);
  assert.match(js, /id="wallYards"/);
  assert.match(js, /WALL_PAGE = 15/);
  assert.match(js, /setInterval\(refresh, 4000\)/);
  assert.doesNotMatch(js, /isWallMany/);
  assert.doesNotMatch(js, /q\.get\("many"\)/);
  assert.doesNotMatch(js, /\bwho\b/);
  assert.match(css, /\.timeline[\s\S]{0,160}width:\s*max-content/);
  assert.match(css, /\.timeline::before[\s\S]{0,160}left:\s*68px/);
  assert.doesNotMatch(css, /grid-template-columns:\s*1fr 20px 1fr/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /lastShared/);
  assert.match(css, /\.wall-yards/);
  assert.match(css, /\.wall-paper/);
  assert.doesNotMatch(css, /\.wall-yard::before/);
  assert.match(js, /class="wall-paper"/);
  assert.match(js, /assets\/wall\.jpg\?v=1/);
  assert.match(css, /\.wall-card img[\s\S]{0,200}scale\(1\.12\)/);
  assert.match(js, /names-row/);
  assert.match(js, /is-burst/);
  assert.match(js, /is-open/);
  assert.doesNotMatch(js, /is-spin/);
  assert.match(css, /seal-burst/);
  assert.doesNotMatch(css, /seal-spin/);
  assert.doesNotMatch(js, /has\("open"\)/);
  assert.doesNotMatch(js, /github\.io/);
  assert.doesNotMatch(html, /github\.io/);
  assert.match(html, /rel="canonical" href="https:\/\/sumuyang\.asia\/"/);
  assert.match(html, /location\.replace\("https:\/\/sumuyang\.asia\/"\)/);
  const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");
  assert.match(readme, /https:\/\/sumuyang\.asia\//);
  assert.doesNotMatch(readme, /github\.io/);
  assert.doesNotMatch(readme, /jsdelivr/);
  assert.doesNotMatch(readme, /\?wx=/);
  assert.doesNotMatch(readme, /\?open=/);
  assert.ok(readFileSync(new URL("./assets/fonts/jin.woff2", import.meta.url)).byteLength > 1000);
  assert.ok(readFileSync(new URL("./assets/fonts/name.woff2", import.meta.url)).byteLength > 1000);
  assert.ok(readFileSync(new URL("./assets/fonts/wall.woff2", import.meta.url)).byteLength > 1000);
  assert.equal(existsSync(new URL("./assets/fonts/cao.woff2", import.meta.url)), false);
  assert.equal(existsSync(new URL("./assets/calendar.png", import.meta.url)), false);
  assert.equal(existsSync(new URL("./assets/fonts/qing.woff2", import.meta.url)), false);
  assert.equal(existsSync(new URL("./assets/fonts/xing.woff2", import.meta.url)), false);
}

console.log("ok");
