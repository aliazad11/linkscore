export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  const payloadSize = JSON.stringify(messages).length;
  console.log('[api] Payload: ' + (payloadSize/1024).toFixed(1) + 'KB');

  const claudeStart = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    console.log('[claude] Calling Anthropic API...');

    // Add assistant prefill to force JSON output without backticks
    const messagesWithPrefill = [
      ...messages,
      { role: 'assistant', content: '{' }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: 'You are a JSON API. Output ONLY a raw JSON object. No markdown, no backticks, no commentary. Start with { end with }.',
        messages: messagesWithPrefill,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const claudeTime = ((Date.now() - claudeStart) / 1000).toFixed(1);
    console.log('[claude] Response: ' + response.status + ' in ' + claudeTime + 's');

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[claude] Error: ' + JSON.stringify(err));
      return res.status(400).json({ error: err?.error?.message || 'HTTP ' + response.status });
    }

    const data = await response.json();
    const tokens = data.usage?.output_tokens;
    console.log('[claude] Done in ' + ((Date.now() - claudeStart)/1000).toFixed(1) + 's | tokens: ' + tokens);

    // Prepend the { we used as prefill
    const rawText = '{' + (data.content?.[0]?.text || '');
    return res.status(200).json({ text: rawText, tokens });

  } catch (e) {
    clearTimeout(timeout);
    const claudeTime = ((Date.now() - claudeStart) / 1000).toFixed(1);
    if (e.name === 'AbortError') {
      console.error('[claude] ABORTED after ' + claudeTime + 's');
      return res.status(504).json({ error: 'Analysis timed out. Please try again.' });
    }
    console.error('[claude] Error: ' + e.message);
    return res.status(500).json({ error: e.message });
  }
}
