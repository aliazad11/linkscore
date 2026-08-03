-- State of the LinkedIn Profile study (prerequisite): plan_stats holds anonymized
-- per-plan numeric aggregates, copied nightly out of gated_plans by /api/aggregate-stats,
-- so the study is a SQL query away later and survives any TTL purge of raw plans.
-- PRIVACY BY SCHEMA: numbers, booleans, whitelisted enum values, dates and the plan uuid
-- only. No email, no names, no free text; the CHECK constraints make it impossible for a
-- future extractor bug to write anything else into the enum columns.
-- archetype is excluded ON PURPOSE: it is unbounded model-generated text about the person
-- and can act as a quasi-identifier at small N. If an archetype distribution is ever
-- wanted, derive it from cohort x score tier via the fixed mapping in App.jsx instead.
-- User deletion: api/delete-account.js removes a user's plan_stats rows together with
-- their gated_plans rows, so the privacy page's "until you ask us to delete it" holds.
-- Run this once in the Supabase SQL editor. Safe / idempotent.

CREATE TABLE IF NOT EXISTS plan_stats (
  id uuid PRIMARY KEY,                              -- gated_plans.id; the upsert key, so re-runs never duplicate
  created_at timestamptz NOT NULL,                  -- gated_plans.created_at (volume by day)
  extracted_at timestamptz NOT NULL DEFAULT now(),  -- first copy time (later upserts keep it)
  unlocked boolean NOT NULL DEFAULT false,          -- unlocked_at was set as of copy time
  cohort text CHECK (cohort IN ('B2B Executive','Real Estate Professional','Startup Founder','Job Seeker','Consultant or Coach','Thought Leader')),
  lang text CHECK (lang IN ('en','de','fr','es','pt','nl','it')),
  pdf_run boolean,                                  -- a profile PDF was attached (null on rows from before the stamp shipped)
  posts_run boolean,                                -- post screenshots were attached (null on rows from before the stamp shipped)
  -- score and the sub-scores are the RAW model outputs stored server-side. The score a
  -- user SEES is computed client-side only (anchor blend on PDF runs from inputs that
  -- never reach the server, clamp 35-95, no-input cap) and is NOT reconstructible here.
  -- The study reports raw distributions, cut by pdf_run/posts_run, with that caveat.
  score int,
  headline_score int,
  about_score int,
  experience_score int,
  profile_overall int,
  keywords_present_count int,
  keywords_missing_count int,
  tl_available boolean,
  tl_score int,
  tl_hook_score int,
  tl_engagement_score int,
  tl_voice_score int,
  tl_structure_score int,
  ssi_available boolean,
  ssi_total int,
  ssi_brand_score int,
  ssi_people_score int,
  ssi_insights_score int,
  ssi_relationships_score int,
  ssi_brand_status text CHECK (ssi_brand_status IN ('WEAK','AVERAGE','STRONG')),
  ssi_people_status text CHECK (ssi_people_status IN ('WEAK','AVERAGE','STRONG')),
  ssi_insights_status text CHECK (ssi_insights_status IN ('WEAK','AVERAGE','STRONG')),
  ssi_relationships_status text CHECK (ssi_relationships_status IN ('WEAK','AVERAGE','STRONG')),
  ssi_weakest_pillar text CHECK (ssi_weakest_pillar IN ('brand','people','insights','relationships')),
  has_voice boolean NOT NULL DEFAULT false          -- an authored voice fingerprint was stored (post screenshots were uploaded)
);

CREATE INDEX IF NOT EXISTS plan_stats_created_at_idx ON plan_stats (created_at);
CREATE INDEX IF NOT EXISTS plan_stats_cohort_idx ON plan_stats (cohort);
CREATE INDEX IF NOT EXISTS plan_stats_lang_idx ON plan_stats (lang);

-- Columns for rows copied before this migration gained pdf_run/posts_run (no-op on a
-- fresh table; keeps the migration idempotent if an older version already ran).
ALTER TABLE plan_stats ADD COLUMN IF NOT EXISTS pdf_run boolean;
ALTER TABLE plan_stats ADD COLUMN IF NOT EXISTS posts_run boolean;

-- Same posture as the other tables: RLS on with NO anon policies, service role only.
ALTER TABLE plan_stats ENABLE ROW LEVEL SECURITY;
