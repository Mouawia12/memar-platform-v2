import { type CSSProperties, useEffect, useState } from 'react';

import { useSaveCompanyRating } from '../hooks/useCompanies';

const RATING_LABELS = ['بلا تقييم', 'ضعيف', 'مقبول', 'جيد', 'ممتاز', 'استثنائي'];
const RATING_COLORS = ['#94A3B8', '#DC4A3D', '#E8843C', '#EAB244', '#3FA796', '#2E9E5B'];

/**
 * بطاقة التقييم الداخلي للشركة — تظهر للإدارة/الموظفين فقط (لا يراها العميل في بوابته).
 * نجوم قابلة للنقر بأنيميشن + ملاحظات داخلية، تُحفظ في companies.internal_rating/internal_notes.
 */
export function InternalRatingCard({ companyId, rating, notes }: { companyId: number; rating: number | null; notes: string | null }) {
  const [value, setValue] = useState(rating ?? 0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState(notes ?? '');
  const [saved, setSaved] = useState(false);
  const save = useSaveCompanyRating(companyId);

  useEffect(() => { setValue(rating ?? 0); setNote(notes ?? ''); }, [rating, notes]);

  const shown = hover || value;
  const dirty = value !== (rating ?? 0) || note !== (notes ?? '');

  const submit = () => {
    save.mutate({ internal_rating: value, internal_notes: note.trim() }, {
      onSuccess: () => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); },
    });
  };

  return (
    <div style={card}>
      <style>{keyframes}</style>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={lockIcon}><i className="fas fa-user-shield" /></span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1a2233' }}>التقييم الداخلي للشركة</h3>
            <span style={{ fontSize: 12, color: '#8A93A3' }}>يظهر لفريق معمار فقط — لا يراه العميل</span>
          </div>
        </div>
        <span style={{ ...pill, background: `${RATING_COLORS[shown]}1a`, color: RATING_COLORS[shown] }}>{RATING_LABELS[shown]}</span>
      </div>

      <div style={starsRow} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= shown;

          return (
            <button
              key={n}
              type="button"
              onClick={() => setValue(n === value ? 0 : n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} نجوم`}
              style={{ ...starBtn, animation: on ? 'memarStarPop .28s ease' : undefined }}
            >
              <i className="fas fa-star" style={{ fontSize: 30, color: on ? '#EAB244' : '#E2E8F0', transition: 'color .15s, transform .15s', transform: on ? 'scale(1.05)' : 'scale(1)' }} />
            </button>
          );
        })}
      </div>

      <textarea
        className="input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="ملاحظات داخلية عن الشركة (سرعة الاستجابة، الالتزام المالي، جودة التعاون…)"
        style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', marginTop: 4 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <button type="button" className="btn btn-primary" disabled={!dirty || save.isPending} onClick={submit}>
          {save.isPending ? 'جارٍ الحفظ…' : 'حفظ التقييم'}
        </button>
        {saved && <span style={{ color: '#2E9E5B', fontWeight: 700, fontSize: 13, animation: 'memarFade .3s ease' }}>✓ تم حفظ التقييم</span>}
      </div>
    </div>
  );
}

const keyframes = `
@keyframes memarStarPop { 0% { transform: scale(.6) rotate(-12deg); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes memarFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;

const card: CSSProperties = { background: '#fff', border: '1px solid #eef2f7', borderRadius: 16, padding: 20, boxShadow: '0 6px 20px rgba(39,74,120,.08)', marginTop: -28, marginBottom: 18, position: 'relative', zIndex: 3 };
const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 };
const lockIcon: CSSProperties = { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 };
const pill: CSSProperties = { padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800 };
const starsRow: CSSProperties = { display: 'flex', gap: 6, justifyContent: 'center', padding: '6px 0 12px' };
const starBtn: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 };
