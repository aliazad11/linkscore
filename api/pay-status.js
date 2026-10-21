// Payment state for the full-report unlock.
//   GET /api/pay-status                  -> { enabled, link }   (the gate asks once on load)
//   GET /api/pay-status?session_id=cs_... -> { paid, planId, email } after Stripe's redirect
import { PAY_LINK, paywallOn, isPaid } from "./_paid.js";

export const config = { maxDuration: 10 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;

const hits = new Map();
function rateOk(key, max) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) { for (const [k, v] of hits) { if (!v.length || now - v[v.length - 1] > 60000) hits.delete(k); } }
  return arr.length <= max;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  const enabled = paywallOn();
  const sid = req.query && typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (!sid) return res.status(200).json({ enabled, link: enabled ? PAY_LINK : null });

  if (!SESSION_RE.test(sid)) return res.status(400).json({ error: "Bad session" });
  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || "unknown";
  if (!rateOk("ip:" + ip, 90)) return res.status(429).json({ error: "Too many requests" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?plan_data->_paid->>session=eq." + encodeURIComponent(sid) + "&select=id,paid:plan_data->_paid&limit=1", {
      headers: { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) { console.error("[pay-status] " + r.status); return res.status(500).json({ error: "Lookup failed" }); }
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return res.status(200).json({ paid: false });
    const row = rows[0];
    // Only a webhook-signed stamp counts; anything else in plan_data is treated as unpaid.
    if (!isPaid(row.id, { _paid: row.paid })) return res.status(200).json({ paid: false });
    return res.status(200).json({ paid: true, planId: row.id, email: (row.paid && row.paid.email) || null });
  } catch (e) {
    console.error("[pay-status] " + ((e && e.name) || "error"));
    return res.status(500).json({ error: "Lookup failed" });
  }
}
