// Nightly anonymized stats copy for the "State of the LinkedIn Profile" study.
// Copies numeric aggregates out of gated_plans.plan_data into plan_stats, one row per
// plan, so the study is a single SQL query later and survives any TTL purge of raw
// plans. SAFE BY DEFAULT, same contract as send-reminders:
//  - Refuses unless CRON_SECRET is set AND the caller presents it. Vercel cron sends it
//    as a Bearer header automatically once configured, so until Ali sets that env var
//    this endpoint writes NOTHING (returns 503).
//  - ?dry=1 reports what would be written (counts plus one sample row) and writes nothing.
//  - Idempotent: upserts on the plan id, so re-running never duplicates rows.
//  - PRIVACY: every written value passes a whitelist. Numbers, booleans, enum values
//    from fixed lists, dates and the plan uuid only. Never emails, never rewrites,
//    never keyword strings (only their counts). archetype is excluded ON PURPOSE: it is
//    unbounded model text about the person and can act as a quasi-identifier at small N.
//  - SCORE CAVEAT: score and profile_scores here are the RAW model outputs stored before
//    any client-side processing. The score users see is computed client-side only
//    (anchor blend on PDF runs, clamp, no-input cap) from inputs that never reach the
//    server, so it cannot be reconstructed from plan_stats. The study reports raw
//    distributions with that caveat.
export const config = { maxDuration: 120 };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const PAGE = 500;       // rows per fetch page and per upsert batch
const MAX_ROWS = 2000;  // per-run cap on the main scan; a long backfill continues next run
// Late unlocks: unlocked_at can be set days after a row was first copied (replay and
// magic-link flows). A separate nightly re-scan of the last 7 days of unlock events
// refreshes those rows; the id upsert makes the overlap free. Kept separate from the
// main cursor so heavy traffic can never stall forward progress on new rows.
const UNLOCK_LOOKBACK_MS = 7 * 86400000;
const UNLOCK_MAX_ROWS = 1000;

const COHORTS = ["B2B Executive", "Real Estate Professional", "Startup Founder", "Job Seeker", "Consultant or Coach", "Thought Leader"];
const LANGS = ["en", "de", "fr", "es", "pt", "nl", "it"];
const STATUSES = ["WEAK", "AVERAGE", "STRONG"];
// Canonical pillar order from the buildPrompt schema; matched by name with the array
// index as fallback, so a reworded pillar name degrades gracefully instead of dropping data.
const PILLARS = [
  { key: "brand", re: /brand/i },
  { key: "people", re: /people/i },
  { key: "insights", re: /insight/i },
  { key: "relationships", re: /relation/i },
];

// Only these JSON subtrees leave the database. The free-text plan fields (rewrites,
// hooks, messages, calendar) are never selected. keyword_analysis is fetched but only
// its array lengths are ever written; voice_fingerprint is fetched only to record its
// presence as a boolean and is never written anywhere.
const SELECT = [
  "id", "created_at", "unlocked_at", "voice_fingerprint",
  "s_score:plan_data->score",
  "s_ps:plan_data->profile_scores",
  "s_ka:plan_data->keyword_analysis",
  "s_tl:plan_data->thought_leader",
  "s_ssi:plan_data->ssi_plan",
  "s_cohort:plan_data->>_cohort",
  "s_lang:plan_data->>_lang",
  "s_had_pdf:plan_data->>_had_pdf",
  "s_had_posts:plan_data->>_had_posts",
].join(",");

// Strict: null, empty string, booleans and arrays must become null, never 0.
// Number(null) === 0 would silently poison the distributions with fake zeros.
function num(v) {
  if (v === null || v === undefined || v === "" || typeof v === "boolean" || Array.isArray(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function obj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}
// plan_data->>_had_pdf yields the strings "true"/"false" (or null on historical rows).
function bool(v) {
  return v === "true" ? true : v === "false" ? false : null;
}

function extract(row) {
  const ps = obj(row.s_ps);
  const ka = obj(row.s_ka);
  const tl = obj(row.s_tl);
  const ssi = obj(row.s_ssi);

  const pillarScore = { brand: null, people: null, insights: null, relationships: null };
  const pillarStatus = { brand: null, people: null, insights: null, relationships: null };
  const rawPillars = Array.isArray(ssi.pillars) ? ssi.pillars : [];
  rawPillars.forEach((pl, i) => {
    if (!pl || typeof pl !== "object") return;
    const hit = PILLARS.find((c) => c.re.test(String(pl.name || ""))) || PILLARS[i];
    if (!hit) return;
    pillarScore[hit.key] = num(pl.score);
    const st = String(pl.status || "").toUpperCase();
    pillarStatus[hit.key] = STATUSES.indexOf(st) !== -1 ? st : null;
  });
  // Weakest pillar only when all four scored (a partial set would skew the frequency);
  // ties go to the earlier pillar in canonical order.
  let weakest = null;
  if (PILLARS.every((c) => pillarScore[c.key] !== null)) {
    for (const c of PILLARS) {
      if (weakest === null || pillarScore[c.key] < pillarScore[weakest]) weakest = c.key;
    }
  }

  return {
    id: row.id,
    created_at: row.created_at,
    unlocked: !!row.unlocked_at,
    cohort: COHORTS.indexOf(row.s_cohort) !== -1 ? row.s_cohort : null,
    lang: LANGS.indexOf(row.s_lang) !== -1 ? row.s_lang : null,
    pdf_run: bool(row.s_had_pdf),
    posts_run: bool(row.s_had_posts),
    score: num(row.s_score),
    headline_score: num(ps.headline),
    about_score: num(ps.about),
    experience_score: num(ps.experience),
    profile_overall: num(ps.overall),
    keywords_present_count: Array.isArray(ka.present) ? ka.present.length : null,
    keywords_missing_count: Array.isArray(ka.missing) ? ka.missing.length : null,
    tl_available: typeof tl.available === "boolean" ? tl.available : null,
    tl_score: num(tl.score),
    tl_hook_score: num(tl.hook_score),
    tl_engagement_score: num(tl.engagement_score),
    tl_voice_score: num(tl.voice_score),
    tl_structure_score: num(tl.structure_score),
    ssi_available: typeof ssi.available === "boolean" ? ssi.available : null,
    ssi_total: num(ssi.total),
    ssi_brand_score: pillarScore.brand,
    ssi_people_score: pillarScore.people,
    ssi_insights_score: pillarScore.insights,
    ssi_relationships_score: pillarScore.relationships,
    ssi_brand_status: pillarStatus.brand,
    ssi_people_status: pillarStatus.people,
    ssi_insights_status: pillarStatus.insights,
    ssi_relationships_status: pillarStatus.relationships,
    ssi_weakest_pillar: weakest,
    has_voice: !!row.voice_fingerprint,
  };
}

export default async function handler(req, res) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) return res.status(503).json({ error: "Stats copy disabled (set CRON_SECRET to enable)" });
  const auth = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const qSecret = (req.query && req.query.secret) || "";
  if (auth !== "Bearer " + CRON_SECRET && qSecret !== CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) return res.status(500).json({ error: "Server not configured" });
  const headers = { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY };
  const dry = !!(req.query && (req.query.dry === "1" || req.query.dry === "true"));

  try {
    // Cursor: the newest created_at already copied (epoch when the table is empty).
    // No lookback here: forward progress on new rows must never compete with refreshes,
    // or a busy window could re-upsert the same rows every night and stall the cursor.
    const cr = await fetch(SUPABASE_URL + "/rest/v1/plan_stats?select=created_at&order=created_at.desc&limit=1", { headers, signal: AbortSignal.timeout(8000) });
    if (!cr.ok) {
      console.error("[aggregate-stats] cursor lookup " + cr.status + " (plan_stats missing? run db-migration-plan-stats.sql)");
      return res.status(500).json({ error: "Cursor lookup failed" });
    }
    const last = await cr.json().catch(() => []);
    const windowStart = (Array.isArray(last) && last.length && last[0].created_at) ? last[0].created_at : new Date(0).toISOString();

    // Main scan: oldest first, gte the cursor (boundary overlap is free under the id
    // upsert), with a deterministic total order so a created_at tie can never straddle
    // a page boundary and skip a row.
    const out = [];
    for (let offset = 0; out.length < MAX_ROWS; ) {
      const lim = Math.min(PAGE, MAX_ROWS - out.length);
      const r = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?created_at=gte." + encodeURIComponent(windowStart) + "&order=created_at.asc,id.asc&select=" + SELECT + "&limit=" + lim + "&offset=" + offset, { headers, signal: AbortSignal.timeout(15000) });
      if (!r.ok) {
        console.error("[aggregate-stats] gated_plans page " + r.status);
        return res.status(500).json({ error: "Lookup failed" });
      }
      const rows = await r.json().catch(() => []);
      if (!Array.isArray(rows) || !rows.length) break;
      for (const row of rows) { if (row && row.id) out.push(extract(row)); }
      offset += rows.length;
      if (rows.length < lim) break;
    }

    // Unlock refresh: rows whose unlocked_at changed recently, so a late unlock still
    // flips plan_stats.unlocked even when the row is far behind the main cursor.
    const unlockStart = new Date(Date.now() - UNLOCK_LOOKBACK_MS).toISOString();
    const ur = await fetch(SUPABASE_URL + "/rest/v1/gated_plans?unlocked_at=gte." + encodeURIComponent(unlockStart) + "&order=unlocked_at.asc,id.asc&select=" + SELECT + "&limit=" + UNLOCK_MAX_ROWS, { headers, signal: AbortSignal.timeout(15000) });
    const unlockRows = ur.ok ? await ur.json().catch(() => []) : [];
    if (!ur.ok) console.error("[aggregate-stats] unlock refresh " + ur.status + " (continuing without it)");
    const refresh = [];
    for (const row of Array.isArray(unlockRows) ? unlockRows : []) { if (row && row.id) refresh.push(extract(row)); }

    if (dry) return res.status(200).json({ dry: true, since: windowStart, scanned: out.length, unlock_refresh: refresh.length, would_write: out.length + refresh.length, sample: out.length ? out[0] : (refresh.length ? refresh[0] : null) });

    let written = 0;
    const all = out.concat(refresh);
    for (let i = 0; i < all.length; i += PAGE) {
      const batch = all.slice(i, i + PAGE);
      const ins = await fetch(SUPABASE_URL + "/rest/v1/plan_stats?on_conflict=id", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(15000),
      });
      if (!ins.ok) {
        const e = await ins.text().catch(() => "");
        console.error("[aggregate-stats] upsert " + ins.status + " " + e);
        return res.status(500).json({ error: "Upsert failed", written });
      }
      written += batch.length;
    }
    return res.status(200).json({ ok: true, since: windowStart, scanned: out.length, unlock_refresh: refresh.length, written });
  } catch (e) {
    console.error("[aggregate-stats] " + (e && e.message));
    return res.status(500).json({ error: "Stats copy failed" });
  }
}
