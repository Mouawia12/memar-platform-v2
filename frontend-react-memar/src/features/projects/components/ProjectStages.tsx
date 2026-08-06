import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useActivateStage, useAddStage, useAddStageComment, useAdvanceStage, useRemoveStage, useSeedStages, useStageDetail } from '../hooks/useProjectStages';
import { STAGE_STATUS_LABELS, type ProjectStage, type StageStatus } from '../types';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' }) : '');

// لوحة ألوان المراحل (إعادة تصميم اجتماع 2026-08-05): أخضر=منتهية · أزرق معماري=جارية · رمادي=منتظرة.
const PALETTE: Record<StageStatus, { solid: string; soft: string; ring: string; border: string; label: string }> = {
  done: { solid: '#059669', soft: '#ECFDF5', ring: 'rgba(5,150,105,.20)', border: '#A7F3D0', label: STAGE_STATUS_LABELS.done },
  active: { solid: '#1B6CA8', soft: '#EFF6FF', ring: 'rgba(27,108,168,.22)', border: '#BFDBFE', label: STAGE_STATUS_LABELS.active },
  pending: { solid: '#94A3B8', soft: '#F8FAFC', ring: 'rgba(148,163,184,.18)', border: '#E2E8F0', label: STAGE_STATUS_LABELS.pending },
};
const markerGlyph = (s: StageStatus, order: number) => (s === 'done' ? '✓' : s === 'active' ? '●' : String(order));

/**
 * مراحل المشروع — إعادة تصميم (بند 28، اجتماع 2026-08-05):
 * خط زمني RTL واضح (منتهية يمينًا ← الحالية وسطًا ← قادمة يسارًا) بعُقد مُعنونة،
 * ولوحة تفاصيل مركّزة للمرحلة المختارة مع نقاش المرحلة (شات) بداخلها.
 */
export function ProjectStages({ projectId, stages }: { projectId: number; stages: ProjectStage[] }) {
  const canManage = usePermission('projects.manage');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState('');

  const seed = useSeedStages(projectId);
  const advance = useAdvanceStage(projectId);
  const remove = useRemoveStage(projectId);
  const addStage = useAddStage(projectId);
  const activate = useActivateStage(projectId);

  // ترتيب حسب position لضمان التدفّق الصحيح (الأقدم يمينًا في RTL).
  const ordered = useMemo(() => [...stages].sort((a, b) => a.position - b.position), [stages]);
  const activeStage = ordered.find((s) => s.status === 'active');
  const doneCount = ordered.filter((s) => s.status === 'done').length;
  const overallPct = ordered.length > 0 ? Math.round((doneCount / ordered.length) * 100) : 0;

  // المرحلة المختارة للوحة التفاصيل — تبدأ بالحالية (أو أول مرحلة)، وتتابع تغيّر الحالية.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedId && ordered.some((s) => s.id === selectedId)) return;
    setSelectedId(activeStage?.id ?? ordered[0]?.id ?? null);
  }, [selectedId, ordered, activeStage]);
  const selected = ordered.find((s) => s.id === selectedId) ?? null;

  const submitNewStage = () => {
    const name = newName.trim();
    if (name.length < 2) return;
    // تُدرَج بعد المرحلة المختارة (التي يقف عليها المستخدم)؛ وإن لا تحديد تُلحَق في النهاية.
    addStage.mutate(
      { name, expected_days: newDays ? Number(newDays) : null, after_stage_id: selectedId ?? null },
      { onSuccess: (created) => { setNewName(''); setNewDays(''); setAdding(false); setSelectedId(created.id); } },
    );
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>
      {/* رأس + شريط تقدّم عام */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🧭 مراحل المشروع</h3>
        {ordered.length > 0 && (
          <span style={{ fontSize: '13px', color: '#5A6478', fontWeight: 600 }}>
            <b style={{ color: '#059669' }}>{doneCount}</b> من {ordered.length} منتهية · {overallPct}%
          </span>
        )}
      </div>
      {ordered.length > 0 && (
        <div style={progressTrack}><div style={{ ...progressFill, width: `${overallPct}%` }} /></div>
      )}

      {ordered.length === 0 ? (
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
          {/* دليل الاتجاه: منتهية يمينًا ← الحالية ← قادمة يسارًا */}
          <div style={legend}>
            <span><i style={{ ...legendDot, background: PALETTE.done.solid }} /> منتهية</span>
            <span><i style={{ ...legendDot, background: PALETTE.active.solid }} /> الحالية</span>
            <span><i style={{ ...legendDot, background: '#fff', border: `2px solid ${PALETTE.pending.solid}` }} /> قادمة</span>
            <span style={{ marginInlineStart: 'auto', color: '#B4BCC8', fontSize: '11px' }}>الأقدم يمينًا ← الأحدث يسارًا</span>
          </div>

          {/* الخط الزمني الأفقي (RTL) */}
          <div style={railScroll}>
            <div style={rail}>
              {ordered.map((s, i) => {
                const pal = PALETTE[s.status];
                const isSel = s.id === selectedId;
                // الموصل يسار العقدة (نحو المرحلة الأحدث): أخضر إذا كانت هذه العقدة منتهية.
                const connectorColor = s.status === 'done' ? PALETTE.done.solid : '#E4E8EF';
                return (
                  <div key={s.id} style={node}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {/* موصل يسار (للعقد غير الأخيرة) */}
                      {i < ordered.length - 1 ? <div style={{ ...connector, background: connectorColor }} /> : <div style={{ flex: 1 }} />}
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        title={s.name}
                        style={{
                          ...marker,
                          width: s.status === 'active' ? 52 : 40,
                          height: s.status === 'active' ? 52 : 40,
                          background: s.status === 'pending' ? '#fff' : pal.solid,
                          color: s.status === 'pending' ? pal.solid : '#fff',
                          border: s.status === 'pending' ? `2px solid ${pal.solid}` : '2px solid #fff',
                          boxShadow: isSel ? `0 0 0 4px ${pal.ring}, 0 4px 12px rgba(2,32,71,.12)` : s.status === 'active' ? `0 0 0 5px ${pal.ring}` : '0 1px 3px rgba(2,32,71,.10)',
                          transform: isSel ? 'translateY(-2px)' : 'none',
                          fontSize: s.status === 'active' ? '18px' : '15px',
                        }}
                      >
                        {markerGlyph(s.status, i + 1)}
                      </button>
                      {/* موصل يمين (للعقدة الأولى فقط، لموازنة التوسيط) */}
                      {i === 0 ? <div style={{ flex: 1 }} /> : null}
                    </div>
                    <button type="button" onClick={() => setSelectedId(s.id)} style={{ ...nodeLabel, cursor: 'pointer' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: isSel || s.status === 'active' ? 800 : 600, color: isSel ? pal.solid : '#274A78' }}>{s.name}</span>
                      <span style={{ ...statusChip, color: pal.solid, background: pal.soft, border: `1px solid ${pal.border}` }}>{pal.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* لوحة تفاصيل المرحلة المختارة + نقاشها */}
          {selected && (
            <StagePanel
              projectId={projectId}
              stage={selected}
              index={ordered.findIndex((s) => s.id === selected.id)}
              total={ordered.length}
              nextName={ordered.find((s) => s.status === 'pending' && s.position > selected.position)?.name ?? null}
              canManage={canManage}
              canStart={canManage && !activeStage && selected.status === 'pending'}
              advancing={advance.isPending}
              starting={activate.isPending}
              onAdvance={() => advance.mutate(selected.id)}
              onStart={() => activate.mutate(selected.id)}
              onRemove={() => { if (confirm(`حذف المرحلة "${selected.name}"؟`)) remove.mutate(selected.id, { onSuccess: () => setSelectedId(activeStage?.id ?? null) }); }}
            />
          )}

          {/* إضافة مرحلة — تُدرَج بعد المرحلة المختارة (التي يقف عليها المستخدم) */}
          {canManage && (
            <div style={{ marginTop: '14px' }}>
              {adding ? (
                <div>
                  <div style={{ fontSize: '12px', color: '#5A6478', marginBottom: '8px' }}>
                    {selected ? <>ستُضاف بعد <b style={{ color: '#1B6CA8' }}>«{selected.name}»</b>.</> : <>ستُضاف في نهاية القائمة.</>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input className="input" placeholder="اسم المرحلة" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1, minWidth: '160px' }} autoFocus />
                    <input className="input" placeholder="أيام متوقعة" type="number" min={0} value={newDays} onChange={(e) => setNewDays(e.target.value)} style={{ width: '120px' }} />
                    <button className="btn btn-primary btn-sm" type="button" disabled={addStage.isPending || newName.trim().length < 2} onClick={submitNewStage}>حفظ</button>
                    <button className="btn btn-sm" type="button" onClick={() => { setAdding(false); setNewName(''); setNewDays(''); }}>إلغاء</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-sm" type="button" onClick={() => setAdding(true)}>
                  {selected ? `+ إضافة مرحلة بعد «${selected.name}»` : '+ إضافة مرحلة'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** لوحة تفاصيل المرحلة المختارة: عنوان + حالة + تواريخ + إجراءات + نقاش المرحلة. */
function StagePanel({ projectId, stage, index, total, nextName, canManage, canStart, advancing, starting, onAdvance, onStart, onRemove }: {
  projectId: number;
  stage: ProjectStage;
  index: number;
  total: number;
  nextName: string | null;
  canManage: boolean;
  canStart: boolean;
  advancing: boolean;
  starting: boolean;
  onAdvance: () => void;
  onStart: () => void;
  onRemove: () => void;
}) {
  const pal = PALETTE[stage.status];

  return (
    <div style={{ ...panel, background: pal.soft, borderColor: pal.border }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ ...statusChip, color: pal.solid, background: '#fff', border: `1px solid ${pal.border}`, fontWeight: 800 }}>
              {stage.status === 'active' ? '● ' : stage.status === 'done' ? '✓ ' : ''}{pal.label}
            </span>
            <span style={{ fontSize: '11.5px', color: '#8A93A3' }}>المرحلة {index + 1} من {total}</span>
          </div>
          <h4 style={{ margin: '8px 0 0', fontSize: '17px', fontWeight: 800, color: '#0F2E4D' }}>{stage.name}</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {stage.started_at && <span style={metaChip}>📅 بدأت {fmtDate(stage.started_at)}</span>}
            {stage.completed_at && <span style={metaChip}>🏁 انتهت {fmtDate(stage.completed_at)}</span>}
            {stage.status === 'done' && stage.actual_days != null && <span style={metaChip}>⏱️ استغرقت {stage.actual_days} يوم</span>}
            {stage.status !== 'done' && stage.expected_days != null && <span style={metaChip}>⏳ متوقّعة {stage.expected_days} يوم</span>}
          </div>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {stage.status === 'active' && (
              <button className="btn btn-primary" type="button" disabled={advancing} onClick={onAdvance}>
                {advancing ? '…' : 'إنهاء وتقديم ←'}
              </button>
            )}
            {canStart && (
              <button className="btn btn-primary" type="button" disabled={starting} onClick={onStart}>
                {starting ? '…' : '▶ بدء المرحلة'}
              </button>
            )}
            {stage.status === 'pending' && (
              <button className="btn btn-sm" type="button" onClick={onRemove} style={{ color: '#DC2626' }}>🗑 حذف</button>
            )}
          </div>
        )}
      </div>

      {/* توضيح آلية الانتقال بين المراحل (سؤال أيمن 2026-08-06) */}
      {stage.status === 'active' && canManage && (
        <div style={{ ...advanceHint, background: '#fff', borderColor: pal.border }}>
          <span>⤴ بالضغط على <b>«إنهاء وتقديم»</b>: تُصبح هذه المرحلة <b style={{ color: '#059669' }}>منتهية</b>{nextName ? <> وتبدأ <b style={{ color: '#1B6CA8' }}>«{nextName}»</b> تلقائيًا.</> : <> ويكتمل المشروع (هذه آخر مرحلة).</>}</span>
        </div>
      )}
      {stage.status === 'pending' && (
        <div style={{ ...advanceHint, background: '#fff', borderColor: pal.border, color: canStart ? '#1B6CA8' : '#8A93A3' }}>
          <span>{canStart
            ? <>▶ لا توجد مرحلة جارية حاليًا — اضغط <b>«بدء المرحلة»</b> لتفعيل هذه المرحلة والبدء بها.</>
            : <>⏳ مرحلة قادمة — تبدأ تلقائيًا عند إتمام المرحلة الجارية التي قبلها.</>}</span>
        </div>
      )}

      <div style={{ marginTop: '14px', borderTop: `1px dashed ${pal.border}`, paddingTop: '12px' }}>
        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#274A78', marginBottom: '8px' }}>💬 نقاش المرحلة</div>
        <StageConversation projectId={projectId} stageId={stage.id} />
      </div>
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
    <div>
      {isLoading && <p style={{ fontSize: '12px', color: '#8A93A3', margin: 0 }}>جارٍ التحميل…</p>}
      {stage && (
        <>
          {(stage.comments ?? []).length === 0 ? (
            <p style={{ fontSize: '12px', color: '#8A93A3', margin: '0 0 10px' }}>لا توجد رسائل في هذه المرحلة بعد — ابدأ النقاش.</p>
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
              style={{ flex: 1, background: '#fff' }}
            />
            <button className="btn btn-primary btn-sm" type="button" disabled={addComment.isPending || !text.trim()} onClick={send}>إرسال</button>
          </div>
        </>
      )}
    </div>
  );
}

const progressTrack: CSSProperties = { height: '7px', background: '#EEF2F7', borderRadius: '999px', marginTop: '12px', overflow: 'hidden' };
const progressFill: CSSProperties = { height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#34D399,#059669)', transition: 'width .4s ease' };
const legend: CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '16px', fontSize: '11.5px', color: '#5A6478' };
const legendDot: CSSProperties = { display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', marginInlineEnd: '5px', verticalAlign: 'middle' };
const railScroll: CSSProperties = { overflowX: 'auto', paddingBottom: '4px', marginTop: '10px' };
const rail: CSSProperties = { display: 'flex', alignItems: 'flex-start', minWidth: 'min-content' };
const node: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 128px', minWidth: '128px' };
const marker: CSSProperties = { borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer', flexShrink: 0, padding: 0, transition: 'transform .15s ease, box-shadow .15s ease' };
const connector: CSSProperties = { height: '4px', flex: 1, borderRadius: '2px', marginTop: '0' };
const nodeLabel: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', marginTop: '10px', padding: '0 6px', background: 'none', border: 'none', textAlign: 'center', maxWidth: '128px' };
const statusChip: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '2px 9px', borderRadius: '999px', whiteSpace: 'nowrap' };
const panel: CSSProperties = { marginTop: '18px', padding: '16px 18px', border: '1px solid', borderRadius: '14px' };
const advanceHint: CSSProperties = { marginTop: '12px', padding: '9px 12px', border: '1px solid', borderRadius: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.7 };
const metaChip: CSSProperties = { fontSize: '11.5px', color: '#475569', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '999px', padding: '3px 10px' };
const msgCard: CSSProperties = { background: '#fff', border: '1px solid #EEF2F7', borderRadius: '8px', padding: '8px 10px' };
