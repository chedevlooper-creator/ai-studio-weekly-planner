import { formatBytes } from '../lib/utils';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { DayTasks } from '../types/plan';
import type { AiTaskDraft } from '../lib/aiTaskDrafts';
import { draftsFromAiJson, extractJsonObject } from '../lib/aiTaskDrafts';
import { TEAM, TEXT_PREVIEW_CHARS } from '../data/constants';
import { getInsforgeClient } from '../lib/insforgeClient';

export interface MessageAttachment {
  name: string;
  size: number;
  mimeType: string;
  /** data URL for small files (images/text); omitted for larger files */
  dataUrl?: string;
  /** short inline text preview, for text-like files */
  textPreview?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
  /** true while assistant message is still being streamed */
  streaming?: boolean;
}

interface UseOpenClawResult {
  messages: Message[];
  sendMessage: (text: string, attachments?: MessageAttachment[]) => void;
  stop: () => void;
  isConnected: boolean;
  isTyping: boolean;
  isStreaming: boolean;
}

/** Haftalık plan bağlamı: AI mesajlarına eklenir ve JSON görev taslağı uygulanır. */
export interface OpenClawPlanBridge {
  data: DayTasks[];
  weekLabel: string;
  weekStart: string;
  addTasksFromAiDrafts: (drafts: AiTaskDraft[]) => { added: number; skipped: number };
}

const PROXY_API = (import.meta as any).env?.VITE_OPENCLAW_PROXY || '';
const GATEWAY_URL = (import.meta as any).env?.VITE_OPENCLAW_GATEWAY_URL || '';
const HEALTH_INTERVAL_MS = 15_000;
const NGROK_HEADERS: Record<string, string> = (PROXY_API.includes('ngrok') || GATEWAY_URL.includes('ngrok'))
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {};
const IS_LOCALHOST = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const USE_INSFORGE_FN = !PROXY_API && !GATEWAY_URL && IS_LOCALHOST;

type ChatHistoryMsg = { role: 'system' | 'user' | 'assistant'; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> };

function buildMessageContent(text: string, attachments?: MessageAttachment[]): ChatHistoryMsg['content'] {
  if (!attachments || attachments.length === 0) return text;

  // Check if any image has a dataUrl → use multimodal content array
  const imageAtts = attachments.filter((a) => a.mimeType.startsWith('image/') && a.dataUrl);

  const lines: string[] = [];
  if (text.trim()) lines.push(text.trim());

  // Non-image attachment metadata + text previews
  const nonImageAtts = attachments.filter((a) => !(a.mimeType.startsWith('image/') && a.dataUrl));
  if (nonImageAtts.length > 0) {
    lines.push('\n[Ekli dosyalar]');
    for (const a of nonImageAtts) {
      lines.push(`• ${a.name} (${a.mimeType || 'bilinmeyen'}, ${formatBytes(a.size)})`);
      if (a.textPreview) {
        const preview = a.textPreview.length > TEXT_PREVIEW_CHARS ? a.textPreview.slice(0, TEXT_PREVIEW_CHARS) + '\n…' : a.textPreview;
        lines.push('```');
        lines.push(preview);
        lines.push('```');
      }
    }
  }

  // If images exist, return OpenAI-compatible multimodal content array
  if (imageAtts.length > 0) {
    // Add image file names to text context
    for (const a of imageAtts) {
      lines.push(`• 📷 ${a.name} (${formatBytes(a.size)}) — aşağıda görsel olarak eklendi`);
    }

    const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    const textPart = lines.join('\n');
    if (textPart.trim()) {
      parts.push({ type: 'text', text: textPart });
    }
    for (const img of imageAtts) {
      parts.push({ type: 'image_url', image_url: { url: img.dataUrl! } });
    }
    return parts;
  }

  return lines.join('\n');
}

function buildPlanSystemMessage(ctx: OpenClawPlanBridge): string {
  const validDays = ctx.data.map((d) => d.day).join(', ');
  const teamNames = TEAM.map((m) => m.name).join(', ');
  const compact = ctx.data.map((d) => ({
    gün: d.day,
    görevler: d.tasks.map((t) => ({
      başlık: t.title,
      durum: t.status,
      öncelik: t.priority,
      kişiler: t.assignees.map((a) => a.name),
    })),
  }));
  let json = JSON.stringify(
    { hafta: ctx.weekLabel, haftaBaşlangıcı: ctx.weekStart, günler: compact },
    null,
    2
  );
  if (json.length > 14_000) json = `${json.slice(0, 14_000)}\n…`;

  return [
    'Sen Kafkasder haftalık görev planı asistanısın. Kullanıcı Türkçe yazar; yanıtların kısa ve net olsun.',
    `Geçerli gün adları (yalnızca bunları kullan): ${validDays}.`,
    `Atanabilir ekip üyesi adları: ${teamNames}.`,
    'Kullanıcıya yeni görev eklemen istenirse, yanıtının sonunda bir JSON kod bloğu ekle (```json ... ```). Şema: {"tasks":[{"day":"Salı","title":"Başlık","priority":"Yüksek"|"Orta","status":"Bekliyor"|"Devam Eden"|"Tamamlanan","assigneeNames":["Liman"]}]}.',
    'Sadece gerçekten takvime işlenecek görevler için bu bloğu ekle; sohbet veya özet için ekleme.',
    '',
    'Mevcut plan:',
    json,
  ].join('\n');
}

export function useOpenClaw(plan: OpenClawPlanBridge | null): UseOpenClawResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const planRef = useRef<OpenClawPlanBridge | null>(null);
  planRef.current = plan;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ─── OpenClaw proxy health check ───
  useEffect(() => {
    let alive = true;

    const check = async () => {
      try {
        let data: any;
        if (USE_INSFORGE_FN) {
          const client = getInsforgeClient();
          if (!client) { if (alive) setIsConnected(false); return; }
          const res = await client.functions.invoke('openclaw-proxy', { method: 'GET' });
          data = res.data;
        } else if (GATEWAY_URL) {
          const r = await fetch(`${GATEWAY_URL}/v1/models`, {
            headers: { Authorization: `Bearer ${(import.meta as any).env?.VITE_OPENCLAW_TOKEN}`, ...NGROK_HEADERS },
          });
          data = { gateway: r.ok ? 'connected' : 'error', status: r.status };
        } else {
          const r = await fetch(`${PROXY_API}/api/status`, { headers: NGROK_HEADERS });
          data = await r.json();
        }
        if (!alive) return;
        setIsConnected(data?.gateway === 'connected');
      } catch {
        if (alive) setIsConnected(false);
      }
    };

    check();
    const id = setInterval(check, HEALTH_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const appendDelta = useCallback((assistantId: string, delta: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m)),
    );
  }, []);

  const tryApplyTaskDraftsFromText = useCallback((assistantText: string) => {
    const ctx = planRef.current;
    if (!ctx || !assistantText.includes('"tasks"')) return;
    try {
      const obj = extractJsonObject(assistantText);
      const validDays = ctx.data.map((d) => d.day);
      const drafts = draftsFromAiJson(obj, validDays);
      if (drafts.length) ctx.addTasksFromAiDrafts(drafts);
    } catch {
      /* yapılandırılmış görev yok veya geçersiz JSON */
    }
  }, []);

  const finalizeAssistant = useCallback((assistantId: string, patch?: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, streaming: false, ...patch } : m)),
    );
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (text: string, attachments?: MessageAttachment[]) => {
      const hasAttachments = !!attachments && attachments.length > 0;
      if (!text.trim() && !hasAttachments) return;

      // Önceki bir akış varsa iptal et
      abortRef.current?.abort();

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: text.trim() || (hasAttachments ? '(dosya gönderildi)' : ''),
        timestamp: new Date(),
        attachments,
      };
      const assistantId = crypto.randomUUID();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        text: '',
        timestamp: new Date(),
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsTyping(true);
      setIsStreaming(true);

      const systemPrompt = planRef.current ? buildPlanSystemMessage(planRef.current) : '';
      const thread: ChatHistoryMsg[] = [...messagesRef.current, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: buildMessageContent(m.text, m.attachments),
      }));
      const history: ChatHistoryMsg[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...thread]
        : thread;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let data: { reply?: string; error?: string; detail?: string };
        if (USE_INSFORGE_FN) {
          const client = getInsforgeClient();
          if (!client) throw new Error('InsForge client bulunamadı');
          const res = await client.functions.invoke('openclaw-proxy', {
            body: { messages: history },
          });
          if (res.error) {
            const errMsg = typeof res.error === 'object' && res.error?.message
              ? res.error.message
              : typeof res.error === 'string'
                ? res.error
                : 'Function hatası';
            throw new Error(errMsg);
          }
          data = res.data;
        } else if (GATEWAY_URL) {
          const token = (import.meta as any).env?.VITE_OPENCLAW_TOKEN || '';
          const model = (import.meta as any).env?.VITE_OPENCLAW_MODEL || 'openclaw';
          const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              ...NGROK_HEADERS,
            },
            body: JSON.stringify({ model, messages: history, stream: false }),
            signal: controller.signal,
          });
          if (!gwRes.ok) {
            const errText = await gwRes.text();
            throw new Error(`Gateway ${gwRes.status}: ${errText.slice(0, 200)}`);
          }
          const gwData = await gwRes.json();
          const reply = gwData?.choices?.[0]?.message?.content || '';
          data = { reply };
        } else {
          const res = await fetch(`${PROXY_API}/api/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
            body: JSON.stringify({ messages: history }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          data = await res.json();
        }
        const reply = (data.reply || '').trim();
        if (reply) {
          finalizeAssistant(assistantId, { text: reply });
          tryApplyTaskDraftsFromText(reply);
        } else if (data.error) {
          throw new Error(data.detail ? `${data.error}\n${data.detail.slice(0, 800)}` : data.error);
        } else {
          finalizeAssistant(assistantId, {
            text: '(Yanıt boş) — Gateway yanıt vermedi.',
          });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          finalizeAssistant(assistantId, {
            text: (messagesRef.current.find((m) => m.id === assistantId)?.text || '') + '\n\n⏹ Durduruldu',
          });
        } else {
          console.error('[AI] Hata:', err);
          finalizeAssistant(assistantId, {
            text: `⚠️ ${err?.message || 'Bağlantı hatası'}`,
          });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsTyping(false);
        setIsStreaming(false);
      }
    },
    [finalizeAssistant, tryApplyTaskDraftsFromText],
  );

  return { messages, sendMessage, stop, isConnected, isTyping, isStreaming };
}
