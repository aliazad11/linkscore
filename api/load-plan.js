// Serves a saved plan for shared /plan/UUID links. Replaces the old direct
// client-side read of the plans table, which required an anon SELECT policy
// and exposed the owner's email with it.
export const config = { maxDuration: 15 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const { planId } = req.body || {};
  if (!planId || typeof planId !== "string" || !UUID_RE.test(planId)) {
    return res.status(400).json({ error: "Missing planId" });
  }

  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/plans?id=eq." + encodeURIComponent(planId) + "&select=first_name,plan_data", {
      headers: { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY },
    });
    if (!r.ok) {
      const e = await r.text().catch(() => "");
      console.error("[load-plan] " + r.status + " " + e);
      return res.status(500).json({ error: "Lookup failed" });
    }
    const rows = await r.json();
    if (!rows || !rows.length || !rows[0].plan_data) {
      return res.status(404).json({ error: "Plan not found" });
    }
    return res.status(200).json({ first_name: rows[0].first_name || null, plan: rows[0].plan_data });
  } catch (e) {
    console.error("[load-plan] " + (e && e.message));
    return res.status(500).json({ error: "Lookup failed" });
  }
}
