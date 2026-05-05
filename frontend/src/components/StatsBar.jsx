/**
 * StatsBar — compact horizontal bar showing real platform stats.
 * Apple-style light theme.
 */
const StatsBar = ({ liveCount = 0, auctions = [], totalBids }) => {
  const activeBidders = auctions.reduce((sum, a) => sum + (a.totalBids || 0), 0);
  const bidsCount     = totalBids ?? auctions.reduce((sum, a) => sum + (a.totalBids || 0), 0);

  const stats = [
    { icon: '🔥', label: 'Live Auctions', value: liveCount },
    { icon: '👥', label: 'Total Bids',    value: activeBidders },
    { icon: '⚡', label: 'Active Now',    value: bidsCount },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#ffffff', border: '1px solid #e5e7eb',
      borderRadius: 14, marginBottom: 18, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          flex: 1, padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderRight: i < stats.length - 1 ? '1px solid #f0f0f5' : 'none',
        }}>
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1d1d1f', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
              {s.value.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
