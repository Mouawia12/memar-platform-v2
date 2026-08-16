import { useRef, useState, type CSSProperties } from 'react';

import { useAuthStore } from '../../../store/auth';
import { AppointmentFormModal } from '../../appointments/components/AppointmentFormModal';
import { MeetingRoom } from '../../appointments/components/MeetingRoom';
import { ProjectNameInline } from '../../projects/components/ProjectNameInline';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { tasksApi } from '../api/tasksApi';
import { useAddComment, useRateTask, useSyncParticipants, useTaskDetail, useUploadTaskFile } from '../hooks/useTasks';
import { PRIORITY_COLORS, PRIORITY_LABELS, dueLabel, isDone, type Task } from '../types';

interface Props {
  task: Task; // البطاقة المختصرة — نجلب التفاصيل الكاملة بالـid
  canManage: boolean; // إظهار زر التعديل (tasks.manage)
  canDelete: boolean;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
  onSetNotExecuted: (t: Task) => void;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const kb = (n: number) => (n < 1024 ? `${n}B` : n < 1_048_576 ? `${Math.round(n / 1024)}KB` : `${(n / 1_048_576).toFixed(1)}MB`);

/** صفحة تفاصيل المهمة (TASK-4): محادثة، مشاركون، ملفات، مكالمة فيديو، حجز موعد، تقييم. */
export function TaskDetailModal({ task, canManage, canDelete, onClose, onEdit, onToggle, onDelete, onSetNotExecuted }: Props) {
  const userName = useAuthStore((s) => s.user?.name);
  const { data: detail, isLoading } = useTaskDetail(task.id);
  const { data: users } = useAssignableUsers();

  const addComment = useAddComment(task.id);
  const syncParts = useSyncParticipants(task.id);
  const uploadFile = useUploadTaskFile(task.id);
  const rate = useRateTask(task.id);

  const [comment, setComment] = useState('');
  const [confirmDone, setConfirmDone] = useState(false); // تأكيد الإكمال (طلب أيمن 2026-08-05)
  const [inCall, setInCall] = useState(false);
  const [booking, setBooking] = useState(false);
  const [pickParts, setPickParts] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const done = isDone(task);
  const pr = PRIORITY_COLORS[task.priority];

  const submitComment = () => {
    const body = comment.trim();
    if (!body) return;
    addComment.mutate(body, { onSuccess: () => setComment('') });
  };

  const startCall = async () => {
    await tasksApi.ensureVideo(task.id); // يضمن وجود الغرفة
    setInCall(true);
  };

  const room = detail?.video_room ?? `memar-task-${task.id}`;
  const partIds = new Set((detail?.participants ?? []).map((p) => p.id));

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        {/* رأس */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>{task.title}</h2>
            <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '3px' }}>
              {detail?.creator && <>أنشأها {detail.creator.name} · </>}
              {detail?.project && (
                <ProjectNameInline projectId={detail.project.id} name={detail.project.name} code={detail.project.code} prefix="🏗️" />
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        {/* الحقول الأساسية */}
        <div style={fieldGrid}>
          <Field label="📅 الموعد"><b>{task.due_date?.slice(0, 10) ?? '—'}</b> <span style={{ fontSize: '12px', color: '#8A93A3' }}>({dueLabel(task)})</span></Field>
          <Field label="⚡ الأولوية"><span style={{ ...tag, background: `${pr}1a`, color: pr }}>{PRIORITY_LABELS[task.priority]}</span></Field>
          <Field label="📝 المسؤول"><b>{task.assignee?.name ?? 'غير مُسند'}</b></Field>
          <Field label="✅ الحالة"><span style={{ ...tag, background: done ? '#05966915' : '#D9770615', color: done ? '#059669' : '#D97706' }}>{done ? 'مكتملة ✓' : 'قيد التنفيذ'}</span></Field>
        </div>
        {task.description && <p style={{ fontSize: '13.5px', color: '#5A6478', marginTop: '10px' }}>{task.description}</p>}

        {/* أزرار سريعة */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px', alignItems: 'center' }}>
          {/* الإكمال خطوة مهمة → تأكيد «هل أنت متأكد؟» قبل التنفيذ (إعادة الفتح فورية) */}
          {done ? (
            <button className="btn btn-primary btn-sm" type="button" onClick={() => onToggle(task)}>↩ إعادة فتح</button>
          ) : confirmDone ? (
            <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '4px 8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#B45309' }}>هل أنت متأكد من الإكمال؟</span>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => { onToggle(task); setConfirmDone(false); }}>نعم، أكمل</button>
              <button className="btn btn-sm" type="button" onClick={() => setConfirmDone(false)}>تراجع</button>
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setConfirmDone(true)}>✅ إكمال</button>
          )}
          <button className="btn btn-sm" type="button" onClick={() => void startCall()} style={{ background: '#059669', color: '#fff' }}>📹 مكالمة فيديو</button>
          <button className="btn btn-sm" type="button" onClick={() => setBooking(true)}>📅 حجز موعد</button>
          {canManage && <button className="btn btn-sm" type="button" onClick={() => onEdit(task)}>✏️ تعديل</button>}
          {task.status !== 'cancelled' && task.status !== 'done' && (
            <button className="btn btn-sm" type="button" style={{ color: '#B45309' }} onClick={() => { onSetNotExecuted(task); }}>⊘ لم تُنفَّذ</button>
          )}
          <span style={{ flex: 1 }} />
          {canDelete && <button className="btn btn-sm" type="button" style={{ color: '#DC2626' }} onClick={() => { onDelete(task); onClose(); }}>🗑 حذف</button>}
        </div>

        {/* تقييم إداري */}
        <div style={section}>
          <div style={secTitle}>⭐ تقييم الإدارة</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['positive', 'negative'] as const).map((r) => (
              <button
                key={r} type="button"
                onClick={() => rate.mutate(detail?.rating === r ? null : r)}
                style={{ ...rateBtn, ...(detail?.rating === r ? (r === 'positive' ? rateOn : rateBad) : null) }}
              >
                {r === 'positive' ? '👍 إيجابي' : '👎 سلبي'}
              </button>
            ))}
          </div>
        </div>

        {/* المشاركون */}
        <div style={section}>
          <div style={{ ...secTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>👥 المشاركون ({detail?.participants.length ?? 0})</span>
            <button className="btn btn-sm" type="button" onClick={() => setPickParts((v) => !v)}>{pickParts ? 'إغلاق' : '+ إضافة'}</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(detail?.participants ?? []).map((p) => <span key={p.id} style={chip}>{p.name}</span>)}
            {(detail?.participants.length ?? 0) === 0 && <span style={{ fontSize: '12px', color: '#8A93A3' }}>لا مشاركين بعد.</span>}
          </div>
          {pickParts && (
            <div style={{ marginTop: '8px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #E4E8EF', borderRadius: '8px', padding: '6px' }}>
              {users?.data.map((u) => (
                <label key={u.id} style={pickRow}>
                  <input
                    type="checkbox"
                    checked={partIds.has(u.id)}
                    onChange={(e) => {
                      const next = new Set(partIds);
                      if (e.target.checked) next.add(u.id); else next.delete(u.id);
                      syncParts.mutate([...next]);
                    }}
                  />
                  {u.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* الملفات */}
        <div style={section}>
          <div style={{ ...secTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🗂️ الملفات ({detail?.files.length ?? 0})</span>
            <button className="btn btn-sm" type="button" disabled={uploadFile.isPending} onClick={() => fileInput.current?.click()}>
              {uploadFile.isPending ? 'جارٍ الرفع…' : '📎 رفع ملف'}
            </button>
            <input ref={fileInput} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile.mutate(f); e.target.value = ''; }} />
          </div>
          {(detail?.files ?? []).map((f) => (
            <div key={f.id} style={fileRow}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.original_name} <span style={{ color: '#8A93A3', fontSize: '11px' }}>({kb(f.size)})</span></span>
              <button className="btn btn-sm" type="button" onClick={() => void tasksApi.downloadFile(task.id, f.id, f.original_name)}>تنزيل</button>
            </div>
          ))}
          {(detail?.files.length ?? 0) === 0 && <span style={{ fontSize: '12px', color: '#8A93A3' }}>لا ملفات مرفقة.</span>}
        </div>

        {/* المحادثة / التايم‌لاين */}
        <div style={section}>
          <div style={secTitle}>💬 المحادثة</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '10px' }}>
            {isLoading && <span style={{ fontSize: '12px', color: '#8A93A3' }}>جارٍ التحميل…</span>}
            {(detail?.comments ?? []).map((c) => (
              <div key={c.id} style={bubble}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#274A78' }}>{c.user?.name ?? 'مستخدم'}</div>
                <div style={{ fontSize: '13.5px' }}>{c.body}</div>
                <div style={{ fontSize: '10.5px', color: '#8A93A3', marginTop: '2px' }}>{fmt(c.created_at)}</div>
              </div>
            ))}
            {(detail?.comments.length ?? 0) === 0 && !isLoading && <span style={{ fontSize: '12px', color: '#8A93A3' }}>ابدأ المحادثة…</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input" style={{ flex: 1 }} placeholder="اكتب رسالة…" value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
            />
            <button className="btn btn-primary" type="button" disabled={addComment.isPending || !comment.trim()} onClick={submitComment}>إرسال</button>
          </div>
        </div>

        {/* سجل التعديلات (طلب أيمن 2026-08-05): من غيّر ماذا ومتى */}
        {(detail?.activities?.length ?? 0) > 0 && (
          <div style={section}>
            <div style={secTitle}>🕓 سجل التعديلات</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {detail!.activities.map((a) => (
                <div key={a.id} style={logRow}>
                  <span style={logDot} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px' }}>
                      <b>{a.causer ?? 'النظام'}</b> — {a.event_label}
                      {a.fields.length > 0 && <span style={{ color: '#8A93A3' }}> ({a.fields.join('، ')})</span>}
                    </span>
                    <div style={{ fontSize: '10.5px', color: '#8A93A3' }}>{fmt(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {inCall && <MeetingRoom room={room} title={`مكالمة: ${task.title}`} displayName={userName} onClose={() => setInCall(false)} />}
      {booking && <AppointmentFormModal appointment={null} onClose={() => setBooking(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#8A93A3', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>{children}</div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 60, padding: '20px' };
const modal: CSSProperties = { padding: '22px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflow: 'auto' };
const fieldGrid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#F7F9FC', borderRadius: '10px', padding: '14px' };
const tag: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 };
const section: CSSProperties = { marginTop: '18px', borderTop: '1px solid #EEF2F7', paddingTop: '14px' };
const secTitle: CSSProperties = { fontSize: '14px', fontWeight: 800, marginBottom: '10px' };
const chip: CSSProperties = { background: '#274A7810', color: '#274A78', border: '1px solid #274A7822', borderRadius: '999px', padding: '3px 12px', fontSize: '12.5px' };
const pickRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 6px', fontSize: '13px', cursor: 'pointer' };
const fileRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid #F3F5F8' };
const bubble: CSSProperties = { background: '#F7F9FC', borderRadius: '10px', padding: '8px 12px' };
const logRow: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 2px', borderRight: '2px solid #EEF2F7', paddingRight: '10px', marginRight: '4px' };
const logDot: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', background: '#1B6CA8', marginTop: '5px', flexShrink: 0, marginRight: '-15px' };
const rateBtn: CSSProperties = { padding: '6px 16px', borderRadius: '8px', border: '1px solid #E4E8EF', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' };
const rateOn: CSSProperties = { background: '#05966915', borderColor: '#059669', color: '#059669', fontWeight: 700 };
const rateBad: CSSProperties = { background: '#DC262615', borderColor: '#DC2626', color: '#DC2626', fontWeight: 700 };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#8A93A3', padding: 0 };
