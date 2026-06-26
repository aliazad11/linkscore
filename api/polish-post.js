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

  const system = `Your ONLY job is to make this post sound like it was written by THIS specific person - not by you, and not by a generic LinkedIn writer. Matching their authentic voice matters MORE than making the post "better", smoother or more clever.

${samples.length ? `You have screenshots of the writer's OWN recent LinkedIn posts. Study them HARD before writing, and copy these exactly:
- CADENCE: their real sentence length and rhythm. If they write long, flowing, comma-chained sentences, KEEP them long - do NOT chop their writing into short one-line fragments. If they write short and clipped, stay short. Match their rhythm; never impose your own.
- HOW THEY END: copy their closing move. If their own posts do NOT end by asking the reader a question, you must NOT add one. Most people do not. Never tack on a "What do you think?" / "What's your experience?" style closer unless they genuinely write that way.
- RITUALS: hashtags (how many, and whether in the body or at the end, or none at all), emoji (which ones and where), how they write names and tags, their sign-off line. Reproduce these exactly - zero hashtags means zero, three at the end means three.
- THEIR ACTUAL WORDS: their vocabulary, phrasings and quirks. If they write in warm non-native English (abbreviations like "incl.", phrasings like "so much more insights", all-caps emphasis like "big THANKS"), KEEP all of it. Do NOT correct their grammar, do NOT upgrade their vocabulary, do NOT smooth their idioms. Polished, fluent English is a dead giveaway that it is not them.` : `Infer the writer's voice from the draft itself and stay true to it. Do not make it more polished or more clever than they are. Do NOT add a reader-question at the end unless the draft already asks one.`}

HARD RULES:
- Mirror that voice precisely. Do NOT layer a generic, punchy "LinkedIn influencer" style on top of theirs.
- Keep every fact, claim, name, number and story from the draft. Invent NOTHING - no fake metrics, anecdotes, companies or results.
- Do NOT invent metaphors, parallel-structure punchlines or aphorisms (for example "Don't tend one tree, grow a garden" or "Different vehicles, same destination") that are not already in their own posts. Use only the rhetorical moves they actually use.
- Keep it readable on LinkedIn with line breaks between thoughts, but the line LENGTH and rhythm must be THEIRS, not a generic short-line template.
- Before finishing, silently compare your draft to their real posts. If any line sounds more like a ghostwriter than like them, rewrite it to sound like them.
- Write in ${langName}.${locale === "en" ? " American English, no Oxford comma, no em dashes or long dashes." : ""}
- Output ONLY the finished post. No preamble, no analysis, no "here is your post", no surrounding quotes, and no placeholder brackets like [tag teammates] - if you do not know something, leave it out.`;

  const content = [];
  for (const s of samples) content.push({ type: "image", source: { type: "base64", media_type: s.media_type, data: s.data } });
  content.push({ type: "text", text: (samples.length
    ? "Above are screenshots of my own past LinkedIn posts - this is exactly how I write. Match my voice, rhythm, closing style and quirks. Now turn this rough draft into ONE finished LinkedIn post in MY voice:\n\n"
    : "Here is my rough draft. Turn it into one finished LinkedIn post in my voice:\n\n") + draft });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
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
