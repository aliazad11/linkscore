// Consent-decision beacon: one log line per banner decision, no storage, no PII.
// Gives the consent-rate denominator that opt-in-gated analytics cannot see:
// grep Vercel logs for [consent] to know accept/reject volume on boost day.
export const config = { maxDuration: 5 };

export default function handler(req, res) {
  const c = (req.query && req.query.c) || (req.body && req.body.c) || "unknown";
  const v = ["accept", "reject", "partial"].indexOf(String(c)) !== -1 ? String(c) : "unknown";
  console.log("[consent] " + v);
  return res.status(204).end();
}
