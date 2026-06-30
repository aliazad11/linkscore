// Returns the signed-in email (or null) so the client can show login state and gate the
// "my reports" view. Also returns hasTone: whether we already saved this user's tone-of-voice
// fingerprint (from a prior analysis where they uploaded their own posts), so the Post Writer can
// reuse it and skip asking them to re-upload. Reads the httpOnly session cookie; no body. Node runtime.
import { readSession } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  const s = readSession(req);
  const email = (s && s.purpose === "session" && s.email) ? s.email : null;
  let hasTone = false;
  if (email) {
    try {
      const key = process.env.SUPABASE_SERVICE_KEY;
      const r = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?email=eq." + encodeURIComponent(email) + "&voice_fingerprint=not.is.null&select=id&limit=1", {
        headers: { "apikey": key, "Authorization": "Bearer " + key },
      });
      if (r.ok) { const rows = await r.json().catch(() => []); hasTone = Array.isArray(rows) && rows.length > 0; }
    } catch (e) { /* hasTone stays false on any error */ }
  }
  return res.status(200).json({ email, hasTone });
}
