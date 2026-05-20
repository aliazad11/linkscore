export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, firstName, plan, planId } = await req.json();

    const planUrl = planId
      ? `https://linkedscore.app/plan/${planId}`
      : 'https://linkedscore.app';

    const hooks = plan.post_hooks?.map((h) =>
      `<li style="margin-bottom:12px;padding:14px;background:#0d0d18;border:1px solid #1a1a2e;border-left:3px solid #c8a96e;border-radius:8px;color:#e8e8f0;font-size:14px;line-height:1.6;">${h}</li>`
    ).join('') || '';

    const rules = plan.critical_rules?.slice(0, 3).map(r =>
      `<li style="margin-bottom:10px;color:#6a6a8a;font-size:14px;line-height:1.6;">${r}</li>`
    ).join('') || '';

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#08080e;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <img src="https://raw.githubusercontent.com/aliazad11/linkscore/main/logo.png" alt="Linkedscore" style="height:36px;margin-bottom:36px;display:block;" />
    <h1 style="color:#f9fafb;font-size:26px;font-weight:800;margin-bottom:8px;">${firstName}, you are</h1>
    <h2 style="color:#c8a96e;font-size:24px;font-weight:800;margin-bottom:16px;">${plan.archetype}</h2>
    <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,#c8a96e,transparent);margin-bottom:20px;"></div>
    <p style="color:#4a4a6a;font-size:14px;line-height:1.7;margin-bottom:36px;">${plan.headline}</p>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">YOUR LINKEDIN SCORE</p>
      <p style="color:#c8a96e;font-size:52px;font-weight:800;margin:0 0 6px;">${plan.score}<span style="font-size:18px;color:#3a3a5a;">/100</span></p>
      <p style="color:#ef4444;font-size:12px;line-height:1.5;">${plan.urgency}</p>
    </div>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">YOUR 3 POST HOOKS</p>
      <ul style="list-style:none;padding:0;margin:0;">${hooks}</ul>
    </div>
    <div style="background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;margin-bottom:32px;">
      <p style="color:#3a3a5a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">3 CRITICAL RULES</p>
      <ul style="padding-left:18px;margin:0;">${rules}</ul>
    </div>
    <a href="${planUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#c8a96e,#a07840);color:#08080e;text-decoration:none;padding:16px;border-radius:14px;font-weight:700;font-size:15px;margin-bottom:28px;">View My Full Plan →</a>
    <p style="color:#2a2a3a;font-size:11px;text-align:center;">You received this because you used Linkedscore. · © 2025 Linkedscore</p>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'Linkedscore <noreply@linkedscore.app>',
        to: [email],
        subject: `${firstName}, your LinkedIn plan is ready — Score: ${plan.score}`,
        html
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
