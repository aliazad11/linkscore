# LinkedScore — Cover Image Playbook (LOCKED TEMPLATE)

The finalized, repeatable process for generating LinkedScore post and article covers.
Use it for every cover so the branding stays identical. **Only four things change per
post; everything else is locked.**

---

## Engine & model (locked)
- **Tool:** Higgsfield (image generation)
- **Model:** Cinema Studio Image 2.5 — model ID `cinematic_studio_2_5`
- **Aspect ratio:** `16:9`
- **Resolution:** 1k (model default). Rerun the approved one at higher quality for a crisper final asset.
- **count:** 1 (regenerate if the text comes out wrong — AI text varies run to run)

> Note: Higgsfield's connection token expires often. If a generation fails with
> "invalid or expired token," reconnect Higgsfield and run again.

## Layout (locked)
Two horizontal sections:
- **Top ~70%** — the conceptual topic image, full bleed.
- **Bottom ~30%** — a **50% opacity** near-black overlay laid over the *continuing* scene,
  so the image bleeds through the dark tint. No solid black, no hard cut. Text sits on this band.

## Brand details (locked)
- Dark tone / background: near-black `#0a0a0f`
- Accent: champagne gold `#c8a96e`
- Headline: white, with the key word(s) in champagne gold
- Typeface: **Poppins** (matches the logo) — kicker in SemiBold, headline in ExtraBold
- Kicker format: `CATEGORY` then a long champagne-gold rule line trailing to the right
  (magazine section-header style). **No quotation marks anywhere.**
- No logo is baked into the AI render (the wordmark stays out of the generation).

## What you change per post (the only variables)
1. **Topic image concept** — a dark, moody, conceptual scene tied to the article, lit with champagne-gold light on near-black.
2. **Kicker** — the category (e.g. LINKEDIN GROWTH, ALGORITHM, PROFILE, CONTENT).
3. **Headline** — punchy; 4–9 words reads best.
4. **Gold word(s)** — the key phrase rendered in gold.

---

## The prompt (copy, fill the [BRACKETS], paste into Higgsfield)

> A 16:9 editorial cover image divided into two sections. TOP SECTION (upper 70% of image): **[TOPIC IMAGE — a moody cinematic conceptual photograph tied to the article: dark near-black background, warm champagne-gold light, premium magazine editorial quality, fine film grain]**. BOTTOM SECTION (lower 30% of image): a semi-transparent near-black overlay at exactly 50% opacity over the continuing scene from the top, the photograph clearly visible and bleeding through underneath the dark tint. On top of this translucent overlay, left-aligned Poppins rounded geometric sans-serif typeface throughout: first a line with small champagne-gold uppercase letter-spaced Poppins SemiBold text **[KICKER]** with absolutely no quotation marks no inverted commas no punctuation around it, immediately followed by a long horizontal champagne-gold dash rule line extending to the right exactly like an editorial magazine section header where the category name comes first then the rule trails after it. Then directly below, a large Poppins ExtraBold white headline **[HEADLINE]** with the words **[GOLD WORDS]** in champagne-gold. Clean professional typography. No quotation marks anywhere. No logos, no extra text.

## Higgsfield settings
- model: `cinematic_studio_2_5`
- aspect_ratio: `16:9`
- count: `1`

---

## Step-by-step
1. Write the headline (4–9 words) and pick the kicker category.
2. Choose the gold word(s).
3. Write the topic-image description — always dark + champagne-gold to match the brand.
4. Drop all four into the prompt template above.
5. Generate on Higgsfield with Cinema Studio Image 2.5, 16:9.
6. Check the text. If a letter or word is off, regenerate (don't hand-edit — keep it one engine).
7. Approve, then optionally rerun at higher quality for the final.

---

## Worked example — the finalized first cover
- **Topic image:** a man's profile in shadow against near-black, warm champagne-gold light from a smartphone, a translucent clock face radiating golden rays and rising gold bokeh, cinematic, fine film grain
- **Kicker:** LINKEDIN GROWTH
- **Headline:** The LinkedIn Golden Hour That Gets Your Posts Seen
- **Gold words:** Golden Hour

## Second example — how to adapt for the next article (LinkedIn algorithm)
- **Topic image:** a dark abstract constellation of glowing gold nodes and connecting lines that subtly forms a human profile, champagne-gold light on near-black, cinematic, fine film grain
- **Kicker:** ALGORITHM
- **Headline:** How the LinkedIn Algorithm Really Works
- **Gold words:** Algorithm
