// Post writer (two-pass). Turns a user's rough draft into a LinkedIn post in THEIR voice.
// Pass 1 (only if they uploaded post screenshots): vision builds a measured VOICE SPEC - cadence
// stats, rituals, signature phrases, closer type - which is never shown to the user.
// Pass 2: writes the post strictly to that spec, with a ban-list of the model's own tics and an
// anti-punch-up rule. Signed-in only (paid LLM calls). Node runtime.
import { readSession } from "./_auth.js";

export const config = { maxDuration: 45 };

const MODEL = "claude-sonnet-4-5-20250929";
const LANG = { en: "English", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", nl: "Dutch", it: "Italian" };

async function anthropic(key, body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.text().catch(() => ""); throw new Error(r.status + " " + e); }
  const data = await r.json();
  return ((data && data.content && data.content[0] && data.content[0].text) || "").trim();
}

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
  const enStyle = locale === "en" ? " American English, no Oxford comma, no em dashes or long dashes." : "";
  const samples = (Array.isArray(req.body && req.body.samples) ? req.body.samples : [])
    .filter((x) => x && typeof x.data === "string" && x.data.length > 100 && /^image\/(png|jpe?g|webp|gif)$/.test(x.media_type || ""))
    .slice(0, 3);

  try {
    // ── Pass 1: measure the voice from their screenshots (private spec) ──────
    let spec = null;
    if (samples.length) {
      const specSys = `You are a forensic writing analyst. You receive screenshots of ONE person's real LinkedIn posts. Output a precise VOICE SPEC describing HOW this person writes (not their topics). Measure, do not guess. Output ONLY a JSON object, no prose, with exactly these keys:
{"avg_sentence_words": <int>, "sentence_style": "short_clipped"|"long_flowing"|"mixed", "fragments": "frequent"|"rare"|"none", "emoji": "<exact: none, or which and where>", "exclamation": "none"|"occasional"|"frequent", "hashtags": "<exact: none, or how many and where (inline/end)>", "asks_reader_question": <true|false: do their posts END by asking the reader a question>, "gratitude_phrasing": "<their exact wording when thanking people, verbatim, or empty>", "sign_off": "<their typical closing line verbatim, or empty>", "signature_phrases": ["<1-3 verbatim phrases or quirks unique to them>"], "non_native_markers": "<non-native English quirks to preserve: abbreviations, constructions, all-caps emphasis; or empty>", "register": "<3-6 words on their tone>"}`;
      const content = samples.map((x) => ({ type: "image", source: { type: "base64", media_type: x.media_type, data: x.data } }));
      content.push({ type: "text", text: "These are my real LinkedIn posts. Produce the VOICE SPEC JSON." });
      try {
        const raw = await anthropic(key, { model: MODEL, max_tokens: 700, system: specSys, messages: [{ role: "user", content }] });
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) spec = JSON.parse(m[0]);
      } catch (e) { console.error("[polish-post] spec " + (e && e.message)); spec = null; }
    }

    // ── Pass 2: write the post strictly to the spec (or infer from draft) ─────
    let writeSys;
    if (spec) {
      writeSys = `You rewrite a rough draft into ONE finished LinkedIn post that sounds EXACTLY like a specific person. Matching their voice matters MORE than making the post better, smoother or more engaging.

Here is the measured VOICE SPEC of that person. Follow every field precisely:
${JSON.stringify(spec)}

RULES:
- CADENCE: aim for about ${spec.avg_sentence_words || 20} words per sentence, style "${spec.sentence_style || "mixed"}". ${spec.fragments === "frequent" ? "They use short fragments as punchlines, so you may too." : "They do NOT write in short fragments, so do NOT chop sentences into one-line fragments."} Match their rhythm, never impose a generic short-line template.
- CLOSER: ${spec.asks_reader_question ? "they DO end by asking the reader a question, so you may end with one in their style." : "they do NOT end with a reader-question, so you MUST NOT add one. End the way they end" + (spec.sign_off ? ' (their sign-off: "' + spec.sign_off + '").' : ".")}
- RITUALS, reproduce exactly: hashtags = ${spec.hashtags || "none"}; emoji = ${spec.emoji || "none"}; exclamation marks = ${spec.exclamation || "none"}.
- WORDS: if thanking people use their phrasing${spec.gratitude_phrasing ? ' ("' + spec.gratitude_phrasing + '")' : ""}. Keep their non-native English markers verbatim${spec.non_native_markers ? " (" + spec.non_native_markers + ")" : ""} - do NOT correct grammar or upgrade vocabulary; fluent polish is a tell it is not them. Work in at least one of their signature phrases verbatim if it fits: ${JSON.stringify(spec.signature_phrases || [])}.
- ANTI-PUNCH-UP: do NOT make the post more energetic, concise, polished or "engaging" than their real posts. If they write flat, formal or run-on, keep it flat, formal or run-on. Restraint is the goal.
- BANNED (these are the AI's OWN tics, not theirs - never use unless they appear in the spec): "Big THANKS", "I'm thrilled to share", "incl.", colon-reveal hooks ("The result:"), "X = Y" equation lines, "not X, it's Y" antithesis.
- Keep every fact, name, number and story from the draft. Invent NOTHING - no events, dates, anecdotes or memories that are not in the draft.
- Write in ${langName}.${enStyle}
- Output ONLY the post body. No preamble, no analysis, no "here is your post", no surrounding quotes, no placeholder brackets like [tag teammates] - if you do not know something, omit it.`;
    } else {
      writeSys = `You rewrite a rough draft into ONE finished LinkedIn post in the writer's own voice. Infer their voice from the draft and stay true to it. Do NOT make it more polished, energetic or clever than they are.

RULES:
- Do NOT add a reader-question at the end unless the draft already asks one. No "What do you think?" closers.
- Do NOT chop the writing into a generic short-line template; keep their natural rhythm.
- Keep every fact, name, number and story. Invent NOTHING. No invented metaphors, aphorisms, events or dates.
- Do NOT use generic AI tics: "Big THANKS", "I'm thrilled to share", colon-reveal hooks.
- Write in ${langName}.${enStyle}
- Output ONLY the post body. No preamble, no surrounding quotes, no placeholder brackets.`;
    }

    const post = await anthropic(key, { model: MODEL, max_tokens: 1500, system: writeSys, messages: [{ role: "user", content: "Here is my rough draft. Turn it into ONE finished LinkedIn post in my voice:\n\n" + draft }] });
    if (!post) return res.status(502).json({ error: "Empty response. Try again." });
    return res.status(200).json({ post });
  } catch (e) {
    console.error("[polish-post] " + (e && e.message));
    return res.status(502).json({ error: "Could not write the post. Try again." });
  }
}
