export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, firstName, plan } = await req.json();

    const hooks = plan.post_hooks?.map((h, i) =>
      `<li style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-left:3px solid #c8a96e;border-radius:4px;">${h}</li>`
    ).join('') || '';

    const rules = plan.critical_rules?.slice(0, 3).map(r =>
      `<li style="margin-bottom:8px;">${r}</li>`
    ).join('') || '';

    const html = `<!DOCTYPE html>
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
    <p style="color:#374151;font-size:12px;text-align:center;">You received this because you used Linkedscore.<br/>© 2025 Linkedscore</p>
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
        subject: `${firstName}, your LinkedIn plan is ready`,
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
