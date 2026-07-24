export interface StoredFile {
  id: number;
  name: string;
  original_name: string;
  mime: string | null;
  extension: string | null;
  size: number;
  folder: string | null;
  notes: string | null;
  project: { id: number; name: string } | null;
  uploader: { id: number; name: string } | null;
  created_at: string | null;
}

export interface FileStats {
  count: number;
  total_size: number;
  folders: string[];
}

/** أيقونة حسب امتداد الملف. */
export function fileIcon(ext: string | null): string {
  const e = (ext ?? '').toLowerCase();
  if (['pdf'].includes(e)) return '📕';
  if (['doc', 'docx', 'rtf', 'odt'].includes(e)) return '📘';
  if (['xls', 'xlsx', 'csv'].includes(e)) return '📗';
  if (['ppt', 'pptx'].includes(e)) return '📙';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(e)) return '🖼️';
  if (['dwg', 'dxf', 'rvt', 'skp'].includes(e)) return '📐';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return '🗜️';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(e)) return '🎬';
  if (['mp3', 'wav', 'm4a'].includes(e)) return '🎵';
  return '📄';
}

/** حجم مقروء. */
export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} م.ب`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} ج.ب`;
}
