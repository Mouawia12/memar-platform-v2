import { type ReactNode, useRef } from 'react';

import type { BoardFilters, BoardView } from './filters';

interface Props {
  view: BoardView;
  onView: (v: BoardView) => void;
  canCreate: boolean;
  onAdd: () => void;
  filters: BoardFilters;
  onFilters: (f: BoardFilters) => void;
  tags: string[];
  canArchive: boolean;
  /** نسخة احتياطية واستعادة — للإدارة وحدها. */
  onBackup?: () => void;
  onRestore?: (file: File) => void;
  busyBackup?: boolean;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedCount: number;
  onReset: () => void;
  /** أدوات الإدارة (إعدادات النقاط، نقاط الموظفين، تخصيص المراحل). */
  extraActions?: ReactNode;
}

/**
 * شريط اللوحة — مختصر على ما يُستعمل فعلًا (طلب أيمن 2026-09-17): طريقة العرض،
 * فرصة جديدة، فلتر الاختصارات، الأرشيف، أدوات الإدارة، النسخة الاحتياطية
 * واستعادتها، وإعادة التعيين. حُذف ما عداه — البحث وقوائم الحالة والموظف
 * والأهمية والحرارة وعدّادات الحالات والعروض المحفوظة والصوت والوميض.
 */
export function BoardToolbar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="crmx-toolbar">
      <div className="crmx-toolbar-inner">
        <div className="crmx-row crmx-between">
          <div className="crmx-title">
            <span className="crmx-title-icon"><i className="fa-solid fa-bell" /></span>
            <div style={{ minWidth: 0 }}>
              <h1>لوحة إدارة الفرص — CRM</h1>
              <p>متابعة الفرص والأسعار والنقاط بين الإدارة والموظفين</p>
            </div>
          </div>

          <div className="crmx-row">
            <div className="crmx-seg" role="group" aria-label="طريقة العرض">
              <button type="button" className={p.view === 'kanban' ? 'on' : ''} aria-pressed={p.view === 'kanban'} onClick={() => p.onView('kanban')}>
                <i className="fa-solid fa-table-columns" /> كانبان
              </button>
              <button type="button" className={p.view === 'table' ? 'on' : ''} aria-pressed={p.view === 'table'} onClick={() => p.onView('table')}>
                <i className="fa-solid fa-table" /> جدول
              </button>
            </div>

            {p.canCreate && (
              <button type="button" className="crmx-btn primary" onClick={p.onAdd}><i className="fa-solid fa-plus" /> فرصة جديدة</button>
            )}
          </div>
        </div>

        <div className="crmx-row" style={{ marginTop: 8 }}>
          <select className="crmx-select" value={p.filters.tag} onChange={(e) => p.onFilters({ ...p.filters, tag: e.target.value })} aria-label="الاختصار">
            <option value="all">كل الاختصارات</option>
            {p.tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {p.canArchive && (
            <button type="button" className={`crmx-btn sm ${p.showArchived ? 'amber' : 'muted'}`} onClick={p.onToggleArchived} aria-pressed={p.showArchived}>
              <i className="fa-solid fa-box-archive" /> {p.showArchived ? 'إظهار الأرشيف مفعّل' : 'عرض الأرشيف'}
              {p.archivedCount > 0 && <span className="num">({p.archivedCount})</span>}
            </button>
          )}
          {p.extraActions}
          {p.onBackup && (
            <button type="button" className="crmx-btn sm green" onClick={p.onBackup} disabled={p.busyBackup}>
              <i className="fa-solid fa-download" /> {p.busyBackup ? 'جارٍ التنزيل…' : 'نسخة احتياطية'}
            </button>
          )}
          {p.onRestore && (
            <>
              <button type="button" className="crmx-btn sm blue" onClick={() => fileRef.current?.click()}>
                <i className="fa-solid fa-upload" /> استعادة نسخة
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) p.onRestore?.(file);
                  e.target.value = '';
                }}
              />
            </>
          )}
          <button type="button" className="crmx-btn sm muted" onClick={p.onReset}><i className="fa-solid fa-rotate-left" /> إعادة تعيين</button>
          {p.onBackup && <span className="crmx-hint" style={{ marginInlineStart: 'auto' }}><i className="fa-solid fa-database" /> الفرص محفوظة في قاعدة البيانات — والنسخة الاحتياطية ملف تحتفظ به عندك</span>}
        </div>
      </div>
    </header>
  );
}
