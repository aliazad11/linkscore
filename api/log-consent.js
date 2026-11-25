// Consent-decision beacon: one log line per banner decision, no storage, no PII.
// Gives the consent-rate denominator that opt-in-gated analytics cannot see:
// grep Vercel logs for [consent] to know accept/reject volume on boost day.
// Decisions made on the blog's banner (web/) arrive with src=blog and log as
// "[consent] accept blog", so the two accept rates can be read apart. An Advertising
// (Google Ads) opt-in in the app's banner arrives as m=1 and adds " ads" to the line, so
// "[consent] reject ads" is analytics off with advertising on.
export const config = { maxDuration: 5 };

export default function handler(req, res) {
  const c = (req.query && req.query.c) || (req.body && req.body.c) || "unknown";
  const v = ["accept", "reject", "partial"].indexOf(String(c)) !== -1 ? String(c) : "unknown";
  const src = req.query && req.query.src === "blog" ? " blog" : "";
  const ads = req.query && req.query.m === "1" ? " ads" : "";
  console.log("[consent] " + v + src + ads);
  return res.status(204).end();
}
