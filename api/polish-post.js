// Post writer: turns a user's rough draft into a LinkedIn-ready post in THEIR own voice.
// Signed-in only (it is a paid LLM call, so we gate it behind a session). Node runtime.
import { readSession } from "./_auth.js";

export const config = { maxDuration: 30 };

const LANG = { en: "English", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", nl: "Dutch", it: "Italian" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const s = readSession(req);
  if (!s || s.purpose !== "session" || !s.email) return res.status(401).json({ error: "Sign in to use the post writer" });
  const key = process.env.ANTHROPIC_KEY;
  if (!key) return res.status(500).json({ error: "Server not configured" });

  const draft = String((req.body && req.body.draft) || "").slice(0, 5000).trim();
  if (draft.length < 15) return res.status(400).json({ error: "Write a few more words first" });
  const locale = (req.body && typeof req.body.locale === "string") ? req.body.locale : "en";
  const langName = LANG[locale] || "English";
  // Optional voice samples: screenshots of the user's own posts (base64 image parts).
  const rawSamples = Array.isArray(req.body && req.body.samples) ? req.body.samples : [];
  const samples = rawSamples
    .filter((s) => s && typeof s.data === "string" && s.data.length > 100 && /^image\/(png|jpe?g|webp|gif)$/.test(s.media_type || ""))
    .slice(0, 3);

  const system = `You are an elite LinkedIn ghostwriter. You take a person's rough draft and rewrite it into one strong, native LinkedIn post that sounds like THEM, only sharper.

HARD RULES:
- Mirror the writer's own voice, vocabulary and point of view. ${samples.length ? "Screenshots of the writer's OWN past LinkedIn posts are attached - study them closely and match their cadence, sentence length, vocabulary, formatting and personality precisely." : "Infer the voice from the draft itself."} Do NOT impose a generic "LinkedIn influencer" voice. If they write plain and direct, keep it plain and direct.
- Keep every fact, claim, name, number and story from the draft. Invent NOTHING - no fake metrics, anecdotes, companies or results. If the draft is thin, keep the post short rather than padding it.
- Structure for the platform: the first 1 to 2 lines must earn the "see more" click. Short scannable paragraphs (1 to 3 lines each) with blank lines between them. End with one genuine question or a light invitation to engage.
- No engagement bait ("comment YES", "agree?"), no hashtag spam (0 to 3 relevant hashtags maximum, only if natural), no links in the body.
- Write in ${langName}.${locale === "en" ? " American English, no Oxford comma, no em dashes or long dashes." : ""}
- Output ONLY the finished post text. No preamble, no "Here is your post", no surrounding quotes, no notes.`;

  const content = [];
  for (const s of samples) content.push({ type: "image", source: { type: "base64", media_type: s.media_type, data: s.data } });
  content.push({ type: "text", text: (samples.length
    ? "The screenshots above are my own past LinkedIn posts. Match my voice exactly. Now rewrite this rough draft into one LinkedIn-ready post in that voice:\n\n"
    : "Here is my rough draft. Rewrite it into one LinkedIn-ready post in my voice:\n\n") + draft });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content }],
      }),
    });
    if (!r.ok) {
      const e = await r.text().catch(() => "");
      console.error("[polish-post] " + r.status + " " + e);
      return res.status(502).json({ error: "Could not write the post. Try again." });
    }
    const data = await r.json();
    const post = ((data && data.content && data.content[0] && data.content[0].text) || "").trim();
    if (!post) return res.status(502).json({ error: "Empty response. Try again." });
    return res.status(200).json({ post });
  } catch (e) {
    console.error("[polish-post] " + (e && e.message));
    return res.status(500).json({ error: "Could not write the post. Try again." });
  }
}
