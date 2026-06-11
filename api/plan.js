// Serves the SPA shell for /plan/:id with PERSONALIZED Open Graph tags, so a
// shared plan link renders the owner's score/archetype card on LinkedIn instead
// of the generic homepage card. The browser still boots the same SPA, which
// reads /plan/:id and loads the plan as before. Fully defensive: any failure
// falls back to the unmodified shell, so the link always works.
export const config = { maxDuration: 15 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function setTag(html, re, value) {
  return html.replace(re, (m, p1, p2) => p1 + value + p2);
}

export default async function handler(req, res) {
  const id = (req.query && req.query.id) || "";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "www.linkedscore.app";
  const origin = "https://" + host;

  let html = "";
  try {
    const r = await fetch(origin + "/index.html");
    html = await r.text();
  } catch (e) { /* fall through */ }
  if (!html) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send('<!doctype html><html><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>');
  }

  if (UUID_RE.test(id) && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const pr = await fetch(SUPABASE_URL + "/rest/v1/plans?id=eq." + encodeURIComponent(id) + "&select=first_name,plan_data", {
        headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY },
      });
      const rows = await pr.json();
      if (rows && rows[0] && rows[0].plan_data) {
        const name = esc(rows[0].first_name || "A LinkedIn pro");
        const score = Math.max(0, Math.min(100, Math.round(Number(rows[0].plan_data.score) || 0)));
        const arch = esc(rows[0].plan_data.archetype || "");
        const title = name + " scored " + score + " on LinkedScore" + (arch ? " — " + arch : "");
        const desc = "See " + name + "'s LinkedIn score and growth plan. Get your own free score in minutes.";
        const url = "https://www.linkedscore.app/plan/" + id;
        const ogImg = origin + "/api/og?id=" + encodeURIComponent(id);

        html = setTag(html, /(<title>)[\s\S]*?(<\/title>)/, title);
        html = setTag(html, /(<meta name="description" content=")[^"]*(")/, desc);
        html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, title);
        html = setTag(html, /(<meta property="og:description" content=")[^"]*(")/, desc);
        html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, url);
        html = setTag(html, /(<meta property="og:image" content=")[^"]*(")/, ogImg);
        html = setTag(html, /(<meta name="twitter:title" content=")[^"]*(")/, title);
        html = setTag(html, /(<meta name="twitter:description" content=")[^"]*(")/, desc);
        html = setTag(html, /(<meta name="twitter:image" content=")[^"]*(")/, ogImg);
      }
    } catch (e) { /* leave generic tags */ }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
