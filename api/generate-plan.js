export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();
    
    // Try all possible env var names
    const apiKey = process.env.VITE_ANTHROPIC_KEY || 
                   process.env.ANTHROPIC_KEY || 
                   process.env.ANTHROPIC_API_KEY || '';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'No API key found', env: Object.keys(process.env).filter(k => k.includes('ANTHROP')) }), { status: 500 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 3000,
        system: 'You are a JSON API. You MUST output ONLY a raw JSON object. Start your response with { and end with }. Zero other text allowed.',
        messages
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
