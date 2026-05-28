
export const config = { maxDuration: 60 };
 
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_KEY;
 
async function supabase(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
 
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { messages, jobId } = req.body;
 
  // ── MODE 1: Create job and return immediately ─────────────────────────────
  if (!jobId) {
    const payloadSize = JSON.stringify(messages).length;
    console.log(`[job] New request | payload: ${(payloadSize/1024).toFixed(1)}KB`);
 
    // Create job record in Supabase
    const [job] = await supabase('analysis_jobs', 'POST', {
      status: 'processing',
      payload_size: payloadSize,
      created_at: new Date().toISOString(),
    });
 
    if (!job?.id) {
      console.error('[job] Failed to create job');
      return res.status(500).json({ error: 'Failed to create job' });
    }
 
    console.log(`[job] Created job ${job.id}`);
 
    // Fire and forget — run Claude in background
    runAnalysis(job.id, messages).catch(err => {
      console.error(`[job] Background error for ${job.id}:`, err.message);
    });
 
    return res.status(200).json({ jobId: job.id });
  }
 
  // ── MODE 2: Check job status (polled by frontend) ─────────────────────────
  const jobs = await supabase(`analysis_jobs?id=eq.${jobId}&select=*`, 'GET');
  const job = jobs?.[0];
 
  if (!job) return res.status(404).json({ error: 'Job not found' });
 
  return res.status(200).json({
    status: job.status,
    result: job.result || null,
    error: job.error_message || null,
  });
}
 
async function runAnalysis(jobId, messages) {
  const claudeStart = Date.now();
  console.log(`[claude] Starting for job ${jobId}`);
 
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
 
    const claudeEnd = Date.now();
    const claudeTime = ((claudeEnd - claudeStart) / 1000).toFixed(1);
    console.log(`[claude] Response for job ${jobId} | status: ${response.status} | time: ${claudeTime}s`);
 
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`[claude] Error for job ${jobId}:`, JSON.stringify(errData));
      await supabase(`analysis_jobs?id=eq.${jobId}`, 'PATCH', {
        status: 'error',
        error_message: errData?.error?.message || `HTTP ${response.status}`,
      });
      return;
    }
 
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
 
    // Parse JSON from response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text;
 
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error(`[claude] JSON parse error for job ${jobId}:`, e.message);
      await supabase(`analysis_jobs?id=eq.${jobId}`, 'PATCH', {
        status: 'error',
        error_message: 'Failed to parse analysis result. Please try again.',
      });
      return;
    }
 
    console.log(`[claude] Job ${jobId} complete | score: ${result.score} | archetype: ${result.archetype}`);
 
    await supabase(`analysis_jobs?id=eq.${jobId}`, 'PATCH', {
      status: 'done',
      result: result,
      completed_at: new Date().toISOString(),
      claude_response_time_ms: claudeEnd - claudeStart,
    });
 
  } catch (err) {
    const claudeEnd = Date.now();
    const claudeTime = ((claudeEnd - claudeStart) / 1000).toFixed(1);
    const timedOut = claudeTime > 55;
    console.error(`[claude] Exception for job ${jobId} | time: ${claudeTime}s | timeout: ${timedOut} | error: ${err.message}`);
 
    await supabase(`analysis_jobs?id=eq.${jobId}`, 'PATCH', {
      status: 'error',
      error_message: timedOut
        ? 'Analysis timed out. Please try again without screenshots.'
        : `Analysis failed: ${err.message}`,
    });
  }
}
 
