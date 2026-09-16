import { useEffect } from 'react';

import type { Lead, PipelineStage } from '../types';
import { exportLeadsCsv, printReport } from './export';
import { STATUS_META, boardMetrics, employeeStats, formatHours, formatKwd, funnelRows, initials } from './model';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'purple';

function Kpi({ label, value, icon, tone = 'brand' }: { label: string; value: string; icon: string; tone?: Tone }) {
  return (
    <div className={`crmx-kpi crmx-tone-${tone}`}>
      <i className={icon} aria-hidden />
      <div style={{ minWidth: 0 }}>
        <small>{label}</small>
        <b className="num">{value}</b>
      </div>
    </div>
  );
}

/** شريط المؤشّرات المضغوط فوق اللوحة. */
export function KpiStrip({ leads, stages, showTotals, onOpenReport }: { leads: Lead[]; stages: PipelineStage[]; showTotals: boolean; onOpenReport?: () => void }) {
  const m = boardMetrics(leads, stages);
  return (
    <div className="crmx-accent">
      <div className="crmx-kpis">
        <Kpi label="فرص مفتوحة" value={`${m.openCount}`} icon="fa-solid fa-bullseye" />
        {showTotals && <Kpi label="قيمة الأنبوب" value={`${formatKwd(m.openValue)} د.ك`} icon="fa-solid fa-wallet" />}
        <Kpi label="صفقات رابحة" value={`${m.wonCount}`} icon="fa-solid fa-trophy" tone="success" />
        <Kpi label="معدل الفوز" value={`${m.winRate.toFixed(0)}%`} icon="fa-solid fa-arrow-trend-up" tone="success" />
        <Kpi label="متوسط زمن الرد" value={formatHours(m.avgResponse)} icon="fa-regular fa-clock" tone="purple" />
        <Kpi label="أسئلة معلّقة" value={`${m.pendingQuestions}`} icon="fa-regular fa-circle-question" tone="danger" />
        <Kpi label="تواصل متأخر" value={`${m.lateCount}`} icon="fa-solid fa-triangle-exclamation" tone="danger" />
        <Kpi label="نقاط بانتظار المدير" value={`${m.pendingPoints}`} icon="fa-solid fa-trophy" tone="warning" />
        {onOpenReport && (
          <button type="button" className="crmx-btn primary" style={{ marginInlineStart: 'auto', height: 36 }} onClick={onOpenReport}>
            <i className="fa-solid fa-chart-column" /> التقارير التفصيلية
          </button>
        )}
      </div>
    </div>
  );
}

export function ColorLegend() {
  return (
    <div className="crmx-accent">
      <div className="crmx-legend">
        <b>دليل الألوان:</b>
        {(['question', 'update_requested', 'answered', 'idle'] as const).map((s) => (
          <span key={s}><span className="crmx-dot" style={{ background: s === 'idle' ? '#CBD5E1' : STATUS_META[s].accent }} aria-hidden />{STATUS_META[s].label}</span>
        ))}
      </div>
    </div>
  );
}

interface ReportProps {
  leads: Lead[];
  stages: PipelineStage[];
  showTotals: boolean;
  canExport: boolean;
  onClose: () => void;
}

export function ReportsModal({ leads, stages, showTotals, canExport, onClose }: ReportProps) {
  const m = boardMetrics(leads, stages);
  const funnel = funnelRows(leads, stages);
  const stats = employeeStats(leads, stages);
  const maxCount = Math.max(1, ...funnel.map((r) => r.count));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="crmx crmx-modal-back" onClick={onClose}>
      <div className="crmx-modal" role="dialog" aria-modal="true" aria-labelledby="crmx-report-title" onClick={(e) => e.stopPropagation()}>
        <div className="crmx-modal-head">
          <div className="crmx-row crmx-between" style={{ padding: '12px 20px' }}>
            <div className="crmx-title">
              <span className="crmx-title-icon" style={{ width: 36, height: 36, background: '#fff', color: '#1B6CA8' }}><i className="fa-solid fa-chart-column" /></span>
              <div>
                <h1 id="crmx-report-title" style={{ fontSize: 17 }}>تقارير الأداء والمؤشرات</h1>
                <p className="num">{leads.length} فرصة • إجمالي النقاط {m.totalPoints}</p>
              </div>
            </div>
            {canExport && (
              <div className="crmx-row">
                <button type="button" className="crmx-btn sm green" onClick={() => exportLeadsCsv(leads, stages)}><i className="fa-solid fa-file-excel" /> تصدير Excel</button>
                <button type="button" className="crmx-btn sm blue" onClick={() => printReport(leads, stages, m, showTotals)}><i className="fa-solid fa-print" /> طباعة / PDF</button>
              </div>
            )}
          </div>
        </div>

        <section className="crmx-modal-section">
          <h3><i className="fa-solid fa-bullseye" style={{ color: '#1B6CA8' }} /> المؤشرات العامة</h3>
          <div className="crmx-kpi-grid">
            <Kpi label="فرص مفتوحة" value={`${m.openCount}`} icon="fa-solid fa-bullseye" />
            <Kpi label="قيمة الأنبوب" value={showTotals ? `${formatKwd(m.openValue)} د.ك` : '—'} icon="fa-solid fa-wallet" />
            <Kpi label="صفقات رابحة" value={`${m.wonCount}`} icon="fa-solid fa-trophy" tone="success" />
            <Kpi label="قيمة الرابحة" value={showTotals ? `${formatKwd(m.wonValue)} د.ك` : '—'} icon="fa-solid fa-wallet" tone="success" />
            <Kpi label="صفقات خاسرة" value={`${m.lostCount}`} icon="fa-solid fa-xmark" tone="danger" />
            <Kpi label="معدل الفوز" value={`${m.winRate.toFixed(0)}%`} icon="fa-solid fa-arrow-trend-up" tone="success" />
            <Kpi label="متوسط زمن الرد" value={formatHours(m.avgResponse)} icon="fa-regular fa-clock" tone="purple" />
            <Kpi label="تذكيرات مستحقة" value={`${m.dueReminders}`} icon="fa-solid fa-triangle-exclamation" tone="warning" />
          </div>
        </section>

        <section className="crmx-modal-section">
          <h3><i className="fa-solid fa-arrow-trend-up" style={{ color: '#1B6CA8' }} /> قمع المراحل — التوزيع والقيمة</h3>
          {funnel.map((row) => (
            <div key={row.stage.key} className="crmx-funnel">
              <span style={{ width: 130, flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.stage.label}>{row.stage.label}</span>
              <div className="crmx-funnel-bar">
                <div style={{ width: `${Math.max((row.count / maxCount) * 100, row.count > 0 ? 8 : 0)}%`, background: row.stage.color }}>
                  {row.count > 0 && <span className="num" style={{ fontSize: 10.5, fontWeight: 800, color: '#fff' }}>{row.count}</span>}
                </div>
              </div>
              {showTotals && <span className="num" style={{ width: 104, flexShrink: 0, textAlign: 'left', fontSize: 11.5, fontWeight: 800, color: '#1760A0' }}>{formatKwd(row.value)} د.ك</span>}
              <span className="num" style={{ width: 40, flexShrink: 0, textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{row.share.toFixed(0)}%</span>
            </div>
          ))}
        </section>

        <section className="crmx-modal-section">
          <h3><i className="fa-solid fa-trophy" style={{ color: '#E8A838' }} /> أداء الموظفين — مرتّب بالنقاط</h3>
          <div className="crmx-scroll" style={{ border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <table className="crmx-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>#</th><th>الموظف</th><th>الفرص</th><th>مفتوحة</th><th>رابحة</th><th>معدل الفوز</th>
                  {showTotals && <th>القيمة</th>}<th>النقاط</th><th>متأخرة</th><th>أسئلة معلّقة</th><th>متوسط الرد</th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>لا توجد فرص مُسندة لموظفين.</td></tr>}
                {stats.map((s, i) => (
                  <tr key={s.id}>
                    <td><span className="num" style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 800, background: i === 0 ? '#E8A838' : '#F1F5F9', color: i === 0 ? '#fff' : '#64748B' }}>{i + 1}</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="num" style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', background: '#1B6CA8', color: '#fff', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{initials(s.name)}</span>
                        <b style={{ color: '#1E293B', whiteSpace: 'nowrap' }}>{s.name}</b>
                      </span>
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>{s.total}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{s.openCount}</td>
                    <td className="num" style={{ fontWeight: 800, color: '#1F7A57' }}>{s.wonCount}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{s.winRate.toFixed(0)}%</td>
                    {showTotals && <td className="num" style={{ fontWeight: 800, color: '#1760A0' }}>{formatKwd(s.value)}</td>}
                    <td><span className="crmx-chip num" style={{ color: '#D09520', background: '#FFFBEB', borderColor: '#FDE68A', fontSize: 10.5, fontWeight: 800 }}>{s.points}</span></td>
                    <td className="num" style={{ fontWeight: 800, color: s.lateCount ? '#C0382C' : '#94A3B8' }}>{s.lateCount}</td>
                    <td className="num" style={{ fontWeight: 800, color: s.pendingAnswers ? '#C0382C' : '#94A3B8' }}>{s.pendingAnswers}</td>
                    <td className="num" style={{ fontWeight: 700, color: '#6D28D9' }}>{formatHours(s.avgResponse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="crmx-modal-foot">
          <button type="button" className="crmx-btn sm" style={{ background: '#145A8C', color: '#fff', borderColor: '#145A8C', paddingInline: 20 }} onClick={onClose}>إغلاق</button>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#64748B' }}><i className="fa-solid fa-download" /> كل الأرقام محسوبة لحظياً من بيانات اللوحة الحالية</p>
        </div>
      </div>
    </div>
  );
}
