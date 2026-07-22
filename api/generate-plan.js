export const config = { maxDuration: 300 };

import crypto from "crypto";
import { verifyToken, allowedOrigin } from "./_auth.js";

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

// Durable rate limit: 8 generations per hashed IP per hour, backed by the gen_requests
// table so the limit survives lambda cold starts (the in-memory limiter below resets per
// instance). IPs are stored only as salted SHA-256 hashes. Fail-open by design: if the
// table doesn't exist yet or Supabase hiccups, we fall back to the in-memory limiter
// rather than block real users.
async function durableRateOk(ip, serviceKey) {
  try {
    const ipHash = crypto.createHash("sha256").update(ip + "|" + (process.env.AUTH_SECRET || "ls")).digest("hex").slice(0, 32);
    const headers = { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Content-Type": "application/json" };
    const since = new Date(Date.now() - 3600000).toISOString();
    const q = await fetch(SUPABASE_URL + "/rest/v1/gen_requests?ip_hash=eq." + ipHash + "&created_at=gte." + encodeURIComponent(since) + "&select=count", {
      headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!q.ok) return true;
    const cr = q.headers.get("content-range");
    const n = cr ? parseInt(cr.split("/")[1]) : 0;
    if (Number.isFinite(n) && n >= 8) return false;
    fetch(SUPABASE_URL + "/rest/v1/gen_requests", {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({ ip_hash: ipHash }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});
    return true;
  } catch (e) {
    return true;
  }
}

const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const windowMs = 60000;
  const max = 5;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length <= max;
}

const ALLOWED_CONTENT_TYPES = ["text", "document", "image"];
function validMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 2) return false;
  for (const m of messages) {
    if (!m || m.role !== "user" || !Array.isArray(m.content)) return false;
    if (m.content.length < 1 || m.content.length > 8) return false;
    for (const c of m.content) {
      if (!c || ALLOWED_CONTENT_TYPES.indexOf(c.type) === -1) return false;
    }
  }
  return true;
}

// Repairs truncated or bracket-imbalanced JSON from the model. A generation cut mid-string
// (max_tokens, or a rare malformed emission) leaves unbalanced brackets that JSON.parse
// rejects outright — before this, that meant a 502 and the user had to regenerate. The scan
// is string/escape-aware: it records every structural comma and open bracket as a safe cut
// point with the closer suffix needed there, then tries the full text first and walks cut
// points backwards until one parses. Returns the parsed value or null; never throws.
function parseWithRepair(s) {
  try { return JSON.parse(s); } catch (e) { /* fall through to repair */ }
  const stack = [];
  const cuts = [];
  let inStr = false, esc = false;
  const closers = () => stack.map((c) => (c === "{" ? "}" : "]")).reverse().join("");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") { stack.push(ch); cuts.push({ pos: i + 1, suffix: closers() }); }
    else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === ",") cuts.push({ pos: i, suffix: closers() });
  }
  // Full-text candidate — ONLY when the cut landed outside a string. Closing an open
  // string would ship a mid-word amputated fragment as a field value ("...cut their clos"),
  // which no downstream layer can detect; the walk-back below instead drops the dangling
  // fragment cleanly at the last structural comma.
  // Also skip it when the text ends mid-number: unlike strings, a number prefix is still
  // valid JSON ("total": 64 cut after the 6 parses as 6), so closing here would serve a
  // silently wrong value. The walk-back drops the dangling pair at a structural boundary.
  if (!inStr && !/[0-9.+\-eE]$/.test(s.trimEnd())) {
    try { return JSON.parse(s + closers()); } catch (e) { /* try earlier cut points */ }
  }
  for (let i = cuts.length - 1, tries = 0; i >= 0 && tries < 60; i--, tries++) {
    const c = cuts[i];
    try { return JSON.parse(s.slice(0, c.pos) + c.suffix); } catch (e) { /* keep walking back */ }
  }
  return null;
}

// Completeness gate for a parsed candidate plan. The buildPrompt schema is one constant —
// every key below is requested on every cohort — so a missing key means damaged output,
// not a variant. Serving a partial plan is worse than retrying: finalizePlan does NOT
// synthesize missing sections (empty Overview quote card, five blank Content cards) and
// absent thought_leader/ssi_plan mislock tabs against data the user actually provided.
// Returns the first missing field name (for telemetry) or null when the plan is complete.
const REQUIRED_PLAN_FIELDS = [
  ["score", (p) => p.score !== undefined],
  ["archetype", (p) => typeof p.archetype === "string" && !!p.archetype],
  ["headline_rewrite", (p) => typeof p.headline_rewrite === "string" && !!p.headline_rewrite],
  ["about_rewrite", (p) => typeof p.about_rewrite === "string" && !!p.about_rewrite],
  ["content_strategy", (p) => !!p.content_strategy && typeof p.content_strategy === "object"],
  ["post_hooks", (p) => Array.isArray(p.post_hooks) && p.post_hooks.length > 0],
  ["content_calendar", (p) => Array.isArray(p.content_calendar) && p.content_calendar.length > 0],
  ["networking", (p) => !!p.networking && typeof p.networking === "object"],
  ["closing_message", (p) => typeof p.closing_message === "string" && !!p.closing_message],
  // The last two schema keys are where tail truncation lands, so object-ness alone is not
  // enough: a repaired {available:true} stub would UNLOCK the tab and render it empty.
  // When available is explicitly false the section stays locked and needs no content;
  // when it claims true, the fields the tab renders must actually be there.
  ["thought_leader", (p) => !!p.thought_leader && typeof p.thought_leader === "object" &&
    (p.thought_leader.available === false || (Number.isFinite(Number(p.thought_leader.score)) &&
      typeof p.thought_leader.analysis === "string" && Array.isArray(p.thought_leader.improvements) && p.thought_leader.improvements.length > 0))],
  ["ssi_plan", (p) => !!p.ssi_plan && typeof p.ssi_plan === "object" &&
    (p.ssi_plan.available === false || (Number.isFinite(Number(p.ssi_plan.total)) &&
      Array.isArray(p.ssi_plan.pillars) && p.ssi_plan.pillars.length === 4 &&
      p.ssi_plan.pillars.every((pl) => pl && typeof pl === "object" && pl.name && pl.advice)))],
];
function missingPlanField(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return "root";
  for (const [name, ok] of REQUIRED_PLAN_FIELDS) { if (!ok(p)) return name; }
  return null;
}

// Fact-check pass: re-ground every claim in the rewrite/hook copy against the SAME source (profile PDF
// + post screenshots already in `messages`). The 20-persona engine test found ~6 fabrications/plan
// (invented tenure "30 years", metrics "603 reactions", scope "global P&L") that prompt-only guards
// leak; a separate verification pass catches them. Best-effort: any failure leaves the plan unchanged.
async function scrubFabrications(messages, plan, apiKey, signal) {
  const fields = {};
  for (const k of ["headline_rewrite", "about_rewrite", "experience_rewrite", "urgency", "closing_message"]) {
    if (typeof plan[k] === "string" && plan[k].trim()) fields[k] = plan[k];
  }
  if (Array.isArray(plan.post_hooks) && plan.post_hooks.length) fields.post_hooks = plan.post_hooks;
  if (Array.isArray(plan.growth_tactics) && plan.growth_tactics.length) fields.growth_tactics = plan.growth_tactics;
  const tl = (plan.thought_leader && typeof plan.thought_leader === "object") ? plan.thought_leader : null;
  if (tl && typeof tl.analysis === "string" && tl.analysis.trim()) fields.tl_analysis = tl.analysis;
  const cs = (plan.content_strategy && typeof plan.content_strategy === "object") ? plan.content_strategy : null;
  if (cs && typeof cs.best_posting_times === "string" && cs.best_posting_times.trim()) fields.best_posting_times = cs.best_posting_times;
  if (cs && typeof cs.hook_formula === "string" && cs.hook_formula.trim()) fields.hook_formula = cs.hook_formula;
  if (Array.isArray(plan.content_calendar) && plan.content_calendar.length) {
    fields.content_calendar = plan.content_calendar.map((w) => (w && typeof w === "object")
      ? { topic: typeof w.topic === "string" ? w.topic : "", hook: typeof w.hook === "string" ? w.hook : "", action: typeof w.action === "string" ? w.action : "" }
      : { topic: "", hook: "", action: "" });
  }
  if (!Object.keys(fields).length) return plan;
  const hasImg = Array.isArray(messages) && messages.some((m) => Array.isArray(m.content) && m.content.some((c) => c && c.type === "image"));
  const hasDoc = Array.isArray(messages) && messages.some((m) => Array.isArray(m.content) && m.content.some((c) => c && c.type === "document"));
  const sourceLine = (hasImg || hasDoc)
    ? "The profile and post screenshots above are the ONLY source of truth."
    : "NO profile PDF and NO post screenshots were provided for this person, so there is NO verified source at all: every specific named entity, number, year, product, company, school, credential or scene below is therefore a fabrication, delete it or replace it with generic phrasing and keep only guidance that holds for their stated role and answers.";
  const instruction = `${sourceLine} Below is copy that was written from them (profile rewrites, post hooks, the 4-week content calendar, growth tactics and content-strategy lines). Fact-check ALL of it HARD and return a corrected version. Be AGGRESSIVE: when any fact is not clearly and verbatim in the source, delete it or replace it with generic phrasing. When in doubt, cut it. A user must never paste a number, year, credential, claim or post metric that is not in their own profile or screenshots.\n- Every number, year, count, metric, percentage, product name, company, school, person, place, degree and job title in the copy MUST appear in that source. Delete or generalize anything that does not. This applies to the calendar topics, hooks and actions and the growth tactics just as strictly as to the profile rewrites.\n- NEVER state a number of years of experience or expertise (for example "30 years", "15 years") unless that exact phrase is in the profile. A date range or a tenure badge is NOT permission to state a year count.
- DEGREES AND CREDENTIALS, CRITICAL: if any copy (especially a post_hook or calendar hook) says "my PhD", "my MBA", "my doctorate", "my degree in X", or names a specific degree or credential, confirm that EXACT degree appears in the profile PDF. If the PDF shows a different or lower credential (for example an M.Sc, not a PhD; a Master, not a doctorate), correct it to the real one or remove the credential claim. Never let a hook make the user publicly claim a degree, title or certification they do not hold. Also never attribute work to the wrong career stage (a PhD topic that was actually their postdoc, a result from a different role) unless the source states it.\n- NEVER state or imply a post-performance metric the screenshots do not literally show: no invented reaction, like, comment, repost, view or impression counts, and never call any past post their "best", "top", "viral" or "highest-performing" unless a screenshot shows that. If a calendar entry or growth tactic says to reuse "your post that got X reactions" and X is not visible in a screenshot, remove the number and the claim and make it generic ("a post that resonated"). This also bans COMPARATIVE and CAUSAL claims: never say one post "outperformed", "got more or fewer" than another, "travels", or "proves the format works" unless both engagement numbers are legible.\n- Never claim scope words (global, worldwide, P&L, founded, led) the source does not state.\n- COUNTED NOUNS: any count of companies, employers, industries, sectors, countries, roles, clients or careers (for example "six companies", "four industries") must match a digit that appears verbatim in the source. If the count was derived by tallying their experience entries, replace it with "multiple" or "several" and no number. Real source counts (for example a profile that literally says "100+ countries") stay.\n- RELOCATION AND NARRATIVE ARCS: delete any implied relocation, "moving back", return, or temporal sequence ("before I worked at X", "after N years in Y") that is not stated verbatim; a degree in one country plus a job in another is NOT relocation. Delete any invented origin story, motivation, belief, thesis or first-person conviction ("I have always believed...", "the real measure of success is...") the source does not actually state; keep only re-articulations of facts the source does state.\n- NAMED EXTERNAL ORGS: any named external organization, NGO, association, conference or event in growth_tactics, networking or the calendar that is NOT in the source profile must be replaced with a generic descriptor ("a relevant industry association in your field").\n- PRODUCT AND PROGRAM NAMES: any product, brand, platform, tool or program name in experience_rewrite, post_hooks, tl_analysis or the calendar that is not legible in a screenshot or stated in the profile must be deleted or generalized, and never alter the spelling of a real one.\n- TITLE FIDELITY: the title in the copy must match the title visible in the source byline or profile WORD FOR WORD. If it is promoted (more senior/broader, e.g. a C-suite title CFO/CEO/CTO, Global, Chief, Head of, President, VP when the source does not say so), demoted, or laterally re-spelled (Senior->State, VP->Director, a dropped Senior/SVP), that is a fabrication: restore the exact source title or replace it with "your current role". A regional, team or office-attached role (for example "the CFO office") is never a global or chief role.\n- SCREENSHOT FACTS ARE MISREAD-PRONE: the profile PDF text is the only reliable fact source. Any specific person name, job title, credential, number or product name in the copy must appear in the PDF text. If it could only have come from a screenshot (it is not in the PDF), treat it as a possible misread and genericize it: a "tag [Name]" becomes "tag the colleague you mentioned", a job title becomes the generic role, a specific number is dropped. If there is NO profile PDF in the source, genericize EVERY specific person name, job title, credential, named product and number in the copy, EVEN WHEN it is clearly visible in a screenshot, because a screenshot is misread-prone and is not a verification source; a title becomes the generic role, a product becomes its category, a name-to-tag becomes "the person you mentioned".\n- YEARS ON CITED WORK: never attach a publication year, founding year, or "N years ago / nearly two decades later" to a paper, study, product or event unless that exact year is in the source; drop it or hedge to "some years ago".\n- COMMERCIAL OFFERS: never invent a price, a free offer ("the first conversation is free"), a booking or CTA destination, or a productized service the profile does not state.\n- INVENTED STATISTICS: never state a world or industry statistic ("X kills more than a million people a year") as fact unless it is in the source; cut it or convert it to something for the user to verify.\n- POST-PERFORMANCE NUMBERS IN tl_analysis: the thought_leader analysis must not state any reaction, comment, repost, like, view or impression count unless it is literally legible in a screenshot; generalize any such number to "strong" engagement.\n- INVENTED SCENES AND ANECDOTES: delete any hook, calendar entry or tactic that narrates a specific scene, client question, case, conversation, patient or moment as if it happened, unless that exact scene is visible in a post screenshot. "A client asked me X", "the day someone told me Y", a named recurring question, or a described service the profile does not list are fabrications: cut them or convert to a fill-in template ("open with a real question a client has asked you").\n- CLAIMS ABOUT THEIR OWN POSTS: never assert what hashtags, formats or openers their posts use, or which post is their highest-reach, unless it is literally legible in a screenshot. Delete any specific hashtag, format-performance or "your posts always do X" claim you cannot see.\n- FLATTERING INFERENCES: do not state a background the profile does not support (a marketer is not a bench scientist; a degree is not hands-on lab work). Fusing two real facts into one more specific claim is a fabrication.\n- KEEP REAL, PROFILE-STATED FACTS, DO NOT OVER-SCRUB: do NOT anonymize, genericize, soften or delete a real employer, company, brand, product, school, language or degree that DOES appear in the profile PDF, keep it exactly as written. Turning a named current employer into "a life sciences company", or dropping a listed language or degree, is itself an error. Only genericize a name that is absent from the PDF or could only have come from a screenshot. When the name is in the PDF, the safe move is to KEEP it, not to remove it.\n- INVENTED FIRST-PERSON SCENES IN HOOKS: if a post_hook narrates a completed first-person scene the source does not show ("A patient spent a year...", "I sat in a room of 100 scientists...", "Last week I reviewed a contract...", "the day a customer explained my product back to me"), it is a fabrication: rewrite it as a SECOND-PERSON writing prompt the user can fill from their own life ("Open with the story of a time a client surprised you...") rather than a claim presented as something they already did.\n- If a role has no description in the source, its copy may only restate title and dates, never invented achievements.\n- content_calendar is an array of {topic, hook, action}; keep the same length and order and the same structure for each entry, only fact-check the text, and leave any empty string empty.\n- Keep the person's voice, tone and structure identical. Only remove or generalize unverifiable facts; change nothing already grounded.\nReturn ONLY a raw JSON object with exactly these keys: ${JSON.stringify(Object.keys(fields))}.\n\nCOPY TO FACT-CHECK:\n${JSON.stringify(fields)}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        // Must fit the ENTIRE fact-checked field set back out. At 8000 a long plan's scrub
        // output truncated, failed to parse, and silently returned the UNSCRUBBED plan —
        // quietly disabling the anti-fabrication pass exactly on the biggest reports.
        max_tokens: 16000,
        system: "You are a strict fact-checker and JSON API. Output ONLY a raw JSON object. Start with { end with }.",
        messages: [...messages, { role: "user", content: [{ type: "text", text: instruction }] }, { role: "assistant", content: "{" }],
      }),
      signal,
    });
    if (!r.ok) { console.error("[scrub] http " + r.status + " — serving unscrubbed plan"); return plan; }
    const d = await r.json().catch(() => null);
    let raw = "{" + ((d && d.content && d.content[0] && d.content[0].text) || "");
    const end = raw.lastIndexOf("}");
    if (end === -1) { console.error("[scrub] no JSON in output (stop_reason=" + (d && d.stop_reason) + ") — serving unscrubbed plan"); return plan; }
    let fixed;
    try { fixed = JSON.parse(raw.slice(0, end + 1)); } catch { console.error("[scrub] unparseable output (stop_reason=" + (d && d.stop_reason) + " len=" + raw.length + ") — serving unscrubbed plan"); return plan; }
    for (const k of Object.keys(fields)) {
      if (k === "post_hooks") { if (Array.isArray(fixed.post_hooks) && fixed.post_hooks.length) plan.post_hooks = fixed.post_hooks; }
      else if (k === "growth_tactics") { if (Array.isArray(fixed.growth_tactics) && fixed.growth_tactics.length) plan.growth_tactics = fixed.growth_tactics; }
      else if (k === "best_posting_times") { if (cs && typeof fixed.best_posting_times === "string" && fixed.best_posting_times.trim()) cs.best_posting_times = fixed.best_posting_times; }
      else if (k === "tl_analysis") { if (tl && typeof fixed.tl_analysis === "string" && fixed.tl_analysis.trim()) tl.analysis = fixed.tl_analysis; }
      else if (k === "hook_formula") { if (cs && typeof fixed.hook_formula === "string" && fixed.hook_formula.trim()) cs.hook_formula = fixed.hook_formula; }
      else if (k === "content_calendar") {
        if (Array.isArray(fixed.content_calendar) && Array.isArray(plan.content_calendar)) {
          fixed.content_calendar.forEach((fw, i) => {
            const orig = plan.content_calendar[i];
            if (orig && typeof orig === "object" && fw && typeof fw === "object") {
              if (typeof fw.topic === "string" && fw.topic.trim()) orig.topic = fw.topic;
              if (typeof orig.hook === "string" && typeof fw.hook === "string" && fw.hook.trim()) orig.hook = fw.hook;
              if (typeof fw.action === "string" && fw.action.trim()) orig.action = fw.action;
            }
          });
        }
      }
      else if (typeof fixed[k] === "string" && fixed[k].trim()) plan[k] = fixed[k];
    }
    return plan;
  } catch (e) { console.error("[scrub] " + ((e && e.name) || "error") + ": " + ((e && e.message) || "") + " — serving unscrubbed plan"); return plan; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || "unknown";
  if (!rateOk(ip)) return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
  if (!allowedOrigin(req.headers.origin || "")) return res.status(403).json({ error: "Forbidden" });

  // The signed funnel token (issued by /api/funnel-token) closes the open-relay hole:
  // each generation costs real Anthropic tokens, so callers must come through the funnel.
  // Skipped only when AUTH_SECRET is not configured (fail-open, logged).
  if (process.env.AUTH_SECRET) {
    const tok = req.headers["x-funnel-token"];
    const payload = (typeof tok === "string" && tok) ? verifyToken(tok) : null;
    if (!payload || payload.purpose !== "funnel") {
      console.error("[generate-plan] rejected: missing or invalid funnel token (ip=" + ip + ")");
      return res.status(403).json({ error: "Your session expired. Please refresh the page and try again." });
    }
  } else {
    console.error("[generate-plan] AUTH_SECRET not set - funnel token check skipped");
  }

  const { messages } = req.body || {};
  if (!validMessages(messages)) return res.status(400).json({ error: "Missing messages" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  if (!(await durableRateOk(ip, SERVICE_KEY))) {
    return res.status(429).json({ error: "You've reached the hourly analysis limit. Please try again later." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 290000);

  try {
    const messagesWithPrefill = [...messages, { role: "assistant", content: "{" }];
    const started = Date.now();

    // Up to 2 generation attempts. A single stochastic bad sample (truncated or invalid JSON)
    // used to 502 as "Malformed plan" and force the user to click regenerate — which costs the
    // same tokens as retrying here, minus the broken experience. HTTP-level errors (429/5xx)
    // still return immediately: retrying a capacity error would double-bill for nothing.
    let plan = null;
    for (let attempt = 1; attempt <= 2 && !plan; attempt++) {
      // No headroom for a second full generation near the 290s abort — bail to the error.
      // 140s keeps the worst case (gen 2 to ~290s + skipped scrub + insert) inside
      // Vercel's maxDuration 300 so the platform never hard-kills a recovered plan.
      if (attempt > 1 && Date.now() - started > 140000) break;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 24000,
          system: "You are a JSON API. Output ONLY a raw JSON object. No markdown, no backticks, no commentary. Start with { end with }.",
          messages: messagesWithPrefill,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeout);
        const err = await response.json().catch(() => ({}));
        console.error("[anthropic] " + response.status + " " + ((err && err.error && err.error.message) || ""));
        if (response.status === 429 || response.status === 529) {
          return res.status(429).json({ error: "We're at capacity right now. Please try again in a minute." });
        }
        if (response.status >= 500) {
          return res.status(502).json({ error: "The analysis service had a hiccup. Please try again." });
        }
        return res.status(502).json({ error: "Analysis failed. Please try again." });
      }

      const data = await response.json();
      const raw = "{" + ((data.content && data.content[0] && data.content[0].text) || "");

      // Control chars become spaces (invalid inside JSON strings anyway), then strip
      // trailing commas before } or ] — the two cheap fixes that never break valid JSON.
      let cleaned = "";
      for (let i = 0; i < raw.length; i++) {
        const cc = raw.charCodeAt(i);
        cleaned += (cc < 32 || (cc >= 127 && cc <= 159)) ? " " : raw[i];
      }
      let out = "";
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === ",") {
          let j = i + 1;
          while (j < cleaned.length && cleaned[j] === " ") j++;
          if (cleaned[j] === "}" || cleaned[j] === "]") continue;
        }
        out += cleaned[i];
      }

      // Fast path: parse up to the last closing brace (the intact-output case), then
      // the repair path for truncated/imbalanced output. BOTH candidates go through the
      // same completeness gate: a partial plan is never served — a valid-JSON-but-wrong-
      // shape emission (e.g. a prefill-wrapped refusal) and a tail-lossy repair both
      // count as failures so the retry can re-roll them, and after the final attempt we
      // return the honest error instead of storing a report with broken sections.
      let candidate = null;
      let parseErr = "no closing brace";
      const end = out.lastIndexOf("}");
      if (end !== -1) {
        try { candidate = JSON.parse(out.slice(0, end + 1)); parseErr = ""; } catch (e) { parseErr = e && e.message; }
      }
      let repaired = false;
      if (!candidate) {
        candidate = parseWithRepair(out);
        repaired = !!candidate;
      }
      const missing = missingPlanField(candidate);
      if (!missing) {
        plan = candidate;
        if (repaired) console.error("[generate-plan] repaired JSON accepted: attempt=" + attempt + " stop_reason=" + data.stop_reason + " len=" + raw.length);
      } else {
        console.error("[generate-plan] unusable output: attempt=" + attempt + " stop_reason=" + data.stop_reason + " len=" + raw.length + " missing=" + missing + (parseErr ? " parseErr=" + parseErr : ""));
      }
    }
    clearTimeout(timeout);
    if (!plan) return res.status(502).json({ error: "The analysis came back incomplete. Please try again." });

    // Fact-check pass (best-effort, own timeout): strip fabricated facts from the rewrite/hook
    // copy. The budget is clamped to the wall clock remaining before Vercel's maxDuration 300
    // hard-kill — a retry that finished late must not let the scrub push the whole invocation
    // past 300s and lose the recovered plan before the insert. Under ~15s of headroom the scrub
    // is skipped outright (logged): an unscrubbed complete plan beats a platform timeout.
    const elapsedBeforeScrub = Date.now() - started;
    const scrubBudget = Math.min(150000, 280000 - elapsedBeforeScrub);
    if (scrubBudget > 15000) {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), scrubBudget);
      try { plan = await scrubFabrications(messages, plan, process.env.ANTHROPIC_KEY, c2.signal); } catch (e) { /* leave plan as-is */ }
      clearTimeout(t2);
    } else {
      console.error("[generate-plan] scrub skipped: only " + scrubBudget + "ms budget left after " + elapsedBeforeScrub + "ms");
    }

    // voice_fingerprint is the generation-time voice anchor: a PORTABLE VOICE CARD (register + hook
    // shape + sign-off + emoji/hashtag pattern + tics + cadence), never their post content and never a
    // company/product name to reuse. Persist it ONLY when it was derived from the user's OWN post
    // screenshots (images present), so the Post Writer can reuse their tone without making them
    // re-upload. GUARD: when there is no authored voice (reshares only / no consistent voice) the model
    // emits the sentinel "NO AUTHORED VOICE" - never store that, so we never claim a voice we don't have.
    const NO_VOICE = /no authored voice|only reshares|no consistent (authored )?voice|no clear (authored )?voice|cannot determine a voice/i;
    const hadPostImages = Array.isArray(messages) && messages.some((m) => m && Array.isArray(m.content) && m.content.some((c) => c && c.type === "image"));
    const rawVf = (hadPostImages && plan && typeof plan.voice_fingerprint === "string") ? plan.voice_fingerprint.trim() : "";
    const voiceFingerprint = (rawVf && rawVf.length >= 20 && !NO_VOICE.test(rawVf)) ? rawVf.slice(0, 1500) : null;
    if (plan && typeof plan === "object") delete plan.voice_fingerprint;

    // 8s cap per insert: in the tightest recovery path (~291s elapsed) a hung Supabase call
    // must fail into the clean 500 below, not push the invocation into Vercel's 300s hard-kill.
    const insertPlan = (body) => fetch(SUPABASE_URL + "/rest/v1/gated_plans", {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    let ins = await insertPlan(voiceFingerprint ? { plan_data: plan, voice_fingerprint: voiceFingerprint } : { plan_data: plan });
    if (!ins.ok && voiceFingerprint) {
      // Resilience: if the voice_fingerprint column is missing (migration not applied) or the
      // insert fails for any reason tied to it, retry WITHOUT the column. Losing the saved tone
      // is acceptable; failing the user's whole analysis is not.
      const e1 = await ins.text().catch(() => "");
      console.error("[gated_plans insert with voice_fingerprint] " + ins.status + " " + e1 + " — retrying without it");
      ins = await insertPlan({ plan_data: plan });
    }
    if (!ins.ok) {
      const e = await ins.text().catch(() => "");
      console.error("[gated_plans insert] " + ins.status + " " + e);
      return res.status(500).json({ error: "Could not store plan" });
    }
    const rows = await ins.json();
    const planId = rows && rows[0] && rows[0].id;
    if (!planId) return res.status(500).json({ error: "Could not store plan" });

    // Non-sensitive teaser for the email gate (scores + archetype only; the full
    // report stays gated). Fully optional — any failure leaves teaser null and the
    // planId flow is unaffected.
    let teaser = null;
    try {
      const ps = plan.profile_scores || {};
      const ssi = plan.ssi_plan || {};
      const tl = plan.thought_leader || {};
      teaser = {
        archetype: typeof plan.archetype === "string" ? plan.archetype : null,
        profileOverall: Number(ps.overall) || null,
        ssiTotal: (ssi.available && Number(ssi.total)) ? Number(ssi.total) : null,
        tlAvailable: !!tl.available,
        tlScore: tl.available ? (Number(tl.score) || 0) : null,
      };
    } catch (e) { teaser = null; }

    return res.status(200).json({ planId: planId, ready: true, teaser: teaser });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") return res.status(504).json({ error: "Analysis timed out. Please try again." });
    console.error("[generate-plan] " + (e && e.message));
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
}
