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
  wallGridSlot,
  wallHitUrl,
  wallRot,
  wallWithoutMine,
  strokeWidthFromTouch,
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
assert.ok(Math.abs(wallRot("sig-1")) <= 6);

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

assert.ok(strokeWidthFromTouch(1, 0) > strokeWidthFromTouch(0.2, 0));
assert.ok(strokeWidthFromTouch(0, 0) > strokeWidthFromTouch(0, 3));

for (const n of [1, 4, 9, 16, 30]) {
  const slots = Array.from({ length: n }, (_, i) => wallGridSlot(i, n));
  for (let i = 0; i < n; i++) {
    const s = slots[i];
    assert.ok(s.left >= 0 && s.left + s.w <= 100.2, `n=${n} i=${i} x`);
    assert.ok(s.top >= 0 && s.top + s.h <= 100.2, `n=${n} i=${i} y`);
    for (let j = i + 1; j < n; j++) {
      assert.equal(wallBoxesOverlap(s, slots[j]), false, `n=${n} ${i}/${j}`);
    }
  }
}

const ink = new Uint8ClampedArray([10, 10, 10, 255, 250, 248, 239, 255]);
assert.equal(darkPixelCount(ink), 1);

console.log("ok");
