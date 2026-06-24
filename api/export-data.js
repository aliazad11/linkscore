// GDPR data export: a signed-in user downloads everything tied to their verified session
// email - their saved reports (full plan_data) plus their lead/profile row - as a JSON
// file. User-initiated, server-side with the service key. Node runtime (node:crypto via _auth).
import { readSession } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const session = readSession(req);
  if (!session || session.purpose !== "session" || !session.email) {
    return res.status(401).json({ error: "Not signed in" });
  }

  const email = encodeURIComponent(session.email);
  const headers = { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY };
  try {
    // select=* so a future column rename can never break the export.
    const [pr, ur] = await Promise.all([
      fetch(SUPABASE_URL + "/rest/v1/plans?email=eq." + email + "&select=*", { headers }).catch(() => null),
      fetch(SUPABASE_URL + "/rest/v1/users?email=eq." + email + "&select=*", { headers }).catch(() => null),
    ]);
    const reports = pr && pr.ok ? await pr.json().catch(() => []) : [];
    const profile = ur && ur.ok ? await ur.json().catch(() => []) : [];
    const out = {
      exported_at: new Date().toISOString(),
      email: session.email,
      profile: profile || [],
      reports: reports || [],
    };
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="linkedscore-my-data.json"');
    return res.status(200).send(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error("[export-data] " + (e && e.message));
    return res.status(500).json({ error: "Export failed" });
  }
}
