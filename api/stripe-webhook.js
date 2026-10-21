// Stripe -> LinkedScore payment confirmation for the one-time full-report unlock.
// The Payment Link carries the plan id as client_reference_id. When Stripe reports the
// Checkout Session as paid, the plan's stored data gets a _paid stamp signed with a server
// secret (api/_paid.js), and /api/get-plan then releases the full report. Nothing here
// trusts the browser: an event is accepted only with a valid Stripe-Signature (HMAC-SHA256
// over the raw body with STRIPE_WEBHOOK_SECRET, 5-minute tolerance), and only for our own
// Payment Link. The buyer also gets one short email with a link back to the report, so a
// payment survives a lost browser tab. Supabase errors return 500 so Stripe retries;
// events we do not handle return 200 so they are not retried forever.
import crypto from "crypto";
import { PAY_LINK_ID, paidMac } from "./_paid.js";

export const config = { maxDuration: 30 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Vercel's Node helpers buffer the body before the handler runs and replay it ONLY
// through "data"/"end" listeners (see @vercel/node restoreBody), so read it with events,
// never with the async iterator, which would see an already-drained stream.
export function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(typeof c === "string" ? Buffer.from(c, "utf8") : c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function verifyStripeSignature(rawBuf, header, secret, toleranceSec, nowSec) {
  if (!header || typeof header !== "string" || !secret) return false;
  let t = null;
  const v1 = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1.push(v);
  }
  if (!t || !/^\d+$/.test(t) || !v1.length) return false;
  const now = typeof nowSec === "number" ? nowSec : Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(t)) > toleranceSec) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(t + ".").update(rawBuf).digest("hex"), "utf8");
  return v1.some((sig) => {
    const b = Buffer.from(sig, "utf8");
    return b.length === expected.length && crypto.timingSafeEqual(b, expected);
  });
}

// One short confirmation in the run's language: the way back to the report, plus the
// durable-medium confirmation of the immediate-delivery consent given before checkout.
const MAIL = {
  en: { s: "Your LinkedScore report is ready", h: "Thanks for your payment. Your full LinkedScore report is unlocked.", l: "If it did not open automatically, open your report here", w: "You agreed that delivery starts immediately and that your right of withdrawal ends once the report opens.", q: "Questions:" },
  de: { s: "Dein LinkedScore-Bericht ist bereit", h: "Danke für deine Zahlung. Dein vollständiger LinkedScore-Bericht ist freigeschaltet.", l: "Falls er sich nicht automatisch geöffnet hat, öffne deinen Bericht hier", w: "Du hast zugestimmt, dass die Bereitstellung sofort beginnt und dein Widerrufsrecht erlischt, sobald der Bericht geöffnet wird.", q: "Fragen:" },
  fr: { s: "Votre rapport LinkedScore est prêt", h: "Merci pour votre paiement. Votre rapport LinkedScore complet est débloqué.", l: "S'il ne s'est pas ouvert automatiquement, ouvrez votre rapport ici", w: "Vous avez accepté que la fourniture commence immédiatement et que votre droit de rétractation prenne fin dès l'ouverture du rapport.", q: "Questions :" },
  es: { s: "Tu informe de LinkedScore está listo", h: "Gracias por tu pago. Tu informe completo de LinkedScore está desbloqueado.", l: "Si no se ha abierto automáticamente, abre tu informe aquí", w: "Has aceptado que la entrega empiece de inmediato y que tu derecho de desistimiento termine cuando se abra el informe.", q: "Preguntas:" },
  pt: { s: "Seu relatório do LinkedScore está pronto", h: "Obrigado pelo pagamento. Seu relatório completo do LinkedScore está desbloqueado.", l: "Se ele não abriu automaticamente, abra seu relatório aqui", w: "Você concordou que a entrega começa imediatamente e que seu direito de arrependimento termina quando o relatório é aberto.", q: "Dúvidas:" },
  nl: { s: "Je LinkedScore-rapport staat klaar", h: "Bedankt voor je betaling. Je volledige LinkedScore-rapport is ontgrendeld.", l: "Is het niet automatisch geopend, open je rapport dan hier", w: "Je hebt ermee ingestemd dat de levering direct begint en dat je herroepingsrecht vervalt zodra het rapport opent.", q: "Vragen:" },
  it: { s: "Il tuo report LinkedScore è pronto", h: "Grazie per il pagamento. Il tuo report LinkedScore completo è sbloccato.", l: "Se non si è aperto automaticamente, apri il tuo report qui", w: "Hai accettato che la fornitura inizi subito e che il tuo diritto di recesso termini quando il report viene aperto.", q: "Domande:" },
};

async function sendPaidEmail(to, lang, sessionId) {
  const key = process.env.RESEND_KEY || process.env.VITE_RESEND_KEY;
  if (!key || !to) return;
  const m = MAIL[lang] || MAIL.en;
  const link = "https://www.linkedscore.app/?paid=1&session_id=" + encodeURIComponent(sessionId);
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a2e;max-width:520px">'
    + "<p>" + m.h + "</p>"
    + '<p><a href="' + link + '" style="display:inline-block;background:#c8a96e;color:#0a0a0f;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">' + m.l + "</a></p>"
    + '<p style="font-size:13px;color:#56566f">' + m.w + "</p>"
    + '<p style="font-size:13px;color:#56566f">' + m.q + ' <a href="mailto:a.azad@linkedscore.app">a.azad@linkedscore.app</a></p></div>';
  const text = m.h + "\n\n" + m.l + ": " + link + "\n\n" + m.w + "\n\n" + m.q + " a.azad@linkedscore.app";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ from: "LinkedScore <noreply@linkedscore.app>", reply_to: "a.azad@linkedscore.app", to: [to], subject: m.s, html, text }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) console.error("[stripe-webhook] paid email " + r.status);
  } catch (e) { console.error("[stripe-webhook] paid email " + ((e && e.name) || "error")); }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let raw;
  try { raw = await readRaw(req); } catch (e) { return res.status(400).json({ error: "Unreadable body" }); }

  const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SECRET || !SERVICE_KEY || !process.env.AUTH_SECRET) {
    // rawBytes proves the body reaches the handler intact before the secret is configured.
    console.error("[stripe-webhook] not configured (STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_KEY or AUTH_SECRET missing)");
    return res.status(500).json({ error: "Not configured", rawBytes: raw.length });
  }
  if (!raw.length) {
    console.error("[stripe-webhook] empty raw body");
    return res.status(400).json({ error: "Empty body" });
  }
  if (!verifyStripeSignature(raw, req.headers["stripe-signature"], SECRET, 300)) {
    console.error("[stripe-webhook] rejected: bad or missing Stripe-Signature");
    return res.status(400).json({ error: "Bad signature" });
  }

  let event;
  try { event = JSON.parse(raw.toString("utf8")); } catch (e) { return res.status(400).json({ error: "Bad JSON" }); }
  const type = event && event.type;
  if (type !== "checkout.session.completed" && type !== "checkout.session.async_payment_succeeded") {
    return res.status(200).json({ received: true, ignored: type || null });
  }
  const s = (event.data && event.data.object) || {};
  if (s.mode && s.mode !== "payment") return res.status(200).json({ received: true, ignored: "mode " + s.mode });
  if (s.payment_link !== PAY_LINK_ID) return res.status(200).json({ received: true, ignored: "other payment link" });
  if (s.payment_status !== "paid" && s.payment_status !== "no_payment_required") {
    // Delayed methods (e.g. bank debits) complete later via async_payment_succeeded.
    return res.status(200).json({ received: true, pending: true });
  }
  const planId = s.client_reference_id;
  if (typeof planId !== "string" || !UUID_RE.test(planId)) {
    console.error("[stripe-webhook] paid session without a plan reference: " + s.id);
    return res.status(200).json({ received: true, ignored: "no plan reference" });
  }
  if (typeof s.id !== "string" || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(s.id)) return res.status(200).json({ received: true, ignored: "bad session id" });

  const headers = { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY, "Content-Type": "application/json" };
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?id=eq." + encodeURIComponent(planId) + "&select=plan_data,email", { headers, signal: AbortSignal.timeout(6000) });
    if (!r.ok) {
      console.error("[stripe-webhook] plan lookup " + r.status);
      return res.status(500).json({ error: "Lookup failed" });
    }
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) {
      // Paid for a plan that no longer exists (purged or wrong id). Loud log: refund manually.
      console.error("[stripe-webhook] PAID BUT PLAN NOT FOUND plan=" + planId + " session=" + s.id);
      return res.status(200).json({ received: true, missing: true });
    }
    const pd = (rows[0].plan_data && typeof rows[0].plan_data === "object") ? rows[0].plan_data : {};
    if (pd._paid && pd._paid.session === s.id) return res.status(200).json({ received: true, duplicate: true });
    if (pd._paid && pd._paid.session) {
      // A second payment for the same report: keep the first stamp, flag it for a refund.
      console.error("[stripe-webhook] DOUBLE PAYMENT plan=" + planId + " first=" + pd._paid.session + " second=" + s.id);
      return res.status(200).json({ received: true, double: true });
    }
    const payerEmail = (s.customer_details && s.customer_details.email) || s.customer_email || null;
    pd._paid = {
      at: new Date().toISOString(),
      session: s.id,
      mac: paidMac(planId, s.id),
      amount: typeof s.amount_total === "number" ? s.amount_total : null,
      currency: s.currency || null,
      email: payerEmail,
      livemode: !!event.livemode,
    };
    const patch = { plan_data: pd };
    if (!rows[0].email && payerEmail) patch.email = String(payerEmail).trim().toLowerCase().slice(0, 254);
    const p = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?id=eq." + encodeURIComponent(planId), {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(6000),
    });
    if (!p.ok) {
      const e = await p.text().catch(() => "");
      console.error("[stripe-webhook] mark-paid " + p.status + " " + e.slice(0, 200));
      return res.status(500).json({ error: "Update failed" });
    }
    console.log("[stripe-webhook] paid plan=" + planId + " amount=" + pd._paid.amount + " " + pd._paid.currency);
    await sendPaidEmail(payerEmail, typeof pd._lang === "string" ? pd._lang : "en", s.id);
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("[stripe-webhook] " + ((e && e.name) || "error") + ": " + ((e && e.message) || ""));
    return res.status(500).json({ error: "Webhook failed" });
  }
}
