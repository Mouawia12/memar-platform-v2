export type TemplateType = 'contract' | 'letter' | 'report';

export interface DocumentTemplate {
  id: number;
  name: string;
  type: TemplateType;
  body_html: string;
  is_active: boolean;
  created_at: string | null;
}

export interface TemplateFormData {
  name: string;
  type: TemplateType;
  body_html: string;
  is_active: boolean;
}

export interface GeneratedDocument {
  id: number;
  title: string;
  body_html: string;
  template: string | null;
  project: { id: number; name: string } | null;
  created_at: string | null;
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  contract: 'عقد',
  letter: 'خطاب',
  report: 'تقرير',
};

/** استخراج الحقول المتغيّرة {{key}} من نص القالب. */
export function extractPlaceholders(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) set.add(m[1]);
  return [...set];
}
