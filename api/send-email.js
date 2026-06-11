export const config = { runtime: 'edge' };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, firstName, plan, planId } = await req.json();

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
    const planUrl = `https://linkedscore.app/plan/${planId}`;
    const score = clampScore(plan.score);

    const hooks = (Array.isArray(plan.post_hooks) ? plan.post_hooks.slice(0, 3) : []).map((h) =>
      `<li style="margin-bottom:12px;padding:14px;background:#0d0d18;border:1px solid #1a1a2e;border-left:3px solid #c8a96e;border-radius:8px;color:#e8e8f0;font-size:14px;line-height:1.6;list-style:none;">${esc(String(h).slice(0, 600))}</li>`
    ).join('') || '';

    const rules = (Array.isArray(plan.critical_rules) ? plan.critical_rules.slice(0, 3) : []).map(r =>
      `<li style="margin-bottom:10px;color:#6a6a8a;font-size:14px;line-height:1.6;">${esc(String(r).slice(0, 400))}</li>`
    ).join('') || '';

    const tl = plan.thought_leader;
    const thoughtLeaderBlock = tl && tl.available ? `
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">THOUGHT LEADER SCORE</p>
      <p style="color:#c8a96e;font-size:52px;font-weight:800;margin:0 0 6px;">${clampScore(tl.score)}<span style="font-size:18px;color:#3a3a5a;">/100</span></p>
      <div style="margin-top:14px;">
        ${[['Hook Quality', clampScore(tl.hook_score)], ['Engagement', clampScore(tl.engagement_score)], ['Voice', clampScore(tl.voice_score)], ['Structure', clampScore(tl.structure_score)]].map(([label, score]) => `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#4a4a6a;font-size:12px;">${label}</span>
            <span style="color:${score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981'};font-size:12px;font-weight:700;">${score}/100</span>
          </div>
          <div style="height:3px;background:#1a1a2e;border-radius:4px;">
            <div style="height:100%;width:${score}%;background:${score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981'};border-radius:4px;"></div>
          </div>
        </div>`).join('')}
      </div>
      <p style="color:#4a4a6a;font-size:13px;line-height:1.6;margin-top:12px;padding-top:12px;border-top:1px solid #1a1a2e;">${esc(String(tl.analysis || '').slice(0, 400))}</p>
    </div>` : '';

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#08080e;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <img src="https://linkedscore.app/logo.png" alt="Linkedscore" style="height:36px;margin-bottom:36px;display:block;" />
    <h1 style="color:#f9fafb;font-size:26px;font-weight:800;margin-bottom:8px;">${name}, you are</h1>
    <h2 style="color:#c8a96e;font-size:24px;font-weight:800;margin-bottom:16px;">${esc(String(plan.archetype || '').slice(0, 80))}</h2>
    <div style="width:40px;height:1px;background:#c8a96e;margin-bottom:20px;"></div>
    <p style="color:#4a4a6a;font-size:14px;line-height:1.7;margin-bottom:32px;">${esc(String(plan.headline || '').slice(0, 300))}</p>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">PROFILE SCORE</p>
      <p style="color:#c8a96e;font-size:52px;font-weight:800;margin:0 0 6px;">${score}<span style="font-size:18px;color:#3a3a5a;">/100</span></p>
      <p style="color:#ef4444;font-size:12px;line-height:1.5;">${esc(String(plan.urgency || '').slice(0, 300))}</p>
    </div>
    ${thoughtLeaderBlock}
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">YOUR 3 POST HOOKS</p>
      <ul style="list-style:none;padding:0;margin:0;">${hooks}</ul>
    </div>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:32px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">3 CRITICAL RULES</p>
      <ul style="padding-left:18px;margin:0;">${rules}</ul>
    </div>
    <a href="${planUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#c8a96e,#a07840);color:#08080e;text-decoration:none;padding:16px;border-radius:14px;font-weight:700;font-size:15px;margin-bottom:28px;">View My Full Plan</a>
    <p style="color:#2a2a3a;font-size:11px;text-align:center;">You received this because you used Linkedscore. &copy; 2025 Linkedscore</p>
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
        from: 'Linkedscore <noreply@linkedscore.app>',
        to: [cleanEmail],
        subject: `${String(firstName || 'Hi').slice(0, 60)}, your LinkedIn plan is ready — Score: ${score}`,
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
