import { useState, useEffect, useRef } from 'react';

/**
 * ActivityFeed — shows real bid events received via socket.
 * Apple-style light UI redesign.
 */

const formatAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const ActivityFeed = ({ events = [] }) => {
  const [tick,    setTick]    = useState(0);
  const [newId,   setNewId]   = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (events.length > prevLenRef.current && events.length > 0) {
      setNewId(events[0].id);
      setTimeout(() => setNewId(null), 700);
    }
    prevLenRef.current = events.length;
  }, [events]);

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100vh - 120px)',
      position: 'sticky', top: 76,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '13px 16px 11px',
        borderBottom: '1px solid #f0f0f5',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        background: '#fafafa',
      }}>
        <span className="live-ping-wrap"><span className="live-ping-dot" /></span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>Live Activity</span>
        {events.length > 0 && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, color: '#6e6e73',
            background: '#f5f5f7', border: '1px solid #e5e7eb',
            padding: '2px 8px', borderRadius: 980, fontWeight: 600,
          }}>
            {events.length}/10
          </span>
        )}
      </div>

      {/* ── Feed ── */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {events.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 180, padding: '24px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>⚡</div>
            <p style={{ fontSize: 12, color: '#6e6e73', fontWeight: 600 }}>Waiting for live bids…</p>
            <p style={{ fontSize: 11, color: '#aeaeb2', marginTop: 4 }}>Activity appears here in real-time</p>
          </div>
        ) : (
          events.map((evt, i) => {
            const isNew   = evt.id === newId;
            const isHover = hoverId === evt.id;
            return (
              <div
                key={evt.id}
                onMouseEnter={() => setHoverId(evt.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  padding: '10px 14px 10px 12px',
                  borderBottom: i < events.length - 1 ? '1px solid #f5f5f7' : 'none',
                  borderLeft: isHover ? '3px solid #0071e3' : '3px solid transparent',
                  paddingLeft: isHover ? 11 : 12,
                  background: isHover ? 'rgba(0,113,227,0.03)' : 'transparent',
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                  animation: isNew ? 'feed-slide-in 0.3s ease forwards' : 'none',
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isHover ? 'rgba(0,113,227,0.08)' : '#f5f5f7',
                    border: `1px solid ${isHover ? 'rgba(0,113,227,0.2)' : '#e5e7eb'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                    transition: 'background 0.2s ease, border-color 0.2s ease',
                  }}>
                    {evt.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12,
                      color: isHover ? '#1d1d1f' : '#6e6e73',
                      lineHeight: 1.45, wordBreak: 'break-word',
                      fontWeight: 500,
                      transition: 'color 0.2s ease',
                    }}>
                      {evt.text}
                    </p>
                    <p style={{ fontSize: 10, color: '#aeaeb2', marginTop: 3 }}>
                      {formatAgo(evt.ts)}{tick > -1 ? '' : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid #f0f0f5',
        fontSize: 10, color: '#aeaeb2', fontWeight: 600,
        textAlign: 'center', flexShrink: 0,
        letterSpacing: '0.5px', textTransform: 'uppercase',
        background: '#fafafa',
      }}>
        Real-time · Socket Feed
      </div>
    </div>
  );
};

export default ActivityFeed;
