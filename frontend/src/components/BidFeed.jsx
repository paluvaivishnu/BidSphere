import { useEffect, useRef, useState } from 'react';

const BidFeed = ({ bids }) => {
  const ref = useRef(null);
  const [prevTopId, setPrevTopId] = useState(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    if (bids?.length > 0) setPrevTopId(bids[0]?._id);
  }, [bids]);

  if (!bids || bids.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#aeaeb2', fontSize: 13 }}>
        No bids yet. Be the first!
      </div>
    );
  }

  const fmt = d => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
      {bids.map((bid, i) => (
        <div
          key={bid._id || i}
          className={i === 0 ? 'bid-row-new' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 12,
            background: i === 0 ? '#f5f5f7' : '#fafafa',
            border: `1px solid ${i === 0 ? '#e5e7eb' : '#f0f0f5'}`,
            borderLeft: i === 0 ? '3px solid #0071e3' : '1px solid #f0f0f5',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i === 0
              ? 'linear-gradient(135deg, #0071e3, #005bb5)'
              : '#e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
            color: i === 0 ? '#fff' : '#6e6e73',
            flexShrink: 0,
          }}>
            {(bid.userId?.name || 'A')[0].toUpperCase()}
          </div>

          {/* Name + time */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bid.userId?.name || 'Anonymous'}
            </div>
            <div style={{ fontSize: 10, color: '#aeaeb2' }}>{fmt(bid.createdAt)}</div>
          </div>

          {/* Amount + TOP badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? '#0071e3' : '#6e6e73', fontFamily: 'monospace' }}>
              ₹{bid.bidAmount?.toLocaleString('en-IN')}
            </span>
            {i === 0 && (
              <span style={{
                fontSize: 9, background: '#0071e3', color: '#fff',
                padding: '2px 6px', borderRadius: 980, fontWeight: 700,
              }}>
                TOP
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BidFeed;
