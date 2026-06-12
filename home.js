export const HOME_CSS = `.ls-home{box-sizing:border-box}
.ls-home{
  --bg:#08080e; --bg2:#0c0c15; --card:#101019; --card2:#14141f;
  --line:#1d1d2e; --line-gold:rgba(200,169,110,.18);
  --gold:#c8a96e; --gold-lt:#e7cf9a; --gold-dk:#9c763c;
  --ink:#f5f5fc; --sub:#9696b4; --mute:#56566f;
  --amber:#e0a23c; --red:#e0556b; --green:#56c08a;
  --disp:'DM Sans',system-ui,sans-serif;
  --body:'DM Sans',system-ui,sans-serif;
  --maxw:1140px;
}
.ls-home *{box-sizing:border-box;margin:0;padding:0}
.ls-home{scroll-behavior:smooth}
.ls-home{background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.ls-home a{color:inherit;text-decoration:none}
.ls-home .wrap{max-width:var(--maxw);margin:0 auto;padding:0 28px}
.ls-home .eyebrow{font-family:var(--disp);font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--gold)}
.ls-home h1,.ls-home h2,.ls-home h3{font-family:var(--disp);font-weight:700;letter-spacing:-.02em;line-height:1.05}
.ls-home .gold{color:var(--gold)}
.ls-home nav{position:sticky;top:0;z-index:50;background:rgba(8,8,14,.72);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.05)}
.ls-home nav .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.ls-home nav img{height:24px;display:block}
.ls-home .nav-r{display:flex;align-items:center;gap:26px}
.ls-home .nav-r a{font-size:14px;color:var(--sub);font-weight:500}
.ls-home .nav-r a:hover{color:var(--ink)}
.ls-home .btn{font-family:var(--disp);font-weight:600;cursor:pointer;border:none;border-radius:11px;transition:transform .15s ease, box-shadow .2s ease}
.ls-home .btn-gold{background:linear-gradient(135deg,var(--gold-lt),var(--gold-dk));color:#0a0a0f;padding:12px 20px;font-size:14px;box-shadow:0 6px 24px -8px rgba(200,169,110,.6)}
.ls-home .btn-gold:hover{transform:translateY(-1px);box-shadow:0 10px 32px -8px rgba(200,169,110,.7)}
.ls-home .btn-ghost{background:transparent;border:1px solid var(--line);color:var(--ink);padding:12px 20px;font-size:14px}
.ls-home .btn-ghost:hover{border-color:var(--gold)}
.ls-home .btn-lg{padding:16px 30px;font-size:16px;border-radius:13px}
.ls-home .hero{position:relative;padding:84px 0 90px}
.ls-home .hero::before{content:"";position:absolute;top:-160px;right:-120px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(200,169,110,.10),transparent 62%);pointer-events:none}
.ls-home .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;position:relative}
.ls-home .hero h1{font-size:clamp(38px,5.4vw,62px);margin:18px 0 22px}
.ls-home .hero p.lede{font-size:18px;color:var(--sub);max-width:480px;margin-bottom:30px}
.ls-home .cta-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:26px}
.ls-home .proof{display:flex;align-items:center;gap:18px;flex-wrap:wrap;color:var(--mute);font-size:13px}
.ls-home .proof .dot{width:3px;height:3px;border-radius:50%;background:var(--mute)}
.ls-home .proof b{color:var(--gold);font-weight:600}
.ls-home .dash{background:linear-gradient(180deg,var(--card2),var(--card));border:1px solid var(--line);border-radius:22px;padding:26px;box-shadow:0 40px 80px -40px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.04);position:relative}
.ls-home .dash::after{content:"";position:absolute;inset:0;border-radius:22px;border:1px solid var(--line-gold);pointer-events:none}
.ls-home .dash-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.ls-home .dash-head .lbl{font-family:var(--disp);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mute)}
.ls-home .tag{font-family:var(--disp);font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px;background:rgba(224,162,60,.12);color:var(--amber);border:1px solid rgba(224,162,60,.25)}
.ls-home .gauge-row{display:flex;align-items:center;gap:24px;margin-bottom:24px}
.ls-home .gauge{position:relative;width:140px;height:140px;flex-shrink:0}
.ls-home .gauge svg{transform:rotate(-90deg)}
.ls-home .gauge .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ls-home .gauge .num b{font-family:var(--disp);font-size:42px;font-weight:700;line-height:1;color:var(--ink)}
.ls-home .gauge .num span{font-size:11px;color:var(--mute);letter-spacing:1px;margin-top:3px}
.ls-home .gauge-note .h{font-family:var(--disp);font-weight:600;font-size:15px;margin-bottom:6px}
.ls-home .gauge-note p{font-size:13px;color:var(--sub);line-height:1.5}
.ls-home .bars{display:flex;flex-direction:column;gap:13px}
.ls-home .bar .top{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;color:var(--sub)}
.ls-home .bar .top b{color:var(--ink);font-weight:500}
.ls-home .bar .top .sc{font-family:var(--disp);font-weight:600}
.ls-home .track{height:6px;border-radius:6px;background:#191926;overflow:hidden}
.ls-home .fill{height:100%;border-radius:6px;transform-origin:left;animation:grow 1.2s cubic-bezier(.2,.8,.2,1) both}
@keyframes grow{from{transform:scaleX(0)}}
.ls-home section{padding:78px 0}
.ls-home .sec-head{max-width:640px;margin-bottom:48px}
.ls-home .sec-head .eyebrow{display:block;margin-bottom:14px}
.ls-home .sec-head h2{font-size:clamp(28px,3.6vw,40px)}
.ls-home .sec-head p{color:var(--sub);font-size:17px;margin-top:14px}
.ls-home .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.ls-home .step{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px;position:relative;overflow:hidden}
.ls-home .step .no{font-family:var(--disp);font-size:13px;font-weight:700;color:var(--gold);letter-spacing:2px}
.ls-home .step h3{font-size:19px;margin:14px 0 8px}
.ls-home .step p{color:var(--sub);font-size:14.5px}
.ls-home .step .ln{position:absolute;left:0;top:0;height:3px;width:40%;background:linear-gradient(90deg,var(--gold),transparent)}
.ls-home .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.ls-home .feat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;transition:border-color .2s, transform .2s}
.ls-home .feat:hover{border-color:var(--line-gold);transform:translateY(-3px)}
.ls-home .feat .ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(200,169,110,.1);border:1px solid var(--line-gold);margin-bottom:16px}
.ls-home .feat h3{font-size:16.5px;margin-bottom:7px}
.ls-home .feat p{font-size:13.5px;color:var(--sub)}
.ls-home .feat .mini{margin-top:14px;font-family:var(--disp);font-size:12px;color:var(--gold);display:flex;align-items:center;gap:8px}
.ls-home .feat .mini .b{height:5px;border-radius:5px;background:linear-gradient(90deg,var(--gold),var(--gold-dk));flex:1}
.ls-home .founder{background:linear-gradient(135deg,var(--card2),var(--card));border:1px solid var(--line-gold);border-radius:22px;padding:40px;display:grid;grid-template-columns:auto 1fr;gap:30px;align-items:center}
.ls-home .av{width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2a2438,#14141f);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-weight:700;font-size:30px;color:var(--gold);flex-shrink:0}
.ls-home .founder h3{font-size:22px;margin-bottom:6px}
.ls-home .founder .role{color:var(--gold);font-family:var(--disp);font-size:13px;letter-spacing:1px;margin-bottom:14px}
.ls-home .founder p{color:var(--sub);font-size:14.5px;max-width:620px;margin-bottom:18px}
.ls-home .final{text-align:center;position:relative;padding:96px 0}
.ls-home .final::before{content:"";position:absolute;left:50%;top:30%;transform:translateX(-50%);width:560px;height:360px;background:radial-gradient(circle,rgba(200,169,110,.14),transparent 65%);pointer-events:none}
.ls-home .final h2{font-size:clamp(30px,4.4vw,52px);position:relative}
.ls-home .final p{color:var(--sub);font-size:18px;margin:18px auto 32px;max-width:440px;position:relative}
.ls-home footer{border-top:1px solid rgba(255,255,255,.06);padding:34px 0;color:var(--sub);font-size:13px}
.ls-home footer .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
@media (max-width:880px){
.ls-home .hero-grid{grid-template-columns:1fr;gap:40px}
.ls-home .steps,.ls-home .grid{grid-template-columns:1fr}
.ls-home .founder{grid-template-columns:1fr;text-align:center;justify-items:center}
.ls-home .hero{padding:54px 0 60px}
}
@media (max-width:640px){
.ls-home .nav-r{gap:12px}
.ls-home .nav-r a{display:none}
.ls-home .nav-r .btn-gold{padding:10px 14px;font-size:13px}
}
.ls-home .foot-links{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.ls-home .foot-links a{color:var(--sub);text-decoration:none}
.ls-home .foot-links a:hover{color:var(--gold)}
@media (prefers-reduced-motion:reduce){
.ls-home *{animation:none!important;transition:none!important}
}
.ls-home :focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:6px}
.ls-home.anim .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease, transform .75s cubic-bezier(.16,.84,.34,1)}
.ls-home.anim .reveal.in{opacity:1;transform:none}
.ls-home.anim .dash.reveal{transform:translateY(26px) scale(.99)}
.ls-home.anim .dash.reveal.in{transform:none}
.ls-home.anim .hero::before{animation:breathe 9s ease-in-out infinite}
@keyframes breathe{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
.ls-home.anim .steps .reveal:nth-child(2){transition-delay:.09s}
.ls-home.anim .steps .reveal:nth-child(3){transition-delay:.18s}
.ls-home.anim .grid .reveal:nth-child(3n+2){transition-delay:.08s}
.ls-home.anim .grid .reveal:nth-child(3n+3){transition-delay:.16s}
.ls-home .feat .ic{color:var(--gold);transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease}
.ls-home .feat .ic svg{width:22px;height:22px;display:block}
.ls-home .feat:hover .ic{transform:translateY(-1px) scale(1.06);border-color:var(--gold);background:rgba(200,169,110,.16);box-shadow:0 0 18px -3px rgba(200,169,110,.55)}
.ls-home .ic-gauge .needle{transform-box:view-box;transform-origin:12px 16px;transition:transform .55s cubic-bezier(.2,.8,.2,1)}
.ls-home .feat:hover .ic-gauge .needle{transform:rotate(48deg)}
.ls-home .feat:hover .ic-edit{animation:ic-wiggle .55s ease}
@keyframes ic-wiggle{0%,100%{transform:rotate(0)}30%{transform:rotate(-8deg)}65%{transform:rotate(6deg)}}
.ls-home .ic-spark .sp1,.ls-home .ic-spark .sp2{transform-box:fill-box;transform-origin:center}
.ls-home .ic-spark .sp2{opacity:.5}
.ls-home .feat:hover .ic-spark .sp1{animation:ic-tw 1.1s ease infinite}
.ls-home .feat:hover .ic-spark .sp2{animation:ic-tw2 1.1s ease infinite}
@keyframes ic-tw{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.88)}}
@keyframes ic-tw2{0%,100%{opacity:.5;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
.ls-home .ic-cal .cday{transform-box:fill-box;transform-origin:center}
.ls-home .feat:hover .ic-cal .cday{animation:ic-dot .9s ease infinite}
@keyframes ic-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.55}}
.ls-home .feat:hover .ic-target{animation:ic-tgt 1.1s ease infinite}
@keyframes ic-tgt{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}
.ls-home .ic-risk .trend{stroke-dasharray:42;stroke-dashoffset:0}
.ls-home .feat:hover .ic-risk .trend{animation:ic-draw .75s ease}
@keyframes ic-draw{0%{stroke-dashoffset:42}100%{stroke-dashoffset:0}}
.ls-home .feat .mini .b{background:linear-gradient(90deg,var(--gold-dk),var(--gold-lt),var(--gold-dk));background-size:200% 100%;animation:mini-flow 3s linear infinite}
@keyframes mini-flow{0%{background-position:0 0}100%{background-position:-200% 0}}
.ls-home .step .ln{position:absolute;left:0;top:0;height:3px;width:100%;background:rgba(200,169,110,.22);overflow:hidden}
.ls-home .step .ln::before{content:"";position:absolute;top:0;left:0;height:100%;width:42%;background:linear-gradient(90deg,transparent,var(--gold-lt),transparent);transform:translateX(-130%);animation:ln-sweep 2.9s ease-in-out infinite}
.ls-home .steps .step:nth-child(2) .ln::before{animation-delay:.55s}
.ls-home .steps .step:nth-child(3) .ln::before{animation-delay:1.1s}
@keyframes ln-sweep{0%{transform:translateX(-130%)}55%{transform:translateX(330%)}100%{transform:translateX(330%)}}
.ls-home .btn-gold{position:relative;overflow:hidden}
.ls-home .btn-gold::after{content:"";position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.42),transparent);transform:translateX(-180%) skewX(-16deg);pointer-events:none}
.ls-home .btn-gold:hover::after{animation:btn-sheen .85s ease}
.ls-home .hero .cta-row .btn-gold::after{animation:btn-sheen 5s ease 2.6s infinite}
.ls-home .hero .cta-row .btn-gold:hover::after{animation:btn-sheen .85s ease}
@keyframes btn-sheen{0%{transform:translateX(-180%) skewX(-16deg)}55%{transform:translateX(300%) skewX(-16deg)}100%{transform:translateX(300%) skewX(-16deg)}}
.ls-home .gauge svg{overflow:visible}
.ls-home #arc{animation:arc-glow 3.4s ease-in-out infinite}
@keyframes arc-glow{0%,100%{filter:drop-shadow(0 0 2px rgba(200,169,110,.3))}50%{filter:drop-shadow(0 0 7px rgba(200,169,110,.65))}}

/* anchors styled as buttons */
.ls-home a.btn{display:inline-block;text-decoration:none}`;

export const HOME_HTML = `<nav><div class="wrap">
  <img src="/logo.png" alt="LinkedScore" />
  <div class="nav-r">
    <a href="#how">How it works</a>
    <a href="#get">What you get</a>
    <a href="/blog">Blog</a>
    <button class="btn btn-gold">Get your score</button>
  </div>
</div></nav>

<header class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow reveal" style="transition-delay:0s">LinkedIn Intelligence</span>
    <h1 class="reveal" style="transition-delay:.07s">Would your profile score <span class="gold">above 50?</span></h1>
    <p class="lede reveal" style="transition-delay:.14s">LinkedScore reads your profile, content and positioning, then hands you a scored, personalized plan to fix exactly what's costing you reach.</p>
    <div class="cta-row reveal" style="transition-delay:.21s">
      <button class="btn btn-gold btn-lg">Get your score, free →</button>
      <a href="#get" class="btn btn-ghost btn-lg">See what's inside</a>
    </div>
    <div class="proof reveal" style="transition-delay:.28s">
      <span>Built on a LinkedIn program that hit 3.5M+ impressions</span>
      <span class="dot"></span><span>About 5 minutes</span>
      <span class="dot"></span><span>No card required</span>
    </div>
  </div>

  <div class="dash reveal" style="transition-delay:.12s">
    <div class="dash-head">
      <span class="lbl">Your LinkedScore</span>
      <span class="tag">Needs work</span>
    </div>
    <div class="gauge-row">
      <div class="gauge">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="60" fill="none" stroke="#191926" stroke-width="11"/>
          <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#e7cf9a"/><stop offset="1" stop-color="#9c763c"/>
          </linearGradient></defs>
          <circle id="arc" cx="70" cy="70" r="60" fill="none" stroke="url(#gg)" stroke-width="11" stroke-linecap="round"
                  stroke-dasharray="377" stroke-dashoffset="377"/>
        </svg>
        <div class="num"><b id="score">0</b><span>OUT OF 100</span></div>
      </div>
      <div class="gauge-note">
        <div class="h">Example score. Yours is built from your real profile.</div>
        <p>Your headline and About section are where most of the points are won or lost. The plan shows the exact fixes.</p>
      </div>
    </div>
    <div class="bars">
      <div class="bar"><div class="top"><b>Headline</b><span class="sc gold">48 / 100</span></div><div class="track"><div class="fill" style="width:48%;background:linear-gradient(90deg,#e0556b,#e0a23c)"></div></div></div>
      <div class="bar"><div class="top"><b>About section</b><span class="sc gold">41 / 100</span></div><div class="track"><div class="fill" style="width:41%;background:linear-gradient(90deg,#e0556b,#e0a23c);animation-delay:.1s"></div></div></div>
      <div class="bar"><div class="top"><b>Experience</b><span class="sc gold">62 / 100</span></div><div class="track"><div class="fill" style="width:62%;background:linear-gradient(90deg,#e0a23c,#c8a96e);animation-delay:.2s"></div></div></div>
    </div>
  </div>
</div></header>

<section id="how"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">How it works</span>
    <h2>Three steps to a scored plan.</h2>
    <p>No generic advice. Everything is built from your real profile and your answers.</p>
  </div>
  <div class="steps">
    <div class="step"><div class="ln"></div><div class="no">STEP 01</div><h3>Add your profile</h3><p>Drop your LinkedIn URL and export. We read your headline, About, experience and activity.</p></div>
    <div class="step"><div class="ln"></div><div class="no">STEP 02</div><h3>Answer a few questions</h3><p>Tell us your goal and voice. Ten quick questions shape the entire plan around you.</p></div>
    <div class="step"><div class="ln"></div><div class="no">STEP 03</div><h3>Get your scored report</h3><p>A 0 to 100 score, graded sections, rewrites, hooks and a 30-day calendar, in about five minutes.</p></div>
  </div>
</div></section>

<section id="get" style="background:var(--bg2)"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">What you get</span>
    <h2>A full diagnosis, then the fix.</h2>
    <p>Every part is personalized to your role, your goal and what your profile already shows.</p>
  </div>
  <div class="grid">
    <div class="feat"><div class="ic"><svg class="ic-gauge" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16a8 8 0 0 1 16 0"/><line class="needle" x1="12" y1="16" x2="15.6" y2="11"/><circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none"/></svg></div><h3>Your LinkedScore</h3><p>One number, 0–100, with a section-by-section breakdown of where you stand.</p><div class="mini"><span>38/100</span><span class="b"></span></div></div>
    <div class="feat"><div class="ic"><svg class="ic-risk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline class="trend" points="3 8 9 13 13 10 21 17"/><polyline points="21 12 21 17 16 17"/></svg></div><h3>Revenue at Risk™</h3><p>The estimated cost of weak positioning, the opportunities your profile is quietly losing.</p><div class="mini"><span>€ at risk</span><span class="b"></span></div></div>
    <div class="feat"><div class="ic"><svg class="ic-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5l4 4L9 19l-4.5 1L5.5 15.5z"/><line x1="13" y1="7" x2="17" y2="11"/></svg></div><h3>Headline & About rewrites</h3><p>Ready-to-paste rewrites in your own voice, built for search and for humans.</p></div>
    <div class="feat"><div class="ic"><svg class="ic-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path class="sp1" d="M11 3.5l1.4 4.1 4.1 1.4-4.1 1.4L11 14.5 9.6 10.4 5.5 9l4.1-1.4z"/><path class="sp2" d="M17.5 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/></svg></div><h3>3 post hooks</h3><p>Three opening hooks written for your voice, each engineered to earn the "see more" click.</p></div>
    <div class="feat"><div class="ic"><svg class="ic-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><line x1="3.5" y1="9.2" x2="20.5" y2="9.2"/><line x1="8" y1="3.2" x2="8" y2="6.4"/><line x1="16" y1="3.2" x2="16" y2="6.4"/><circle class="cday" cx="9" cy="13.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" opacity=".45"/><circle cx="16" cy="13.5" r="1.1" fill="currentColor" stroke="none" opacity=".45"/><circle cx="9" cy="16.8" r="1.1" fill="currentColor" stroke="none" opacity=".45"/></svg></div><h3>30-day calendar</h3><p>A week-by-week roadmap: two strong posts, two engagement weeks, zero filler.</p></div>
    <div class="feat"><div class="ic"><svg class="ic-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg></div><h3>Networking targets</h3><p>Exactly who to reach, with copy-paste connection and follow-up messages.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="founder">
    <div class="av"><img src="data:image/jpeg;base64,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" alt="Ali Azad" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block" /></div>
    <div>
      <h3>Built by Ali Azad</h3>
      <div class="role">10+ YEARS IN SOCIAL · HUAWEI · QIAGEN</div>
      <p>Ali built the executive LinkedIn thought-leadership program at QIAGEN that reached 3.5M+ impressions, and grew his own 10k+ following. Every tactic in LinkedScore is tested on a real profile first — then turned into a plan for yours.</p>
      <a href="https://calendly.com/aliazad1800/how-to-be-a-linkedin-star" target="_blank" rel="noopener" class="btn btn-ghost">Work 1:1 with Ali</a>
    </div>
  </div>
</div></section>

<section class="final"><div class="wrap">
  <h2>Find out your score.</h2>
  <p>About five minutes. Completely free. No card, no fluff, just your number and the moves to raise it.</p>
  <button class="btn btn-gold btn-lg">Get your score, free →</button>
</div></section>

<footer><div class="wrap">
  <span>LinkedScore. LinkedIn growth, scored.</span>
  <span class="foot-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><span>© 2026 LinkedScore</span></span>
</div></footer>`;
