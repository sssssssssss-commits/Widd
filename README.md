# 夜色墨金婚礼请柬

手机竖信，微信里打开。点朱印拆开，金箔慢落。改 [data/wedding.json](data/wedding.json) 即可换姓名、日期、地点和照片。

签名墙按计划留到下一期：`signatureWall` 为 `false` 时，信末只显示「签名墙 · 即将开启」。

## 本地预览

不要用 `file://` 打开（`wedding.json` 会读不到）。

```bash
npx --yes serve .
```

浏览器打开提示的地址。加 `?to=张三` 可看称谓；加 `&open=1` 可跳过拆信直接看正文（改文案时用）。

自检：`node check.mjs`

## 改内容

编辑 `data/wedding.json`：

| 字段 | 含义 |
|---|---|
| `groom` / `bride` | 姓 + 名 |
| `opener` | 信首短启 |
| `datetime` | ISO 时间，给倒计时用，建议带 `+08:00` |
| `datetimeText` | 信上显示的日子（可写农历） |
| `venues` | `name`、`address`、`lat`、`lng`（高德坐标） |
| `photos` | 立轴图，竖图，每张压到 200–400KB |
| `rsvp.endpoint` | Cloudflare Worker 地址，有则显示回执表 |
| `rsvp.surveyUrl` | 没 Worker 时，按钮跳转腾讯问卷（同窗口，不嵌 iframe） |
| `share` | 网页标题，微信会抓 |

照片放到 `assets/photos/`，占位 SVG 可直接换掉。

## 发到网上（微信要能开）

不要用 GitHub Pages 当主链接，微信里经常打不开。

1. 把本仓库推上去。
2. [Cloudflare Pages](https://pages.cloudflare.com/) → Create → 接这个仓库。
3. 构建命令留空，输出目录填 `/`。
4. 用它给的 `*.pages.dev` 地址在**手机微信**里打开测。

有备案再把域名迁到腾讯云静态网站托管，微信里更稳。

微信分享卡：未认证公众号做不了定制图。微信会抓 `<title>` 和页面里第一张图（现在是朱印 SVG，换成一张方形 JPG 放到 `og:image` 更稳）。

## 回执

**方式 A（推荐）**：部署 `worker/`。

```bash
cd worker
npx wrangler kv namespace create RSVP
# 把 id 填进 wrangler.toml
npx wrangler deploy
```

把 Worker 的 `https://….workers.dev` 填进 `rsvp.endpoint`。

**方式 B**：建一份腾讯问卷，链接填进 `rsvp.surveyUrl`。两种都空时，页面只写「请直接回复邀约人」。

读回执：Cloudflare 控制台打开该 KV，或 `wrangler kv key list --binding RSVP`。

## 微信里怎么测

用手机微信打开 `pages.dev` 链接（不要只在电脑 Chrome 里看完就算）：

- 拆印、抽信、金箔
- `?to=名字` 称谓
- 倒计时
- 立轴能横滑
- 「高德出发 / 腾讯地图」能跳出
- 回执能提交或能跳到问卷
- 转发给自己，看标题和缩略图

系统开了「减少动态效果」时，拆信会直接入信，金箔停在原地。
