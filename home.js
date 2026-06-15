import { HOME_STRINGS, HOME_META } from "./home.data.js";

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
nav .brand{display:flex;align-items:center}
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
.ls-home .hero-grid{display:grid;grid-template-columns:1.12fr .88fr;gap:52px;align-items:center;position:relative}
.ls-home .hero h1{font-size:clamp(34px,4.6vw,52px);line-height:1.05;margin:18px 0 22px}
.ls-home .hero p.lede{font-size:18px;color:var(--sub);max-width:480px;margin-bottom:20px}
.edge{list-style:none;padding:0;margin:0 0 28px;display:grid;gap:11px;max-width:480px}
.edge li{position:relative;padding-left:32px;font-size:15px;color:var(--ink);line-height:1.4}
.edge li::before{content:"";position:absolute;left:0;top:1px;width:21px;height:21px;border-radius:6px;background:rgba(200,169,110,.12) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e7cf9a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E") center/12px no-repeat;border:1px solid rgba(200,169,110,.32)}
.edge li b{color:var(--gold-lt);font-weight:600}
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
.ls-home nav .wrap{padding:0 16px}
.ls-home nav img{height:22px}
.ls-home .nav-r{gap:10px}
.ls-home .nav-r > a{display:none}
.ls-home nav .navmenu{display:block}
.ls-home .nav-r .btn-gold{padding:9px 12px;font-size:13px;white-space:nowrap}
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
.ls-home a.btn{display:inline-block;text-decoration:none}

/* language switcher (native <details>, works without JS) */
.ls-home .langpick{position:relative}
.ls-home .langpick summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--sub);padding:7px 9px;border-radius:9px;border:1px solid var(--line)}
.ls-home .langpick summary::-webkit-details-marker{display:none}
.ls-home .langpick summary:hover{color:var(--ink);border-color:var(--gold)}
.ls-home .langpick[open] summary{color:var(--gold);border-color:var(--gold)}
.ls-home .langpick summary svg{width:15px;height:15px;display:block}
.ls-home .langmenu{position:absolute;right:0;top:calc(100% + 8px);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px;min-width:158px;display:flex;flex-direction:column;box-shadow:0 24px 60px -24px rgba(0,0,0,.95);z-index:60}
.ls-home .langmenu a{padding:8px 12px;border-radius:8px;font-size:14px;color:var(--sub);font-weight:500}
.ls-home .langmenu a:hover{background:var(--bg2);color:var(--ink)}
.ls-home .langmenu a.cur{color:var(--gold);font-weight:600}
.ls-home .navmenu{display:none;position:relative}
.ls-home .navmenu summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--sub);padding:7px 9px;border-radius:9px;border:1px solid var(--line)}
.ls-home .navmenu summary::-webkit-details-marker{display:none}
.ls-home .navmenu summary:hover{color:var(--ink);border-color:var(--gold)}
.ls-home .navmenu[open] summary{color:var(--gold);border-color:var(--gold)}
.ls-home .navmenu summary svg{width:18px;height:18px;display:block}
.ls-home .navmenu-list{position:absolute;right:0;top:calc(100% + 8px);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px;min-width:172px;display:flex;flex-direction:column;box-shadow:0 24px 60px -24px rgba(0,0,0,.95);z-index:60}
.ls-home .navmenu-list a{padding:9px 12px;border-radius:8px;font-size:14px;color:var(--sub);font-weight:500}
.ls-home .navmenu-list a:hover{background:var(--bg2);color:var(--ink)}`;

// Landing-page locales and their native names (left-to-right launch set).
export const LANDING_LOCALES = [
  ["en", "English"], ["de", "Deutsch"], ["fr", "Français"], ["es", "Español"],
  ["pt", "Português"], ["nl", "Nederlands"], ["it", "Italiano"],
];

// Root-relative URL for a locale's landing page. English lives at "/", others at "/xx/".
export function homeHref(loc) { return loc === "en" ? "/" : "/" + loc + "/"; }

// Per-locale meta (title + description). HOME_META comes from home.data.js;
// any unknown locale falls back to en.
export function homeMeta(loc) { return HOME_META[loc] || HOME_META.en; }


const GLOBE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></svg>`;

function langSwitcher(loc) {
  const items = LANDING_LOCALES.map(
    ([c, n]) => `<a href="${homeHref(c)}"${c === loc ? ' class="cur"' : ""}>${n}</a>`
  ).join("");
  return `<details class="langpick"><summary aria-label="${S(loc).switcher_aria}">${GLOBE_SVG}${loc.toUpperCase()}</summary><div class="langmenu">${items}</div></details>`;
}

function S(loc) { return Object.assign({}, HOME_STRINGS.en, HOME_STRINGS[loc] || {}); }

// Build the full landing markup for a locale. Classes, ids and SVGs are identical
// across locales (only text changes) so the React reveal/CTA wiring works unchanged.
export function homeHtml(loc = "en") {
  const L = S(loc);
  return `<nav><div class="wrap">
  <a href="/" aria-label="LinkedScore home" class="brand"><img src="/logo.png" alt="LinkedScore" /></a>
  <div class="nav-r">
    <a href="#how">${L.nav_how}</a>
    <a href="#get">${L.nav_what}</a>
    <a href="/blog">${L.nav_blog}</a>
    <a href="/about.html">${L.nav_about}</a>
    <a href="/faq.html">${L.nav_faq}</a>
    <details class="navmenu"><summary aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></summary><div class="navmenu-list"><a href="#how">${L.nav_how}</a><a href="#get">${L.nav_what}</a><a href="/blog">${L.nav_blog}</a><a href="/about.html">${L.nav_about}</a><a href="/faq.html">${L.nav_faq}</a></div></details>
    ${langSwitcher(loc)}
    <button class="btn btn-gold">${L.nav_cta}</button>
  </div>
</div></nav>

<header class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow reveal" style="transition-delay:0s">${L.hero_eyebrow}</span>
    <h1 class="reveal" style="transition-delay:.07s">${L.hero_h1}</h1>
    <ul class="edge reveal" style="transition-delay:.14s">
      <li>${L.edge1}</li>
      <li>${L.edge2}</li>
      <li>${L.edge3}</li>
    </ul>
    <div class="cta-row reveal" style="transition-delay:.21s">
      <button class="btn btn-gold btn-lg">${L.hero_cta}</button>
      <a href="#get" class="btn btn-ghost btn-lg">${L.hero_cta2}</a>
    </div>
    <div class="proof reveal" style="transition-delay:.28s">
      <span>${L.proof_impressions}</span>
      <span class="dot"></span><span>${L.proof_time}</span>
      <span class="dot"></span><span>${L.proof_nocard}</span>
    </div>
  </div>

  <div class="dash reveal" style="transition-delay:.12s">
    <div class="dash-head">
      <span class="lbl">${L.dash_label}</span>
      <span class="tag">${L.dash_tag}</span>
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
        <div class="num"><b id="score">0</b><span>${L.dash_outof}</span></div>
      </div>
      <div class="gauge-note">
        <div class="h">${L.dash_note_h}</div>
        <p>${L.dash_note_p}</p>
      </div>
    </div>
    <div class="bars">
      <div class="bar"><div class="top"><b>${L.bar_headline}</b><span class="sc gold">48 / 100</span></div><div class="track"><div class="fill" style="width:48%;background:linear-gradient(90deg,#e0556b,#e0a23c)"></div></div></div>
      <div class="bar"><div class="top"><b>${L.bar_about}</b><span class="sc gold">41 / 100</span></div><div class="track"><div class="fill" style="width:41%;background:linear-gradient(90deg,#e0556b,#e0a23c);animation-delay:.1s"></div></div></div>
      <div class="bar"><div class="top"><b>${L.bar_experience}</b><span class="sc gold">62 / 100</span></div><div class="track"><div class="fill" style="width:62%;background:linear-gradient(90deg,#e0a23c,#c8a96e);animation-delay:.2s"></div></div></div>
    </div>
  </div>
</div></header>

<section id="how"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">${L.how_eyebrow}</span>
    <h2>${L.how_h2}</h2>
    <p>${L.how_p}</p>
  </div>
  <div class="steps">
    <div class="step"><div class="ln"></div><div class="no">${L.step_label} 01</div><h3>${L.step1_h}</h3><p>${L.step1_p}</p></div>
    <div class="step"><div class="ln"></div><div class="no">${L.step_label} 02</div><h3>${L.step2_h}</h3><p>${L.step2_p}</p></div>
    <div class="step"><div class="ln"></div><div class="no">${L.step_label} 03</div><h3>${L.step3_h}</h3><p>${L.step3_p}</p></div>
  </div>
</div></section>

<section id="get" style="background:var(--bg2)"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">${L.get_eyebrow}</span>
    <h2>${L.get_h2}</h2>
    <p>${L.get_p}</p>
  </div>
  <div class="grid">
    <div class="feat"><div class="ic"><svg class="ic-gauge" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16a8 8 0 0 1 16 0"/><line class="needle" x1="12" y1="16" x2="15.6" y2="11"/><circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none"/></svg></div><h3>${L.f1_h}</h3><p>${L.f1_p}</p></div>
    <div class="feat"><div class="ic"><svg class="ic-risk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline class="trend" points="3 8 9 13 13 10 21 17"/><polyline points="21 12 21 17 16 17"/></svg></div><h3>${L.f2_h}</h3><p>${L.f2_p}</p></div>
    <div class="feat"><div class="ic"><svg class="ic-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5l4 4L9 19l-4.5 1L5.5 15.5z"/><line x1="13" y1="7" x2="17" y2="11"/></svg></div><h3>${L.f3_h}</h3><p>${L.f3_p}</p></div>
    <div class="feat"><div class="ic"><svg class="ic-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path class="sp1" d="M11 3.5l1.4 4.1 4.1 1.4-4.1 1.4L11 14.5 9.6 10.4 5.5 9l4.1-1.4z"/><path class="sp2" d="M17.5 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/></svg></div><h3>${L.f4_h}</h3><p>${L.f4_p}</p></div>
    <div class="feat"><div class="ic"><svg class="ic-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><line x1="3.5" y1="9.2" x2="20.5" y2="9.2"/><line x1="8" y1="3.2" x2="8" y2="6.4"/><line x1="16" y1="3.2" x2="16" y2="6.4"/><circle class="cday" cx="9" cy="13.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" opacity=".45"/><circle cx="16" cy="13.5" r="1.1" fill="currentColor" stroke="none" opacity=".45"/><circle cx="9" cy="16.8" r="1.1" fill="currentColor" stroke="none" opacity=".45"/></svg></div><h3>${L.f5_h}</h3><p>${L.f5_p}</p></div>
    <div class="feat"><div class="ic"><svg class="ic-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg></div><h3>${L.f6_h}</h3><p>${L.f6_p}</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="founder">
    <div class="av"><img src="/founder.jpg" alt="Ali Azad" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block" /></div>
    <div>
      <h3>${L.founder_h}</h3>
      <div class="role">${L.founder_role}</div>
      <p>${L.founder_p}</p>
      <a href="https://calendly.com/aliazad1800/how-to-be-a-linkedin-star" target="_blank" rel="noopener" class="btn btn-ghost">${L.founder_cta}</a>
    </div>
  </div>
</div></section>

<section class="final"><div class="wrap">
  <h2>${L.final_h}</h2>
  <p>${L.final_p}</p>
  <button class="btn btn-gold btn-lg">${L.hero_cta}</button>
</div></section>

<footer><div class="wrap">
  <span>${L.footer_tagline}</span>
  <span class="foot-links"><a href="/imprint.html">${L.footer_imprint}</a><a href="${loc==="en"?"":"/"+loc}/privacy.html">${L.footer_privacy}</a><a href="${loc==="en"?"":"/"+loc}/cookies.html">${L.footer_cookies}</a><a href="${loc==="en"?"":"/"+loc}/terms.html">${L.footer_terms}</a><span>© 2026 LinkedScore</span></span>
</div></footer>`;
}

// Back-compat default export (English), for any importer that wants the static string.
export const HOME_HTML = homeHtml("en");
