import { type CSSProperties, useState } from 'react';

import { NewTopicModal } from '../components/NewTopicModal';
import { TopicViewModal } from '../components/TopicViewModal';
import { useForumCategories, useTopics } from '../hooks/useForum';

export function ForumPage() {
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [newOpen, setNewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: categories } = useForumCategories();
  const { data, isLoading } = useTopics({ category_id: categoryId === '' ? undefined : categoryId });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>المنتدى</h1>
        <button className="btn btn-primary" onClick={() => setNewOpen(true)} type="button">🗨️ موضوع جديد</button>
      </div>

      {/* أقسام كشرائح */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button type="button" style={chip(categoryId === '')} onClick={() => setCategoryId('')}>الكل</button>
        {categories?.map((c) => (
          <button key={c.id} type="button" style={chip(categoryId === c.id)} onClick={() => setCategoryId(c.id)}>
            {c.name} <span style={{ opacity: 0.6 }}>({c.topics_count})</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '8px' }}>
        {isLoading && <p style={{ padding: '16px' }}>جارٍ التحميل…</p>}
        {data && data.data.length === 0 && <p style={{ padding: '16px', opacity: 0.6 }}>لا توجد مواضيع — ابدأ نقاشًا جديدًا.</p>}
        {data?.data.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setViewId(t.id)}
            style={{ display: 'block', width: '100%', textAlign: 'inherit', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', padding: '14px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{t.is_pinned && '📌 '}{t.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>{t.category?.name} · 👤 {t.author}</div>
              </div>
              <div style={{ fontSize: '13px', opacity: 0.7, whiteSpace: 'nowrap' }}>💬 {t.replies_count ?? 0} · 👁️ {t.views}</div>
            </div>
          </button>
        ))}
      </div>

      {newOpen && <NewTopicModal onClose={() => setNewOpen(false)} />}
      {viewId !== null && <TopicViewModal topicId={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}

const chip = (active: boolean): CSSProperties => ({
  padding: '6px 16px', borderRadius: '999px', border: '1px solid', borderColor: active ? '#274A78' : '#e2e8f0',
  background: active ? '#274A78' : '#fff', color: active ? '#fff' : '#475569', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer',
});
