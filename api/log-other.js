// Persists free-text "Other" quiz answers so the richest qualitative signal
// (what users type when no preset fits) is reviewable later instead of vanishing
// into the prompt. Best-effort and non-fatal: never blocks the funnel.
export const config = { maxDuration: 10 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

function str(v, max) {
  return typeof v === "string" ? v.slice(0, max) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(200).json({ ok: true });

  const body = req.body || {};
  const text = str(body.user_text, 2000);
  if (!text || !text.trim()) return res.status(200).json({ ok: true });

  try {
    await fetch(SUPABASE_URL + "/rest/v1/other_responses", {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        cohort: str(body.cohort, 80),
        question_id: str(body.question_id, 80),
        user_text: text.trim(),
        locale: str(body.locale, 8),
      }),
    }).catch(() => {});
  } catch (e) {}

  return res.status(200).json({ ok: true });
}
