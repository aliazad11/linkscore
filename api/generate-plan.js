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
