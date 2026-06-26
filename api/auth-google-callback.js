// Google OAuth callback: validates the signed state, exchanges the code for tokens at Google's
// token endpoint (server-side, using our client secret), reads the verified email from the
// id_token, then sets the SAME 30-day session cookie the magic link uses - so a Google sign-in
// and a magic-link sign-in are interchangeable and key to the same email. Node runtime.
import { verifyToken, signToken, sessionCookie } from "./_auth.js";

const SITE = "https://www.linkedscore.app";
const REDIRECT_URI = SITE + "/api/auth-google-callback";
const SESSION_DAYS = 30;

function redirect(res, path) { res.statusCode = 302; res.setHeader("Location", SITE + path); return res.end(); }

// The id_token comes straight from Google's TLS token endpoint (not via the browser) in exchange
// for our client secret, so its payload is trustworthy without re-verifying the JWT signature.
function decodeJwtPayload(jwt) {
  try {
    const part = String(jwt).split(".")[1];
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.AUTH_SECRET) return redirect(res, "/account?login=error");

  const code = req.query && req.query.code;
  const state = req.query && req.query.state;
  const sp = verifyToken(state || "");
  if (!sp || sp.purpose !== "oauth_state" || sp.provider !== "google" || !code) return redirect(res, "/account?login=error");
  const next = (typeof sp.next === "string" && /^\/[A-Za-z0-9/_-]*$/.test(sp.next)) ? sp.next : "/account";

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) {
      console.error("[auth-google-callback] token " + tokenRes.status);
      return redirect(res, "/account?login=error");
    }
    const tok = await tokenRes.json();
    const claims = decodeJwtPayload(tok.id_token);
    const email = claims && claims.email ? String(claims.email).toLowerCase() : null;
    if (!email || claims.email_verified === false) return redirect(res, "/account?login=error");

    const maxAge = SESSION_DAYS * 24 * 3600;
    const session = signToken({ email, purpose: "session" }, maxAge);
    res.setHeader("Set-Cookie", sessionCookie(session, maxAge));
    return redirect(res, next);
  } catch (e) {
    console.error("[auth-google-callback] " + (e && e.message));
    return redirect(res, "/account?login=error");
  }
}
