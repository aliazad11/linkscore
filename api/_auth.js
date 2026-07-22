// Shared auth helpers for the passwordless (magic-link) account system.
//
// IMPORTANT: the client never holds a Supabase key — the 2026-06 PII breach was a
// Supabase anon key shipped in the browser bundle, and we are NOT reintroducing that.
// Instead we sign short-lived tokens server-side with AUTH_SECRET (HMAC-SHA256) and set
// an httpOnly session cookie. The magic link carries a 15-min login token; verifying it
// issues a longer-lived session cookie. Plans are keyed by email, so a verified session
// email is the access key to that person's saved reports (and the owner-only PII gate).
//
// Underscore-prefixed so Vercel treats it as a helper, not a routable endpoint.
import crypto from "crypto";

const secret = () => process.env.AUTH_SECRET || "";
const b64url = (buf) => Buffer.from(buf).toString("base64url");
const unb64url = (s) => Buffer.from(s, "base64url");

// Sign a payload into a compact token: base64url(json).base64url(hmac). Adds `exp`.
export function signToken(payload, ttlSeconds) {
  const s = secret();
  if (!s) throw new Error("AUTH_SECRET not set");
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", s).update(data).digest("base64url");
  return data + "." + sig;
}

// Returns the payload if the signature is valid (constant-time) and not expired, else null.
export function verifyToken(token) {
  try {
    const s = secret();
    if (!s || typeof token !== "string" || token.indexOf(".") === -1) return null;
    const [data, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", s).update(data).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const body = JSON.parse(unb64url(data).toString("utf8"));
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (e) {
    return null;
  }
}

// httpOnly + Secure + SameSite=Lax so the magic-link click lands already logged in.
const COOKIE = "ls_session";
export function sessionCookie(token, maxAgeSeconds) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Read + verify the session cookie off a request. Returns the payload ({ email, ... }) or null.
export function readSession(req) {
  const raw = (req && req.headers && (req.headers.cookie || req.headers.Cookie)) || "";
  const m = String(raw).match(/(?:^|;\s*)ls_session=([^;]+)/);
  return m ? verifyToken(decodeURIComponent(m[1])) : null;
}

// Origin allow-list for the Anthropic-relay endpoints (generate-plan, polish-post,
// funnel-token). Browsers send Origin on POSTs; a present-but-foreign Origin means a
// cross-site caller and is rejected. An ABSENT Origin is allowed (some privacy setups
// strip it) — the signed funnel token is the real gate; this is the cheap outer wall.
export function allowedOrigin(origin) {
  if (!origin) return true;
  try {
    const h = new URL(origin).hostname;
    return h === "linkedscore.app" || h === "www.linkedscore.app" || h.endsWith(".vercel.app") || h === "localhost" || h === "127.0.0.1";
  } catch (e) {
    return false;
  }
}
