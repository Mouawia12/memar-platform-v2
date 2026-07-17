import { type CSSProperties, type FormEvent, useState } from 'react';

import { useAddReply, useTopic } from '../hooks/useForum';

export function TopicViewModal({ topicId, onClose }: { topicId: number; onClose: () => void }) {
  const { data: topic, isLoading } = useTopic(topicId);
  const reply = useAddReply(topicId);
  const [body, setBody] = useState('');

  const handleReply = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    reply.mutate(body, { onSuccess: () => setBody('') });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        {isLoading || !topic ? <p>جارٍ التحميل…</p> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <span style={chip}>{topic.category?.name}</span>
                <h2 style={{ margin: '8px 0 4px' }}>{topic.title}</h2>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>👤 {topic.author} · 👁️ {topic.views} · 💬 {topic.replies?.length ?? 0}</div>
              </div>
              <button className="btn btn-sm" type="button" onClick={onClose}>×</button>
            </div>

            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, marginTop: '12px' }}>{topic.body}</p>

            <hr style={{ border: 'none', borderTop: '1px solid #eef2f7', margin: '16px 0' }} />
            <h4 style={{ margin: '0 0 10px' }}>الردود ({topic.replies?.length ?? 0})</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topic.replies?.map((r) => (
                <div key={r.id} style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>👤 {r.author}</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.body}</div>
                </div>
              ))}
              {(topic.replies?.length ?? 0) === 0 && <p style={{ opacity: 0.5 }}>لا توجد ردود بعد — كن أول من يجيب.</p>}
            </div>

            <form onSubmit={handleReply} style={{ marginTop: '16px' }}>
              <textarea className="input" style={{ width: '100%', minHeight: '70px' }} placeholder="اكتب ردك…" value={body} onChange={(e) => setBody(e.target.value)} />
              <button className="btn btn-primary" type="submit" disabled={reply.isPending} style={{ marginTop: '8px' }}>{reply.isPending ? 'جارٍ الإرسال…' : 'إرسال الرد'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflow: 'auto' };
const chip: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '999px', background: '#E8EEF5', color: '#274A78', fontSize: '12px' };
