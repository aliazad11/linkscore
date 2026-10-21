// Shared payment helpers for the one-time full-report unlock. Underscore prefix = not routable.
import crypto from "crypto";

export const PAY_LINK = "https://buy.stripe.com/fZu7sMdqG1CK0pS6da1RC01";
export const PAY_LINK_ID = "plink_1USj3ILFRTERw9CQL6uFVxLn";

// Two switches on purpose: STRIPE_WEBHOOK_SECRET arms the webhook (it can be tested with
// a real event while the site still unlocks by email), PAYWALL_ENABLED=1 turns the gate on.
// AUTH_SECRET signs the paid stamp, so without it nothing could ever verify as paid.
export function paywallOn() {
  return process.env.PAYWALL_ENABLED === "1" && !!process.env.STRIPE_WEBHOOK_SECRET && !!process.env.AUTH_SECRET;
}

// Production test lane: with the webhook armed but the paywall still off for everyone,
// the founder's test aliases (aliazad1800+anything@gmail.com) already get the paid
// flow, so the real Stripe round trip can be tested before switching it on. This only
// ever makes the gate stricter for those addresses; it never unlocks anything.
export function paywallOnFor(email) {
  if (paywallOn()) return true;
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.AUTH_SECRET) return false;
  return /^aliazad1800\+[a-z0-9._-]+@gmail\.com$/i.test(String(email || "").trim());
}

// The paid stamp is signed with a server secret. plan_data also holds model output, and the
// prompt is client-controlled, so a stamp is trusted only if this MAC matches.
export function paidMac(planId, session) {
  const k = process.env.AUTH_SECRET || "";
  if (!k || !planId || !session) return "";
  return crypto.createHmac("sha256", "paid|" + k).update(String(planId) + "." + String(session)).digest("hex");
}

export function isPaid(planId, plan) {
  const p = plan && plan._paid;
  if (!p || typeof p !== "object") return false;
  if (typeof p.session !== "string" || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(p.session)) return false;
  const mac = paidMac(planId, p.session);
  if (!mac || typeof p.mac !== "string" || p.mac.length !== mac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(p.mac, "utf8"), Buffer.from(mac, "utf8"));
}
