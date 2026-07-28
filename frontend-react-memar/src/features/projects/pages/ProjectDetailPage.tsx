import { useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ProjectAssessmentPanel } from '../components/ProjectAssessmentPanel';
import { ProjectContractTab, ProjectDocumentsTab } from '../components/ProjectDocumentsPanel';
import { ProjectPaymentsPanel } from '../components/ProjectPaymentsPanel';
import { ProjectStages } from '../components/ProjectStages';
import { ProjectStatusControl } from '../components/ProjectStatusControl';
import { useProjectOverview } from '../hooks/useProjectOverview';

type Tab = 'overview' | 'stages' | 'payments' | 'documents' | 'contract';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: '📊 نظرة عامة' },
  { key: 'stages', label: '🧭 المراحل' },
  { key: 'payments', label: '💰 الدفعات' },
  { key: 'documents', label: '📑 المستندات' },
  { key: 'contract', label: '📜 العقد' },
];

const money = (v: number) => `${v.toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const EVENT_COLORS: Record<string, string> = {
  created: '#2D9B6F',
  updated: '#1B6CA8',
  deleted: '#DC4A3D',
};

/** تفاصيل المشروع — مؤشراته وسجل أحداثه (تايم‌لاين) من سجل التدقيق. */
export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const [tab, setTab] = useState<Tab>('overview');
  const { data, isLoading, isError } = useProjectOverview(projectId);

  if (isLoading) return <p>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل المشروع.</p>;

  const { project, stages, stats, timeline } = data;
  const progress = stats.tasks_total > 0 ? Math.round((stats.tasks_done / stats.tasks_total) * 100) : 0;
  const collected = stats.invoiced_kwd > 0 ? Math.round((stats.paid_kwd / stats.invoiced_kwd) * 100) : 0;

  return (
    <div>
      <Link to="/projects" style={backLink}>← كل المشاريع</Link>

      {/* رأس المشروع */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px' }}>{project.name}</h1>
            <div style={{ fontSize: '13px', color: '#5A6478', marginTop: '4px' }}>
              {project.code} · العميل: {project.client?.name ?? '—'} · مدير المشروع: {project.manager?.name ?? '—'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {project.is_vip && <span style={{ ...badge, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff' }}>⭐ VIP</span>}
            <ProjectStatusControl project={project} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginTop: '18px' }}>
          <Bar label="إنجاز المهام" value={progress} caption={`${stats.tasks_done} من ${stats.tasks_total} مهمة`} color="#1B6CA8" />
          <Bar label="التحصيل المالي" value={collected} caption={`${money(stats.paid_kwd)} من ${money(stats.invoiced_kwd)}`} color="#2D9B6F" />
        </div>
      </div>

      {/* شريط التبويبات (PROJ-3) */}
      <div style={tabBar}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{ ...tabBtn, ...(tab === t.key ? tabOn : null) }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* التقييم الإداري (PROJ-4) — للطاقم فقط */}
          <ProjectAssessmentPanel project={project} />

          {/* مؤشرات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <Stat icon="✅" label="المهام" value={stats.tasks_total} to="/tasks" />
            <Stat icon="🧾" label="الفواتير" value={stats.invoices_total} to="/finance/invoices" />
            <Stat icon="🚧" label="الزيارات" value={stats.visits} to="/field-visits" />
            <Stat icon="📅" label="المواعيد" value={stats.appointments} to="/appointments" />
            <Stat icon="📑" label="المستندات" value={stats.documents} to="/documents" />
            <Stat icon="🗂️" label="الملفات" value={stats.files} to="/files" />
          </div>

          {/* التايم‌لاين */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>🕒 سجل أحداث المشروع</h3>
            {timeline.length === 0 && <p style={{ opacity: 0.6, fontSize: '13px' }}>لا توجد أحداث مسجّلة بعد.</p>}

            <div style={{ position: 'relative', paddingInlineStart: '18px', marginTop: '14px' }}>
              {timeline.length > 0 && <span style={line} />}
              {timeline.map((e) => (
                <div key={e.id} style={item}>
                  <span style={{ ...dot, background: EVENT_COLORS[e.event] ?? '#5A6478' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700 }}>
                      {e.event_label} — {e.subject_label}
                      {e.title && <span style={{ fontWeight: 400, color: '#5A6478' }}> · {e.title}</span>}
                    </div>
                    {e.reason && (
                      <div style={{ fontSize: '12px', color: '#7C3AED', marginTop: '3px', background: '#F5F3FF', border: '1px solid #E9D5FF', borderRadius: '6px', padding: '4px 8px', display: 'inline-block' }}>
                        📝 السبب: {e.reason}
                      </div>
                    )}
                    <div style={{ fontSize: '11.5px', color: '#5A6478', marginTop: '2px' }}>
                      {e.causer?.name ?? 'النظام'} · {fmt(e.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'stages' && <ProjectStages projectId={project.id} stages={stages} />}
      {tab === 'payments' && <ProjectPaymentsPanel projectId={project.id} />}
      {tab === 'documents' && <ProjectDocumentsTab projectId={project.id} />}
      {tab === 'contract' && <ProjectContractTab projectId={project.id} />}
    </div>
  );
}

function Bar({ label, value, caption, color }: { label: string; value: number; caption: string; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
        <span>{label}</span><b style={{ color }}>{value}%</b>
      </div>
      <div style={{ height: '9px', background: '#EEF2F7', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '5px', transition: 'width .3s' }} />
      </div>
      <div style={{ fontSize: '11.5px', color: '#5A6478', marginTop: '4px' }}>{caption}</div>
    </div>
  );
}

function Stat({ icon, label, value, to }: { icon: string; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="kpi-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#274A78' }}>{value}</div>
      <div style={{ fontSize: '13px', opacity: 0.65, marginTop: '2px' }}>{icon} {label}</div>
    </Link>
  );
}

const tabBar: CSSProperties = { display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap', background: '#F0F4F8', padding: '4px', borderRadius: '10px' };
const tabBtn: CSSProperties = { border: 'none', background: 'transparent', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#5A6478', whiteSpace: 'nowrap' };
const tabOn: CSSProperties = { background: '#fff', color: '#274A78', fontWeight: 800, boxShadow: '0 1px 3px rgba(0,0,0,.1)' };
const backLink: CSSProperties = { fontSize: '13px', color: '#1B6CA8', textDecoration: 'none', display: 'inline-block', marginBottom: '12px' };
const badge: CSSProperties = { padding: '4px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, height: 'fit-content', whiteSpace: 'nowrap' };
const line: CSSProperties = { position: 'absolute', insetInlineStart: '4px', top: '6px', bottom: '6px', width: '2px', background: '#E4E8EF' };
const item: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '9px 0', position: 'relative' };
const dot: CSSProperties = { width: '10px', height: '10px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, marginInlineStart: '-18px', border: '2px solid #fff', boxShadow: '0 0 0 2px #E4E8EF' };
