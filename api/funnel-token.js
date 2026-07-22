// Issues a short-lived signed token that /api/generate-plan requires. This turns the
// previously open Anthropic relay into a two-step: scripted abuse must fetch a token
// (rate-limited + origin-checked) per run instead of curl-ing the engine directly.
// The token carries no user data — just purpose + expiry, HMAC-signed with AUTH_SECRET.
import { signToken, allowedOrigin } from "./_auth.js";
import { hashKey } from "./_ratelimit.js";

export const config = { maxDuration: 10 };

const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length <= 30;
}

export default async function handler(req, res) {
  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || "unknown";
  if (!rateOk(ip)) return res.status(429).json({ error: "Too many requests" });
  if (!allowedOrigin(req.headers.origin || "")) return res.status(403).json({ error: "Forbidden" });
  try {
    // iph binds the token to the requester's hashed IP: generate-plan rejects the
    // token from any other IP, so minted tokens can't be farmed to other machines.
    return res.status(200).json({ token: signToken({ purpose: "funnel", iph: hashKey(ip).slice(0, 16) }, 7200) });
  } catch (e) {
    // AUTH_SECRET missing: fail open so the funnel never breaks on a config gap —
    // generate-plan also skips verification in that case (and logs it).
    console.error("[funnel-token] " + (e && e.message));
    return res.status(200).json({ token: "" });
  }
}
