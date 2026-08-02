import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogout } from '../../auth/hooks/useAuth';
import { usePublicHeroSlides } from '../../hero/hooks/useHero';
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '../../projects/types';
import { useClientPortal, useSubmitClientRequest } from '../hooks/useClientPortal';
import '../clientPortalV2.css';

const money = (v: number | string) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric' }) : '—');
const monthOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { month: 'long' }) : '');
const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '');

/** نسبة تقدّم تقريبية حسب الحالة (لا يوفّر ملخّص العميل نسبة دقيقة). */
const progressOf = (s: ProjectStatus): number => ({ draft: 10, active: 60, review: 85, on_hold: 40, done: 100, cancelled: 0 }[s] ?? 30);
const ringColor = (p: number): string => (p >= 80 ? 'green' : p >= 50 ? '' : 'orange');

/**
 * بوابة العميل — طبق الأصل من تصميم atoms («تحسين صفحة العميل»):
 * قائمة جانبية ببطاقة ملف العميل، ترويسة، كاروسيل إعلانات، مؤشرات، برنامج ولاء،
 * وشبكة (مشاريع نشطة/آخر التحديثات/اجتماعات قادمة/إجراءات سريعة) — موصولة ببياناتك الحقيقية.
 */
export function ClientPortalV2Page() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { data, isLoading, isError } = useClientPortal();
  const { data: slides } = usePublicHeroSlides();
  const submitReq = useSubmitClientRequest();

  const [slide, setSlide] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const adCount = slides?.length ?? 0;
  useEffect(() => {
    if (adCount <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % adCount), 6000);

    return () => clearInterval(t);
  }, [adCount]);

  const today = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const projects = data?.projects ?? [];
  const appts = data?.appointments ?? [];
  const invoices = data?.invoices ?? [];
  const clientName = data?.client?.name ?? 'عميلنا';
  const initial = clientName.trim().charAt(0) || 'ع';
  const memberCode = `MEM-${String(data?.client?.id ?? 0).padStart(4, '0')}`;
  const referralCode = `MEMAR-${(clientName.split(' ')[0] || 'CLIENT').toUpperCase()}`;

  const doneCount = projects.filter((p) => p.status === 'done').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completionPct = projects.length > 0 ? Math.round((doneCount / projects.length) * 100) : 0;
  const unpaid = invoices.filter((i) => Number(i.balance_kwd) > 0);

  // آخر التحديثات — مشتقّة من بياناتك الحقيقية (فواتير غير مسدّدة + مواعيد قادمة).
  const activity = useMemo(() => {
    const items: { dot: string; text: string; time: string }[] = [];
    unpaid.slice(0, 2).forEach((i) => items.push({ dot: 'orange', text: `فاتورة ${i.number ?? '#' + i.id} بانتظار السداد — ${money(i.balance_kwd)}`, time: 'مستحقة' }));
    appts.slice(0, 2).forEach((a) => items.push({ dot: 'purple', text: `اجتماع: ${a.title}`, time: monthOf(a.start_at) + ' ' + dayOf(a.start_at) }));
    projects.slice(0, 2).forEach((p) => items.push({ dot: 'blue', text: `مشروع ${p.name} — ${PROJECT_STATUS_LABELS[p.status]}`, time: '' }));

    return items.slice(0, 5);
  }, [unpaid, appts, projects]);

  if (isLoading) return <div className="mcp-root" style={{ padding: 40 }}>جارٍ التحميل…</div>;
  if (isError || !data) return <div className="mcp-root" style={{ padding: 40, color: '#ef4444' }}>تعذّر تحميل بوابة العميل.</div>;

  if (!data.linked) {
    return (
      <div className="mcp-root">
        <div style={{ maxWidth: 620, margin: '60px auto', background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <h2>هذا الحساب غير مرتبط بسجل عميل</h2>
          <p style={{ color: '#64748B', lineHeight: 1.9 }}>يربط مدير النظام هذا الحساب بسجل العميل لتفعيل البوابة.</p>
          <button className="btn" style={{ marginTop: 16, background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: 10 }} onClick={() => logout.mutate()}>🚪 تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  const currentAd = adCount > 0 ? slides![Math.min(slide, adCount - 1)] : null;

  const doRequest = (type: 'project' | 'meeting') => submitReq.mutate({ type });

  return (
    <div className="mcp-root">
      <div className="app">
        {/* ══ SIDEBAR ══ */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 7v10M7 9.5l5 2.5 5-2.5" stroke="currentColor" strokeWidth="1.5" /></svg>
            </div>
            <div className="sb-brand-text"><h1>مجموعة معمار</h1><span>للاستشارات الهندسية</span></div>
          </div>

          {/* بطاقة ملف العميل */}
          <div className="sb-client-profile">
            <div className="sb-profile-header">
              <div className="sb-client-avatar">
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{initial}</div>
                <span className="sb-client-status online" />
              </div>
              <div className="sb-client-info">
                <strong className="sb-client-name">{clientName}</strong>
                <span className="sb-client-member-code"><i className="fas fa-hashtag" /> {memberCode}</span>
                <span className="sb-client-role"><i className="fas fa-crown" /> عميل</span>
              </div>
            </div>
            <div className="sb-profile-details">
              <div className="sb-profile-stats-new" style={{ cursor: 'default' }}>
                <div className="sb-stat-main"><span className="sb-stat-main-value">{projects.length}</span><span className="sb-stat-main-label">مشاريع</span></div>
                <div className="sb-stat-breakdown">
                  <div className="sb-stat-row"><span className="sb-stat-dot active" /><span className="sb-stat-row-value">{activeProjects}</span><span className="sb-stat-row-label">نشطة</span></div>
                  <div className="sb-stat-row"><span className="sb-stat-dot completed" /><span className="sb-stat-row-value">{doneCount}</span><span className="sb-stat-row-label">مكتملة</span></div>
                </div>
              </div>
              <div className="sb-profile-tags">
                <span className="sb-tag sb-tag-gold"><i className="fas fa-star" /> عميل مميز</span>
              </div>
              <button className="btn sb-new-request-btn" onClick={() => doRequest('project')} disabled={submitReq.isPending}>
                <i className="fas fa-diagram-project" /> اطلب مشروع جديد
              </button>
            </div>
          </div>

          <nav className="sb-nav">
            <div className="nav-section-label">الرئيسية</div>
            <div className="nav-item active"><i className="fas fa-grid-2" /><span>نظرة عامة</span></div>

            <div className="nav-section-label">المشاريع</div>
            <div className="nav-sub-items">
              {projects.length === 0 && <div className="nav-item" style={{ opacity: 0.6 }}><i className="fas fa-building" /><span>لا مشاريع بعد</span></div>}
              {projects.map((p) => (
                <div key={p.id} className="nav-item" onClick={() => navigate(`/client-portal/projects/${p.id}`)}>
                  <i className="fas fa-building" /><span>{p.name}</span>
                  <span className={`nav-progress-dot ${p.status === 'active' ? 'active' : 'pending'}`} />
                </div>
              ))}
            </div>

            <div className="nav-section-label">التواصل</div>
            <div className="nav-item"><i className="fas fa-video" /><span>الاجتماعات</span>{appts.length > 0 && <span className="nav-badge">{appts.length}</span>}</div>
          </nav>

          <div className="sb-user">
            <div className="sb-avatar"><span>{initial}</span></div>
            <div className="sb-user-info"><strong>{clientName}</strong><span>عميل مميز</span></div>
            <button className="sb-logout" title="تسجيل خروج" onClick={() => logout.mutate()}><i className="fas fa-arrow-right-from-bracket" /></button>
          </div>
        </aside>

        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ══ MAIN ══ */}
        <main className="main">
          <header className="topbar">
            <button className="topbar-menu-btn" onClick={() => setSidebarOpen((o) => !o)}><i className="fas fa-bars" /></button>
            <div className="topbar-breadcrumb"><span className="topbar-page-title">نظرة عامة</span></div>
            <div className="topbar-actions">
              <span className="topbar-date">{today}</span>
              <div className="topbar-user-menu">
                <button className="topbar-user-btn"><div className="topbar-user-avatar">{initial}</div><span>{clientName.split(' ')[0]}</span></button>
              </div>
            </div>
          </header>

          <div className="content">
            <div className="page active">
              {/* كاروسيل الإعلانات */}
              {currentAd && (
                <div className="hero-ads-fullwidth">
                  <div className="hero-ads-slider">
                    <div className="hero-ad-slide active" style={{ background: currentAd.bg_gradient }}>
                      <div className="hero-ad-content">
                        <span className="hero-ad-tag"><i className="fas fa-bullhorn" /> عرض</span>
                        <h2>{currentAd.title}</h2>
                        {currentAd.subtitle && <p>{currentAd.subtitle}</p>}
                        {currentAd.cta_label && currentAd.cta_url && (
                          <a className="btn hero-ad-btn" href={currentAd.cta_url} target={/^https?:/.test(currentAd.cta_url) ? '_blank' : undefined} rel="noreferrer"><i className="fas fa-arrow-left" /> {currentAd.cta_label}</a>
                        )}
                      </div>
                    </div>
                  </div>
                  {adCount > 1 && (
                    <div className="hero-ads-controls">
                      <button className="hero-ad-nav-btn" onClick={() => setSlide((s) => (s - 1 + adCount) % adCount)}><i className="fas fa-chevron-right" /></button>
                      <div className="hero-ads-dots">
                        {slides!.map((s, i) => <span key={s.id} className={`hero-dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />)}
                      </div>
                      <button className="hero-ad-nav-btn" onClick={() => setSlide((s) => (s + 1) % adCount)}><i className="fas fa-chevron-left" /></button>
                    </div>
                  )}
                </div>
              )}

              {/* المؤشرات */}
              <div className="kpi-grid">
                <Kpi icon="fa-diagram-project" cls="blue" value={String(activeProjects)} label="مشاريع نشطة" />
                <Kpi icon="fa-check-circle" cls="green" value={`${completionPct}%`} label="نسبة الإنجاز" />
                <Kpi icon="fa-file-invoice" cls="orange" value={String(unpaid.length)} label="فواتير معلقة" />
                <Kpi icon="fa-calendar-check" cls="purple" value={String(appts.length)} label="اجتماع قادم" />
              </div>

              {/* برنامج الولاء */}
              <div className="loyalty-section-featured">
                <div className="loyalty-featured-card">
                  <div className="loyalty-featured-bg" />
                  <div className="loyalty-featured-content">
                    <div className="loyalty-featured-icon"><i className="fas fa-handshake-angle" /></div>
                    <div className="loyalty-featured-info">
                      <h3>اقترحنا لصديق</h3>
                      <p>شارك تجربتك مع معمار واحصل على خصم 10% على مشروعك القادم أو أهدِ الخصم لصديقك</p>
                    </div>
                    <div className="loyalty-featured-code-box">
                      <div className="loyalty-featured-code-label">كود العضوية</div>
                      <div className="loyalty-featured-code-value">
                        <span>{referralCode}</span>
                        <button className="loyalty-featured-copy-btn" title="نسخ الكود" onClick={() => { navigator.clipboard?.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} /></button>
                      </div>
                    </div>
                    <div className="loyalty-featured-actions">
                      <button className="btn loyalty-featured-btn-share" onClick={() => { navigator.clipboard?.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><i className="fas fa-share-nodes" /> مشاركة الكود</button>
                      <button className="btn loyalty-featured-btn-use" onClick={() => doRequest('meeting')}><i className="fas fa-calendar" /> اطلب اجتماعاً</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* الشبكة */}
              <div className="dashboard-grid">
                {/* المشاريع النشطة */}
                <div className="card projects-overview">
                  <div className="card-header"><h3 className="card-title">مشاريعي</h3></div>
                  <div className="card-body">
                    <div className="project-list">
                      {projects.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا مشاريع بعد.</p>}
                      {projects.map((p) => {
                        const prog = progressOf(p.status);

                        return (
                          <div key={p.id} className="project-item" onClick={() => navigate(`/client-portal/projects/${p.id}`)}>
                            <div className="project-item-icon"><i className="fas fa-building" /></div>
                            <div className="project-item-info"><h4>{p.name}</h4><span className="project-item-stage">{PROJECT_STATUS_LABELS[p.status]}</span></div>
                            <div className="project-item-progress">
                              <div className="progress-ring">
                                <svg viewBox="0 0 36 36"><path className="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className={`progress-ring-fill ${ringColor(prog)}`} strokeDasharray={`${prog}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                                <span>{prog}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* آخر التحديثات */}
                <div className="card recent-activity">
                  <div className="card-header"><h3 className="card-title">آخر التحديثات</h3></div>
                  <div className="card-body">
                    <div className="activity-list">
                      {activity.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا تحديثات.</p>}
                      {activity.map((a, i) => (
                        <div key={i} className="activity-item">
                          <div className={`activity-dot ${a.dot}`} />
                          <div className="activity-content"><p>{a.text}</p>{a.time && <span className="activity-time">{a.time}</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* الاجتماعات القادمة */}
                <div className="card upcoming-meetings">
                  <div className="card-header"><h3 className="card-title">الاجتماعات القادمة</h3></div>
                  <div className="card-body">
                    {appts.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا اجتماعات قادمة.</p>}
                    {appts.map((a) => (
                      <div key={a.id} className="meeting-mini-card">
                        <div className="meeting-mini-date"><span className="meeting-mini-day">{dayOf(a.start_at)}</span><span className="meeting-mini-month">{monthOf(a.start_at)}</span></div>
                        <div className="meeting-mini-info"><h4>{a.title}</h4><p><i className="fas fa-clock" /> {timeOf(a.start_at)}</p><p><i className={`fas ${a.is_video ? 'fa-video' : 'fa-location-dot'}`} /> {a.is_video ? 'اجتماع مرئي' : 'حضوري'}</p></div>
                        <span className="badge badge-blue">قادم</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* إجراءات سريعة */}
                <div className="card quick-actions">
                  <div className="card-header"><h3 className="card-title">إجراءات سريعة</h3></div>
                  <div className="card-body">
                    <div className="quick-actions-grid">
                      <button className="quick-action-btn" onClick={() => doRequest('project')}><i className="fas fa-diagram-project" /><span>طلب مشروع</span></button>
                      <button className="quick-action-btn" onClick={() => doRequest('meeting')}><i className="fas fa-calendar-plus" /><span>طلب اجتماع</span></button>
                      <button className="quick-action-btn" onClick={() => projects[0] && navigate(`/client-portal/projects/${projects[0].id}`)}><i className="fas fa-money-bill-wave" /><span>الدفعات</span></button>
                      <button className="quick-action-btn" onClick={() => doRequest('meeting')}><i className="fas fa-headset" /><span>دعم</span></button>
                    </div>
                  </div>
                </div>
              </div>

              {submitReq.isSuccess && <div style={{ position: 'fixed', bottom: 24, insetInlineStart: 24, background: '#059669', color: '#fff', padding: '12px 18px', borderRadius: 10, fontWeight: 700, zIndex: 500 }}>✓ تم إرسال طلبك — سنتواصل معك قريبًا.</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Kpi({ icon, cls, value, label }: { icon: string; cls: string; value: string; label: string }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${cls}`}><i className={`fas ${icon}`} /></div>
      <div className="kpi-content"><span className="kpi-value">{value}</span><span className="kpi-label">{label}</span></div>
    </div>
  );
}
