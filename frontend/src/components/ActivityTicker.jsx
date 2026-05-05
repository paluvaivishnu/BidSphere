import { useEffect, useRef } from 'react';

/**
 * ActivityTicker — horizontal scrolling ticker. Apple-style light theme.
 */
const ActivityTicker = ({ activities = [] }) => {
  const trackRef = useRef(null);

  if (!activities || activities.length === 0) return null;

  const items = [...activities, ...activities];

  return (
    <div
      style={{
        overflow: 'hidden',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff',
        padding: '8px 0',
        position: 'relative',
        marginBottom: 4,
      }}
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
      }}
    >
      {/* Fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(to right, #ffffff, transparent)',
        zIndex: 1, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(to left, #ffffff, transparent)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      <div
        ref={trackRef}
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: `ticker-scroll ${activities.length * 4}s linear infinite`,
        }}
      >
        {items.map((a, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '0 24px',
              fontSize: 12, color: '#aeaeb2',
            }}
          >
            <span style={{ color: '#0071e3', fontSize: 11 }}>⚡</span>
            <span style={{ color: '#1d1d1f', fontWeight: 600 }}>{a.bidderName}</span>
            <span>bid</span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontFamily: 'monospace' }}>
              ₹{(a.amount || 0).toLocaleString('en-IN')}
            </span>
            <span>on</span>
            <span style={{ color: '#1d1d1f', fontWeight: 600 }}>{a.itemName}</span>
            <span style={{ color: '#e5e7eb', marginLeft: 8 }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ActivityTicker;
