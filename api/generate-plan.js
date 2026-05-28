export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  const payloadSize = JSON.stringify(messages).length;
  console.log('[api] Payload: ' + (payloadSize/1024).toFixed(1) + 'KB | ' + new Date().toISOString());

  const claudeStart = Date.now();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system: 'You are a JSON API. You MUST output ONLY a raw JSON object. Start your response with { and end with }. Zero other text allowed.',
        messages,
      }),
    });

    const claudeTime = ((Date.now() - claudeStart) / 1000).toFixed(1);
    console.log('[claude] Status: ' + response.status + ' | Time: ' + claudeTime + 's');

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[claude] Error: ' + JSON.stringify(err));
      return res.status(400).json({ error: err?.error?.message || 'HTTP ' + response.status });
    }

    const data = await response.json();
    console.log('[claude] Done | Total: ' + ((Date.now() - claudeStart)/1000).toFixed(1) + 's');
    return res.status(200).json(data);

  } catch (e) {
    const claudeTime = ((Date.now() - claudeStart) / 1000).toFixed(1);
    const timedOut = claudeTime > 55;
    console.error('[claude] Exception | Time: ' + claudeTime + 's | Timeout: ' + timedOut + ' | ' + e.message);
    return res.status(504).json({ error: timedOut ? 'timeout' : e.message });
  }
}
