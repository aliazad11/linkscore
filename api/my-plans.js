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
    const headers = { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY };
    const base = SUPABASE_URL + "/rest/v1/plans?email=eq." + encodeURIComponent(session.email);
    // Newest report first. created_at is Supabase's default row timestamp; if the table
    // happens to lack it, fall back to an unordered fetch so the dashboard still loads.
    let r = await fetch(base + "&select=id,cohort,first_name,plan_data,created_at&order=created_at.desc", { headers });
    if (!r.ok) r = await fetch(base + "&select=id,cohort,first_name,plan_data", { headers });
    if (!r.ok) return res.status(500).json({ error: "Lookup failed" });
    const rows = await r.json();
    const plans = (rows || []).map((row) => {
      const pd = row.plan_data || {};
      return {
        planId: row.id,
        cohort: row.cohort || null,
        firstName: row.first_name || null,
        score: Number(pd.score) || null,
        archetype: pd.archetype || null,
        createdAt: row.created_at || null,
      };
    });
    // Top fixes from the newest report, surfaced as the dashboard's "next moves" checklist.
    const top = rows && rows[0] && rows[0].plan_data;
    const latestMoves = (top && Array.isArray(top.profile_fixes))
      ? top.profile_fixes.filter((x) => typeof x === "string" && x.trim()).slice(0, 3)
      : [];
    // Reusable assets from the newest report for the dashboard "your toolkit" + identity blurb.
    const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : "");
    const latestAssets = top ? {
      headlineRewrite: str(top.headline_rewrite),
      aboutRewrite: str(top.about_rewrite),
      hooks: Array.isArray(top.post_hooks) ? top.post_hooks.filter((h) => typeof h === "string" && h.trim()).slice(0, 3) : [],
      closingMessage: str(top.closing_message),
    } : null;
    return res.status(200).json({ email: session.email, plans, latestMoves, latestAssets });
  } catch (e) {
    console.error("[my-plans] " + (e && e.message));
    return res.status(500).json({ error: "Lookup failed" });
  }
}
