// Durable rate limiting backed by the gen_requests table (ip_hash + created_at),
// generic over any key (an IP, a session email, ...) so every paid endpoint can
// share one cap mechanism that survives lambda cold starts.
// FAIL-OPEN by design when Supabase errors (an outage must not take the funnel
// down with it) but LOUD: an unavailable table is logged on EVERY request so an
// inert limiter can never hide again. Underscore prefix = not routable.
import crypto from "crypto";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export function hashKey(raw) {
  return crypto.createHash("sha256").update(raw + "|" + (process.env.AUTH_SECRET || "ls")).digest("hex").slice(0, 32);
}

export async function durableRateOk(rawKey, limitPerHour, serviceKey, label) {
  try {
    const keyHash = hashKey(rawKey);
    const headers = { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Content-Type": "application/json" };
    const since = new Date(Date.now() - 3600000).toISOString();
    const q = await fetch(SUPABASE_URL + "/rest/v1/gen_requests?ip_hash=eq." + keyHash + "&created_at=gte." + encodeURIComponent(since) + "&select=count", {
      headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!q.ok) {
      const body = await q.text().catch(() => "");
      console.error("[ratelimit] " + label + ": durable check unavailable (http " + q.status + " " + body.slice(0, 120) + ") - FAIL-OPEN. Is the gen_requests table created?");
      return true;
    }
    const cr = q.headers.get("content-range");
    const n = cr ? parseInt(cr.split("/")[1]) : 0;
    if (Number.isFinite(n) && n >= limitPerHour) {
      console.error("[ratelimit] " + label + ": limit hit (" + n + "/" + limitPerHour + " per hour)");
      return false;
    }
    fetch(SUPABASE_URL + "/rest/v1/gen_requests", {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({ ip_hash: keyHash }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});
    return true;
  } catch (e) {
    console.error("[ratelimit] " + label + ": " + ((e && e.name) || "error") + " - FAIL-OPEN");
    return true;
  }
}
