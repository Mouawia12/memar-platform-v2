import { useEffect, useRef, useState } from 'react';

import '../../clientPortal/clientPortalV2.css';

/**
 * لوحة المنتدى المشتركة — تصميم واحد «طبق الأصل» يُستخدم في بوابة العميل ولوحة الموظف معًا،
 * على نفس الجدول المشترك (forum_topics). ردود الإدارة (from_staff) مميّزة بوسم «فريق معمار».
 * الكلاسات مقيّدة بـ .mcp-root لذا يلفّ المستدعي المحتوى بها (أو يمرّر wrap).
 */
export interface BoardAttachment {
  name: string;
  kind: 'pdf' | 'video' | 'image' | 'file';
}

export interface BoardReply {
  id: number;
  from_staff: boolean;
  author: string | null;
  body: string;
  attachments?: BoardAttachment[];
  at: string | null;
}

export interface BoardThread {
  id: number;
  title: string;
  body: string | null;
  author: string | null;
  is_mine?: boolean;
  status: 'open' | 'answered';
  status_label: string;
  created_at: string | null;
  replies: BoardReply[];
}

const ATTACH_ICON: Record<string, string> = { pdf: 'fa-file-pdf', video: 'fa-video', image: 'fa-image', file: 'fa-paperclip' };

const relTime = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const day = 86400000;
  if (diff < 0) return new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
  if (diff < 3600000) { const m = Math.max(1, Math.floor(diff / 60000)); return `منذ ${m} دقيقة`; }
  if (diff < day) { const h = Math.floor(diff / 3600000); return `منذ ${h} ساعة`; }
  if (diff < day * 7) { const dd = Math.floor(diff / day); return dd === 1 ? 'منذ يوم' : dd === 2 ? 'منذ يومين' : `منذ ${dd} أيام`; }
  return new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
};

const initialOf = (name: string | null) => (name ?? 'ع').trim().charAt(0) || 'ع';

export function ForumBoard({
  threads,
  isLoading,
  onPost,
  posting,
  sent,
  subtitle = 'اطرح أسئلتك واطّلع على إجابات وخبرات فريق مجموعة معمار',
  onReply,
  replying = false,
}: {
  threads: BoardThread[] | undefined;
  isLoading: boolean;
  onPost: (title: string, body: string) => void;
  posting: boolean;
  sent: boolean;
  subtitle?: string;
  /** عند تمريرها يظهر صندوق ردّ أسفل كل موضوع (للطاقم للإجابة) — الردود تُوسم كـ«الإدارة». */
  onReply?: (threadId: number, body: string) => void;
  replying?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  // تُفرَّغ الحقول بعد نشر ناجح (طبق سلوك بوابة العميل).
  useEffect(() => {
    if (sent) { setTitle(''); setBody(''); }
  }, [sent]);

  const submit = () => {
    const t = title.trim();
    if (t.length < 2 || posting) return;
    onPost(t, body.trim());
  };
  const focusForm = () => { titleRef.current?.focus(); titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const totalThreads = threads?.length ?? 0;
  const answeredThreads = threads?.filter((t) => t.status === 'answered').length ?? 0;

  return (
    <>
      {/* هيرو المنتدى — منتدى معمار بالإحصاءات + زر طرح سؤال جديد */}
      <div className="company-hero hero-type-individual">
        <div className="company-hero-bg" />
        <div className="company-hero-layout">
          <div className="company-hero-content">
            <div className="company-logo"><i className="fas fa-users-rectangle" /></div>
            <div className="company-hero-info">
              <h2>منتدى معمار</h2>
              <p>{subtitle}</p>
              <div className="company-hero-stats">
                <div className="company-stat"><span className="company-stat-value">{totalThreads}</span><span className="company-stat-label">سؤال</span></div>
                <div className="company-stat"><span className="company-stat-value">{answeredThreads}</span><span className="company-stat-label">مُجاب عنه</span></div>
              </div>
            </div>
          </div>
          <div className="company-hero-ad">
            <div className="company-ad-content">
              <span className="company-ad-badge"><i className="fas fa-circle-question" /> لديك سؤال؟</span>
              <h3>اطرح سؤالك على فريق معمار</h3>
              <p>سيجيبك مهندسو المشروع بالتفصيل مع المرفقات اللازمة.</p>
              <button className="btn company-ad-btn" type="button" onClick={focusForm}><i className="fas fa-plus" /> طرح سؤال جديد</button>
            </div>
          </div>
        </div>
      </div>

      <div className="forum-threads">
        {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
        {threads && threads.length === 0 && (
          <div className="forum-thread" style={{ textAlign: 'center' }}>
            <div style={{ padding: 24, color: '#64748B' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>💬</div>
              <p>لا أسئلة بعد — اطرح سؤالك أدناه وسيجيبك فريق معمار.</p>
            </div>
          </div>
        )}
        {threads?.map((th) => (
          <div key={th.id} className="forum-thread">
            <div className="forum-thread-header">
              <div className="forum-thread-avatar">{initialOf(th.author)}</div>
              <div className="forum-thread-meta">
                <strong>{th.author ?? 'عضو'}{th.is_mine ? ' · سؤالي' : ''}</strong>
                <span className="forum-thread-date">{relTime(th.created_at)}</span>
              </div>
              <span className={`forum-thread-tag ${th.status === 'answered' ? 'tag-answered' : 'tag-question'}`}>{th.status_label}</span>
            </div>
            <h4 className="forum-thread-title">{th.title}</h4>
            {th.body && th.body !== th.title && <p className="forum-thread-body">{th.body}</p>}
            <div className="forum-thread-footer">
              <span className="forum-replies-count"><i className="fas fa-comments" /> {th.replies.length} {th.replies.length === 1 ? 'رد' : 'ردود'}</span>
              {(() => { const n = th.replies.reduce((s, r) => s + (r.attachments?.length ?? 0), 0); return n > 0 ? <span className="forum-attachments"><i className="fas fa-paperclip" /> {n} {n === 1 ? 'مرفق' : 'مرفقات'}</span> : null; })()}
            </div>
            {th.replies.length > 0 && (
              <div className="forum-replies">
                {th.replies.map((r) => (
                  <div key={r.id} className="forum-reply">
                    <div className="forum-reply-header">
                      <div className={`forum-reply-avatar${r.from_staff ? ' staff' : ''}`}>{initialOf(r.author)}</div>
                      <div className="forum-reply-meta">
                        <strong>{r.author ?? (r.from_staff ? 'فريق معمار' : 'عضو')}</strong>
                        {r.from_staff && <span className="forum-staff-badge"><i className="fas fa-shield-halved" /> فريق معمار · الإدارة</span>}
                        <span className="forum-reply-date">{relTime(r.at)}</span>
                      </div>
                    </div>
                    <p className="forum-reply-body">{r.body}</p>
                    {r.attachments && r.attachments.length > 0 && (
                      <div className="forum-reply-attachments">
                        {r.attachments.map((a, i) => (
                          <span key={i} className={`forum-attachment-item${a.kind === 'video' ? ' video' : ''}`}>
                            <i className={`fas ${ATTACH_ICON[a.kind] ?? 'fa-paperclip'}`} /> {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {onReply && <ThreadReplyBox threadId={th.id} onReply={onReply} pending={replying} />}
          </div>
        ))}
      </div>

      <div className="forum-new-reply-box">
        <div className="forum-reply-input-header"><span><i className="fas fa-pen" /> اطرح سؤالاً جديدًا</span></div>
        <input ref={titleRef} className="form-input" style={{ marginBottom: 10 }} placeholder="عنوان السؤال…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="forum-reply-textarea" placeholder="تفاصيل السؤال (اختياري)…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="forum-reply-input-actions">
          <div />
          <button className="btn btn-primary" onClick={submit} disabled={posting || title.trim().length < 2}><i className="fas fa-paper-plane" /> نشر السؤال</button>
        </div>
      </div>
      {sent && <p style={{ color: 'var(--success)', fontWeight: 700, marginTop: 10 }}>✓ نُشر سؤالك — سيجيبك الفريق قريباً.</p>}
    </>
  );
}

/** صندوق ردّ مضمّن أسفل الموضوع — يظهر فقط عند تمرير onReply (للطاقم للإجابة). */
function ThreadReplyBox({ threadId, onReply, pending }: { threadId: number; onReply: (threadId: number, body: string) => void; pending: boolean }) {
  const [text, setText] = useState('');
  const send = () => {
    const t = text.trim();
    if (t.length < 1 || pending) return;
    onReply(threadId, t);
    setText('');
  };

  return (
    <div className="forum-thread-reply-inline" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      <input
        className="form-input"
        style={{ flex: 1 }}
        placeholder="اكتب ردّ الإدارة…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
      />
      <button className="btn btn-primary" type="button" onClick={send} disabled={pending || text.trim().length < 1}><i className="fas fa-paper-plane" /> رد</button>
    </div>
  );
}
