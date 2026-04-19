/**
 * OpenClaw Proxy — Cloudflare Worker
 *
 * Proxies frontend requests to OpenClaw Gateway with:
 * - Streaming SSE passthrough
 * - Sync JSON responses
 * - CORS handling
 * - Secret-based auth (OPENCLAW_GATEWAY_URL, OPENCLAW_TOKEN)
 *
 * Env vars configured in wrangler.jsonc or via wrangler secret put
 */

interface Env {
	OPENCLAW_GATEWAY_URL: string;
	OPENCLAW_TOKEN: string;
	OPENCLAW_MODEL?: string;
	CORS_ORIGIN?: string;
}

function corsHeaders(origin: string): Record<string, string> {
	const allowOrigin = origin || '*';
	return {
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Openclaw-Token',
	};
}

/** Resolve the gateway token: prefer env var, fall back to X-Openclaw-Token or Bearer from request. */
function resolveToken(env: Env, request: Request): string {
	if (env.OPENCLAW_TOKEN) return env.OPENCLAW_TOKEN;
	const fromHeader = request.headers.get('X-Openclaw-Token') || '';
	if (fromHeader) return fromHeader;
	const auth = request.headers.get('Authorization') || '';
	return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}

interface ChatRequestBody {
	text?: string;
	messages?: { role: string; content: string }[];
}

function buildPayload(body: ChatRequestBody | null): { role: string; content: string }[] | null {
	if (!body) return null;
	const { text, messages } = body;
	if (Array.isArray(messages) && messages.length > 0) return messages;
	if (typeof text === 'string' && text.trim()) {
		return [{ role: 'user', content: text }];
	}
	return null;
}

async function handleStream(
	gatewayUrl: string,
	token: string,
	model: string,
	payload: { role: string; content: string }[]
): Promise<Response> {
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

	const send = (obj: unknown) =>
		writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

	// Stream forwarding — non-blocking pipeline
	(async () => {
		try {
			const reader = gwRes.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });

				let idx: number;
				while ((idx = buffer.indexOf('\n\n')) !== -1) {
					const chunk = buffer.slice(0, idx);
					buffer = buffer.slice(idx + 2);

					for (const line of chunk.split('\n')) {
						if (!line.startsWith('data:')) continue;
						const raw = line.slice(5).trim();
						if (!raw) continue;
						if (raw === '[DONE]') {
							send({ done: true });
							await writer.close();
							return;
						}
						try {
							const json = JSON.parse(raw);
							const delta = json?.choices?.[0]?.delta?.content;
							if (delta) send({ delta });
						} catch {
							// skip malformed JSON chunks
						}
					}
				}
			}

			send({ done: true });
		} catch (err) {
			const message = err instanceof Error ? err.message : 'stream error';
			send({ error: message });
		}
		try {
			await writer.close();
		} catch {
			// writer may already be closed
		}
	})();

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}

async function handleSync(
	gatewayUrl: string,
	token: string,
	model: string,
	payload: { role: string; content: string }[]
): Promise<Response> {
	const gwRes = await fetch(`${gatewayUrl}/v1/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ model, messages: payload, stream: false }),
	});

	if (!gwRes.ok) {
		const errText = await gwRes.text();
		return new Response(
			JSON.stringify({
				error: `Gateway ${gwRes.status}`,
				detail: errText.slice(0, 500),
			}),
			{ status: gwRes.status, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const data = await gwRes.json();
	return new Response(
		JSON.stringify({
			reply: data?.choices?.[0]?.message?.content ?? '',
			raw: data,
		}),
		{ headers: { 'Content-Type': 'application/json' } }
	);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const corsOrigin = env.CORS_ORIGIN || '*';
		const model = env.OPENCLAW_MODEL || 'openclaw';

		// CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 200, headers: corsHeaders(corsOrigin) });
		}

		// GET /api/status — health check
		if (path === '/api/status' && request.method === 'GET') {
			const token = resolveToken(env, request);
			try {
				const r = await fetch(`${env.OPENCLAW_GATEWAY_URL}/v1/models`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				return new Response(
					JSON.stringify({
						gateway: r.ok ? 'connected' : 'error',
						status: r.status,
						url: env.OPENCLAW_GATEWAY_URL,
					}),
					{ headers: { ...corsHeaders(corsOrigin), 'Content-Type': 'application/json' } }
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : 'unknown error';
				return new Response(
					JSON.stringify({
						gateway: 'disconnected',
						error: message,
						url: env.OPENCLAW_GATEWAY_URL,
					}),
					{ headers: { ...corsHeaders(corsOrigin), 'Content-Type': 'application/json' } }
				);
			}
		}

		// POST /api/message/stream — SSE streaming
		if (path === '/api/message/stream' && request.method === 'POST') {
			const token = resolveToken(env, request);
			const body = (await request.json().catch(() => null)) as ChatRequestBody | null;
			const payload = buildPayload(body);
			if (!payload) {
				return new Response(
					JSON.stringify({ error: 'text veya messages gerekli' }),
					{
						status: 400,
						headers: { ...corsHeaders(corsOrigin), 'Content-Type': 'application/json' },
					}
				);
			}
			return handleStream(env.OPENCLAW_GATEWAY_URL, token, model, payload);
		}

		// POST /api/message — synchronous response
		if (path === '/api/message' && request.method === 'POST') {
			const token = resolveToken(env, request);
			const body = (await request.json().catch(() => null)) as ChatRequestBody | null;
			const payload = buildPayload(body);
			if (!payload) {
				return new Response(
					JSON.stringify({ error: 'text veya messages gerekli' }),
					{
						status: 400,
						headers: { ...corsHeaders(corsOrigin), 'Content-Type': 'application/json' },
					}
				);
			}
			return handleSync(env.OPENCLAW_GATEWAY_URL, token, model, payload);
		}

		return new Response('Not Found', {
			status: 404,
			headers: corsHeaders(corsOrigin),
		});
	},
} satisfies ExportedHandler<Env>;
