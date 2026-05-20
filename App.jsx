import { useState, useEffect, useRef } from "react";

const LOGO_URL = "https://raw.githubusercontent.com/aliazad11/linkscore/main/logo.png";

const QUESTIONS = [
  {
    id: "goal", phase: "Your Ambition",
    question: "What brings you here today?",
    subtitle: "Be honest — this shapes everything we build together.",
    options: [
      { label: "Land a better job or get headhunted", emoji: "🎯" },
      { label: "Build my personal brand & become known", emoji: "✦" },
      { label: "Attract clients or business opportunities", emoji: "💼" },
      { label: "Grow my network in my industry", emoji: "🌐" },
      { label: "Get promoted or recognized internally", emoji: "🏆" },
    ],
  },
  {
    id: "current_status", phase: "Where You Are",
    question: "How active are you on LinkedIn right now?",
    subtitle: "No judgment — everyone starts somewhere.",
    options: [
      { label: "Ghost account — I barely log in", emoji: "👻" },
      { label: "I scroll but never post", emoji: "👁️" },
      { label: "I posted once or twice and gave up", emoji: "📝" },
      { label: "I post sometimes but get zero traction", emoji: "📉" },
      { label: "I'm active but not growing", emoji: "🔄" },
    ],
  },
  {
    id: "industry", phase: "Your World",
    question: "What industry are you in?",
    subtitle: "This shapes your content strategy completely.",
    options: [
      { label: "Tech & Software", emoji: "💻" },
      { label: "Marketing & Creative", emoji: "🎨" },
      { label: "Finance & Consulting", emoji: "📊" },
      { label: "Healthcare & Science", emoji: "🔬" },
      { label: "Sales & Business Development", emoji: "🤝" },
      { label: "Other", emoji: "🌍" },
    ],
  },
  {
    id: "experience", phase: "Your Background",
    question: "How many years of professional experience do you have?",
    subtitle: "Your seniority changes how you should position yourself.",
    options: [
      { label: "0–2 years (early career)", emoji: "🌱" },
      { label: "3–5 years (building momentum)", emoji: "📈" },
      { label: "6–10 years (mid-level expert)", emoji: "⚡" },
      { label: "10+ years (senior / leadership)", emoji: "🏅" },
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
    question: "Which content style feels most natural to you?",
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
  { text: "Scanning your profile data...", duration: 1600 },
  { text: "Analyzing your industry benchmarks...", duration: 1900 },
  { text: "Mapping your goal to proven strategies...", duration: 1800 },
  { text: "Identifying your content archetype...", duration: 1700 },
  { text: "Generating your post hooks...", duration: 2000 },
  { text: "Building your 30-day roadmap...", duration: 1800 },
  { text: "Calculating your LinkedIn Score...", duration: 1400 },
];

function buildPrompt(userData, answers, profileText) {
  const profileSection = profileText
    ? `\nLINKEDIN PROFILE (extracted from PDF):\n${profileText.slice(0, 2000)}\n`
    : "\nNo profile PDF provided.\n";

  return `User data:
Name: ${userData.firstName} ${userData.lastName}, Age: ${userData.age}, Title: ${userData.jobTitle}, LinkedIn: ${userData.linkedinUrl}
Industry: ${answers.industry}, Experience: ${answers.experience}
Goal: ${answers.goal}, Activity: ${answers.current_status}
Profile completeness: ${answers.profile_completeness}, Struggle: ${answers.content_struggle}
Content style: ${answers.content_style}, Audience: ${answers.audience}
Time available: ${answers.time_commitment}, Success vision: ${answers.biggest_win}
${profileSection}
Return ONLY this JSON, no other text:
{"score":72,"archetype":"The Silent Expert","headline":"You have the expertise — now make it visible.","urgency":"Every day without a strategy is a day a less-qualified person gets the opportunity you deserve.","profile_scores":{"headline":45,"about":30,"experience":60,"overall":45},"profile_fixes":["Rewrite your headline to include who you help and how — not just your job title","Add a compelling About section in first person that tells your story and outcome","Add 2-3 bullet points per role with quantified achievements"],"content_strategy":{"post_frequency":"Maximum 2 posts per month — LinkedIn rewards depth over volume.","best_posting_times":"Tuesday to Thursday, 7–9am or 5–6pm your local time. Never post on weekends.","content_mix":"60% personal lessons from your work, 30% practical tips for your audience, 10% bold opinions.","hook_formula":"Start with a counterintuitive statement or a specific number. Never start with I.","content_types":"Rotate: document carousels for reach, text-only for stories, photos with you in them for engagement."},"post_hooks":["I made a mistake that cost my team 3 months of work. Here is what I learned:","Most people optimize their LinkedIn headline wrong. Here is the one change that got me 5x more profile views:","Nobody told me this when I started my career in [industry]. 5 years later, I wish someone had:"],"content_calendar":[{"week":"Week 1","type":"POST","topic":"Share one hard lesson from your career","hook":"[use hook #1 above]","action":"Publish Tuesday 8am. Drop your own first comment immediately. Reply to every comment within 60 minutes."},{"week":"Week 2","type":"ENGAGEMENT","topic":"No post this week","hook":null,"action":"Comment meaningfully on 10 posts in your niche. Send 15 personalized connection requests to people in your target audience. Update one section of your profile."},{"week":"Week 3","type":"POST","topic":"A practical tip your audience wishes they knew","hook":"[use hook #2 above]","action":"Publish Tuesday 8am. Drop your own first comment immediately. Reply to every comment within 60 minutes."},{"week":"Week 4","type":"ENGAGEMENT","topic":"No post this week","hook":null,"action":"Reply to every comment from Week 3 post. Send 10 more connection requests. Review your profile analytics and note what improved."}],"critical_rules":["Never edit a post after publishing — LinkedIn immediately cuts its reach in the algorithm.","Never reshare others posts to grow your account — comment and like instead.","Post your own first comment immediately after publishing to trigger early engagement.","Stay active for 60 minutes after posting and reply to every comment — this is your reach ceiling window.","Tag people only when genuinely relevant — LinkedIn detects and penalizes tag-for-reach behavior.","Send 10 personalized connection requests per week to people in your exact niche."],"growth_tactics":["Search your target audience by job title and send 10 tailored connection requests per week with a short personal note.","Ask two former colleagues or managers for a written recommendation this week.","Check your LinkedIn SSI score at linkedin.com/sales/ssi and improve the weakest pillar first.","Use document carousels — they get 3x more reach than single images on LinkedIn right now."],"closing_message":"You already have everything it takes. The experience, the story, the expertise. The only thing missing was a clear system — and now you have one."}

Replace ALL placeholder values with real personalized content based on the user data and profile above. Make post_hooks genuinely specific to their industry, experience level, and content style.`;
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

function ScoreRing({ score }) {
  const r = 36; const c = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
      <svg width={80} height={80} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="#1a1a2e" strokeWidth={5} />
        <circle cx={40} cy={40} r={r} fill="none" stroke="url(#goldGrad)" strokeWidth={5}
          strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round" />
        <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor="#c8a96e"/><stop offset="100%" stopColor="#f0d090"/></linearGradient></defs>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#c8a96e", fontSize:20, fontWeight:800 }}>{score}</div>
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
  const [pdfName, setPdfName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [industryOther, setIndustryOther] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (phase !== "analyzing") return;
    let step = 0, elapsed = 0;
    const total = ANALYSIS_STEPS.reduce((s,a)=>s+a.duration,0);
    const run = () => {
      if (step >= ANALYSIS_STEPS.length) { setTimeout(()=>setPhase("paywall"),500); return; }
      setAnalysisStep(step);
      const dur = ANALYSIS_STEPS[step].duration;
      elapsed += dur;
      const iv = setInterval(()=>setAnalysisProgress(Math.round((elapsed/total)*100)),40);
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
    if (!userData.linkedinUrl.trim()||!userData.linkedinUrl.includes("linkedin")) e.linkedinUrl = "Invalid URL";
    setFormErrors(e);
    return Object.keys(e).length===0;
  };

  const handleNext = () => {
    if (!selected) return;
    const q = QUESTIONS[currentQ];
    const a = {...answers, [q.id]:selected};
    setAnswers(a);
    setSelected(null);
    // If industry is "Other", show custom input
    if (q.id === "industry" && selected === "Other") {
      setPhase("industry_other");
      return;
    }
    if (currentQ+1<QUESTIONS.length) setCurrentQ(currentQ+1);
    else setPhase("pdf_upload");
  };

  const callAPI = async (user, ans, profile) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model:"claude-sonnet-4-5", max_tokens:3000,
        system:"You are a JSON API. You MUST output ONLY a raw JSON object. Start your response with { and end with }. Zero other text allowed.",
        messages:[{ role:"user", content:buildPrompt(user, ans, profile) }, { role:"assistant", content:"{" }],
      }),
    });
    if (!res.ok) { const d=await res.json().catch(()=>({})); throw new Error(d?.error?.message||`HTTP ${res.status}`); }
    const data = await res.json();
    const rawText = data.content?.find(b=>b.type==="text")?.text||"";
    const text = "{" + rawText;
    const m = text.match(/\{[\s\S]*\}/s);
    if (!m) throw new Error("No JSON: " + rawText.slice(0,200));
    return JSON.parse(m[0]);
  };

  const handlePaywall = async () => {
    if (!email.includes("@")||!email.includes(".")) { setEmailError("Please enter a valid email"); return; }
    setEmailError(""); setLoading(true);
    try {
      const result = await callAPI(userData, answers, pdfText);
      setPlan(result);
      setPhase("result");
    } catch(e) {
      setEmailError(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const handlePDF = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY, "anthropic-version":"2023-06-01" },
          body: JSON.stringify({
            model:"claude-sonnet-4-5", max_tokens:1000,
            messages:[{ role:"user", content:[
              { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } },
              { type:"text", text:"Extract the key LinkedIn profile information: headline, about section, experience, skills. Return as plain text summary under 500 words." }
            ]}],
          }),
        });
        const data = await res.json();
        const text = data.content?.find(b=>b.type==="text")?.text||"";
        setPdfText(text);
      } catch(e) {
        setPdfText("PDF uploaded but could not be read.");
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setPlan(null); setUserData({firstName:"",lastName:"",age:"",jobTitle:"",linkedinUrl:""}); setEmail(""); setSelected(null); setPdfText(""); setPdfName(""); };

  const q = QUESTIONS[currentQ];
  const progress = (currentQ/QUESTIONS.length)*100;

  const s = {
    h1: { color:"#F9FAFB", fontSize:32, fontWeight:800, lineHeight:1.2, marginBottom:12, letterSpacing:-0.5 },
    sub: { color:"#6B7280", fontSize:14, lineHeight:1.7, marginBottom:28 },
    label: { color:"#3a3a5a", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 },
    err: { color:"#ef4444", fontSize:11, marginTop:4 },
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase==="intro") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo />
        <Badge>LinkedIn Intelligence</Badge>
        <h1 style={s.h1}>Your LinkedIn is<br /><span style={{ color:"#c8a96e" }}>invisible.</span></h1>
        <div className="gold-rule" />
        <p style={{ ...s.sub, maxWidth:380, margin:"0 auto 32px" }}>Answer 10 questions. Upload your profile. Get a strategy built entirely around you.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32, textAlign:"left" }}>
          {["Personalized LinkedIn Score","Profile section-by-section scoring","3 custom post hooks for your voice","30-day content calendar","Critical algorithm rules"].map((f,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:"#c8a96e", fontSize:11 }}>◆</span>
              <span style={{ color:"#4a4a6a", fontSize:13 }}>{f}</span>
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={()=>setPhase("form")}>Begin Your Analysis →</button>
        <p style={{ color:"#2a2a3a", fontSize:10, marginTop:12, letterSpacing:0.8 }}>10 MINUTES · COMPLETELY FREE</p>
      </div>
    </Layout>
  );

  // ── FORM ───────────────────────────────────────────────────────────────────
  if (phase==="form") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge>Step 1 of 3 — About You</Badge>
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
        </div>
        <div style={{ marginTop:24 }}>
          <button className="primary-btn" onClick={()=>{ if(validate()) setPhase("quiz"); }}>Continue →</button>
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
          <Badge color="#6a5a9a">{q.phase}</Badge>
          <span style={{ color:"#2a2a4a", fontSize:12 }}>{currentQ+1} / {QUESTIONS.length}</span>
        </div>
        <div className="progress-bar" style={{ marginBottom:24 }}>
          <div className="progress-fill" style={{ width:`${progress}%` }} />
        </div>
        <h2 style={{ color:"#F9FAFB", fontSize:22, fontWeight:800, marginBottom:8, lineHeight:1.3 }}>{q.question}</h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:22 }}>{q.subtitle}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:22 }}>
          {q.options.map(opt=>(
            <button key={opt.label} className={`opt-row${selected===opt.label?" selected":""}`} onClick={()=>setSelected(opt.label)}>
              <span style={{ fontSize:18, flexShrink:0 }}>{opt.emoji}</span>
              <span style={{ color:selected===opt.label?"#c8a96e":"#6a6a8a", fontSize:14, fontWeight:selected===opt.label?600:400, flex:1 }}>{opt.label}</span>
              {selected===opt.label&&<span style={{ color:"#c8a96e", fontSize:12 }}>◆</span>}
            </button>
          ))}
        </div>
        <button className="primary-btn" disabled={!selected} onClick={handleNext}>
          {currentQ+1===QUESTIONS.length?"Upload Your Profile →":"Continue →"}
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
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>{ setPhase("quiz"); setSelected(null); }}>← Back</button>
      </div>
    </Layout>
  );

  // ── PDF UPLOAD ─────────────────────────────────────────────────────────────
  if (phase==="pdf_upload") return (
    <Layout>
      <div className="page-enter">
        <Logo />
        <Badge>Step 3 of 3 — Your Profile</Badge>
        <h2 style={{ ...s.h1, fontSize:26 }}>Upload your LinkedIn PDF.</h2>
        <p style={{ ...s.sub }}>Go to your LinkedIn profile → click <strong style={{ color:"#c8a96e" }}>Resources</strong> → <strong style={{ color:"#c8a96e" }}>Save to PDF</strong>. Then upload it here.</p>
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
        <p style={{ color:"#2a2a3a", fontSize:11, textAlign:"center", marginTop:10, marginBottom:24 }}>PDF stays on your device. We only read the text.</p>
        <button className="primary-btn" onClick={()=>setPhase("analyzing")}>
          {pdfName?"Analyze My Profile →":"Skip & Continue →"}
        </button>
        <button className="ghost-btn" style={{ marginTop:10 }} onClick={()=>setCurrentQ(QUESTIONS.length-1)||setPhase("quiz")}>← Back</button>
      </div>
    </Layout>
  );

  // ── ANALYZING ──────────────────────────────────────────────────────────────
  if (phase==="analyzing") return (
    <Layout>
      <div className="page-enter" style={{ textAlign:"center" }}>
        <Logo />
        <h2 style={{ color:"#F9FAFB", fontSize:24, fontWeight:700, marginBottom:8 }}>Analyzing, {userData.firstName}...</h2>
        <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:32 }}>Building something made only for you.</p>
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
    const TABS = ["Overview","Profile","Content","Hooks","Calendar","Rules"];
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

          {/* Score */}
          <div style={{ display:"flex", alignItems:"center", gap:20, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
            <ScoreRing score={plan.score} />
            <div>
              <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>LinkedIn Score</p>
              <p style={{ color:"#F9FAFB", fontSize:14, fontWeight:700, marginBottom:4 }}>{plan.score<40?"Significant room to grow":plan.score<70?"Good foundation — needs strategy":"Strong start — optimize now"}</p>
              <p style={{ color:"#ef4444", fontSize:12, lineHeight:1.5, opacity:0.8 }}>{plan.urgency}</p>
            </div>
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
            {TABS.map((t,i)=><button key={i} className={`tab-pill${activeSection===i?" active":""}`} onClick={()=>setActiveSection(i)}>{t}</button>)}
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

            {/* Content Strategy */}
            {activeSection===2 && (
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
            {activeSection===3 && (
              <div>
                <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>3 Custom Post Hooks — Written For Your Voice</p>
                {plan.post_hooks?.map((hook,i)=>(
                  <div key={i} style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:14, padding:20, marginBottom:10, borderLeft:"3px solid #c8a96e" }}>
                    <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:8 }}>HOOK {i+1}</p>
                    <p style={{ color:"#e8e8f0", fontSize:15, lineHeight:1.6, fontWeight:500 }}>{hook}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar */}
            {activeSection===4 && (
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
            {activeSection===5 && (
              <div>
                <p style={{ color:"#2a2a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Critical Rules — Don't Break These</p>
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
