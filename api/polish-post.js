// Post writer / trusted-adviser engine: a rough draft -> an engagement-optimized LinkedIn post in the
// user's OWN voice. Pipeline: scan voice + signature moves from optional post screenshots (vision) ->
// generate N candidates (hook <=210 chars + story body + outro, link kept OUT of the post for reach) ->
// pick the most engaging AND most-them. If the draft has a link, we return it as a ready first comment
// plus a plain-English note on why it goes there. Signed-in only (paid LLM calls). Node runtime.
import { readSession, allowedOrigin } from "./_auth.js";
import { durableRateOk } from "./_ratelimit.js";

// In-memory backstop (per lambda instance) under the durable per-account cap below:
// a free magic-link account must not be a scriptable proxy onto our Anthropic key.
const ppHits = new Map();
function ppBurstOk(email) {
  const now = Date.now();
  const arr = (ppHits.get(email) || []).filter((t) => now - t < 60000);
  arr.push(now);
  ppHits.set(email, arr);
  return arr.length <= 5;
}

export const config = { maxDuration: 60 };

const MODEL = "claude-sonnet-4-5-20250929";
const LANG = { en: "English", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", nl: "Dutch", it: "Italian" };
const N = 3; // candidates per post (best-of-N kills the catastrophic single-draw miss)
const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";

// Reuse the tone-of-voice fingerprint we saved from this user's profile analysis (their OWN posts),
// so a signed-in user who already uploaded posts in the questionnaire is not asked to re-upload.
// Returns a short STYLE description string (register + habits, never their post content), or null.
async function fetchSavedTone(email) {
  try {
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!key || !email) return null;
    const r = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?email=eq." + encodeURIComponent(email) + "&voice_fingerprint=not.is.null&select=voice_fingerprint&order=created_at.desc&limit=1", {
      headers: { "apikey": key, "Authorization": "Bearer " + key },
    });
    if (!r.ok) return null;
    const rows = await r.json().catch(() => []);
    const vf = rows && rows[0] && rows[0].voice_fingerprint;
    return (typeof vf === "string" && vf.trim()) ? vf.trim() : null;
  } catch (e) { return null; }
}

// ---- deterministic helpers --------------------------------------------------
const EMOJI_TEST = /\p{Extended_Pictographic}/u;
const EMOJI_STRIP = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}️‍]/gu;
const HASH_TEST = /(?:^|\s)#[\p{L}\p{N}_]+/u;
const HASH_STRIP = /(^|\s)#[\p{L}\p{N}_]+/gu;
const URL_RE = /\b(?:https?:\/\/|www\.|lnkd\.in\/)\S+/i;
const URL_RE_G = /\b(?:https?:\/\/|www\.|lnkd\.in\/)\S+/gi;

function firstUrl(t) { const m = String(t || "").match(URL_RE); return m ? m[0].replace(/[.,)\]]+$/, "") : ""; }
function stripUrls(t) { return String(t || "").replace(URL_RE_G, "").replace(/\(\s*\)/g, "").replace(/[ \t]{2,}/g, " ").replace(/ +([.,!?;:])/g, "$1").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function stripMarkdown(s) { return String(s).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?;:]|$)/g, "$1$2").replace(/\*\*/g, "").replace(/^\s{0,3}#{1,6}\s+/gm, ""); }
function stripEmoji(t) { return String(t).replace(EMOJI_STRIP, "").replace(/[ \t]{2,}/g, " ").replace(/ +([.,!?;:])/g, "$1").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function stripHash(t) { return String(t).replace(HASH_STRIP, "$1").replace(/ {2,}/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function usesEmoji(v) { return v && (v.examples || []).some((e) => EMOJI_TEST.test(String(e))); }
function usesHash(v) { return v && (v.examples || []).some((e) => HASH_TEST.test(String(e))); }
function introChars(t) { const s = String(t || "").trim(); const i = s.indexOf("\n\n"); return (i >= 0 ? s.slice(0, i) : s).length; }

async function callClaude(key, system, content, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) { const e = await r.text().catch(() => ""); console.error("[polish-post] " + r.status + " " + e); return null; }
  const d = await r.json().catch(() => null);
  return ((d && d.content && d.content[0] && d.content[0].text) || "").trim();
}
function parseJson(t) { if (!t) return null; const a = t.indexOf("{"), b = t.lastIndexOf("}"); if (a < 0 || b < a) return null; try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; } }

// Scan the user's own posts (screenshots) into a voice profile + signature moves.
async function scanVoice(key, samples) {
  const content = [];
  for (const s of samples) content.push({ type: "image", source: { type: "base64", media_type: s.media_type, data: s.data } });
  content.push({ type: "text", text: `Above are screenshots of ONE person's real LinkedIn posts. Analyze how they write and return ONLY raw JSON:
{"examples":["the FULL verbatim text of each post, copied exactly, keep line breaks, emoji, hashtags, typos, caps, abbreviations"],"voiceSummary":"1-2 sentences on their overall voice","hook":"how their posts typically open","sentenceStyle":"their sentence length and rhythm","emojiUse":"none, or which emoji and where","hashtagUse":"none / a few at the end / inline","signoff":"how they close","dos":["2-4 habits to always reproduce"],"signatures":["2-4 MOST DISTINCTIVE signature moves a ghostwriter MUST hit to pass as this person, concrete and specific to THEM, only moves visible in their posts"]}` });
  const v = parseJson(await callClaude(key, "You are a JSON API. Output ONLY a raw JSON object, no markdown, no commentary.", content, 1600));
  return v && Array.isArray(v.examples) && v.examples.length ? v : null;
}

function voiceBlock(v) {
  const ex = (v.examples || []).map((e, i) => `--- Post ${i + 1} they wrote ---\n${e}`).join("\n\n");
  const sig = (v.signatures || []).length ? `\nTHEIR SIGNATURE MOVES (lean HARD into the ones that fit this content; never force one the facts do not support, e.g. do not invent names or checkmark lists with nothing to list):\n${v.signatures.map((s) => `- ${s}`).join("\n")}\n` : "";
  return `THEIR VOICE PROFILE:
Voice: ${v.voiceSummary || ""}
Hook: ${v.hook || ""}
Sentence style: ${v.sentenceStyle || ""}
Emoji: ${v.emojiUse || "match their habit"}
Hashtags: ${v.hashtagUse || "match their habit"}
Sign-off: ${v.signoff || ""}
${v.dos && v.dos.length ? `Habits: ${v.dos.join("; ")}` : ""}${sig}

THEIR OWN POSTS (emulate the VOICE exactly, never copy a fact from them):
${ex || "  (none)"}`;
}

const TAKES = [
  "Open on the single most scroll-stopping angle of this story.",
  "Open on a surprising, contrarian or counter-intuitive angle, in their voice.",
  "Open on a personal, human moment that pulls the reader straight in.",
];

function writePrompt(v, draft, langName, take, hasLink, locale) {
  let voice;
  if (typeof v === "string" && v.trim()) {
    voice = `THE WRITER'S PORTABLE VOICE CARD, saved from the analysis of their OWN posts. Match it for STYLE only:\n${v.trim()}\nReproduce their REGISTER, their HOOK SHAPE, their SIGN-OFF style, their EMOJI and HASHTAG PATTERN, and their TICS. If the card shows emoji, hashtags, exclamation marks, gratitude phrasing, or imperfect or non-native English, your post must carry those too.\nHARD RULE: the card describes HOW they write, not WHAT they write about. NEVER import a company, employer, product, client, event, place, or specific hashtag word from the card into this post. This post is ONLY about the rough draft's topic. Do NOT make it more polished, more confident, or more like a generic LinkedIn influencer than the card describes.\n\n`;
  } else if (v) {
    voice = voiceBlock(v) + "\n\n";
  } else {
    voice = "Infer the writer's voice from the rough draft below and stay true to it. Do not make it more polished or more like a generic LinkedIn influencer than they are.\n\n";
  }
  return `${voice}You are this person's trusted LinkedIn adviser. Turn the rough draft below into ONE scroll-stopping, engagement-optimized LinkedIn post, written 100% in THEIR voice: their vocabulary, rhythm, warmth or coolness, emoji and hashtag habits. If their real posts are plain, messy, broken or emoji-heavy, KEEP that texture, never sanitize them into clean generic influencer copy.

SHAPE, follow exactly:
1. HOOK: the first 1 to 2 short lines (about 140 characters) are ALL most people see on mobile before the "see more" fold. Those first 1 to 2 lines must stop the scroll and earn the click ON THEIR OWN. Put the most arresting, specific idea in the very first line. NEVER bury the hook below a line break, and no throat-clearing ("I'm excited to share", "I wanted to talk about").
2. BODY: tell it as a STORY, a moment, a tension, a turn or a lesson, in short scannable paragraphs, in their voice.
3. OUTRO: close in their voice, ending with a light question or invitation (only if that fits how they actually write).
APPROACH FOR THIS VERSION: ${take}
${hasLink ? `LINK RULE: do NOT put the link or ANY url in the post. The link will go in the first comment, which protects the post's reach. You may add a short natural pointer like "link in the comments" only if it fits their voice.` : ""}
RULES: keep every fact from the draft, invent nothing (no fake metrics, names, dates), NO invented scenes, quotes, client lines or events the draft does not contain, no [bracket] placeholders, no markdown characters. Match their real hashtag habit from the voice card (the same count and the same branded-vs-generic, lowercase-vs-uppercase pattern), never bolt on generic English tags if their card shows fewer, branded or lowercase ones. Write in ${langName}.${locale === "en" ? " American English, no Oxford comma, no em dashes or long dashes unless their own posts use them." : ""} Output ONLY the finished post text, no preamble, no quotes, no notes.

ROUGH DRAFT (use only for the subject and facts, it has no voice of its own):
"""${draft}"""`;
}

// Strip leaked scaffolding: a leading meta/reasoning preamble, standalone "---" rules, and a trailing
// "Note for you:/P.S." coaching block the model sometimes appends. A user pastes this verbatim, so any
// of these is publish-fatal.
function stripScaffold(t) {
  let lines = String(t || "").split("\n");
  const META = /^(the skill\b|here(?:'s| is| are)\b|note( for| to)?\b|i'?ll write\b|i will write\b|sure[,!]|okay[,!]|below is\b|as requested\b|voice card\b|this (?:post|skill)\b)/i;
  while (lines.length && (!lines[0].trim() || /^[-*_]{2,}$/.test(lines[0].trim()) || META.test(lines[0].trim()))) lines.shift();
  let s = lines.join("\n").replace(/^\s*[-*_]{3,}\s*$/gm, ""); // drop standalone horizontal rules anywhere
  s = s.replace(/\n+\s*(?:note(?: for you| to the poster)?|p\.?\s?s\.?)\s*:.*$/is, ""); // trailing coaching note
  return s.replace(/\n{3,}/g, "\n\n").trim();
}
function cleanCandidate(t, v, locale) {
  let p = stripScaffold(stripMarkdown(String(t || "")));
  p = stripUrls(p);
  p = p.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'");
  const structured = v && typeof v === "object"; // a string fingerprint has no examples to judge habits, so don't strip
  if (structured && !usesEmoji(v)) p = stripEmoji(p);
  if (structured && !usesHash(v)) p = stripHash(p);
  // House style for English output: no em/long dashes, no Oxford comma (matches the analyzer's finalizePlan).
  if (locale === "en") p = p.replace(/\s*[—―]\s*/g, ", ").replace(/,(\s+(?:and|or)\b)/gi, "$1");
  return p.replace(/\n{3,}/g, "\n\n").trim();
}

// Neutralize whatever the user pasted into a voiceless fact brief, so the engine REBUILDS from facts
// in their voice instead of lightly restyling the source (which can leak another author's phrasing).
async function extractFacts(key, draft) {
  const out = await callClaude(key, "You extract neutral fact briefs. Plain text only, no commentary.",
    `Extract the factual content of the text below as a NEUTRAL brief, stripped of the author's voice, style, hooks, opinions and structure.
- "Core message:" one or two plain sentences on what is being shared.
- "Facts:" a bullet list of every concrete detail: people (name + role), organizations, products, numbers, events, dates, places, links (keep any url verbatim), hashtags.
Do NOT copy the author's sentences, openers or phrasing. Do NOT add anything not in the text. Plain text only, no preamble.

TEXT:
"""${draft}"""`, 900);
  return (out || "").trim() || null;
}

// Refine mode: apply ONE targeted edit the user asked for, with the voice and structure LOCKED.
function refinePrompt(current, instruction, langName, locale) {
  return `Here is a finished LinkedIn post, written in a specific person's authentic voice:
"""${current}"""

The user wants this change:
"""${instruction}"""

Apply ONLY their requested change. Keep EVERYTHING else identical: the same voice, tone, rhythm and structure, the same strong hook in the first 1 to 2 lines (~140 characters, the mobile "see more" fold), the same facts, the same emoji and hashtag habit. Do NOT rewrite parts they did not mention. If the user gives you specific wording for the change, use THEIR exact words and phrasing, do not reword, polish, upgrade or "improve" what they wrote (only fix obvious capitalization or punctuation so it reads as a clean sentence). Their words win, you are placing them, not rewriting them. Do NOT make it more generic, more corporate or more "LinkedIn influencer". Do NOT invent any new fact, name, number or link unless the user explicitly gives it in their request. Do NOT add a url to the body (links belong in the first comment). No markdown, no [bracket] placeholders. Write in ${langName}.${locale === "en" ? " American English, no Oxford comma, no em dashes." : ""}

If their request would break the voice or push it generic (for example "make it more corporate", "add hype"), make the smallest change that honors the spirit of the request while keeping their voice.

Output ONLY the full edited post, no preamble, no quotes, no commentary.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!allowedOrigin(req.headers.origin || "")) return res.status(403).json({ error: "Forbidden" });
  const s = readSession(req);
  if (!s || s.purpose !== "session" || !s.email) return res.status(401).json({ error: "Sign in to use the post writer" });
  if (!ppBurstOk(s.email)) return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (SERVICE_KEY && !(await durableRateOk("pp:" + s.email, 20, SERVICE_KEY, "polish-post"))) {
    return res.status(429).json({ error: "You've reached the hourly limit for the post writer. Please try again later." });
  }
  const key = process.env.ANTHROPIC_KEY;
  if (!key) return res.status(500).json({ error: "Server not configured" });

  const locale = (req.body && typeof req.body.locale === "string") ? req.body.locale : "en";
  const langName = LANG[locale] || "English";

  // Interactive refine: the user tells us what to change in an existing post, we apply just that.
  if (req.body && req.body.mode === "refine") {
    const current = String((req.body && req.body.current) || "").slice(0, 8000).trim();
    const instruction = String((req.body && req.body.instruction) || "").slice(0, 1000).trim();
    if (current.length < 20) return res.status(400).json({ error: "Nothing to edit yet." });
    if (instruction.length < 2) return res.status(400).json({ error: "Tell us what to change." });
    try {
      const edited = await callClaude(key, "You are an expert LinkedIn editor. Apply ONLY the user's requested change and output ONLY the edited post text.", refinePrompt(current, instruction, langName, locale), 1400);
      if (!edited) return res.status(502).json({ error: "Could not apply the edit. Try again." });
      const post = stripUrls(stripMarkdown(edited)).replace(/\n{3,}/g, "\n\n").trim();
      if (!post) return res.status(502).json({ error: "Could not apply the edit. Try again." });
      return res.status(200).json({ post });
    } catch (e) {
      console.error("[polish-post:refine] " + (e && e.message));
      return res.status(500).json({ error: "Could not apply the edit. Try again." });
    }
  }

  const draft = String((req.body && req.body.draft) || "").slice(0, 5000).trim();
  if (draft.length < 15) return res.status(400).json({ error: "Write a few more words first" });
  const rawSamples = Array.isArray(req.body && req.body.samples) ? req.body.samples : [];
  const samples = rawSamples
    .filter((x) => x && typeof x.data === "string" && x.data.length > 100 && /^image\/(png|jpe?g|webp|gif)$/.test(x.media_type || ""))
    .slice(0, 3);

  const link = firstUrl(draft);
  const hasLink = !!link;

  try {
    // 1) Voice profile (optional) + a neutral fact brief, in parallel. The brief lets the engine
    //    REBUILD from facts in their voice instead of restyling whatever they pasted.
    const [scanned, brief, savedTone] = await Promise.all([
      samples.length ? scanVoice(key, samples) : Promise.resolve(null),
      extractFacts(key, draft),
      (!samples.length && s.email) ? fetchSavedTone(s.email) : Promise.resolve(null),
    ]);
    const voice = scanned || savedTone || null; // uploaded posts win; else reuse their saved tone fingerprint
    const facts = brief || draft;

    // 2) Best-of-N candidates, generated in parallel.
    const raw = await Promise.all(TAKES.slice(0, N).map((take) =>
      callClaude(key, "You are an expert LinkedIn ghostwriter and the user's trusted adviser. Output ONLY the finished post text, no preamble.", writePrompt(voice, facts, langName, take, hasLink, locale), 1300)
    ));
    const cands = raw.map((t) => cleanCandidate(t, voice, locale)).filter((p) => p && p.length > 30);
    if (!cands.length) return res.status(502).json({ error: "Could not write the post. Try again." });

    // 3) Selector picks the most engaging AND most-them.
    let post = cands[0], selectedIdx = 0;
    if (cands.length > 1) {
      const ref = (typeof voice === "string" && voice.trim())
        ? `This person's voice, saved from their earlier analysis: ${voice.trim()}\n\n`
        : voice
        ? `This person's REAL posts:\n${(voice.examples || []).map((e) => `- ${String(e).slice(0, 600)}`).join("\n")}\n\nTheir signature moves:\n${(voice.signatures || []).map((x) => `- ${x}`).join("\n")}\n\n`
        : "";
      const candBlock = cands.map((c, i) => `=== CANDIDATE ${i + 1} ===\n${c}`).join("\n\n");
      const sel = parseJson(await callClaude(
        key,
        "You are a JSON API. Output ONLY a raw JSON object.",
        `${ref}Below are ${cands.length} candidate LinkedIn posts written from the same draft. Pick the ONE that is BOTH (a) the most scroll-stopping, a strong specific hook in the first 1 to 2 lines (~140 characters, what mobile shows before "see more"), a real story, a clean close, AND (b) the most authentically in THIS person's own voice, not a generic LinkedIn-influencer voice. If their real posts are messy or emoji-heavy, prefer the candidate that keeps that texture over a cleaner one. Return ONLY {"bestIndex":N} where N is 1 to ${cands.length}.\n\n${candBlock}`,
        150
      ));
      selectedIdx = sel && Number.isFinite(sel.bestIndex) ? Math.min(Math.max(1, Math.round(sel.bestIndex)), cands.length) - 1 : 0;
      post = cands[selectedIdx];
    }

    const body = { post, introChars: introChars(post) };
    if (cands.length > 1) { body.versions = cands; body.selectedIndex = selectedIdx; }
    if (hasLink) {
      body.firstComment = link;
      body.linkNote = "I kept your link out of the post on purpose. LinkedIn shows posts that have a link in the body to fewer people. Post this, then paste your link as the very first comment, you keep your full reach and readers still get straight to it.";
    }
    return res.status(200).json(body);
  } catch (e) {
    console.error("[polish-post] " + (e && e.message));
    return res.status(500).json({ error: "Could not write the post. Try again." });
  }
}
