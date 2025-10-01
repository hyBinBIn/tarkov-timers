// /api/eft-proxy.js
// 허용 도메인만 통과시키는 안전한 CORS 프록시
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

    const upstream = await fetch(url, {
      method: "GET",
      headers: { "user-agent": "Mozilla/5.0" }
    });

    const bodyText = await upstream.text();

    // CORS 허용
    res.setHeader("Access-Control-Allow-Origin", "*");
    // 캐시(선택): CDN 60초
    res.setHeader("Cache-Control", "s-maxage=60");
    // 컨텐츠 타입 유지(없으면 JSON로 가정)
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json; charset=utf-8"
    );

    res.status(upstream.status).send(bodyText);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
