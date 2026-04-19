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

const PORT = Number(process.env.PORT || process.env.WEBHOOK_PORT || 3001);
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const TOKEN = process.env.OPENCLAW_TOKEN || '';
const MODEL = process.env.OPENCLAW_MODEL || 'openclaw';
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

/** Proxy → gateway: max kaç ms bekleyip timeout olacak */
const GW_TIMEOUT_MS = Number(process.env.GW_TIMEOUT_MS || 60_000);

/** İstek başına max token — düşük tutulursa yanıt daha hızlı biter */
const MAX_TOKENS = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : undefined;

/** Temperature 0-1; düşük = daha deterministik */
const TEMPERATURE = process.env.TEMPERATURE !== undefined
  ? Number(process.env.TEMPERATURE)
  : undefined;

if (!TOKEN) {
  console.error('\n❌ OPENCLAW_TOKEN eksik!');
  console.error('   .env.local dosyasına ekleyin:');
  console.error('   OPENCLAW_TOKEN="your_token_here"\n');
  process.exit(1);
}

const NGROK_GATEWAY = GATEWAY_URL.includes('ngrok');
function gwHeaders(base: Record<string, string>): Record<string, string> {
  const h = { ...base };
  if (NGROK_GATEWAY) h['ngrok-skip-browser-warning'] = 'true';
  return h;
}

/** SSE chunk için delta çıkar. Sync yanıt formatı farklı (choices[0].message.content). */
function extractStreamDelta(json: unknown): string {
  const j = json as Record<string, unknown> | null;
  const choice = (j?.choices as Record<string, unknown>[] | undefined)?.[0] as
    | Record<string, unknown>
    | undefined;
  if (!choice) return '';
  const delta = choice.delta as Record<string, unknown> | string | undefined;
  if (typeof delta === 'string') return delta;
  if (delta && typeof delta === 'object') {
    const dObj = delta as Record<string, unknown>;
    if (typeof dObj.text === 'string') return dObj.text;
    const c = dObj.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      return c
        .map((p: unknown) =>
          typeof p === 'string' ? p : (p as { text?: string })?.text ?? '',
        )
        .join('');
    }
  }
  // Bazı gateway'ler stream yerine tam message döner — son chunk'ta olabilir
  const msg = choice.message as { content?: string } | undefined;
  if (typeof msg?.content === 'string') return msg.content;
  const text = choice.text;
  if (typeof text === 'string') return text;
  return '';
}

function extractSyncReply(data: unknown): string {
  const d = data as { choices?: { message?: { content?: unknown } }[] };
  const c = d?.choices?.[0]?.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c
      .map((p: unknown) =>
        typeof p === 'string' ? p : (p as { text?: string })?.text ?? '',
      )
      .join('');
  }
  return extractAnyAssistantText(data);
}

/** Stream=false veya beklenmeyen JSON gövdeleri için ek şekiller */
function extractAnyAssistantText(data: unknown): string {
  if (data == null || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;

  const err = d.error;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return `[Gateway] ${m}`;
  }
  if (typeof d.message === 'string' && d.message.trim()) return d.message;

  if (typeof d.content === 'string') return d.content;
  if (typeof d.output === 'string') return d.output;
  if (typeof d.text === 'string') return d.text;

  const ch0 = d.choices;
  if (Array.isArray(ch0) && ch0[0] && typeof ch0[0] === 'object') {
    const c0 = ch0[0] as Record<string, unknown>;
    if (typeof c0.content === 'string') return c0.content;
    if (typeof c0.text === 'string') return c0.text;
    const msg = c0.message as { content?: unknown } | undefined;
    if (msg && typeof msg.content === 'string') return msg.content;
  }

  return '';
}

// ─── Middleware ───
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Openclaw-Token');
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

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), GW_TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      model: MODEL,
      messages: payload,
      stream: false,
    };
    if (MAX_TOKENS !== undefined) body.max_tokens = MAX_TOKENS;
    if (TEMPERATURE !== undefined) body.temperature = TEMPERATURE;

    const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: gwHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      }),
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    if (!gwRes.ok) {
      const errText = await gwRes.text();
      console.error(`[Gateway] ${gwRes.status}:`, errText);
      return res.status(gwRes.status).json({
        error: `Gateway hata: ${gwRes.status}`,
        detail: errText.slice(0, 500),
      });
    }

    const data: unknown = await gwRes.json();
    const reply = extractSyncReply(data);
    console.log(`[Gateway] ✓ ${String(payload[payload.length - 1]?.content).slice(0, 40)}... → ${reply.slice(0, 40)}...`);
    res.json({ reply, raw: data });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway zaman aşımı' });
    }
    console.error('[Gateway] Fetch hatası:', err?.message);
    res.status(502).json({
      error: 'Gateway yanıt vermedi',
      detail: err?.message || String(err),
    });
  } finally {
    clearTimeout(t);
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
    const body: Record<string, unknown> = {
      model: MODEL,
      messages: payload,
      stream: true,
    };
    if (MAX_TOKENS !== undefined) body.max_tokens = MAX_TOKENS;
    if (TEMPERATURE !== undefined) body.temperature = TEMPERATURE;

    // Önce stream dene — gateway SSE destekliyorsa token-by-token gelir
    // Gateway JSON dönerse (stream:false gibi) otomatik fallback yap
    const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: gwHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!gwRes.ok) {
      const errText = await gwRes.text().catch(() => '');
      send({ error: `Gateway hata: ${gwRes.status}`, detail: errText.slice(0, 400) });
      res.end();
      return;
    }

    const ct = (gwRes.headers.get('content-type') || '').toLowerCase();
    const isSse = ct.includes('event-stream') || ct.includes('text/event-stream');

    if (!isSse) {
      // Gateway stream desteklemiyor → düz JSON döndürdü
      const raw = await gwRes.text();
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        console.warn('[Gateway/stream] JSON parse hatası. Raw ilk 300:', raw.slice(0, 300));
        send({ error: 'Gateway geçersiz JSON', detail: raw.slice(0, 400) });
        send({ done: true });
        res.end();
        return;
      }
      const text = extractSyncReply(data);
      if (!text.trim()) {
        const dbg = JSON.stringify(data).slice(0, 600);
        console.warn('[Gateway/stream] JSON gövdede metin yok:', dbg);
        send({
          error: 'Gateway boş yanıt döndürdü',
          detail: dbg,
        });
        send({ done: true });
        res.end();
        return;
      }
      // Tam metni tek delta olarak gönder
      console.log(`[Gateway/stream->json] ✓ ${text.slice(0, 40)}...`);
      send({ delta: text });
      send({ done: true });
      res.end();
      return;
    }

    if (!gwRes.body) {
      send({ error: 'Gateway gövdesi yok' });
      res.end();
      return;
    }

    const reader = gwRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullReply = '';

    const handleSseLine = (line: string): boolean => {
      const trimmed = line.replace(/\r$/, '');
      if (!trimmed.startsWith('data:')) return false;
      const raw = trimmed.slice(5).trim();
      if (!raw) return false;
      if (raw === '[DONE]') return true;
      try {
        const json = JSON.parse(raw) as unknown;
        const delta = extractStreamDelta(json);
        if (delta) {
          fullReply += delta;
          send({ delta });
        }
      } catch {
        /* parse edilemedi */
      }
      return false;
    };

    const consumeSseBlock = (block: string) => {
      for (const line of block.split('\n')) {
        if (handleSseLine(line)) {
          send({ done: true });
          res.end();
          return true;
        }
      }
      return false;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (consumeSseBlock(chunk)) return;
      }
    }

    // Stream bitti; son blokta `\n\n` olmayabilir — kalan satırları işle
    if (buffer.trim()) {
      if (consumeSseBlock(buffer)) return;
    }

    if (!fullReply.trim()) {
      console.warn(
        '[Gateway/stream] Boş akış. Gateway logunu ve OPENCLAW_MODEL değerini kontrol edin. Model:',
        MODEL,
      );
      send({
        error: 'Yanıt gelmedi. Proxy konsolunda "[Gateway/stream] Boş akış" logunu kontrol edin.',
      });
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
      headers: gwHeaders({ Authorization: `Bearer ${TOKEN}` }),
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

// ─── GET / ───
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'openclaw-proxy' });
});

// ─── GET /health ───
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ─── Başlat ───
server.listen(PORT, () => {
  console.log(`\n🦞 OpenClaw Proxy Server`);
  console.log(`   HTTP:    http://localhost:${PORT}`);
  console.log(`   Stream:  http://localhost:${PORT}/api/message/stream`);
  console.log(`   Gateway: ${GATEWAY_URL}`);
  console.log(`   Model:   ${MODEL}\n`);
});
