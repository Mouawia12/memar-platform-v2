import { type CSSProperties, useEffect, useState } from 'react';

/**
 * تقييم داخلي (نجوم + ملاحظات) خاص بالفريق — لا يراه العميل (اجتماع 2026-08-05).
 * وضعان: مضبوط (onChange داخل نموذج يُحفظ مع الحفظ العام) أو مستقلّ (onSave بزرّ حفظ).
 */
interface Props {
  rating: number;
  notes: string;
  onChange?: (rating: number, notes: string) => void; // داخل نموذج
  onSave?: (rating: number, notes: string) => void;    // حفظ مستقلّ
  busy?: boolean;
  placeholder?: string;
}

export function InternalRating({ rating, notes, onChange, onSave, busy, placeholder }: Props) {
  const controlled = !!onChange;
  const [r, setR] = useState(rating);
  const [n, setN] = useState(notes);
  useEffect(() => { if (!controlled) { setR(rating); setN(notes); } }, [rating, notes, controlled]);

  const curR = controlled ? rating : r;
  const curN = controlled ? notes : n;
  const setRating = (v: number) => (controlled ? onChange!(v, curN) : setR(v));
  const setNotes = (v: string) => (controlled ? onChange!(curR, v) : setN(v));
  const dirty = !controlled && (r !== rating || n !== notes);

  return (
    <div>
      <div style={hint}><i className="fas fa-lock" /> خاص بالفريق — لا يراه العميل</div>
      <div style={starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s === curR ? 0 : s)} style={{ ...star, color: s <= curR ? '#E8A838' : '#D1D5DB' }} title={`${s} نجوم`}>★</button>
        ))}
        {curR > 0 && <span style={{ fontSize: '12.5px', color: '#8A93A3', marginInlineStart: '6px' }}>{curR}/5</span>}
      </div>
      <textarea
        value={curN}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={placeholder ?? 'ملاحظات داخلية (سرعة الاستجابة، ملاحظات حسابية…)'}
        rows={3}
        style={textarea}
      />
      {onSave && dirty && (
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onSave(r, n)} style={{ marginTop: '8px' }}>
          <i className="fas fa-floppy-disk" /> حفظ التقييم الداخلي
        </button>
      )}
    </div>
  );
}

const hint: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '999px', padding: '3px 10px', marginBottom: '8px' };
const starsRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '8px' };
const star: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', lineHeight: 1, padding: '0 2px' };
const textarea: CSSProperties = { width: '100%', border: '1px solid #E4E8EF', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' };
