// Score blending shared by the browser (scoring.js re-exports it for finalizePlan) and the
// server (generate-plan builds the email/pay gate teaser with it). The number a user sees
// before paying and the number in the paid report come out of ONE function on the SAME
// inputs: the stored plan plus the stored anchors (plan._det). The "_" prefix keeps this
// file from being deployed as an endpoint, like _auth.js.

export const clampBand = (v) => Math.max(35, Math.min(92, Math.round(v)));

export function validDet(d) {
  if (!d || typeof d !== "object") return null;
  const ok = (v) => v == null || (Number.isFinite(Number(v)) && Number(v) >= 35 && Number(v) <= 92);
  if (!ok(d.headline) || !ok(d.about) || !ok(d.experience) || !ok(d.completeness) || !ok(d.provisionalOverall)) return null;
  if (!Number.isFinite(Number(d.completeness))) return null;
  const r = (v) => (v == null ? null : Math.round(Number(v)));
  return { headline: r(d.headline), about: r(d.about), experience: r(d.experience), completeness: r(d.completeness) == null ? 50 : r(d.completeness), provisionalOverall: r(d.provisionalOverall) };
}

// ── The blend ────────────────────────────────────────────────────────────────────
// Sub-scores: 0.6 anchor + 0.4 model-clamped-to-anchor+-5 (null anchor -> model passes
// through). Overall is the weighted average of the RESULTING sub-scores + completeness,
// so partial measurement is self-consistent. Runs in the browser at unlock (finalizePlan)
// and, for the gate number only, on a copy server-side (gateOverall below).
export function blendPlanScores(plan, det, opts = {}) {
  if (!plan || typeof plan !== "object" || !det) return plan;
  // TRUST: det is measured in the BROWSER from the PDF text and only range-checked by
  // validDet (the server stores it as plan._det for PDF runs only). A user can forge it
  // and move their OWN score, which is no worse than before (save-plan already stores
  // the client's finished plan), but never treat _det or a blended score as verified in
  // stats or anything public. No output-vs-model reconciliation band exists, and
  // deliberately so - a legitimate rescue (the model badly under-scores a genuinely
  // strong profile) is indistinguishable by magnitude from a forge.
  if (opts.hadProfile !== true) { plan._anchored = false; return plan; }
  const ps = (plan.profile_scores && typeof plan.profile_scores === "object") ? plan.profile_scores : (plan.profile_scores = {});
  const blend = (anchor, model) => {
    if (anchor == null) return Number.isFinite(Number(model)) ? clampBand(Number(model)) : model;
    const mv = Number(model);
    const anchored = Number.isFinite(mv) ? Math.max(anchor - 5, Math.min(anchor + 5, mv)) : anchor;
    return clampBand(0.6 * anchor + 0.4 * anchored);
  };
  ps.headline = blend(det.headline, ps.headline);
  ps.about = blend(det.about, ps.about);
  ps.experience = blend(det.experience, ps.experience);
  // Overall from the blended sub-scores + deterministic completeness. Internally
  // consistent by construction: no independent overall anchor to contradict them.
  const comp = Number.isFinite(Number(det.completeness)) ? Number(det.completeness) : 50;
  const sub = [];
  if (Number.isFinite(Number(ps.headline))) sub.push([Number(ps.headline), 0.3]);
  if (Number.isFinite(Number(ps.about))) sub.push([Number(ps.about), 0.3]);
  if (Number.isFinite(Number(ps.experience))) sub.push([Number(ps.experience), 0.25]);
  sub.push([comp, 0.15]);
  const wsum = sub.reduce((s, [, w]) => s + w, 0);
  ps.overall = clampBand(sub.reduce((s, [v, w]) => s + v * w, 0) / wsum);
  plan.score = ps.overall;
  plan._anchored = true;
  // Prose must agree with the blended number: normalize every score-mention form the
  // model emits ("score of 58", "58/100", "58 out of 100").
  const scrub = (s) => typeof s === "string"
    ? s.replace(/\b((?:overall|linkedin)?\s?(?:score|rating|estimate)\s+(?:of|:)\s+)\d{1,3}\b/gi, (mm, p1) => p1 + plan.score)
        .replace(/\b\d{1,3}\s*\/\s*100\b/g, plan.score + "/100")
        .replace(/\b\d{1,3}(\s+out of\s+100)\b/gi, (mm, p1) => plan.score + p1)
    : s;
  for (const k of ["urgency", "closing_message", "headline"]) plan[k] = scrub(plan[k]);
  return plan;
}

// The LinkedIn Score the gate shows: the report's own blend, run on a copy of the stored
// sub-scores with the stored anchors. null when the run has no valid anchors, in which
// case the report shows the model's own overall and so does the gate.
export function gateOverall(planData, det) {
  const d = validDet(det);
  if (!d || !planData || typeof planData !== "object") return null;
  try {
    const tmp = JSON.parse(JSON.stringify({ profile_scores: planData.profile_scores === undefined ? {} : planData.profile_scores }));
    blendPlanScores(tmp, d, { hadProfile: true });
    const o = Number(tmp.profile_scores && tmp.profile_scores.overall);
    return Number.isFinite(o) ? o : null;
  } catch (e) { return null; }
}

// Single-value shortcut, kept ONLY for gate teasers saved before the server sent
// gateOverall (a localStorage funnel snapshot can be up to 7 days old).
export function legacyGateOverall(det, modelOverall) {
  if (!det || !Number.isFinite(Number(det.provisionalOverall)) || !Number.isFinite(Number(modelOverall))) return modelOverall;
  const a = Number(det.provisionalOverall), m = Number(modelOverall);
  return clampBand(0.6 * a + 0.4 * Math.max(a - 5, Math.min(a + 5, m)));
}

const TL_KEYS = ["hook_score", "engagement_score", "voice_score", "structure_score"];

// Server: how many Thought Leader sub-scores are numbers and their rounded mean, read
// exactly as finalizePlan reads them. Only these two numbers reach the gate, never the
// four sub-scores themselves (they are part of the paid report).
export function tlSubStats(tl) {
  if (!tl || typeof tl !== "object") return { count: null, avg: null };
  const vals = TL_KEYS.map((k) => Number(tl[k])).filter((n) => !isNaN(n));
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  if (vals.length && !Number.isFinite(avg)) return { count: null, avg: null };
  return { count: vals.length, avg };
}

// The Thought Leader number the gate shows: finalizePlan's A-noPosts flatten (one value,
// at most 50, 45 when nothing is numeric) and A3 average of the four sub-scores. hadPosts
// must be derived the way finalizePlan derives it. Teasers without the stats fall back to
// the model's raw score, as before.
export function tlGateScore(t, hadPosts) {
  if (!t || !t.tlAvailable) return null;
  if (t.tlSubCount == null) return t.tlScore;
  if (!hadPosts) return t.tlSubCount ? Math.max(0, Math.min(100, Math.min(t.tlSubAvg, 50))) : 45;
  return t.tlSubCount === 4 ? Math.max(0, Math.min(100, t.tlSubAvg)) : t.tlScore;
}
