import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useSaveAssessment } from '../hooks/useProjectAssessment';
import type { Project } from '../types';

/** لوحة تقييم المشروع (PROJ-4): للطاقم المخوّل فقط — تقييمات + VIP + ملاحظات سرية. */
export function ProjectAssessmentPanel({ project }: { project: Project }) {
  const canManage = usePermission('projects.manage');
  const save = useSaveAssessment(project.id);

  const a = project.assessment;
  const [profit, setProfit] = useState(a?.rating_profitability ?? 0);
  const [ease, setEase] = useState(a?.rating_ease ?? 0);
  const [revisions, setRevisions] = useState(a?.rating_revisions ?? 0);
  const [commitment, setCommitment] = useState(a?.client_rating_commitment ?? 0);
  const [cooperation, setCooperation] = useState(a?.client_rating_cooperation ?? 0);
  const [isVip, setIsVip] = useState(project.is_vip);
  const [notes, setNotes] = useState(project.internal_notes ?? '');
  const [saved, setSaved] = useState(false);

  // تظهر فقط لمن يملك صلاحية الإدارة (الحقول أصلًا غير موجودة لغيرهم).
  if (!canManage) return null;

  const submit = () => {
    save.mutate(
      {
        rating_profitability: profit || null,
        rating_ease: ease || null,
        rating_revisions: revisions || null,
        client_rating_commitment: commitment || null,
        client_rating_cooperation: cooperation || null,
        is_vip: isVip,
        internal_notes: notes.trim() || null,
      },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
    );
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '18px', border: '1px solid #E6D9B8', background: '#FFFDF6' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🔒 التقييم الإداري <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 600 }}>(للطاقم فقط)</span></h3>
        <button
          type="button"
          onClick={() => setIsVip((v) => !v)}
          style={{ ...vipBtn, ...(isVip ? vipOn : vipOff) }}
        >
          {isVip ? '⭐ عميل مميّز VIP' : '☆ تعيين كـ VIP'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '16px' }}>
        <div>
          <div style={groupTitle}>تقييم المشروع</div>
          <StarRow label="الربحية" value={profit} onChange={setProfit} />
          <StarRow label="سهولة التنفيذ" value={ease} onChange={setEase} />
          <StarRow label="قلّة التعديلات" value={revisions} onChange={setRevisions} />
        </div>
        <div>
          <div style={groupTitle}>تقييم العميل</div>
          <StarRow label="الالتزام" value={commitment} onChange={setCommitment} />
          <StarRow label="التعاون" value={cooperation} onChange={setCooperation} />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={groupTitle}>ملاحظات داخلية سرّية 🤫</div>
        <textarea
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="ملاحظات لا تظهر للعميل إطلاقًا…"
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
        <button className="btn btn-primary" type="button" disabled={save.isPending} onClick={submit}>
          {save.isPending ? 'جارٍ الحفظ…' : 'حفظ التقييم'}
        </button>
        {saved && <span style={{ color: '#059669', fontSize: '13px', fontWeight: 700 }}>✓ حُفظ</span>}
      </div>
    </div>
  );
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', color: '#5A6478' }}>{label}</span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            style={{ ...star, color: n <= value ? '#F59E0B' : '#D5DAE1' }}
            aria-label={`${label} ${n}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

const groupTitle: CSSProperties = { fontSize: '13px', fontWeight: 800, color: '#274A78', marginBottom: '10px' };
const star: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '19px', lineHeight: 1, padding: '0 1px' };
const vipBtn: CSSProperties = { border: 'none', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700 };
const vipOn: CSSProperties = { background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', boxShadow: '0 2px 6px rgba(217,119,6,.35)' };
const vipOff: CSSProperties = { background: '#F1F3F7', color: '#8A93A3' };
