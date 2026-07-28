// Monthly "re-check your score" reminder (daily cron target). SAFE BY DEFAULT:
//  - Refuses unless CRON_SECRET is set AND the caller presents it. Vercel cron sends it as a
//    Bearer header automatically once CRON_SECRET is configured, so until Ali sets that env var
//    this endpoint emails NOBODY (returns 503).
//  - ?dry=1 returns the would-be recipient list without sending a single email.
//  - Skips obvious test addresses (@example.com).
//  - Reminds an email only when its NEWEST report just crossed ~30 days (a 1-day window), so a
//    daily run pings each lapsed user exactly once and never re-spams - no DB column needed.
//  - Each email carries a ONE-CLICK sign-in link (7-day login token) straight to /account.
// Node runtime (uses node:crypto via _auth).
import { signToken } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const SITE = "https://www.linkedscore.app";
const DAY = 86400000;

export default async function handler(req, res) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) return res.status(503).json({ error: "Reminders disabled (set CRON_SECRET to enable)" });
  const auth = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const qSecret = (req.query && req.query.secret) || "";
  if (auth !== "Bearer " + CRON_SECRET && qSecret !== CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY || !process.env.AUTH_SECRET) return res.status(500).json({ error: "Server not configured" });
  const headers = { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY };
  const dry = !!(req.query && (req.query.dry === "1" || req.query.dry === "true"));

  const now = Date.now();
  const windowStart = new Date(now - 31 * DAY).toISOString();
  const windowEnd = new Date(now - 30 * DAY).toISOString();
  try {
    // Reports that just crossed the 30-day mark.
    const r = await fetch(SUPABASE_URL + "/rest/v1/plans?created_at=gte." + encodeURIComponent(windowStart) + "&created_at=lt." + encodeURIComponent(windowEnd) + "&select=email,first_name,created_at", { headers });
    if (!r.ok) return res.status(500).json({ error: "Lookup failed" });
    const rows = await r.json();

    // One reminder per email; skip test addresses.
    const byEmail = new Map();
    for (const row of rows || []) {
      const em = String(row.email || "").toLowerCase();
      if (!em || em.indexOf("@example.com") !== -1) continue;
      if (!byEmail.has(em)) byEmail.set(em, row.first_name || "");
    }

    // Only remind the lapsed: skip anyone who already has a NEWER report (they came back).
    const candidates = [];
    for (const [em, name] of byEmail) {
      const nr = await fetch(SUPABASE_URL + "/rest/v1/plans?email=eq." + encodeURIComponent(em) + "&created_at=gte." + encodeURIComponent(windowEnd) + "&select=id&limit=1", { headers }).catch(() => null);
      const newer = nr && nr.ok ? await nr.json().catch(() => []) : [];
      if (newer && newer.length) continue;
      candidates.push({ email: em, name });
    }

    if (dry) return res.status(200).json({ dry: true, count: candidates.length, recipients: candidates.map((c) => c.email) });

    let sent = 0;
    for (const c of candidates) {
      try {
        const token = signToken({ email: c.email, purpose: "login", next: "/account" }, 7 * 24 * 3600);
        const link = SITE + "/api/auth-verify?token=" + encodeURIComponent(token);
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (process.env.RESEND_KEY || process.env.VITE_RESEND_KEY) },
          body: JSON.stringify({
            from: "LinkedScore <noreply@linkedscore.app>",
            reply_to: "a.azad@linkedscore.app",
            to: [c.email],
            subject: "Time to re-check your LinkedIn score",
            html: `<div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#08080e;color:#f5f5fc;">
              <p style="color:#c8a96e;font-weight:800;letter-spacing:2px;margin:0 0 16px;">LINKEDSCORE</p>
              <p style="line-height:1.6;">${c.name ? "Hi " + c.name + "," : "Hi,"}</p>
              <p style="line-height:1.6;">It has been about a month since your last LinkedIn score. Profiles drift. Re-check yours and see whether the changes you made moved the needle.</p>
              <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#c8a96e,#a07840);color:#08080e;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;margin:10px 0;">Re-check my score</a>
              <p style="color:#6a6a8a;font-size:12px;margin-top:24px;line-height:1.6;">This link signs you in and expires in 7 days. If you did not expect this, you can ignore it.</p>
            </div>`,
          }),
        });
        sent++;
      } catch (e) { /* one bad send must not abort the run */ }
    }
    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    console.error("[send-reminders] " + (e && e.message));
    return res.status(500).json({ error: "Reminder run failed" });
  }
}
