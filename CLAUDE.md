# LinkedScore — Master Project Notes (for CLAUDE.md)

> Status: reconciled against the **live GitHub repo** `github.com/aliazad11/linkscore` (commit `122b955`, 2026-06-09) plus the source files. Engineering status reflects the actual deployed code, not the older handoff. The code remains the source of truth — re-check `App.jsx` and `api/` if the live state moves on.
>
> Use: code-relevant sections (1, 4, 5, 6, 9) → `CLAUDE.md`. Business model, content engine, branding archive (2, 7, 8, 10, 11) → here or `/docs`. This file replaces the raw strategy/handoff docs.

---

## 1. What the product is
LinkedScore (linkedscore.app / [www.linkedscore.app](https://www.linkedscore.app)) is an AI LinkedIn personal-branding analyzer, positioned as the **Authority Intelligence Platform™**. A user fills a quiz (goal + cohort + SSI inputs), optionally uploads a profile PDF and post screenshots, and gets a personalized AI growth plan via the Claude API. Free score = the hook; paid services = the fix. Tagline: *"Your profile is already positioning you. The question is: how?"*

**Cohorts (6):** B2B Executive, Real Estate, Startup Founder, Job Seeker, Consultant/Coach, Thought Leader. The prompt assigns a cohort-specific 2–3 word archetype (e.g. B2B Exec → "The Quiet Operator"; Real Estate → "The Off-Market Insider"; Founder → "The Stealth Builder"; Job Seeker → "The Hidden Candidate"; Consultant → "The Underbooked Expert"; Thought Leader → "The Almost-Heard"). "The Invisible ___"/"The Silent ___" are banned in the prompt.

**Result UI tabs (8, live code):** Overview, Profile, Thought Leader, SSI Analysis, Content, Hooks, Calendar, Rules.

**Plan output schema (top-level keys in `buildPrompt`):** score, archetype, headline, headline_rewrite, about_rewrite, experience_rewrite, urgency, profile_scores, profile_fixes[3], keyword_analysis, content_strategy, post_hooks[3], content_calendar[4 weeks POST/ENGAGEMENT], critical_rules[6] (overridden by FOUNDER_RULES), growth_tactics[4], networking, closing_message, thought_leader, ssi_plan.

### What the prompt enforces (baked into `buildPrompt`, verified live)
- **Hallucination guard** (line 682): only reference employers/titles/schools/details verbatim from the profile; never invent companies, metrics, or imply customer counts/revenue.
- **No fabricated hook content** (line 684): hooks are structurally distinct, no invented anecdotes/results/metrics/cadences, examples are fill-in templates, hooks are editable drafts.
- **Cadence philosophy** (lines 630/636): default 1–2 strong original posts per month; scale up only for an urgent time-boxed goal (job search / launch in 30–90 days); the 30-day calendar must obey low-frequency publishing; no "magic best time to post," tell users to learn it from their own analytics.
- **Voice mirroring** (line 629): infer and mirror the user's actual writing voice in all copy.
- **House style** (line 678): American English, NO Oxford comma, no em/long dashes.

### Scoring internals (the strongest part — preserve)
- Inputs per run: profile PDF + free-text quiz answers + post screenshots (sent as base64 images).
- Two scores: **LinkedIn Score** (profile) and **Thought Leader Score** (posts).
- **SSI** = LinkedIn Social Selling Index, four pillars (Establish Your Brand / Find the Right People / Engage with Insights / Build Relationships), each 0–25, WEAK|AVERAGE|STRONG.
- **Headline score (client-side in `finalizePlan`):** `score = round(0.6 × profile_overall + 0.4 × SSI_total)`, clamped **35–95**. Not a raw SSI echo.
- **Revenue at Risk™** computed client-side as a rounded low–high range (default currency USD, per-year).
- **Archetype synthesis** distills everything into one named archetype.
- Preserve: archetype synthesis, SSI interpretation, how the plan integrates profile + answers + screenshots.

### FOUNDER_RULES (live Rules-tab content; override AI `critical_rules`)
1. Post no more than twice a month, quality beats quantity. 2. Don't post during low-traffic hours. 3. Never edit a post after publishing. 4. Never reshare; comment and like instead. 5. Fill in full work history with relevant descriptions. 6. Profile photo and banner that fit your industry. 7. Tag anyone you mention. 8. Mix content formats (documents, polls, images, video). 9. Have a content plan/roadmap. 10. People follow your story, not industry news; put yourself in it and show your face. 11. Find relevant people via search and send connection requests, especially early. 12. The first 60 minutes after posting matter most; reply to every comment. 13. Use only 3–5 targeted hashtags. 14. End every post with a CTA, question or opinion request. 15. The first three lines must earn the "see more" click.

---

## 2. Business model — Canvas v4 (verbatim from the .docx)
Title: **LinkedScore — Business Model Canvas v4 · Authority Intelligence Platform™ · linkedscore.app · 2025.**

**Key Partners.** Tech: Anthropic, Vercel, Supabase, Resend, LinkedIn (data). Distribution: Dubai partner (MENA), LinkedIn influencers, B2B consulting firms. Enterprise: real-estate brokerages, developer sales teams, corporate HR/L&D.

**Key Activities.** Product core: AI scoring engine, PDF analysis, post screenshot analysis, SSI integration, personalized plan generation, API call during analyzing. Smart flow: goal question, cohort selection, skip industry/experience if PDF uploaded. Advisory: 1:1 Strategy Sessions, Authority Concierge™, brokerage B2B sales. Phase 3: post write + publish, analytics & reporting.

**Value Propositions.** Self-Serve: LinkedIn Score, Thought Leader Score, Revenue at Risk™, SSI precision, personalized hooks & content plan, instant. Personalization: goal-based, cohort-based, PDF-aware. Advisory: Strategy Sessions, Authority Concierge™ retainer, Authority Rewrite™. B2B: Team Authority Dashboard™, Brokerage Intelligence Report. Phase 3 (Full OS): Profile → Plan → Post → Publish → Report → Improve.

**Customer Relationships.** Tier 1 Self-Serve (free instant report, email + link, saved URL). Tier 2 Guided (Strategy Session, Weekly Signal Report™, Authority Concierge™, Authority Rewrite™). Tier 3 Enterprise (team dashboard, brokerage reports, quarterly monitoring, account management).

**Customer Segments.** Tier 1 mass; Tier 2 Europe (B2B execs, VP employees/founders, consultants, founders, agency owners); Tier 3 Dubai (luxury realtors, brokerages, developer sales teams); Phase 2+ C-suite, investors.

**Key Resources.** Tech (Claude engine, React+Vite, Supabase, vite.config.js env fix); Human (founder Europe + Dubai partner); Data (score DB, cohort benchmarks, SSI correlations, Frameworks™).

**Channels + Client Acq.** Viral loop (shareable plan URL linkedscore.app/plan/UUID, Profile Exit Risk™, badge embed, free→email→upsell, social counter). Personal network Phase 1 (founder posts, QIAGEN/Huawei network, "5 free tests → €99 session," first 10 paying users). Dubai partner (outreach, first paying realtor in 30 days, 30–40% revenue share, $5K–50K brokerage deals). Paid Phase 2 (LinkedIn Ads $500–1K/mo, Meta $300–500/mo). B2B enterprise (corporate packages, Dubai Authority Index™ annual report).

**Cost Structure.** Now ~$0/mo; API ~$0.02/user; domain $10/yr; at 1K users ~$95/mo; ads Phase 2 $500–1K/mo; Dubai partner 30–40%. **Gross margin 95%+.**

**Revenue Streams.** Self-Serve: free report, paid report **€9.99–99**. Advisory: Strategy Session **€250–500**, Authority Concierge™ **€500–3K/mo**, Authority Rewrite™ **€199–1,500**, Weekly Signal **€49/mo**. B2B: Brokerage Report **€5K–50K**, Team Dashboard **€10K+/yr**. Targets: **Year 1 $50K–150K**, **$1M ARR Year 3**.

Trademarks: Authority Intelligence Platform™, Revenue at Risk™, Profile Exit Risk™, Authority Concierge™, Authority Rewrite™, Weekly Signal Report™, Team Authority Dashboard™, Dubai Authority Index™, Frameworks™. Strategy docs in `/docs`: V2_Strategy, Revenue_Architecture, Monetization_Physics.

**Reality check:** no paying customers yet. First 10 paying users validate everything, before more features or ad spend.

---

## 3. What's built (self-serve tier — live)
AI scoring engine; PDF profile analysis; post screenshot analysis; smart onboarding (goal + cohort, skips redundant questions with a PDF); personalized plan generation (parallel API calls during the loading animation); saved-plan URL (linkedscore.app/plan/UUID) with Supabase + RLS, email-gated; lead-magnet email capture; Intercom live-chat widget. Live; social counter ≈113 on recent landing mockups (was "47+" in the canvas, ~77 at the June audit — confirm live).

---

## 4. Engineering status (verified against live repo, commit 122b955)
**Shipped & verified (live):**
- Email gate, two-endpoint, no bypass (§5).
- Hallucination guard (line 682) — no invented employers/schools/metrics; never implies customer counts or revenue.
- FOUNDER_RULES override `critical_rules`.
- Question counter shows N/N (line 1396); progress bar caps at 90% (line 991).
- Score is a 0.6/0.4 blend, clamped 35–95 (`finalizePlan`).
- `[placeholder]` brackets stripped from output (`finalizePlan`).
- Cohort-specific archetypes; Invisible/Silent banned in the prompt (line 686).
- Thought Leader tab always shows a preliminary read.
- Plain-English subtitle; `headline_rewrite` field + "Your New Headline (copy and paste)" card.
- **Post-hook anecdote fabrication — FIXED** (line 684): hooks structurally distinct, no invented anecdotes/results/metrics/cadences, examples framed as fill-in templates, hooks treated as editable drafts. (Was the handoff's top open trust issue.)
- **Cadence — FIXED** (lines 630/634/636): default 1–2 posts/month, scale up only for urgent time-boxed goals, the calendar must obey low-frequency publishing, no magic best-time. (Was the handoff's #2 open item.)
- **Privacy copy — FIXED** (line 1518): "We don't store your PDF. We process the text to build your plan and don't keep it." The "stays on your device" overclaim is gone.
- House style enforced in the prompt (line 678): American English, no Oxford comma, no em/long dashes.

**Open — optional hardening only (low priority, both already enforced at the prompt level):**
- A client-side force-rewrite in `finalizePlan` for any archetype containing "Invisible"/"Silent" — add only if it still leaks in testing. Not implemented; not a hard bug.
- A client-side Oxford-comma strip on output — the prompt rule is strong; add a regex pass only if Sonnet still slips. Not implemented; not a hard bug.

**Roadmap (not bugs, undecided):** monetization & paid tier, result-email quality, a shareable result page for virality, conversion analytics.

**Workflow rule:** never push uncompiled JSX to production (live users; one brace error white-screens everyone). git branch → Vercel preview → verify the full flow → merge to main.

---

## 5. Stack, repo & deployment (verified against the repo)
- **Analyzer:** React + Vite. `App.jsx` (~2,065 lines). `icons.js` maps quiz emojis → gold line-icons. `main.jsx`, `index.html`, `package.json`, `vite.config.js`, `vercel.json`, `logo.png` + `logo-dark.png` at root. Key client-side functions: `buildPrompt(...)` builds the entire plan prompt (persona/scoring/archetype/copy rules all client-side); `finalizePlan(plan)` post-processes (strips brackets, recomputes the blended score, builds the Revenue at Risk range, defaults `headline_rewrite`); `FOUNDER_RULES` const overrides AI `critical_rules`.
- **API (serverless, Node, `api/`):** `generate-plan.js` (relay to Anthropic; stores plan in Supabase `gated_plans`; returns `{ planId }`), `get-plan.js` (validates email, returns `{ plan }`), `send-email.js` (Resend). **Model string: `claude-sonnet-4-5-20250929`.**
- **DB:** Supabase. Tables: `users`, `plans`, `gated_plans`, `subscribers`. RLS with no anon policies; `unlocked_at` for conversion tracking; TTL/pg_cron purge on stored plans (needed so the "we don't keep it" copy is literally true). **Email:** Resend.
- **Hosting:** Vercel (Pro), region `iad1`. Analyzer project `vercel.com/ali-visible-app/linkscore-app` (auto-deploys `main`). Blog project `linkscore-web` → `linkscore-web.vercel.app`.
- **Repo:** `github.com/aliazad11/linkscore` (repo "linkscore", product "Linkedscore"). `web/` holds the Next.js blog.
- **CRITICAL:** the analysis API route must export `maxDuration = 300` (Vercel Pro does not raise the 504 limit automatically).
- **Two-endpoint email gate (live):** generate during the loading screen → store under an unguessable UUIDv4 `planId` → return only `{ planId, ready }` → on Unlock, `get-plan` requires a valid email server-side, records it, returns the plan.
- **WORKFLOW (current):** code work is done in **Claude Code** (direct file edits + git push). The older method of editing in the GitHub web editor via Claude-in-Chrome is retired — do NOT fall back to it.

---

## 6. Model policy
- **Deployed (production analysis): `claude-sonnet-4-5-20250929`** in `api/generate-plan.js`. Opus 4.8 was evaluated 2026-06-30 (won a blind quality A/B 32-8) but REJECTED for prod: a live preview test caught that Opus 4.8 rejects the JSON assistant-prefill (400) and truncates the plan at `max_tokens: 8000`, and Ali judged the hardened-Sonnet output better. Staying on Sonnet 4.5 (creator/`polish-post` too); since 2026-07-01 the gen call already runs `max_tokens: 16000` (scrub 8000). If Opus/Fable is ever revisited: remove the prefill (the 16000 budget is already in place).
- **Development (this Code work): Opus 4.8.** Haiku 4.5 only for cheap bulk pre-processing.

---

## 7. The blog content engine
Marketing investment for the analyzer. **2–3 articles/week** (NOT daily — Google scaled-content-abuse). Topical-authority clusters, long-tail first. Optimize for GEO / AI answer engines. Month-1 = 4 clusters: profile optimization, content strategy, personal branding for execs & founders, growth mechanics. Sources: Ali's LinkedIn posts, 60-sec voice notes, QIAGEN/Huawei/Digikala case studies, 10+ hrs of recorded training.

**Pipeline (human-gated, never auto-publishes):** 1) SEO brief (Researcher; validate keywords via web search) → 2) brief approval gate (~30 sec) → 3) Draft (Writer, Ali's voice) → `final.md` + `meta.json` → 4) Banner (Designer, Cover Playbook — **before QC**) → 5) QC (Editor; no fabricated stats/anecdotes) → 6) Assemble + PR + Vercel preview → Ali approves → merge → live → 7) optional LinkedIn repurpose. Lock the Researcher/Writer/Editor prompts.

**Blog tech:** Next.js 14 in `web/`, separate Vercel project. Home, index, dynamic article route with Article JSON-LD, branded hero, share bar (LinkedIn/X/Copy), Calendly CTA, one seed article. One-time SEO plumbing (sitemap, robots, canonical, kill the duplicate vercel.app copy). Assembly: post → `web/lib/posts.js`, banner → `web/public`. Target routing: `/` analyzer, `/blog` index, `/blog/[slug]` article (verify `/blog` wiring in `web/` + `vercel.json`).

**First article (pilot) — DRAFTED:** "The LinkedIn Golden Hour That Gets Your Posts Seen." Target "LinkedIn golden hour" (long-tail); NOT "best time to post" (unwinnable head term). ~1,500 words + FAQ; internal link to `/blog/linkedin-headline-formula`; CTA `calendly.com/aliazad1800/how-to-be-a-linkedin-star`; cites Buffer (4.8M posts), Sprout Social (2B), Hootsuite, AuthoredUp (keep QC flags on shaky stats).

---

## 8. Branding (de-facto system — resolved)
- **Typeface: Poppins** (kicker SemiBold, headline ExtraBold); DM Sans body pairing in some directions. (Avenir was the early logo exploration; live brand is Poppins.)
- **Gold: champagne `#c8a96e`** (canonical). `logo.png` badge is LinkedIn-Premium gold `#B8963E` — minor mismatch; re-export in `#c8a96e` for consistency.
- **Tokens:** bg near-black `#0a0a0f` (landing `#07070c`–`#08080e`); panels `#0c0c15`/`#101019`; lines `#1c1c2c`–`#20202f`; gold `#c8a96e`, gold-light `#ecd6a3`, gold-dark `#9c763c`; text `#f5f5fc`, sub `#9696b4`, muted `#56566f`; status red `#e0556b`, amber `#e0a23c`, green `#56c08a`.
- **Logo:** white "Linked" + square "score" badge (`sco`/`re` split), transparent PNG (`logo.png`, plus `logo-dark.png`).
- **Founder bio (marketing):** 10+ yrs in social; award-winning at Huawei; led corporate social at QIAGEN, built the exec LinkedIn program to **3.5M+ impressions**; grew own following to **10k+**.
- **Front page:** current page judged "basic"; ~6 dark+gold Poppins redesign mockups exist as static HTML (scorecard/audit, spotlight/into-the-light, kinetic, bento, gauge, your-score) — exploration, not shipped.

---

## 9. LinkedScore Cover Playbook (locked banner template)
**DEFAULT METHOD for any cover/banner request = the Higgsfield Cinema Studio 2.5 playbook below** (Ali's call). The Python scripts are a FALLBACK only — use them when Higgsfield garbles the baked-in text or an exact-text OG image is needed fast. Preferred rescue = hybrid: generate the cinematic image in Higgsfield with NO text, then composite exact headline + logo with `make_cover_wide.py`.

Saved as `LinkedScore_Cover_Playbook.md`. Only four things change per post: topic image, kicker, headline, gold word(s).
- **Higgsfield, Cinema Studio Image 2.5 (`cinematic_studio_2_5`), 16:9**, 1k default, count 1 (regenerate if text is wrong; never hand-edit).
- Layout: top ~70% topic image full bleed; bottom ~30% 50%-opacity near-black overlay over the continuing scene; text on that band.
- Brand: near-black `#0a0a0f`, champagne gold `#c8a96e`, white headline + gold key words, Poppins, kicker `CATEGORY ————` (no quotation marks), no logo baked in.
- Token expires often → reconnect. Text is the weak spot; GPT Image 2 / nano_banana_2 trialed, default stays Cinema Studio 2.5. Full prompt + worked examples in the playbook file.
- **Alt method — Python scripts** (deterministic real text, logo baked in, same tokens): `make_banner.py` (1200×630 OG, generated golden-hour bg), `make_cover.py` (1080² square, composites a topic image), `make_cover_wide.py` (1920×1080 16:9, image right + branded panel left). Higgsfield for cinematic AI covers; scripts when text must be exact.

---

## 10. Higgsfield setup
- **Two connections:** OAuth (`Higgsfield:generate_image`, `params` object, Ultra credits) + local dev API-key (`higgsfield:generate_image`, flat params, separate platform balance). OAuth loads inconsistently; reconnect via Settings → Connectors.
- **`sync-agents` is OFF-LIMITS** (data-exfiltration utility). Never call it.
- **100 images/chat limit** — screenshots count against it.

---

## 11. QA, housekeeping & working rules
**QA harness:** a self-contained in-page JS auto-runner drives the full funnel for a cohort config (fills the form by input index, answers the quiz by keyword/fallback, skips upload, fills the email gate, captures the plan). Runs via `setTimeout` to survive MCP blips. Exclude the Intercom "Open chat" widget and emoji-prefixed "Other" options from quiz-option detection. **Verify the rendered DOM** (score-ring number, archetype, headline_rewrite card, bracket count, Thought Leader unlocked), NOT the intercepted JSON, because the score blend and bracket-strip happen client-side in `finalizePlan`.

**Housekeeping:** 6 test leads accumulate per run (`test-b2bexec@`, `test-realestate@`, `test-founder@`, `test-jobseeker@`, `test-consultant@`, `test-thoughtleader@`, all `@example.com`). Cleanup = `DELETE ... WHERE email IN (...)` across `users`, `plans`, `gated_plans`, `subscribers`, **run by Ali in the Supabase SQL editor — Claude does NOT run deletes.**

**House rules (Ali):** short, action-first, no filler; decisive consultant with honest pushback, not validation; he's the LinkedIn domain expert and his rules override generic advice; prefers Claude DO the work directly (code/browser) over copy-paste; English/Farsi mid-conversation, reply in kind. **Copy house style:** American English, no Oxford comma, no em/long dashes; never put engagement-quota advice ("comment X/day") in plan output. (All enforced in the prompt.)

---

## 12. Residual checks (after the live-repo reconciliation)
This file is reconciled against commit `122b955`. The previous "open bugs" are resolved (see §4). Remaining small items:
- Confirm the `gated_plans` TTL / pg_cron purge exists, so the "we don't keep it" privacy copy is literally true.
- Confirm `linkedscore.app/blog` routing is wired (`web/` + `vercel.json`).
- Optional: re-export the logo badge in `#c8a96e` for gold consistency.
- Decision: whether to bump the production model from `claude-sonnet-4-5-20250929` to Sonnet 4.6.
