// Lists the signed-in user's saved reports. Reads the session cookie (no body needed),
// looks up plans by the verified email server-side, and returns a lean list (id + score +
// archetype + cohort) — never the full plan_data. Node runtime (uses node:crypto via _auth).
import { readSession } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const session = readSession(req);
  if (!session || session.purpose !== "session" || !session.email) {
    return res.status(401).json({ error: "Not signed in" });
  }

  try {
    const r = await fetch(
      SUPABASE_URL + "/rest/v1/plans?email=eq." + encodeURIComponent(session.email) + "&select=id,cohort,plan_data",
      { headers: { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY } }
    );
    if (!r.ok) return res.status(500).json({ error: "Lookup failed" });
    const rows = await r.json();
    const plans = (rows || []).map((row) => {
      const pd = row.plan_data || {};
      return { planId: row.id, cohort: row.cohort || null, score: Number(pd.score) || null, archetype: pd.archetype || null };
    });
    return res.status(200).json({ email: session.email, plans });
  } catch (e) {
    console.error("[my-plans] " + (e && e.message));
    return res.status(500).json({ error: "Lookup failed" });
  }
}
