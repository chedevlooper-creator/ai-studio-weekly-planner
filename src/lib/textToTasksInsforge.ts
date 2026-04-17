/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { draftsFromAiJson, extractJsonObject, type AiTaskDraft } from './aiTaskDrafts';
import { getInsforgeClient } from './insforgeClient';

export type { AiTaskDraft };

const DEFAULT_CHAT_MODEL = 'openai/gpt-4o-mini';

function resolveModelId(): string {
  const id = import.meta.env.VITE_INSFORGE_AI_MODEL as string | undefined;
  return id?.trim() || DEFAULT_CHAT_MODEL;
}

function buildSystemPrompt(validDayNames: string[]): string {
  const firstDay = validDayNames[0] ?? 'Pazartesi';
  return `Sen bir görev planlama asistanısın. Kullanıcının verdiği metni analiz et ve haftalık görev listesine dönüştür.

Kurallar:
- Çıktı YALNIZCA geçerli bir JSON nesnesi olsun (markdown veya açıklama yok).
- Şema: {"tasks":[{"day":"...","title":"...","priority":"Yüksek"|"Orta","status":"Bekliyor"|"Devam Eden"|"Tamamlanan","assigneeNames":["Liman"]}]}
- "day" alanı ŞU İSİMLERDEN BİRİ olmalı: ${JSON.stringify(validDayNames)}
- Bilinmeyen gün için en mantıklı günü seç veya ilk günü kullan: ${firstDay}
- "assigneeNames" isteğe bağlı; sadece şu isimlerden kullan: Liman, İman, İsa (yazımı aynen)
- Öncelik belirsizse "Yüksek", durum belirsizse "Bekliyor"
- Her görev için kısa ve net Türkçe başlık`;
}

/**
 * Serbest metni haftalık plan görev listesine çevirir (InsForge AI Gateway).
 */
export async function parseTasksFromTextWithInsforge(
  rawText: string,
  validDayNames: string[]
): Promise<AiTaskDraft[]> {
  const text = rawText.trim();
  if (!text) return [];

  const client = getInsforgeClient();
  if (!client) {
    throw new Error(
      'InsForge bağlantısı yok. VITE_INSFORGE_BASE_URL ve VITE_INSFORGE_ANON_KEY ayarlayın veya giriş yapın.'
    );
  }

  const model = resolveModelId();
  const completion = await client.ai.chat.completions.create({
    model,
    temperature: 0.2,
    maxTokens: 4096,
    messages: [
      { role: 'system', content: buildSystemPrompt(validDayNames) },
      {
        role: 'user',
        content: `Kullanıcı metni:\n---\n${text}\n---\n\nYanıtın yalnızca JSON nesnesi olsun.`,
      },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('AI yanıtı boş veya beklenmeyen formatta.');
  }

  const obj = extractJsonObject(content);
  return draftsFromAiJson(obj, validDayNames);
}
