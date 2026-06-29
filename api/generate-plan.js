export const config = { maxDuration: 300 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

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
  const instruction = `${sourceLine} Below is copy that was written from them (profile rewrites, post hooks, the 4-week content calendar, growth tactics and content-strategy lines). Fact-check ALL of it HARD and return a corrected version. Be AGGRESSIVE: when any fact is not clearly and verbatim in the source, delete it or replace it with generic phrasing. When in doubt, cut it. A user must never paste a number, year, credential, claim or post metric that is not in their own profile or screenshots.\n- Every number, year, count, metric, percentage, product name, company, school, person, place, degree and job title in the copy MUST appear in that source. Delete or generalize anything that does not. This applies to the calendar topics, hooks and actions and the growth tactics just as strictly as to the profile rewrites.\n- NEVER state a number of years of experience or expertise (for example "30 years", "15 years") unless that exact phrase is in the profile. A date range or a tenure badge is NOT permission to state a year count.\n- NEVER state or imply a post-performance metric the screenshots do not literally show: no invented reaction, like, comment, repost, view or impression counts, and never call any past post their "best", "top", "viral" or "highest-performing" unless a screenshot shows that. If a calendar entry or growth tactic says to reuse "your post that got X reactions" and X is not visible in a screenshot, remove the number and the claim and make it generic ("a post that resonated"). This also bans COMPARATIVE and CAUSAL claims: never say one post "outperformed", "got more or fewer" than another, "travels", or "proves the format works" unless both engagement numbers are legible.\n- Never claim scope words (global, worldwide, P&L, founded, led) the source does not state.\n- COUNTED NOUNS: any count of companies, employers, industries, sectors, countries, roles, clients or careers (for example "six companies", "four industries") must match a digit that appears verbatim in the source. If the count was derived by tallying their experience entries, replace it with "multiple" or "several" and no number. Real source counts (for example a profile that literally says "100+ countries") stay.\n- RELOCATION AND NARRATIVE ARCS: delete any implied relocation, "moving back", return, or temporal sequence ("before I worked at X", "after N years in Y") that is not stated verbatim; a degree in one country plus a job in another is NOT relocation. Delete any invented origin story, motivation, belief, thesis or first-person conviction ("I have always believed...", "the real measure of success is...") the source does not actually state; keep only re-articulations of facts the source does state.\n- NAMED EXTERNAL ORGS: any named external organization, NGO, association, conference or event in growth_tactics, networking or the calendar that is NOT in the source profile must be replaced with a generic descriptor ("a relevant industry association in your field").\n- PRODUCT AND PROGRAM NAMES: any product, brand, platform, tool or program name in experience_rewrite, post_hooks, tl_analysis or the calendar that is not legible in a screenshot or stated in the profile must be deleted or generalized, and never alter the spelling of a real one.\n- TITLE FIDELITY: the title in the copy must match the title visible in the source byline or profile WORD FOR WORD. If it is promoted (more senior/broader, e.g. a C-suite title CFO/CEO/CTO, Global, Chief, Head of, President, VP when the source does not say so), demoted, or laterally re-spelled (Senior->State, VP->Director, a dropped Senior/SVP), that is a fabrication: restore the exact source title or replace it with "your current role". A regional, team or office-attached role (for example "the CFO office") is never a global or chief role.\n- SCREENSHOT FACTS ARE MISREAD-PRONE: the profile PDF text is the only reliable fact source. Any specific person name, job title, credential, number or product name in the copy must appear in the PDF text. If it could only have come from a screenshot (it is not in the PDF), treat it as a possible misread and genericize it: a "tag [Name]" becomes "tag the colleague you mentioned", a job title becomes the generic role, a specific number is dropped. If there is NO profile PDF in the source, genericize EVERY specific person name, job title, credential, named product and number in the copy, EVEN WHEN it is clearly visible in a screenshot, because a screenshot is misread-prone and is not a verification source; a title becomes the generic role, a product becomes its category, a name-to-tag becomes "the person you mentioned".\n- YEARS ON CITED WORK: never attach a publication year, founding year, or "N years ago / nearly two decades later" to a paper, study, product or event unless that exact year is in the source; drop it or hedge to "some years ago".\n- COMMERCIAL OFFERS: never invent a price, a free offer ("the first conversation is free"), a booking or CTA destination, or a productized service the profile does not state.\n- INVENTED STATISTICS: never state a world or industry statistic ("X kills more than a million people a year") as fact unless it is in the source; cut it or convert it to something for the user to verify.\n- POST-PERFORMANCE NUMBERS IN tl_analysis: the thought_leader analysis must not state any reaction, comment, repost, like, view or impression count unless it is literally legible in a screenshot; generalize any such number to "strong" engagement.\n- INVENTED SCENES AND ANECDOTES: delete any hook, calendar entry or tactic that narrates a specific scene, client question, case, conversation, patient or moment as if it happened, unless that exact scene is visible in a post screenshot. "A client asked me X", "the day someone told me Y", a named recurring question, or a described service the profile does not list are fabrications: cut them or convert to a fill-in template ("open with a real question a client has asked you").\n- CLAIMS ABOUT THEIR OWN POSTS: never assert what hashtags, formats or openers their posts use, or which post is their highest-reach, unless it is literally legible in a screenshot. Delete any specific hashtag, format-performance or "your posts always do X" claim you cannot see.\n- FLATTERING INFERENCES: do not state a background the profile does not support (a marketer is not a bench scientist; a degree is not hands-on lab work). Fusing two real facts into one more specific claim is a fabrication.\n- If a role has no description in the source, its copy may only restate title and dates, never invented achievements.\n- content_calendar is an array of {topic, hook, action}; keep the same length and order and the same structure for each entry, only fact-check the text, and leave any empty string empty.\n- Keep the person's voice, tone and structure identical. Only remove or generalize unverifiable facts; change nothing already grounded.\nReturn ONLY a raw JSON object with exactly these keys: ${JSON.stringify(Object.keys(fields))}.\n\nCOPY TO FACT-CHECK:\n${JSON.stringify(fields)}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        system: "You are a strict fact-checker and JSON API. Output ONLY a raw JSON object. Start with { end with }.",
        messages: [...messages, { role: "user", content: [{ type: "text", text: instruction }] }, { role: "assistant", content: "{" }],
      }),
      signal,
    });
    if (!r.ok) return plan;
    const d = await r.json().catch(() => null);
    let raw = "{" + ((d && d.content && d.content[0] && d.content[0].text) || "");
    const end = raw.lastIndexOf("}");
    if (end === -1) return plan;
    let fixed;
    try { fixed = JSON.parse(raw.slice(0, end + 1)); } catch { return plan; }
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
  } catch (e) { return plan; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || "unknown";
  if (!rateOk(ip)) return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });

  const { messages } = req.body || {};
  if (!validMessages(messages)) return res.status(400).json({ error: "Missing messages" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 290000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 16000,
        // Opus 4.8 rejects a trailing assistant-message prefill (400), so we no longer prefill "{".
        // The system prompt plus the lenient JSON-span parse below handle output shape.
        system: "You are a JSON API. Output ONLY a raw JSON object. No markdown, no backticks, no commentary. Start with { end with }.",
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
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
    const txt = (data.content && data.content[0] && data.content[0].text) || "";
    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) { console.error("[gen] no-json stop=" + data.stop_reason + " outlen=" + txt.length); return res.status(502).json({ error: "Malformed plan" }); }

    let s = txt.slice(start, end + 1);
    let cleaned = "";
    for (let i = 0; i < s.length; i++) {
      const cc = s.charCodeAt(i);
      cleaned += (cc < 32 || (cc >= 127 && cc <= 159)) ? " " : s[i];
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

    let plan;
    try { plan = JSON.parse(out); } catch (e) { console.error("[gen] parse-fail stop=" + data.stop_reason + " outlen=" + txt.length + " tail=" + JSON.stringify(txt.slice(-180))); return res.status(502).json({ error: "Malformed plan" }); }

    // Fact-check pass (best-effort, own timeout): strip fabricated facts from the rewrite/hook copy.
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 120000);
    try { plan = await scrubFabrications(messages, plan, process.env.ANTHROPIC_KEY, c2.signal); } catch (e) { /* leave plan as-is */ }
    clearTimeout(t2);

    // voice_fingerprint is an internal generation-time voice anchor only; never store it or surface it to the UI.
    if (plan && typeof plan === "object") delete plan.voice_fingerprint;

    const ins = await fetch(SUPABASE_URL + "/rest/v1/gated_plans", {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ plan_data: plan }),
    });
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
