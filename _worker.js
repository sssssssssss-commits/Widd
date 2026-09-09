const TITLE = "李某 与 王某 婚礼请柬";
const DESC = "锦书遥寄，待君亲启。";

function pageUrl(request) {
  const u = new URL(request.url);
  u.hash = "";
  return u.toString();
}

function shareImg(request) {
  return `${new URL(request.url).origin}/wx5.jpg`;
}

function isWxLinkCrawler(ua) {
  // ponytail: WeChat link-preview bot still sends Chrome/39; real app uses XWEB/mobile
  return /WindowsWechat/i.test(ua || "") && /Chrome\/39/i.test(ua || "");
}

function shareHtml(page, img) {
  return `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8">
<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<meta itemprop="name" content="${TITLE}">
<meta itemprop="description" content="${DESC}">
<meta itemprop="image" content="${img}">
<meta property="og:type" content="website">
<meta property="og:url" content="${page}">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESC}">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="300">
<meta property="og:image:height" content="300">
<link rel="image_src" href="${img}">
</head><body>
<img src="${img}" width="300" height="300" alt="${TITLE}">
</body></html>`;
}

function setAttr(name, value) {
  return {
    element(el) {
      el.setAttribute(name, value);
    },
  };
}

export default {
  async fetch(request, env) {
    const page = pageUrl(request);
    const img = shareImg(request);
    const url = new URL(request.url);
    if (
      request.method === "GET" &&
      isWxLinkCrawler(request.headers.get("user-agent")) &&
      (url.pathname === "/" || url.pathname === "/index.html")
    ) {
      return new Response(shareHtml(page, img), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=120",
        },
      });
    }

    const res = await env.ASSETS.fetch(request);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) return res;
    return new HTMLRewriter()
      .on('meta[property="og:url"]', setAttr("content", page))
      .on('meta[property="og:image"]', setAttr("content", img))
      .on('meta[property="og:image:secure_url"]', setAttr("content", img))
      .on('meta[itemprop="image"]', setAttr("content", img))
      .on('meta[name="twitter:image"]', setAttr("content", img))
      .on('link[rel="image_src"]', setAttr("href", img))
      .on("img.share-thumb", setAttr("src", img))
      .transform(res);
  },
};
