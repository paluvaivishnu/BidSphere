/**
 * LoadingCard — Apple-style shimmer skeleton for an auction card.
 */
const LoadingCard = () => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    animation: 'fadeIn 0.3s ease forwards',
  }}>
    {/* Image placeholder */}
    <div className="skeleton" style={{ width: '100%', aspectRatio: '4/3', borderRadius: 0 }} />

    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Title */}
      <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 6 }} />

      {/* Price row */}
      <div style={{ paddingTop: 10, borderTop: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="skeleton" style={{ height: 10, width: 70, borderRadius: 5, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 22, width: 95, borderRadius: 6 }} />
        </div>
        <div className="skeleton" style={{ height: 26, width: 80, borderRadius: 13 }} />
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skeleton" style={{ height: 22, width: 68, borderRadius: 11 }} />
        <div className="skeleton" style={{ height: 22, width: 82, borderRadius: 11 }} />
      </div>

      {/* Mini history */}
      <div style={{ background: '#f9f9fb', border: '1px solid #f0f0f5', borderRadius: 10, padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton" style={{ height: 10, width: `${28 + i * 10}%`, borderRadius: 5 }} />
            <div className="skeleton" style={{ height: 10, width: '25%', borderRadius: 5 }} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="skeleton" style={{ height: 38, borderRadius: 19 }} />
    </div>
  </div>
);

export default LoadingCard;
