import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../../store/auth';
import { useProjects } from '../../projects/hooks/useProjects';
import { myProjectsApi } from '../api/myProjectsApi';

/**
 * «تابِع مشروعًا» — يضيف صاحب الصلاحية نفسه إلى فريق مشروع ليتابعه من «مشاريعي».
 * بديلٌ عن عرض كل المشاريع في الصفحة: سجل المشاريع موضع ذلك (طلب أيمن 2026-09-16).
 */
export function FollowProjectModal({ followedIds, onClose }: {
  /** ما هو ضمن مشاريعي أصلًا — يُعرض معطَّلًا لا مخفيًّا كي لا يُبحث عنه مرّتين. */
  followedIds: number[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const meId = useAuthStore((s) => s.user?.id);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(term.trim()), 250);

    return () => window.clearTimeout(id);
  }, [term]);

  const { data, isFetching } = useProjects({ search: debounced || undefined, per_page: 20 });
  const follow = useMutation({
    mutationFn: (projectId: number) => myProjectsApi.assign(projectId, meId as number, 'متابعة'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      onClose();
    },
  });

  const projects = data?.data ?? [];

  return (
    <div className="mypr-modal-back" onClick={onClose}>
      <div className="mypr-modal" onClick={(e) => e.stopPropagation()}>
        <h2>تابِع مشروعًا</h2>
        <p className="mypr-modal-hint">اختر مشروعًا لتُضيف نفسك إلى فريقه، فيظهر هنا مع تنبيه بجديده.</p>

        <input
          className="input"
          placeholder="ابحث باسم المشروع أو رمزه…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />

        <ul className="mypr-modal-list">
          {isFetching && projects.length === 0 && <li style={{ padding: '12px', color: '#8A93A3', fontSize: '13px' }}>جارٍ البحث…</li>}
          {!isFetching && projects.length === 0 && <li style={{ padding: '12px', color: '#8A93A3', fontSize: '13px' }}>لا مشروع مطابق.</li>}
          {projects.map((p) => {
            const already = followedIds.includes(p.id);

            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="mypr-pick"
                  disabled={already || follow.isPending}
                  onClick={() => follow.mutate(p.id)}
                >
                  <i className="fas fa-diagram-project" style={{ color: '#1B6CA8' }} />
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: 'block' }}>{p.name}</b>
                    <span>{[p.code, p.client?.name].filter(Boolean).join(' · ') || '—'}</span>
                  </span>
                  <span className="mypr-pick-go">{already ? 'ضمن مشاريعي' : 'متابعة +'}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {follow.isError && <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '8px 0 0' }}>تعذّرت المتابعة — حدّث الصفحة وأعد المحاولة.</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '14px' }}>
          <button className="btn" type="button" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
