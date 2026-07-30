// Persists the user + generated plan using the service key, so the browser
// never writes to the users/plans tables directly. Returns the new plan id
// for the shareable /plan/UUID link.
//
// OWNER: the plans row is keyed by email, and that email is what the dashboard
// (my-plans) and the /plan/:id owner gate (load-plan) match against the session
// cookie. A signed-in user may type a different email at the unlock gate (an
// alias, a typo), which used to orphan the report from their account — so when
// a valid session exists, the SESSION email owns the row. The typed email still
// gets the report by mail and still lands in the users lead table.
import { readSession } from "./_auth.js";

export const config = { maxDuration: 15 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

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

function str(v, max) {
  return typeof v === "string" ? v.slice(0, max) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const body = req.body || {};
  const email = body.email;
  if (!validEmail(email)) return res.status(400).json({ error: "A valid email is required" });
  if (!body.plan_data || typeof body.plan_data !== "object") return res.status(400).json({ error: "Missing plan" });
  const cleanEmail = email.trim().toLowerCase();
  const session = readSession(req);
  const ownerEmail = (session && session.purpose === "session" && session.email) ? session.email : cleanEmail;

  const headers = {
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY,
    "Content-Type": "application/json",
  };

  try {
    // Lead row (non-fatal if it fails)
    await fetch(SUPABASE_URL + "/rest/v1/users", {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({
        email: cleanEmail,
        first_name: str(body.first_name, 120),
        job_title: str(body.job_title, 200),
        linkedin_url: str(body.linkedin_url, 300),
      }),
    }).catch(() => {});

    const ins = await fetch(SUPABASE_URL + "/rest/v1/plans", {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        email: ownerEmail,
        first_name: str(body.first_name, 120),
        plan_data: body.plan_data,
        cohort: str(body.cohort, 80),
        quiz_answers: body.quiz_answers && typeof body.quiz_answers === "object" ? body.quiz_answers : null,
        special_note: str(body.special_note, 2000),
        ssi_scores: body.ssi_scores && typeof body.ssi_scores === "object" ? body.ssi_scores : null,
      }),
    });
    if (!ins.ok) {
      const e = await ins.text().catch(() => "");
      console.error("[save-plan] " + ins.status + " " + e);
      return res.status(500).json({ error: "Could not save plan" });
    }
    const rows = await ins.json();
    const planId = rows && rows[0] && rows[0].id;
    return res.status(200).json({ planId: planId || null, ownerEmail });
  } catch (e) {
    console.error("[save-plan] " + (e && e.message));
    return res.status(500).json({ error: "Could not save plan" });
  }
}
