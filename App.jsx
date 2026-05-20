import { useState, useEffect, useRef } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "goal", phase: "Your Ambition",
    question: "What brings you here today?",
    subtitle: "Be honest with yourself — this shapes everything we build together.",
    options: [
      { label: "Land a better job or get headhunted", emoji: "🎯" },
      { label: "Build my personal brand & become known", emoji: "✦" },
      { label: "Attract clients or business opportunities", emoji: "💼" },
      { label: "Grow my network in my industry", emoji: "🌐" },
      { label: "Get promoted or recognized internally", emoji: "🏆" },
    ],
  },
  {
    id: "current_status", phase: "Your Reality",
    question: "How active are you on LinkedIn right now?",
    subtitle: "No judgment here — everyone starts somewhere.",
    options: [
      { label: "Ghost account — I barely log in", emoji: "👻" },
      { label: "I scroll but never post", emoji: "👁️" },
      { label: "I posted once or twice and gave up", emoji: "📝" },
      { label: "I post sometimes but get zero traction", emoji: "📉" },
      { label: "I'm active but not growing", emoji: "🔄" },
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
    ],
  },
  {
    id: "content_struggle", phase: "Your Obstacle",
    question: "What stops you from posting consistently?",
    subtitle: "Pick the one that hits hardest.",
    options: [
      { label: "I don't know what to write about", emoji: "🤷" },
      { label: "I'm scared of being judged", emoji: "😰" },
      { label: "I write drafts but never post them", emoji: "🗂️" },
      { label: "I post but nobody engages", emoji: "🦗" },
      { label: "I simply don't have the time", emoji: "⏰" },
    ],
  },
  {
    id: "content_style", phase: "Your Voice",
    question: "Which style feels most natural to you?",
    subtitle: "Your authentic voice is your biggest competitive advantage.",
    options: [
      { label: "Sharing lessons from my own experiences", emoji: "📖" },
      { label: "Analytical takes and data-backed opinions", emoji: "📊" },
      { label: "Controversial or bold industry opinions", emoji: "🔥" },
      { label: "Practical tips and how-tos", emoji: "🛠️" },
      { label: "Personal stories and career journey", emoji: "🌱" },
    ],
  },
  {
    id: "audience", phase: "Your Audience",
    question: "Who do you most want to reach?",
    subtitle: "Clarity on audience changes everything.",
    options: [
      { label: "Recruiters and hiring managers", emoji: "🔎" },
      { label: "Potential clients and decision makers", emoji: "🤝" },
      { label: "Peers and industry professionals", emoji: "👥" },
      { label: "Founders and entrepreneurs", emoji: "🚀" },
      { label: "Everyone in my industry", emoji: "🌍" },
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
      { label: "5+ hours — I'm fully committed", emoji: "🔥" },
    ],
  },
  {
    id: "biggest_win", phase: "Your Vision",
    question: "What would make LinkedIn feel like it truly worked?",
    subtitle: "Close your eyes and picture it.",
    options: [
      { label: "A recruiter DMing me out of nowhere", emoji: "📩" },
      { label: "A post crossing 10,000 views", emoji: "👁️" },
      { label: "An inbound client inquiry", emoji: "💰" },
      { label: "Being seen as the go-to expert", emoji: "🎓" },
      { label: "Hitting 1,000 followers organically", emoji: "📈" },
    ],
  },
];

const ANALYSIS_STEPS = [
  { text: "Scanning your profile structure...", duration: 1600 },
  { text: "Benchmarking against your industry...", duration: 1900 },
  { text: "Mapping your goal to proven strategies...", duration: 1800 },
  { text: "Identifying your content archetype...", duration: 1700 },
  { text: "Crafting your personal roadmap...", duration: 2000 },
  { text: "Calculating your LinkedIn Score...", duration: 1400 },
];

function buildPrompt(userData, answers) {
  return `User data:
Name: ${userData.firstName} ${userData.lastName}, Age: ${userData.age}, Title: ${userData.jobTitle}, LinkedIn: ${userData.linkedinUrl}
Goal: ${answers.goal}
Activity: ${answers.current_status}
Profile: ${answers.profile_completeness}
Struggle: ${answers.content_struggle}
Style: ${answers.content_style}
Audience: ${answers.audience}
Time: ${answers.time_commitment}
Success: ${answers.biggest_win}

Return ONLY this JSON object, no other text:
{"score":75,"archetype":"The Silent Expert","headline":"You have the expertise — now make it visible.","urgency":"Every day without a strategy is a day a less-qualified person gets the opportunity you deserve.","profile_fixes":["Rewrite your headline to include who you help and how, not just your job title","Add a compelling About section that tells your story in the first person","List all past roles with 2-3 bullet points of quantified achievements each"],"content_strategy":{"post_frequency":"No more than 2 posts per month — quality beats volume every time on LinkedIn.","best_posting_times":"Tuesday to Thursday, 7-9am or 5-6pm your local time. Avoid weekends — traffic drops 60%.","content_mix":"60% personal lessons from your work, 30% practical tips for your audience, 10% bold industry opinions.","hook_formula":"Start with a counterintuitive statement or a specific number. Never start with I.","content_types":"Rotate between document carousels for reach, text-only posts for stories, and photos with you in them for engagement."},"critical_rules":["Never edit a post after publishing — LinkedIn immediately cuts its reach in the algorithm.","Never reshare posts to grow your account — comment and like instead, reshares do not distribute the same way.","Post your own first comment immediately after publishing to trigger early engagement signals.","Stay active for 60 minutes after posting and reply to every comment — this is your reach ceiling window.","Tag people only when genuinely relevant — LinkedIn detects and penalizes tag-for-reach behavior.","Send 10 personalized connection requests per week to people in your exact niche to build your initial audience."],"growth_tactics":["Search your target audience by job title on LinkedIn and send 10 tailored connection requests per week with a short personal note.","Write your first post about a mistake you made in your career and what you learned — vulnerability drives first-time engagement.","Check your LinkedIn SSI score at linkedin.com/sales/ssi and focus on improving the weakest of the four pillars first.","Ask two former colleagues or managers for a written recommendation this week — social proof on your profile signals credibility instantly."],"30_day_plan":[{"week":"Week 1","focus":"Profile Optimization","action":"Rewrite your headline, About section, and add your top 3 past roles with bullet points. Update your profile photo and banner."},{"week":"Week 2","focus":"Audience Building","action":"Send 10 connection requests daily to people in your niche. Write a short personal note on each one referencing something specific about them."},{"week":"Week 3","focus":"First Post","action":"Write and publish your first post — share one hard lesson from your career. Keep it under 150 words. Post at 8am Tuesday."},{"week":"Week 4","focus":"Engagement & Momentum","action":"Comment meaningfully on 5 posts per day from people in your niche. Reply to every comment on your own post within the hour."}],"closing_message":"You already have everything it takes — the experience, the story, and the expertise. The only thing missing was a clear system, and now you have one."}

Replace all placeholder values with real personalized content based on the user data above.`;
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #08080e; }

  .page-enter { animation: pageEnter 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes pageEnter { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }

  .word-reveal { animation: wordReveal 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
  @keyframes wordReveal { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

  .opt-row {
    display:flex; align-items:center; gap:14px;
    padding:15px 18px; border-radius:14px;
    background:#0d0d18; border:1px solid #1a1a2e;
    cursor:pointer; transition:all 0.22s ease;
    font-family:'DM Sans',sans-serif; width:100%; text-align:left;
  }
  .opt-row:hover { border-color:#c8a96e55; background:#0f0f1e; transform:translateX(3px); }
  .opt-row.selected { border-color:#c8a96e; background:rgba(200,169,110,0.07); transform:translateX(5px); }

  .primary-btn {
    width:100%; padding:15px 24px; border:none; border-radius:14px;
    background:linear-gradient(135deg,#c8a96e,#a07840);
    color:#08080e; font-family:'DM Sans',sans-serif;
    font-size:15px; font-weight:700; cursor:pointer;
    transition:all 0.2s; letter-spacing:0.3px;
  }
  .primary-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 40px rgba(200,169,110,0.25); }
  .primary-btn:disabled { background:#1a1a2e; color:#3a3a5a; cursor:not-allowed; }

  .ghost-btn {
    width:100%; padding:13px 24px; border:1px solid #1a1a2e; border-radius:14px;
    background:transparent; color:#4a4a6a;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500;
    cursor:pointer; transition:all 0.2s;
  }
  .ghost-btn:hover { border-color:#2a2a3e; color:#6a6a8a; }

  .tab-pill {
    padding:7px 16px; border-radius:100px;
    border:1px solid #1a1a2e; background:transparent;
    color:#4a4a6a; font-family:'DM Sans',sans-serif;
    font-size:12px; font-weight:600; cursor:pointer;
    transition:all 0.2s; letter-spacing:0.5px; text-transform:uppercase;
  }
  .tab-pill:hover { border-color:#c8a96e44; color:#8a8a9a; }
  .tab-pill.active { border-color:#c8a96e; background:rgba(200,169,110,0.1); color:#c8a96e; }

  .card-block {
    background:#0d0d18; border:1px solid #1a1a2e; border-radius:16px;
    padding:20px; margin-bottom:12px; transition:border-color 0.2s;
  }
  .card-block:hover { border-color:#2a2a3e; }

  .field-input {
    width:100%; padding:13px 16px;
    background:#0d0d18; border:1px solid #1a1a2e; border-radius:12px;
    color:#e8e8f0; font-family:'DM Sans',sans-serif; font-size:14px;
    outline:none; transition:border-color 0.2s;
  }
  .field-input:focus { border-color:#c8a96e88; }
  .field-input.error { border-color:#ef444488; }
  .field-input::placeholder { color:#2a2a4a; }

  .progress-bar { height:1px; background:#1a1a2e; border-radius:4px; overflow:hidden; }
  .progress-fill { height:100%; background:linear-gradient(90deg,#c8a96e,#e8c98e); border-radius:4px; transition:width 0.5s ease; }

  .score-ring { transform:rotate(-90deg); }
  .analysis-dot { animation:dotPulse 1.4s infinite; }
  @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.3;transform:scale(0.7);} }

  .gold-rule { width:40px; height:1px; background:linear-gradient(90deg,transparent,#c8a96e,transparent); margin:0 auto 24px; }
  .section-reveal { animation:pageEnter 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }

  /* Video overlay */
  .video-overlay {
    position:fixed; inset:0; z-index:0; overflow:hidden;
  }
  .video-overlay video {
    width:100%; height:100%; object-fit:cover; opacity:0.07;
    filter:grayscale(100%) contrast(1.2);
  }
  .video-overlay::after {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at 60% 40%, rgba(200,169,110,0.04) 0%, transparent 60%),
               linear-gradient(180deg, rgba(8,8,14,0.6) 0%, rgba(8,8,14,0.3) 50%, rgba(8,8,14,0.8) 100%);
  }
`;

// ─── LAYOUT WRAPPER ───────────────────────────────────────────────────────────
function Layout({ children, showVideo = false }) {
  return (
    <div style={{ minHeight:"100vh", background:"#08080e", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", position:"relative", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      {showVideo && (
        <div className="video-overlay">
          <video autoPlay muted loop playsInline>
            <source src="https://assets.mixkit.co/videos/preview/mixkit-professional-looking-for-contacts-on-a-networking-app-42573-large.mp4" type="video/mp4" />
          </video>
        </div>
      )}
      {/* Ambient orbs */}
      <div style={{ position:"fixed", top:"-15%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 65%)", pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"fixed", bottom:"-20%", left:"-10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(100,80,180,0.05) 0%, transparent 65%)", pointerEvents:"none", zIndex:1 }} />
      <div style={{ width:"100%", maxWidth:520, position:"relative", zIndex:2 }}>
        {children}
      </div>
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ children, color="#c8a96e" }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${color}12`, color, border:`1px solid ${color}30`, borderRadius:100, padding:"5px 14px", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:20 }}>
      {children}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
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

  // Check if returning from Stripe payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedAnswers = sessionStorage.getItem("linkscore_answers");
    const savedUser = sessionStorage.getItem("linkscore_user");
    const savedEmail = sessionStorage.getItem("linkscore_email");
    if (urlParams.get("success") === "true" && savedAnswers && savedUser) {
      const parsedAnswers = JSON.parse(savedAnswers);
      const parsedUser = JSON.parse(savedUser);
      setAnswers(parsedAnswers);
      setUserData(parsedUser);
      setEmail(savedEmail || "");
      setPhase("generating");
      generatePlan(parsedUser, parsedAnswers);
    }
  }, []);

  const generatePlan = async (user, ans) => {
    setPhase("generating");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:2000,
          system:"You are a JSON API. Output only valid raw JSON. No markdown, no explanation, no code blocks.",
          messages:[{ role:"user", content:buildPrompt(user, ans) }],
        }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json[\s\S]*?```|```/g,"").trim();
      const m = clean.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON");
      setPlan(JSON.parse(m[0]));
      sessionStorage.removeItem("linkscore_answers");
      sessionStorage.removeItem("linkscore_user");
      sessionStorage.removeItem("linkscore_email");
      setPhase("result");
    } catch(e) {
      setPhase("paywall");
    }
  };

  // Analysis animation
  useEffect(() => {
    if (phase !== "analyzing") return;
    let step = 0;
    let elapsed = 0;
    const total = ANALYSIS_STEPS.reduce((s, a) => s + a.duration, 0);
    const run = () => {
      if (step >= ANALYSIS_STEPS.length) { setTimeout(() => setPhase("paywall"), 500); return; }
      setAnalysisStep(step);
      const dur = ANALYSIS_STEPS[step].duration;
      elapsed += dur;
      const iv = setInterval(() => setAnalysisProgress(Math.round((elapsed / total) * 100)), 40);
      setTimeout(() => { clearInterval(iv); step++; run(); }, dur);
    };
    run();
  }, [phase]);

  const validate = () => {
    const e = {};
    if (!userData.firstName.trim()) e.firstName = "Required";
    if (!userData.lastName.trim()) e.lastName = "Required";
    if (!userData.age || isNaN(userData.age) || userData.age < 16 || userData.age > 80) e.age = "Invalid age";
    if (!userData.jobTitle.trim()) e.jobTitle = "Required";
    if (!userData.linkedinUrl.trim() || !userData.linkedinUrl.includes("linkedin")) e.linkedinUrl = "Invalid URL";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!selected) return;
    const q = QUESTIONS[currentQ];
    const a = { ...answers, [q.id]: selected };
    setAnswers(a);
    setSelected(null);
    if (currentQ + 1 < QUESTIONS.length) setCurrentQ(currentQ + 1);
    else setPhase("analyzing");
  };

  const handlePaywall = async () => {
    if (!email.includes("@") || !email.includes(".")) { setEmailError("Please enter a valid email"); return; }
    setEmailError(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:2000,
          system:"You are a JSON API. Output only valid raw JSON. No markdown, no explanation, no code blocks.",
          messages:[{ role:"user", content:buildPrompt(userData, answers) }],
        }),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d?.error?.message||`HTTP ${res.status}`); }
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json[\s\S]*?```|```/g,"").trim();
      const m = clean.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON found in response");
      setPlan(JSON.parse(m[0]));
      setPhase("result");
    } catch(e) { setEmailError(`Error: ${e.message}`); }
    setLoading(false);
  };

  const reset = () => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setPlan(null); setUserData({firstName:"",lastName:"",age:"",jobTitle:"",linkedinUrl:""}); setEmail(""); setSelected(null); };

  const q = QUESTIONS[currentQ];
  const progress = (currentQ / QUESTIONS.length) * 100;

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <Layout showVideo>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", border:"1px solid #c8a96e44", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", background:"rgba(200,169,110,0.06)" }}>
            <span style={{ fontSize:22 }}>✦</span>
          </div>
          <Badge>LinkedIn Intelligence</Badge>
          <h1 style={{ fontFamily:"'DM Sans',sans-serif", color:"#e8e8f0", fontSize:48, fontWeight:300, lineHeight:1.1, marginBottom:8, letterSpacing:-1 }}>
            Your LinkedIn is<br />
            <em style={{ fontStyle:"italic", color:"#c8a96e" }}>invisible.</em>
          </h1>
          <div className="gold-rule" style={{ marginTop:24 }} />
          <p style={{ color:"#4a4a6a", fontSize:15, lineHeight:1.8, maxWidth:380, margin:"0 auto" }}>
            Answer 8 questions. Receive a strategy built entirely around you — your voice, your goals, your situation.
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32, textAlign:"left" }}>
          {["Personalized LinkedIn Score", "Profile optimization checklist", "Content strategy & posting rules", "30-day step-by-step action plan"].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:"#c8a96e", fontSize:11 }}>◆</span>
              <span style={{ color:"#4a4a6a", fontSize:13 }}>{f}</span>
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={() => setPhase("form")}>Begin Your Analysis →</button>
        <p style={{ color:"#2a2a3a", fontSize:11, marginTop:12, letterSpacing:0.5 }}>3 MINUTES · COMPLETELY FREE</p>
      </div>
    </Layout>
  );

  // ── FORM ───────────────────────────────────────────────────────────────────
  if (phase === "form") return (
    <Layout>
      <div className="page-enter">
        <Badge>Step 1 of 2</Badge>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", color:"#e8e8f0", fontSize:34, fontWeight:300, marginBottom:6, letterSpacing:-0.5 }}>Tell us about yourself.</h2>
        <p style={{ color:"#4a4a6a", fontSize:14, marginBottom:28, lineHeight:1.7 }}>This is how we make your plan truly personal.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["firstName","First Name","John"],["lastName","Last Name","Smith"]].map(([k,l,p]) => (
              <div key={k}>
                <label style={{ color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 }}>{l}</label>
                <input className={`field-input${formErrors[k]?" error":""}`} value={userData[k]} onChange={e=>setUserData({...userData,[k]:e.target.value})} placeholder={p} />
                {formErrors[k] && <p style={{ color:"#ef4444", fontSize:11, marginTop:4 }}>{formErrors[k]}</p>}
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:12 }}>
            <div>
              <label style={{ color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 }}>Age</label>
              <input className={`field-input${formErrors.age?" error":""}`} type="number" value={userData.age} onChange={e=>setUserData({...userData,age:e.target.value})} placeholder="28" />
              {formErrors.age && <p style={{ color:"#ef4444", fontSize:11, marginTop:4 }}>{formErrors.age}</p>}
            </div>
            <div>
              <label style={{ color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 }}>Current Title</label>
              <input className={`field-input${formErrors.jobTitle?" error":""}`} value={userData.jobTitle} onChange={e=>setUserData({...userData,jobTitle:e.target.value})} placeholder="Marketing Manager" />
              {formErrors.jobTitle && <p style={{ color:"#ef4444", fontSize:11, marginTop:4 }}>{formErrors.jobTitle}</p>}
            </div>
          </div>
          <div>
            <label style={{ color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 }}>LinkedIn Profile URL</label>
            <input className={`field-input${formErrors.linkedinUrl?" error":""}`} value={userData.linkedinUrl} onChange={e=>setUserData({...userData,linkedinUrl:e.target.value})} placeholder="linkedin.com/in/yourname" />
            {formErrors.linkedinUrl && <p style={{ color:"#ef4444", fontSize:11, marginTop:4 }}>{formErrors.linkedinUrl}</p>}
            <p style={{ color:"#2a2a3a", fontSize:11, marginTop:6 }}>Used to personalize your strategy. We don't store this.</p>
          </div>
        </div>
        <div style={{ marginTop:24 }}>
          <button className="primary-btn" onClick={() => { if(validate()) setPhase("quiz"); }}>Continue →</button>
        </div>
      </div>
    </Layout>
  );

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (phase === "quiz") return (
    <Layout>
      <div className="page-enter" key={currentQ}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <Badge color="#6a5a9a">{q.phase}</Badge>
          <span style={{ color:"#2a2a4a", fontSize:12, letterSpacing:1 }}>{currentQ+1} / {QUESTIONS.length}</span>
        </div>
        <div className="progress-bar" style={{ marginBottom:28 }}>
          <div className="progress-fill" style={{ width:`${progress}%` }} />
        </div>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", color:"#e8e8f0", fontSize:30, fontWeight:400, marginBottom:8, lineHeight:1.25, letterSpacing:-0.3 }}>{q.question}</h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:24, lineHeight:1.6 }}>{q.subtitle}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
          {q.options.map(opt => (
            <button key={opt.label} className={`opt-row${selected===opt.label?" selected":""}`} onClick={()=>setSelected(opt.label)}>
              <span style={{ fontSize:18, flexShrink:0, opacity:0.8 }}>{opt.emoji}</span>
              <span style={{ color:selected===opt.label?"#c8a96e":"#6a6a8a", fontSize:14, fontWeight:selected===opt.label?600:400, flex:1 }}>{opt.label}</span>
              {selected===opt.label && <span style={{ color:"#c8a96e", fontSize:12 }}>◆</span>}
            </button>
          ))}
        </div>
        <button className="primary-btn" disabled={!selected} onClick={handleNext}>
          {currentQ+1===QUESTIONS.length ? "Analyze My Profile →" : "Continue →"}
        </button>
      </div>
    </Layout>
  );

  // ── ANALYZING ──────────────────────────────────────────────────────────────
  if (phase === "analyzing") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", border:"1px solid #c8a96e22", margin:"0 auto 28px", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width={80} height={80} style={{ position:"absolute", inset:0 }}>
            <circle cx={40} cy={40} r={36} fill="none" stroke="#1a1a2e" strokeWidth={1} />
            <circle cx={40} cy={40} r={36} fill="none" stroke="#c8a96e" strokeWidth={1}
              strokeDasharray={`${(analysisProgress/100)*226} 226`}
              strokeLinecap="round" transform="rotate(-90 40 40)"
              style={{ transition:"stroke-dasharray 0.4s ease" }} />
          </svg>
          <span style={{ color:"#c8a96e", fontSize:22, fontFamily:"'DM Sans',sans-serif" }}>✦</span>
        </div>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", color:"#e8e8f0", fontSize:28, fontWeight:300, marginBottom:6 }}>
          Analyzing, {userData.firstName}...
        </h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:32 }}>Building something made only for you.</p>
        <div style={{ textAlign:"left", display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {ANALYSIS_STEPS.map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: i<analysisStep?"#c8a96e":i===analysisStep?"#c8a96e":"#1a1a2e", flexShrink:0, transition:"background 0.3s" }}
                className={i===analysisStep?"analysis-dot":""} />
              <span style={{ color:i<=analysisStep?"#6a6a8a":"#2a2a3a", fontSize:13, transition:"color 0.3s" }}>{step.text}</span>
            </div>
          ))}
        </div>
        <p style={{ color:"#2a2a3a", fontSize:11, letterSpacing:1 }}>{analysisProgress}% COMPLETE</p>
      </div>
    </Layout>
  );

  // ── PAYWALL ────────────────────────────────────────────────────────────────
  if (phase === "paywall") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", border:"1px solid #c8a96e44", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", background:"rgba(200,169,110,0.06)" }}>
          <span style={{ color:"#c8a96e", fontSize:18 }}>◆</span>
        </div>
        <Badge color="#10b981">Analysis Complete</Badge>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", color:"#e8e8f0", fontSize:36, fontWeight:300, marginBottom:8, letterSpacing:-0.5 }}>
          Your plan is ready,<br /><em style={{ fontStyle:"italic", color:"#c8a96e" }}>{userData.firstName}.</em>
        </h2>
        <div className="gold-rule" />
        <p style={{ color:"#4a4a6a", fontSize:14, lineHeight:1.7, marginBottom:28 }}>Enter your email to unlock your full personalized LinkedIn strategy.</p>
        <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"18px 20px", marginBottom:24, textAlign:"left" }}>
          <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>What's inside</p>
          {["Your LinkedIn Score & personal archetype","Profile optimization checklist","Custom content strategy & timing rules","Critical algorithm rules most people break","30-day step-by-step action plan"].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ color:"#c8a96e", fontSize:10 }}>◆</span>
              <span style={{ color:"#4a4a6a", fontSize:13 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14, textAlign:"left" }}>
          <label style={{ color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:8 }}>Email Address</label>
          <input className={`field-input${emailError?" error":""}`} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&handlePaywall()} />
          {emailError && <p style={{ color:"#ef4444", fontSize:12, marginTop:6 }}>{emailError}</p>}
        </div>
        <button className="primary-btn" disabled={loading} onClick={handlePaywall}>
          {loading ? "Generating your plan..." : "Unlock My LinkedIn Plan →"}
        </button>
        <p style={{ color:"#1a1a2a", fontSize:10, marginTop:10, letterSpacing:0.8 }}>NO SPAM · NO CREDIT CARD · JUST YOUR PLAN</p>
      </div>
    </Layout>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result" && plan) {
    const TABS = ["Overview","Profile","Content","Rules","30 Days"];
    return (
      <Layout>
        <div className="page-enter">
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <Badge>Your LinkedIn Plan</Badge>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", color:"#e8e8f0", fontSize:36, fontWeight:300, marginBottom:6, letterSpacing:-0.5 }}>
              {userData.firstName}, you are<br />
              <em style={{ fontStyle:"italic", color:"#c8a96e" }}>{plan.archetype}</em>
            </h1>
            <div className="gold-rule" />
            <p style={{ color:"#4a4a6a", fontSize:13, lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>{plan.headline}</p>
          </div>

          {/* Score */}
          <div style={{ display:"flex", alignItems:"center", gap:20, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"18px 20px", marginBottom:24 }}>
            <div style={{ flexShrink:0 }}>
              <svg width={72} height={72} className="score-ring">
                <circle cx={36} cy={36} r={28} fill="none" stroke="#1a1a2e" strokeWidth={4} />
                <circle cx={36} cy={36} r={28} fill="none" stroke="url(#goldGrad)" strokeWidth={4}
                  strokeDasharray={`${(plan.score/100)*176} 176`} strokeLinecap="round" />
                <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor="#c8a96e"/><stop offset="100%" stopColor="#f0d090"/></linearGradient></defs>
              </svg>
              <p style={{ textAlign:"center", color:"#c8a96e", fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:600, marginTop:-52, lineHeight:1, position:"relative", zIndex:1 }}>{plan.score}</p>
              <div style={{ height:52 }} />
            </div>
            <div>
              <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>LinkedIn Score</p>
              <p style={{ color:"#8a8a9a", fontSize:14, fontWeight:500, marginBottom:6 }}>{plan.score<40?"Significant room to grow":plan.score<70?"Good foundation — needs strategy":"Strong start — optimize now"}</p>
              <p style={{ color:"#ef4444", fontSize:12, lineHeight:1.5, opacity:0.8 }}>{plan.urgency}</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
            {TABS.map((t,i) => <button key={i} className={`tab-pill${activeSection===i?" active":""}`} onClick={()=>setActiveSection(i)}>{t}</button>)}
          </div>

          {/* Tab content */}
          <div className="section-reveal" key={activeSection}>
            {activeSection===0 && (
              <div>
                <div style={{ background:"linear-gradient(135deg,rgba(200,169,110,0.06),rgba(200,169,110,0.02))", border:"1px solid #c8a96e22", borderRadius:16, padding:20, marginBottom:12 }}>
                  <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Personal Message</p>
                  <p style={{ color:"#8a8a9a", fontSize:14, lineHeight:1.8, fontStyle:"italic" }}>"{plan.closing_message}"</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {plan.growth_tactics?.map((t,i) => (
                    <div key={i} className="card-block" style={{ display:"flex", gap:12 }}>
                      <span style={{ color:"#c8a96e", fontSize:12, flexShrink:0, marginTop:2 }}>→</span>
                      <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.6 }}>{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection===1 && (
              <div>
                {plan.profile_fixes?.map((fix,i) => (
                  <div key={i} className="card-block" style={{ display:"flex", gap:14 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(200,169,110,0.1)", border:"1px solid #c8a96e33", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#c8a96e", fontSize:11, fontWeight:700 }}>{i+1}</div>
                    <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.6 }}>{fix}</p>
                  </div>
                ))}
              </div>
            )}
            {activeSection===2 && (
              <div>
                {[["Post Frequency",plan.content_strategy?.post_frequency],["Best Times",plan.content_strategy?.best_posting_times],["Content Mix",plan.content_strategy?.content_mix],["Hook Formula",plan.content_strategy?.hook_formula],["Formats to Use",plan.content_strategy?.content_types]].map(([label,val],i) => (
                  <div key={i} className="card-block">
                    <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{label}</p>
                    <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.6 }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
            {activeSection===3 && (
              <div>
                <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Critical Rules — Don't Break These</p>
                {plan.critical_rules?.map((rule,i) => (
                  <div key={i} className="card-block" style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>⚠</span>
                    <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.6 }}>{rule}</p>
                  </div>
                ))}
              </div>
            )}
            {activeSection===4 && (
              <div>
                {plan["30_day_plan"]?.map((w,i) => (
                  <div key={i} className="card-block" style={{ position:"relative", paddingLeft:28, overflow:"hidden" }}>
                    <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:"linear-gradient(180deg,#c8a96e,#c8a96e44)" }} />
                    <p style={{ color:"#c8a96e", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>{w.week} · {w.focus}</p>
                    <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.6 }}>{w.action}</p>
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
