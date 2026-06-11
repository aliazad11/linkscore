export const config = { maxDuration: 30 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const windowMs = 60000;
  const max = 20;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
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
  if (!rateOk(ip)) return res.status(429).json({ error: "Too many requests" });

  const body = req.body || {};
  const planId = body.planId;
  const email = body.email;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!planId || typeof planId !== "string" || !UUID_RE.test(planId)) return res.status(400).json({ error: "Missing planId" });
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
