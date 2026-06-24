// POST { email } -> emails a 15-minute magic sign-in link via Resend.
// Always returns { ok: true } regardless of whether that email has any saved plans, so the
// endpoint can't be used to enumerate who has an account. Node runtime (uses node:crypto).
import { signToken } from "./_auth.js";

const SITE = "https://www.linkedscore.app";

function validEmail(e) {
  if (typeof e !== "string") return false;
  e = e.trim();
  if (e.length < 5 || e.length > 254 || e.indexOf(" ") > -1) return false;
  const at = e.indexOf("@");
  if (at < 1) return false;
  const dot = e.indexOf(".", at);
  return dot > at + 1 && dot < e.length - 1;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.AUTH_SECRET) return res.status(500).json({ error: "Server not configured" });

  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  if (!validEmail(email)) return res.status(400).json({ error: "A valid email is required" });

  // Optional post-login destination (e.g. the /plan/:id they were viewing). Only a safe
  // relative path is accepted — no scheme, no protocol-relative // — so it can't be an open redirect.
  const rawNext = (req.body && typeof req.body.next === "string") ? req.body.next : "";
  const next = /^\/[A-Za-z0-9/_-]*$/.test(rawNext) ? rawNext : "";

  try {
    const token = signToken({ email, purpose: "login", next }, 900); // 15 minutes
    const link = `${SITE}/api/auth-verify?token=${encodeURIComponent(token)}`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_KEY || process.env.VITE_RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: "Linkedscore <noreply@linkedscore.app>",
        reply_to: "a.azad@linkedscore.app",
        to: [email],
        subject: "Your Linkedscore sign-in link",
        html: `<div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#08080e;color:#f5f5fc;">
          <p style="color:#c8a96e;font-weight:800;letter-spacing:2px;margin:0 0 16px;">LINKEDSCORE</p>
          <p style="line-height:1.6;">Click below to sign in and see your saved reports. This link expires in 15 minutes.</p>
          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#c8a96e,#a07840);color:#08080e;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;margin:8px 0;">Sign in to Linkedscore</a>
          <p style="color:#6a6a8a;font-size:12px;margin-top:24px;line-height:1.6;">If you did not request this, you can safely ignore this email.</p>
        </div>`,
      }),
    }).catch(() => {});
  } catch (e) {
    // Swallow internal errors so the response never reveals account state.
  }
  return res.status(200).json({ ok: true });
}
