import assert from "node:assert/strict";
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
} from "./js/lib.js";

assert.equal(guestFromSearch("?to=张三"), "张三");
assert.equal(guestFromSearch("?to=%E6%9D%8E%E5%9B%9B"), "李四");
assert.equal(guestFromSearch(""), "");
assert.equal(guestFromSearch("?to=一二三四五六七八九十一二三四五六七八九十一"), "一二三四五六七八九十一二三四五六七八九十");

assert.deepEqual(remaining(0, 0), { days: 0, hours: 0, minutes: 0, seconds: 0, past: true });
assert.deepEqual(remaining(1000, 500), { days: 0, hours: 0, minutes: 0, seconds: 0, past: true });
assert.deepEqual(remaining(0, 90_061_000), { days: 1, hours: 1, minutes: 1, seconds: 1, past: false });

assert.equal(pad2(3), "03");
assert.equal(coupleLine({ family: "李", name: "某" }, { family: "王", name: "某" }), "李某 与 王某");

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
  wallHitUrl("https://abacus.jasoncameron.dev/get/ns/key"),
  "https://abacus.jasoncameron.dev/hit/ns/key",
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
assert.ok(Math.abs(first.w - 50) < 1.2);
assert.ok(Math.abs(first.h - 50) < 1.2);
assert.ok(Math.abs(first.left + first.w / 2 - 50) < 1.2);
assert.ok(Math.abs(first.top + first.h / 2 - 50) < 1.2);
assert.ok(first.w * first.h >= 2300);
assert.ok(wallSpreadSlot(0, 4).w < first.w);
assert.ok(wallSpreadSlot(0, 9).w < wallSpreadSlot(0, 4).w);
assert.ok(wallSpreadSlot(0, 16).w < wallSpreadSlot(0, 9).w);
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

function rotBox(s, deg) {
  const r = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const si = Math.abs(Math.sin(r));
  const aw = s.w * c + s.h * si;
  const ah = s.w * si + s.h * c;
  const cx = s.left + s.w / 2;
  const cy = s.top + s.h / 2;
  return { left: cx - aw / 2, top: cy - ah / 2, w: aw, h: ah };
}

for (const n of [1, 2, 3, 4, 5, 9, 16, 30]) {
  const slots = Array.from({ length: n }, (_, i) => wallSpreadSlot(i, n));
  const sized = slots.map((s) => rotBox(s, 10));
  for (let i = 0; i < n; i++) {
    const s = slots[i];
    assert.ok(s.left >= -0.2 && s.left + s.w <= 100.2, `n=${n} i=${i} x`);
    assert.ok(s.top >= -0.2 && s.top + s.h <= 100.2, `n=${n} i=${i} y`);
    for (let j = i + 1; j < n; j++) {
      assert.equal(wallBoxesOverlap(s, slots[j], 0.2), false, `n=${n} ${i}/${j}`);
      assert.equal(wallBoxesOverlap(sized[i], sized[j], 0.05), false, `rot n=${n} ${i}/${j}`);
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
  title: "李某 与 王某 婚礼",
  startIso: "2026-10-06T11:18:00+08:00",
  endIso: "2026-10-06T14:30:00+08:00",
  location: "陕西省宝鸡市东营村",
  description: "良辰吉时，恭候光临！",
  url: "https://sumuyang.asia",
});
assert.match(icsSample, /BEGIN:VCALENDAR/);
assert.match(icsSample, /END:VCALENDAR/);
assert.match(icsSample, /SUMMARY:李某 与 王某 婚礼/);
assert.match(icsSample, /DTSTART:20261006T031800Z/);
assert.match(icsSample, /DTEND:20261006T063000Z/);
assert.match(icsSample, /TRIGGER:-PT2H/);
assert.match(icsSample, /TRIGGER:-P1D/);
assert.match(icsSample, /LOCATION:陕西省宝鸡市东营村/);

console.log("ok");
