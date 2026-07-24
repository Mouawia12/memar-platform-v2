/** عمود تصدير: العنوان العربي ودالة تستخرج قيمته من السطر. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const escape = (raw: string | number | null | undefined): string => {
  const text = raw === null || raw === undefined ? '' : String(raw);

  // الاقتباس إلزامي متى احتوت القيمة فاصلة أو سطرًا جديدًا أو علامة اقتباس
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** يبني نصّ CSV مسبوقًا بـ BOM حتى يقرأ إكسل العربية بترميز صحيح. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((c) => escape(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(',')),
  ];

  return `﻿${lines.join('\r\n')}`;
}

/** ينزّل مصفوفة سجلات كملف CSV باسم مؤرَّخ. */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
