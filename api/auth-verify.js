// GET ?token -> validates the magic-link token, sets an httpOnly session cookie, and
// redirects into the app signed in. Node runtime (uses node:crypto via _auth).
import { verifyToken, signToken, sessionCookie } from "./_auth.js";

const SITE = "https://www.linkedscore.app";
const SESSION_DAYS = 30;

function redirect(res, path) {
  res.statusCode = 302;
  res.setHeader("Location", SITE + path);
  return res.end();
}

export default async function handler(req, res) {
  if (!process.env.AUTH_SECRET) return redirect(res, "/?login=error");
  const token = (req.query && req.query.token) || "";
  const payload = verifyToken(token);
  if (!payload || payload.purpose !== "login" || !payload.email) {
    return redirect(res, "/?login=expired");
  }
  try {
    const maxAge = SESSION_DAYS * 24 * 3600;
    const session = signToken({ email: payload.email, purpose: "session" }, maxAge);
    res.setHeader("Set-Cookie", sessionCookie(session, maxAge));
  } catch (e) {
    return redirect(res, "/?login=error");
  }
  // Back to where they were (e.g. the /plan/:id they tried to view), if it's a safe relative path.
  const next = (typeof payload.next === "string" && /^\/[A-Za-z0-9/_-]*$/.test(payload.next)) ? payload.next : "/?account=1";
  return redirect(res, next);
}
