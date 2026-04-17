import { getInsforgeClient } from './insforgeClient';

export const TASK_FILES_BUCKET = 'task-files';
export const MAX_TASK_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadedFileRef {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function uploadTaskFile(ownerId: string, file: File): Promise<UploadedFileRef> {
  const client = getInsforgeClient();
  if (!client) {
    throw new Error('InsForge bağlantısı yok.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${ownerId}/${Date.now()}-${safeName}`;
  const { data, error } = await client.storage.from(TASK_FILES_BUCKET).upload(path, file);
  if (error || !data) {
    throw new Error(error?.message ?? 'Dosya yükleme başarısız.');
  }

  return {
    key: data.key,
    url: data.url,
    size: data.size,
    mimeType: data.mimeType,
  };
}
