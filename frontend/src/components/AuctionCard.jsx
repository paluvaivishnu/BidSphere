import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import AnimatedPrice from './AnimatedPrice';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getRelativeTime = (d) => {
  if (!d) return null;
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const AuctionCard = ({ auction, overridePrice }) => {
  const { user, toggleWatchlist } = useAuth();
  const [displayPrice, setDisplayPrice] = useState(
    overridePrice ?? (auction.currentBid || auction.basePrice)
  );
  const [hovered,    setHovered]    = useState(false);
  const [ripples,    setRipples]    = useState([]);
  const [tick,       setTick]       = useState(0);
  const btnRef = useRef(null);

  // Sync override price from parent simulation
  useEffect(() => {
    if (overridePrice !== undefined) setDisplayPrice(overridePrice);
  }, [overridePrice]);

  // Refresh relative timestamps every 10s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const isLive   = auction.status === 'active' && new Date() < new Date(auction.endTime);
  const imageUrl = auction.image
    ? auction.image.startsWith('http') ? auction.image : `${API_URL}${auction.image}`
    : null;
  const isFavorited  = user?.watchlist?.includes(auction._id);
  const recentBids   = [...(auction.bids || [])].reverse().slice(0, 3);
  const lastBid      = recentBids[0];
  const lastBidder   = lastBid?.userId?.name?.split(' ')[0];
  const lastBidTime  = lastBid ? getRelativeTime(lastBid.createdAt) : null;
  const bidderCount  = auction.bidderCount || auction.totalBids || 0;
  const incrementAmt = auction.incrementAmount || 500;

  const handleToggleWatchlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try { await toggleWatchlist(auction._id); } catch (_) {}
  };

  // Ripple on Place Bid click
  const handleBidClick = useCallback((e) => {
    e.preventDefault();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    setTimeout(() => { window.location.href = `/auctions/${auction._id}`; }, 200);
  }, [auction._id]);

  return (
    <Link to={`/auctions/${auction._id}`} className="ac-link">
      <div
        className="ac"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* ── Image ── */}
        <div className="ac-img-wrap">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={auction.title}
              className="ac-img"
              style={{
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.35s ease',
              }}
            />
          ) : (
            <div className="ac-img-ph">🛍️</div>
          )}
          {/* LIVE / ENDED badge */}
          <div className="ac-top-left">
            {isLive
              ? <span className="ac-badge-live">
                  <span className="ac-live-ping"><span className="ac-live-ping-dot" /></span>
                  LIVE
                </span>
              : auction.status === 'completed'
                ? <span className="ac-badge-ended">ENDED</span>
                : null
            }
          </div>
          {/* Watchlist heart */}
          {user?.role === 'buyer' && (
            <button className={`ac-watch ${isFavorited ? 'fav' : ''}`} onClick={handleToggleWatchlist}
              aria-label={isFavorited ? 'Remove from watchlist' : 'Add to watchlist'}>
              {isFavorited ? '❤️' : '🤍'}
            </button>
          )}
          {/* Category tag */}
          <span className="ac-category">{auction.category}</span>
          {auction.totalBids > 0 && (
            <span className="ac-bid-count">{auction.totalBids} bids</span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="ac-body">
          <h3 className="ac-title">{auction.title}</h3>

          {/* Price row */}
          <div className="ac-price-row">
            <div>
              <div className="ac-price-label">
                {(auction.currentBid || overridePrice) > 0 ? 'Current Bid' : 'Starting Bid'}
              </div>
              <AnimatedPrice
                value={displayPrice}
                className="ac-price"
                style={{ fontSize: 20, fontWeight: 700, color: '#0071e3', lineHeight: 1 }}
              />
            </div>
            {isLive && (
              <div className="ac-timer-wrap">
                <span className="ac-timer-icon">⏳</span>
                <CountdownTimer endTime={auction.endTime} compact />
              </div>
            )}
          </div>

          {/* Info chips */}
          {isLive && (
            <div className="ac-chips">
              <span className="ac-chip">
                <span style={{ opacity: 0.65 }}>👤</span>
                {bidderCount} bidder{bidderCount !== 1 ? 's' : ''}
              </span>
              <span className="ac-chip ac-chip-inc">
                +₹{incrementAmt.toLocaleString('en-IN')} min
              </span>
            </div>
          )}

          {/* Last bid */}
          {isLive && lastBidder && lastBidTime && (
            <p className="ac-last-bid">⚡ {lastBidder} bid {lastBidTime}</p>
          )}
          {auction.winner && (
            <p className="ac-winner">🏆 Won by {auction.winner?.name || 'Unknown'}</p>
          )}
          {!isLive && !auction.winner && (
            <p className="ac-seller">By {auction.sellerId?.name || 'Unknown'}</p>
          )}

          {/* Mini bid history */}
          {isLive && recentBids.length > 0 && (
            <div className="ac-bid-history">
              {recentBids.map((b, i) => (
                <div key={b._id || i} className="ac-bid-history-row">
                  <span className="ac-bid-history-name">{b.userId?.name?.split(' ')[0] || 'Anon'}</span>
                  <span className="ac-bid-history-amt">₹{b.bidAmount?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Place Bid button */}
          {isLive && (
            <button
              ref={btnRef}
              className="ac-cta"
              onClick={handleBidClick}
              aria-label={`Place bid on ${auction.title}`}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              Place Bid
              {ripples.map(r => (
                <span
                  key={r.id}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: r.x, top: r.y,
                    width: 10, height: 10,
                    marginLeft: -5, marginTop: -5,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.4)',
                    animation: 'ripple 0.6s ease-out forwards',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .ac-link { display: block; text-decoration: none; }
        .ac {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          will-change: transform, box-shadow;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .ac-img-wrap {
          position: relative; width: 100%; aspect-ratio: 4/3;
          background: #f5f5f7; overflow: hidden;
          border-bottom: 1px solid #f0f0f5;
        }
        .ac-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ac-img-ph {
          width: 100%; height: 100%; display: flex; align-items: center;
          justify-content: center; font-size: 48px; color: #d1d1d6;
        }
        .ac-top-left { position: absolute; top: 10px; left: 10px; z-index: 2; }
        .ac-badge-live {
          display: inline-flex; align-items: center; gap: 5px;
          background: #ef4444; color: #fff;
          font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
          padding: 3px 8px; border-radius: 980px;
          box-shadow: 0 2px 8px rgba(239,68,68,0.35);
        }
        .ac-badge-ended {
          background: #f3f4f6; color: #9ca3af;
          font-size: 10px; font-weight: 600;
          padding: 3px 8px; border-radius: 980px;
          border: 1px solid #e5e7eb;
        }
        .ac-watch {
          position: absolute; top: 8px; right: 8px;
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.9); border: 1px solid #e5e7eb;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 15px; cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease; z-index: 2;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .ac-watch:hover { transform: scale(1.12); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .ac-watch.fav { background: rgba(255,255,255,0.95); border-color: rgba(239,68,68,0.3); }
        .ac-category {
          position: absolute; bottom: 10px; left: 10px;
          background: rgba(255,255,255,0.88); backdrop-filter: blur(8px);
          color: #6e6e73; font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
          padding: 3px 8px; border-radius: 980px;
          border: 1px solid rgba(229,231,235,0.8);
        }
        .ac-bid-count {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(255,255,255,0.88); backdrop-filter: blur(8px);
          color: #6e6e73; font-size: 10px;
          padding: 3px 8px; border-radius: 980px;
          border: 1px solid rgba(229,231,235,0.8);
        }
        .ac-body {
          padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1;
        }
        .ac-title {
          font-size: 14px; font-weight: 700; color: #1d1d1f;
          line-height: 1.4; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          letter-spacing: -0.1px;
        }
        .ac-price-row {
          display: flex; justify-content: space-between; align-items: flex-end;
          gap: 8px; padding-top: 10px; border-top: 1px solid #f0f0f5;
        }
        .ac-price-label {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
          color: #aeaeb2; font-weight: 600; margin-bottom: 2px;
        }
        .ac-timer-wrap {
          display: flex; align-items: center; gap: 4px;
          background: #f5f5f7; border: 1px solid #e5e7eb;
          border-radius: 980px; padding: 4px 10px;
        }
        .ac-timer-icon { font-size: 11px; }
        .ac-chips { display: flex; gap: 5px; flex-wrap: wrap; }
        .ac-chip {
          font-size: 10px; font-weight: 600; color: #6e6e73;
          background: #f5f5f7; border: 1px solid #e5e7eb;
          padding: 3px 8px; border-radius: 980px;
          display: inline-flex; align-items: center; gap: 3px;
        }
        .ac-chip-inc { color: #16a34a; border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.06); }
        .ac-last-bid { font-size: 11px; color: #6e6e73; }
        .ac-winner   { font-size: 11px; color: #d97706; }
        .ac-seller   { font-size: 11px; color: #aeaeb2; }
        .ac-bid-history {
          background: #f9f9fb; border: 1px solid #f0f0f5;
          border-radius: 10px; padding: 6px 10px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .ac-bid-history-row {
          display: flex; justify-content: space-between; align-items: center; font-size: 11px;
        }
        .ac-bid-history-name { color: #6e6e73; font-weight: 500; }
        .ac-bid-history-amt  { color: #1d1d1f; font-weight: 700; font-family: monospace; }
        .ac-bid-history-row:first-child .ac-bid-history-amt  { color: #0071e3; }
        .ac-bid-history-row:first-child .ac-bid-history-name { color: #1d1d1f; }
        .ac-cta {
          width: 100%; padding: 11px;
          background: #0071e3;
          color: #fff; font-size: 14px; font-weight: 600;
          border-radius: 980px; border: none; cursor: pointer;
          transition: background 0.2s ease, transform 0.18s ease;
          margin-top: 4px; letter-spacing: -0.1px;
          box-shadow: 0 2px 8px rgba(0,113,227,0.28);
        }
        .ac-cta:hover { background: #005bb5; box-shadow: 0 4px 16px rgba(0,113,227,0.38); }
        .ac-cta:active { transform: scale(0.97); }
        /* Live ping inside badge */
        .ac-live-ping {
          position: relative; display: inline-flex; align-items: center;
          justify-content: center; width: 8px; height: 8px; flex-shrink: 0;
        }
        .ac-live-ping::before {
          content: ''; position: absolute; inset: 0;
          border-radius: 50%; background: rgba(255,255,255,0.85);
          animation: live-ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
        }
        .ac-live-ping-dot {
          position: relative; width: 5px; height: 5px;
          border-radius: 50%; background: #fff; z-index: 1;
        }
      `}</style>
    </Link>
  );
};

export default AuctionCard;
