export const config = { runtime: 'edge' };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Email chrome strings. The plan body (archetype, headline, hooks, rules) is already
// in the user's language from the model; this localizes the surrounding labels so the
// whole email is consistent. Falls back to English for any unknown locale.
const EMAIL_STRINGS = {
  en: { subj_ready: "your LinkedIn plan is ready", subj_score: "Score", you_are: "you are", profile_score: "PROFILE SCORE", tl_score: "THOUGHT LEADER SCORE", post_hooks: "YOUR 3 POST HOOKS", critical_rules: "3 CRITICAL RULES", hook_quality: "Hook Quality", engagement: "Engagement", voice: "Voice", structure: "Structure", view_plan: "View My Full Plan", footer: "You received this because you used LinkedScore. Unsubscribe anytime by replying to this email.", privacy: "Privacy" },
  de: { subj_ready: "dein LinkedIn-Plan ist fertig", subj_score: "Score", you_are: "du bist", profile_score: "PROFIL-SCORE", tl_score: "THOUGHT-LEADER-SCORE", post_hooks: "DEINE 3 POST-HOOKS", critical_rules: "3 WICHTIGE REGELN", hook_quality: "Hook-Qualität", engagement: "Engagement", voice: "Stimme", structure: "Struktur", view_plan: "Meinen vollständigen Plan ansehen", footer: "Du erhältst diese E-Mail, weil du LinkedScore genutzt hast. Abmeldung jederzeit per Antwort auf diese E-Mail.", privacy: "Datenschutz" },
  fr: { subj_ready: "votre plan LinkedIn est prêt", subj_score: "Score", you_are: "vous êtes", profile_score: "SCORE DU PROFIL", tl_score: "SCORE THOUGHT LEADER", post_hooks: "VOS 3 ACCROCHES", critical_rules: "3 RÈGLES ESSENTIELLES", hook_quality: "Qualité de l'accroche", engagement: "Engagement", voice: "Voix", structure: "Structure", view_plan: "Voir mon plan complet", footer: "Vous recevez cet e-mail car vous avez utilisé LinkedScore. Désinscription à tout moment en répondant à cet e-mail.", privacy: "Confidentialité" },
  es: { subj_ready: "tu plan de LinkedIn está listo", subj_score: "Puntuación", you_are: "eres", profile_score: "PUNTUACIÓN DEL PERFIL", tl_score: "PUNTUACIÓN THOUGHT LEADER", post_hooks: "TUS 3 GANCHOS", critical_rules: "3 REGLAS CLAVE", hook_quality: "Calidad del gancho", engagement: "Engagement", voice: "Voz", structure: "Estructura", view_plan: "Ver mi plan completo", footer: "Recibes este correo porque usaste LinkedScore. Cancela la suscripción en cualquier momento respondiendo a este correo.", privacy: "Privacidad" },
  pt: { subj_ready: "o teu plano de LinkedIn está pronto", subj_score: "Pontuação", you_are: "és", profile_score: "PONTUAÇÃO DO PERFIL", tl_score: "PONTUAÇÃO THOUGHT LEADER", post_hooks: "OS TEUS 3 GANCHOS", critical_rules: "3 REGRAS ESSENCIAIS", hook_quality: "Qualidade do gancho", engagement: "Engagement", voice: "Voz", structure: "Estrutura", view_plan: "Ver o meu plano completo", footer: "Recebes este email porque usaste o LinkedScore. Cancela a subscrição a qualquer momento respondendo a este email.", privacy: "Privacidade" },
  nl: { subj_ready: "je LinkedIn-plan is klaar", subj_score: "Score", you_are: "je bent", profile_score: "PROFIELSCORE", tl_score: "THOUGHT LEADER-SCORE", post_hooks: "JOUW 3 POST-HOOKS", critical_rules: "3 BELANGRIJKE REGELS", hook_quality: "Hook-kwaliteit", engagement: "Engagement", voice: "Stem", structure: "Structuur", view_plan: "Bekijk mijn volledige plan", footer: "Je ontvangt deze e-mail omdat je LinkedScore hebt gebruikt. Afmelden kan altijd door op deze e-mail te antwoorden.", privacy: "Privacy" },
  it: { subj_ready: "il tuo piano LinkedIn è pronto", subj_score: "Punteggio", you_are: "sei", profile_score: "PUNTEGGIO DEL PROFILO", tl_score: "PUNTEGGIO THOUGHT LEADER", post_hooks: "I TUOI 3 HOOK", critical_rules: "3 REGOLE FONDAMENTALI", hook_quality: "Qualità dell'hook", engagement: "Engagement", voice: "Voce", structure: "Struttura", view_plan: "Vedi il mio piano completo", footer: "Ricevi questa email perché hai usato LinkedScore. Annulla l'iscrizione in qualsiasi momento rispondendo a questa email.", privacy: "Privacy" },
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validEmail(e) {
  if (!e || typeof e !== 'string') return false;
  e = e.trim();
  if (e.length < 5 || e.length > 254) return false;
  if (e.indexOf(' ') > -1) return false;
  const at = e.indexOf('@');
  if (at < 1) return false;
  const dot = e.indexOf('.', at);
  if (dot < at + 2) return false;
  if (dot === e.length - 1) return false;
  return true;
}

function clampScore(n) {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
}

// WebCrypto twin of _auth.js signToken (this file runs on the edge runtime, which has
// no node:crypto). Format must stay byte-identical: base64url(json) + "." +
// base64url(HMAC-SHA256(secret, base64url(json))), with `exp` added to the payload.
async function signLoginToken(payload, ttlSeconds) {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) return null;
  const b64url = (bytes) => {
    let s = "";
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const enc = new TextEncoder();
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64url(enc.encode(JSON.stringify(body)));
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return data + "." + b64url(sig);
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, firstName, plan, planId, locale, archetype, cardImage, cardCaption } = await req.json();
    const lang = EMAIL_STRINGS[locale] ? locale : "en";
    const L = EMAIL_STRINGS[lang];
    // Ready-to-paste share copy heading, localized. The caption itself (cardCaption) is
    // already in the user's locale and house style; this just labels it in the email.
    const SHARE_COPY = {
      en: "YOUR LINKEDIN POST, COPY AND PASTE IT WITH THE IMAGE ABOVE",
      de: "DEIN LINKEDIN-POST, KOPIERE UND FÜGE IHN MIT DEM BILD OBEN EIN",
      fr: "VOTRE POST LINKEDIN, À COPIER-COLLER AVEC L'IMAGE CI-DESSUS",
      es: "TU PUBLICACIÓN DE LINKEDIN, CÓPIALA Y PÉGALA CON LA IMAGEN DE ARRIBA",
      pt: "O TEU POST DO LINKEDIN, COPIA E COLA COM A IMAGEM ACIMA",
      nl: "JOUW LINKEDIN-POST, KOPIEER EN PLAK MET DE AFBEELDING HIERBOVEN",
      it: "IL TUO POST LINKEDIN, COPIALO E INCOLLALO CON L'IMMAGINE SOPRA",
    };
    const shareCopyLabel = SHARE_COPY[lang] || SHARE_COPY.en;
    // Draft caveat shown under the hooks: these are AI drafts, verify specifics before posting.
    const DRAFT_CAVEAT = {
      en: "Check any names, numbers or stories against your real profile before you post.",
      de: "Prüfe Namen, Zahlen oder Geschichten an deinem echten Profil, bevor du postest.",
      fr: "Vérifiez les noms, chiffres ou anecdotes avec votre vrai profil avant de publier.",
      es: "Verifica los nombres, cifras o historias con tu perfil real antes de publicar.",
      pt: "Confira nomes, números ou histórias no seu perfil real antes de publicar.",
      nl: "Controleer namen, cijfers of verhalen met je echte profiel voordat je plaatst.",
      it: "Controlla nomi, numeri o storie sul tuo profilo reale prima di pubblicare.",
    };
    const draftCaveat = DRAFT_CAVEAT[lang] || DRAFT_CAVEAT.en;

    if (!validEmail(email)) {
      return new Response(JSON.stringify({ error: 'A valid email is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!planId || typeof planId !== 'string' || !UUID_RE.test(planId)) {
      return new Response(JSON.stringify({ error: 'Missing plan reference' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!plan || typeof plan !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing plan' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // The email may only be sent to the address that owns this saved plan.
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const cleanEmail = email.trim().toLowerCase();
    const check = await fetch(`${SUPABASE_URL}/rest/v1/plans?id=eq.${encodeURIComponent(planId)}&select=email`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
    });
    if (!check.ok) {
      return new Response(JSON.stringify({ error: 'Lookup failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const rows = await check.json();
    const owner = rows && rows[0] && typeof rows[0].email === 'string' ? rows[0].email.trim().toLowerCase() : null;
    if (!owner || owner !== cleanEmail) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const name = esc(String(firstName || 'there').slice(0, 60));
    // The CTA carries a signed auto-login link: on a phone the email is usually opened
    // in a browser with no session, and a bare /plan/:id would greet the report's own
    // owner with a locked "shared result" page. Trust model = email inbox access, same
    // as the magic link; TTL is 48 hours so a forwarded email doesn't stay a
    // working session grant for long. Falls back to the plain URL if AUTH_SECRET is unset.
    let planUrl = `https://www.linkedscore.app/plan/${planId}`;
    try {
      const tok = await signLoginToken({ email: cleanEmail, purpose: "login", next: `/plan/${planId}` }, 48 * 3600);
      if (tok) planUrl = `https://www.linkedscore.app/api/auth-verify?token=${encodeURIComponent(tok)}&p=${encodeURIComponent(planId)}`;
    } catch (e) { /* keep the plain link */ }
    const score = clampScore(plan.score);

    const hooks = (Array.isArray(plan.post_hooks) ? plan.post_hooks.slice(0, 3) : []).map((h) =>
      `<li style="margin-bottom:12px;padding:14px;background:#0d0d18;border:1px solid #1a1a2e;border-left:3px solid #c8a96e;border-radius:8px;color:#e8e8f0;font-size:14px;line-height:1.6;list-style:none;">${esc(String(h).slice(0, 600))}</li>`
    ).join('') || '';

    const rules = (Array.isArray(plan.critical_rules) ? plan.critical_rules.slice(0, 3) : []).map(r =>
      `<li style="margin-bottom:10px;color:#b6b5cc;font-size:14px;line-height:1.6;">${esc(String(r).slice(0, 400))}</li>`
    ).join('') || '';

    const tl = plan.thought_leader;
    const thoughtLeaderBlock = tl && tl.available ? `
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#8a8aa8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">${L.tl_score}</p>
      <p style="color:#c8a96e;font-size:52px;font-weight:800;margin:0 0 6px;">${clampScore(tl.score)}<span style="font-size:18px;color:#8a8aa8;">/100</span></p>
      <div style="margin-top:14px;">
        ${[[L.hook_quality, clampScore(tl.hook_score)], [L.engagement, clampScore(tl.engagement_score)], [L.voice, clampScore(tl.voice_score)], [L.structure, clampScore(tl.structure_score)]].map(([label, score]) => `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#b6b5cc;font-size:12px;">${label}</span>
            <span style="color:${score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981'};font-size:12px;font-weight:700;">${score}/100</span>
          </div>
          <div style="height:3px;background:#1a1a2e;border-radius:4px;">
            <div style="height:100%;width:${score}%;background:${score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981'};border-radius:4px;"></div>
          </div>
        </div>`).join('')}
      </div>
      <p style="color:#b6b5cc;font-size:13px;line-height:1.6;margin-top:12px;padding-top:12px;border-top:1px solid #1a1a2e;">${esc(String(tl.analysis || '').slice(0, 400))}</p>
    </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background:#08080e;font-family:'Segoe UI',sans-serif;" bgcolor="#08080e">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;background:#08080e;">
    <span style="display:inline-block;background:#0a0a0f;border-radius:10px;padding:9px 12px;margin-bottom:36px;"><img src="https://www.linkedscore.app/logo.png" alt="LinkedScore" style="height:36px;display:block;" /></span>
    <h1 style="color:#f9fafb;font-size:26px;font-weight:800;margin-bottom:8px;">${name}, ${L.you_are}</h1>
    <h2 style="color:#c8a96e;font-size:24px;font-weight:800;margin-bottom:16px;">${esc(String(archetype || plan.archetype || '').slice(0, 80))}</h2>
    <div style="width:40px;height:1px;background:#c8a96e;margin-bottom:20px;"></div>
    ${cardImage ? `<img src="${esc(cardImage)}" alt="${esc(String(archetype || plan.archetype || '').slice(0, 80))}" width="540" style="width:100%;max-width:540px;height:auto;border-radius:14px;border:1px solid #20202f;margin:0 0 16px;display:block;" />` : ''}
    ${cardCaption ? `<div style="background:#0d0d18;border:1px solid #20202f;border-radius:14px;padding:20px;margin:0 0 24px;">
      <p style="color:#8a8aa8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">${shareCopyLabel}</p>
      <p style="color:#d8d7e8;font-size:14px;line-height:1.7;white-space:pre-wrap;margin:0;">${esc(String(cardCaption).slice(0, 1200))}</p>
    </div>` : ''}
    <p style="color:#b6b5cc;font-size:14px;line-height:1.7;margin-bottom:32px;">${esc(String(plan.headline || '').slice(0, 300))}</p>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#8a8aa8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">${L.profile_score}</p>
      <p style="color:#c8a96e;font-size:52px;font-weight:800;margin:0 0 6px;">${score}<span style="font-size:18px;color:#8a8aa8;">/100</span></p>
      <p style="color:#f87171;font-size:13px;line-height:1.5;">${esc(String(plan.urgency || '').slice(0, 300))}</p>
    </div>
    ${thoughtLeaderBlock}
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#8a8aa8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">${L.post_hooks}</p>
      <ul style="list-style:none;padding:0;margin:0;">${hooks}</ul>
      <p style="color:#9a99b4;font-size:12px;line-height:1.5;margin:14px 0 0;"><span style="color:#c8a96e;">&#10003;</span> ${draftCaveat}</p>
    </div>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:32px;">
      <p style="color:#8a8aa8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">${L.critical_rules}</p>
      <ul style="padding-left:18px;margin:0;">${rules}</ul>
    </div>
    <a href="${planUrl}" style="display:block;text-align:center;background-color:#c8a96e;background:linear-gradient(135deg,#c8a96e,#a07840);color:#08080e;text-decoration:none;padding:16px;border-radius:14px;font-weight:700;font-size:15px;margin-bottom:28px;">${L.view_plan}</a>
    <p style="color:#9a99b4;font-size:11px;text-align:center;line-height:1.6;">${L.footer} <a href="https://www.linkedscore.app/privacy.html" style="color:#9696b4;">${L.privacy}</a><br/>&copy; 2026 LinkedScore</p>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY || process.env.VITE_RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'LinkedScore <noreply@linkedscore.app>',
        reply_to: 'a.azad@linkedscore.app',
        to: [cleanEmail],
        subject: `${String(firstName || 'Hi').slice(0, 60)}, ${L.subj_ready} — ${L.subj_score}: ${score}`,
        html
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[send-email] Resend error ' + res.status + ' ' + detail);
      return new Response(JSON.stringify({ error: 'Email could not be sent' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ id: data.id || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('[send-email] ' + (e && e.message));
    return new Response(JSON.stringify({ error: 'Email could not be sent' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
