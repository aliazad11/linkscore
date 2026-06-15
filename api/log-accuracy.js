// Persists the in-product "How accurate is your archetype?" survey so we can finally
// measure whether the assigned archetype lands. Anonymous: rating + cohort + archetype +
// score + optional comment + locale, no user identity. Best-effort and non-fatal.
export const config = { maxDuration: 10 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

function str(v, max) {
  return typeof v === "string" ? v.slice(0, max) : null;
}
function rating1to5(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}
function intOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(200).json({ ok: true });

  const body = req.body || {};
  const rating = rating1to5(body.rating);
  if (!rating) return res.status(200).json({ ok: true }); // a valid 1-5 star rating is required

  try {
    await fetch(SUPABASE_URL + "/rest/v1/archetype_accuracy", {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        rating: rating,
        cohort: str(body.cohort, 80),
        archetype: str(body.archetype, 200),
        score: intOrNull(body.score),
        comment: str(body.comment, 400),
        locale: str(body.locale, 8),
      }),
    }).catch(() => {});
  } catch (e) {}

  return res.status(200).json({ ok: true });
}
