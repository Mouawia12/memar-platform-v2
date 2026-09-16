import { type ReactNode, useState } from 'react';

import type { CrmSavedView } from '../../../types/api';
import { TEMPERATURE_ORDER } from '../types';
import type { BoardFilters, BoardView } from './filters';
import { PRIORITY_META, PRIORITY_RANK, STATUS_META, STATUS_ORDER, TEMPERATURE_LABEL, formatKwd, type BoardStatus } from './model';

interface Props {
  view: BoardView;
  onView: (v: BoardView) => void;
  soundOn: boolean;
  onSound: () => void;
  blinkOn: boolean;
  onBlink: () => void;
  pipelineValue: number;
  showTotals: boolean;
  canCreate: boolean;
  onAdd: () => void;
  filters: BoardFilters;
  onFilters: (f: BoardFilters) => void;
  statusCounts: Record<BoardStatus, number>;
  owners: [number, string][];
  tags: string[];
  savedViews: CrmSavedView[];
  onSaveView: (name: string) => void;
  onApplyView: (v: CrmSavedView) => void;
  onDeleteView: (id: string) => void;
  canArchive: boolean;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedCount: number;
  onReset: () => void;
  /** أدوات الإدارة الموجودة سابقًا (إعدادات النقاط، المراحل، التصدير…). */
  extraActions?: ReactNode;
}

export function BoardToolbar(p: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const set = <K extends keyof BoardFilters>(k: K, v: BoardFilters[K]) => p.onFilters({ ...p.filters, [k]: v });

  const commit = () => {
    const clean = name.trim();
    if (!clean) return;
    p.onSaveView(clean);
    setName('');
    setSaving(false);
  };

  return (
    <header className="crmx-toolbar">
      <div className="crmx-toolbar-inner">
        {/* الصف الأول: الهوية، العرض، الصوت، الوميض، القيمة، فرصة جديدة */}
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

            <button type="button" className={`crmx-btn ${p.soundOn ? 'green' : 'muted'}`} onClick={p.onSound} aria-label={p.soundOn ? 'إيقاف صوت التنبيهات' : 'تشغيل صوت التنبيهات'}>
              <i className={`fa-solid ${p.soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}`} /> {p.soundOn ? 'الصوت مفعّل' : 'الصوت مكتوم'}
            </button>
            <button type="button" className={`crmx-btn ${p.blinkOn ? 'red' : 'muted'}`} onClick={p.onBlink} aria-pressed={!p.blinkOn} aria-label={p.blinkOn ? 'إيقاف وميض التنبيهات' : 'تشغيل وميض التنبيهات'}>
              <i className="fa-solid fa-bolt" style={p.blinkOn ? undefined : { opacity: 0.5 }} /> {p.blinkOn ? 'الوميض مفعّل' : 'الوميض موقوف'}
            </button>

            {p.showTotals && (
              <span className="crmx-pill-value num" title="قيمة الفرص المعروضة">
                <i className="fa-solid fa-wallet" /> {formatKwd(p.pipelineValue)} د.ك
              </span>
            )}

            {p.canCreate && (
              <button type="button" className="crmx-btn primary" onClick={p.onAdd}><i className="fa-solid fa-plus" /> فرصة جديدة</button>
            )}
          </div>
        </div>

        {/* الصف الثاني: البحث والفلاتر وعدّادات الحالات */}
        <div className="crmx-row">
          <div className="crmx-search">
            <input className="crmx-input" value={p.filters.search} onChange={(e) => set('search', e.target.value)} placeholder="ابحث بالاسم، الهاتف، رقم الفرصة أو الاختصار..." aria-label="بحث" />
            <i className="fa-solid fa-magnifying-glass" />
          </div>

          <select className="crmx-select" value={p.filters.status} onChange={(e) => set('status', e.target.value as BoardFilters['status'])} aria-label="الحالة">
            <option value="all">كل الحالات</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{s === 'question' ? 'سؤال من الإدارة' : STATUS_META[s].short}</option>)}
          </select>
          <select className="crmx-select" value={p.filters.owner} onChange={(e) => set('owner', e.target.value)} aria-label="الموظف">
            <option value="all">كل الموظفين</option>
            {p.owners.map(([id, n]) => <option key={id} value={String(id)}>{n}</option>)}
          </select>
          <select className="crmx-select" value={p.filters.priority} onChange={(e) => set('priority', e.target.value as BoardFilters['priority'])} aria-label="الأهمية">
            <option value="all">كل الأهميات</option>
            {PRIORITY_RANK.map((k) => <option key={k} value={k}>{PRIORITY_META[k].label}</option>)}
          </select>
          <select className="crmx-select" value={p.filters.temperature} onChange={(e) => set('temperature', e.target.value as BoardFilters['temperature'])} aria-label="الحرارة">
            <option value="all">كل الحرارات</option>
            {TEMPERATURE_ORDER.map((k) => <option key={k} value={k}>{TEMPERATURE_LABEL[k]}</option>)}
          </select>
          <select className="crmx-select" value={p.filters.tag} onChange={(e) => set('tag', e.target.value)} aria-label="الاختصار">
            <option value="all">كل الاختصارات</option>
            {p.tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="crmx-row" style={{ gap: 6 }}>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                className={`crmx-chip num${p.filters.status === s ? ' on' : ''}`}
                style={STATUS_META[s].chip}
                onClick={() => set('status', p.filters.status === s ? 'all' : s)}
                title={STATUS_META[s].label}
              >
                {STATUS_META[s].short}: {p.statusCounts[s]}
              </button>
            ))}
          </div>
        </div>

        {/* الصف الثالث: العروض المحفوظة، الأرشيف، أدوات الإدارة، إعادة التعيين */}
        <div className="crmx-row" style={{ marginTop: 8 }}>
          <span className="crmx-views-label"><i className="fa-solid fa-bookmark" style={{ color: '#7C3AED' }} /> العروض المحفوظة:</span>
          {p.savedViews.length === 0 && <span className="crmx-hint">لا عروض محفوظة بعد</span>}
          {p.savedViews.map((v) => (
            <span key={v.id} className="crmx-view">
              <button type="button" onClick={() => p.onApplyView(v)}>{v.name}</button>
              <button type="button" onClick={() => p.onDeleteView(v.id)} aria-label={`حذف العرض ${v.name}`}><i className="fa-solid fa-trash" /></button>
            </span>
          ))}
          {saving ? (
            <span className="crmx-row" style={{ gap: 6 }}>
              <input className="crmx-input" style={{ height: 32, width: 210, fontSize: 11.5, borderColor: '#DDD6FE' }} value={name} autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setSaving(false); }}
                placeholder="اسم العرض... مثال: فرص ساخنة متأخرة" maxLength={60} />
              <button type="button" className="crmx-btn sm" style={{ background: '#7C3AED', color: '#fff', borderColor: '#7C3AED' }} onClick={commit}><i className="fa-solid fa-check" /> حفظ</button>
            </span>
          ) : (
            <button type="button" className="crmx-btn sm purple" onClick={() => setSaving(true)}><i className="fa-regular fa-bookmark" /> حفظ الفلاتر الحالية</button>
          )}

          <span className="crmx-divider" aria-hidden />

          {p.canArchive && (
            <button type="button" className={`crmx-btn sm ${p.showArchived ? 'amber' : 'muted'}`} onClick={p.onToggleArchived} aria-pressed={p.showArchived}>
              <i className="fa-solid fa-box-archive" /> {p.showArchived ? 'إظهار الأرشيف مفعّل' : 'عرض الأرشيف'}
              {p.archivedCount > 0 && <span className="num">({p.archivedCount})</span>}
            </button>
          )}
          {p.extraActions}
          <button type="button" className="crmx-btn sm muted" onClick={p.onReset}><i className="fa-solid fa-rotate-left" /> إعادة تعيين</button>
        </div>
      </div>
    </header>
  );
}
