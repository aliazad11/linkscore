// Uptime probe target (UptimeRobot or similar pings this every 5 minutes). Checks the
// two things the funnel dies without: env config present and Supabase reachable.
// Returns booleans only — never key material. 200 = healthy, 503 = something is down,
// so a dumb HTTP monitor catches both total outages and broken dependencies.
export const config = { maxDuration: 10 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  const env = {
    anthropic: !!process.env.ANTHROPIC_KEY,
    supabase: !!process.env.SUPABASE_SERVICE_KEY,
    auth: !!process.env.AUTH_SECRET,
    resend: !!(process.env.RESEND_KEY || process.env.VITE_RESEND_KEY),
  };
  let db = false;
  if (env.supabase) {
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/plans?select=id&limit=1", {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      });
      db = r.ok;
    } catch (e) { db = false; }
  }
  const ok = env.anthropic && env.supabase && db;
  res.setHeader("Cache-Control", "no-store");
  return res.status(ok ? 200 : 503).json({ ok, env, db });
}
