// GDPR erasure: a signed-in user deletes their own data — every row keyed to their verified
// session email across plans, gated_plans, users, subscribers — then the session is cleared.
// User-initiated (not a manual migration); runs server-side with the service key. Node runtime.
import { readSession, clearSessionCookie } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const s = readSession(req);
  if (!s || s.purpose !== "session" || !s.email) return res.status(401).json({ error: "Not signed in" });

  const email = encodeURIComponent(s.email);
  const headers = { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY };
  try {
    await Promise.all([
      fetch(SUPABASE_URL + "/rest/v1/plans?email=eq." + email, { method: "DELETE", headers }).catch(() => {}),
      fetch(SUPABASE_URL + "/rest/v1/gated_plans?email=eq." + email, { method: "DELETE", headers }).catch(() => {}),
      fetch(SUPABASE_URL + "/rest/v1/users?email=eq." + email, { method: "DELETE", headers }).catch(() => {}),
      fetch(SUPABASE_URL + "/rest/v1/subscribers?email=eq." + email, { method: "DELETE", headers }).catch(() => {}),
    ]);
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[delete-account] " + (e && e.message));
    return res.status(500).json({ error: "Delete failed" });
  }
}
