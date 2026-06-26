// Starts "Sign in with Google": redirects the user to Google's consent screen. The `state` is a
// signed, short-lived token carrying the post-login destination - it doubles as CSRF protection
// (the callback only accepts a state we signed). Node runtime (uses node:crypto via _auth).
import { signToken } from "./_auth.js";

const SITE = "https://www.linkedscore.app";
const REDIRECT_URI = SITE + "/api/auth-google-callback";

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.AUTH_SECRET) {
    res.statusCode = 302; res.setHeader("Location", SITE + "/account?login=error"); return res.end();
  }
  const rawNext = (req.query && typeof req.query.next === "string") ? req.query.next : "";
  const next = /^\/[A-Za-z0-9/_-]*$/.test(rawNext) ? rawNext : "/account";
  const state = signToken({ next, purpose: "oauth_state", provider: "google" }, 600); // 10 min
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  res.statusCode = 302;
  res.setHeader("Location", "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
  return res.end();
}
