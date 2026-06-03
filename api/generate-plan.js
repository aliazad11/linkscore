export const config = { maxDuration: 300 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages } = req.body || {};
  if (!messages) return res.status(400).json({ error: "Missing messages" });

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
      return res.status(400).json({ error: (err && err.error && err.error.message) || ("HTTP " + response.status) });
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

    return res.status(200).json({ planId: planId, ready: true });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") return res.status(504).json({ error: "Analysis timed out. Please try again." });
    return res.status(500).json({ error: e.message });
  }
}
