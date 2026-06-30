-- Creator voice reuse (option a): store a tone-of-voice STYLE fingerprint (register + signature
-- habits, NEVER the user's post content) on the analyzer plan, so a signed-in user who already
-- uploaded their own posts in the questionnaire is not asked to re-upload in the Post Writer.
-- Run this once in the Supabase SQL editor. Safe / idempotent.

ALTER TABLE gated_plans ADD COLUMN IF NOT EXISTS voice_fingerprint text;
