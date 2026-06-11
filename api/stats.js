// Returns the public user count for the landing-page social-proof counter.
// Replaces the old direct client-side count on the users table, which required
// an anon SELECT policy on a table holding emails.
export const config = { maxDuration: 10 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/users?select=count", {
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Prefer": "count=exact",
        "Range": "0-0",
      },
    });
    const countHeader = r.headers.get("content-range");
    const total = countHeader ? parseInt(countHeader.split("/")[1]) : NaN;
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ users: Number.isFinite(total) ? total : 0 });
  } catch (e) {
    console.error("[stats] " + (e && e.message));
    return res.status(200).json({ users: 0 });
  }
}
