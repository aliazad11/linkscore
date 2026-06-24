// Serves a saved plan for /plan/UUID links.
//
// OWNER GATE (D16 + H34): the FULL plan (with the personal rewrites, keywords, calendar) is
// returned only to the signed-in owner — the session-cookie email must match the plan's email.
// Anyone else with the link gets a LIMITED payload (score + curated archetype only): enough to
// render the shareable result card, none of the personal profile content. This is the real PII
// lock. No Supabase key ever touches the client.
import { readSession } from "./_auth.js";

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
    const r = await fetch(SUPABASE_URL + "/rest/v1/plans?id=eq." + encodeURIComponent(planId) + "&select=first_name,cohort,email,plan_data", {
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
    const row = rows[0];
    const pd = row.plan_data || {};
    const session = readSession(req);
    const isOwner = !!(session && session.purpose === "session" && session.email &&
      row.email && session.email === String(row.email).toLowerCase());

    if (isOwner) {
      return res.status(200).json({ owner: true, first_name: row.first_name || null, cohort: row.cohort || null, plan: pd });
    }

    // Non-owner: limited share view only — score + archetype for the result card, nothing personal.
    const tl = pd.thought_leader && pd.thought_leader.available;
    const limited = {
      score: pd.score,
      archetype: pd.archetype,
      thought_leader: { available: !!tl, score: tl ? pd.thought_leader.score : 0 },
      _locale: pd._locale || "en",
      limited: true,
    };
    return res.status(200).json({ owner: false, first_name: row.first_name || null, cohort: row.cohort || null, plan: limited });
  } catch (e) {
    console.error("[load-plan] " + (e && e.message));
    return res.status(500).json({ error: "Lookup failed" });
  }
}
