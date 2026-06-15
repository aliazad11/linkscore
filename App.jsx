import { useState, useEffect, useRef } from "react";
import { HOME_CSS, homeHtml } from "./home.js";
import { iconFor } from "./icons.js";
import logoAsset from "./logo.png";
import { track, identify } from "./analytics.js";
import { useLocale, LOCALES, PROMPT_LANG, cohortText, localizeQuestions } from "./i18n.jsx";
import { openCookieSettings } from "./CookieConsent.jsx";
import { SHARE_CARDS, SHARE_I18N, GENDERED_LOCALES, cardIdFor } from "./shareCards.data.js";

const LOGO_URL = logoAsset;

const FOUNDER_RULES = ["Post no more than twice a month. Quality beats quantity.","Don't post during low-traffic hours.","Never edit a post after publishing.","Never reshare. If you want a post seen, or your own account seen more, comment and like instead.","Fill in your full work history with proper, relevant descriptions on your profile.","Have a profile photo and banner that fit your industry.","Tag anyone you mention in a post.","Use a mix of content formats: documents, polls, images, video.","Have a content plan and roadmap built around what you want to become.","People follow you to hear your story, not industry news. Put yourself in the story, and show your face so posts get more reach.","Find relevant people in your field through search and send connection requests, to grow your following in the first months.","The first 60 minutes after posting matter most. Reply to every comment.","Use only 3 to 5 targeted, relevant hashtags.","End every post with a clear CTA, a question or an opinion request.","The first three lines must hook hard enough to earn the 'see more' click."];

const GENERIC_QUESTIONS = [
  {
    id: "current_status", phase: "Where You Are",
    question: "How active are you on LinkedIn right now?",
    subtitle: "No judgment, everyone starts somewhere.",
    options: [
      { label: "Ghost account, I barely log in", emoji: "👻" },
      { label: "I scroll but never post", emoji: "👁️" },
      { label: "I posted once or twice and gave up", emoji: "📝" },
      { label: "I post sometimes but get zero traction", emoji: "📉" },
      { label: "I'm active but not growing fast enough", emoji: "🔄" },
      { label: "I post regularly and get good results", emoji: "🚀" },
      { label: "Other / Something else", emoji: "🌍" },
    ],
  },
  {
    id: "profile_completeness", phase: "Your Profile",
    question: "How complete is your LinkedIn profile today?",
    subtitle: "Think of it as your storefront window.",
    options: [
      { label: "Just name and current job", emoji: "🪨" },
      { label: "Basic info, no About section", emoji: "📋" },
      { label: "Complete but no visual strategy", emoji: "🖼️" },
      { label: "Looks complete but feels generic", emoji: "😐" },
      { label: "Strong profile, but not getting results", emoji: "💪" },
      { label: "Optimized profile getting consistent views", emoji: "⭐" },
      { label: "Other / Something else", emoji: "🌍" },
    ],
  },
  {
    id: "content_struggle", multiSelect: true, phase: "Your Challenge",
    question: "What's your biggest content challenge?",
    subtitle: "Pick all that apply.",
    options: [
      { label: "I don't know what topics to write about", emoji: "💡" },
      { label: "I struggle to put my thoughts into words", emoji: "✍️" },
      { label: "I don't have enough time to create content", emoji: "⏰" },
      { label: "I publish but get little to no engagement", emoji: "📉" },
      { label: "I'm not comfortable putting myself out there", emoji: "😰" },
      { label: "I have ideas but never follow through", emoji: "🗂️" },
      { label: "Other / Something else", emoji: "🌍" },
    ],
  },
  {
    id: "content_style", multiSelect: true, phase: "Your Voice",
    question: "Which content style feels most natural to you?",
    subtitle: "Your authentic voice is your biggest competitive advantage.",
    options: [
      { label: "Sharing lessons from my own experiences", emoji: "📖" },
      { label: "Analytical takes and data-backed opinions", emoji: "📊" },
      { label: "Controversial or bold industry opinions", emoji: "🔥" },
      { label: "Practical tips and how-tos", emoji: "🛠️" },
      { label: "Personal stories and career journey", emoji: "🌱" },
      { label: "Other / Something else", emoji: "🌍" },
    ],
  },
  {
    id: "time_commitment", phase: "Your Commitment",
    question: "Realistically, how much time can you invest weekly?",
    subtitle: "Consistency always beats intensity.",
    options: [
      { label: "Less than 1 hour", emoji: "⚡" },
      { label: "1–2 hours", emoji: "🕐" },
      { label: "3–5 hours", emoji: "🕒" },
      { label: "5+ hours, I'm fully committed", emoji: "🔥" },
      { label: "Other / Something else", emoji: "🌍" },
    ],
  },
];

const COHORT_QUESTIONS = {
  "Job Seeker": [
    {
      id: "target_role", phase: "Your Target",
      question: "What role are you targeting?",
      subtitle: "This shapes your entire positioning strategy.",
      options: [
        { label: "Same field, higher level", emoji: "🎯" },
        { label: "Career change to a new industry", emoji: "🔄" },
        { label: "Relocating and need to rebuild network", emoji: "🌍" },
        { label: "Back to work after a break", emoji: "💼" },
        { label: "First job or early career", emoji: "🚀" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "search_duration", phase: "Your Timeline",
      question: "How long have you been searching?",
      subtitle: "Your urgency changes the strategy.",
      options: [
        { label: "Just started", emoji: "⚡" },
        { label: "1–3 months", emoji: "📅" },
        { label: "3–6 months", emoji: "😰" },
        { label: "6+ months, it's getting frustrating", emoji: "😓" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "recruiter_view", phase: "Your Visibility",
      question: "What do recruiters currently see on your profile?",
      subtitle: "Be honest, this is your starting point.",
      options: [
        { label: "Barely anything, it's almost empty", emoji: "🪨" },
        { label: "Just my job history, nothing more", emoji: "📋" },
        { label: "Complete but nothing stands out", emoji: "😐" },
        { label: "Looks good but not getting responses", emoji: "💪" },
        { label: "Strong profile, just need more visibility", emoji: "✨" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "job_obstacle", phase: "Your Obstacle",
      question: "What's your biggest obstacle?",
      subtitle: "Pick the one that hits hardest.",
      options: [
        { label: "I don't know how to position myself", emoji: "🤷" },
        { label: "My profile is invisible to recruiters", emoji: "👻" },
        { label: "I'm not sure what makes me different", emoji: "😰" },
        { label: "I don't have the right connections", emoji: "🔗" },
        { label: "I know what to say but can't write it", emoji: "📝" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "job_success", phase: "Your Vision",
      question: "What would make LinkedIn feel like it truly worked?",
      subtitle: "Picture it clearly.",
      options: [
        { label: "A recruiter DMing me out of nowhere", emoji: "📩" },
        { label: "Landing interviews within 30 days", emoji: "🤝" },
        { label: "Getting my dream job offer", emoji: "💼" },
        { label: "Being seen as top talent in my field", emoji: "🌟" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
  ],
  "B2B Executive": [
    {
      id: "seniority", phase: "Your Level",
      question: "What's your seniority level?",
      subtitle: "Your level determines your positioning angle.",
      options: [
        { label: "Manager / Senior Manager", emoji: "📈" },
        { label: "Director / VP", emoji: "🏢" },
        { label: "C-Suite / Partner", emoji: "👑" },
        { label: "Individual contributor but expert level", emoji: "🎯" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "employment_type", phase: "Your Situation",
      question: "Are you an employee or do you run your own business?",
      subtitle: "This changes everything about your strategy.",
      options: [
        { label: "Employee at a company", emoji: "🏢" },
        { label: "I run my own business", emoji: "🚀" },
        { label: "Both, corporate + side ventures", emoji: "🔄" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "target_audience", multiSelect: true, phase: "Your Audience",
      question: "Who are you trying to influence on LinkedIn?",
      subtitle: "Clarity on audience changes everything.",
      options: [
        { label: "Future employers or headhunters", emoji: "🤝" },
        { label: "Potential clients or partners", emoji: "💼" },
        { label: "Peers and industry professionals", emoji: "👥" },
        { label: "A broad industry audience", emoji: "🎤" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "brand_gap", multiSelect: true, phase: "Your Gap",
      question: "What's currently missing from your professional brand?",
      subtitle: "This is what we'll fix first.",
      options: [
        { label: "Clear positioning, people don't know what I stand for", emoji: "🎯" },
        { label: "Consistent content, I post sporadically", emoji: "📝" },
        { label: "Visibility, I exist but nobody finds me", emoji: "🌟" },
        { label: "Engagement, I post but get no reaction", emoji: "💬" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "exec_success", phase: "Your Vision",
      question: "What does success look like in 90 days?",
      subtitle: "This becomes your north star.",
      options: [
        { label: "Inbound opportunities coming to me", emoji: "📩" },
        { label: "Being invited to speak or contribute", emoji: "🎤" },
        { label: "Recognized as a go-to expert", emoji: "👑" },
        { label: "Measurable follower and engagement growth", emoji: "📈" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
  ],
  "Startup Founder": [
    {
      id: "startup_stage", phase: "Your Stage",
      question: "What stage is your startup?",
      subtitle: "Your stage shapes your entire content strategy.",
      options: [
        { label: "Idea / Pre-product", emoji: "🌱" },
        { label: "Building, early users", emoji: "🔨" },
        { label: "Growing, have traction", emoji: "📈" },
        { label: "Scaling, raising or expanding", emoji: "🚀" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "founder_goal", multiSelect: true, phase: "Your Goal",
      question: "What's your primary LinkedIn goal?",
      subtitle: "Pick your biggest priority right now.",
      options: [
        { label: "Attract investors", emoji: "💰" },
        { label: "Acquire early customers", emoji: "👥" },
        { label: "Build credibility in the space", emoji: "🏆" },
        { label: "Find co-founders or key hires", emoji: "🤝" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "founder_challenge", phase: "Your Challenge",
      question: "What's your content challenge as a founder?",
      subtitle: "Be honest, this is common.",
      options: [
        { label: "No time, building takes everything", emoji: "⏰" },
        { label: "Don't know what to share publicly", emoji: "🤷" },
        { label: "Afraid to share before product is ready", emoji: "😰" },
        { label: "Post but get zero traction", emoji: "📉" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "founder_perception", multiSelect: true, phase: "Your Brand",
      question: "How do you want to be perceived?",
      subtitle: "This becomes your content persona.",
      options: [
        { label: "Visionary building the future", emoji: "🔭" },
        { label: "Operator who gets things done", emoji: "🛠️" },
        { label: "Deep expert in my domain", emoji: "🎓" },
        { label: "Mission-driven founder with purpose", emoji: "🌍" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "founder_success", phase: "Your Vision",
      question: "What would 90-day success look like?",
      subtitle: "Make it specific.",
      options: [
        { label: "First 10 paying customers from LinkedIn", emoji: "💼" },
        { label: "Investor conversations started", emoji: "💰" },
        { label: "Recognized in my startup ecosystem", emoji: "🌟" },
        { label: "500+ relevant followers gained", emoji: "📈" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
  ],
  "Real Estate Professional": [
    {
      id: "re_focus", phase: "Your Market",
      question: "What's your focus area?",
      subtitle: "Your niche is your superpower.",
      options: [
        { label: "Residential, helping families find homes", emoji: "🏠" },
        { label: "Commercial, working with businesses", emoji: "🏢" },
        { label: "Luxury, high-end properties", emoji: "💎" },
        { label: "New development, off-plan sales", emoji: "🏗️" },
        { label: "International, cross-border clients", emoji: "🌍" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "re_client", multiSelect: true, phase: "Your Client",
      question: "Who is your ideal client?",
      subtitle: "Speak to one person, reach thousands.",
      options: [
        { label: "First-time buyers", emoji: "👨‍👩‍👧" },
        { label: "Investors looking for returns", emoji: "💼" },
        { label: "HNWIs and luxury buyers", emoji: "👑" },
        { label: "Corporate clients and businesses", emoji: "🏢" },
        { label: "Expats and international buyers", emoji: "🌍" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "re_source", phase: "Your Leads",
      question: "How do clients currently find you?",
      subtitle: "Understanding your current channels helps us build better ones.",
      options: [
        { label: "Referrals only", emoji: "🤝" },
        { label: "Social media (Instagram/TikTok)", emoji: "📱" },
        { label: "Google and online listings", emoji: "🔍" },
        { label: "Walk-ins and agency leads", emoji: "🏢" },
        { label: "LinkedIn, but it's not working well", emoji: "🔗" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "re_differentiator", multiSelect: true, phase: "Your Edge",
      question: "What's your biggest differentiator?",
      subtitle: "This becomes the core of your LinkedIn brand.",
      options: [
        { label: "Local market expertise", emoji: "🗺️" },
        { label: "Corporate and investment focus", emoji: "💼" },
        { label: "Relationship-first approach", emoji: "🤝" },
        { label: "Data-driven advice", emoji: "📊" },
        { label: "Access to exclusive properties", emoji: "💎" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "re_success", phase: "Your Vision",
      question: "What would LinkedIn success look like?",
      subtitle: "Picture your ideal outcome.",
      options: [
        { label: "High-value clients reaching out directly", emoji: "📩" },
        { label: "Being the go-to agent in my market", emoji: "🌟" },
        { label: "Building a referral network of professionals", emoji: "🤝" },
        { label: "Closing deals sourced from LinkedIn", emoji: "💰" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
  ],
  "Consultant or Coach": [
    {
      id: "consulting_niche", multiSelect: true, phase: "Your Niche",
      question: "What's your niche?",
      subtitle: "The riches are in the niches.",
      options: [
        { label: "Business strategy and operations", emoji: "💼" },
        { label: "Leadership and executive coaching", emoji: "🧠" },
        { label: "Sales and revenue growth", emoji: "📈" },
        { label: "Marketing and brand building", emoji: "🎨" },
        { label: "Personal development and life coaching", emoji: "🌱" },
        { label: "Tech and digital transformation", emoji: "💻" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "client_source", phase: "Your Leads",
      question: "How do clients currently find you?",
      subtitle: "This tells us what's working and what's not.",
      options: [
        { label: "Word of mouth and referrals only", emoji: "🤝" },
        { label: "Social media, but inconsistently", emoji: "📱" },
        { label: "My website or blog", emoji: "🌐" },
        { label: "Conferences and events", emoji: "🏢" },
        { label: "They don't, I'm chasing them", emoji: "😓" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "consulting_challenge", phase: "Your Challenge",
      question: "What's your biggest business challenge?",
      subtitle: "Pick the one holding you back most.",
      options: [
        { label: "Positioning, I'm too broad, clients don't get it", emoji: "🎯" },
        { label: "Content, I know my stuff but can't explain it simply", emoji: "📝" },
        { label: "Visibility, nobody knows I exist", emoji: "👻" },
        { label: "Pricing, I undercharge because I'm not seen as premium", emoji: "💰" },
        { label: "Time, client work leaves no time for marketing", emoji: "⏰" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "target_client", multiSelect: true, phase: "Your Client",
      question: "What kind of clients do you want to attract?",
      subtitle: "Your dream client shapes your entire content.",
      options: [
        { label: "Large corporates and enterprises", emoji: "🏢" },
        { label: "Fast-growing SMEs", emoji: "📈" },
        { label: "Startups and founders", emoji: "🚀" },
        { label: "C-Suite and senior executives", emoji: "👑" },
        { label: "International clients", emoji: "🌍" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "consulting_success", phase: "Your Vision",
      question: "What does winning look like?",
      subtitle: "Define it clearly.",
      options: [
        { label: "Inbound leads coming without outreach", emoji: "📩" },
        { label: "Raising my rates and attracting premium clients", emoji: "💰" },
        { label: "Getting speaking invitations and media features", emoji: "🎤" },
        { label: "Becoming the obvious expert in my niche", emoji: "🌟" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
  ],
  "Thought Leader": [
    {
      id: "tl_topic", multiSelect: true, phase: "Your Topic",
      question: "What topic do you want to own?",
      subtitle: "Own one topic completely.",
      options: [
        { label: "AI and the future of work", emoji: "🤖" },
        { label: "Sustainability and impact", emoji: "🌱" },
        { label: "Leadership and management", emoji: "💼" },
        { label: "Marketing and growth", emoji: "📈" },
        { label: "Mental health and wellbeing at work", emoji: "🧠" },
        { label: "Something else entirely", emoji: "🌍" },
      ],
    },
    {
      id: "tl_presence", phase: "Your Presence",
      question: "What's your current LinkedIn presence?",
      subtitle: "Be honest, this is your baseline.",
      options: [
        { label: "Starting from zero", emoji: "👻" },
        { label: "Under 500 followers, low engagement", emoji: "📉" },
        { label: "500–5K followers, inconsistent posts", emoji: "📈" },
        { label: "5K+ followers but want faster growth", emoji: "🚀" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "tl_frequency", phase: "Your Habit",
      question: "How often do you currently post?",
      subtitle: "No judgment, this shapes your plan.",
      options: [
        { label: "Rarely or never", emoji: "😓" },
        { label: "Once or twice a month", emoji: "📅" },
        { label: "Once a week", emoji: "📆" },
        { label: "Multiple times a week", emoji: "🔥" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "tl_obstacle", phase: "Your Obstacle",
      question: "What's your biggest content obstacle?",
      subtitle: "Pick the one that stops you most.",
      options: [
        { label: "Running out of ideas", emoji: "💡" },
        { label: "Writing takes too long", emoji: "✍️" },
        { label: "Fear of being wrong publicly", emoji: "😰" },
        { label: "I post but get no engagement", emoji: "📉" },
        { label: "Not sure how to stand out in a crowded space", emoji: "🎯" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
    {
      id: "tl_success", phase: "Your Vision",
      question: "What would success look like?",
      subtitle: "Make it ambitious.",
      options: [
        { label: "A post crossing 50K views", emoji: "👁️" },
        { label: "Being invited to speak at events", emoji: "🎤" },
        { label: "Media and podcast interview requests", emoji: "📩" },
        { label: "Recognized as the voice in my topic", emoji: "🌟" },
        { label: "10K+ followers in 6 months", emoji: "📈" },
      { label: "Other / Something else", emoji: "🌍" },
      ],
    },
  ],
};

// Dynamic questions based on cohort
function getQuestionsForCohort(cohortId) {
  const generic = GENERIC_QUESTIONS;
  const cohortQ = cohortId && COHORT_QUESTIONS[cohortId] ? COHORT_QUESTIONS[cohortId] : [];
  return [...generic, ...cohortQ];
}

const ANALYSIS_STEPS = [
  { text: "Scanning your profile data...", duration: 1600 },
  { text: "Reading your profile and answers...", duration: 1900 },
  { text: "Mapping your goal to proven strategies...", duration: 1800 },
  { text: "Identifying your content archetype...", duration: 1700 },
  { text: "Generating your post hooks...", duration: 2000 },
  { text: "Building your 30-day roadmap...", duration: 1800 },
  { text: "Calculating your LinkedIn Score...", duration: 1400 },
  { text: "Personalizing your recommendations...", duration: 2000 },
  { text: "Fine-tuning your content strategy...", duration: 1800 },
  { text: "Preparing your final report...", duration: 1600 },
];
// Per-step i18n keys, index-aligned with ANALYSIS_STEPS (used for non-English locales).
const ANALYSIS_STEP_KEYS = ["step_scan","step_bench","step_map","step_arch","step_hooks","step_roadmap","step_score","step_personal","step_finetune","step_report"];

const REVENUE_COHORTS = ["Real Estate Professional", "Consultant or Coach", "Startup Founder"];
const PINNED_CURRENCIES = ["USD","EUR","GBP","AED","SAR","CAD","AUD","CHF","INR","SGD"];
function allCurrencyCodes() {
  try {
    const all = Intl.supportedValuesOf ? Intl.supportedValuesOf("currency") : PINNED_CURRENCIES;
    const pinned = PINNED_CURRENCIES.filter(c => all.indexOf(c) !== -1);
    const rest = all.filter(c => PINNED_CURRENCIES.indexOf(c) === -1);
    return pinned.concat(rest);
  } catch (e) { return PINNED_CURRENCIES; }
}
function currencyName(code) {
  try { return new Intl.DisplayNames(undefined, { type: "currency" }).of(code) || code; } catch (e) { return code; }
}
function guessCurrency() {
  try {
    const region = (navigator.language || "en-US").split("-")[1];
    const map = { US:"USD", GB:"GBP", AE:"AED", SA:"SAR", DE:"EUR", FR:"EUR", ES:"EUR", IT:"EUR", NL:"EUR", IE:"EUR", AT:"EUR", BE:"EUR", PT:"EUR", CA:"CAD", AU:"AUD", CH:"CHF", IN:"INR", SG:"SGD", QA:"QAR", KW:"KWD", TR:"TRY", ZA:"ZAR", BR:"BRL", JP:"JPY", CN:"CNY", HK:"HKD" };
    return (region && map[region]) || "USD";
  } catch (e) { return "USD"; }
}
function fmtMoney(n, code) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code || "USD", maximumFractionDigits: 0 }).format(Math.round(n)); }
  catch (e) { return (code || "") + " " + Math.round(n).toLocaleString(); }
}

function finalizePlan(plan, rev, locale = "en") {
  if (!plan || typeof plan !== "object") return plan;
  // House style: English copy carries no em/long dashes. The prompt already
  // forbids them; this is the deterministic backstop (#16) so a model slip
  // never reaches the user. Other locales keep their native typography.
  const noDash = locale === "en";
  const strip = (s) => {
    if (typeof s !== "string") return s;
    // Map the common placeholder slots a model still slips into ready-to-paste
    // copy to graceful prose, so the bracket-strip never leaves broken text like
    // "Hi ," or "post about and". Then strip any other leftover [slot] generically.
    let out = s
      .replace(/\[\s*(?:first\s+)?name\s*\]/gi, "there")
      .replace(/\[\s*(?:their|your|recipient'?s?)\s+name\s*\]/gi, "there")
      .replace(/\[\s*(?:specific\s+)?topic\s*\]/gi, "your recent post")
      .replace(/\[\s*(?:their|your)\s+(?:topic|post|subject)\s*\]/gi, "your recent post")
      .replace(/\s*:?\s*\[\s*(?:link|url|profile\s+link|your\s+link)\s*\]/gi, " (link in my profile)")
      .replace(/\[\s*(?:company|company\s*name|their\s+company)\s*\]/gi, "your company")
      .replace(/\[([^\]\[]{1,80})\]/g, "$1");
    if (noDash) out = out.replace(/\s*[—―]\s*/g, ", ");
    return out;
  };
  const walk = (v) => {
    if (typeof v === "string") return strip(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") { const o = {}; for (const k in v) o[k] = walk(v[k]); return o; }
    return v;
  };
  plan = walk(plan);
  // Backstop: the prompt bans "Invisible"/"Silent" archetypes, but the model still
  // slips (e.g. "The Invisible Authority"). There is no second chance client-side, so
  // neutralize the banned word deterministically before it ever reaches the user.
  if (typeof plan.archetype === "string") {
    plan.archetype = plan.archetype.replace(/\bInvisible\b/g, "Quiet").replace(/\binvisible\b/g, "quiet").replace(/\bSilent\b/g, "Quiet").replace(/\bsilent\b/g, "quiet");
  }
  // Backstop: the calendar is always a 4 week plan (2 POST, 2 ENGAGEMENT). A long
  // user timeline ("next 90 days") sometimes makes the model emit 12 weeks, which
  // overflows the Calendar tab; clamp to the first 4 entries.
  if (Array.isArray(plan.content_calendar) && plan.content_calendar.length > 4) {
    plan.content_calendar = plan.content_calendar.slice(0, 4);
  }
  const ps = plan.profile_scores || {};
  let overall = Number(ps.overall);
  if (!overall) { const h = Number(ps.headline) || 0, a = Number(ps.about) || 0, e = Number(ps.experience) || 0; overall = Math.round((h + a + e) / 3) || 50; }
  overall = Math.max(0, Math.min(100, overall));
  const ssiTotal = (plan.ssi_plan && plan.ssi_plan.available && Number(plan.ssi_plan.total)) ? Number(plan.ssi_plan.total) : null;
  let score = ssiTotal != null ? Math.round(0.6 * overall + 0.4 * ssiTotal) : Math.round(overall);
  score = Math.max(35, Math.min(95, score));
  plan.score = score;
  if (!plan.headline_rewrite) plan.headline_rewrite = "";
  if (rev && rev.value && rev.target && REVENUE_COHORTS.indexOf(rev.cohort) !== -1 && !(rev.cohort === "Startup Founder" && rev.hasRevenue !== "yes")) {
    const v = Number(rev.value), t = Number(rev.target);
    const share = Number(rev.channelShare) > 0 ? Number(rev.channelShare) : 0.3;
    if (v > 0 && t > 0 && share > 0) {
      const gap = (100 - plan.score) / 100;
      const core = t * share * gap;
      const round2 = function(n){ if (n <= 0) return 0; var step = n < 1000 ? 50 : (n < 10000 ? 100 : (n < 100000 ? 1000 : 10000)); return Math.round(n / step) * step; };
      const high = round2(v * core * 1.0);
      const lowRaw = round2(v * core * 0.6);
      const low = lowRaw > 0 ? lowRaw : high;
      if (high >= 1) {
        const noun = rev.cohort === "Real Estate Professional" ? "deal" : rev.cohort === "Startup Founder" ? "customer" : (rev.period === "per_project" ? "project" : "client");
        plan.revenue_at_risk = { available: true, low: low, high: high, currency: rev.currency || "USD", value: v, target: t, sharePct: Math.round(share * 100), period: rev.period || "per_year", noun: noun };
      }
    }
  }
  return plan;
}

function buildPrompt(userData, answers, profileText, screenshotCount = 0, cohort = null, specialNote = "", hasPdf = false, locale = "en") {
  const langName = PROMPT_LANG[locale] || "English";
  const langDirective = locale && locale !== "en"
    ? `\nLANGUAGE, STRICT: Write EVERY string value in the output in ${langName}. This includes the archetype, headline, all rewrites (headline_rewrite, about_rewrite, experience_rewrite), profile_fixes, urgency, post_hooks, content_strategy, content_calendar, critical_rules, growth_tactics, networking (including the ready-to-paste connection and follow-up messages), closing_message, thought_leader analysis and improvements, and ssi_plan. The ready-to-paste LinkedIn copy MUST read as natural, native ${langName} that this person could publish as-is, not a translation. Keep the JSON keys and enum values (POST, ENGAGEMENT, WEAK, AVERAGE, STRONG) in English; only the human-readable values are in ${langName}. The "American English, no Oxford comma, no em dash" house style applies only when the language is English.\n`
    : "";
  const profileSection = profileText
    ? `\nPROFILE PDF:\n${profileText}\n`
    : "";

  const sanitize = (s) => String(s || '').replace(/[\n\r]/g, ' ').replace(/"/g, "'").replace(/[\x00-\x1F\x7F]/g, '').slice(0, 600);
  // Multi-select answers arrive joined with " | "; annotate any "Other:" part
  const answersText = Object.entries(answers).map(([k,v]) => {
    const parts = String(v == null ? '' : v).split(' | ').map(part =>
      part.startsWith('Other: ')
        ? `[user wrote: "${sanitize(part.replace('Other: ', '').trim())}"], treat as a prompt, analyze deeply`
        : sanitize(part)
    );
    return `${k}: ${parts.join(' | ')}`;
  }).join('\n');

  const ssiText = (userData.establish_brand||userData.find_people||userData.engage_insights||userData.build_relationships)
    ? `SSI: Brand=${userData.establish_brand||"?"}/25 People=${userData.find_people||"?"}/25 Insights=${userData.engage_insights||"?"}/25 Relations=${userData.build_relationships||"?"}/25 Total=${parseInt(userData.establish_brand||0)+parseInt(userData.find_people||0)+parseInt(userData.engage_insights||0)+parseInt(userData.build_relationships||0)}/100`
    : "SSI: not provided";

  // Compact JSON schema, replace UPPER_CASE placeholders with real values
  const schema = `{"score":INT,"archetype":"STR","headline":"STR","headline_rewrite":"STR","about_rewrite":"STR","experience_rewrite":"STR","urgency":"MAX_30_WORDS","profile_scores":{"headline":INT,"about":INT,"experience":INT,"overall":INT},"profile_fixes":["STR","STR","STR"],"keyword_analysis":{"target":"STR","present":["STR","STR","STR","STR","STR"],"missing":[{"keyword":"STR","where":"STR","example":"STR"},{"keyword":"STR","where":"STR","example":"STR"},{"keyword":"STR","where":"STR","example":"STR"},{"keyword":"STR","where":"STR","example":"STR"}]},"content_strategy":{"post_frequency":"STR","best_posting_times":"STR","content_mix":"STR","hook_formula":"STR","content_types":"STR"},"post_hooks":["STR","STR","STR"],"content_calendar":[{"week":"Week 1","type":"POST","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 2","type":"ENGAGEMENT","topic":"STR","hook":null,"action":"STR"},{"week":"Week 3","type":"POST","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 4","type":"ENGAGEMENT","topic":"STR","hook":null,"action":"STR"}],"critical_rules":["STR","STR","STR","STR","STR","STR"],"growth_tactics":["STR","STR","STR","STR"],"networking":{"mode":"STR","headline":"STR","targets":[{"who":"STR","action":"STR"},{"who":"STR","action":"STR"},{"who":"STR","action":"STR"}],"connection_message":"STR","follow_up_message":"STR"},"closing_message":"STR","thought_leader":{"available":true,"score":INT,"hook_score":INT,"engagement_score":INT,"voice_score":INT,"structure_score":INT,"analysis":"MAX_30_WORDS","improvements":["STR","STR","STR"]},"ssi_plan":{"available":${!!(userData.establish_brand||userData.find_people||userData.engage_insights||userData.build_relationships)},"total":INT,"overview":"STR","pillars":[{"name":"Establish Your Brand","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"},{"name":"Find the Right People","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"},{"name":"Engage with Insights","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"},{"name":"Build Relationships","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"}]}}`;

  return `OUTPUT: raw JSON only, no markdown, no commentary.
${langDirective}
USER:
Cohort: ${cohort||"Professional"}
Name: ${userData.firstName} ${userData.lastName} | Age: ${userData.age} | Title: ${userData.jobTitle}
${ssiText}
Answers:
${answersText}
${specialNote ? `Priority focus: ${specialNote}` : ""}
${profileSection}
THOUGHT LEADER: always provide a preliminary read from their answers and profile. Set thought_leader.available=true and score all 4 sub-scores as best estimates from their stated behavior. In 'analysis' (max 15 words) note it is a preliminary estimate that sharpens when they upload recent post screenshots. Give 3 specific improvements.
${(userData.establish_brand||userData.find_people||userData.engage_insights||userData.build_relationships) ? `SSI: Set ssi_plan.available=true, analyze each pillar, give specific actionable advice per pillar.` : `ssi_plan.available=false`}

CORE PRINCIPLE:
You are a senior LinkedIn strategist, not a profile critic or a metrics dashboard. Ground every output in THIS user's real input above and in how LinkedIn actually rewards behavior. State durable mechanics as firm principles. Frame anything that depends on the current algorithm (which format is winning, optimal timing) as a present-day tendency the user should verify against their own results, never a permanent rule. Assume the user has already heard generic advice; your only value is the part that could only come from their specific data. If you cannot ground a tip in their input, cut it.

DIRECTIVE 1, CLASSIFY CONTENT BEFORE JUDGING IT (only when post screenshots were provided):
For each uploaded post, first identify its type: original written post, reshare with commentary, bare reshare, image-only, link drop, poll, carousel or document, video, or milestone or celebration post. Then branch:
- Mostly original written content: analyze the visible metrics, name the best and worst performer, and explain the engagement gap with specific reasons.
- Mostly bare reshares, link drops, or image-only with no original text: do NOT read low engagement as a content-quality failure. The primary diagnosis is that the user is not publishing original content. Reshares are deprioritized by the algorithm and build little personal brand. Advise the shift from resharing to creating.
- Mixed: name the pattern explicitly and prioritize the create-versus-reshare problem over fine-tuning.
Never benchmark a reshare's engagement against an original post's. Only treat engagement numbers as a quality signal once you have confirmed the post was an original creative attempt. If the sample is too small, too old, too uniform, or otherwise unrepresentative, say so and base advice on what the format reveals rather than over-interpreting the numbers. If metrics are not visible, say so rather than inventing them.

DIRECTIVE 2, EVALUATE ACROSS FOUR AXES, not just text:
A. FORMAT (state these as current tendencies, not permanent rules): video currently tends to earn strong reach because the platform prioritizes it; carousels and documents suit frameworks and step-by-step teaching; polls drive reach but not authority; posts showing the user's own face tend to lift reactions because faces stop the scroll. Match format to their goal AND to what they can realistically produce. Never recommend a poll to someone whose goal is demonstrating expertise, or a carousel to someone with no time. Note that format performance shifts as the algorithm changes.
B. ENGAGEMENT BEHAVIOR: resharing others' content with no original commentary caps the user's reach and builds little brand. The algorithm rewards original posts plus active, genuine engagement from the user's own account. Treat reshare-instead-of-create as a PRIMARY problem to fix, not a footnote.
C. VOICE AND TONE: infer the user's actual writing voice from their answers, posts, and PDF (sentence length, formality, humor, emoji use, punctuation habits) and mirror it in every hook and every line of copy you write. A reserved academic, a blunt founder, and a formal executive must each receive copy that sounds like them, never one generic LinkedIn register. Begin the content_strategy.content_mix value with one short sentence naming the detected voice (for example, "Your voice: direct, dry, minimal emoji."), then continue with the content mix.
D. CADENCE AND PRESENCE: do NOT apply high-frequency social logic to LinkedIn. The default recommendation is one to two strong original posts per MONTH, each a real considered piece, never filler. Posting more floods followers and trains them to skim past. Redefine consistency for this user: on LinkedIn it means staying present and active, not posting often. On non-publishing weeks, direct them to be active and engage genuinely on relevant people's posts to sustain visibility and build relationships between posts. Scale frequency up modestly ONLY when their goal is urgent and time-boxed, such as a job search or a product launch in the next 30 to 90 days. Do NOT state a magic best-time-to-post; tell them to publish when their audience is active and to learn that from their own analytics.

DIRECTIVE 3, REPLACE GENERIC WISDOM WITH USER-SPECIFIC STRATEGY: advice like "add controversial takes," "end with a question," or "show the messy middle" is only acceptable when tied to a specific observation about THIS user's situation or content. Every recommendation must reference something concrete from their input.

DIRECTIVE 4, CALIBRATE TO GOAL AND SITUATION: a job seeker, a founder, a consultant, and a personal-brand-builder must receive materially different strategies, not the same roadmap reworded. Tie every calendar topic, format, and CTA to the specific outcome this user selected as success.

DIRECTIVE 5, MAKE THE CALENDAR OBEY THE CADENCE PHILOSOPHY: the 30-day calendar must reflect low-frequency publishing. Only the two POST weeks are real publishes; the two ENGAGEMENT weeks must be specific engagement activity that names who to engage with and how. Never output a post-every-week grid that contradicts the cadence advice. No week's topic or action may instruct the user to publish more than once that week, schedule daily or weekly posting, or otherwise contradict the twice-a-month maximum in FOUNDER RULES; ENGAGEMENT weeks describe commenting, replying and connecting, never publishing a post.

DIRECTIVE 6, QUANTIFY EVERY DIAGNOSIS: for every score you assign, name the one or two specific things that cost the points and the single change that would move the number most. Never give a score without a stated reason.

DIRECTIVE 7, BE INTERNALLY CONSISTENT: deliver exactly what you label. If a section says three hooks, give three. Never state a count or a claim you contradict elsewhere in the output.

DURABLE LINKEDIN PRINCIPLES (firm; always reflected in critical_rules):
- Never edit a post after publishing, it suppresses reach.
- Never reshare to amplify someone, comment or react instead. Resharing kills your own reach and builds no brand.
- Complete the profile: every role with descriptions, skills, and dates.
- Professional, industry-relevant photo and banner.
- Tag the people and companies actually referenced in a post.
- Tell personal stories and show your face. People follow YOUR story, not recycled industry news.
- Connect with relevant people via search, especially in the first months.
- Reply to every comment on your own post within the first hour. This is genuine signal, not a quota.
- Three to five targeted hashtags, placed at the end.
- Every post needs a clear CTA tied to its point.
- The first three lines must hook hard enough to earn the "see more" click.

CURRENT ALGORITHM LAYER (volatile, present-day only, state as tendencies the user should verify): right now video reach is being boosted; document and carousel reach is moderate; polls are throttled after overuse. Lean on the durable principles above and use this layer only for the volatile specifics.

PROFILE SCORING RULES, STRICT:
- Scores must be encouraging and realistic, never punishing.
- If you have no information about a section such as the About section, do NOT score it 0; default to about 50 or treat it as unknown.
- A ghost account scores 35 to 45 overall, never 22, never 15.
- A complete profile scores 60 to 75. Someone active and growing scores 75 to 85.
- Pair every sub-score with the reason it is not higher and the single fix that moves it most.

ENGAGEMENT RULES, STRICT:
- FORBIDDEN: daily quotas such as "comment on 3 posts a day", "like 10 posts a day", or "send 10 connection requests".
- FORBIDDEN: "comment on every post you see", that is spam and confuses the algorithm.
- CORRECT: "engage genuinely and thoughtfully with relevant people in your niche", with no numbers.
- CORRECT: replying to comments on your own post within the first hour.

PERSONALIZATION:
- COHORT: every hook, rule, and recommendation speaks directly to a ${cohort||"professional"} in their language and pain points.
- NORTH STAR: their success answer is the goal everything connects back to.
- OBSTACLE: address their specific obstacle directly in the overview with a concrete action plan.
- CONTENT STYLE: match all hooks and examples to their declared style: ${answers.content_style||"storytelling"}.
- SPECIAL NOTE: if provided, it is the highest priority.
${specialNote ? ("HIGHEST PRIORITY for this user, override conflicting general advice: " + specialNote) : ""}

STYLE: American English. NO Oxford comma: write lists as "A, B and C", never "A, B, and C", and do not put a comma before the final and or or in any list. Never use em dashes or long dashes anywhere; use commas, periods, or parentheses instead.

Replace ALL schema values with hyper-specific content for this exact person. Zero generic advice.

HALLUCINATION GUARD, applies to every generation: only reference employers, job titles, schools, and biographical details that appear verbatim in the parsed profile text provided above. Never invent or infer company names, employers, schools, certifications, or metrics. If a relevant detail is absent, use a generic phrase such as 'a past role' instead of naming a company. If no profile text was provided, do not name any specific employer or school. Never state or imply a specific number of customers, clients, deals, users, or followers, and never claim the user already has paying customers, has a certain revenue, or is or is not generating revenue. You were not given the user's revenue or customer count. This applies to every field, including urgency, the diagnosis and closing_message. EVIDENCE MANDATE: this message includes their LinkedIn profile, as a PDF document or text, and when available images of their recent posts. Ground the whole analysis in them. Quote or closely paraphrase their actual headline, About and experience, read the post images and name what each post actually does, its hook, format, length and call to action, and tie every point in the diagnosis to a specific thing you saw. Never give generic best-practice advice that could apply to anyone. If something was not provided, say so plainly instead of inventing it.

HOOKS, the three post_hooks must be structurally distinct from each other: make one a contrarian claim, one a short personal-observation hook, and one a question or a single data point. Never reuse the same template across all three. Never fabricate first-person facts of any kind, no invented anecdotes, results, metrics, follower counts, events, or posting cadences the user did not provide. If you need a concrete example, frame it as a template the user fills in, not as something they already did. Treat the hooks as editable drafts, not copy-paste-ready text.

ARCHETYPE: assign a 2 to 3 word archetype specific to THIS user's answers and cohort. It must fit a ${cohort||"professional"}. Do NOT default to "The Invisible ___" or "The Silent ___" and do not reuse one generic label across different people. Right flavor by cohort: B2B Executive to The Quiet Operator or The Boardroom Voice; Real Estate to The Off-Market Insider or The Local Authority; Startup Founder to The Stealth Builder or The Mission Magnet; Job Seeker to The Hidden Candidate or The Untapped Talent; Consultant or Coach to The Best-Kept Secret or The Underbooked Expert; Thought Leader to The Almost-Heard or The Plateaued Voice. Pick or coin one that matches their specific situation.

HEADLINE FIELD: 'headline' is one plain-English sentence, max 16 words, naming who they are and their single biggest gap. No internal jargon, no SSI pillar names, no phrases like "relationship layer" or "distribution layer". Write it like a sharp peer describing them in a sentence.

HEADLINE REWRITE: 'headline_rewrite' is a ready-to-paste LinkedIn headline for this exact person, in their voice, max 200 characters, using their real role and cohort. Use vertical bars to separate phrases if useful. No fabricated metrics.

ABOUT REWRITE: 'about_rewrite' is a ready-to-paste LinkedIn About section for this exact person, in their voice, 3 to 5 short sentences (about 60 to 120 words). Open with a strong first line, show what they do and who they help, weave in the high-value keywords from the keyword analysis naturally, and end with a clear focus or a line that invites the right people to connect. ${hasPdf ? "Build on what their PDF already says, then sharpen and reposition it, and do not invent facts." : "Base it on their role, cohort, and quiz answers, and do not invent specific facts, metrics, or employers."} Plain text, no markdown, no fabricated metrics.

EXPERIENCE REWRITE: 'experience_rewrite' is a rewritten description for their current or most recent role, ready to paste, in their voice, 2 to 4 short sentences that show impact and scope with strong verbs. ${hasPdf ? "Use the real role and details from their PDF, and reframe for clarity and impact without inventing numbers." : "Base it on their stated role, and keep it concrete without inventing specific numbers or employers."} If they list several roles, rewrite only the most important one as a model they can copy for the rest. No fabricated metrics.

PROFILE FIXES: 'profile_fixes' is a list of exactly 3 short, specific fixes for profile elements OTHER than the headline, About, and experience text, because those already have their own rewrites above. Do NOT tell them to rewrite or write a headline, About, or experience, since that is redundant. Instead pick the 3 highest-impact items from: profile photo, background or cover banner, Featured section, custom profile URL, Skills section order and top pinned skills, recommendations given and received, the Open to or Providing services panel, contact info, and posting or activity consistency. For each fix, name the element and the exact action to take, in one or two sentences. ${hasPdf ? "If the PDF shows an element is already strong, skip it and pick another." : "Base the picks on their role, cohort, and goal."} No fabricated metrics.

NO PLACEHOLDERS: never output square-bracket slots such as [industry], [your city], [company], [metric], [before] or [after] in ANY field. You already know their cohort, title, and answers, so use those real specifics. Where a detail is genuinely unknown, write it as natural prose like "your city", "your main service" or "a recent win", never a bracketed slot.

TIMELINE CONSISTENCY, if the user states a timeframe or deadline anywhere in their answers or note, keep every week reference consistent with it. Either generate a roadmap that spans up to the stated date, or clearly state that it covers the first weeks of a longer runway. Never mix conflicting week counts within one plan.

INTERPRETING USER-REPORTED NUMBERS: When an answer gives a quantity with a plus sign or as a range (for example "5K+ followers", "500-5K followers", or "1-2 hours"), treat it as a RANGE or a MINIMUM, never an exact figure - someone who selects "5K+ followers" may have 10K, 50K or more. Never restate it as an exact number such as "you have 5,000 followers"; say "over 5,000 followers" or "your 5,000+ audience" instead. Never describe their stated follower level or their growth goal as invalid, wrong, or contradictory - having 5,000+ followers and aiming for 10,000+ is a normal, healthy growth goal.

SECTION SOURCES (follow exactly):
- profile_scores and profile_fixes: base these ONLY on the attached profile PDF.${hasPdf ? " Read the headline, About, and experience in the PDF and judge those." : " No PDF was attached, so set profile_scores conservatively from the quiz answers and keep profile_fixes as general best-practice advice for their role; never invent PDF contents."}
- post_hooks (the 3 hooks): ${screenshotCount > 0 ? "base all 3 hooks ONLY on the attached post screenshots - their themes, topics, angles, and the voice shown in those posts. Do NOT take hook topics from the profile PDF or career history." : hasPdf ? "no post screenshots were attached, so base the 3 hooks on the profile PDF, meaning the experience, expertise and positioning shown there." : "no posts or PDF were attached, so base the 3 hooks on their role and what they do from the form plus their quiz answers."}

KEYWORD ANALYSIS (follow exactly): Fill keyword_analysis to help THIS person get found in LinkedIn search.
- target: infer who needs to find them from their cohort, goal, and profile. For a job seeker, the recruiters and hiring managers for their target role; for a thought leader, the audience and algorithm in their niche; for a founder or consultant, their buyers, clients, or investors. State it as a short phrase (for example "Senior Product Marketing Manager roles").
- Build a list of high-value keywords this target actually searches for or that signal authority there: job titles, hard skills, tools, methods, and industry terms. Be specific to their field, not generic.
- present: ${hasPdf ? "the keywords from that list that already appear in the attached profile PDF, across headline, About, experience, or skills. Read the PDF to decide." : "an empty list, because no profile PDF was attached and you cannot verify what is already there."}
- missing: important keywords NOT yet covered that they should add. For each, give keyword, where (the exact place to add it: headline, About, skills, or a named experience entry), and example (one short, natural phrase showing how to weave it into their own voice). ${hasPdf ? "Base present and missing on what the PDF actually contains." : "Without a PDF, base missing on their role and quiz answers, and keep where and example practical."}
- Provide 4 to 6 missing keywords, and 4 to 6 present keywords when a PDF exists. Never invent facts about their background; only suggest keywords that fit what they told you.

NETWORKING (follow exactly): Fill networking with a concrete, ready-to-use outreach or engagement play. Never generic advice like "network more" or "engage with your industry".
- Decide mode from their cohort and goal. If they are looking for a job or a new role, set mode to "outreach". If they are growing an audience, brand, clients, or authority, set mode to "engagement".
- headline: one short line naming the single networking move that will move them forward.
- targets: exactly 3 specific people or account types to focus on, each with who (the role, title, or kind of account, as concrete as their field allows) and action (the exact step to take with them). For outreach use recruiters in their field, hiring managers for their target role, and people already working at their target companies. For engagement use larger voices and accounts in their niche whose audience overlaps theirs.
- connection_message: for outreach, a ready-to-send LinkedIn connection request under 300 characters, warm and specific, no flattery filler. For engagement, a strong sample comment they could leave on a post from a bigger account in their niche to get noticed. Write it in their voice.
- follow_up_message: a short follow-up to send after they connect or after the first interaction, in their voice.
${hasPdf ? "Ground the names and angles in their real role and background from the PDF." : "Base it on their role, cohort, and quiz answers."} No fabricated facts about specific companies or people.

FINAL HARD GUARDS, these override anything above:
1. NUMBERS AND DATES: never state a follower count, connection count, client, customer or deal count, revenue figure, percentage, start year, or any specific number or date that is not present verbatim in their profile. Never write "you have N followers" or a number like "737 followers", and never invent a dated anecdote such as "In 2011 we...". If you lack a real number, describe it qualitatively instead.
2. NAMED ENTITIES: never name a specific person, colleague, company, competitor, product, tool, platform, portal, or regulation in ANY field unless that exact name appears in their profile. This applies especially to critical_rules, content_calendar, growth_tactics and post_hooks. Never claim a keyword, tool, skill, company or regulation is "already present" or "already in your profile" unless you actually saw it in the attached PDF. Never alter the spelling of their company or institute name.
3. READY-TO-PASTE COPY: connection_message, follow_up_message and the three post_hooks must be complete, paste-ready sentences. Never include a bracketed slot like [Name], [specific topic], [company] or [link]. To personalize, say it in plain prose (for example "open with their first name"), never a bracket.
4. CALENDAR LENGTH: content_calendar must contain EXACTLY 4 entries, Week 1 through Week 4, and never more, even if the user mentions a 30, 60, 90 day, or longer timeline. Fold any longer runway into these first 4 weeks.
5. ARCHETYPE ACCURACY: the archetype must be factually true to this person, must never contain the words "Invisible" or "Silent", and must never imply relocation, expatriation, or any status the profile does not support.

SCHEMA:
${schema}`;
}


const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #08080e; }
  *:focus-visible { outline: 2px solid #c8a96e; outline-offset: 2px; border-radius: 4px; }
  .skip-link { position:absolute; left:8px; top:-52px; z-index:1000; background:#c8a96e; color:#0a0a0f; padding:9px 16px; border-radius:8px; font-family:'DM Sans',sans-serif; font-weight:700; font-size:14px; text-decoration:none; transition:top 0.15s ease; }
  .skip-link:focus { top:8px; }
  .page-enter { animation: pageEnter 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes pageEnter { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  .opt-row { display:flex; align-items:center; gap:14px; padding:14px 18px; border-radius:14px; background:#0d0d18; border:1px solid #1a1a2e; cursor:pointer; transition:all 0.2s ease; font-family:'DM Sans',sans-serif; width:100%; text-align:left; }
  .opt-row:hover { border-color:#c8a96e55; background:#0f0f1e; }
  .opt-row.selected { border-color:#c8a96e; background:rgba(200,169,110,0.07); transform:translateX(4px); }
  .primary-btn { width:100%; padding:15px 24px; border:none; border-radius:14px; background:linear-gradient(135deg,#c8a96e,#a07840); color:#08080e; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:all 0.2s; }
  .primary-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 40px rgba(200,169,110,0.25); }
  .primary-btn:disabled { background:#1a1a2e; color:#3a3a5a; cursor:not-allowed; }
  .ghost-btn { width:100%; padding:13px 24px; border:1px solid #1a1a2e; border-radius:14px; background:transparent; color:#9696b4; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s; }
  .ghost-btn:hover { border-color:#2a2a3e; color:#c8c8dc; }
  .tab-pill { padding:7px 16px; border-radius:100px; border:1px solid #1a1a2e; background:transparent; color:#c8c7dd; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; letter-spacing:0.5px; text-transform:uppercase; }
  .tab-pill:hover { border-color:#c8a96e44; color:#8a8a9a; }
  .tab-pill.active { border-color:#c8a96e; background:rgba(200,169,110,0.1); color:#c8a96e; }
  .card-block { background:#0d0d18; border:1px solid #1a1a2e; border-radius:16px; padding:20px; margin-bottom:12px; transition:border-color 0.2s; }
  .card-block:hover { border-color:#2a2a3e; }
  .field-input { width:100%; padding:13px 16px; background:#0d0d18; border:1px solid #1a1a2e; border-radius:12px; color:#e8e8f0; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:border-color 0.2s; }
  .field-input:focus { border-color:#c8a96e88; }
  .field-input.error { border-color:#ef444488; }
  .field-input::placeholder { color:#2a2a4a; }
  .progress-bar { height:4px; background:#1a1a2e; border-radius:4px; overflow:hidden; }
  .progress-fill { height:100%; background:linear-gradient(90deg,#c8a96e,#e8c98e); border-radius:4px; transition:width 0.5s ease; }
  .analysis-dot { animation:dotPulse 1.4s infinite; }
  @keyframes dotPulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .gold-rule { width:40px; height:1px; background:linear-gradient(90deg,transparent,#c8a96e,transparent); margin:0 auto 24px; }
  .section-reveal { animation:pageEnter 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
  .score-bar-fill { transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
  .pdf-drop { border:1.5px dashed #2a2a3e; border-radius:16px; padding:32px 20px; text-align:center; cursor:pointer; transition:all 0.2s; background:#0d0d18; }
  .pdf-drop:hover, .pdf-drop.dragover { border-color:#c8a96e; background:rgba(200,169,110,0.04); }
  .tab-tooltip { display:none; }
  .tab-tooltip-wrap:hover .tab-tooltip { display:block; }
  .week-card { background:#0d0d18; border:1px solid #1a1a2e; border-radius:14px; padding:18px; margin-bottom:10px; position:relative; overflow:hidden; }
  .week-card.post { border-left:3px solid #c8a96e; }
  .week-card.engagement { border-left:3px solid #3a6a4a; }
`;

function Footer() {
  const { t, locale } = useLocale();
  const base = locale === "en" ? "" : "/" + locale; // localized legal pages live under /<locale>/
  const lk = { color:"#9696b4", textDecoration:"none", fontSize:12 };
  return (
    <footer style={{ marginTop:34, paddingTop:18, borderTop:"1px solid #16162a", display:"flex", flexWrap:"wrap", gap:"6px 16px", alignItems:"center", justifyContent:"center" }}>
      <a href="/imprint.html" style={lk}>{t("legal_imprint")}</a>
      <a href={`${base}/privacy.html`} style={lk}>{t("legal_privacy")}</a>
      <a href={`${base}/cookies.html`} style={lk}>{t("legal_cookies")}</a>
      <a href={`${base}/terms.html`} style={lk}>{t("legal_terms")}</a>
      <button onClick={openCookieSettings} style={{ ...lk, background:"transparent", border:"none", cursor:"pointer", padding:0 }}>{t("cc_settings")}</button>
      <span style={{ color:"#56566f", fontSize:12 }}>© 2026 LinkedScore</span>
    </footer>
  );
}

function Layout({ children }) {
  return (
    <div style={{ minHeight:"100vh", background:"#08080e", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", position:"relative", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <a href="#ls-main" className="skip-link">Skip to main content</a>
      <div style={{ position:"fixed", top:"-15%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-20%", left:"-10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(100,80,180,0.05) 0%, transparent 65%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:540, position:"relative", zIndex:2 }}>
        <main id="ls-main">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

function LangSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <button onClick={()=>setOpen(o=>!o)} aria-label="Language" aria-haspopup="listbox"
        style={{ display:"flex", alignItems:"center", gap:7, border:"1px solid #c8a96e55", borderRadius:9, padding:"6px 11px", background:"transparent", color:"#c8a96e", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg>
        {locale.toUpperCase()}
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, zIndex:40 }} />
          <div role="listbox" style={{ position:"absolute", right:0, top:"calc(100% + 6px)", width:200, background:"#0d0d18", border:"1px solid #20202f", borderRadius:12, padding:6, boxShadow:"0 16px 40px rgba(0,0,0,0.5)", zIndex:50 }}>
            {LOCALES.map(l => (
              <button key={l.code} role="option" aria-selected={l.code===locale} onClick={()=>{ setLocale(l.code); setOpen(false); try { if (!/^\/plan\//.test(window.location.pathname)) window.history.replaceState({}, "", l.code === "en" ? "/" : "/" + l.code + "/"); } catch (e) {} }}
                style={{ display:"flex", width:"100%", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:8, border:"none", background: l.code===locale ? "rgba(200,169,110,0.1)" : "transparent", color: l.code===locale ? "#c8a96e" : "#9696b4", fontSize:14, fontWeight: l.code===locale?600:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
                {l.name}{l.code===locale && <span style={{ color:"#c8a96e" }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Logo({ onHome }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
      <a href="/" aria-label="Back to home" title="Back to home"
        onClick={e=>{ if (onHome) { e.preventDefault(); onHome(); } }}
        style={{ display:"inline-flex", cursor:"pointer" }}>
        <img src={LOGO_URL} alt="Linkedscore" style={{ height:38, objectFit:"contain" }} />
      </a>
      <LangSwitcher />
    </div>
  );
}

function CopyBtn({ text, label }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(()=>setCopied(false), 1600);
    } catch (e) {}
  };
  return (
    <button onClick={copy} style={{ background:"transparent", border:"1px solid #c8a96e44", color:copied?"#56c08a":"#c8a96e", borderRadius:8, padding:"3px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
      {copied ? t("copied") : (label || t("copy"))}
    </button>
  );
}

function Badge({ children, color="#c8a96e" }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${color}12`, color, border:`1px solid ${color}30`, borderRadius:100, padding:"5px 14px", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:20 }}>
      {children}
    </div>
  );
}

// Clipboard with a legacy fallback for browsers without the async clipboard API.
function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  } catch (e) { /* fall through */ }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta); resolve();
    } catch (e) { reject(e); }
  });
}

const LinkedInGlyph = ({ size = 15, fill = "#08080e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
);

// Owner-only: turn a finished plan into a shareable LinkedScore card. The link
// (/plan/:id) already unfurls a personalized OG image; this is the trigger.
function ShareBar({ planId, score, archetype, t }) {
  const url = "https://www.linkedscore.app/plan/" + planId;
  const caption = t("share_caption", { score: score, archetype: archetype });
  const [copied, setCopied] = useState(false);
  const [capCopied, setCapCopied] = useState(false);
  const [liHint, setLiHint] = useState(false);
  const flash = (set) => { set(true); setTimeout(() => set(false), 2200); };
  const track = (via) => { try { if (window.posthog && window.posthog.capture) window.posthog.capture("plan_shared", { via: via }); } catch (e) {} };
  const shareLinkedIn = () => {
    copyText(caption).then(() => flash(setLiHint)).catch(() => {});
    track("linkedin");
    window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url), "_blank", "noopener,noreferrer");
  };
  return (
    <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:16, marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div style={{ minWidth:0 }}>
          <p style={{ color:"#F9FAFB", fontSize:14, fontWeight:700, marginBottom:2 }}>{t("share_title")}</p>
          <p style={{ color:"#8a8aa6", fontSize:12 }}>{t("share_sub")}</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={shareLinkedIn} style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#c8a96e,#a07840)", color:"#08080e", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            <LinkedInGlyph /> {t("share_linkedin")}
          </button>
          <button onClick={()=>{ copyText(url).then(()=>flash(setCopied)).catch(()=>{}); track("copy"); }} style={{ background:"transparent", color:"#c8a96e", border:"1px solid #c8a96e", borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            {copied ? t("share_copied") : t("share_copy")}
          </button>
        </div>
      </div>
      {liHint && <p style={{ color:"#56c08a", fontSize:12, marginTop:10, fontWeight:600 }}>{t("share_li_hint")}</p>}
      <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10, borderTop:"1px solid #1a1a2e", paddingTop:12 }}>
        <p style={{ color:"#7a7a96", fontSize:12, flex:1, lineHeight:1.5, fontStyle:"italic" }}>{caption}</p>
        <button onClick={()=>{ copyText(caption).then(()=>flash(setCapCopied)).catch(()=>{}); }} style={{ background:"transparent", color:"#8a8aa6", border:"1px solid #2a2a3e", borderRadius:8, padding:"7px 12px", fontWeight:600, fontSize:12, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>
          {capCopied ? t("share_copied") : t("share_caption_copy")}
        </button>
      </div>
    </div>
  );
}

// Smart default for the share-card gender variant: a curated set of common female
// first names across our 7 locales (plus a few Arabic/Persian). Unknown -> "m",
// and the user can always flip it with the on-card toggle, so a miss is harmless.
const FEMALE_NAMES = new Set(["mary","patricia","jennifer","linda","elizabeth","barbara","susan","jessica","sarah","karen","nancy","lisa","betty","margaret","sandra","ashley","kimberly","emily","donna","michelle","carol","amanda","melissa","deborah","stephanie","laura","rebecca","sharon","cynthia","kathryn","kathleen","helen","amy","anna","anne","angela","ruth","julie","emma","olivia","sophia","isabella","mia","charlotte","amelia","grace","chloe","hannah","claire","alice","lucy","ella","maria","marta","martha","sofia","lucia","carmen","elena","laura","paula","sara","ana","isabel","cristina","valentina","camila","julia","marie","camille","manon","léa","lea","chloé","emma","jeanne","nathalie","sylvie","catherine","isabelle","sophie","celine","céline","aurelie","aurélie","heike","petra","sabine","andrea","claudia","stefanie","nicole","katja","birgit","ursula","ingrid","monika","gabriele","brigitte","franziska","lena","hanna","greta"," inge","giulia","francesca","chiara","sara","martina","alessia","federica","valentina","beatrice","aurora","ginevra","emma","mariana","beatriz","ines","inês","catarina","carolina","leonor","matilde","sanne","fenna","saar","julia","emma","sophie","lieke","femke","anouk","eva","noa","sara","laura","fatima","fatemeh","zahra","maryam","leila","layla","aisha","yasmin","nour","sara","mina","parisa","shirin","negar","aida","tahmineh"]);
function guessGender(name) {
  const f = String(name || "").trim().toLowerCase().split(/\s+/)[0].replace(/[^a-zà-ÿ]/g, "");
  return FEMALE_NAMES.has(f) ? "f" : "m";
}

// Single source of truth for the archetype name shown to the user: the curated card
// archetype for their cohort + score tier, in the right locale and gender. Used for
// BOTH the report headline and the share card so they always match (the free-form AI
// archetype is no longer displayed).
function fixedArchetype(cohort, score, locale, name) {
  const nn = cardIdFor(cohort, score);
  if (!nn) return null;
  const loc = (SHARE_I18N[locale] && SHARE_I18N[locale][nn]) ? locale : "en";
  const g = GENDERED_LOCALES.indexOf(loc) !== -1 ? guessGender(name) : "m";
  const e = SHARE_I18N[loc][nn] && SHARE_I18N[loc][nn][g];
  return e ? e.title : null;
}

// Native file-share is real on mobile (opens the OS share sheet with the image) but a
// no-op on desktop, so we only show the "Share to LinkedIn" button where it works.
const CAN_NATIVE_SHARE = (() => {
  try { return typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [new File([""], "x.jpg", { type: "image/jpeg" })] }); }
  catch (e) { return false; }
})();

// Viral share: a pre-rendered archetype card (cohort x hidden score tier) the user
// posts NATIVELY on LinkedIn (image + pasted caption). Localized by app locale and
// by gender (masculine/feminine variants for de/fr/es/pt/it), with a manual toggle.
function ShareCardSection({ cohort, score, name }) {
  const { t, locale } = useLocale();
  const nn = cardIdFor(cohort, score);
  const card = nn ? SHARE_CARDS[nn] : null;
  const [gender, setGender] = useState(() => guessGender(name));
  const [vi, setVi] = useState(0);
  const [personal, setPersonal] = useState("");
  const [copied, setCopied] = useState(false);
  const [dl, setDl] = useState(false);
  if (!card) return null;
  const loc = (SHARE_I18N[locale] && SHARE_I18N[locale][nn]) ? locale : "en";
  const gendered = GENDERED_LOCALES.indexOf(loc) !== -1;
  const g = gendered ? gender : "m";
  const entry = (SHARE_I18N[loc][nn] && SHARE_I18N[loc][nn][g]) || SHARE_I18N.en[nn].m;
  const title = entry.title;
  const captions = entry.captions;
  const imgPath = gendered
    ? "/share-cards/" + loc + "/" + g + "/" + nn + "-" + card.slug + ".jpg"
    : "/share-cards/" + loc + "/" + nn + "-" + card.slug + ".jpg";
  const caption = (personal.trim() ? personal.trim() + "\n\n" : "") + captions[vi % captions.length];
  const ev = (n2) => { try { if (window.posthog && window.posthog.capture) window.posthog.capture(n2, { card: nn, locale: loc, gender: g }); } catch (e) {} };
  const flash = (set) => { set(true); setTimeout(() => set(false), 2200); };

  const copyCaption = () => { copyText(caption).then(()=>flash(setCopied)).catch(()=>{}); ev("share_caption_copied"); };

  const downloadImage = async () => {
    ev("share_image_downloaded");
    try {
      const res = await fetch(imgPath); const blob = await res.blob();
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = "linkedscore-" + card.slug + ".jpg";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url), 4000); flash(setDl);
    } catch (e) { window.open(imgPath, "_blank", "noopener"); }
  };

  const shareNow = async () => {
    ev("share_clicked");
    try {
      const res = await fetch(imgPath); const blob = await res.blob();
      const file = new File([blob], "linkedscore-" + card.slug + ".jpg", { type:"image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files:[file] })) {
        await navigator.share({ files:[file], text: caption });
        return;
      }
    } catch (e) { if (e && e.name === "AbortError") return; }
    copyText(caption).catch(()=>{});
    window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:20, marginBottom:20 }}>
      <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{t("sc_kicker")}</p>
      <h3 style={{ color:"#F9FAFB", fontSize:18, fontWeight:800, margin:"0 0 14px", lineHeight:1.3 }}>
        {t("sc_heading_pre")}<span style={{ color:"#c8a96e" }}>{title}</span>{t("sc_heading_post")}
      </h3>

      {gendered && (
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[["m","♂ "+t("sc_male")],["f","♀ "+t("sc_female")]].map(([gg,lbl])=>(
            <button key={gg} onClick={()=>setGender(gg)} aria-pressed={g===gg}
              style={{ background: g===gg ? "#c8a96e" : "transparent", color: g===gg ? "#08080e" : "#8a8aa6", border:"1px solid "+(g===gg?"#c8a96e":"#2a2a3e"), borderRadius:8, padding:"5px 13px", fontWeight:700, fontSize:12.5, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      <img src={imgPath} alt={title + " share card"} loading="lazy"
        style={{ width:"100%", display:"block", borderRadius:12, border:"1px solid #20202f", marginBottom:14 }} />

      <div style={{ display:"flex", gap:8, background:"rgba(200,169,110,0.07)", border:"1px solid #c8a96e33", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
        <span style={{ fontSize:14, lineHeight:1.2 }}>📌</span>
        <p style={{ color:"#c8c7dd", fontSize:12.5, lineHeight:1.55, margin:0 }}>
          {t("sc_instruction")}
        </p>
      </div>

      <input value={personal} onChange={e=>setPersonal(e.target.value)} maxLength={140}
        placeholder={t("sc_personal_ph")}
        style={{ width:"100%", boxSizing:"border-box", background:"#08080e", border:"1px solid #20202f", borderRadius:10, padding:"11px 13px", color:"#F9FAFB", fontSize:13, marginBottom:10, fontFamily:"'DM Sans',sans-serif" }} />

      <div style={{ background:"#08080e", border:"1px solid #1a1a2e", borderRadius:10, padding:"13px 14px", marginBottom:10 }}>
        <p style={{ color:"#d8d7e8", fontSize:13, lineHeight:1.65, margin:0, whiteSpace:"pre-wrap" }}>{caption}</p>
      </div>

      <button onClick={()=>setVi((vi+1)%captions.length)} style={{ background:"transparent", border:"none", color:"#8a8aa6", fontSize:12, fontWeight:600, cursor:"pointer", padding:"2px 0", marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>
        ↻ {t("sc_try")} ({(vi%captions.length)+1}/{captions.length})
      </button>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {CAN_NATIVE_SHARE && (
        <button onClick={shareNow} style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#c8a96e,#a07840)", color:"#08080e", border:"none", borderRadius:10, padding:"11px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          <LinkedInGlyph /> {t("share_linkedin")}
        </button>
        )}
        <button onClick={downloadImage} style={{ background:"transparent", color:"#c8a96e", border:"1px solid #c8a96e", borderRadius:10, padding:"11px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          {dl ? t("sc_saved")+" ✓" : t("sc_download")}
        </button>
        <button onClick={copyCaption} style={{ background:"transparent", color:"#8a8aa6", border:"1px solid #2a2a3e", borderRadius:10, padding:"11px 16px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          {copied ? t("share_copied") : t("share_caption_copy")}
        </button>
      </div>
    </div>
  );
}

function ScoreRing({ score, color="#c8a96e" }) {
  const r = 36; const c = 2 * Math.PI * r;
  const gradId = `grad_${color.replace('#','')}`;
  return (
    <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
      <svg width={80} height={80} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="#1a1a2e" strokeWidth={5} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color, fontSize:20, fontWeight:800 }}>{score}</div>
    </div>
  );
}

export default function App() {
  const { t, locale, setLocale } = useLocale();
  // On a shared /plan/<uuid> link, start in a neutral loading state so the
  // prerendered landing never flashes before the plan resolves.
  const [phase, setPhase] = useState(() => {
    try { return /^\/plan\/[a-f0-9-]{36}$/.test(window.location.pathname) ? "loading" : "intro"; }
    catch (e) { return "intro"; }
  });
  const [userData, setUserData] = useState({ firstName:"", lastName:"", age:"", jobTitle:"", linkedinUrl:"" });
  const [formErrors, setFormErrors] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [pdfText, setPdfText] = useState("");
  const [planId, setPlanId] = useState(null);
  const [teaser, setTeaser] = useState(null); // {archetype, profileOverall, ssiTotal, tlAvailable, tlScore} for the email gate
  const [sharedView, setSharedView] = useState(false);
  const [cohort, setCohort] = useState(null);
  const planRef = useRef(null);
  const [specialNote, setSpecialNote] = useState("");
  const [otherText, setOtherText] = useState("");
  const [multiSelected, setMultiSelected] = useState([]);
  const [quizPhase, setQuizPhase] = useState("generic"); // "generic" | "cohort" | "note"
  const [pdfName, setPdfName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [genError, setGenError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [postScreenshots, setPostScreenshots] = useState([null, null, null]);
  const [noPostsYet, setNoPostsYet] = useState(false);
  const [revCurrency, setRevCurrency] = useState("");
  const [revValue, setRevValue] = useState("");
  const [revPeriod, setRevPeriod] = useState("per_year");
  const [revTarget, setRevTarget] = useState("");
  const [founderHasRevenue, setFounderHasRevenue] = useState(null);
  const [founderUnlock, setFounderUnlock] = useState("");
  const [revChannelShare, setRevChannelShare] = useState("0.3");
  const postRefs = [useRef(null), useRef(null), useRef(null)];
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check if URL has a plan ID e.g. linkedscore.app/plan/UUID
    const path = window.location.pathname;
    const match = path.match(/^\/plan\/([a-f0-9-]{36})$/);
    if (match) {
      const id = match[1];
      const loadPlan = async () => {
        try {
          const res = await fetch("/api/load-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: id })
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.plan) {
            const p = data.plan;
            // Ensure all required fields exist with fallbacks; explicit nulls in
            // stored plan_data must not defeat the defaults, so spread p first
            const safePlan = {
              ...p,
              score: p.score || 50,
              archetype: p.archetype || "LinkedIn Professional",
              headline: p.headline || "",
              urgency: p.urgency || "",
              profile_scores: p.profile_scores || { headline: 50, about: 50, experience: 50, overall: 50 },
              profile_fixes: p.profile_fixes || [],
              keyword_analysis: p.keyword_analysis || { target: "", present: [], missing: [] },
              content_strategy: p.content_strategy || {},
              post_hooks: p.post_hooks || [],
              content_calendar: p.content_calendar || [],
              critical_rules: p.critical_rules || [],
              growth_tactics: p.growth_tactics || [],
              networking: p.networking || { mode: "", headline: "", targets: [], connection_message: "", follow_up_message: "" },
              closing_message: p.closing_message || "",
              thought_leader: p.thought_leader || { available: false, score: 0, hook_score: 0, engagement_score: 0, voice_score: 0, structure_score: 0, analysis: "", improvements: [] }
            };
            // Match the result chrome to the language the plan was generated in,
            // so a shared plan never shows (e.g.) German tabs around English text.
            if (p && typeof p._locale === "string" && p._locale) { try { setLocale(p._locale); } catch (e) {} }
            setPlan(finalizePlan(safePlan, undefined, (p && p._locale) || "en"));
            setUserData(d => ({ ...d, firstName: data.first_name || "there" }));
            setSharedView(true);
            setPlanId(id);
            setPhase("result");
          } else {
            setPhase("plan_missing");
          }
        } catch(e) { setPhase("plan_missing"); }
      };
      loadPlan();
    }
  }, []);

  // ── LANDING PAGE: animations + CTA wiring (intro phase only) ──
  useEffect(() => {
    if (phase !== "intro") return;
    const root = document.querySelector(".ls-home");
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const prevSB = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    document.body.style.background = "#08080e";

    const start = () => { track("funnel_started"); setPhase(cohort ? "form" : "cohort"); };
    const ctas = Array.from(root.querySelectorAll(".btn-gold"));
    ctas.forEach(b => b.addEventListener("click", start));

    const observers = [];
    const fireHero = () => root.querySelectorAll(".hero .reveal").forEach(el => el.classList.add("in"));
    if (!reduce) {
      const targets = root.querySelectorAll(".sec-head, .step, .feat, .founder, .final .wrap > *");
      targets.forEach(el => el.classList.add("reveal"));
      // Mark the above-the-fold hero visible, THEN enable animations, so the
      // prerendered content never flashes hidden when .anim turns on.
      fireHero();
      root.classList.add("anim");
      const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
      targets.forEach(el => rio.observe(el));
      observers.push(rio);
    } else { fireHero(); }

    const arc = root.querySelector("#arc"), num = root.querySelector("#score"), gaugeEl = root.querySelector(".gauge");
    if (arc && num && gaugeEl) {
      const target = 38, arcLen = 377;
      const runGauge = () => {
        if (reduce) { arc.style.strokeDashoffset = arcLen * (1 - target / 100); num.textContent = target; return; }
        arc.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)";
        requestAnimationFrame(() => { arc.style.strokeDashoffset = arcLen * (1 - target / 100); });
        let t0 = null;
        const step = ts => { if (!t0) t0 = ts; const p = Math.min((ts - t0) / 1300, 1); num.textContent = Math.round(p * target); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      };
      const gio = new IntersectionObserver(e => { if (e[0].isIntersecting) { runGauge(); gio.disconnect(); } }, { threshold: 0.4 });
      gio.observe(gaugeEl);
      observers.push(gio);
    }

    return () => {
      ctas.forEach(b => b.removeEventListener("click", start));
      observers.forEach(o => o.disconnect());
      document.documentElement.style.scrollBehavior = prevSB;
    };
  }, [phase, cohort]);

  // ── Resume an in-progress analysis ────────────────────────────────────────
  // Funnel progress is saved in localStorage so someone who steps away can come
  // back later and pick up where they left off. We NEVER auto-advance into the
  // quiz on load — doing so silently hid the landing from returning visitors.
  // Instead we surface an explicit "Continue your analysis" button on the
  // landing and only resume when they choose to. PDF/screenshots aren't saved.
  const [savedProgress, setSavedProgress] = useState(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  useEffect(() => {
    if (/^\/plan\//.test(window.location.pathname)) return; // shared link wins
    let snap;
    try { snap = JSON.parse(localStorage.getItem("ls_funnel_v1") || "null"); } catch (e) { snap = null; }
    if (!snap || !snap.phase) return;
    if (Date.now() - (snap.ts || 0) > 7 * 24 * 60 * 60 * 1000) { try { localStorage.removeItem("ls_funnel_v1"); } catch (e) {} return; }
    let target = snap.phase;
    if (target === "analyzing" || target === "generating") target = snap.planId ? "paywall" : "post_screenshots";
    const RESTORABLE = ["cohort", "form", "pdf_upload", "quiz", "note", "revenue", "post_screenshots", "paywall"];
    if (!RESTORABLE.includes(target)) return;
    setSavedProgress({ ...snap, target }); // offer resume; do NOT auto-advance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply a saved snapshot only when the visitor clicks "Continue your analysis".
  const resumeFunnel = () => {
    const snap = savedProgress;
    if (!snap) return;
    if (snap.userData) setUserData(snap.userData);
    if (snap.cohort) setCohort(snap.cohort);
    if (snap.answers) setAnswers(snap.answers);
    if (typeof snap.currentQ === "number") setCurrentQ(snap.currentQ);
    if (snap.specialNote) setSpecialNote(snap.specialNote);
    if (snap.revCurrency) setRevCurrency(snap.revCurrency);
    if (snap.revValue) setRevValue(snap.revValue);
    if (snap.revPeriod) setRevPeriod(snap.revPeriod);
    if (snap.revTarget) setRevTarget(snap.revTarget);
    if (snap.founderHasRevenue) setFounderHasRevenue(snap.founderHasRevenue);
    if (snap.founderUnlock) setFounderUnlock(snap.founderUnlock);
    if (snap.revChannelShare) setRevChannelShare(snap.revChannelShare);
    if (snap.noPostsYet) setNoPostsYet(snap.noPostsYet);
    if (snap.planId) { setPlanId(snap.planId); planRef.current = snap.planId; }
    if (snap.target === "quiz") {
      const qs = getQuestionsForCohort(snap.cohort);
      const qq = qs[snap.currentQ];
      restoreSelection(qq, qq ? (snap.answers || {})[qq.id] : null);
    }
    setSavedProgress(null);
    setPhase(snap.target);
  };

  useEffect(() => {
    if (phase === "intro" || phase === "result" || phase === "plan_missing") {
      if (phase === "result") { try { localStorage.removeItem("ls_funnel_v1"); } catch (e) {} }
      return;
    }
    try {
      localStorage.setItem("ls_funnel_v1", JSON.stringify({
        ts: Date.now(), phase, cohort, userData, answers, currentQ, specialNote,
        revCurrency, revValue, revPeriod, revTarget, founderHasRevenue, founderUnlock, revChannelShare, noPostsYet, planId,
      }));
    } catch (e) {}
  }, [phase, cohort, userData, answers, currentQ, specialNote, revCurrency, revValue, revPeriod, revTarget, founderHasRevenue, founderUnlock, revChannelShare, noPostsYet, planId]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    let step = 0, elapsed = 0, cancelled = false;
    const timeouts = [], intervals = [];
    const later = (fn, ms) => { timeouts.push(setTimeout(fn, ms)); };
    const total = ANALYSIS_STEPS.reduce((s,a)=>s+a.duration,0);
    const run = () => {
      if (cancelled) return;
      // Generation failed: surface it with a retry path instead of the paywall
      if (planRef.current && planRef.current._error) {
        const msg = planRef.current._error;
        planRef.current = null;
        setGenError(msg);
        setPhase("post_screenshots");
        return;
      }
      // If plan is ready, go to paywall immediately
      if (planRef.current) { later(()=>setPhase("paywall"), 500); return; }
      // If we've finished all steps but plan not ready yet, stay on last step and pulse
      if (step >= ANALYSIS_STEPS.length) {
        setAnalysisStep(ANALYSIS_STEPS.length - 1);
        later(run, 800);
        return;
      }
      setAnalysisStep(step);
      const dur = ANALYSIS_STEPS[step].duration;
      elapsed += dur;
      const targetPct = Math.min(90, Math.round((elapsed/total)*100));
      const iv = setInterval(()=>setAnalysisProgress(p => Math.min(targetPct, p+1)),40);
      intervals.push(iv);
      later(()=>{ clearInterval(iv); step++; run(); }, dur);
    };
    setAnalysisStep(0);
    setAnalysisProgress(0);
    run();
    return () => { cancelled = true; timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, [phase]);

  const validate = () => {
    const e = {};
    if (!userData.firstName.trim()) e.firstName = "Required";
    if (!userData.lastName.trim()) e.lastName = "Required";
    if (!userData.age || isNaN(userData.age) || userData.age<16||userData.age>80) e.age = "Invalid";
    if (!userData.jobTitle.trim()) e.jobTitle = "Required";
    if (!userData.linkedinUrl.trim()||!userData.linkedinUrl.toLowerCase().includes("linkedin.com/in/")) e.linkedinUrl = "Enter your LinkedIn profile URL (linkedin.com/in/...)";
    setFormErrors(e);
    return Object.keys(e).length===0;
  };

  const QUESTIONS = localizeQuestions(getQuestionsForCohort(cohort), locale, cohort);
  const q = QUESTIONS[currentQ];

  // Multi-select answers are stored joined with " | " — labels contain commas,
  // so a comma join can't be split back apart safely.
  const SEP = " | ";
  const restoreSelection = (qq, pv) => {
    if (!qq) { setSelected(null); setMultiSelected([]); setOtherText(""); return; }
    if (qq.multiSelect) {
      const parts = pv ? pv.split(SEP) : [];
      const other = parts.find(x => x.startsWith("Other: "));
      setMultiSelected(parts.map(x => x.startsWith("Other: ") ? "Other / Something else" : x));
      setOtherText(other ? other.slice(7) : "");
      setSelected(null);
    } else {
      if (pv && pv.startsWith("Other: ")) { setSelected("Other / Something else"); setOtherText(pv.slice(7)); }
      else { setSelected(pv || null); setOtherText(""); }
      setMultiSelected([]);
    }
  };

  const handleNext = () => {
    if (q.multiSelect ? multiSelected.length === 0 : !selected) return;
    // Read otherText from DOM directly in case React state is stale
    const otherInputEl = document.querySelector('textarea[data-other-input]');
    const currentOtherText = otherInputEl?.value || otherText;

    let finalAnswer;
    if (q.multiSelect) {
      const hasOther = multiSelected.includes("Other / Something else");
      const others = multiSelected.filter(x => x !== "Other / Something else");
      finalAnswer = hasOther && currentOtherText.trim()
        ? [...others, `Other: ${currentOtherText.trim()}`].join(SEP)
        : multiSelected.join(SEP);
    } else {
      finalAnswer = selected === "Other / Something else" && currentOtherText.trim()
        ? `Other: ${currentOtherText.trim()}`
        : selected;
    }
    setAnswers({...answers, [q.id]:finalAnswer});
    // Capture free-text "Other" answers for review (best-effort, never blocks).
    const isOther = q.multiSelect ? multiSelected.includes("Other / Something else") : selected === "Other / Something else";
    if (isOther && currentOtherText.trim()) {
      try { fetch("/api/log-other", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ cohort, question_id: q.id, user_text: currentOtherText.trim(), locale }) }); } catch (e) {}
    }
    setSelected(null); setOtherText(""); setMultiSelected([]);
    const nextQ = currentQ + 1;
    if (nextQ < QUESTIONS.length) setCurrentQ(nextQ);
    else { track("quiz_completed"); setPhase("note"); }
  };

  const handlePrev = () => { const p = currentQ - 1; if (p < 0) { setPhase("pdf_upload"); setSelected(null); setMultiSelected([]); setOtherText(""); return; } restoreSelection(QUESTIONS[p], answers[QUESTIONS[p].id]); setCurrentQ(p); };
  const goToQuestion = (i) => { if (i === currentQ) return; const qq = QUESTIONS[i]; if (!qq || answers[qq.id] == null) return; restoreSelection(qq, answers[qq.id]); setCurrentQ(i); };
  const goToPhase = (target) => { if (target === "quiz") { const qq = QUESTIONS[currentQ]; restoreSelection(qq, qq ? answers[qq.id] : null); } else { setSelected(null); setMultiSelected([]); setOtherText(""); } setPhase(target); };
  const renderStepRail = (current) => { const STEPS = [["cohort",t("rail_category")],["form",t("rail_about")],["pdf_upload",t("rail_profile")],["quiz",t("rail_questions")],["post_screenshots",t("rail_posts")]]; const ci = STEPS.findIndex(function(s){ return s[0] === current; }); return (<div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>{STEPS.map(function(s, i){ var isCur = i === ci; var reached = i < ci; return (<button key={s[0]} onClick={function(){ if (reached) goToPhase(s[0]); }} disabled={!reached && !isCur} style={{ fontSize:11, fontWeight:600, padding:"5px 10px", borderRadius:8, border: isCur ? "1px solid #c8a96e" : (reached ? "1px solid #4a4a6a" : "1px solid #22223a"), background: isCur ? "#c8a96e" : "transparent", color: isCur ? "#0a0a0f" : (reached ? "#c8a96e" : "#44445a"), cursor: reached ? "pointer" : "default", whiteSpace:"nowrap" }}>{s[1]}</button>); })}</div>); };
  // Compress image to reduce payload size, with fallback to original
  const compressImage = (base64, mimeType, maxSide = 800, quality = 0.7) => new Promise(resolve => {
    try {
      const img = new Image();
      const timeout = setTimeout(() => resolve({ base64, type: mimeType }), 5000); // fallback after 5s
      img.onload = () => {
        clearTimeout(timeout);
        try {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', quality).split(',')[1];
          resolve({ base64: compressed, type: 'image/jpeg' });
        } catch(e) { resolve({ base64, type: mimeType }); }
      };
      img.onerror = () => { clearTimeout(timeout); resolve({ base64, type: mimeType }); };
      img.src = `data:${mimeType};base64,${base64}`;
    } catch(e) { resolve({ base64, type: mimeType }); }
  });

  const callAPI = async (user, ans, profile, screenshots, cohort=null, specialNote="") => {
    const validScreenshots = screenshots.filter(s => s !== null);
    const messageContent = [];

    // Add PDF as document if available
    if (profile && profile.startsWith("PDF_BASE64:")) {
      const base64 = profile.replace("PDF_BASE64:", "");
      messageContent.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } });
    }

    // NOTE: Screenshots removed from main call to avoid 60s timeout
    // Thought Leader score is estimated from quiz answers instead
    // Screenshots kept for future enhancement

    const profileText = (profile && !profile.startsWith("PDF_BASE64:")) ? profile : "";
    messageContent.push({ type:"text", text:buildPrompt(user, ans, profileText, validScreenshots.length, cohort, specialNote, !!(profile && profile.startsWith("PDF_BASE64:")), locale) }); var imgBudget = 2500000; validScreenshots.forEach(function(sc){ var p = (sc && sc.preview) ? sc.preview : ""; if (p.indexOf("data:") === 0 && p.indexOf(";base64,") !== -1) { var mt = p.substring(5, p.indexOf(";base64,")); var d = p.substring(p.indexOf(";base64,") + 8); if (mt && d && d.length <= imgBudget) { messageContent.push({ type:"image", source:{ type:"base64", media_type:mt, data:d } }); imgBudget = imgBudget - d.length; } } });
    // Prefix JSON
    messageContent.push({ type:"text", text:"Respond with only raw JSON starting with {" });

    const payloadSize = JSON.stringify(messageContent).length;
    console.log(`[api] Payload: ${(payloadSize/1024).toFixed(1)}KB`);

    const res = await fetch("/api/generate-plan", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ messages:[{ role:"user", content:messageContent }] }),
    });
    if (!res.ok) { const d=await res.json().catch(()=>({})); throw new Error(d?.error||`HTTP ${res.status}`); }
    const data = await res.json();
    // Server sends { text: "{...json with prefill prepended...}" }
    if (!data.planId) throw new Error('Analysis response was malformed. Please try again.');
    if (data.teaser) setTeaser(data.teaser); // scores + archetype for the email gate
    return data.planId;
  };

  const handlePaywall = async () => {
    if (loading) return;
    if (!email.includes("@")||!email.includes(".")) { setEmailError("Please enter a valid email"); return; }
    setEmailError(""); setLoading(true);
    try {
      // Plan was already fetched during animation, wait for it if not ready
      let pid = planRef.current;
      if (!pid) {
        pid = await new Promise((resolve, reject) => {
          const start = Date.now();
          const check = setInterval(() => {
            if (planRef.current) { clearInterval(check); resolve(planRef.current); }
            else if (Date.now() - start > 120000) { clearInterval(check); reject(new Error("Analysis is taking longer than expected. Please try again.")); }
          }, 300);
        });
      }
      if (pid && pid._error) throw new Error(pid._error);
      const gateRes = await fetch("/api/get-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: pid, email: email })
      });
      if (!gateRes.ok) { const gd = await gateRes.json().catch(()=>({})); throw new Error((gd && gd.error) || ("HTTP " + gateRes.status)); }
      const gateData = await gateRes.json();
      const result = gateData.plan;
      if (!result) throw new Error("Could not load your plan. Please try again.");
      result.critical_rules = FOUNDER_RULES;
      const revInputs = { cohort: cohort, value: revValue, target: revTarget, currency: revCurrency || guessCurrency(), period: revPeriod, hasRevenue: founderHasRevenue, channelShare: revChannelShare };
      const finalized = finalizePlan(result, revInputs, locale);
      setPlan(finalized);

      // Persist user + plan via the server (service key), so the browser never
      // touches the users/plans tables directly.
      let savedPlanId = null;
      try {
        const saveRes = await fetch("/api/save-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            first_name: userData.firstName,
            job_title: userData.jobTitle,
            linkedin_url: userData.linkedinUrl,
            plan_data: { ...finalized, _locale: locale },
            cohort: cohort || null,
            quiz_answers: answers,
            special_note: specialNote || null,
            ssi_scores: {
              establish_brand: userData.establish_brand || null,
              find_people: userData.find_people || null,
              engage_insights: userData.engage_insights || null,
              build_relationships: userData.build_relationships || null
            }
          })
        });
        const saveData = await saveRes.json().catch(() => ({}));
        savedPlanId = saveData.planId || null;
        if (savedPlanId) setPlanId(savedPlanId);
      } catch(e) { console.log("Save plan error:", e); }

      // Send email via serverless function
      console.log("Sending email with planId:", savedPlanId);
      try {
        const emailRes = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: userData.firstName,
            plan: finalized,
            planId: savedPlanId,
            locale
          })
        });
        const emailData = await emailRes.json();
        console.log("Email response:", emailData);
      } catch(e) { console.log("Email error:", e); }

      identify(email);
      track("plan_unlocked", { cohort });
      setPhase("result");
    } catch(e) {
      if (e.message === "Failed to fetch") {
        setEmailError("Connection error, please check your internet and try again.");
      } else {
        setEmailError(`Error: ${e.message}`);
      }
    }
    setLoading(false);
  };

  const handlePDF = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setPdfError("That file isn't a PDF. Export yours from LinkedIn via Resources → Save to PDF."); return; }
    // Truncating base64 corrupts the PDF, so reject oversized files instead
    if (file.size > 3 * 1024 * 1024) { setPdfError("That PDF is over 3MB. LinkedIn profile exports are usually small, try re-exporting it."); setPdfName(""); setPdfText(""); return; }
    setPdfError("");
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onerror = () => { setPdfError("Couldn't read that file. Please try again."); setPdfName(""); setPdfText(""); };
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      setPdfText(`PDF_BASE64:${base64}`);
      track("pdf_uploaded");
    };
    reader.readAsDataURL(file);
  };

  const handlePostScreenshot = (index, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target.result.split(",")[1];
      // Compress before storing so screenshots stay inside the API payload budget
      const { base64, type } = await compressImage(raw, file.type);
      setPostScreenshots(prev => {
        const updated = [...prev];
        updated[index] = { file, preview: `data:${type};base64,${base64}`, base64, type };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // Back to the landing page without wiping progress; answers survive a return trip
  const goHome = () => setPhase("intro");
  // Root URL for the current locale (English at "/", others under their prefix), so
  // resets and "start over" keep the user on their localized route.
  const localeHome = locale === "en" ? "/" : "/" + locale + "/";

  const reset = () => { try { localStorage.removeItem("ls_funnel_v1"); } catch (e) {} setSavedProgress(null); setResumeDismissed(false); setSharedView(false); setPhase("intro"); setAnswers({}); setCurrentQ(0); setPlan(null); planRef.current = null; setUserData({firstName:"",lastName:"",age:"",jobTitle:"",linkedinUrl:"",establish_brand:"",find_people:"",engage_insights:"",build_relationships:""}); setCohort(null); setSpecialNote(""); setQuizPhase("generic"); setEmail(""); setSelected(null); setOtherText(""); setMultiSelected([]); setPdfText(""); setPdfName(""); setPdfError(""); setGenError(""); setPostScreenshots([null,null,null]); setNoPostsYet(false); setRevCurrency(""); setRevValue(""); setRevPeriod("per_year"); setRevTarget(""); setFounderHasRevenue(null); setFounderUnlock(""); setRevChannelShare("0.3"); setActiveSection(0); setAnalysisStep(0); setAnalysisProgress(0); setPlanId(null); setEmailError(""); setFormErrors({}); };

  const progress = (currentQ/QUESTIONS.length)*100;

  const s = {
    h1: { color:"#F9FAFB", fontSize:32, fontWeight:800, lineHeight:1.2, marginBottom:12, letterSpacing:-0.5 },
    sub: { color:"#9696b4", fontSize:14, lineHeight:1.7, marginBottom:28 },
    label: { color:"#7a7a96", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 },
    err: { color:"#ef4444", fontSize:11, marginTop:4 },
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  const COHORTS = [
    { id:"B2B Executive", emoji:"🏢", label:"B2B Executive", sub:"Building authority in my industry" },
    { id:"Real Estate Professional", emoji:"🏠", label:"Real Estate Professional", sub:"Attracting high-value clients" },
    { id:"Startup Founder", emoji:"🚀", label:"Startup Founder", sub:"Building visibility for my company" },
    { id:"Job Seeker", emoji:"🎯", label:"Job Seeker", sub:"Landing my next role" },
    { id:"Consultant or Coach", emoji:"💼", label:"Consultant / Coach", sub:"Growing my client base" },
    { id:"Thought Leader", emoji:"🎤", label:"Thought Leader", sub:"Becoming a voice in my industry" },
  ];
  const COHORT_HEADLINES = {
    "B2B Executive": "Your competitors are already building their LinkedIn brand.",
    "Real Estate Professional": "Your listings deserve a LinkedIn that works as hard as you do.",
    "Startup Founder": "Your next investor is already looking at your LinkedIn.",
    "Job Seeker": "Your next employer is already looking at your LinkedIn.",
    "Consultant or Coach": "Your best clients find you before you find them.",
    "Thought Leader": "Your ideas deserve an audience. Let's build one.",
  };

  if (phase==="loading") return (
    <Layout>
      <div style={{ minHeight:"40vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes lsspin{to{transform:rotate(360deg)}}`}</style>
        <div role="status" aria-label="Loading" style={{ width:36, height:36, border:"3px solid #1a1a2e", borderTopColor:"#c8a96e", borderRadius:"50%", animation:"lsspin 0.8s linear infinite" }} />
      </div>
    </Layout>
  );

  if (phase==="plan_missing") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo onHome={goHome} />
        <Badge color="#ef4444">{t("link_not_found")}</Badge>
        <h2 style={{ ...s.h1, fontSize:24 }}>{t("link_expired_title")}</h2>
        <p style={{ ...s.sub }}>{t("link_expired_sub")}</p>
        <button className="primary-btn" onClick={()=>{ window.history.replaceState({}, "", localeHome); reset(); }}>{t("btn_get_plan")}</button>
      </div>
    </Layout>
  );

  if (phase==="cohort") return (
    <Layout>
      <div className="page-enter">
        <Logo onHome={goHome} />
        <h2 style={{ ...s.h1, fontSize:26, marginBottom:8 }}>{t("cohort_q")}</h2>
        <p style={{ ...s.sub, marginBottom:28 }}>{t("cohort_sub")}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
          {COHORTS.map(c => (
            <button key={c.id}
              aria-label={`${cohortText(locale, c.id, "label", c.label)}: ${cohortText(locale, c.id, "sub", c.sub)}`}
              onClick={()=>{ track("cohort_selected", { cohort: c.id }); if (c.id !== cohort) { setAnswers({}); setCurrentQ(0); setSelected(null); setMultiSelected([]); setOtherText(""); } setCohort(c.id); setPhase("form"); }}
              style={{
                background: cohort===c.id ? "rgba(200,169,110,0.15)" : "#0d0d18",
                border: cohort===c.id ? "1px solid #c8a96e" : "1px solid #1a1a2e",
                borderRadius:14, padding:"14px 18px",
                display:"flex", alignItems:"center", gap:14,
                cursor:"pointer", textAlign:"left", transition:"all 0.2s"
              }}
            >
              <span style={{ fontSize:24, color: cohort===c.id?"#c8a96e":"#8a8aa8", lineHeight:0, display:"flex", flexShrink:0 }} dangerouslySetInnerHTML={{ __html: iconFor(c.emoji) }} />
              <div>
                <p style={{ color:"#F9FAFB", fontSize:15, fontWeight:700, marginBottom:2 }}>{cohortText(locale, c.id, "label", c.label)}</p>
                <p style={{ color:"#c8c7dd", fontSize:12 }}>{cohortText(locale, c.id, "sub", c.sub)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );

  if (phase==="intro") {
    // Render without `anim` so it matches the prerendered (build-time) landing and
    // stays visible immediately; the effect adds `anim` after the hero is shown.
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: HOME_CSS }} />
        <div className="ls-home" dangerouslySetInnerHTML={{ __html: homeHtml(locale) }} />
        {savedProgress && !resumeDismissed && (
          <div style={{ position:"fixed", left:0, right:0, bottom:18, zIndex:9998, display:"flex", justifyContent:"center", padding:"0 12px", pointerEvents:"none" }}>
            <div style={{ pointerEvents:"auto", display:"flex", alignItems:"center", gap:4, background:"#0d0d18", border:"1px solid #2a2a3e", borderRadius:100, padding:6, boxShadow:"0 18px 50px -16px rgba(0,0,0,0.9)", fontFamily:"'DM Sans',sans-serif" }}>
              <button onClick={resumeFunnel} style={{ display:"flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,#c8a96e,#a07840)", color:"#08080e", border:"none", borderRadius:100, padding:"10px 20px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                {t("resume_cta")} <span style={{ fontSize:16, lineHeight:1 }}>→</span>
              </button>
              <button onClick={()=>setResumeDismissed(true)} aria-label={t("resume_dismiss")} title={t("resume_dismiss")} style={{ background:"transparent", border:"none", color:"#8a8aa6", fontSize:20, lineHeight:1, cursor:"pointer", padding:"6px 11px" }}>×</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── FORM ───────────────────────────────────────────────────────────────────
  if (phase==="form") return (
    <Layout>
      <div className="page-enter">
        <Logo onHome={goHome} />
        {renderStepRail("form")}
        <h2 style={{ ...s.h1, fontSize:26 }}>{cohortText(locale, cohort, "headline", COHORT_HEADLINES[cohort]) || t("form_title")}</h2>
        <p style={{ ...s.sub }}>{t("form_sub")}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["firstName",t("lbl_first"),"John"],["lastName",t("lbl_last"),"Smith"]].map(([k,l,p])=>(
              <div key={k}>
                <label style={s.label}>{l}</label>
                <input className={`field-input${formErrors[k]?" error":""}`} value={userData[k]} onChange={e=>setUserData({...userData,[k]:e.target.value})} placeholder={p} />
                {formErrors[k]&&<p style={s.err}>{formErrors[k]}</p>}
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:12 }}>
            <div>
              <label style={s.label}>{t("lbl_age")}</label>
              <input className={`field-input${formErrors.age?" error":""}`} type="number" value={userData.age} onChange={e=>setUserData({...userData,age:e.target.value})} placeholder="28" />
              {formErrors.age&&<p style={s.err}>{formErrors.age}</p>}
            </div>
            <div>
              <label style={s.label}>{t("lbl_title")}</label>
              <input className={`field-input${formErrors.jobTitle?" error":""}`} value={userData.jobTitle} onChange={e=>setUserData({...userData,jobTitle:e.target.value})} placeholder="Marketing Manager" />
              {formErrors.jobTitle&&<p style={s.err}>{formErrors.jobTitle}</p>}
            </div>
          </div>
          <div>
            <label style={s.label}>{t("lbl_linkedin")}</label>
            <input className={`field-input${formErrors.linkedinUrl?" error":""}`} value={userData.linkedinUrl} onChange={e=>setUserData({...userData,linkedinUrl:e.target.value})} placeholder="linkedin.com/in/yourname" />
            {formErrors.linkedinUrl&&<p style={s.err}>{formErrors.linkedinUrl}</p>}
          </div>
          <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:14, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>📊</span>
              <label style={{ ...s.label, margin:0 }}>{t("ssi_label")} <span style={{ color:"#c8c7dd", fontWeight:400 }}>{t("ssi_optional")}</span></label>
            </div>
            <p style={{ color:"#7a7a96", fontSize:11, marginBottom:12 }}>{(()=>{ const help=t("ssi_help"), url="linkedin.com/sales/ssi", i=help.indexOf(url); if(i===-1) return help; return (<>{help.slice(0,i)}<a href="https://linkedin.com/sales/ssi" target="_blank" rel="noreferrer" style={{ color:"#c8a96e" }}>{url}</a>{help.slice(i+url.length)}</>); })()}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                ["establish_brand", t("ssi_brand")],
                ["find_people", t("ssi_people")],
                ["engage_insights", t("ssi_insights")],
                ["build_relationships", t("ssi_relations")],
              ].map(([key, label]) => (
                <div key={key}>
                  <p style={{ color:"#c8c7dd", fontSize:11, marginBottom:4 }}>{label}</p>
                  <input
                    className="field-input"
                    type="number" min="0" max="25"
                    placeholder="0–25"
                    value={userData[key]||""}
                    onChange={e=>{let val=e.target.value; if(val!==""){val=String(Math.max(0,Math.min(25,Math.floor(Number(val)||0))));} setUserData({...userData,[key]:val});}}
                    style={{ padding:"8px 12px", fontSize:14 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop:24 }}>
          <button className="primary-btn" onClick={()=>{ if(validate()) setPhase("pdf_upload"); }}>{t("btn_continue")}</button>
        </div>
      </div>
    </Layout>
  );

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (phase==="quiz") return (
    <Layout>
      <div className="page-enter" key={currentQ}>
        <Logo onHome={goHome} />
        {renderStepRail("quiz")}
        <div style={{ marginBottom:16 }}>
          <Badge color="#6a5a9a">{t("q_counter", { n: Math.min(currentQ + 1, QUESTIONS.length), m: QUESTIONS.length })}</Badge>
        </div>
        <div className="progress-bar" style={{ marginBottom:24 }}>
          <div className="progress-fill" style={{ width:`${progress}%` }} />
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>{QUESTIONS.map(function(qq, i){ var answered = answers[qq.id] != null; var isCur = i === currentQ; var ok = isCur || answered; return (<button key={qq.id} onClick={function(){ if (ok) goToQuestion(i); }} disabled={!ok} style={{ width:30, height:30, borderRadius:"50%", border: isCur ? "2px solid #c8a96e" : (answered ? "1px solid #6a5a9a" : "1px solid #2a2a3a"), background: isCur ? "#c8a96e" : "transparent", color: isCur ? "#0a0a0f" : (answered ? "#c8a96e" : "#3a3a5a"), fontSize:12, fontWeight:700, cursor: ok ? "pointer" : "default", padding:0 }}>{i + 1}</button>); })}</div>
        <h2 style={{ color:"#F9FAFB", fontSize:22, fontWeight:800, marginBottom:8, lineHeight:1.3 }}>{q.question}</h2>
        <p style={{ color:"#c8c7dd", fontSize:13, marginBottom:22 }}>{q.subtitle}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:22 }}>
          {q.multiSelect && <p style={{ color:"#c8c7dd", fontSize:11, marginBottom:4 }}>{t("select_all")}</p>}
          {q.options.map(opt=>{
            const isMultiActive = q.multiSelect && multiSelected.includes(opt.label);
            const isSingleActive = !q.multiSelect && selected===opt.label;
            const isActive = isMultiActive || isSingleActive;
            return (
              <button key={opt.label}
                className={`opt-row${isActive?" selected":""}`}
                onClick={()=>{
                  if (q.multiSelect) {
                    setMultiSelected(prev =>
                      prev.includes(opt.label)
                        ? prev.filter(x=>x!==opt.label)
                        : [...prev, opt.label]
                    );
                  } else {
                    setSelected(opt.label);
                    setOtherText("");
                  }
                }}
              >
                <span style={{ fontSize:20, color: isActive?"#c8a96e":"#55556f", lineHeight:0, display:"flex", flexShrink:0 }} dangerouslySetInnerHTML={{ __html: iconFor(opt.emoji) }} />
                <span style={{ color:isActive?"#c8a96e":"#b6b5cc", fontSize:14, fontWeight:isActive?600:400, flex:1 }}>{opt.display || opt.label}</span>
                {q.multiSelect
                  ? <span style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isActive?"#c8a96e":"#2a2a4a"}`, background:isActive?"#c8a96e":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {isActive && <span style={{ color:"#0d0d18", fontSize:12, fontWeight:900 }}>✓</span>}
                    </span>
                  : isActive && <span style={{ color:"#c8a96e", fontSize:12 }}>◆</span>
                }
              </button>
            );
          })}
        </div>
        {(selected === "Other / Something else" || (q.multiSelect && multiSelected.includes("Other / Something else"))) && (
          <div style={{ marginBottom:16 }}>
            <textarea
              autoFocus
              data-other-input
              placeholder={t("other_placeholder")}
              value={otherText}
              onChange={e=>setOtherText(e.target.value)}
              maxLength={500}
              style={{ width:"100%", minHeight:90, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:12, padding:"12px 14px", color:"#F9FAFB", fontSize:14, lineHeight:1.6, resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
            />
            <p style={{ color:"#7a7a96", fontSize:11, textAlign:"right", marginTop:4 }}>{otherText.length}/500</p>
          </div>
        )}
        <button className="primary-btn" disabled={
          q.multiSelect
            ? multiSelected.length === 0
            : !selected
        } onClick={handleNext}>
          {t("btn_continue")}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={handlePrev}>{t("btn_back")}</button>
      </div>
    </Layout>
  );

  // ── PDF UPLOAD ─────────────────────────────────────────────────────────────
  if (phase==="pdf_upload") return (
    <Layout>
      <div className="page-enter">
        <Logo onHome={goHome} />
        {renderStepRail("pdf_upload")}
        <h2 style={{ ...s.h1, fontSize:26 }}>{t("pdf_title")}</h2>
        <p style={{ ...s.sub }}>{locale==="en"
          ? (<>With your real profile, the plan critiques what you actually wrote instead of guessing. Go to your LinkedIn profile → click <strong style={{ color:"#c8a96e" }}>Resources</strong> → <strong style={{ color:"#c8a96e" }}>Save to PDF</strong>. Takes 10 seconds.</>)
          : t("pdf_sub")}</p>
        <div
          className={`pdf-drop${isDragging?" dragover":""}`}
          style={!pdfName ? { borderColor:"#c8a96e", background:"rgba(200,169,110,0.05)" } : undefined}
          onClick={()=>fileInputRef.current?.click()}
          onDragOver={e=>{ e.preventDefault(); setIsDragging(true); }}
          onDragLeave={()=>setIsDragging(false)}
          onDrop={e=>{ e.preventDefault(); setIsDragging(false); handlePDF(e.dataTransfer.files[0]); }}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>handlePDF(e.target.files[0])} />
          {pdfName ? (
            <div>
              <p style={{ color:"#c8a96e", fontSize:14, fontWeight:700, marginBottom:4 }}>✓ {pdfName}</p>
              <p style={{ color:"#c8c7dd", fontSize:12 }}>{pdfText ? t("pdf_analyzed") : t("pdf_reading")}</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize:28, marginBottom:12 }}>📄</p>
              <p style={{ color:"#c8a96e", fontSize:15, fontWeight:700, marginBottom:4 }}>{t("pdf_upload_cta")}</p>
              <p style={{ color:"#b6b5cc", fontSize:12 }}>{t("pdf_browse")}</p>
            </div>
          )}
        </div>
        {pdfError && <p style={{ color:"#ef4444", fontSize:12, textAlign:"center", marginTop:10 }}>{pdfError}</p>}
        <p style={{ color:"#7a7a96", fontSize:11, textAlign:"center", marginTop:10, marginBottom:24 }}>{t("pdf_privacy")}</p>
        {pdfName
          ? <button className="primary-btn" onClick={()=>setPhase("quiz")}>{t("btn_continue")}</button>
          : <button className="ghost-btn" onClick={()=>setPhase("quiz")} style={{ color:"#c8c7dd", fontSize:13 }}>{t("skip_preliminary")}</button>}
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>setPhase("form")}>{t("btn_back")}</button>
      </div>
    </Layout>
  );

  // ── SPECIAL NOTE ──────────────────────────────────────────────────────────
  if (phase==="note") return (
    <Layout>
      <div className="page-enter">
        <Logo onHome={goHome} />
        <Badge>{t("badge_almost_there")}</Badge>
        <h2 style={{ ...s.h1, fontSize:24, marginBottom:8 }}>{t("note_title")}</h2>
        <p style={{ ...s.sub, marginBottom:20 }}>{t("note_sub")}</p>
        <textarea
          value={specialNote}
          onChange={e=>setSpecialNote(e.target.value)}
          placeholder={t("note_placeholder")}
          style={{
            width:"100%", minHeight:120, background:"#0d0d18",
            border:"1px solid #1a1a2e", borderRadius:12,
            padding:"14px 16px", color:"#F9FAFB", fontSize:14,
            lineHeight:1.6, resize:"vertical", fontFamily:"inherit",
            outline:"none", boxSizing:"border-box", marginBottom:16
          }}
          maxLength={500}
        />
        <p style={{ color:"#7a7a96", fontSize:11, textAlign:"right", marginBottom:20 }}>{specialNote.length}/500</p>
        <button className="primary-btn" onClick={()=>setPhase(REVENUE_COHORTS.indexOf(cohort) !== -1 ? "revenue" : "post_screenshots")}>
          {t("btn_continue")}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>{ const last = QUESTIONS.length-1; restoreSelection(QUESTIONS[last], answers[QUESTIONS[last].id]); setCurrentQ(last); setPhase("quiz"); }}>{t("btn_back")}</button>
      </div>
    </Layout>
  );

  // ── REVENUE AT RISK INPUTS ───────────────────────────────────────────────
  if (phase==="revenue") {
    const isFounder = cohort === "Startup Founder";
    const labels = {
      "Consultant or Coach": { amt: t("rev_amt_consultant"), tgt: t("rev_tgt_consultant") },
      "Real Estate Professional": { amt: t("rev_amt_realestate"), tgt: t("rev_tgt_realestate") },
      "Startup Founder": { amt: t("rev_amt_founder"), tgt: t("rev_tgt_founder") }
    };
    const L = labels[cohort] || labels["Consultant or Coach"];
    const showGate = isFounder && founderHasRevenue === null;
    const preRevenue = isFounder && founderHasRevenue === "no";
    const showMoney = !showGate && !preRevenue;
    const curList = allCurrencyCodes();
    const curVal = revCurrency || guessCurrency();
    const isConsultant = cohort === "Consultant or Coach";
    return (
      <Layout>
        <div className="page-enter">
          <Logo onHome={goHome} />
          <Badge>{t("badge_almost_there")}</Badge>
          <h2 style={{ ...s.h1, fontSize:24, marginBottom:8 }}>{t("rev_title")}</h2>
          <p style={{ ...s.sub, marginBottom:20 }}>{t("rev_sub")}</p>
          {showGate && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              <button className="opt-row" onClick={()=>setFounderHasRevenue("yes")}>
                <span style={{ fontSize:20 }}>💰</span>
                <span style={{ color:"#F9FAFB", fontSize:15, fontWeight:600 }}>{t("rev_yes")}</span>
              </button>
              <button className="opt-row" onClick={()=>setFounderHasRevenue("no")}>
                <span style={{ fontSize:20 }}>🌱</span>
                <span style={{ color:"#F9FAFB", fontSize:15, fontWeight:600 }}>{t("rev_no")}</span>
              </button>
            </div>
          )}
          {showMoney && (
            <>
              <label style={{ color:"#b6b5cc", fontSize:13, display:"block", marginBottom:8 }}>{L.amt}</label>
              <div style={{ display:"flex", gap:8, marginBottom: isConsultant?6:18 }}>
                <select value={curVal} onChange={e=>setRevCurrency(e.target.value)} className="field-input" style={{ flex:"0 0 130px", cursor:"pointer" }}>
                  {curList.map(c => <option key={c} value={c}>{c} — {currencyName(c)}</option>)}
                </select>
                <input type="number" inputMode="numeric" value={revValue} onChange={e=>setRevValue(e.target.value)} placeholder="e.g. 8000" className="field-input" style={{ flex:1 }} />
              </div>
              {isConsultant && (
                <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                  {[["per_year",t("rev_per_year")],["per_project",t("rev_per_project")]].map(pp=>(
                    <button key={pp[0]} className="tab-pill" onClick={()=>setRevPeriod(pp[0])} style={{ flex:1, borderColor: revPeriod===pp[0]?"#c8a96e":"#1a1a2e", color: revPeriod===pp[0]?"#c8a96e":"#4a4a6a", background: revPeriod===pp[0]?"rgba(200,169,110,0.1)":"transparent" }}>{pp[1]}</button>
                  ))}
                </div>
              )}
              <label style={{ color:"#b6b5cc", fontSize:13, display:"block", marginBottom:8 }}>{L.tgt}</label>
              <input type="number" inputMode="numeric" value={revTarget} onChange={e=>setRevTarget(e.target.value)} placeholder="e.g. 10" className="field-input" style={{ marginBottom:18 }} />
              <label style={{ color:"#b6b5cc", fontSize:13, display:"block", marginBottom:8 }}>{t("rev_share_q")}</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
                {[["0.15",t("rev_share_little")],["0.3",t("rev_share_some")],["0.5",t("rev_share_lot")],["0.7",t("rev_share_most")]].map(cs=>(
                  <button key={cs[0]} className="tab-pill" onClick={()=>setRevChannelShare(cs[0])} style={{ flexBasis:"47%", flexGrow:1, borderColor: revChannelShare===cs[0]?"#c8a96e":"#1a1a2e", color: revChannelShare===cs[0]?"#c8a96e":"#4a4a6a", background: revChannelShare===cs[0]?"rgba(200,169,110,0.1)":"transparent" }}>{cs[1]}</button>
                ))}
              </div>
              <button className="primary-btn" onClick={()=>setPhase("post_screenshots")}>{t("btn_continue")}</button>
              <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>{ setRevValue(""); setRevTarget(""); setPhase("post_screenshots"); }}>{t("btn_skip_step")}</button>
            </>
          )}
          {preRevenue && (
            <>
              <label style={{ color:"#b6b5cc", fontSize:13, display:"block", marginBottom:10 }}>{t("rev_unlock_q")}</label>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {[["Investors",t("rev_unlock_investors")],["Customers",t("rev_unlock_customers")],["Hires",t("rev_unlock_hires")],["Partnerships",t("rev_unlock_partnerships")]].map(([val,disp])=>(
                  <button key={val} className="opt-row" onClick={()=>setFounderUnlock(val)} style={{ borderColor: founderUnlock===val?"#c8a96e":"#1a1a2e" }}>
                    <span style={{ color:"#F9FAFB", fontSize:15, fontWeight:600 }}>{disp}</span>
                  </button>
                ))}
              </div>
              <button className="primary-btn" onClick={()=>setPhase("post_screenshots")}>{t("btn_continue")}</button>
            </>
          )}
          <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>{ if (isFounder && founderHasRevenue !== null) { setFounderHasRevenue(null); } else { setPhase("note"); } }}>{t("btn_back")}</button>
        </div>
      </Layout>
    );
  }

  // ── POST SCREENSHOTS ──────────────────────────────────────────────────────
  if (phase==="post_screenshots") return (
    <Layout>
      <div className="page-enter">
        <Logo onHome={goHome} />
        {renderStepRail("post_screenshots")}
        <h2 style={{ color:"#F9FAFB", fontSize:22, fontWeight:800, marginBottom:8 }}>{t("ss_title")}</h2>
        <p style={{ color:"#c8c7dd", fontSize:13, marginBottom:24 }}>{t("ss_sub")}</p>
        
        {!noPostsYet && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
            {[0,1,2].map(i => (
              <div key={i}>
                <input ref={postRefs[i]} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handlePostScreenshot(i, e.target.files[0])} />
                <div
                  onClick={()=>postRefs[i].current?.click()}
                  style={{
                    border:`1.5px dashed ${postScreenshots[i]?"#c8a96e":"#2a2a3e"}`,
                    borderRadius:14, padding:postScreenshots[i]?"0":"20px 16px",
                    cursor:"pointer", background:postScreenshots[i]?"transparent":"#0d0d18",
                    transition:"all 0.2s", overflow:"hidden",
                    display:"flex", alignItems:"center", gap:12,
                  }}
                >
                  {postScreenshots[i] ? (
                    <>
                      <img src={postScreenshots[i].preview} alt={`Post ${i+1}`} style={{ width:72, height:56, objectFit:"cover", borderRadius:10, flexShrink:0 }} />
                      <div>
                        <p style={{ color:"#c8a96e", fontSize:13, fontWeight:700 }}>✓ {t("ss_post_uploaded", {n: i+1})}</p>
                        <p style={{ color:"#c8c7dd", fontSize:11 }}>{t("ss_replace")}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize:20 }}>📸</span>
                      <div>
                        <p style={{ color:"#c8c7dd", fontSize:13, fontWeight:600 }}>{t("ss_post", {n: i+1})}</p>
                        <p style={{ color:"#7a7a96", fontSize:11 }}>{t("ss_upload")}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          onClick={()=>setNoPostsYet(!noPostsYet)}
          style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", padding:"12px 16px", background:"#0d0d18", border:`1px solid ${noPostsYet?"#c8a96e":"#1a1a2e"}`, borderRadius:12, marginBottom:24, transition:"all 0.2s" }}
        >
          <div style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${noPostsYet?"#c8a96e":"#2a2a3e"}`, background:noPostsYet?"#c8a96e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
            {noPostsYet && <span style={{ color:"#08080e", fontSize:11, fontWeight:900 }}>✓</span>}
          </div>
          <p style={{ color:noPostsYet?"#c8a96e":"#4a4a6a", fontSize:13, fontWeight:noPostsYet?600:400 }}>{t("ss_no_posts")}</p>
        </div>

        {genError && (
          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.35)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
            <p style={{ color:"#ef4444", fontSize:13, lineHeight:1.5, margin:0 }}>{genError}</p>
            <p style={{ color:"#8a8a9a", fontSize:12, lineHeight:1.5, margin:"4px 0 0" }}>{t("gen_error_retry")}</p>
          </div>
        )}
        <button className="primary-btn" onClick={()=>{
          setGenError("");
          setPhase("analyzing");
          const ans = founderUnlock ? { ...answers, what_they_need_linkedin_to_unlock: founderUnlock } : answers;
          // Start API call immediately parallel to animation
          track("analysis_started", { cohort, has_pdf: !!pdfText, screenshots: noPostsYet ? 0 : postScreenshots.filter(Boolean).length });
          callAPI(userData, ans, pdfText, noPostsYet ? [] : postScreenshots, cohort, specialNote)
            .then(id => { planRef.current = id; setPlanId(id); track("plan_generated"); })
            .catch(err => { planRef.current = {_error: err.message}; track("plan_failed", { error: String(err.message).slice(0,120) }); });
        }}>
          {t("btn_continue")}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>setPhase(REVENUE_COHORTS.indexOf(cohort) !== -1 ? "revenue" : "note")}>{t("btn_back")}</button>
      </div>
    </Layout>
  );

  // ── ANALYZING ──────────────────────────────────────────────────────────────
  if (phase==="analyzing") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo onHome={goHome} />
        <h2 style={{ color:"#F9FAFB", fontSize:24, fontWeight:700, marginBottom:8 }}>
          {t("analyzing_title", {name: userData.firstName})}
        </h2>
        <p style={{ color:"#c8c7dd", fontSize:13, marginBottom:32 }}>{t("analyzing_sub")}</p>
        <div style={{ background:"#0F1117", borderRadius:100, height:4, marginBottom:16, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${analysisProgress}%`, background:"linear-gradient(90deg,#c8a96e,#e8c98e)", borderRadius:100, transition:"width 0.3s ease" }} />
        </div>
        <p style={{ color:"#c8c7dd", fontSize:12, marginBottom:28 }}>{t("analyzing_complete", {n: analysisProgress})}</p>
        <div style={{ textAlign:"left", display:"flex", flexDirection:"column", gap:10 }}>
          {ANALYSIS_STEPS.map((step,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:i<=analysisStep?"#c8a96e":"#1a1a2e", flexShrink:0, transition:"background 0.3s" }} className={i===analysisStep?"analysis-dot":""} />
              <span style={{ color:i<=analysisStep?"#b6b5cc":"#2a2a3a", fontSize:13 }}>{locale==="en" ? step.text : t(ANALYSIS_STEP_KEYS[i])}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );

  // ── PAYWALL ────────────────────────────────────────────────────────────────
  if (phase==="paywall") {
    // Displayed LinkedIn Score, computed from the gate teaser the same way finalizePlan does.
    const gateScore = (teaser && teaser.profileOverall != null)
      ? Math.max(35, Math.min(95, teaser.ssiTotal != null ? Math.round(0.6 * teaser.profileOverall + 0.4 * teaser.ssiTotal) : Math.round(teaser.profileOverall)))
      : null;
    return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo onHome={goHome} />
        <Badge color="#10b981">{t("paywall_badge")}</Badge>
        {teaser && teaser.archetype
          ? <h2 style={{ ...s.h1, fontSize:26 }}>{userData.firstName}, {t("result_you_are")}<br /><span style={{ color:"#c8a96e", fontWeight:800 }}>{fixedArchetype(cohort, gateScore, locale, userData.firstName) || teaser.archetype}</span></h2>
          : <h2 style={{ ...s.h1, fontSize:28 }}>{t("paywall_ready")}<br /><span style={{ color:"#c8a96e" }}>{userData.firstName}.</span></h2>}
        <div className="gold-rule" />
        {gateScore != null && (
          <div style={{ display:"flex", gap:12, marginBottom:18 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:12, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:14 }}>
              <ScoreRing score={gateScore} />
              <div style={{ textAlign:"left" }}>
                <p style={{ color:"#7a7a96", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{t("sec_linkedin_score")}</p>
                <p style={{ color:"#F9FAFB", fontSize:13, fontWeight:700 }}>{gateScore<40?t("needs_work"):gateScore<70?t("good_foundation"):t("strong_profile")}</p>
              </div>
            </div>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:12, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:14 }}>
              {teaser.tlAvailable ? (
                <><ScoreRing score={teaser.tlScore} color="#a78bfa" />
                <div style={{ textAlign:"left" }}>
                  <p style={{ color:"#7a7a96", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{t("tab_tl")}</p>
                  <p style={{ color:"#F9FAFB", fontSize:13, fontWeight:700 }}>{teaser.tlScore<40?t("tl_early"):teaser.tlScore<70?t("tl_growing"):t("tl_strong")}</p>
                </div></>
              ) : (
                <div style={{ textAlign:"left" }}>
                  <p style={{ color:"#7a7a96", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{t("tab_tl")}</p>
                  <p style={{ color:"#c8c7dd", fontSize:12 }}>{t("tl_not_calc")}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {specialNote && specialNote.trim() && (
          <p style={{ color:"#c8c7dd", fontSize:13, lineHeight:1.6, marginBottom:10 }}>{t("gate_goal")} <span style={{ color:"#e8e8f0", fontStyle:"italic" }}>&ldquo;{specialNote.trim().slice(0,180)}{specialNote.trim().length>180?"…":""}&rdquo;</span></p>
        )}
        <p style={{ ...s.sub, marginBottom:16 }}>{t("paywall_sub")}</p>
        <div style={{ position:"relative", marginBottom:22 }}>
          <div aria-hidden="true" style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:20, textAlign:"left", filter:"blur(3.5px)", opacity:0.5, userSelect:"none", pointerEvents:"none" }}>
            {[t("inc_profile"), t("inc_hooks"), t("inc_calendar"), t("inc_rules")].map((label,i)=>(
              <div key={i} style={{ marginBottom:14 }}>
                <p style={{ color:"#c8a96e", fontSize:11, fontWeight:700, marginBottom:6 }}>{label}</p>
                <div style={{ height:7, background:"#1f1f30", borderRadius:5, marginBottom:5, width:"92%" }} />
                <div style={{ height:7, background:"#1f1f30", borderRadius:5, width:"68%" }} />
              </div>
            ))}
          </div>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", padding:12 }}>
            <div style={{ background:"rgba(13,13,24,0.9)", border:"1px solid #c8a96e44", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:8, color:"#c8a96e", fontSize:13, fontWeight:600 }}>
              <span>🔒</span> {t("paywall_locked")}
            </div>
          </div>
        </div>
        <div style={{ marginBottom:14, textAlign:"left" }}>
          <label style={s.label}>{t("email_label")}</label>
          <input className={`field-input${emailError?" error":""}`} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&handlePaywall()} />
          {emailError&&<p style={s.err}>{emailError}</p>}
        </div>
        <button className="primary-btn" disabled={loading} onClick={handlePaywall}>
          {loading?t("btn_generating"):t("btn_get_plan")}
        </button>
        <p style={{ color:"#7a7a96", fontSize:11, marginTop:12, lineHeight:1.5 }}>{t("paywall_consent")} <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color:"#9696b4" }}>Privacy</a> · <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color:"#9696b4" }}>Terms</a></p>
      </div>
    </Layout>
    );
  }

  // ── GENERATING ─────────────────────────────────────────────────────────────
  if (phase==="generating") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo onHome={goHome} />
        <h2 style={{ color:"#F9FAFB", fontSize:24, fontWeight:700, marginBottom:8 }}>{t("gen_title")}</h2>
        <p style={{ color:"#c8c7dd", fontSize:13 }}>{t("gen_sub")}</p>
      </div>
    </Layout>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase==="result"&&plan) {
    const TAB_KEYS = ["tab_overview","tab_profile","tab_tl","tab_ssi","tab_content","tab_hooks","tab_calendar","tab_rules"];
    return (
      <Layout>
        <div className="page-enter" style={{ paddingBottom:40 }}>
          {sharedView && (
            <div style={{ background:"linear-gradient(135deg,rgba(200,169,110,0.14),rgba(200,169,110,0.04))", border:"1px solid #c8a96e55", borderRadius:14, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
              <span style={{ color:"#e8e8f0", fontSize:13, fontWeight:600 }}>{t("shared_banner", {name: userData.firstName})}</span>
              <a href={localeHome} onClick={e=>{ e.preventDefault(); window.history.replaceState({}, "", localeHome); reset(); }} style={{ background:"linear-gradient(135deg,#c8a96e,#a07840)", color:"#08080e", fontWeight:700, fontSize:13, padding:"9px 16px", borderRadius:10, textDecoration:"none", whiteSpace:"nowrap" }}>{t("shared_cta")}</a>
            </div>
          )}
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <Logo onHome={goHome} />
            <Badge>{t("result_badge")}</Badge>
            <h1 style={{ ...s.h1, fontSize:28 }}>
              {userData.firstName}, {t("result_you_are")}<br />
              <span style={{ color:"#c8a96e", fontWeight:800 }}>{fixedArchetype(cohort, plan.score, locale, userData.firstName) || plan.archetype}</span>
            </h1>
            <div className="gold-rule" />
            <p style={{ color:"#c8c7dd", fontSize:13, lineHeight:1.7 }}>{plan.headline}</p>
          </div>

          {!sharedView && planId && (
            cardIdFor(cohort, plan.score)
              ? <ShareCardSection cohort={cohort} score={plan.score} name={userData.firstName} />
              : <ShareBar planId={planId} score={plan.score} archetype={plan.archetype} t={t} />
          )}

          {/* Scores Row */}
          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            {/* LinkedIn Score */}
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:14, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"16px" }}>
              <ScoreRing score={plan.score} />
              <div>
                <p style={{ color:"#7a7a96", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{t("sec_linkedin_score")}</p>
                <p style={{ color:"#F9FAFB", fontSize:13, fontWeight:700, marginBottom:3 }}>{plan.score<40?t("needs_work"):plan.score<70?t("good_foundation"):t("strong_profile")}</p>
                <p style={{ color:"#ef4444", fontSize:11, lineHeight:1.4, opacity:0.8 }}>{plan.urgency}</p>
              </div>
            </div>
            {/* Thought Leader Score */}
            {plan.thought_leader?.available ? (
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:14, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"16px" }}>
                <ScoreRing score={plan.thought_leader.score} color="#a78bfa" />
                <div>
                  <p style={{ color:"#7a7a96", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{t("tab_tl")}</p>
                  <p style={{ color:"#F9FAFB", fontSize:13, fontWeight:700, marginBottom:3 }}>{plan.thought_leader.score<40?t("tl_early"):plan.thought_leader.score<70?t("tl_growing"):t("tl_strong")}</p>
                  <p style={{ color:"#a78bfa", fontSize:11, lineHeight:1.4, opacity:0.8 }}>{plan.thought_leader.analysis?.slice(0,120)}{plan.thought_leader.analysis?.length>120?"…":""}</p>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:12, background:"#0d0d18", border:"1px dashed #1a1a2e", borderRadius:16, padding:"16px", cursor:"pointer" }} onClick={()=>setPhase("post_screenshots")}>
                <div style={{ width:52, height:52, borderRadius:"50%", border:"2px dashed #2a2a4a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>📸</div>
                <div>
                  <p style={{ color:"#7a7a96", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{t("tab_tl")}</p>
                  <p style={{ color:"#c8c7dd", fontSize:12, fontWeight:600, marginBottom:3 }}>{t("tl_not_calc")}</p>
                  <p style={{ color:"#c8c7dd", fontSize:11 }}>{t("tl_upload_unlock")}</p>
                </div>
              </div>
            )}
          </div>

          {plan.revenue_at_risk && plan.revenue_at_risk.available && (
            <div style={{ background:"linear-gradient(135deg,rgba(200,169,110,0.14),rgba(200,169,110,0.04))", border:"1px solid #c8a96e55", borderRadius:16, padding:20, marginBottom:20 }}>
              <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{t("sec_revenue_risk")}</p>
              <p style={{ color:"#F9FAFB", fontSize:26, fontWeight:800, marginBottom:6 }}>
                {fmtMoney(plan.revenue_at_risk.low, plan.revenue_at_risk.currency)}{plan.revenue_at_risk.high > plan.revenue_at_risk.low ? (" – " + fmtMoney(plan.revenue_at_risk.high, plan.revenue_at_risk.currency)) : ""}
                <span style={{ fontSize:13, fontWeight:600, color:"#8a8a9a" }}> {t("per_year_label")}</span>
              </p>
              <p style={{ color:"#8a8a9a", fontSize:13, lineHeight:1.6 }}>{locale==="en"
                ? `A rough estimate, not a guarantee. It assumes about ${plan.revenue_at_risk.sharePct}% of your new ${(plan.revenue_at_risk.noun || "client")}s could come through LinkedIn, and that your current profile is leaving a meaningful share of them on the table. Based on ${fmtMoney(plan.revenue_at_risk.value, plan.revenue_at_risk.currency)} per ${plan.revenue_at_risk.noun || "client"} and a target of ${plan.revenue_at_risk.target} this year.`
                : t("rev_disclaimer", { pct: plan.revenue_at_risk.sharePct, noun: t("noun_" + (plan.revenue_at_risk.noun || "client")), value: fmtMoney(plan.revenue_at_risk.value, plan.revenue_at_risk.currency), target: plan.revenue_at_risk.target })}</p>
            </div>
          )}
          {/* Profile section scores */}
          {plan.profile_scores && (
            <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:20, marginBottom:20 }}>
              <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("sec_profile_scores")}</p>
              {[[t("ps_headline"), plan.profile_scores.headline],[t("ps_about"), plan.profile_scores.about],[t("ps_experience"), plan.profile_scores.experience]].map(([label,score])=>(
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:"#b6b5cc", fontSize:13 }}>{label}</span>
                    <span style={{ color:score<40?"#ef4444":score<70?"#f59e0b":"#10b981", fontSize:13, fontWeight:700 }}>{score}/100</span>
                  </div>
                  <div style={{ height:4, background:"#1a1a2e", borderRadius:4, overflow:"hidden" }}>
                    <div className="score-bar-fill" style={{ height:"100%", width:`${score}%`, background:score<40?"#ef4444":score<70?"#f59e0b":"#10b981", borderRadius:4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
            {TAB_KEYS.map((tabKey,i)=>{
              const isThoughtLocked = i===2 && !plan.thought_leader?.available;
              const isSSILocked = i===3 && !plan.ssi_plan?.available;
              const locked = isThoughtLocked || isSSILocked;
              const lockMsg = isThoughtLocked ? t("tl_upload_unlock") : t("ssi_add_unlock");
              return (
                <div key={i} style={{ position:"relative" }} className="tab-tooltip-wrap">
                  <button
                    className={`tab-pill${activeSection===i?" active":""}`}
                    style={{ opacity: locked ? 0.45 : 1, cursor: locked ? "not-allowed" : "pointer" }}
                    onClick={()=>{ if(!locked) setActiveSection(i); }}
                  >
                    {locked && <span style={{ marginRight:4, fontSize:10 }}>🔒</span>}{t(tabKey)}
                  </button>
                  {locked && (
                    <div className="tab-tooltip" style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)", background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:8, padding:"4px 10px", whiteSpace:"nowrap", fontSize:11, color:"#b6b5cc", pointerEvents:"none", zIndex:10 }}>
                      {lockMsg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="section-reveal" key={activeSection}>
            {/* Overview */}
            {activeSection===0 && (
              <div>
                <div style={{ background:"linear-gradient(135deg,rgba(200,169,110,0.06),rgba(200,169,110,0.02))", border:"1px solid #c8a96e22", borderRadius:16, padding:20, marginBottom:12 }}>
                  <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{t("sec_personal_msg")}</p>
                  <p style={{ color:"#8a8a9a", fontSize:14, lineHeight:1.8 }}>"{plan.closing_message}"</p>
                </div>
                {plan.growth_tactics?.map((tactic,i)=>(
                  <div key={i} className="card-block" style={{ display:"flex", gap:12 }}>
                    <span style={{ color:"#c8a96e", fontSize:12, flexShrink:0, marginTop:2 }}>→</span>
                    <p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6 }}>{tactic}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Profile */}
            {activeSection===1 && (
              <div>
                {plan.headline_rewrite && (
                  <div className="card-block" style={{ marginBottom:16, borderColor:"#c8a96e33" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:8 }}>
                      <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", margin:0 }}>{t("card_new_headline")}</p>
                      <CopyBtn text={plan.headline_rewrite} />
                    </div>
                    <p style={{ color:"#e8e8f0", fontSize:14, lineHeight:1.6, fontWeight:600 }}>{plan.headline_rewrite}</p>
                  </div>
                )}
                {plan.about_rewrite && (<div className="card-block" style={{ marginBottom:16, borderColor:"#c8a96e33" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:8 }}><p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", margin:0 }}>{t("card_new_about")}</p><CopyBtn text={plan.about_rewrite} /></div><p style={{ color:"#e8e8f0", fontSize:14, lineHeight:1.7, fontWeight:400, whiteSpace:"pre-wrap" }}>{plan.about_rewrite}</p></div>)}
                {plan.experience_rewrite && (<div className="card-block" style={{ marginBottom:16, borderColor:"#c8a96e33" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:8 }}><p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", margin:0 }}>{t("card_new_exp")}</p><CopyBtn text={plan.experience_rewrite} /></div><p style={{ color:"#e8e8f0", fontSize:14, lineHeight:1.7, fontWeight:400, whiteSpace:"pre-wrap" }}>{plan.experience_rewrite}</p></div>)}
                {plan.profile_fixes?.map((fix,i)=>(
                  <div key={i} className="card-block" style={{ display:"flex", gap:14 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(200,169,110,0.1)", border:"1px solid #c8a96e33", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#c8a96e", fontSize:11, fontWeight:700 }}>{i+1}</div>
                    <p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6 }}>{fix}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection===1 && plan.keyword_analysis && (plan.keyword_analysis.target || plan.keyword_analysis.missing?.length > 0 || plan.keyword_analysis.present?.length > 0) && (<div className="card-block" style={{ marginBottom:16 }}><p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{t("kw_analysis")}</p>{plan.keyword_analysis.target && (<p style={{ color:"#b6b5cc", fontSize:13, lineHeight:1.6, marginBottom:14 }}>{t("kw_optimizing")} <span style={{ color:"#e8e8f0", fontWeight:600 }}>{plan.keyword_analysis.target}</span></p>)}{plan.keyword_analysis.present?.length > 0 && (<div style={{ marginBottom:16 }}><p style={{ color:"#b6b5cc", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t("kw_present")}</p><div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{plan.keyword_analysis.present.map((kw,ki)=>(<span key={ki} style={{ background:"rgba(120,200,140,0.12)", border:"1px solid rgba(120,200,140,0.35)", color:"#7fc99a", borderRadius:6, padding:"5px 10px", fontSize:13, fontWeight:600 }}>{kw}</span>))}</div></div>)}{plan.keyword_analysis.missing?.length > 0 && (<div><p style={{ color:"#c8a96e", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>{t("kw_missing")}</p>{plan.keyword_analysis.missing.map((m,mi)=>(<div key={mi} style={{ marginBottom:12, paddingBottom:12, borderBottom: mi < plan.keyword_analysis.missing.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}><span style={{ color:"#e8e8f0", fontSize:14, fontWeight:700 }}>{m.keyword}</span>{m.where && (<span style={{ background:"rgba(200,169,110,0.12)", border:"1px solid #c8a96e33", color:"#c8a96e", borderRadius:5, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{m.where}</span>)}</div>{m.example && (<p style={{ color:"#b6b5cc", fontSize:13, lineHeight:1.6, margin:0 }}>{m.example}</p>)}</div>))}</div>)}</div>)}

            {/* Thought Leader */}
            {activeSection===2 && (
              <div>
                {plan.thought_leader?.available ? (
                  <>
                    <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("tl_analysis")}</p>
                    {[[t("tl_hook_quality"),plan.thought_leader.hook_score],[t("tl_engagement"),plan.thought_leader.engagement_score],[t("tl_voice"),plan.thought_leader.voice_score],[t("tl_structure"),plan.thought_leader.structure_score]].map(([label,score])=>(
                      <div key={label} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ color:"#b6b5cc", fontSize:13 }}>{label}</span>
                          <span style={{ color:score<40?"#ef4444":score<70?"#f59e0b":"#10b981", fontSize:13, fontWeight:700 }}>{score}/100</span>
                        </div>
                        <div style={{ height:4, background:"#1a1a2e", borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${score}%`, background:score<40?"#ef4444":score<70?"#f59e0b":"#10b981", borderRadius:4, transition:"width 1.2s ease" }} />
                        </div>
                      </div>
                    ))}
                    <p style={{ color:"#c8c7dd", fontSize:13, lineHeight:1.6, marginTop:14, paddingTop:14, borderTop:"1px solid #1a1a2e", marginBottom:20 }}>{plan.thought_leader.analysis}</p>
                    <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("tl_improve")}</p>
                    {plan.thought_leader.improvements?.map((tip,i)=>(
                      <div key={i} className="card-block" style={{ display:"flex", gap:14 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(167,139,250,0.1)", border:"1px solid #a78bfa33", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#a78bfa", fontSize:12, fontWeight:700 }}>{i+1}</div>
                        <p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6 }}>{tip}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <p style={{ fontSize:32, marginBottom:12 }}>📸</p>
                    <p style={{ color:"#c8c7dd", fontSize:15, fontWeight:600, marginBottom:8 }}>{t("tl_empty_title")}</p>
                    <p style={{ color:"#7a7a96", fontSize:13, lineHeight:1.6 }}>{t("tl_empty_sub")}</p>
                  </div>
                )}
              </div>
            )}

            {/* SSI Analysis */}
            {activeSection===3 && (
              <div>
                {plan.ssi_plan?.available ? (
                  <>
                    <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{t("ssi_overview")}</p>
                    <div className="card-block" style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ width:52, height:52, borderRadius:"50%", border:"3px solid #38bdf8", display:"flex", alignItems:"center", justifyContent:"center", color:"#38bdf8", fontSize:18, fontWeight:800, flexShrink:0 }}>{plan.ssi_plan.total}</div>
                        <p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6 }}>{plan.ssi_plan.overview}</p>
                      </div>
                    </div>
                    <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("ssi_pillars")}</p>
                    {plan.ssi_plan.pillars?.map((pillar,i)=>{
                      const pct=(pillar.score/25)*100;
                      const color=pillar.status==="WEAK"?"#ef4444":pillar.status==="AVERAGE"?"#f59e0b":"#10b981";
                      return (
                        <div key={i} className="card-block" style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <span style={{ color:"#e8e8f0", fontSize:13, fontWeight:600 }}>{pillar.name}</span>
                            <span style={{ color, fontSize:13, fontWeight:700 }}>{pillar.score}/25</span>
                          </div>
                          <div style={{ height:4, background:"#1a1a2e", borderRadius:4, overflow:"hidden", marginBottom:10 }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:4, transition:"width 1.2s ease" }} />
                          </div>
                          <p style={{ color:"#b6b5cc", fontSize:13, lineHeight:1.6 }}>{pillar.advice}</p>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <p style={{ fontSize:32, marginBottom:12 }}>📊</p>
                    <p style={{ color:"#c8c7dd", fontSize:15, fontWeight:600, marginBottom:8 }}>{t("ssi_empty_title")}</p>
                    <p style={{ color:"#7a7a96", fontSize:13, lineHeight:1.6 }}>{t("ssi_empty_sub")}</p>
                  </div>
                )}
              </div>
            )}

            {(activeSection===3 || (activeSection===0 && !plan.ssi_plan?.available)) && plan.networking && (plan.networking.headline || plan.networking.targets?.length > 0 || plan.networking.connection_message) && (<div className="card-block" style={{ marginTop:16 }}><p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{t("net_title")}</p>{plan.networking.headline && (<p style={{ color:"#b6b5cc", fontSize:13, lineHeight:1.6, marginBottom:14 }}>{plan.networking.headline}</p>)}{plan.networking.targets?.length > 0 && (<div style={{ marginBottom:16 }}><p style={{ color:"#b6b5cc", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{plan.networking.mode === "engagement" ? t("net_accounts") : t("net_people")}</p>{plan.networking.targets.map((tg,ti)=>(<div key={ti} style={{ marginBottom:10, paddingBottom:10, borderBottom: ti < plan.networking.targets.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}><p style={{ color:"#e8e8f0", fontSize:14, fontWeight:700, marginBottom:2 }}>{tg.who}</p><p style={{ color:"#b6b5cc", fontSize:13, lineHeight:1.6, margin:0 }}>{tg.action}</p></div>))}</div>)}{plan.networking.connection_message && (<div style={{ marginBottom:12 }}><p style={{ color:"#c8a96e", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{plan.networking.mode === "engagement" ? t("net_comment_opener") : t("net_connection_req")}</p><p style={{ color:"#e8e8f0", fontSize:14, lineHeight:1.7, fontWeight:400, whiteSpace:"pre-wrap" }}>{plan.networking.connection_message}</p></div>)}{plan.networking.follow_up_message && (<div><p style={{ color:"#c8a96e", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t("net_followup")}</p><p style={{ color:"#e8e8f0", fontSize:14, lineHeight:1.7, fontWeight:400, whiteSpace:"pre-wrap" }}>{plan.networking.follow_up_message}</p></div>)}</div>)}

            {/* Content Strategy */}
            {activeSection===4 && (
              <div>
                {[[t("cs_frequency"),plan.content_strategy?.post_frequency],[t("cs_times"),plan.content_strategy?.best_posting_times],[t("cs_mix"),plan.content_strategy?.content_mix],[t("cs_hook_formula"),plan.content_strategy?.hook_formula],[t("cs_formats"),plan.content_strategy?.content_types]].map(([label,val],i)=>(
                  <div key={i} className="card-block">
                    <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{label}</p>
                    <p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6 }}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Post Hooks */}
            {activeSection===5 && (
              <div>
                <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("hooks_title")}</p>
                {plan.post_hooks?.map((hook,i)=>(
                  <div key={i} style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:14, padding:20, marginBottom:10, borderLeft:"3px solid #c8a96e" }}>
                    <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:8 }}>{t("hook_label")} {i+1}</p>
                    <p style={{ color:"#e8e8f0", fontSize:15, lineHeight:1.6, fontWeight:500 }}>{hook}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar */}
            {activeSection===6 && (
              <div>
                <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("roadmap_title")}</p>
                {plan.content_calendar?.map((w,i)=>(
                  <div key={i} className={`week-card ${w.type?.toLowerCase()}`}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <p style={{ color:w.type==="POST"?"#c8a96e":"#4a9a6a", fontSize:10, fontWeight:700, letterSpacing:1.5 }}>{w.week} · {w.type}</p>
                      {w.type==="POST"&&<span style={{ background:"rgba(200,169,110,0.1)", color:"#c8a96e", fontSize:10, padding:"2px 8px", borderRadius:100 }}>{t("publish_day")}</span>}
                    </div>
                    <p style={{ color:"#e8e8f0", fontSize:14, fontWeight:600, marginBottom:6 }}>{w.topic}</p>
                    {w.hook && <p style={{ color:"#8a8a9a", fontSize:13, fontStyle:"italic", lineHeight:1.5, marginBottom:6 }}>"{w.hook}"</p>}
                    <p style={{ color:"#c8c7dd", fontSize:13, lineHeight:1.5 }}>{w.action}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Rules */}
            {activeSection===7 && (
              <div>
                <p style={{ color:"#7a7a96", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t("rules_title")}</p>
                {plan.critical_rules?.map((rule,i)=>(
                  <div key={i} className="card-block" style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <span style={{ fontSize:18, color:"#c8a96e", lineHeight:0, display:"flex", flexShrink:0, marginTop:1 }} dangerouslySetInnerHTML={{ __html: iconFor("⚠") }} />
                    <p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6 }}>{rule}</p>
                  </div>
                ))}
              </div>
            )}

          </div>





          <div className="card-block" style={{ marginTop:28, padding:22, borderRadius:14, border:"1px solid #e7e7f2", background:"#f7f8fc" }}><img src="data:image/jpeg;base64,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" alt="Ali Azad" style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", display:"block", marginBottom:14 }} /><p style={{ fontWeight:700, fontSize:16, margin:"0 0 8px" }}>{t("founder_title")}</p><p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6, margin:"0 0 10px" }}>{t("founder_bio1")}</p><p style={{ color:"#b6b5cc", fontSize:14, lineHeight:1.6, margin:"0 0 16px" }}>{t("founder_bio2")}</p><a href="https://calendly.com/aliazad1800/how-to-be-a-linkedin-star" target="_blank" rel="noopener noreferrer" onClick={()=>track("calendly_clicked", { placement:"result" })} style={{ display:"inline-block", background:"#0a66c2", color:"#ffffff", fontWeight:600, fontSize:14, padding:"11px 20px", borderRadius:9, textDecoration:"none" }}>{t("founder_cta_book")}</a><a href="https://www.linkedin.com/in/aliazad11/" target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", marginLeft:10, background:"#ffffff", color:"#0a66c2", fontWeight:600, fontSize:14, padding:"11px 20px", borderRadius:9, textDecoration:"none", border:"1px solid #0a66c2" }}>{t("founder_cta_linkedin")}</a></div><button className="ghost-btn" style={{ marginTop:20 }} onClick={reset}>{t("btn_start_over")}</button>
        </div>
      </Layout>
    );
  }
  return null;
}
