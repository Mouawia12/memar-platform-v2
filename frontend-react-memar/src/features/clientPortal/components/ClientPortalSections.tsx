import { useEffect, useRef, useState } from 'react';

import type { Appointment } from '../../appointments/types';
import { ForumBoard } from '../../forum/components/ForumBoard';
import type { Project, ProjectStatus } from '../../projects/types';
import { clientAccountCode, type ClientInfo, type LoyaltyData, type NotificationPrefs } from '../api/clientPortalApi';
import { useAddTeamMember, useAddThreadParticipant, useChatThreads, useClientNotifications, useCreateChatThread, useCreateForumThread, useDeleteAvatar, useForumThreads, useMyRequests, useRemoveTeamMember, useRemoveThreadParticipant, useRenameChatThread, useSendThreadMessage, useTeamMembers, useThreadMessages, useUpdateClientPreferences, useUpdateClientProfile, useUploadAvatar } from '../hooks/useClientPortal';
import type { ChatThread } from '../api/clientPortalApi';

const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric' }) : '—');
const monthOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { month: 'long' }) : '');
const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '');
const yearOf = (iso: string | null) => (iso ? String(new Date(iso).getFullYear()) : '');

/** طلباتي — طبق الأصل: section-header + قائمة request-item ببياناتك الحقيقية. */
const REQ_STATUS: Record<string, { cls: string; icon: string }> = {
  open: { cls: 'status-pending', icon: 'fa-clock' },
  in_progress: { cls: 'status-approved', icon: 'fa-check' },
  resolved: { cls: 'status-completed', icon: 'fa-check-double' },
  closed: { cls: 'status-completed', icon: 'fa-check-double' },
};

export function RequestsSection({ onNew }: { onNew?: () => void }) {
  const { data, isLoading } = useMyRequests();

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">طلباتي</h2>
          <p className="section-subtitle">إدارة طلبات التعديل والإضافات على مشاريعك</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNew?.()}><i className="fas fa-plus" /> طلب جديد</button>
      </div>
      <div className="requests-list">
        {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
        {data && data.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا طلبات بعد — استخدم زر «طلب جديد» أعلاه.</p>}
        {data?.map((r) => {
          const st = REQ_STATUS[r.status] ?? REQ_STATUS.open;

          return (
            <div key={r.id} className="request-item">
              <div className="request-item-header">
                <span className="request-item-id">#REQ-{String(r.id).padStart(3, '0')}</span>
                <span className={`request-status-badge ${st.cls}`}><i className={`fas ${st.icon}`} /> {r.status_label}</span>
              </div>
              <h4 className="request-item-title">{r.title}</h4>
              {r.description && <p className="request-item-desc" style={{ whiteSpace: 'pre-line' }}>{r.description}</p>}
              {/* ميتا طبق الأصل: المشروع + التاريخ + الشخص (+ المرفقات إن وُجدت) */}
              <div className="request-item-meta">
                {r.project && <span><i className="fas fa-building" /> {r.project}</span>}
                <span><i className="fas fa-calendar" /> {fmtDate(r.created_at)}</span>
                {r.person && <span><i className="fas fa-user" /> {r.person}</span>}
                {r.attachments && r.attachments.length > 0 && (
                  <span><i className="fas fa-paperclip" /> {r.attachments.length} مرفق</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** الإشعارات — طبق الأصل: section-header + notifications-list ببياناتك الحقيقية. */
export function NotificationsSection() {
  const { data, isLoading } = useClientNotifications();
  const [readAll, setReadAll] = useState(false);

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">الإشعارات</h2>
          <p className="section-subtitle">جميع التنبيهات والتحديثات</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setReadAll(true)}>تحديد الكل كمقروء</button>
      </div>
      <div className="notifications-list">
        {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
        {data && data.items.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا إشعارات جديدة 🎉</p>}
        {data?.items.map((n, i) => (
          <div key={i} className={`notification-item${readAll ? '' : ' unread'}`}>
            <div className={`notification-icon ${n.kind === 'warning' ? 'orange' : 'blue'}`}><i className={`fas ${n.icon}`} /></div>
            <div className="notification-content">
              <p><strong>{n.title}</strong> — {n.text}</p>
              {n.at && <span className="notification-time">{fmtDateTime(n.at)}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** الاجتماعات — طبق الأصل: meetings-list (اليوم/قادم/سابق) من مواعيدك الحقيقية. */
export function MeetingsSection({ appts, onRequest, onToast }: { appts: Appointment[]; onRequest: () => void; onToast?: (m: string) => void }) {
  const now = Date.now();
  const isSameDay = (iso: string | null) => (iso ? new Date(iso).toDateString() === new Date().toDateString() : false);
  const durationOf = (a: Appointment): string | null => {
    if (!a.start_at || !a.end_at) return null;
    const mins = Math.round((new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60000);
    return mins > 0 ? `${mins} دقيقة` : null;
  };
  const toast = (m: string) => onToast?.(m);

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">الاجتماعات</h2>
          <p className="section-subtitle">إدارة ومتابعة اجتماعاتك مع فريق المشروع</p>
        </div>
        <button className="btn btn-primary" onClick={onRequest}><i className="fas fa-plus" /> طلب اجتماع</button>
      </div>
      <div className="meetings-list">
        {appts.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا اجتماعات مجدولة بعد — استخدم «طلب اجتماع».</p>}
        {[...appts].sort((x, y) => {
          // الترتيب طبق الأصل: اليوم (live) ثم القادمة (الأقرب أولاً) ثم المنتهية (الأحدث أولاً)
          const rank = (a: Appointment) => { const t = a.start_at ? new Date(a.start_at).getTime() : 0; const td = isSameDay(a.start_at); return td ? 0 : (t > 0 && t < now) ? 2 : 1; };
          const rx = rank(x), ry = rank(y);
          if (rx !== ry) return rx - ry;
          const tx = x.start_at ? new Date(x.start_at).getTime() : 0, ty = y.start_at ? new Date(y.start_at).getTime() : 0;
          return rx === 2 ? ty - tx : tx - ty;
        }).map((a) => {
          const start = a.start_at ? new Date(a.start_at).getTime() : 0;
          const today = isSameDay(a.start_at);
          const past = start > 0 && start < now && !today;
          const cls = today ? 'live' : past ? 'past-meeting' : 'upcoming-meeting';

          return (
            <div key={a.id} className={`meeting-card ${cls}`}>
              {today && <div className="meeting-status-bar" />}
              <div className="meeting-card-content">
                <div className="meeting-time-block">
                  <span className="meeting-day">{today ? 'اليوم' : `${dayOf(a.start_at)} ${monthOf(a.start_at)}`}</span>
                  <span className="meeting-time">{timeOf(a.start_at)}</span>
                  {today && <span className="meeting-status-dot live" />}
                  {past && <span className="meeting-status-dot done" />}
                </div>
                <div className="meeting-info">
                  <h4>{a.title}</h4>
                  {/* ميتا طبق الأصل: المشروع + المدّة + النوع/الموقع (أو «مكتمل» للمنتهية) */}
                  <div className="meeting-meta">
                    {a.project?.name && <span><i className="fas fa-building" /> {a.project.name}</span>}
                    {durationOf(a) && <span><i className="fas fa-clock" /> {durationOf(a)}</span>}
                    {past ? (
                      <span><i className="fas fa-check-circle" style={{ color: 'var(--success)' }} /> مكتمل</span>
                    ) : (
                      <span><i className={`fas ${a.is_video ? 'fa-video' : 'fa-location-dot'}`} /> {a.is_video ? 'اجتماع مرئي' : (a.location || 'حضوري')}</span>
                    )}
                  </div>
                </div>
                {/* أزرار الإجراء طبق الأصل: انضمام (اليوم) · تأكيد+تعديل (قادم) · محضر (منتهٍ) */}
                <div className="meeting-actions">
                  {today && (
                    a.is_video && a.video_url
                      ? <a className="btn btn-primary" href={a.video_url} target="_blank" rel="noreferrer"><i className="fas fa-video" /> انضمام</a>
                      : <button className="btn btn-primary" type="button" onClick={() => toast(a.is_video ? 'سيُفعّل رابط الانضمام قبل الموعد بقليل' : 'اجتماع حضوري — نراك في الموعد')}><i className="fas fa-video" /> انضمام</button>
                  )}
                  {!today && !past && (
                    <>
                      <button className="btn btn-secondary" type="button" onClick={() => toast('تم تأكيد حضورك للاجتماع ✓')}><i className="fas fa-calendar-check" /> تأكيد</button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => toast('سيتواصل معك منسّق الاجتماعات لتعديل الموعد')}><i className="fas fa-pen" /> تعديل</button>
                    </>
                  )}
                  {past && (
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => toast(a.notes ? `محضر الاجتماع: ${a.notes}` : 'لم يُرفع محضر هذا الاجتماع بعد')}><i className="fas fa-file-lines" /> محضر الاجتماع</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** برنامج الولاء — طبق الأصل: loyalty-page-grid (بطاقة رئيسية + كيف يعمل + إحصاءات + سجل) بإحصاءات وسجل حقيقيين. */
/** ألوان المستويات + أيقونة التاج. */
const TIER_UI: Record<string, { color: string; bg: string }> = {
  bronze: { color: '#B87333', bg: 'rgba(184,115,51,.12)' },
  silver: { color: '#7C8AA0', bg: 'rgba(124,138,160,.14)' },
  gold: { color: '#D99A16', bg: 'rgba(232,168,56,.15)' },
  platinum: { color: '#6366F1', bg: 'rgba(99,102,241,.13)' },
};

/** أيقونة مصدر حركة النقاط في السجل. */
const SOURCE_ICON: Record<string, string> = {
  referral: 'fa-user-plus', project_completed: 'fa-diagram-project', invoice_paid: 'fa-file-invoice-dollar',
  signup: 'fa-gift', share: 'fa-share-nodes', anniversary: 'fa-cake-candles', redeem: 'fa-percent', adjust: 'fa-sliders',
};

const fmtKwd = (n: number) => `${n.toLocaleString('ar', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 3 })} د.ك`;

/**
 * برنامج الولاء والإحالة — النظام الكامل (طلب أيمن، فيديو 2026-08-04):
 * محفظة نقاط + مستوى + إحالة ثنائية واضحة (صديقك يربح خصمًا وأنت تربح نقاطًا)
 * + استبدال النقاط رصيدَ خصم يُطبَّق على الفواتير. يحلّ لبس «الخصم لمين؟».
 */
export function LoyaltySection({ data, busy, onCopy, onShare, onRedeem, onApplyCredit }: {
  data: LoyaltyData;
  busy?: boolean;
  onCopy: () => void;
  onShare: () => void;
  onRedeem: (points: number) => void;
  onApplyCredit: (voucher: string, invoiceId: number) => void;
}) {
  const isEngineer = data.referrer_kind === 'engineer';
  const per = data.redeem.points_per_kwd;
  const minR = data.redeem.min_points;
  const maxR = Math.floor(data.points / per) * per; // أعلى استبدال ممكن (مضاعف الصرف)
  const tier = data.tier;
  const tierUi = TIER_UI[tier.key] ?? TIER_UI.bronze;

  const [redeemPts, setRedeemPts] = useState(() => Math.min(Math.max(minR, per), Math.max(minR, maxR)));
  const canRedeem = data.points >= minR && redeemPts >= minR && redeemPts <= data.points;

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">برنامج الولاء والإحالة</h2>
          <p className="section-subtitle">اكسب نقاطًا من مشاريعك وإحالاتك، واستبدلها رصيدَ خصم على فواتيرك.</p>
        </div>
      </div>

      <div className="loyalty-grid">
        {/* بطاقة النقاط + المستوى */}
        <div className="loyalty-hero-card" style={{ ['--tier' as string]: tierUi.color }}>
          <div className="loyalty-hero-top">
            <div>
              <div className="loyalty-hero-points">{data.points.toLocaleString('ar')}</div>
              <div className="loyalty-hero-points-label">نقطة ولاء</div>
            </div>
            <div className="loyalty-tier-badge" style={{ background: tierUi.bg, color: tierUi.color }}>
              <i className="fas fa-crown" /> {tier.label}
            </div>
          </div>
          {tier.next ? (
            <div className="loyalty-tier-progress">
              <div className="loyalty-tier-progress-head">
                <span>التقدّم إلى {tier.next.label}</span>
                <span>باقٍ {tier.next.remaining.toLocaleString('ar')} نقطة</span>
              </div>
              <div className="loyalty-progress-track"><div className="loyalty-progress-fill" style={{ width: `${tier.progress}%` }} /></div>
            </div>
          ) : (
            <div className="loyalty-tier-progress"><div className="loyalty-tier-max"><i className="fas fa-trophy" /> وصلت لأعلى مستوى — بلاتيني</div></div>
          )}
          {data.available_credit > 0 && (
            <div className="loyalty-credit-chip"><i className="fas fa-wallet" /> رصيد خصم متاح: <strong>{fmtKwd(data.available_credit)}</strong></div>
          )}
        </div>

        {/* بطاقة الإحالة — ثنائية واضحة (حلّ لبس الفيديو) */}
        <div className="loyalty-referral-card">
          <div className="loyalty-card-head"><i className="fas fa-handshake-angle" /><h3>{isEngineer ? 'أحِل عملاءك' : 'اقترحنا لصديق'}</h3></div>
          <div className="loyalty-dual">
            <div className="loyalty-dual-side friend">
              <i className="fas fa-gift" />
              <strong>صديقك يربح</strong>
              <span>خصم ترحيبي {data.welcome_discount}٪ على أول مشروع</span>
            </div>
            <div className="loyalty-dual-plus">+</div>
            <div className="loyalty-dual-side you">
              <i className="fas fa-star" />
              <strong>أنت تربح</strong>
              <span>{data.referral_reward.toLocaleString('ar')} نقطة عند تعاقده</span>
            </div>
          </div>
          <div className="loyalty-code-box">
            <span className="loyalty-code-text">{data.code}</span>
            <button className="btn btn-sm btn-primary" onClick={onCopy}><i className="fas fa-copy" /> نسخ</button>
          </div>
          <button className="btn btn-primary loyalty-share-btn" onClick={onShare}><i className="fas fa-share-nodes" /> شارك الكود مع صديق</button>
          <p className="loyalty-referral-note"><i className="fas fa-circle-info" /> الخصم يذهب لصديقك، ونقاط المكافأة تُضاف لك تلقائيًا عند تعاقده — دون أي خطوة إضافية منك.</p>
        </div>

        {/* بطاقة الاستبدال — استخدم نقاطك لنفسك */}
        <div className="loyalty-redeem-card">
          <div className="loyalty-card-head"><i className="fas fa-percent" /><h3>استبدل نقاطك</h3></div>
          <p className="loyalty-redeem-rate">كل {per.toLocaleString('ar')} نقطة = <strong>{fmtKwd(1)}</strong> رصيد خصم على فاتورتك.</p>
          {maxR >= minR ? (
            <>
              <div className="loyalty-redeem-picker">
                <button type="button" className="loyalty-step-btn" onClick={() => setRedeemPts((p) => Math.max(minR, p - per))} disabled={redeemPts <= minR}><i className="fas fa-minus" /></button>
                <div className="loyalty-redeem-amount">
                  <strong>{redeemPts.toLocaleString('ar')}</strong> نقطة
                  <span>= {fmtKwd(redeemPts / per)}</span>
                </div>
                <button type="button" className="loyalty-step-btn" onClick={() => setRedeemPts((p) => Math.min(maxR, p + per))} disabled={redeemPts >= maxR}><i className="fas fa-plus" /></button>
              </div>
              <button className="btn btn-primary loyalty-redeem-btn" disabled={!canRedeem || busy} onClick={() => onRedeem(redeemPts)}>
                <i className="fas fa-ticket" /> استبدل واحصل على قسيمة خصم
              </button>
            </>
          ) : (
            <p className="loyalty-redeem-empty">تحتاج {minR.toLocaleString('ar')} نقطة على الأقل للاستبدال — اكسب المزيد من مشاريعك وإحالاتك.</p>
          )}

          {data.vouchers.length > 0 && (
            <div className="loyalty-vouchers">
              <div className="loyalty-vouchers-title">قسائمك</div>
              {data.vouchers.map((v) => (
                <div key={v.code} className={`loyalty-voucher ${v.status}`}>
                  <div className="loyalty-voucher-info"><i className="fas fa-ticket" /><strong>{fmtKwd(v.amount_kwd)}</strong><span>{v.code}</span></div>
                  {v.status === 'available' && data.unpaid_invoices.length > 0 ? (
                    <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => onApplyCredit(v.code, data.unpaid_invoices[0].id)}>
                      تطبيق على فاتورة {data.unpaid_invoices[0].number ?? ''}
                    </button>
                  ) : (
                    <span className={`badge ${v.status === 'available' ? 'badge-green' : 'badge-blue'}`}>{v.status === 'available' ? 'متاحة' : v.status === 'applied' ? 'مُطبّقة' : 'منتهية'}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* سجل النقاط */}
        <div className="loyalty-ledger-card">
          <div className="loyalty-card-head"><i className="fas fa-clock-rotate-left" /><h3>سجل النقاط</h3></div>
          <div className="loyalty-ledger">
            {data.ledger.length === 0 && <p className="loyalty-empty">لا حركات بعد — ابدأ باكتساب نقاطك.</p>}
            {data.ledger.map((t) => (
              <div key={t.id} className="loyalty-ledger-row">
                <div className={`loyalty-ledger-icon ${t.points >= 0 ? 'earn' : 'spend'}`}><i className={`fas ${SOURCE_ICON[t.source] ?? 'fa-star'}`} /></div>
                <div className="loyalty-ledger-info">
                  <strong>{t.description ?? t.source_label}</strong>
                  <span>{t.source_label} · {fmtDate(t.date)}</span>
                </div>
                <div className={`loyalty-ledger-points ${t.points >= 0 ? 'earn' : 'spend'}`}>{t.points >= 0 ? '+' : ''}{t.points.toLocaleString('ar')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* الإحالات + مزايا المستوى */}
        <div className="loyalty-side-col">
          <div className="loyalty-referrals-card">
            <div className="loyalty-card-head"><i className="fas fa-users" /><h3>إحالاتك</h3></div>
            <div className="loyalty-referrals">
              {data.referrals.length === 0 && <p className="loyalty-empty">لا إحالات بعد — شارك كودك لتبدأ.</p>}
              {data.referrals.map((r) => (
                <div key={r.id} className="loyalty-referral-row">
                  <div className="loyalty-referral-avatar">{(r.name ?? '؟').trim().charAt(0)}</div>
                  <div className="loyalty-referral-info"><strong>{r.name ?? 'صديق'}</strong><span>{fmtDate(r.date)}</span></div>
                  <span className={`badge ${r.status === 'contracted' ? 'badge-green' : 'badge-orange'}`}>{r.status_label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="loyalty-perks-card">
            <div className="loyalty-card-head"><i className="fas fa-award" /><h3>مزايا مستوى {tier.label}</h3></div>
            <ul className="loyalty-perks">
              {tier.perks.map((p, i) => <li key={i}><i className="fas fa-check" /> {p}</li>)}
            </ul>
            {tier.next && <p className="loyalty-perks-next"><i className="fas fa-arrow-up" /> ارتقِ إلى {tier.next.label} لمزايا أكبر.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

/** التواصل — طبق الأصل: chat-layout بلوحتين، رسائل حقيقية محفوظة (ردود الطاقم من لوحة الـERP). */
const THREAD_ICON: Record<ChatThread['kind'], { icon: string; cls: string; label: string }> = {
  team: { icon: 'fa-users', cls: 'green', label: 'فريق معمار' },
  support: { icon: 'fa-headset', cls: 'blue', label: 'الدعم الفني' },
  custom: { icon: 'fa-comment-dots', cls: 'gold', label: 'محادثة' },
};

/** المحادثات (بند 8): خيوط متعددة (فريق + دعم فني + مخصّصة) مع إعادة تسمية وإضافة أعضاء. */
export function ChatSection() {
  const { data: threads, isLoading: threadsLoading } = useChatThreads();
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = threads?.find((t) => t.id === activeId) ?? threads?.[0] ?? null;
  const activeThreadId = active?.id ?? null;

  const { data: messages, isLoading } = useThreadMessages(activeThreadId);
  const sendMsg = useSendThreadMessage(activeThreadId ?? 0);
  const createThread = useCreateChatThread();
  const renameThread = useRenameChatThread();
  const addParticipant = useAddThreadParticipant();
  const removeParticipant = useRemoveThreadParticipant();

  const [text, setText] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t || !activeThreadId || sendMsg.isPending) return;
    setText('');
    sendMsg.mutate(t);
  };

  const startNewChat = () => {
    const title = window.prompt('اسم المحادثة الجديدة:')?.trim();
    if (title) createThread.mutate(title, { onSuccess: (r) => setActiveId(r.id) });
  };

  const saveRename = () => {
    const t = renameDraft.trim();
    if (t && active) renameThread.mutate({ id: active.id, title: t });
    setRenaming(false);
  };

  const saveMember = () => {
    const name = memberName.trim();
    if (name && active) addParticipant.mutate({ id: active.id, name, role: memberRole.trim() });
    setMemberName(''); setMemberRole(''); setAddingMember(false);
  };

  const meta = active ? THREAD_ICON[active.kind] : THREAD_ICON.team;

  return (
    <div className="chat-layout">
      <div className="chat-sidebar-panel">
        <div className="chat-sidebar-header">
          <h3>المحادثات</h3>
          <button className="chat-new-btn" onClick={startNewChat} title="محادثة جديدة"><i className="fas fa-pen-to-square" /></button>
        </div>
        <div className="chat-contacts-list">
          {threadsLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
          {threads?.map((t) => {
            const m = THREAD_ICON[t.kind];

            return (
              <div key={t.id} className={`chat-contact${t.id === activeThreadId ? ' active' : ''}`} onClick={() => setActiveId(t.id)}>
                <div className={`chat-contact-avatar ${m.cls}`}><i className={`fas ${m.icon}`} /></div>
                <div className="chat-contact-info">
                  <strong>{t.title}</strong>
                  <p>{t.last_message ?? (t.kind === 'support' ? 'مساعدة تقنية' : 'ابدأ المحادثة')}</p>
                </div>
                {t.unread_count > 0 && <span className="chat-unread-badge">{t.unread_count}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="chat-main-panel">
        <div className="chat-main-header">
          <div className="chat-main-user">
            <div className={`chat-contact-avatar ${meta.cls}`}><i className={`fas ${meta.icon}`} /></div>
            <div style={{ minWidth: 0 }}>
              {renaming ? (
                <input className="chat-rename-input" autoFocus dir="rtl" value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onBlur={saveRename} onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(false); }} />
              ) : (
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {active?.title ?? 'فريق معمار'}
                  {active?.can_rename && <button className="chat-icon-btn" title="إعادة تسمية" onClick={() => { setRenameDraft(active.title); setRenaming(true); }}><i className="fas fa-pen-to-square" /></button>}
                </strong>
              )}
              <span className="chat-online-status">{active?.kind === 'support' ? 'الدعم الفني — نردّ بأسرع وقت' : 'نردّ خلال ساعات العمل'}</span>
            </div>
          </div>
          <button className="chat-add-member-btn" onClick={() => setAddingMember((v) => !v)} title="إضافة عضو"><i className="fas fa-user-plus" /> إضافة عضو</button>
        </div>

        {(active?.participants.length ?? 0) > 0 && (
          <div className="chat-participants-bar">
            {active?.participants.map((p) => (
              <span key={p.id} className="chat-participant-chip">
                <i className="fas fa-user" /> {p.name}{p.role ? ` · ${p.role}` : ''}
                <button className="chat-participant-remove" title="إزالة" onClick={() => active && removeParticipant.mutate({ id: active.id, participantId: p.id })}><i className="fas fa-xmark" /></button>
              </span>
            ))}
          </div>
        )}

        {addingMember && (
          <div className="chat-add-member-form">
            <input className="chat-input-field" placeholder="اسم العضو/الموظف" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
            <input className="chat-input-field" placeholder="الدور (اختياري)" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} />
            <button className="chat-send-btn" onClick={saveMember} disabled={addParticipant.isPending}><i className="fas fa-check" /></button>
          </div>
        )}

        <div className="chat-messages-area" ref={areaRef}>
          {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
          {messages && messages.length === 0 && <p style={{ color: '#64748B', padding: 8, textAlign: 'center' }}>ابدأ المحادثة — اكتب رسالتك وسيردّ عليك فريق معمار.</p>}
          {messages?.map((m) => (
            <div key={m.id} className={`chat-msg ${m.from_staff ? 'incoming' : 'outgoing'}`}>
              <div className="chat-msg-bubble"><p>{m.body}</p><span className="chat-msg-time">{timeOf(m.at)}</span></div>
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input type="text" className="chat-input-field" placeholder="اكتب رسالتك هنا..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} />
          <button className="chat-send-btn" onClick={send} disabled={sendMsg.isPending}><i className="fas fa-paper-plane" /></button>
        </div>
      </div>
    </div>
  );
}

/** المنتدى — طبق الأصل: forum-threads حقيقية (أسئلة العميل وردود الطاقم) + نشر سؤال. */
export function ForumSection() {
  const { data: threads, isLoading } = useForumThreads();
  const create = useCreateForumThread();
  const [sent, setSent] = useState(false);

  // نفس لوحة المنتدى المشتركة المستخدمة في لوحة الموظف — منتدى واحد موحّد على جدول مشترك.
  return (
    <ForumBoard
      threads={threads}
      isLoading={isLoading}
      posting={create.isPending}
      sent={sent}
      onPost={(title, body) => create.mutate({ title, body }, { onSuccess: () => { setSent(true); setTimeout(() => setSent(false), 3000); } })}
    />
  );
}

/** الإعدادات — طبق الأصل: settings-grid (صورة + معلومات شخصية + تفضيلات إشعارات) موصولة. */
export function SettingsSection({ client }: { client: ClientInfo }) {
  const update = useUpdateClientProfile();
  const [name, setName] = useState(client.name ?? '');
  const [kunya, setKunya] = useState(client.kunya ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [company, setCompany] = useState(client.company ?? '');
  const [saved, setSaved] = useState(false);
  const savePrefs = useUpdateClientPreferences();
  const [prefs, setPrefs] = useState<NotificationPrefs>(client.notification_prefs ?? { email: true, sms: true, meetings: true, invoices: true });
  const initial = (client.name ?? 'ع').trim().charAt(0) || 'ع';

  // الصورة الشخصية: رفع/تغيير/حذف (اجتماع 2026-08-03، بند 10)
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarErr, setAvatarErr] = useState('');
  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // يسمح بإعادة اختيار نفس الملف
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setAvatarErr('الصيغ المدعومة: JPG, PNG, WEBP.'); return; }
    if (file.size > 3 * 1024 * 1024) { setAvatarErr('الحد الأقصى 3 ميجابايت.'); return; }
    setAvatarErr('');
    uploadAvatar.mutate(file);
  };

  const save = () => {
    if (name.trim().length < 2) return;
    update.mutate({ full_name: name.trim(), kunya: kunya.trim() || null, phone: phone.trim() || null, company: company.trim() || null }, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); } });
  };

  // تبديل مفتاح يحفظ فورًا في الباك اند (تحديث متفائل).
  const togglePref = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs.mutate(next);
  };

  const toggles: { key: keyof NotificationPrefs; title: string; sub: string }[] = [
    { key: 'email', title: 'إشعارات البريد الإلكتروني', sub: 'استلام تحديثات المشروع عبر البريد' },
    { key: 'sms', title: 'إشعارات الجوال', sub: 'تنبيهات فورية على الجوال' },
    { key: 'meetings', title: 'تذكيرات الاجتماعات', sub: 'تذكير قبل الاجتماع بـ 30 دقيقة' },
    { key: 'invoices', title: 'تنبيهات الفواتير', sub: 'إشعار عند صدور فاتورة جديدة' },
  ];

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">الإعدادات</h2>
          <p className="section-subtitle">إدارة حسابك وتفضيلاتك</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="card settings-photo-card">
          <div className="card-header"><h3 className="card-title">الصورة الشخصية</h3></div>
          <div className="card-body">
            <div className="settings-avatar-section">
              <div className="settings-avatar-preview">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.name ?? 'الصورة الشخصية'} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>{initial}</div>
                )}
              </div>
              <div className="settings-avatar-info">
                <h4>{client.name}</h4>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickAvatar} />
                <div className="settings-avatar-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploadAvatar.isPending}>
                    <i className="fas fa-camera" /> {uploadAvatar.isPending ? 'جارٍ الرفع…' : client.avatar_url ? 'تغيير الصورة' : 'رفع صورة'}
                  </button>
                  {client.avatar_url && (
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteAvatar.mutate()} disabled={deleteAvatar.isPending}>
                      <i className="fas fa-trash-can" /> حذف
                    </button>
                  )}
                </div>
                {avatarErr ? <p className="settings-avatar-hint danger">{avatarErr}</p> : <p className="settings-avatar-hint">JPG أو PNG أو WEBP — يفضّل مربّعة (مثل 400×400)، بحد أقصى 3 ميجابايت.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">المعلومات الشخصية</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group"><label className="form-label">الاسم الكامل</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">الكنية</label><input className="form-input" value={kunya} onChange={(e) => setKunya(e.target.value)} placeholder="مثال: أبو عبدالله" /></div>
              <div className="form-group"><label className="form-label">رقم الجوال</label><input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+965…" /></div>
              <div className="form-group"><label className="form-label">الشركة</label><input className="form-input" value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">كود العضوية</label><input className="form-input" value={clientAccountCode(client)} disabled /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" disabled={update.isPending} onClick={save}>{update.isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</button>
              {saved && <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>✓ حُفظ</span>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">تفضيلات الإشعارات</h3>{savePrefs.isPending && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>جارٍ الحفظ…</span>}{savePrefs.isSuccess && !savePrefs.isPending && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ حُفظ</span>}</div>
          <div className="card-body">
            <div className="settings-toggle-list">
              {toggles.map((t) => (
                <div key={t.key} className="settings-toggle-item">
                  <div><strong>{t.title}</strong><p>{t.sub}</p></div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={prefs[t.key]} onChange={() => togglePref(t.key)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** صفحة الشركة — طبق الأصل: hero + info-grid + team-grid + projects-grid (بفلاتر) من بياناتك. */
export function CompanySection({ client, projects, onProject, onRequest, onBack }: { client: ClientInfo; projects: Project[]; onProject: (id: number) => void; onRequest: () => void; onBack: () => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const { data: team } = useTeamMembers();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const [adding, setAdding] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const activeCount = projects.filter((p) => p.status === 'active' || p.status === 'review').length;
  const doneCount = projects.filter((p) => p.status === 'done').length;
  const teamCount = 1 + (team?.length ?? 0);

  const saveMember = () => {
    const n = memberName.trim();
    if (n.length < 2 || addMember.isPending) return;
    addMember.mutate({ name: n, role: memberRole.trim() }, { onSuccess: () => { setMemberName(''); setMemberRole(''); setAdding(false); } });
  };

  const progressOf = (s: ProjectStatus): number => ({ draft: 10, active: 60, review: 85, on_hold: 40, done: 100, cancelled: 0 }[s] ?? 30);
  // خريطة عرض مطابقة لتصميم Atoms: الشارة واللون حسب الحالة + نسبة التقدّم (بلا مساس بتسميات الـ ERP).
  const atomsStatus = (s: ProjectStatus, prog: number): { label: string; badge: string; fill: string } => {
    if (prog >= 100 || s === 'done') return { label: 'مكتمل', badge: 'badge-gray', fill: 'green' };
    if (prog >= 80) return { label: 'شبه مكتمل', badge: 'badge-green', fill: 'green' };
    if (s === 'draft' || s === 'on_hold') return { label: 'قيد الدراسة', badge: 'badge-orange', fill: 'orange' };
    return { label: 'نشط', badge: 'badge-blue', fill: '' };
  };
  // الأحرف الأولى الثنائية (اسم العائلة أولاً) مثل تصميم Atoms: «محمد العمري» → «م.ع».
  // نُجرّد أداة التعريف «ال» من الحرف الأوّل لتطابق أحرف Atoms (العمري → ع، الحربي → ح).
  const firstLetter = (word: string): string => {
    const stripped = word.replace(/^ال/, '');
    return (stripped || word).charAt(0);
  };
  const initials2 = (name: string): string => {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ع';
    if (parts.length === 1) return parts[0].charAt(0);
    return `${firstLetter(parts[0])}.${firstLetter(parts[parts.length - 1])}`;
  };
  // الأحدث أولاً (مطابق لترتيب Atoms)
  const sorted = [...projects].sort((a, b) => new Date(b.start_date ?? 0).getTime() - new Date(a.start_date ?? 0).getTime());
  const shown = sorted.filter((p) => (filter === 'all' ? true : filter === 'active' ? p.status !== 'done' : p.status === 'done'));

  return (
    <>
      <div className="company-hero hero-type-company">
        <div className="company-hero-bg" />
        {/* زر الرجوع داخل الهيرو — مطابق لتصميم Atoms */}
        <a href="#" className="company-hero-back" onClick={(e) => { e.preventDefault(); onBack(); }}>
          <i className="fas fa-arrow-right" /> العودة لصفحتي
        </a>
        <div className="company-hero-layout">
          <div className="company-hero-content">
            {/* اللوجو مع overlay كامرة (قابل للتغيير) — مطابق Atoms */}
            <div className="company-logo" title="لوجو الشركة">
              <i className="fas fa-building-columns" />
              <div className="company-logo-overlay"><i className="fas fa-camera" /></div>
            </div>
            <div className="company-hero-info">
              <h2>{client.company || 'شركتك'}</h2>
              {/* نبذة الشركة (مطابق Atoms) بدل «ممثّلها» */}
              <p>{client.company_about || `ممثّلها: ${client.name}`}</p>
              <div className="company-hero-stats">
                <div className="company-stat"><span className="company-stat-value">{activeCount}</span><span className="company-stat-label">مشاريع نشطة</span></div>
                <div className="company-stat"><span className="company-stat-value">{doneCount}</span><span className="company-stat-label">مشروع مكتمل</span></div>
                <div className="company-stat"><span className="company-stat-value">{teamCount}</span><span className="company-stat-label">موظفين مسجلين</span></div>
              </div>
            </div>
          </div>
          {/* الإعلان الحصري في نصف الهيرو — مطابق لتصميم Atoms (نصف الهيرو) */}
          <div className="company-hero-ad">
            <div className="company-ad-content">
              <span className="company-ad-badge"><i className="fas fa-sparkles" /> عرض حصري</span>
              <h3>خصم 15% على خدمات الإشراف الهندسي</h3>
              <p>لعملاء {client.company || 'مجموعة معمار'} — عرض ساري حتى نهاية الربع</p>
              <button className="btn company-ad-btn" onClick={onRequest}><i className="fas fa-arrow-left" /> استفد الآن</button>
            </div>
          </div>
        </div>
      </div>

      <div className="company-info-grid">
        {/* ترتيب Atoms: المالك → المقر الرئيسي → التواصل → عميل منذ */}
        <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-user-tie" /></div><div className="company-info-detail"><span className="company-info-label">المالك</span><strong>{client.name}</strong></div></div>
        {client.head_office && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-map-marker-alt" /></div><div className="company-info-detail"><span className="company-info-label">المقر الرئيسي</span><strong>{client.head_office}</strong></div></div>}
        {client.phone && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-phone" /></div><div className="company-info-detail"><span className="company-info-label">التواصل</span><strong>{client.phone}</strong></div></div>}
        {client.since && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-calendar" /></div><div className="company-info-detail"><span className="company-info-label">عميل منذ</span><strong>{client.since}</strong></div></div>}
      </div>

      <div className="company-section">
        <div className="company-section-header">
          <h3><i className="fas fa-users" /> أعضاء الفريق المسجلين</h3>
          <div className="company-section-header-actions">
            <span className="badge badge-purple">{teamCount} {teamCount === 1 ? 'عضو' : 'أعضاء'}</span>
            <button className="btn btn-primary btn-sm" onClick={() => setAdding((a) => !a)}><i className="fas fa-user-plus" /> إضافة عضو</button>
          </div>
        </div>

        {adding && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 180, margin: 0 }}><label className="form-label">اسم العضو</label><input className="form-input" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="مثال: محمد العمري" /></div>
              <div className="form-group" style={{ flex: 1, minWidth: 160, margin: 0 }}><label className="form-label">الدور</label><input className="form-input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="مثال: مدير مشاريع" /></div>
              <button className="btn btn-primary" disabled={addMember.isPending || memberName.trim().length < 2} onClick={saveMember}>{addMember.isPending ? 'جارٍ…' : 'إضافة'}</button>
            </div>
          </div>
        )}

        <div className="company-team-grid">
          <div className="company-team-card owner">
            <div className="team-member-avatar owner">
              <div className="team-avatar-placeholder">{initials2(client.name ?? 'ع')}</div>
              <span className="team-role-badge owner"><i className="fas fa-crown" /></span>
              {/* وسم «#1» — صاحب الحساب الأول في الشركة (طلب أيمن، اجتماع 4، مقطع 7) */}
              <span className="team-rank-badge" style={{ position: 'absolute', top: -6, insetInlineStart: -6, background: 'linear-gradient(135deg,#EAB244,#E8A838)', color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: 1, padding: '3px 6px', borderRadius: 8, boxShadow: '0 2px 6px rgba(232,168,56,.45)', border: '1.5px solid #fff' }}>#1</span>
            </div>
            <strong>{client.name}</strong>
            <span className="team-member-code"><i className="fas fa-fingerprint" /> {clientAccountCode(client)}</span>
            <span>مالك الشركة</span>
            <span className="team-projects-count">{projects.length} مشاريع</span>
          </div>
          {team?.map((m) => (
            <div key={m.id} className="company-team-card">
              <div className="team-member-avatar">
                <div className="team-avatar-placeholder">{initials2(m.name)}</div>
              </div>
              <strong>{m.name}</strong>
              {m.member_code && <span className="team-member-code"><i className="fas fa-fingerprint" /> {m.member_code}</span>}
              <span>{m.role}</span>
              <span className="team-projects-count">{m.projects_count ?? 0} مشاريع</span>
              <button className="btn btn-ghost btn-sm btn-danger-ghost" style={{ marginTop: 6 }} onClick={() => { if (window.confirm(`إزالة «${m.name}» من الفريق؟`)) removeMember.mutate(m.id); }}><i className="fas fa-user-minus" /> إزالة</button>
            </div>
          ))}
        </div>
      </div>

      <div className="company-section" id="company-projects" style={{ scrollMarginTop: 84 }}>
        <div className="company-section-header">
          <h3><i className="fas fa-folder-tree" /> جميع مشاريع الشركة</h3>
          <div className="company-section-header-actions">
            <button className="btn btn-primary btn-sm" onClick={onRequest}><i className="fas fa-plus-circle" /> اطلب مشروع جديد</button>
            <div className="company-filter-tabs">
              <button className={`company-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>الكل</button>
              <button className={`company-tab${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>نشطة</button>
              <button className={`company-tab${filter === 'done' ? ' active' : ''}`} onClick={() => setFilter('done')}>مكتملة</button>
            </div>
          </div>
        </div>
        <div className="company-projects-grid">
          {shown.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا مشاريع في هذا التصنيف.</p>}
          {shown.map((p) => {
            // نسبة التقدّم المعروضة: القيمة المخزّنة إن وُجدت (لعرض دقيق يطابق التصميم)، وإلا تُشتق من الحالة.
            const prog = p.progress ?? progressOf(p.status);
            const st = atomsStatus(p.status, prog);

            return (
              <div key={p.id} className={`company-project-card clickable${p.status === 'done' ? ' completed' : ''}`} onClick={() => onProject(p.id)} title="انقر لدخول المشروع">
                <div className="company-project-header">
                  <span className={`badge ${st.badge}`}>{st.label}</span>
                  <span className="company-project-id">{p.code ? `#${p.code}` : `#${p.id}`}</span>
                </div>
                <h4>{p.name}</h4>
                {/* سطر وصف المشروع — مطابق Atoms */}
                {p.description && <p>{p.description}</p>}
                <div className="company-project-progress">
                  <div className="company-progress-bar"><div className={`company-progress-fill ${st.fill}`} style={{ width: `${prog}%` }} /></div>
                  <span>{prog}%</span>
                </div>
                <div className="company-project-footer">
                  {p.manager?.name && <span><i className="fas fa-user" /> {p.manager.name}</span>}
                  <span><i className="fas fa-calendar" /> {p.start_date ? `${monthOf(p.start_date)} ${yearOf(p.start_date)}` : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
