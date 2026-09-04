const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8" },
  });
}

function clip(v, n) {
  return String(v ?? "").trim().slice(0, n);
}

function jpegOk(s) {
  return (
    typeof s === "string" &&
    s.length >= 80 &&
    s.length <= 100000 &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(s)
  );
}

async function listWall(env) {
  const listed = await env.RSVP.list({ prefix: "sig:" });
  const rows = (
    await Promise.all(listed.keys.map((k) => env.RSVP.get(k.name, "json")))
  ).filter(Boolean);
  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return rows.slice(-80).map(({ id, name, img, at }) => ({ id, name, img, at }));
}

async function saveWall(env, body) {
  const name = clip(body.name, 20);
  const img = String(body.img || "");
  if (!name || !jpegOk(img)) return json({ ok: false }, 400);
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const row = { id, name, img, at: new Date().toISOString() };
  await env.RSVP.put(`sig:${id}`, JSON.stringify(row));
  return json({ ok: true, id, name, at: row.at });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method === "GET") return json({ ok: true, items: await listWall(env) });
    if (request.method !== "POST") return json({ ok: false }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false }, 400);
    }

    if (body.kind === "wall") return saveWall(env, body);

    const row = {
      name: clip(body.name, 20),
      attending: Boolean(body.attending),
      count: Math.min(20, Math.max(0, Number(body.count) || 0)),
      notes: clip(body.notes, 200),
      to: clip(body.to, 20),
      at: new Date().toISOString(),
    };
    if (!row.name) return json({ ok: false }, 400);

    const id = `${Date.now()}-${crypto.randomUUID()}`;
    await env.RSVP.put(id, JSON.stringify(row));
    return json({ ok: true });
  },
};
