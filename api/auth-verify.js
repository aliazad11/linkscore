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
  // Expired/invalid links land back on the sign-in page (with a message), not the homepage.
  if (!process.env.AUTH_SECRET) return redirect(res, "/account?login=error");
  const token = (req.query && req.query.token) || "";
  const payload = verifyToken(token);
  if (!payload || payload.purpose !== "login" || !payload.email) {
    // Report emails carry ?p=<planId>: when their auto-login token has expired, degrade
    // to the plain (gated) plan page instead of a dead "link expired" screen.
    const pid = String((req.query && req.query.p) || "");
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pid)) {
      return redirect(res, "/plan/" + pid);
    }
    return redirect(res, "/account?login=expired");
  }
  try {
    const maxAge = SESSION_DAYS * 24 * 3600;
    const session = signToken({ email: payload.email, purpose: "session" }, maxAge);
    res.setHeader("Set-Cookie", sessionCookie(session, maxAge));
  } catch (e) {
    return redirect(res, "/account?login=error");
  }
  // Back to where they were (e.g. the /plan/:id they tried to view), if it's a safe relative path.
  const next = (typeof payload.next === "string" && /^\/[A-Za-z0-9/_-]*$/.test(payload.next)) ? payload.next : "/?account=1";
  return redirect(res, next);
}
