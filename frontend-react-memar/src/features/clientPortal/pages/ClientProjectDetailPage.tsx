import { type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';

import '../clientPortalV2.css';
import { STATUS_COLORS as INVOICE_COLORS, STATUS_LABELS as INVOICE_STATUS } from '../../invoices/types';
import { PROJECT_STATUS_LABELS, type StageStatus } from '../../projects/types';
import { useClientProject } from '../hooks/useClientPortal';

const money = (v: string | number) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** محيط دائرة نصف قطرها 54 (طبق الأصل من Atoms) — 2·π·54. */
const CIRC = 339.292;

/** حالة المرحلة → صنف Atoms (completed/active/upcoming) + أيقونة العلامة. */
const STAGE_UI: Record<StageStatus, { cls: string; icon: string }> = {
  done: { cls: 'completed', icon: 'fa-check' },
  active: { cls: 'active', icon: 'fa-pencil-ruler' },
  pending: { cls: 'upcoming', icon: 'fa-hourglass-half' },
};

/** أوّل حرف مُجرَّد من أداة التعريف «ال» (العمري → ع) — لمطابقة أحرف Atoms (م.ع، ف.ح). */
const firstLetter = (word: string): string => {
  const stripped = word.replace(/^ال/, '');
  return (stripped || word).charAt(0);
};
/** أوّل حرف من الاسم الأوّل + الأخير (م.ع) — نفس نمط أفاتار صفحة الشركة. */
const initials2 = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${firstLetter(parts[0])}.${firstLetter(parts[parts.length - 1])}`;
};

/**
 * صفحة مشروع العميل (CLIENT-4) — طبق الأصل من تصميم Atoms (project-hub):
 * هيرو بحلقة تقدّم دائرية + مسار المراحل + المشاركون + سجل التعديلات + المدفوعات.
 * عرض للقراءة فقط بلا أي بيانات داخلية. تُحفَظ استثناءات أيمن المقصودة:
 * زر عودة بارز، طايمر العمل (بند 11)، عملة الدينار الكويتي، بيانات backend الحقيقية.
 */
export function ClientProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data, isLoading, isError } = useClientProject(projectId);

  if (isLoading) return <div className="mcp-root" style={{ padding: 40 }}>جارٍ التحميل…</div>;
  if (isError || !data)
    return (
      <div className="mcp-root" style={{ padding: 40, color: '#ef4444' }}>
        تعذّر تحميل المشروع أو لا صلاحية لك عليه.
      </div>
    );

  const { project, stages, payments, team, change_log: changeLog } = data;
  const pct = Math.max(0, Math.min(100, project.stage_progress));
  const offset = CIRC - (CIRC * pct) / 100;

  // طايمر العمل الجاري: أيام منذ البداية والمتبقّي للتسليم المتوقّع (بند 11 — استثناء مقصود)
  const daysSince = (iso: string | null) =>
    iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : null;
  const daysUntil = (iso: string | null) =>
    iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null;
  const elapsed = daysSince(project.start_date);
  const remaining = daysUntil(project.end_date);

  return (
    <div className="mcp-root" style={page}>
      {/* زر عودة بارز وثابت — يمنع «حبس» العميل داخل صفحة المشروع (طلب أيمن، اجتماع 4) */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/client-portal" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <i className="fas fa-arrow-right" /> الرجوع إلى بوابة العميل
        </Link>
      </div>

      {/* ═══ الهيرو — طبق الأصل: وسم الحالة + الاسم + الوصف + الميتا + حلقة التقدّم ═══ */}
      <div className="project-hero">
        <div className="project-hero-content">
          <span className="project-hero-tag">{PROJECT_STATUS_LABELS[project.status]}</span>
          <h2>{project.name}</h2>
          {project.description && <p>{project.description}</p>}
          <div className="project-hero-meta">
            <div className="meta-item">
              <i className="fas fa-calendar-alt" />
              <span>بداية: {fmtDate(project.start_date)}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-flag-checkered" />
              <span>التسليم المتوقع: {fmtDate(project.end_date)}</span>
            </div>
            {project.manager && (
              <div className="meta-item">
                <i className="fas fa-user-tie" />
                <span>{project.manager}</span>
              </div>
            )}
            {project.code && (
              <div className="meta-item">
                <i className="fas fa-hashtag" />
                <span>{project.code}</span>
              </div>
            )}
          </div>
          {/* طايمر العمل: يوم العمل + المتبقّي للتسليم (بند 11 — استثناء مقصود) */}
          {project.status === 'active' && (elapsed !== null || remaining !== null) && (
            <div style={timerRow}>
              {elapsed !== null && (
                <span style={timerPill}>
                  <i className="fas fa-stopwatch" /> يوم العمل {elapsed}
                </span>
              )}
              {remaining !== null && (
                <span style={{ ...timerPill, background: remaining < 0 ? 'rgba(220,74,61,.28)' : 'rgba(110,231,183,.22)' }}>
                  <i className="fas fa-hourglass-half" />{' '}
                  {remaining < 0 ? `تأخّر ${Math.abs(remaining)} يوم` : `${remaining} يوم للتسليم`}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="project-hero-progress">
          <div className="hero-progress-circle">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" className="progress-bg" />
              <circle cx="60" cy="60" r="54" className="progress-fg" strokeDasharray={CIRC} strokeDashoffset={offset} />
            </svg>
            <div className="hero-progress-text">
              <span className="hero-progress-value">{pct}%</span>
              <span className="hero-progress-label">مكتمل</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ مراحل المشروع — مسار زمني طبق الأصل ═══ */}
      <div className="stages-section">
        <h3 className="section-title">مراحل المشروع</h3>
        {stages.length === 0 ? (
          <p style={{ color: 'var(--text-4)', fontSize: 13 }}>لم تُحدَّد مراحل هذا المشروع بعد.</p>
        ) : (
          <div className="stages-timeline">
            <div className="stage-connector" />
            {stages.map((s) => {
              const ui = STAGE_UI[s.status];
              const stageDate =
                s.status === 'done'
                  ? s.completed_at
                    ? `اكتملت ${fmtDate(s.completed_at)}`
                    : ''
                  : s.status === 'active'
                    ? s.started_at
                      ? `بدأت ${fmtDate(s.started_at)}`
                      : ''
                    : s.expected_days != null
                      ? `${s.expected_days} يوم متوقّع`
                      : '';
              return (
                <div key={s.id} className={`stage-item ${ui.cls}`}>
                  <div className="stage-marker">
                    <i className={`fas ${ui.icon}`} />
                  </div>
                  <div className="stage-content">
                    <h4>{s.name}</h4>
                    {stageDate && <span className="stage-date">{stageDate}</span>}
                    {s.status === 'active' && <span className="badge badge-blue">جارية</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ المشاركون في المشروع — للقراءة فقط (بلا إضافة/إزالة) ═══ */}
      {(team.length > 0 || changeLog.length > 0) && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-users-gear" /> المشاركون في المشروع
            </h3>
          </div>
          <div className="card-body">
            {team.length > 0 && (
            <div className="team-mgmt-list">
              {team.map((m, i) => (
                <div key={i} className="team-mgmt-item">
                  <div className="team-mgmt-avatar">
                    <div className="team-mgmt-placeholder">{initials2(m.name)}</div>
                  </div>
                  <div className="team-mgmt-info">
                    <strong>{m.name}</strong>
                    <span>{m.role}</span>
                  </div>
                  {m.is_lead ? (
                    <span className="team-mgmt-role owner-badge">
                      <i className="fas fa-crown" /> القائد
                    </span>
                  ) : (
                    <span className="team-mgmt-role">مشارك</span>
                  )}
                </div>
              ))}
            </div>
            )}

            {/* سجل التعديلات — من سِجِل نشاط المشروع الحقيقي (بند 11) */}
            {changeLog.length > 0 && (
              <div className="team-changes-log">
                <h4>
                  <i className="fas fa-clock-rotate-left" /> سجل التعديلات
                </h4>
                <div className="changes-log-list">
                  {changeLog.map((c, i) => (
                    <div key={i} className="change-log-item">
                      <span className="change-log-dot blue" />
                      <div className="change-log-content">
                        <p>{c.text}</p>
                        <span>{fmtDate(c.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ مدفوعات المشروع — بطاقات ملخّص + الفواتير (بالدينار الكويتي) ═══ */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-money-bill-wave" /> مدفوعات المشروع
          </h3>
        </div>
        <div className="card-body">
          <div className="payment-summary-grid" style={{ marginBottom: 16 }}>
            <div className="payment-summary-card">
              <div className="payment-summary-icon blue">
                <i className="fas fa-wallet" />
              </div>
              <div className="payment-summary-info">
                <span className="payment-summary-value">{money(payments.invoiced_kwd)}</span>
                <span className="payment-summary-label">إجمالي الفواتير</span>
              </div>
            </div>
            <div className="payment-summary-card">
              <div className="payment-summary-icon green">
                <i className="fas fa-check-double" />
              </div>
              <div className="payment-summary-info">
                <span className="payment-summary-value">{money(payments.paid_kwd)}</span>
                <span className="payment-summary-label">المدفوع</span>
              </div>
            </div>
            <div className="payment-summary-card">
              <div className="payment-summary-icon orange">
                <i className="fas fa-hourglass-half" />
              </div>
              <div className="payment-summary-info">
                <span className="payment-summary-value">{money(payments.remaining_kwd)}</span>
                <span className="payment-summary-label">المتبقّي</span>
              </div>
            </div>
          </div>

          <div className="invoices-list">
            {payments.invoices.length === 0 && (
              <p style={{ color: 'var(--text-4)', fontSize: 13, padding: '8px 0' }}>لا توجد فواتير بعد.</p>
            )}
            {payments.invoices.map((inv) => (
              <div key={inv.id} className="invoice-item">
                <div className="invoice-info">
                  <div className="invoice-number">#{inv.number ?? inv.id}</div>
                  <h4>
                    مدفوع {money(inv.paid_kwd)} من {money(inv.total_kwd)}
                  </h4>
                  {inv.due_date && <span className="invoice-date">تاريخ الاستحقاق: {fmtDate(inv.due_date)}</span>}
                </div>
                <div className="invoice-amount">
                  <span className="amount">{money(inv.balance_kwd)}</span>
                  <span
                    className="badge"
                    style={{ background: `${INVOICE_COLORS[inv.status]}1a`, color: INVOICE_COLORS[inv.status] }}
                  >
                    {INVOICE_STATUS[inv.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const page: CSSProperties = { padding: 24, maxWidth: 1120, margin: '0 auto' };
const timerRow: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 };
const timerPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 12.5,
  fontWeight: 700,
  color: '#fff',
  background: 'rgba(255,255,255,.16)',
  border: '1px solid rgba(255,255,255,.22)',
  borderRadius: 999,
  padding: '5px 14px',
};
