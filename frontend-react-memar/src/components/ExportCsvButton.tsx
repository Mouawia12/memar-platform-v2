import { useState } from 'react';

import { downloadCsv, type CsvColumn } from '../lib/csv';

interface Props<T> {
  /** يجلب كل السجلات المطابقة للفلاتر الحالية — لا الصفحة المعروضة فقط. */
  fetchRows: () => Promise<T[]>;
  columns: CsvColumn<T>[];
  filename: string;
  label?: string;
}

/**
 * زر تصدير CSV موحّد لجداول النظام.
 * يجلب كامل النتائج المفلترة عند الضغط، فلا يصدّر الصفحة الظاهرة وحدها.
 */
export function ExportCsvButton<T>({ fetchRows, columns, filename, label = '📥 تصدير CSV' }: Props<T>) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const rows = await fetchRows();
      if (rows.length === 0) {
        alert('لا توجد سجلات للتصدير.');

        return;
      }
      downloadCsv(filename, rows, columns);
    } catch {
      alert('تعذّر تجهيز ملف التصدير.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="btn btn-sm" type="button" onClick={handleClick} disabled={busy}>
      {busy ? 'جارٍ التجهيز…' : label}
    </button>
  );
}
