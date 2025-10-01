// /api/eft-proxy.js
const ALLOW = new Set([
  "www.eft-ammo.com",
  "eft-ammo.com",
  "api.tarkov.dev",
  "tarkov.dev"
]);

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url" });

    const u = new URL(url);
    if (!ALLOW.has(u.host)) {
      return res.status(403).json({ error: `Host not allowed: ${u.host}` });
    }

    // 헤더 정리 (host 등 제거)
    const fwdHeaders = { "user-agent": "Mozilla/5.0" };
    if (req.headers["content-type"]) fwdHeaders["content-type"] = req.headers["content-type"];
    if (req.headers["accept"])       fwdHeaders["accept"]       = req.headers["accept"];

    // 바디 준비(POST 등)
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (typeof req.body === "string") body = req.body;
      else if (req.body) body = JSON.stringify(req.body);
    }

    const upstream = await fetch(url, {
      method: req.method || "GET",
      headers: fwdHeaders,
      body
    });

    const text = await upstream.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=60");
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json; charset=utf-8"
    );
    res.status(upstream.status).send(text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
