import assert from "node:assert/strict";
import {
  clipText,
  coupleLine,
  darkPixelCount,
  dataImageOk,
  escAttr,
  guestFromSearch,
  mapLinks,
  pad2,
  remaining,
  wallRot,
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

const ink = new Uint8ClampedArray([10, 10, 10, 255, 250, 248, 239, 255]);
assert.equal(darkPixelCount(ink), 1);

console.log("ok");
