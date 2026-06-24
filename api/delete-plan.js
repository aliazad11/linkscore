// Deletes ONE saved report - only if it belongs to the signed-in user. The email filter on the
// DELETE means a session can never remove someone else's report. Node runtime (node:crypto via _auth).
import { readSession } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const s = readSession(req);
  if (!s || s.purpose !== "session" || !s.email) return res.status(401).json({ error: "Not signed in" });

  const planId = req.body && req.body.planId;
  if (!planId || typeof planId !== "string" || !UUID_RE.test(planId)) return res.status(400).json({ error: "Missing planId" });

  const url = SUPABASE_URL + "/rest/v1/plans?id=eq." + encodeURIComponent(planId) + "&email=eq." + encodeURIComponent(s.email);
  try {
    const r = await fetch(url, { method: "DELETE", headers: { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY } });
    if (!r.ok) return res.status(500).json({ error: "Delete failed" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[delete-plan] " + (e && e.message));
    return res.status(500).json({ error: "Delete failed" });
  }
}
