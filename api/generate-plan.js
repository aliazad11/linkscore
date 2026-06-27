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
  if (!Object.keys(fields).length) return plan;
  const instruction = `The profile and post screenshots above are the ONLY source of truth. Below is copy that was written from them. Fact-check it HARD and return a corrected version. Be AGGRESSIVE: when any fact is not clearly and verbatim in the source, delete it or replace it with generic phrasing. When in doubt, cut it. A user must never paste a number, year, credential or claim that is not in their own profile.\n- Every number, year, count, metric, percentage, product name, company, school, person, place, degree and job title in the copy MUST appear in that source. Delete or generalize anything that does not.\n- NEVER state a number of years of experience or expertise (for example "30 years", "15 years") unless that exact phrase is in the profile. A date range or a tenure badge is NOT permission to state a year count.\n- Never claim scope words (global, worldwide, P&L, founded, led) the source does not state.\n- If a role has no description in the source, its copy may only restate title and dates, never invented achievements.\n- Keep the person's voice, tone and structure identical. Only remove or generalize unverifiable facts; change nothing already grounded.\nReturn ONLY a raw JSON object with exactly these keys: ${JSON.stringify(Object.keys(fields))}.\n\nCOPY TO FACT-CHECK:\n${JSON.stringify(fields)}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 3000,
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
    const messagesWithPrefill = [...messages, { role: "assistant", content: "{" }];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 6000,
        system: "You are a JSON API. Output ONLY a raw JSON object. No markdown, no backticks, no commentary. Start with { end with }.",
        messages: messagesWithPrefill,
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
    let raw = "{" + ((data.content && data.content[0] && data.content[0].text) || "");
    const end = raw.lastIndexOf("}");
    if (end === -1) return res.status(502).json({ error: "Malformed plan" });

    let s = raw.slice(0, end + 1);
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
    try { plan = JSON.parse(out); } catch (e) { return res.status(502).json({ error: "Malformed plan" }); }

    // Fact-check pass (best-effort, own timeout): strip fabricated facts from the rewrite/hook copy.
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 120000);
    try { plan = await scrubFabrications(messages, plan, process.env.ANTHROPIC_KEY, c2.signal); } catch (e) { /* leave plan as-is */ }
    clearTimeout(t2);

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
