export const config = { maxDuration: 30 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

// Unlock attempts are cheap (one Supabase read + patch) and need a valid plan UUID, so
// the limiter is keyed per plan and per browser, with a generous per-IP ceiling: a
// classroom or an office shares one IP, and the old 20/min per IP would have turned a
// professor saying "now enter your email" into a wall of 429s (same failure class as
// the generate-plan limiter fixed in PR #56).
const hits = new Map();
function rateOk(key, max) {
  const now = Date.now();
  const windowMs = 60000;
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) { for (const [k, v] of hits) { if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k); } }
  return arr.length <= max;
}

function validEmail(e) {
  if (!e || typeof e !== "string") return false;
  e = e.trim();
  if (e.length < 5 || e.length > 254) return false;
  if (e.indexOf(" ") > -1) return false;
  const at = e.indexOf("@");
  if (at < 1) return false;
  const dot = e.indexOf(".", at);
  if (dot < at + 2) return false;
  if (dot === e.length - 1) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || "unknown";
  if (!rateOk("ip:" + ip, 150)) return res.status(429).json({ error: "Too many requests" });

  const body = req.body || {};
  const planId = body.planId;
  const email = body.email;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!planId || typeof planId !== "string" || !UUID_RE.test(planId)) return res.status(400).json({ error: "Missing planId" });
  if (!rateOk("plan:" + planId, 12)) return res.status(429).json({ error: "Too many requests" });
  const rawClient = req.headers["x-client-id"];
  const clientId = (typeof rawClient === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(rawClient)) ? rawClient : null;
  if (clientId && !rateOk("client:" + clientId, 30)) return res.status(429).json({ error: "Too many requests" });
  if (!validEmail(email)) return res.status(400).json({ error: "A valid email is required" });
  const cleanEmail = email.trim().toLowerCase();

  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?id=eq." + encodeURIComponent(planId) + "&select=plan_data", {
      headers: { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY },
    });
    if (!r.ok) {
      const e = await r.text().catch(() => "");
      console.error("[gated_plans select] " + r.status + " " + e);
      return res.status(500).json({ error: "Lookup failed" });
    }
    const rows = await r.json();
    if (!rows || !rows.length) return res.status(404).json({ error: "Plan not found or expired" });
    const plan = rows[0].plan_data;

    await fetch(SUPABASE_URL + "/rest/v1/gated_plans?id=eq." + encodeURIComponent(planId), {
      method: "PATCH",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: cleanEmail, unlocked_at: new Date().toISOString() }),
    }).catch(() => {});

    await fetch(SUPABASE_URL + "/rest/v1/subscribers", {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates",
      },
      body: JSON.stringify({ email: cleanEmail }),
    }).catch(() => {});

    return res.status(200).json({ plan: plan });
  } catch (e) {
    console.error("[get-plan] " + (e && e.message));
    return res.status(500).json({ error: "Lookup failed" });
  }
}
