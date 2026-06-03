import { useState, useEffect, useRef } from "react";

const LOGO_URL = "https://raw.githubusercontent.com/aliazad11/linkscore/main/logo.png";

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
  { text: "Analyzing your industry benchmarks...", duration: 1900 },
  { text: "Mapping your goal to proven strategies...", duration: 1800 },
  { text: "Identifying your content archetype...", duration: 1700 },
  { text: "Generating your post hooks...", duration: 2000 },
  { text: "Building your 30-day roadmap...", duration: 1800 },
  { text: "Calculating your LinkedIn Score...", duration: 1400 },
  { text: "Personalizing your recommendations...", duration: 2000 },
  { text: "Fine-tuning your content strategy...", duration: 1800 },
  { text: "Preparing your final report...", duration: 1600 },
];

function buildEmailHTML(firstName, plan) {
  const hooks = plan.post_hooks?.map((h,i) => `<li style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-left:3px solid #c8a96e;border-radius:4px;">${h}</li>`).join('') || '';
  const rules = plan.critical_rules?.slice(0,3).map(r => `<li style="margin-bottom:8px;">${r}</li>`).join('') || '';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#08080e;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <img src="https://raw.githubusercontent.com/aliazad11/linkscore/main/logo.png" alt="Linkedscore" style="height:36px;margin-bottom:32px;display:block;" />
    <h1 style="color:#f9fafb;font-size:26px;font-weight:800;margin-bottom:8px;">${firstName}, you are <span style="color:#c8a96e;">${plan.archetype}</span></h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:32px;">${plan.headline}</p>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">YOUR LINKEDIN SCORE</p>
      <p style="color:#f9fafb;font-size:48px;font-weight:800;margin:0 0 8px;">${plan.score}<span style="font-size:20px;color:#6b7280;">/100</span></p>
      <p style="color:#ef4444;font-size:13px;">${plan.urgency}</p>
    </div>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">YOUR 3 POST HOOKS</p>
      <ul style="list-style:none;padding:0;margin:0;">${hooks}</ul>
    </div>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:32px;">
      <p style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">3 CRITICAL RULES</p>
      <ul style="color:#9ca3af;font-size:14px;line-height:1.6;padding-left:20px;">${rules}</ul>
    </div>
    <a href="https://linkedscore.app" style="display:block;text-align:center;background:linear-gradient(135deg,#c8a96e,#a07840);color:#08080e;text-decoration:none;padding:16px;border-radius:14px;font-weight:700;font-size:15px;margin-bottom:24px;">View Your Full Plan →</a>
    <p style="color:#374151;font-size:12px;text-align:center;">You received this because you used Linkedscore. <br/>© 2025 Linkedscore</p>
  </div>
</body>
</html>`;
}

function buildPrompt(userData, answers, profileText, screenshotCount = 0, cohort = null, specialNote = "") {
  const profileSection = profileText
    ? `\nPROFILE PDF:\n${profileText}\n`
    : "";

  const sanitize = (s) => String(s || '').replace(/[\n\r]/g, ' ').replace(/"/g, "'").replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200);
  const answersText = Object.entries(answers).map(([k,v]) => {
    if (v && v.startsWith('Other: ')) {
      return `${k}: [user wrote: "${sanitize(v.replace('Other: ', '').trim())}"], treat as a prompt, analyze deeply`;
    }
    return `${k}: ${sanitize(v)}`;
  }).join('\n');

  const ssiText = (userData.establish_brand||userData.find_people||userData.engage_insights||userData.build_relationships)
    ? `SSI: Brand=${userData.establish_brand||"?"}/25 People=${userData.find_people||"?"}/25 Insights=${userData.engage_insights||"?"}/25 Relations=${userData.build_relationships||"?"}/25 Total=${parseInt(userData.establish_brand||0)+parseInt(userData.find_people||0)+parseInt(userData.engage_insights||0)+parseInt(userData.build_relationships||0)}/100`
    : "SSI: not provided";

  // Compact JSON schema, replace UPPER_CASE placeholders with real values
  const schema = `{"score":INT,"archetype":"STR","headline":"STR","urgency":"STR","profile_scores":{"headline":INT,"about":INT,"experience":INT,"overall":INT},"profile_fixes":["STR","STR","STR"],"content_strategy":{"post_frequency":"STR","best_posting_times":"STR","content_mix":"STR","hook_formula":"STR","content_types":"STR"},"post_hooks":["STR","STR","STR"],"content_calendar":[{"week":"Week 1","type":"POST","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 2","type":"ENGAGEMENT","topic":"STR","hook":null,"action":"STR"},{"week":"Week 3","type":"POST","topic":"STR","hook":"STR","action":"STR"},{"week":"Week 4","type":"ENGAGEMENT","topic":"STR","hook":null,"action":"STR"}],"critical_rules":["STR","STR","STR","STR","STR","STR"],"growth_tactics":["STR","STR","STR","STR"],"closing_message":"STR","thought_leader":{"available":${screenshotCount>0},"score":INT,"hook_score":INT,"engagement_score":INT,"voice_score":INT,"structure_score":INT,"analysis":"MAX_15_WORDS","improvements":["STR","STR","STR"]},"ssi_plan":{"available":${!!(userData.establish_brand||userData.find_people||userData.engage_insights||userData.build_relationships)},"total":INT,"overview":"STR","pillars":[{"name":"Establish Your Brand","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"},{"name":"Find the Right People","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"},{"name":"Engage with Insights","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"},{"name":"Build Relationships","score":INT,"status":"WEAK|AVERAGE|STRONG","advice":"STR"}]}}`;

  return `OUTPUT: raw JSON only, no markdown, no commentary.

USER:
Cohort: ${cohort||"Professional"}
Name: ${userData.firstName} ${userData.lastName} | Age: ${userData.age} | Title: ${userData.jobTitle}
${ssiText}
Answers:
${answersText}
${specialNote ? `Priority focus: ${specialNote}` : ""}
${profileSection}
${screenshotCount > 0 ? `POST SCREENSHOTS: ${screenshotCount} images attached. Set thought_leader.available=true, score all 4 sub-scores, analysis max 15 words, 3 specific improvements.` : `thought_leader.available=false`}
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

DIRECTIVE 5, MAKE THE CALENDAR OBEY THE CADENCE PHILOSOPHY: the 30-day calendar must reflect low-frequency publishing. Only the two POST weeks are real publishes; the two ENGAGEMENT weeks must be specific engagement activity that names who to engage with and how. Never output a post-every-week grid that contradicts the cadence advice.

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

STYLE: American English, no Oxford comma, and never use em dashes or long dashes anywhere in the generated copy. Use commas or periods instead.

Replace ALL schema values with hyper-specific content for this exact person. Zero generic advice.

HALLUCINATION GUARD, applies to every generation: only reference employers, job titles, schools, and biographical details that appear verbatim in the parsed profile text provided above. Never invent or infer company names, employers, schools, certifications, or metrics. If a relevant detail is absent, use a generic phrase such as 'a past role' instead of naming a company. If no profile text was provided, do not name any specific employer or school.

HOOKS, the three post_hooks must be structurally distinct from each other: make one a contrarian claim, one a short personal-observation hook, and one a question or a single data point. Never reuse the same template across all three. Never fabricate first-person facts of any kind, no invented anecdotes, results, metrics, follower counts, events, or posting cadences the user did not provide. If you need a concrete example, frame it as a template the user fills in, not as something they already did. Treat the hooks as editable drafts, not copy-paste-ready text.

TIMELINE CONSISTENCY, if the user states a timeframe or deadline anywhere in their answers or note, keep every week reference consistent with it. Either generate a roadmap that spans up to the stated date, or clearly state that it covers the first weeks of a longer runway. Never mix conflicting week counts within one plan.

SCHEMA:
${schema}`;
}


const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #08080e; }
  .page-enter { animation: pageEnter 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes pageEnter { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  .opt-row { display:flex; align-items:center; gap:14px; padding:14px 18px; border-radius:14px; background:#0d0d18; border:1px solid #1a1a2e; cursor:pointer; transition:all 0.2s ease; font-family:'DM Sans',sans-serif; width:100%; text-align:left; }
  .opt-row:hover { border-color:#c8a96e55; background:#0f0f1e; }
  .opt-row.selected { border-color:#c8a96e; background:rgba(200,169,110,0.07); transform:translateX(4px); }
  .primary-btn { width:100%; padding:15px 24px; border:none; border-radius:14px; background:linear-gradient(135deg,#c8a96e,#a07840); color:#08080e; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:all 0.2s; }
  .primary-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 40px rgba(200,169,110,0.25); }
  .primary-btn:disabled { background:#1a1a2e; color:#3a3a5a; cursor:not-allowed; }
  .ghost-btn { width:100%; padding:13px 24px; border:1px solid #1a1a2e; border-radius:14px; background:transparent; color:#4a4a6a; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s; }
  .ghost-btn:hover { border-color:#2a2a3e; color:#6a6a8a; }
  .tab-pill { padding:7px 16px; border-radius:100px; border:1px solid #1a1a2e; background:transparent; color:#4a4a6a; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; letter-spacing:0.5px; text-transform:uppercase; }
  .tab-pill:hover { border-color:#c8a96e44; color:#8a8a9a; }
  .tab-pill.active { border-color:#c8a96e; background:rgba(200,169,110,0.1); color:#c8a96e; }
  .card-block { background:#0d0d18; border:1px solid #1a1a2e; border-radius:16px; padding:20px; margin-bottom:12px; transition:border-color 0.2s; }
  .card-block:hover { border-color:#2a2a3e; }
  .field-input { width:100%; padding:13px 16px; background:#0d0d18; border:1px solid #1a1a2e; border-radius:12px; color:#e8e8f0; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:border-color 0.2s; }
  .field-input:focus { border-color:#c8a96e88; }
  .field-input.error { border-color:#ef444488; }
  .field-input::placeholder { color:#2a2a4a; }
  .progress-bar { height:1px; background:#1a1a2e; border-radius:4px; overflow:hidden; }
  .progress-fill { height:100%; background:linear-gradient(90deg,#c8a96e,#e8c98e); border-radius:4px; transition:width 0.5s ease; }
  .analysis-dot { animation:dotPulse 1.4s infinite; }
  @keyframes dotPulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .gold-rule { width:40px; height:1px; background:linear-gradient(90deg,transparent,#c8a96e,transparent); margin:0 auto 24px; }
  .section-reveal { animation:pageEnter 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
  .score-bar-fill { transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
  .pdf-drop { border:1.5px dashed #2a2a3e; border-radius:16px; padding:32px 20px; text-align:center; cursor:pointer; transition:all 0.2s; background:#0d0d18; }
  .pdf-drop:hover, .pdf-drop.dragover { border-color:#c8a96e; background:rgba(200,169,110,0.04); }
  .week-card { background:#0d0d18; border:1px solid #1a1a2e; border-radius:14px; padding:18px; margin-bottom:10px; position:relative; overflow:hidden; }
  .week-card.post { border-left:3px solid #c8a96e; }
  .week-card.engagement { border-left:3px solid #3a6a4a; }
`;

function Layout({ children }) {
  return (
    <div style={{ minHeight:"100vh", background:"#08080e", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", position:"relative", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position:"fixed", top:"-15%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-20%", left:"-10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(100,80,180,0.05) 0%, transparent 65%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:540, position:"relative", zIndex:2 }}>
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
      <img src={LOGO_URL} alt="Linkedscore" style={{ height:38, objectFit:"contain" }} />
    </div>
  );
}

function Badge({ children, color="#c8a96e" }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${color}12`, color, border:`1px solid ${color}30`, borderRadius:100, padding:"5px 14px", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:20 }}>
      {children}
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
  const [phase, setPhase] = useState("intro");
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
  const [userCount, setUserCount] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [cohort, setCohort] = useState(null);
  const planRef = useRef(null);
  const [specialNote, setSpecialNote] = useState("");
  const [otherText, setOtherText] = useState("");
  const [multiSelected, setMultiSelected] = useState([]);
  const [quizPhase, setQuizPhase] = useState("generic"); // "generic" | "cohort" | "note"
  const [pdfName, setPdfName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [industryOther, setIndustryOther] = useState("");
  const [postScreenshots, setPostScreenshots] = useState([null, null, null]);
  const [noPostsYet, setNoPostsYet] = useState(false);
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
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/plans?id=eq.${id}&select=*`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
            }
          });
          const data = await res.json();
          console.log("Plan fetch result:", data);
          if (data[0]?.plan_data) {
            const p = data[0].plan_data;
            // Ensure all required fields exist with fallbacks
            const safePlan = {
              score: p.score || 50,
              archetype: p.archetype || "LinkedIn Professional",
              headline: p.headline || "",
              urgency: p.urgency || "",
              profile_scores: p.profile_scores || { headline: 50, about: 50, experience: 50, overall: 50 },
              profile_fixes: p.profile_fixes || [],
              content_strategy: p.content_strategy || {},
              post_hooks: p.post_hooks || [],
              content_calendar: p.content_calendar || [],
              critical_rules: p.critical_rules || [],
              growth_tactics: p.growth_tactics || [],
              closing_message: p.closing_message || "",
              thought_leader: p.thought_leader || { available: false, score: 0, hook_score: 0, engagement_score: 0, voice_score: 0, structure_score: 0, analysis: "", improvements: [] },
              ...p
            };
            setPlan(safePlan);
            setUserData(d => ({ ...d, firstName: data[0].first_name || "there" }));
            setPhase("result");
          } else {
            console.log("No plan found for id:", id);
          }
        } catch(e) { console.log("Plan load error:", e); }
      };
      loadPlan();
    }
  }, []);

  useEffect(() => {
    // Fetch real user count from Supabase
    const fetchCount = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=count`, {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
            "Prefer": "count=exact",
            "Range": "0-0"
          }
        });
        const countHeader = res.headers.get("content-range");
        if (countHeader) {
          const total = parseInt(countHeader.split("/")[1]);
          // Add a base number to make it feel more established
          setUserCount(total >= 0 ? total + 47 : 47);
        } else {
          setUserCount(47);
        }
      } catch(e) { console.log("Count error:", e); }
    };
    fetchCount();
  }, []);

  useEffect(() => {
    if (phase !== "analyzing") return;
    let step = 0, elapsed = 0;
    const total = ANALYSIS_STEPS.reduce((s,a)=>s+a.duration,0);
    const run = () => {
      // If plan is ready, go to paywall immediately
      if (planRef.current) { setTimeout(()=>setPhase("paywall"), 500); return; }
      // If we've finished all steps but plan not ready yet, stay on last step and pulse
      if (step >= ANALYSIS_STEPS.length) {
        setAnalysisStep(ANALYSIS_STEPS.length - 1);
        setTimeout(() => { if (planRef.current) { setTimeout(()=>setPhase("paywall"), 500); } else { run(); } }, 800);
        return;
      }
      setAnalysisStep(step);
      const dur = ANALYSIS_STEPS[step].duration;
      elapsed += dur;
      const targetPct = Math.min(90, Math.round((elapsed/total)*100));
      const iv = setInterval(()=>setAnalysisProgress(p => Math.min(targetPct, p+1)),40);
      setTimeout(()=>{ clearInterval(iv); step++; run(); }, dur);
    };
    run();
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

  const QUESTIONS = getQuestionsForCohort(cohort);
  const q = QUESTIONS[currentQ];

  const handleNext = () => {
    if (q.multiSelect ? multiSelected.length === 0 : !selected) return;
    // Read otherText from DOM directly in case React state is stale
    const otherInputEl = document.querySelector('input[placeholder*="Describe your specific"]');
    const currentOtherText = otherInputEl?.value || otherText;

    let finalAnswer;
    if (q.multiSelect) {
      const hasOther = multiSelected.includes("Other / Something else");
      const others = multiSelected.filter(x => x !== "Other / Something else");
      finalAnswer = hasOther && currentOtherText.trim()
        ? [...others, `Other: ${currentOtherText.trim()}`].join(", ")
        : multiSelected.join(", ");
    } else {
      finalAnswer = selected === "Other / Something else" && currentOtherText.trim()
        ? `Other: ${currentOtherText.trim()}`
        : selected;
    }
    const a = {...answers, [q.id]:finalAnswer};
    setAnswers(a);
    setSelected(null); setOtherText(""); setMultiSelected([]);
    // If industry is "Other", show custom input
    if (q.id === "industry" && selected === "Other") {
      setPhase("industry_other");
      return;
    }
    // If PDF uploaded, skip industry and experience questions
    const skipIds = pdfText ? ["industry", "experience"] : [];
    let nextQ = currentQ + 1;
    while (nextQ < QUESTIONS.length && skipIds.includes(QUESTIONS[nextQ].id)) {
      // Pre-fill skipped answers with "From PDF"
      a[QUESTIONS[nextQ].id] = "Extracted from LinkedIn PDF";
      nextQ++;
    }
    setAnswers(a);
    if (nextQ < QUESTIONS.length) setCurrentQ(nextQ);
    else setPhase("note");
  };

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
    messageContent.push({ type:"text", text:buildPrompt(user, ans, profileText, validScreenshots.length, cohort, specialNote) });
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
    return data.planId;
  };

  const handlePaywall = async () => {
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
      setPlan(result);

      // Save user to Supabase (counter)
      let savedPlanId = null;
      try {
        const userRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            email,
            first_name: userData.firstName,
            job_title: userData.jobTitle,
            linkedin_url: userData.linkedinUrl
          })
        });
      } catch(e) { console.log("Supabase user error:", e); }

      // Save plan to Supabase and get unique ID
      try {
        const planRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/plans`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            email,
            first_name: userData.firstName,
            plan_data: result,
            cohort: cohort||null,
            quiz_answers: answers,
            special_note: specialNote||null,
            ssi_scores: {
              establish_brand: userData.establish_brand||null,
              find_people: userData.find_people||null,
              engage_insights: userData.engage_insights||null,
              build_relationships: userData.build_relationships||null
            }
          })
        });
        const planData = await planRes.json();
        savedPlanId = planData[0]?.id;
        if (savedPlanId) setPlanId(savedPlanId);
      } catch(e) { console.log("Supabase plan error:", e); }

      // Send email via serverless function
      console.log("Sending email with planId:", savedPlanId);
      try {
        const emailRes = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: userData.firstName,
            plan: result,
            planId: savedPlanId
          })
        });
        const emailData = await emailRes.json();
        console.log("Email response:", emailData);
      } catch(e) { console.log("Email error:", e); }

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

  const handlePDF = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      // Limit to 400KB base64 to avoid request size limits
      const limited = base64.slice(0, 300000);
      setPdfText(`PDF_BASE64:${limited}`);
    };
    reader.readAsDataURL(file);
  };

  const handlePostScreenshot = (index, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...postScreenshots];
      updated[index] = { file, preview: e.target.result, base64: e.target.result.split(",")[1], type: file.type };
      setPostScreenshots(updated);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setPlan(null); planRef.current = null; setUserData({firstName:"",lastName:"",age:"",jobTitle:"",linkedinUrl:"",establish_brand:"",find_people:"",engage_insights:"",build_relationships:""}); setCohort(null); setSpecialNote(""); setQuizPhase("generic");; setEmail(""); setSelected(null); setOtherText(""); setMultiSelected([]); setPdfText(""); setPdfName(""); setPostScreenshots([null,null,null]); setNoPostsYet(false); };

  const skipIds = pdfText ? ["industry", "experience"] : [];
  const effectiveTotal = QUESTIONS.length - skipIds.length;
  const effectiveCurrent = QUESTIONS.slice(0, currentQ).filter(q => !skipIds.includes(q.id)).length;
  const progress = (effectiveCurrent/effectiveTotal)*100;

  const s = {
    h1: { color:"#F9FAFB", fontSize:32, fontWeight:800, lineHeight:1.2, marginBottom:12, letterSpacing:-0.5 },
    sub: { color:"#6B7280", fontSize:14, lineHeight:1.7, marginBottom:28 },
    label: { color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 },
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

  if (phase==="cohort") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <h2 style={{ ...s.h1, fontSize:26, marginBottom:8 }}>Which best describes you?</h2>
        <p style={{ ...s.sub, marginBottom:28 }}>This shapes your entire plan, be honest.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
          {COHORTS.map(c => (
            <button key={c.id}
              onClick={()=>{ setCohort(c.id); setPhase("form"); }}
              style={{
                background: cohort===c.id ? "rgba(200,169,110,0.15)" : "#0d0d18",
                border: cohort===c.id ? "1px solid #c8a96e" : "1px solid #1a1a2e",
                borderRadius:14, padding:"14px 18px",
                display:"flex", alignItems:"center", gap:14,
                cursor:"pointer", textAlign:"left", transition:"all 0.2s"
              }}
            >
              <span style={{ fontSize:22, flexShrink:0 }}>{c.emoji}</span>
              <div>
                <p style={{ color:"#F9FAFB", fontSize:15, fontWeight:700, marginBottom:2 }}>{c.label}</p>
                <p style={{ color:"#3a3a5a", fontSize:12 }}>{c.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );

  if (phase==="intro") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo />
        <Badge>LinkedIn Intelligence</Badge>
        <h1 style={s.h1}>{cohort ? COHORT_HEADLINES[cohort] : <><span>Your LinkedIn is</span><br /><span style={{ color:"#c8a96e" }}>invisible.</span></>}</h1>
        <div className="gold-rule" />
        <p style={{ ...s.sub, maxWidth:380, margin:"0 auto 32px" }}>Upload your LinkedIn profile. Answer a few questions. Get a strategy built entirely around you.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32, textAlign:"left" }}>
          {["Personalized LinkedIn Score","Profile section-by-section scoring","3 custom post hooks for your voice","30-day content calendar","Critical algorithm rules"].map((f,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:"#c8a96e", fontSize:11 }}>◆</span>
              <span style={{ color:"#4a4a6a", fontSize:13 }}>{f}</span>
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={()=>setPhase(cohort ? "form" : "cohort")}>Begin Your Analysis →</button>
        {userCount !== null && <p style={{ color:"#c8a96e", fontSize:13, marginBottom:8, fontWeight:600 }}>✦ {userCount.toLocaleString()} professionals got their plan</p>}
        <p style={{ color:"#2a2a3a", fontSize:10, marginTop:12, letterSpacing:0.8 }}>10 MINUTES · COMPLETELY FREE</p>
      </div>
    </Layout>
  );

  // ── FORM ───────────────────────────────────────────────────────────────────
  if (phase==="form") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge>Step 1 of 3, About You</Badge>
        <h2 style={{ ...s.h1, fontSize:26 }}>Let's make this personal.</h2>
        <p style={{ ...s.sub }}>We need a few details to tailor your plan.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["firstName","First Name","John"],["lastName","Last Name","Smith"]].map(([k,l,p])=>(
              <div key={k}>
                <label style={s.label}>{l}</label>
                <input className={`field-input${formErrors[k]?" error":""}`} value={userData[k]} onChange={e=>setUserData({...userData,[k]:e.target.value})} placeholder={p} />
                {formErrors[k]&&<p style={s.err}>{formErrors[k]}</p>}
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:12 }}>
            <div>
              <label style={s.label}>Age</label>
              <input className={`field-input${formErrors.age?" error":""}`} type="number" value={userData.age} onChange={e=>setUserData({...userData,age:e.target.value})} placeholder="28" />
              {formErrors.age&&<p style={s.err}>{formErrors.age}</p>}
            </div>
            <div>
              <label style={s.label}>Current Title</label>
              <input className={`field-input${formErrors.jobTitle?" error":""}`} value={userData.jobTitle} onChange={e=>setUserData({...userData,jobTitle:e.target.value})} placeholder="Marketing Manager" />
              {formErrors.jobTitle&&<p style={s.err}>{formErrors.jobTitle}</p>}
            </div>
          </div>
          <div>
            <label style={s.label}>LinkedIn Profile URL</label>
            <input className={`field-input${formErrors.linkedinUrl?" error":""}`} value={userData.linkedinUrl} onChange={e=>setUserData({...userData,linkedinUrl:e.target.value})} placeholder="linkedin.com/in/yourname" />
            {formErrors.linkedinUrl&&<p style={s.err}>{formErrors.linkedinUrl}</p>}
          </div>
          <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:14, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>📊</span>
              <label style={{ ...s.label, margin:0 }}>LinkedIn SSI Score <span style={{ color:"#3a3a5a", fontWeight:400 }}>(optional)</span></label>
            </div>
            <p style={{ color:"#2a2a3a", fontSize:11, marginBottom:12 }}>Find your scores at <a href="https://linkedin.com/sales/ssi" target="_blank" rel="noreferrer" style={{ color:"#c8a96e" }}>linkedin.com/sales/ssi</a>, each pillar is scored 0–25</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                ["establish_brand", "Establish Your Brand"],
                ["find_people", "Find the Right People"],
                ["engage_insights", "Engage with Insights"],
                ["build_relationships", "Build Relationships"],
              ].map(([key, label]) => (
                <div key={key}>
                  <p style={{ color:"#4a4a6a", fontSize:11, marginBottom:4 }}>{label}</p>
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
          <button className="primary-btn" onClick={()=>{ if(validate()) setPhase("pdf_upload"); }}>Continue →</button>
        </div>
      </div>
    </Layout>
  );

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (phase==="quiz") return (
    <Layout>
      <div className="page-enter" key={currentQ}>
        <Logo />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <Badge color="#6a5a9a">Step 3 of 3, {q.phase}</Badge>
          <span style={{ color:"#2a2a4a", fontSize:12 }}>{Math.min(currentQ + 1, QUESTIONS.length)} / {QUESTIONS.length}</span>
        </div>
        <div className="progress-bar" style={{ marginBottom:24 }}>
          <div className="progress-fill" style={{ width:`${progress}%` }} />
        </div>
        <h2 style={{ color:"#F9FAFB", fontSize:22, fontWeight:800, marginBottom:8, lineHeight:1.3 }}>{q.question}</h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:22 }}>{q.subtitle}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:22 }}>
          {q.multiSelect && <p style={{ color:"#3a3a5a", fontSize:11, marginBottom:4 }}>Select all that apply</p>}
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
                <span style={{ fontSize:18, flexShrink:0 }}>{opt.emoji}</span>
                <span style={{ color:isActive?"#c8a96e":"#6a6a8a", fontSize:14, fontWeight:isActive?600:400, flex:1 }}>{opt.label}</span>
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
              placeholder="Describe your specific situation in detail, the more you write, the more accurate your plan will be..."
              value={otherText}
              onChange={e=>setOtherText(e.target.value)}
              maxLength={500}
              style={{ width:"100%", minHeight:90, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:12, padding:"12px 14px", color:"#F9FAFB", fontSize:14, lineHeight:1.6, resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
            />
            <p style={{ color:"#2a2a3a", fontSize:11, textAlign:"right", marginTop:4 }}>{otherText.length}/500</p>
          </div>
        )}
        <button className="primary-btn" disabled={
          q.multiSelect
            ? multiSelected.length === 0
            : !selected
        } onClick={handleNext}>
          {currentQ+1===QUESTIONS.length?"Almost Done →":"Continue →"}
        </button>
      </div>
    </Layout>
  );

  // ── INDUSTRY OTHER ─────────────────────────────────────────────────────────
  if (phase==="industry_other") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge color="#6a5a9a">Your World</Badge>
        <h2 style={{ color:"#F9FAFB", fontSize:22, fontWeight:800, marginBottom:8 }}>What industry are you in?</h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:24 }}>Tell us more so we can tailor your strategy.</p>
        <input
          className="field-input"
          value={industryOther}
          onChange={e=>setIndustryOther(e.target.value)}
          placeholder="e.g. Architecture, Education, Logistics..."
          style={{ marginBottom:20 }}
        />
        <button className="primary-btn" disabled={!industryOther.trim()} onClick={()=>{
          setAnswers(a=>({...a, industry: industryOther.trim()}));
          setPhase("quiz");
          setCurrentQ(q=>q+1);
        }}>Continue →</button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>{ setPhase("quiz"); setSelected(null); setOtherText(""); setMultiSelected([]); }}>← Back</button>
      </div>
    </Layout>
  );

  // ── PDF UPLOAD ─────────────────────────────────────────────────────────────
  if (phase==="pdf_upload") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge>Step 2 of 3, Your Profile</Badge>
        <h2 style={{ ...s.h1, fontSize:26 }}>Upload your LinkedIn PDF.</h2>
        <p style={{ ...s.sub }}>This makes your plan 3x more accurate. Go to your LinkedIn profile → click <strong style={{ color:"#c8a96e" }}>Resources</strong> → <strong style={{ color:"#c8a96e" }}>Save to PDF</strong>. Takes 10 seconds.</p>
        <div
          className={`pdf-drop${isDragging?" dragover":""}`}
          onClick={()=>fileInputRef.current?.click()}
          onDragOver={e=>{ e.preventDefault(); setIsDragging(true); }}
          onDragLeave={()=>setIsDragging(false)}
          onDrop={e=>{ e.preventDefault(); setIsDragging(false); handlePDF(e.dataTransfer.files[0]); }}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>handlePDF(e.target.files[0])} />
          {pdfName ? (
            <div>
              <p style={{ color:"#c8a96e", fontSize:14, fontWeight:700, marginBottom:4 }}>✓ {pdfName}</p>
              <p style={{ color:"#4a4a6a", fontSize:12 }}>{pdfText ? "Profile analyzed successfully" : "Reading profile..."}</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize:28, marginBottom:12 }}>📄</p>
              <p style={{ color:"#6a6a8a", fontSize:14, fontWeight:600, marginBottom:4 }}>Drop your LinkedIn PDF here</p>
              <p style={{ color:"#3a3a4a", fontSize:12 }}>or click to browse</p>
            </div>
          )}
        </div>
        <p style={{ color:"#2a2a3a", fontSize:11, textAlign:"center", marginTop:10, marginBottom:24 }}>We don't store your PDF. We process the text to build your plan and don't keep it.</p>
        <button className="primary-btn" onClick={()=>setPhase("quiz")}>
          {pdfName?"Continue to Questions →":"Skip & Continue →"}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>setPhase("form")}>← Back</button>
      </div>
    </Layout>
  );

  // ── SPECIAL NOTE ──────────────────────────────────────────────────────────
  if (phase==="note") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge>Almost There</Badge>
        <h2 style={{ ...s.h1, fontSize:24, marginBottom:8 }}>Anything specific we should know?</h2>
        <p style={{ ...s.sub, marginBottom:20 }}>A job interview in 30 days? A product launch coming up? A specific person you want to impress? Tell us, this makes your plan dramatically more accurate.</p>
        <textarea
          value={specialNote}
          onChange={e=>setSpecialNote(e.target.value)}
          placeholder="e.g. I have a final round interview at Google in 3 weeks and need to build credibility fast..."
          style={{
            width:"100%", minHeight:120, background:"#0d0d18",
            border:"1px solid #1a1a2e", borderRadius:12,
            padding:"14px 16px", color:"#F9FAFB", fontSize:14,
            lineHeight:1.6, resize:"vertical", fontFamily:"inherit",
            outline:"none", boxSizing:"border-box", marginBottom:16
          }}
          maxLength={500}
        />
        <p style={{ color:"#2a2a3a", fontSize:11, textAlign:"right", marginBottom:20 }}>{specialNote.length}/500</p>
        <button className="primary-btn" onClick={()=>setPhase("post_screenshots")}>
          {specialNote ? "Got it →" : "Skip & Continue →"}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>{ setCurrentQ(QUESTIONS.length-1); setPhase("quiz"); }}>← Back</button>
      </div>
    </Layout>
  );

  // ── POST SCREENSHOTS ──────────────────────────────────────────────────────
  if (phase==="post_screenshots") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge>Step 3 of 3, Your Posts</Badge>
        <h2 style={{ color:"#F9FAFB", fontSize:22, fontWeight:800, marginBottom:8 }}>Upload screenshots of your last 3 posts.</h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:24 }}>This unlocks your Thought Leader Score and makes your hooks much more specific to what already works for you.</p>
        
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
                        <p style={{ color:"#c8a96e", fontSize:13, fontWeight:700 }}>✓ Post {i+1} uploaded</p>
                        <p style={{ color:"#3a3a5a", fontSize:11 }}>Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize:20 }}>📸</span>
                      <div>
                        <p style={{ color:"#4a4a6a", fontSize:13, fontWeight:600 }}>Post {i+1}</p>
                        <p style={{ color:"#2a2a3a", fontSize:11 }}>Click to upload screenshot</p>
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
          <p style={{ color:noPostsYet?"#c8a96e":"#4a4a6a", fontSize:13, fontWeight:noPostsYet?600:400 }}>I haven't posted on LinkedIn yet</p>
        </div>

        <button className="primary-btn" onClick={()=>{
          setPhase("analyzing");
          // Start API call immediately parallel to animation
          callAPI(userData, answers, pdfText, noPostsYet ? [] : postScreenshots, cohort, specialNote)
            .then(id => { planRef.current = id; setPlanId(id); })
            .catch(err => { planRef.current = {_error: err.message}; });
        }}>
          {postScreenshots.some(s=>s!==null)||noPostsYet ? "Analyze Everything →" : "Skip & Continue →"}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>setPhase("pdf_upload")}>← Back</button>
      </div>
    </Layout>
  );

  // ── ANALYZING ──────────────────────────────────────────────────────────────
  if (phase==="analyzing") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo />
        <h2 style={{ color:"#F9FAFB", fontSize:24, fontWeight:700, marginBottom:8 }}>
          {`Analyzing, ${userData.firstName}...`}
        </h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:32 }}>Building your plan, this takes 30 to 60 seconds.</p>
        <div style={{ background:"#0F1117", borderRadius:100, height:4, marginBottom:16, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${analysisProgress}%`, background:"linear-gradient(90deg,#c8a96e,#e8c98e)", borderRadius:100, transition:"width 0.3s ease" }} />
        </div>
        <p style={{ color:"#3a3a5a", fontSize:12, marginBottom:28 }}>{analysisProgress}% complete</p>
        <div style={{ textAlign:"left", display:"flex", flexDirection:"column", gap:10 }}>
          {ANALYSIS_STEPS.map((step,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:i<=analysisStep?"#c8a96e":"#1a1a2e", flexShrink:0, transition:"background 0.3s" }} className={i===analysisStep?"analysis-dot":""} />
              <span style={{ color:i<=analysisStep?"#6a6a8a":"#2a2a3a", fontSize:13 }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );

  // ── PAYWALL ────────────────────────────────────────────────────────────────
  if (phase==="paywall") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo />
        <Badge color="#10b981">Analysis Complete</Badge>
        <h2 style={{ ...s.h1, fontSize:28 }}>Your plan is ready,<br /><span style={{ color:"#c8a96e" }}>{userData.firstName}.</span></h2>
        <div className="gold-rule" />
        <p style={{ ...s.sub, marginBottom:24 }}>Enter your email to unlock your full personalized LinkedIn strategy.</p>
        <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:20, marginBottom:24, textAlign:"left" }}>
          <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Your plan includes</p>
          {["LinkedIn Score & personal archetype","Profile scoring: headline, about, experience","3 custom post hooks written for your voice","30-day content calendar with exact topics","Critical algorithm rules you're probably breaking","Full growth tactics for your specific goal"].map((item,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ color:"#c8a96e", fontSize:10 }}>◆</span>
              <span style={{ color:"#4a4a6a", fontSize:13 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14, textAlign:"left" }}>
          <label style={s.label}>Email Address</label>
          <input className={`field-input${emailError?" error":""}`} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&handlePaywall()} />
          {emailError&&<p style={s.err}>{emailError}</p>}
        </div>
        <button className="primary-btn" disabled={loading} onClick={handlePaywall}>
          {loading?"Generating your plan...":"Unlock My LinkedIn Plan →"}
        </button>
        <p style={{ color:"#1a1a2a", fontSize:10, marginTop:10, letterSpacing:0.8 }}>NO SPAM · NO CREDIT CARD · JUST YOUR PLAN</p>
      </div>
    </Layout>
  );

  // ── GENERATING ─────────────────────────────────────────────────────────────
  if (phase==="generating") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo />
        <h2 style={{ color:"#F9FAFB", fontSize:24, fontWeight:700, marginBottom:8 }}>Almost there...</h2>
        <p style={{ color:"#3a3a5a", fontSize:13 }}>Generating your personalized plan.</p>
      </div>
    </Layout>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase==="result"&&plan) {
    const TABS = ["Overview","Profile","Thought Leader","SSI Analysis","Content","Hooks","Calendar","Rules"];
    return (
      <Layout>
        <div className="page-enter" style={{ paddingBottom:40 }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <Logo />
            <Badge>Your LinkedIn Plan</Badge>
            <h1 style={{ ...s.h1, fontSize:28 }}>
              {userData.firstName}, you are<br />
              <span style={{ color:"#c8a96e", fontWeight:800 }}>{plan.archetype}</span>
            </h1>
            <div className="gold-rule" />
            <p style={{ color:"#4a4a6a", fontSize:13, lineHeight:1.7 }}>{plan.headline}</p>
          </div>

          {/* Scores Row */}
          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            {/* LinkedIn Score */}
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:14, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"16px" }}>
              <ScoreRing score={plan.score} />
              <div>
                <p style={{ color:"#2a2a4a", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>LinkedIn Score</p>
                <p style={{ color:"#F9FAFB", fontSize:13, fontWeight:700, marginBottom:3 }}>{plan.score<40?"Needs work":plan.score<70?"Good foundation":"Strong profile"}</p>
                <p style={{ color:"#ef4444", fontSize:11, lineHeight:1.4, opacity:0.8 }}>{plan.urgency}</p>
              </div>
            </div>
            {/* Thought Leader Score */}
            {plan.thought_leader?.available ? (
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:14, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"16px" }}>
                <ScoreRing score={plan.thought_leader.score} color="#a78bfa" />
                <div>
                  <p style={{ color:"#2a2a4a", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>Thought Leader</p>
                  <p style={{ color:"#F9FAFB", fontSize:13, fontWeight:700, marginBottom:3 }}>{plan.thought_leader.score<40?"Early stage":plan.thought_leader.score<70?"Growing voice":"Strong presence"}</p>
                  <p style={{ color:"#a78bfa", fontSize:11, lineHeight:1.4, opacity:0.8 }}>{plan.thought_leader.analysis?.slice(0,120)}{plan.thought_leader.analysis?.length>120?"…":""}</p>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:12, background:"#0d0d18", border:"1px dashed #1a1a2e", borderRadius:16, padding:"16px", cursor:"pointer" }} onClick={()=>setPhase("post_screenshots")}>
                <div style={{ width:52, height:52, borderRadius:"50%", border:"2px dashed #2a2a4a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>📸</div>
                <div>
                  <p style={{ color:"#2a2a4a", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>Thought Leader</p>
                  <p style={{ color:"#4a4a6a", fontSize:12, fontWeight:600, marginBottom:3 }}>Not calculated</p>
                  <p style={{ color:"#3a3a5a", fontSize:11 }}>Upload posts to unlock</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile section scores */}
          {plan.profile_scores && (
            <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:20, marginBottom:20 }}>
              <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Profile Section Scores</p>
              {[["Headline", plan.profile_scores.headline],["About Section", plan.profile_scores.about],["Experience", plan.profile_scores.experience]].map(([label,score])=>(
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:"#6a6a8a", fontSize:13 }}>{label}</span>
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
            {TABS.map((t,i)=>{
              const isThoughtLocked = t==="Thought Leader" && !plan.thought_leader?.available;
              const isSSILocked = t==="SSI Analysis" && !plan.ssi_plan?.available;
              const locked = isThoughtLocked || isSSILocked;
              const lockMsg = isThoughtLocked ? "Upload posts to unlock" : "Add SSI scores to unlock";
              return (
                <div key={i} style={{ position:"relative" }} className="tab-tooltip-wrap">
                  <button
                    className={`tab-pill${activeSection===i?" active":""}`}
                    style={{ opacity: locked ? 0.45 : 1, cursor: locked ? "not-allowed" : "pointer" }}
                    onClick={()=>{ if(!locked) setActiveSection(i); }}
                  >
                    {locked && <span style={{ marginRight:4, fontSize:10 }}>🔒</span>}{t}
                  </button>
                  {locked && (
                    <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)", background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:8, padding:"4px 10px", whiteSpace:"nowrap", fontSize:11, color:"#6a6a8a", pointerEvents:"none", zIndex:10 }}>
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
                  <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Personal Message</p>
                  <p style={{ color:"#8a8a9a", fontSize:14, lineHeight:1.8 }}>"{plan.closing_message}"</p>
                </div>
                {plan.growth_tactics?.map((t,i)=>(
                  <div key={i} className="card-block" style={{ display:"flex", gap:12 }}>
                    <span style={{ color:"#c8a96e", fontSize:12, flexShrink:0, marginTop:2 }}>→</span>
                    <p style={{ color:"#6a6a8a", fontSize:14, lineHeight:1.6 }}>{t}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Profile */}
            {activeSection===1 && (
              <div>
                {plan.profile_fixes?.map((fix,i)=>(
                  <div key={i} className="card-block" style={{ display:"flex", gap:14 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(200,169,110,0.1)", border:"1px solid #c8a96e33", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#c8a96e", fontSize:11, fontWeight:700 }}>{i+1}</div>
                    <p style={{ color:"#6a6a8a", fontSize:14, lineHeight:1.6 }}>{fix}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Thought Leader */}
            {activeSection===2 && (
              <div>
                {plan.thought_leader?.available ? (
                  <>
                    <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Thought Leader Analysis</p>
                    {[["Hook Quality",plan.thought_leader.hook_score],["Engagement",plan.thought_leader.engagement_score],["Voice Consistency",plan.thought_leader.voice_score],["Post Structure",plan.thought_leader.structure_score]].map(([label,score])=>(
                      <div key={label} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ color:"#6a6a8a", fontSize:13 }}>{label}</span>
                          <span style={{ color:score<40?"#ef4444":score<70?"#f59e0b":"#10b981", fontSize:13, fontWeight:700 }}>{score}/100</span>
                        </div>
                        <div style={{ height:4, background:"#1a1a2e", borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${score}%`, background:score<40?"#ef4444":score<70?"#f59e0b":"#10b981", borderRadius:4, transition:"width 1.2s ease" }} />
                        </div>
                      </div>
                    ))}
                    <p style={{ color:"#4a4a6a", fontSize:13, lineHeight:1.6, marginTop:14, paddingTop:14, borderTop:"1px solid #1a1a2e", marginBottom:20 }}>{plan.thought_leader.analysis}</p>
                    <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>How To Improve</p>
                    {plan.thought_leader.improvements?.map((tip,i)=>(
                      <div key={i} className="card-block" style={{ display:"flex", gap:14 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(167,139,250,0.1)", border:"1px solid #a78bfa33", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#a78bfa", fontSize:12, fontWeight:700 }}>{i+1}</div>
                        <p style={{ color:"#6a6a8a", fontSize:14, lineHeight:1.6 }}>{tip}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <p style={{ fontSize:32, marginBottom:12 }}>📸</p>
                    <p style={{ color:"#4a4a6a", fontSize:15, fontWeight:600, marginBottom:8 }}>No post screenshots uploaded</p>
                    <p style={{ color:"#2a2a3a", fontSize:13, lineHeight:1.6 }}>Retake the quiz and upload your last 3 posts to unlock your Thought Leader analysis.</p>
                  </div>
                )}
              </div>
            )}

            {/* SSI Analysis */}
            {activeSection===3 && (
              <div>
                {plan.ssi_plan?.available ? (
                  <>
                    <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>SSI Overview</p>
                    <div className="card-block" style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ width:52, height:52, borderRadius:"50%", border:"3px solid #38bdf8", display:"flex", alignItems:"center", justifyContent:"center", color:"#38bdf8", fontSize:18, fontWeight:800, flexShrink:0 }}>{plan.ssi_plan.total}</div>
                        <p style={{ color:"#6a6a8a", fontSize:14, lineHeight:1.6 }}>{plan.ssi_plan.overview}</p>
                      </div>
                    </div>
                    <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Pillar Analysis</p>
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
                          <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.6 }}>{pillar.advice}</p>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <p style={{ fontSize:32, marginBottom:12 }}>📊</p>
                    <p style={{ color:"#4a4a6a", fontSize:15, fontWeight:600, marginBottom:8 }}>No SSI scores provided</p>
                    <p style={{ color:"#2a2a3a", fontSize:13, lineHeight:1.6 }}>Add your 4 SSI pillar scores in the form to unlock your personalized SSI analysis.</p>
                  </div>
                )}
              </div>
            )}

            {/* Content Strategy */}
            {activeSection===4 && (
              <div>
                {[["Post Frequency",plan.content_strategy?.post_frequency],["Best Posting Times",plan.content_strategy?.best_posting_times],["Content Mix",plan.content_strategy?.content_mix],["Hook Formula",plan.content_strategy?.hook_formula],["Formats to Use",plan.content_strategy?.content_types]].map(([label,val],i)=>(
                  <div key={i} className="card-block">
                    <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{label}</p>
                    <p style={{ color:"#6a6a8a", fontSize:14, lineHeight:1.6 }}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Post Hooks */}
            {activeSection===5 && (
              <div>
                <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>3 Custom Post Hooks, Written For Your Voice</p>
                {plan.post_hooks?.map((hook,i)=>(
                  <div key={i} style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:14, padding:20, marginBottom:10, borderLeft:"3px solid #c8a96e" }}>
                    <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:8 }}>HOOK {i+1}</p>
                    <p style={{ color:"#e8e8f0", fontSize:15, lineHeight:1.6, fontWeight:500 }}>{hook}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar */}
            {activeSection===6 && (
              <div>
                <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Your 30-Day Roadmap</p>
                {plan.content_calendar?.map((w,i)=>(
                  <div key={i} className={`week-card ${w.type?.toLowerCase()}`}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <p style={{ color:w.type==="POST"?"#c8a96e":"#4a9a6a", fontSize:10, fontWeight:700, letterSpacing:1.5 }}>{w.week} · {w.type}</p>
                      {w.type==="POST"&&<span style={{ background:"rgba(200,169,110,0.1)", color:"#c8a96e", fontSize:10, padding:"2px 8px", borderRadius:100 }}>Publish Day</span>}
                    </div>
                    <p style={{ color:"#e8e8f0", fontSize:14, fontWeight:600, marginBottom:6 }}>{w.topic}</p>
                    <p style={{ color:"#4a4a6a", fontSize:13, lineHeight:1.5 }}>{w.action}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Rules */}
            {activeSection===7 && (
              <div>
                <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Critical Rules, Don't Break These</p>
                {plan.critical_rules?.map((rule,i)=>(
                  <div key={i} className="card-block" style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>⚠</span>
                    <p style={{ color:"#6a6a8a", fontSize:14, lineHeight:1.6 }}>{rule}</p>
                  </div>
                ))}
              </div>
            )}

          </div>





          <button className="ghost-btn" style={{ marginTop:20 }} onClick={reset}>Start Over</button>
        </div>
      </Layout>
    );
  }
  return null;
}
