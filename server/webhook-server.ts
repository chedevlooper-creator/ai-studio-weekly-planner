/**
 * OpenClaw Proxy Server
 * - Frontend'ten gelen mesajları OpenClaw Gateway'in OpenAI-uyumlu endpoint'ine iletir
 * - CORS'u yönetir, token'ı güvende tutar (browser'a sızdırmaz)
 * - /api/message        → senkron tek-yanıt (geriye dönük uyumluluk)
 * - /api/message/stream → Server-Sent Events (token-by-token) — hızlı UX
 */
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';

// .env.local öncelikli, yoksa .env'e düş
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.WEBHOOK_PORT || 3001);
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const TOKEN = process.env.OPENCLAW_TOKEN || '';
const MODEL = process.env.OPENCLAW_MODEL || 'openclaw';
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

if (!TOKEN) {
  console.error('\n❌ OPENCLAW_TOKEN eksik!');
  console.error('   .env.local dosyasına ekleyin:');
  console.error('   OPENCLAW_TOKEN="your_token_here"\n');
  process.exit(1);
}

// ─── Middleware ───
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '8mb' }));

// ─── POST /api/message (senkron) ───
// Body: { text: string } veya { messages: [{role, content}, ...] }
// Cevap: { reply: string, raw: openai-response }
app.post('/api/message', async (req, res) => {
  const { text, messages } = req.body ?? {};

  const payload = Array.isArray(messages) && messages.length > 0
    ? messages
    : typeof text === 'string' && text.trim()
      ? [{ role: 'user', content: text }]
      : null;

  if (!payload) {
    return res.status(400).json({ error: 'text veya messages gerekli' });
  }

  try {
    const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: payload,
        stream: false,
      }),
    });

    if (!gwRes.ok) {
      const errText = await gwRes.text();
      console.error(`[Gateway] ${gwRes.status}:`, errText);
      return res.status(gwRes.status).json({
        error: `Gateway hata: ${gwRes.status}`,
        detail: errText.slice(0, 500),
      });
    }

    const data: any = await gwRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';
    console.log(`[Gateway] ✓ ${String(payload[payload.length - 1]?.content).slice(0, 40)}... → ${reply.slice(0, 40)}...`);
    res.json({ reply, raw: data });
  } catch (err: any) {
    console.error('[Gateway] Fetch hatası:', err?.message);
    res.status(502).json({
      error: 'Gateway yanıt vermedi',
      detail: err?.message || String(err),
    });
  }
});

// ─── POST /api/message/stream (SSE — token-by-token) ───
// Body: { messages: [{role, content}, ...] }
// Event stream: data: { delta: string }  /  data: { done: true }  /  data: { error: string }
app.post('/api/message/stream', async (req, res) => {
  const { text, messages } = req.body ?? {};
  const payload = Array.isArray(messages) && messages.length > 0
    ? messages
    : typeof text === 'string' && text.trim()
      ? [{ role: 'user', content: text }]
      : null;

  if (!payload) {
    res.status(400).json({ error: 'text veya messages gerekli' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj: unknown) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  // İstemci bağlantıyı kestiyse upstream'i de iptal et
  const controller = new AbortController();
  req.on('close', () => controller.abort());

  try {
    const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: payload,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!gwRes.ok || !gwRes.body) {
      const errText = gwRes.body ? await gwRes.text() : '(no body)';
      send({ error: `Gateway hata: ${gwRes.status}`, detail: errText.slice(0, 400) });
      res.end();
      return;
    }

    const reader = gwRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullReply = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE mesajları `\n\n` ile ayrılır; parçaları ayır
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        // Her satır "data: ..." ile başlar
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          if (raw === '[DONE]') {
            send({ done: true });
            res.end();
            return;
          }
          try {
            const json = JSON.parse(raw);
            const delta: string | undefined = json?.choices?.[0]?.delta?.content;
            if (delta) {
              fullReply += delta;
              send({ delta });
            }
            const finish: string | undefined = json?.choices?.[0]?.finish_reason;
            if (finish && finish !== null) {
              // gateway bazen finish_reason ile biter ama [DONE] göndermez
            }
          } catch {
            /* upstream JSON parse edilemedi, yok say */
          }
        }
      }
    }

    console.log(`[Gateway/stream] ✓ ${String(payload[payload.length - 1]?.content).slice(0, 40)}... → ${fullReply.slice(0, 40)}...`);
    send({ done: true });
    res.end();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      res.end();
      return;
    }
    console.error('[Gateway/stream] hata:', err?.message);
    try { send({ error: err?.message || 'stream hatası' }); } catch {}
    res.end();
  }
});

// ─── GET /api/status ───
app.get('/api/status', async (_req, res) => {
  try {
    const r = await fetch(`${GATEWAY_URL}/v1/models`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    res.json({
      gateway: r.ok ? 'connected' : 'error',
      status: r.status,
      url: GATEWAY_URL,
    });
  } catch (err: any) {
    res.json({
      gateway: 'disconnected',
      error: err?.message || String(err),
      url: GATEWAY_URL,
    });
  }
});

// ─── Başlat ───
server.listen(PORT, () => {
  console.log(`\n🦞 OpenClaw Proxy Server`);
  console.log(`   HTTP:    http://localhost:${PORT}`);
  console.log(`   Stream:  http://localhost:${PORT}/api/message/stream`);
  console.log(`   Gateway: ${GATEWAY_URL}`);
  console.log(`   Model:   ${MODEL}\n`);
});
