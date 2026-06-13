// #27 — Persona eval harness. Runs the 6 cohorts through the PRODUCTION engine
// and asserts the quality guarantees that #4 (calendar obeys RULES cadence) and
// #16 (brand-voice guard) are meant to hold. Re-run before each release:
//
//   node eval/persona-eval.mjs            # 6 personas in English
//   node eval/persona-eval.mjs de         # 6 personas in the given locale
//
// It hits real /api/generate-plan + /api/get-plan with test-*@example.com leads
// (undeliverable, RFC-reserved; Ali purges them via SQL). It does NOT send email.
//
// NOTE: the cadence + voice directives below MIRROR the ones in App.jsx buildPrompt.
// If you change the rules there, mirror them here so the eval stays honest.

const BASE = process.env.LS_BASE || "https://www.linkedscore.app";
const LOCALE = (process.argv[2] || "en").toLowerCase();
const LANG = { en: "English", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", nl: "Dutch", it: "Italian" }[LOCALE] || "English";

const PERSONAS = [
  { cohort: "B2B Executive", who: "VP of Marketing at a mid-size SaaS company, wants to build industry authority, posts rarely.", ssi: 52 },
  { cohort: "Real Estate Professional", who: "luxury realtor, wants high-value clients, mostly posts listings.", ssi: 40 },
  { cohort: "Startup Founder", who: "pre-seed founder, wants investor visibility, basically a ghost account.", ssi: 22 },
  { cohort: "Job Seeker", who: "senior marketer recently laid off, wants a new role within 3 months.", ssi: 35 },
  { cohort: "Consultant or Coach", who: "independent strategy consultant, wants more clients, posts inconsistently.", ssi: 48 },
  { cohort: "Thought Leader", who: "wants to become a recognized voice in their field, posts occasionally.", ssi: 58 },
];

const CADENCE = `FOUNDER RULES (must obey): post no more than TWICE per month. The 30-day content_calendar has exactly 4 weeks; AT MOST 2 of them may have type "POST", the rest MUST be "ENGAGEMENT". Never schedule weekly posting.`;
const VOICE = LOCALE === "en"
  ? `VOICE: American English. No Oxford comma. Do NOT use em dashes or long dashes ("—") anywhere; use commas or periods instead.`
  : `VOICE: write EVERY human-readable string value in ${LANG}. Keep JSON keys and the enum values POST and ENGAGEMENT in English.`;

function promptFor(p) {
  return `You are an elite LinkedIn strategist. Person: ${p.cohort} — ${p.who} Their LinkedIn SSI total is about ${p.ssi}/100.
${CADENCE}
${VOICE}
OUTPUT raw JSON only, exactly this shape (realistic integer scores 0-100):
{"score":INT,"archetype":"STR 2-3 words","headline":"STR","urgency":"STR","profile_scores":{"headline":INT,"about":INT,"experience":INT,"overall":INT},"ssi_plan":{"available":true,"total":${p.ssi}},"post_hooks":["STR","STR","STR"],"content_calendar":[{"week":"Week 1","type":"POST or ENGAGEMENT","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 2","type":"POST or ENGAGEMENT","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 3","type":"POST or ENGAGEMENT","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 4","type":"POST or ENGAGEMENT","topic":"STR","hook":"STR","action":"STR"}],"closing_message":"STR","thought_leader":{"available":false}}`;
}

async function run(p) {
  const email = `test-${p.cohort.toLowerCase().replace(/[^a-z]/g, "")}@example.com`;
  const g = await fetch(BASE + "/api/generate-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: [{ type: "text", text: promptFor(p) }] }] }) });
  const gj = await g.json();
  if (!gj.planId) return { cohort: p.cohort, error: `generate ${g.status}: ${gj.error || "no planId"}` };
  const r = await fetch(BASE + "/api/get-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: gj.planId, email }) });
  const rj = await r.json();
  const plan = rj.plan;
  if (!plan) return { cohort: p.cohort, error: `get-plan ${r.status}: ${rj.error || "no plan"}` };

  const cal = Array.isArray(plan.content_calendar) ? plan.content_calendar : [];
  const postWeeks = cal.filter(w => String(w.type).toUpperCase() === "POST").length;
  const calText = cal.flatMap(w => [w.topic, w.hook, w.action]).filter(s => typeof s === "string").join(" ");
  // Text-level cadence guard (#4): even with 2 POST weeks, the action copy must
  // not instruct higher-frequency publishing than the twice-a-month maximum.
  const overFreq = /(twice a week|two times a week|three times a week|several times a week|multiple times a week|post(ing)? daily|daily post|every day|each day|post every day|post twice|post three times)/i.test(calText);
  const strings = [plan.archetype, plan.headline, plan.urgency, plan.closing_message, ...(plan.post_hooks || []), ...cal.flatMap(w => [w.topic, w.hook, w.action])].filter(s => typeof s === "string");
  const emDash = strings.filter(s => /[—–]/.test(s));

  return {
    cohort: p.cohort,
    cadence_postWeeks: postWeeks,
    cadence_ok: postWeeks <= 2 && !overFreq,
    cadence_overFreqText: overFreq,
    emdash_count: LOCALE === "en" ? emDash.length : "n/a",
    emdash_ok: LOCALE === "en" ? emDash.length === 0 : true,
    archetype: plan.archetype,
    sample_emdash: emDash[0] ? emDash[0].slice(0, 60) : "",
  };
}

console.log(`\n#27 persona eval — locale=${LOCALE} (${LANG}) — ${BASE}\n`);
const results = [];
for (const p of PERSONAS) {
  const res = await run(p);
  results.push(res);
  if (res.error) { console.log(`✗ ${p.cohort.padEnd(26)} ERROR: ${res.error}`); continue; }
  const cFlag = res.cadence_ok ? "✓" : "✗";
  const vFlag = res.emdash_ok ? "✓" : "✗";
  console.log(`${res.cadence_ok && res.emdash_ok ? "✓" : "✗"} ${res.cohort.padEnd(26)} cadence ${cFlag} (${res.cadence_postWeeks} POST wks${res.cadence_overFreqText ? ", over-freq TEXT" : ""})  voice ${vFlag} (em-dash: ${res.emdash_count})  "${res.archetype}"`);
  if (res.sample_emdash) console.log(`     ↳ em-dash sample: …${res.sample_emdash}…`);
}
const fails = results.filter(r => r.error || !r.cadence_ok || !r.emdash_ok);
console.log(`\n${results.length - fails.length}/${results.length} pass. ${fails.length ? "FAILURES present." : "ALL PASS ✓"}\n`);
process.exit(fails.length ? 1 : 0);
