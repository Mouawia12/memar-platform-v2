import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useAddStage, useAddStageComment, useAdvanceStage, useRemoveStage, useSeedStages, useStageDetail } from '../hooks/useProjectStages';
import { STAGE_STATUS_COLORS, STAGE_STATUS_LABELS, type ProjectStage } from '../types';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' }) : '');

/** مراحل المشروع (PROJ-1/PROJ-2): شريط تقدّم + سلسلة مراحل مع محادثة كل مرحلة وأكشن التقديم الإداري. */
export function ProjectStages({ projectId, stages }: { projectId: number; stages: ProjectStage[] }) {
  const canManage = usePermission('projects.manage');
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState('');

  const seed = useSeedStages(projectId);
  const advance = useAdvanceStage(projectId);
  const remove = useRemoveStage(projectId);
  const addStage = useAddStage(projectId);

  const activeStage = stages.find((s) => s.status === 'active');
  const doneCount = stages.filter((s) => s.status === 'done').length;
  const overallPct = stages.length > 0 ? Math.round((doneCount / stages.length) * 100) : 0;

  const submitNewStage = () => {
    const name = newName.trim();
    if (name.length < 2) return;
    addStage.mutate(
      { name, expected_days: newDays ? Number(newDays) : null },
      { onSuccess: () => { setNewName(''); setNewDays(''); setAdding(false); } },
    );
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🧭 مراحل المشروع</h3>
        {stages.length > 0 && <span style={{ fontSize: '13px', color: '#5A6478' }}>{doneCount} من {stages.length} منتهية · {overallPct}%</span>}
      </div>

      {stages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '26px 10px' }}>
          <p style={{ color: '#5A6478', fontSize: '13.5px', marginBottom: '14px' }}>لا توجد مراحل لهذا المشروع بعد.</p>
          {canManage && (
            <button className="btn btn-primary" type="button" disabled={seed.isPending} onClick={() => seed.mutate()}>
              {seed.isPending ? 'جارٍ الإنشاء…' : '✨ توليد المراحل الافتراضية'}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* شريط دوائر المراحل — طبق الأصل */}
          <div style={dotsBar}>
            {stages.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i === stages.length - 1 ? '0 0 auto' : 1 }}>
                <div title={s.name} style={{ ...dot, background: STAGE_STATUS_COLORS[s.status], boxShadow: s.status === 'active' ? `0 0 0 4px ${STAGE_STATUS_COLORS.active}33` : 'none' }} />
                {i < stages.length - 1 && <div style={{ ...connector, background: s.status === 'done' ? STAGE_STATUS_COLORS.done : '#E4E8EF' }} />}
              </div>
            ))}
          </div>

          {/* المرحلة الحالية بارزة */}
          {activeStage && (
            <div style={activeBanner}>
              <div>
                <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 800 }}>● المرحلة الحالية</div>
                <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '2px' }}>{activeStage.name}</div>
                {activeStage.started_at && <div style={{ fontSize: '11.5px', color: '#5A6478', marginTop: '2px' }}>بدأت: {fmtDate(activeStage.started_at)}{activeStage.expected_days ? ` · المدة المتوقعة ${activeStage.expected_days} يوم` : ''}</div>}
              </div>
              {canManage && (
                <button className="btn btn-primary" type="button" disabled={advance.isPending} onClick={() => advance.mutate(activeStage.id)}>
                  {advance.isPending ? '…' : 'إنهاء وتقديم ←'}
                </button>
              )}
            </div>
          )}

          {/* سلسلة المراحل */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stages.map((s) => (
              <StageRow
                key={s.id}
                projectId={projectId}
                stage={s}
                open={openId === s.id}
                canManage={canManage}
                onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                onRemove={() => { if (confirm(`حذف المرحلة "${s.name}"؟`)) remove.mutate(s.id); }}
              />
            ))}
          </div>

          {/* إضافة مرحلة */}
          {canManage && (
            <div style={{ marginTop: '12px' }}>
              {adding ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input className="input" placeholder="اسم المرحلة" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1, minWidth: '160px' }} autoFocus />
                  <input className="input" placeholder="أيام متوقعة" type="number" min={0} value={newDays} onChange={(e) => setNewDays(e.target.value)} style={{ width: '120px' }} />
                  <button className="btn btn-primary btn-sm" type="button" disabled={addStage.isPending || newName.trim().length < 2} onClick={submitNewStage}>حفظ</button>
                  <button className="btn btn-sm" type="button" onClick={() => { setAdding(false); setNewName(''); setNewDays(''); }}>إلغاء</button>
                </div>
              ) : (
                <button className="btn btn-sm" type="button" onClick={() => setAdding(true)}>+ إضافة مرحلة</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** صف مرحلة واحدة: يُطوى منتهيًا، ويُبرز جاريًا، ويفتح على المحادثة عند النقر. */
function StageRow({ projectId, stage, open, canManage, onToggle, onRemove }: {
  projectId: number;
  stage: ProjectStage;
  open: boolean;
  canManage: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const color = STAGE_STATUS_COLORS[stage.status];
  const icon = stage.status === 'done' ? '✓' : stage.status === 'active' ? '●' : '○';

  return (
    <div style={{ border: `1px solid ${stage.status === 'active' ? '#FCA5A5' : '#EEF2F7'}`, borderRadius: '10px', overflow: 'hidden', background: stage.status === 'active' ? '#FEF6F6' : '#fff' }}>
      <div style={rowHead} onClick={onToggle}>
        <span style={{ ...rowIcon, background: color }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{stage.name}</div>
          <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px' }}>
            {STAGE_STATUS_LABELS[stage.status]}
            {stage.status === 'done' && stage.actual_days != null && ` · استغرقت ${stage.actual_days} يوم`}
            {stage.status !== 'done' && stage.expected_days != null && ` · متوقّعة ${stage.expected_days} يوم`}
            {typeof stage.comments_count === 'number' && stage.comments_count > 0 && ` · 💬 ${stage.comments_count}`}
          </div>
        </div>
        {canManage && stage.status === 'pending' && (
          <button className="btn btn-sm" type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ color: '#DC2626', fontSize: '11px', padding: '2px 7px' }}>🗑</button>
        )}
        <span style={{ color: '#B4BCC8', fontSize: '12px' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && <StageConversation projectId={projectId} stageId={stage.id} />}
    </div>
  );
}

/** سجل محادثة المرحلة + إدخال رسالة جديدة. */
function StageConversation({ projectId, stageId }: { projectId: number; stageId: number }) {
  const { data: stage, isLoading } = useStageDetail(projectId, stageId);
  const addComment = useAddStageComment(projectId);
  const [text, setText] = useState('');

  const send = () => {
    const body = text.trim();
    if (!body) return;
    addComment.mutate({ stageId, body }, { onSuccess: () => setText('') });
  };

  return (
    <div style={{ borderTop: '1px solid #EEF2F7', padding: '12px 14px', background: '#FAFBFC' }}>
      {isLoading && <p style={{ fontSize: '12px', color: '#8A93A3', margin: 0 }}>جارٍ التحميل…</p>}
      {stage && (
        <>
          {(stage.comments ?? []).length === 0 ? (
            <p style={{ fontSize: '12px', color: '#8A93A3', margin: '0 0 10px' }}>لا توجد رسائل في هذه المرحلة بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {stage.comments!.map((c) => (
                <div key={c.id} style={msgCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <b style={{ fontSize: '12px', color: '#274A78' }}>{c.user?.name ?? 'النظام'}</b>
                    <span style={{ fontSize: '10.5px', color: '#A0A8B4' }}>{fmtTime(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', marginTop: '3px', whiteSpace: 'pre-wrap' }}>{c.body}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              placeholder="اكتب رسالة في هذه المرحلة…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-sm" type="button" disabled={addComment.isPending || !text.trim()} onClick={send}>إرسال</button>
          </div>
        </>
      )}
    </div>
  );
}

const dotsBar: CSSProperties = { display: 'flex', alignItems: 'center', marginTop: '18px', padding: '0 4px' };
const dot: CSSProperties = { width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0 };
const connector: CSSProperties = { height: '3px', flex: 1, margin: '0 4px', borderRadius: '2px' };
const activeBanner: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '16px', padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px' };
const rowHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer' };
const rowIcon: CSSProperties = { width: '22px', height: '22px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 };
const msgCard: CSSProperties = { background: '#fff', border: '1px solid #EEF2F7', borderRadius: '8px', padding: '8px 10px' };
