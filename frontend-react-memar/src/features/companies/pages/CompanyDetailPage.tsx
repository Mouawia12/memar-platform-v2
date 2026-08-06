import { type CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '../../clientPortal/clientPortalV2.css';
import { COMPANY_TYPE_LABELS } from '../types';
import { InternalRatingCard } from '../components/InternalRatingCard';
import { useCompanyOverview } from '../hooks/useCompanies';

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', active: 'نشط', review: 'مراجعة', on_hold: 'معلّق', done: 'مكتمل', cancelled: 'ملغي',
};
const badgeOf = (s: string): string => (s === 'done' ? 'badge-gray' : s === 'review' ? 'badge-green' : s === 'on_hold' ? 'badge-orange' : 'badge-blue');
const fillOf = (s: string): string => (s === 'done' || s === 'review' ? 'green' : s === 'on_hold' ? 'orange' : '');
const initialOf = (name: string | null) => (name ?? '؟').trim().charAt(0) || '؟';

/**
 * صفحة الشركة للطاقم — بنفس تصميم صفحة الشركة في بوابة العميل (طبق الأصل)،
 * مع إضافة «التقييم الداخلي» الذي يظهر للإدارة/الموظفين فقط أسفل الهيرو.
 */
export function CompanyDetailPage({ id, onBack }: { id: number; onBack: () => void }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCompanyOverview(id);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  if (isLoading) return <div className="mcp-root" style={{ padding: 24 }}>جارٍ التحميل…</div>;
  if (isError || !data) return <div className="mcp-root" style={{ padding: 24, color: '#ef4444' }}>تعذّر تحميل الشركة.</div>;

  const { company, stats, members, projects } = data;
  const shown = projects.filter((p) => (filter === 'all' ? true : filter === 'active' ? p.status !== 'done' : p.status === 'done'));

  return (
    <div className="mcp-root">
      <button type="button" onClick={onBack} style={backBtn}>→ رجوع إلى الشركات</button>

      {/* الهيرو — نفس تصميم بوابة العميل */}
      <div className="company-hero hero-type-company">
        <div className="company-hero-bg" />
        <div className="company-hero-layout">
          <div className="company-hero-content">
            <div className="company-logo"><i className="fas fa-building-columns" /></div>
            <div className="company-hero-info">
              <h2>{company.name}</h2>
              <p>{company.industry || COMPANY_TYPE_LABELS[company.type]}</p>
              <div className="company-hero-stats">
                <div className="company-stat"><span className="company-stat-value">{stats.active}</span><span className="company-stat-label">مشاريع نشطة</span></div>
                <div className="company-stat"><span className="company-stat-value">{stats.done}</span><span className="company-stat-label">مشروع مكتمل</span></div>
                <div className="company-stat"><span className="company-stat-value">{stats.members}</span><span className="company-stat-label">عضو مسجّل</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* التقييم الداخلي — إضافة الطاقم فقط، أسفل الهيرو مباشرة */}
      <InternalRatingCard companyId={company.id} rating={company.internal_rating} notes={company.internal_notes} />

      {/* بطاقات المعلومات — نفس تصميم بوابة العميل */}
      <div className="company-info-grid">
        <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-briefcase" /></div><div className="company-info-detail"><span className="company-info-label">النوع</span><strong>{COMPANY_TYPE_LABELS[company.type]}</strong></div></div>
        {company.industry && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-industry" /></div><div className="company-info-detail"><span className="company-info-label">القطاع</span><strong>{company.industry}</strong></div></div>}
        {company.phone && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-phone" /></div><div className="company-info-detail"><span className="company-info-label">الهاتف</span><strong>{company.phone}</strong></div></div>}
        {company.email && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-envelope" /></div><div className="company-info-detail"><span className="company-info-label">البريد</span><strong>{company.email}</strong></div></div>}
        {company.address && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-location-dot" /></div><div className="company-info-detail"><span className="company-info-label">العنوان</span><strong>{company.address}</strong></div></div>}
        {company.since && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-calendar" /></div><div className="company-info-detail"><span className="company-info-label">في النظام منذ</span><strong>{company.since}</strong></div></div>}
      </div>

      {/* الأعضاء — نفس تصميم بوابة العميل */}
      <div className="company-section">
        <div className="company-section-header">
          <h3><i className="fas fa-users" /> أعضاء الشركة المسجّلون</h3>
          <span className="badge badge-purple">{members.length} {members.length === 1 ? 'عضو' : 'أعضاء'}</span>
        </div>
        {members.length === 0 ? (
          <p style={{ color: '#64748B', padding: 8 }}>لا يوجد أعضاء مرتبطون بهذه الشركة في سجل العملاء بعد.</p>
        ) : (
          <div className="company-team-grid">
            {members.map((m) => (
              <div key={m.id} className={`company-team-card clickable${m.is_top ? ' owner' : ''}`} onClick={() => navigate(`/clients/${m.id}/profile`)} title="فتح صفحة العضو (عرض إداري)" style={{ cursor: 'pointer' }}>
                <div className={`team-member-avatar${m.is_top ? ' owner' : ''}`}>
                  <div className="team-avatar-placeholder">{initialOf(m.name)}</div>
                  {m.is_top && <span className="team-role-badge owner"><i className="fas fa-crown" /></span>}
                </div>
                <strong>{m.name}</strong>
                {m.account_number && <span className="team-member-code"><i className="fas fa-fingerprint" /> {m.account_number}</span>}
                <span>{m.position || (m.is_top ? 'مالك الشركة' : 'عضو')}</span>
                <span className="team-projects-count">{m.project_count} مشاريع</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* المشاريع — نفس تصميم بوابة العميل */}
      <div className="company-section">
        <div className="company-section-header">
          <h3><i className="fas fa-folder-tree" /> مشاريع الشركة</h3>
          <div className="company-filter-tabs">
            <button className={`company-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>الكل</button>
            <button className={`company-tab${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>نشطة</button>
            <button className={`company-tab${filter === 'done' ? ' active' : ''}`} onClick={() => setFilter('done')}>مكتملة</button>
          </div>
        </div>
        <div className="company-projects-grid">
          {shown.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا مشاريع في هذا التصنيف.</p>}
          {shown.map((p) => (
            <div key={p.id} className="company-project-card clickable" onClick={() => navigate(`/projects/${p.id}`)} title="فتح صفحة المشروع" style={{ cursor: 'pointer' }}>
              <div className="company-project-header">
                <span className={`badge ${badgeOf(p.status)}`}>{STATUS_LABELS[p.status] ?? p.status}</span>
                <span className="company-project-id">{p.code ? `#${p.code}` : `#${p.id}`}</span>
              </div>
              <h4>{p.name}</h4>
              <div className="company-project-progress">
                <div className="company-progress-bar"><div className={`company-progress-fill ${fillOf(p.status)}`} style={{ width: `${p.progress}%` }} /></div>
                <span>{p.progress}%</span>
              </div>
              <div className="company-project-footer">
                {p.manager && <span><i className="fas fa-user" /> {p.manager}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const backBtn: CSSProperties = { fontSize: 13.5, fontWeight: 700, color: '#274A78', background: '#EEF2F7', border: 'none', cursor: 'pointer', display: 'inline-block', marginBottom: 14, padding: '9px 18px', borderRadius: 10, fontFamily: 'inherit' };
