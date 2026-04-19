/**
 * OpenClaw Proxy — InsForge Edge Function (Deno runtime)
 * Frontend -> InsForge Function -> OpenClaw Gateway (token backend'de guvenli)
 *
 * Env: OPENCLAW_GATEWAY_URL, OPENCLAW_TOKEN, OPENCLAW_MODEL, CORS_ORIGIN
 */

const GATEWAY_URL = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'http://127.0.0.1:18789';
const TOKEN = Deno.env.get('OPENCLAW_TOKEN') || '';
const MODEL = Deno.env.get('OPENCLAW_MODEL') || 'openclaw';
const CORS = Deno.env.get('CORS_ORIGIN') || '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Openclaw-Token',
  };
}

function resolveToken(request) {
  if (TOKEN) return TOKEN;
  const fromHeader = request.headers.get('X-Openclaw-Token') || '';
  if (fromHeader) return fromHeader;
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}

function buildPayload(body) {
  const { text, messages } = body ?? {};
  if (Array.isArray(messages) && messages.length > 0) return messages;
  if (typeof text === 'string' && text.trim()) {
    return [{ role: 'user', content: text }];
  }
  return null;
}

async function streamToClient(gatewayUrl, token, model, payload) {
  const gwRes = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ model, messages: payload, stream: true }),
  });

  if (!gwRes.ok || !gwRes.body) {
    const errText = gwRes.body ? await gwRes.text() : '(no body)';
    return new Response(
      `data: ${JSON.stringify({ error: `Gateway ${gwRes.status}`, detail: errText.slice(0, 400) })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = (obj) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  (async () => {
    try {
      const reader = gwRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trim();
            if (!raw) continue;
            if (raw === '[DONE]') { send({ done: true }); await writer.close(); return; }
            try {
              const json = JSON.parse(raw);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) send({ delta });
            } catch { /* skip bad JSON */ }
          }
        }
      }
      send({ done: true });
    } catch (err) {
      send({ error: err.message || 'stream error' });
    }
    try { await writer.close(); } catch {}
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

module.exports = async function(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  // GET /api/status
  if (path === '/api/status' && request.method === 'GET') {
    const token = resolveToken(request);
    try {
      const r = await fetch(`${GATEWAY_URL}/v1/models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return new Response(JSON.stringify({
        gateway: r.ok ? 'connected' : 'error',
        status: r.status,
        url: GATEWAY_URL,
      }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({
        gateway: 'disconnected',
        error: err.message,
        url: GATEWAY_URL,
      }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }
  }

  // POST /api/message/stream
  if (path === '/api/message/stream' && request.method === 'POST') {
    const token = resolveToken(request);
    const body = await request.json().catch(() => ({}));
    const payload = buildPayload(body);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'text veya messages gerekli' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }
    return streamToClient(GATEWAY_URL, token, MODEL, payload);
  }

  // POST /api/message (senkron)
  if (path === '/api/message' && request.method === 'POST') {
    const token = resolveToken(request);
    const body = await request.json().catch(() => ({}));
    const payload = buildPayload(body);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'text veya messages gerekli' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }
    try {
      const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: MODEL, messages: payload, stream: false }),
      });
      if (!gwRes.ok) {
        const errText = await gwRes.text();
        return new Response(JSON.stringify({
          error: `Gateway ${gwRes.status}`,
          detail: errText.slice(0, 500),
        }), { status: gwRes.status, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
      }
      const data = await gwRes.json();
      return new Response(JSON.stringify({ reply: data?.choices?.[0]?.message?.content ?? '', raw: data }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Gateway yanıt vermedi', detail: err.message }), {
        status: 502,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders() });
};
