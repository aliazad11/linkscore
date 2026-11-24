// One place for the Claude model and request shape every API route uses, so the next model
// change touches this file only.
//
// Claude Sonnet 4.5 (claude-sonnet-4-5) retires on 2026-11-30; Anthropic's recommended
// replacement is Claude Sonnet 5.5. What changed for this codebase:
// - Assistant prefill ({ role: "assistant", content: "{" }) returns a 400 on Sonnet 5.5, so
//   JSON is now taken from the response text itself (fromFirstBrace) instead of being
//   forced by a prefilled "{".
// - Sonnet 5.5 thinks before answering unless told otherwise. The routes ran without
//   extended thinking on Sonnet 4.5, so they send thinking "between_tools" (Sonnet 5.5's
//   thinking-off setting; it requires effort "high" or below) to keep latency inside
//   Vercel's 300s limit and the output close to what was tuned on Sonnet 4.5.
// - Responses are read by block type, not position (claudeText).
// - Sonnet 5.5 can decline with stop_reason "refusal"; callers check isRefusal before
//   parsing. Server-side fallback ("default") retries the declines it can on Claude Sonnet 5.
// - Its tokenizer counts the same text as roughly 30% more tokens than Sonnet 4.5, so the
//   routes' max_tokens caps were raised by the same factor (output length is set by the
//   prompts; the cap only prevents truncation).

export const CLAUDE_MODEL = "claude-sonnet-5-5";

// Multiply a cap tuned on Sonnet 4.5 by this to get the equivalent cap on Sonnet 5.5.
export const TOKEN_FACTOR = 1.35;

const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export function claudeHeaders(key, withFallbackBeta = true) {
  const h = {
    "Content-Type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
  };
  if (withFallbackBeta) h["anthropic-beta"] = FALLBACK_BETA;
  return h;
}

// Request fields shared by every route. Spread first, then add max_tokens, system and messages.
// Send it with postClaude, which owns the fallback beta (fallbacks + its header).
export const CLAUDE_BASE = {
  model: CLAUDE_MODEL,
  thinking: { type: "between_tools" },
  output_config: { effort: "high" },
  fallbacks: "default",
};

// Server-side fallback is a beta. If Anthropic retires or renames it, a request that still
// carries it gets a 400, on every route at once, which would take the whole product down.
// postClaude sends the request with the beta; on a 400 whose message names it, it resends
// once without the fallbacks field and the beta header, and this instance stops sending
// them. Any other response is returned untouched (a non-beta 400 is rebuilt from its body
// so callers can still read it).
let fallbackBetaOff = false;
const BETA_REJECTED = /fallback|anthropic-beta|beta header/i;

function withoutFallbacks(body) {
  const { fallbacks, ...rest } = body;
  return rest;
}

export async function postClaude(key, body, init = {}) {
  const send = (withBeta) => fetch(CLAUDE_URL, {
    ...init,
    method: "POST",
    headers: claudeHeaders(key, withBeta),
    body: JSON.stringify(withBeta ? body : withoutFallbacks(body)),
  });
  if (fallbackBetaOff) return send(false);
  const r = await send(true);
  if (r.status !== 400) return r;
  const text = await r.text().catch(() => "");
  if (!BETA_REJECTED.test(text)) {
    return new Response(text, { status: r.status, statusText: r.statusText, headers: r.headers });
  }
  console.error("[claude] fallback beta rejected, resending without it: " + text.slice(0, 200));
  fallbackBetaOff = true;
  return send(false);
}

// The response's text, joined across text blocks. Skips thinking and any other block type.
export function claudeText(d) {
  if (!d || !Array.isArray(d.content)) return "";
  return d.content.filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("");
}

// The response text from where its JSON object starts, for routes that expect one. Without a
// prefill the model writes the opening brace itself, sometimes after a code fence or a short
// lead-in; both are dropped here. The first `{"` is preferred over a bare "{" so a lead-in
// that happens to contain a brace ("Scoring {headline}:") does not hide the real JSON.
// Returns "" when there is no "{".
export function fromFirstBrace(t) {
  const s = String(t || "");
  const m = /\{\s*"/.exec(s);
  const i = m ? m.index : s.indexOf("{");
  return i === -1 ? "" : s.slice(i);
}

export function isRefusal(d) {
  return !!(d && d.stop_reason === "refusal");
}

export function refusalNote(d) {
  const sd = d && d.stop_details;
  return "refusal" + (sd && sd.category ? " category=" + sd.category : "");
}
