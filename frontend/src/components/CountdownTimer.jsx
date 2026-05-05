import { useState, useEffect } from 'react';

const CountdownTimer = ({ endTime, onEnd, compact = false }) => {
  const calc = () => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return null;
    return {
      days:         Math.floor(diff / 86400000),
      hours:        Math.floor((diff % 86400000) / 3600000),
      minutes:      Math.floor((diff % 3600000) / 60000),
      seconds:      Math.floor((diff % 60000) / 1000),
      totalSeconds: Math.floor(diff / 1000),
    };
  };

  const [t, setT] = useState(calc);

  useEffect(() => {
    setT(calc());
    const id = setInterval(() => {
      const r = calc();
      setT(r);
      if (!r && onEnd) onEnd();
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!t) return <span style={{ fontSize: 11, color: '#aeaeb2' }}>Ended</span>;

  const pad = n => String(n).padStart(2, '0');
  const urgent  = t.totalSeconds < 60;
  const soonish = t.totalSeconds < 300;
  const color   = urgent ? '#ef4444' : soonish ? '#f59e0b' : '#6e6e73';

  /* ── Compact mode (AuctionCard) ── */
  if (compact) {
    const parts = t.days > 0
      ? [`${t.days}d`, `${pad(t.hours)}h`]
      : [pad(t.hours), pad(t.minutes), pad(t.seconds)];

    if (t.days > 0) {
      return (
        <span
          style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color, whiteSpace: 'nowrap' }}
          className={urgent ? 'timer-urgent' : ''}
        >
          {parts[0]} {parts[1]}
        </span>
      );
    }

    return (
      <span
        style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}
        className={urgent ? 'timer-urgent' : ''}
        aria-label={`${parts[0]} hours ${parts[1]} minutes ${parts[2]} seconds remaining`}
      >
        {parts[0]}
        <span style={{ animation: urgent ? 'blink 1s ease infinite' : 'none' }}>:</span>
        {parts[1]}
        <span style={{ animation: urgent ? 'blink 1s ease infinite' : 'none' }}>:</span>
        {parts[2]}
      </span>
    );
  }

  /* ── Full mode (AuctionDetail) ── */
  const segs = t.days > 0
    ? [{ l: 'Days', v: t.days }, { l: 'Hours', v: t.hours }, { l: 'Mins', v: t.minutes }, { l: 'Secs', v: t.seconds }]
    : [{ l: 'Hours', v: t.hours }, { l: 'Mins', v: t.minutes }, { l: 'Secs', v: t.seconds }];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      {segs.map((s, i) => (
        <div key={s.l} style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              minWidth: 52, background: '#f5f5f7',
              border: `1px solid ${urgent ? 'rgba(239,68,68,0.35)' : soonish ? 'rgba(245,158,11,0.3)' : '#e5e7eb'}`,
              borderRadius: 12, padding: '7px 8px',
              fontSize: 24, fontWeight: 700, fontFamily: 'monospace',
              color: urgent ? '#ef4444' : soonish ? '#f59e0b' : '#1d1d1f',
              textAlign: 'center',
              transition: 'color 0.35s ease, border-color 0.35s ease',
              animation: urgent
                ? 'urgent-pulse 0.9s ease infinite'
                : 'none',
            }}>
              {pad(s.v)}
            </div>
            <div style={{ fontSize: 10, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{s.l}</div>
          </div>
          {i < segs.length - 1 && (
            <span style={{
              fontSize: 20, color: urgent ? 'rgba(239,68,68,0.55)' : '#d1d5db',
              fontWeight: 700, paddingBottom: 16,
              animation: urgent ? 'blink 1s ease infinite' : 'none',
              transition: 'color 0.35s ease',
            }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
