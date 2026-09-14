import { useEffect, useState, type CSSProperties } from 'react';

import { useDeleteTemplate, useSaveTemplate, useStageTemplates } from '../hooks/useProjectStages';
import { STAGE_PHASES, type StageTemplate, type TemplateStageRow } from '../types';

const emptyRow = (): TemplateStageRow => ({ name: '', expected_days: null, phase: null });

/**
 * إدارة قوالب المراحل (طلب أيمن 2026-09-09: «اريد ان اعدل واضيف قوالب ومراحل
 * جديدة كليا … اريد حلا جذريا»).
 *
 * القوالب صارت بيانات في القاعدة لا ثوابت في الشيفرة: المكتب ينشئ قالبًا كاملًا
 * بأسماء مراحله، ويعدّل أيّ قالب، ويحذف ما لا يلزمه. وحذف القالب لا يمسّ مراحل
 * مشروعٍ زُرع منه — القالب وصفةٌ لا رابطة.
 */
export function StageTemplatesManager({ onClose }: { onClose: () => void }) {
  const { data: templates } = useStageTemplates();
  const save = useSaveTemplate();
  const remove = useDeleteTemplate();

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [hint, setHint] = useState('');
  const [rows, setRows] = useState<TemplateStageRow[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);

  // مغادرة التحرير تُغلق النموذج، فلا يبقى معروضًا فوق قالبٍ لم يعد مختارًا
  useEffect(() => { setError(null); }, [editingId]);

  const startNew = () => {
    setEditingId('new');
    setLabel('');
    setHint('');
    setRows([emptyRow()]);
  };

  const startEdit = (t: StageTemplate) => {
    setEditingId(t.id);
    setLabel(t.label);
    setHint(t.hint ?? '');
    setRows(t.stage_rows.length ? t.stage_rows.map((r) => ({ ...r })) : [emptyRow()]);
  };

  const setRow = (i: number, patch: Partial<TemplateStageRow>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const dropRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i));
  const moveRow = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const to = i + dir;
      if (to < 0 || to >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[to]] = [next[to], next[i]];
      return next;
    });

  const submit = () => {
    const clean = rows.map((r) => ({ ...r, name: r.name.trim() })).filter((r) => r.name.length > 0);
    if (!label.trim()) return setError('اسم القالب مطلوب');
    if (clean.length === 0) return setError('القالب بلا مراحل — أضف مرحلةً واحدة على الأقل');

    save.mutate(
      { id: editingId === 'new' ? undefined : (editingId as number), label: label.trim(), hint: hint.trim() || null, stages: clean },
      { onSuccess: () => setEditingId(null), onError: () => setError('تعذّر الحفظ — راجع الحقول') },
    );
  };

  const confirmDelete = (t: StageTemplate) => {
    if (!confirm(`حذف قالب «${t.label}»؟\n\nمراحل المشاريع المزروعة منه لن تُمسّ — يُحذف القالب وحده.`)) return;
    remove.mutate(t.id, { onSuccess: () => { if (editingId === t.id) setEditingId(null); } });
  };

  const totalDays = rows.reduce((sum, r) => sum + (r.expected_days ?? 0), 0);

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <div style={sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={head}>
          <div>
            <b style={{ fontSize: '16px' }}>⚙️ قوالب المراحل</b>
            <div style={{ fontSize: '12px', color: '#8A93A6', marginTop: '3px' }}>
              القوالب مِلك المكتب — أضف وعدّل واحذف. حذف قالبٍ لا يمسّ مراحل مشروع قائم.
            </div>
          </div>
          <button className="btn btn-sm" type="button" onClick={onClose}>إغلاق</button>
        </div>

        <div style={body}>
          {/* قائمة القوالب */}
          <div style={listCol}>
            <button className="btn btn-primary btn-sm" type="button" onClick={startNew} style={{ width: '100%' }}>
              ＋ قالب جديد
            </button>
            <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
              {templates?.map((t) => (
                <div key={t.id} style={{ ...listItem, ...(editingId === t.id ? listItemOn : null) }}>
                  <button type="button" onClick={() => startEdit(t)} style={listBtn}>
                    <b style={{ fontSize: '13px' }}>{t.label}</b>
                    <span style={{ fontSize: '11px', color: '#8A93A6' }}>
                      {t.stages_count} مراحل · {t.total_days} يوم {t.is_system && '· من النظام'}
                    </span>
                  </button>
                  <button type="button" onClick={() => confirmDelete(t)} style={delBtn} title={`حذف «${t.label}»`}>🗑</button>
                </div>
              ))}
              {templates?.length === 0 && <p style={{ fontSize: '12px', color: '#8A93A6' }}>لا قوالب — أنشئ واحدًا.</p>}
            </div>
          </div>

          {/* محرّر القالب */}
          <div style={editCol}>
            {editingId === null ? (
              <p style={{ color: '#8A93A6', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                اختر قالبًا لتعديله، أو أنشئ قالبًا جديدًا.
              </p>
            ) : (
              <>
                <label style={fieldLabel}>اسم القالب
                  <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: مسجد وقفي" autoFocus />
                </label>
                <label style={fieldLabel}>وصف مختصر (اختياري)
                  <input className="input" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="متى يُستعمل هذا القالب؟" />
                </label>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '14px 0 6px' }}>
                  <b style={{ fontSize: '13px' }}>المراحل بترتيبها</b>
                  <span style={{ fontSize: '11.5px', color: '#8A93A6' }}>{rows.length} مرحلة · {totalDays} يوم</span>
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  {rows.map((r, i) => (
                    <div key={i} style={rowBox}>
                      <span style={rowNum}>{i + 1}</span>
                      <input className="input" value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="اسم المرحلة" style={{ flex: 1, minWidth: '120px' }} />
                      <input className="input" type="number" min={0} value={r.expected_days ?? ''} onChange={(e) => setRow(i, { expected_days: e.target.value ? Number(e.target.value) : null })} placeholder="أيام" style={{ width: '80px' }} />
                      <select className="input" value={r.phase ?? ''} onChange={(e) => setRow(i, { phase: e.target.value || null })} style={{ width: '120px' }} title="التصنيف — به تُحسب في بطاقة «مراحل المشاريع»">
                        <option value="">بلا تصنيف</option>
                        {STAGE_PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button type="button" onClick={() => moveRow(i, -1)} disabled={i === 0} style={iconBtn} title="أعلى">▲</button>
                      <button type="button" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} style={iconBtn} title="أسفل">▼</button>
                      <button type="button" onClick={() => dropRow(i)} disabled={rows.length === 1} style={{ ...iconBtn, color: '#DC2626' }} title="حذف المرحلة">✕</button>
                    </div>
                  ))}
                </div>

                <button className="btn btn-sm" type="button" onClick={addRow} style={{ marginTop: '8px' }}>＋ إضافة مرحلة</button>

                {error && <div style={errorBox}>{error}</div>}

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button className="btn btn-primary btn-sm" type="button" onClick={submit} disabled={save.isPending}>
                    {save.isPending ? 'جارٍ الحفظ…' : '💾 حفظ القالب'}
                  </button>
                  <button className="btn btn-sm" type="button" onClick={() => setEditingId(null)}>إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,42,74,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '20px' };
const sheet: CSSProperties = { background: '#fff', borderRadius: '14px', width: 'min(920px, 100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const head: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '16px 18px', borderBottom: '1px solid #EEF2F7' };
const body: CSSProperties = { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', padding: '16px 18px', overflowY: 'auto' };
const listCol: CSSProperties = { borderInlineEnd: '1px solid #EEF2F7', paddingInlineEnd: '14px' };
const editCol: CSSProperties = { minWidth: 0 };
const listItem: CSSProperties = { display: 'flex', alignItems: 'stretch', border: '1px solid #E7ECF3', borderRadius: '9px', overflow: 'hidden' };
const listItemOn: CSSProperties = { borderColor: '#1B6CA8', background: '#F2F8FD' };
const listBtn: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', background: 'none', border: 'none', padding: '8px 10px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start' };
const delBtn: CSSProperties = { background: 'none', border: 'none', borderInlineStart: '1px solid #EEF2F7', padding: '0 9px', cursor: 'pointer', color: '#94A3B8', fontSize: '13px' };
const fieldLabel: CSSProperties = { display: 'block', fontSize: '12.5px', color: '#5A6478', fontWeight: 700, marginBottom: '10px' };
const rowBox: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: '9px', padding: '6px 8px' };
const rowNum: CSSProperties = { width: '20px', height: '20px', borderRadius: '50%', background: '#E4EDF6', color: '#1B6CA8', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const iconBtn: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#8A93A6', fontSize: '12px', padding: '2px 4px' };
const errorBox: CSSProperties = { marginTop: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '8px 10px', fontSize: '12.5px' };
