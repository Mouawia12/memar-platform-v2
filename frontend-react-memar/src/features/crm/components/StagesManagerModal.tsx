import { type CSSProperties, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { toggleStageHidden, useHiddenStages } from '../boardPrefs';
import { useCreateStage, useDeleteStage, useReorderStages, useUpdateStage } from '../hooks/usePipelineStages';
import type { PipelineStage } from '../types';

interface Props {
  stages: PipelineStage[];
  onClose: () => void;
}

const PALETTE = ['#6B7280', '#0891B2', '#274A78', '#D97706', '#059669', '#DC2626', '#7C3AED', '#DB2777', '#0D9488', '#CA8A04'];

/** لوحة تخصيص مراحل الفرص — إعادة تسمية/لون/ترتيب/إضافة/حذف (للأدمن). */
export function StagesManagerModal({ stages, onClose }: Props) {
  const create = useCreateStage();
  const update = useUpdateStage();
  const remove = useDeleteStage();
  const reorder = useReorderStages();

  const hidden = useHiddenStages();

  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[6]);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...stages].sort((a, b) => a.position - b.position);
  const ids = sorted.map((s) => s.id);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next);
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    setError(null);
    create.mutate({ label: newLabel.trim(), color: newColor }, {
      onSuccess: () => setNewLabel(''),
      onError: (e) => setError(apiErrorMessage(e, 'تعذّرت الإضافة')),
    });
  };

  const handleDelete = (s: PipelineStage) => {
    setError(null);
    if (!confirm(`حذف عمود «${s.label}»؟`)) return;
    remove.mutate(s.id, { onError: (e) => setError(apiErrorMessage(e, 'تعذّر الحذف')) });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '17px' }}>⚙️ تخصيص مراحل الفرص</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>
        <p style={{ fontSize: '12px', color: '#8A93A3', margin: '0 0 14px' }}>
          عدّل اسم أي مرحلة أو لونها أو ترتيبها، وأضِف أعمدة جديدة. زر 👁 يُظهر/يُخفي المرحلة من اللوحة.
          «صفقة رابحة» و«خسارة» أساسيتان لا تُحذفان.
        </p>

        {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map((s, i) => (
            <div key={s.id} style={row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button type="button" style={arrow} disabled={i === 0} onClick={() => move(i, -1)}>▴</button>
                <button type="button" style={arrow} disabled={i === sorted.length - 1} onClick={() => move(i, 1)}>▾</button>
              </div>

              <input type="color" value={s.color} title="لون المرحلة" style={colorInput}
                onChange={(e) => update.mutate({ id: s.id, color: e.target.value })} />

              <input className="input" style={{ flex: 1, minWidth: 0 }} defaultValue={s.label}
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s.label) update.mutate({ id: s.id, label: v }); }} />

              {s.is_won && <span style={{ ...badge, color: '#059669', background: '#05966918' }}>رابحة</span>}
              {s.is_lost && <span style={{ ...badge, color: '#DC2626', background: '#DC262618' }}>خسارة</span>}

              <button type="button" onClick={() => toggleStageHidden(s.key)}
                title={hidden[s.key] ? 'مخفية — اضغط للإظهار' : 'ظاهرة — اضغط للإخفاء'}
                style={{ ...eyeBtn, opacity: hidden[s.key] ? 0.4 : 1 }}>{hidden[s.key] ? '🙈' : '👁'}</button>

              <button type="button" onClick={() => handleDelete(s)} disabled={s.is_protected}
                title={s.is_protected ? 'مرحلة أساسية' : 'حذف'} style={{ ...delBtn, opacity: s.is_protected ? 0.3 : 1 }}>🗑</button>
            </div>
          ))}
        </div>

        {/* إضافة عمود جديد */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #EEF2F7', paddingTop: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#5A6478', marginBottom: '8px' }}>➕ إضافة عمود جديد</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={colorInput} />
            <input className="input" style={{ flex: 1, minWidth: '160px' }} placeholder="اسم المرحلة (مثال: بانتظار العقد)"
              value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
            <button className="btn btn-primary" type="button" onClick={handleAdd} disabled={create.isPending || !newLabel.trim()}>إضافة</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button className="btn" type="button" onClick={onClose}>تم</button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 70, padding: '20px' };
const modal: CSSProperties = { padding: '22px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'auto' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: '#F7F9FC', borderRadius: '8px', padding: '6px 8px' };
const arrow: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderRadius: '4px', width: '22px', height: '16px', lineHeight: '12px', fontSize: '10px', cursor: 'pointer', padding: 0, color: '#5A6478' };
const colorInput: CSSProperties = { width: '34px', height: '34px', border: '1px solid #E4E8EF', borderRadius: '6px', padding: '2px', cursor: 'pointer', background: '#fff', flexShrink: 0 };
const badge: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', flexShrink: 0 };
const eyeBtn: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', flexShrink: 0, padding: 0, lineHeight: 1 };
const delBtn: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', flexShrink: 0 };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#8A93A3', padding: 0 };
