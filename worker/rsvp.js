const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ ok: false }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false }, 400);
    }

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
