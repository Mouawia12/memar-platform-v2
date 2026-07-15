/**
 * صفحة مؤقتة للوحدات التي لم تُبنَ بعد — تُستبدل تباعًا عند نقل كل وحدة.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚧</div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ opacity: 0.6, marginTop: '8px' }}>هذه الوحدة قيد النقل إلى React — قريبًا.</p>
    </div>
  );
}
