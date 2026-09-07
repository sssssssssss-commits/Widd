const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-max-age": "86400",
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

function imageOk(s) {
  return (
    typeof s === "string" &&
    s.length >= 80 &&
    s.length <= 120000 &&
    /^data:image\/(jpeg|jpg|png);base64,/i.test(s)
  );
}

async function listWall(env) {
  const listed = await env.RSVP.list({ prefix: "sig:" });
  const rows = (
    await Promise.all(listed.keys.map((k) => env.RSVP.get(k.name, "json")))
  ).filter(Boolean);
  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return rows.slice(-80).map(({ id, name, img, at, by, epoch }) => ({ id, name, img, at, by, epoch }));
}

async function countMine(env, by) {
  const listed = await env.RSVP.list({ prefix: "sig:" });
  const hits = await Promise.all(
    listed.keys.map(async (k) => {
      if (k.metadata && k.metadata.by != null) return String(k.metadata.by) === by;
      const row = await env.RSVP.get(k.name, "json");
      return !!(row && String(row.by || "") === by);
    }),
  );
  return hits.filter(Boolean).length;
}

async function saveWall(env, body) {
  const name = clip(body.name, 20) || "来宾";
  const by = clip(body.by, 80);
  const img = String(body.img || "");
  if (!imageOk(img)) return json({ ok: false }, 400);
  if (by && (await countMine(env, by)) >= 3) return json({ ok: false }, 409);
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const row = {
    id,
    name,
    img,
    at: new Date().toISOString(),
    by,
    epoch: Number(body.epoch) || 0,
  };
  await env.RSVP.put(`sig:${id}`, JSON.stringify(row), { metadata: { by } });
  return json({ ok: true, id, name, at: row.at });
}

async function clearMine(env, body) {
  const by = clip(body.by, 80);
  const ids = (Array.isArray(body.ids) ? body.ids : [])
    .map((id) => clip(id, 80))
    .filter(Boolean)
    .slice(0, 20);
  if (!by && !ids.length) return json({ ok: false }, 400);
  await Promise.all(ids.map((id) => env.RSVP.delete(`sig:${id}`)));
  if (!by) return json({ ok: true });
  const listed = await env.RSVP.list({ prefix: "sig:" });
  await Promise.all(
    listed.keys.map(async (k) => {
      const row = await env.RSVP.get(k.name, "json");
      if (row && String(row.by || "") === by) await env.RSVP.delete(k.name);
    }),
  );
  return json({ ok: true });
}

async function wipeWall(env, body, host) {
  if (!host || clip(body.host, 40) !== host) return json({ ok: false }, 403);
  const listed = await env.RSVP.list({ prefix: "sig:" });
  await Promise.all(listed.keys.map((k) => env.RSVP.delete(k.name)));
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method === "GET") return json({ ok: true, items: await listWall(env) });
    if (request.method !== "POST") return json({ ok: false }, 405);

    let body;
    try {
      body = JSON.parse(await request.text());
    } catch {
      return json({ ok: false }, 400);
    }

    if (body.kind === "wall") return saveWall(env, body);
    if (body.kind === "wall-mine") return clearMine(env, body);
    if (body.kind === "wall-wipe") return wipeWall(env, body, env.WALL_HOST);

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
