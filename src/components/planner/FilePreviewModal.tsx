/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Download, FileText, Image as ImageIcon, FileSpreadsheet, File } from 'lucide-react';
import { useEffect } from 'react';
import type { TaskAttachment } from '../../types/plan';

export function FilePreviewModal({
  attachment,
  onClose,
}: {
  attachment: TaskAttachment | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!attachment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attachment, onClose]);

  if (!attachment) return null;

  const url = attachment.url || attachment.dataUrl;
  if (!url) return null;

  const isPdf = attachment.mimeType === 'application/pdf' || attachment.name.endsWith('.pdf');
  const isImage = attachment.mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.name);
  const isExcel = attachment.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || attachment.mimeType === 'application/vnd.ms-excel' || /\.(xls|xlsx)$/i.test(attachment.name);

  // Office Web Viewer sadece public URL'ler ile çalışır, base64 data URL'ler ile çalışmaz.
  const isPublicUrl = url.startsWith('http://') || url.startsWith('https://');

  let content = null;
  let Icon = FileText;

  if (isImage) {
    Icon = ImageIcon;
    content = <img src={url} alt={attachment.name} className="max-w-full max-h-full object-contain mx-auto" />;
  } else if (isPdf) {
    Icon = FileText;
    content = <iframe src={url} className="w-full h-full rounded-lg bg-white" title={attachment.name} />;
  } else if (isExcel && isPublicUrl) {
    Icon = FileSpreadsheet;
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    content = <iframe src={viewerUrl} className="w-full h-full rounded-lg bg-white" title={attachment.name} />;
  } else {
    Icon = isExcel ? FileSpreadsheet : File;
    content = (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
        <div className="flex size-16 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <Icon className="size-8 text-zinc-500" />
        </div>
        <div className="text-sm text-zinc-400 max-w-sm">
          Bu dosya türü için tarayıcıda doğrudan önizleme desteklenmiyor veya dosya yerel diskte (misafir modu).
          <br /><br />
          Lütfen dosyayı indirerek cihazınızda görüntüleyin.
        </div>
        <a href={url} download={attachment.name} className="btn-primary mt-2">
          <Download className="size-4" />
          Dosyayı İndir
        </a>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-6"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-5xl h-full max-h-[90vh] flex flex-col bg-surface-1 rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3 overflow-hidden pr-4">
            <span className={isExcel ? 'text-emerald-400' : isPdf ? 'text-rose-400' : isImage ? 'text-accent-light' : 'text-zinc-400'}>
              <Icon className="size-5" />
            </span>
            <h3 className="text-sm font-bold text-white truncate" title={attachment.name}>{attachment.name}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={url} download={attachment.name} className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors" title="İndir">
              <Download className="size-4.5" />
            </a>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Kapat">
              <X className="size-4.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-1 sm:p-4 bg-surface-0/50 overflow-hidden relative">
          {content}
        </div>
      </div>
    </div>
  );
}
