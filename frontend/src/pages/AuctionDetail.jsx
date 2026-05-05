import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BidFeed from '../components/BidFeed';
import CountdownTimer from '../components/CountdownTimer';
import AnimatedPrice from '../components/AnimatedPrice';
import { BidToastContainer, useBidToast } from '../components/BidToast';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const AuctionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { joinAuction, leaveAuction, onBidUpdate, onAuctionEnded, connected } = useSocket();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [newBidFlash, setNewBidFlash] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  // Animation state
  const [priceAnimKey, setPriceAnimKey] = useState(0);   // increment to re-trigger animation
  const [bidIncrement, setBidIncrement] = useState(null); // e.g. '+₹5,000'
  const [btnPressed, setBtnPressed] = useState(false);
  const prevPriceRef = useRef(null);
  const { showBidToast } = useBidToast();

  const fetchAuction = useCallback(async () => {
    try {
      const { data } = await API.get(`/auctions/${id}`);
      const a = data.data;
      setAuction(a);
      setBids(a.bids || []);
      if (a.status === 'completed') {
        setAuctionEnded(true);
        setWinner(a.winner);
      }
      const minBid = (a.currentBid || a.basePrice) + 1;
      setBidAmount(String(minBid));
    } catch (err) {
      toast.error('Auction not found');
      navigate('/auctions');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  // Socket.io
  useEffect(() => {
    if (!id) return;
    joinAuction(id);

    const offBidUpdate = onBidUpdate((data) => {
      // Calculate increment for float label
      const oldPrice = prevPriceRef.current;
      if (oldPrice !== null && data.currentBid > oldPrice) {
        const diff = data.currentBid - oldPrice;
        setBidIncrement(`+₹${diff.toLocaleString('en-IN')}`);
        setTimeout(() => setBidIncrement(null), 1400);
      }
      prevPriceRef.current = data.currentBid;

      setAuction(prev => prev ? { ...prev, currentBid: data.currentBid, currentBidder: data.currentBidder, totalBids: data.totalBids } : prev);
      setBids(prev => [data.bid, ...prev]);
      setNewBidFlash(true);
      setTimeout(() => setNewBidFlash(false), 1000);
      // Trigger price pop animation
      setPriceAnimKey(k => k + 1);
      setBidAmount(String(data.currentBid + 1));
      // Custom slide-in bid toast
      showBidToast({
        itemName: data.auctionTitle || 'this item',
        oldPrice: oldPrice || 0,
        newPrice: data.currentBid,
      });
    });

    const offAuctionEnded = onAuctionEnded((data) => {
      setAuctionEnded(true);
      setWinner(data.winner);
      setAuction(prev => prev ? { ...prev, status: 'completed' } : prev);
      if (data.winner) {
        toast.success(`🏆 Auction ended! ${data.winner.name} won with ₹${data.finalBid.toLocaleString('en-IN')}`, { duration: 8000 });
      } else {
        toast('⏱ Auction ended with no bids.', { duration: 5000 });
      }
    });

    return () => {
      leaveAuction(id);
      offBidUpdate?.();
      offAuctionEnded?.();
    };
  }, [id, connected]); // `connected` ensures we rejoin + re-listen after socket connects

  const handleBid = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to bid'); return navigate('/login'); }
    if (user.role === 'seller') { toast.error('Sellers cannot place bids'); return; }

    const amount = parseFloat(bidAmount);
    const minBid = (auction.currentBid || auction.basePrice) + 1;

    if (!amount || amount < minBid) {
      return toast.error(`Minimum bid is ₹${minBid.toLocaleString('en-IN')}`);
    }

    // Button press animation
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 260);

    setBidding(true);
    try {
      if (isAuto) {
        await API.post(`/bids/${id}/auto`, { maxAmount: amount });
        toast.success(`Auto-bid up to ₹${amount.toLocaleString('en-IN')} set! 🤖`);
        setBidAmount('');
      } else {
        await API.post(`/bids/${id}`, { bidAmount: amount });
        toast.success(`Bid of ₹${amount.toLocaleString('en-IN')} placed! 🎯`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place bid';
      if (err.response?.status === 429 || err.response?.status === 403) {
        toast.error(msg, { position: 'top-center', duration: 8000, style: { background: '#FF3B30', color: '#fff', fontWeight: 'bold' } });
      } else {
        toast.error(msg);
      }
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: 400, borderRadius: 10, marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 20, width: '80%' }} />
        </div>
      </div>
    );
  }

  if (!auction) return null;

  const imageUrl = auction.image
    ? auction.image.startsWith('http') ? auction.image : `${API_URL}${auction.image}`
    : null;

  const isLive = auction.status === 'active' && !auctionEnded && new Date() < new Date(auction.endTime);
  const currentPrice = auction.currentBid || auction.basePrice;
  const minBid = currentPrice + 1;
  const canBid = user && user.role === 'buyer' &&
    auction.sellerId?._id !== user._id &&
    isLive && !auctionEnded;

  return (
    <div className="page-wrapper">
      <div className="detail-layout animate-fade-in">
        {/* Left Column */}
        <div className="detail-left">
          {/* Image */}
          <div className="detail-image-wrapper">
            {imageUrl ? (
              <img src={imageUrl} alt={auction.title} className="detail-image" />
            ) : (
              <div className="detail-image-placeholder">
                <span>🛍️</span>
              </div>
            )}
            <div className="detail-status-overlay">
              {isLive && (
                <span className="detail-live-badge">
                  <span className="detail-live-ping-wrap"><span className="detail-live-ping-dot" /></span> LIVE AUCTION
                </span>
              )}
              {auctionEnded && (
                <span className="detail-ended-badge">✅ AUCTION ENDED</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="detail-info card">
            <div className="detail-meta">
              <span className="detail-category">{auction.category}</span>
              <span className="detail-bids-total">{auction.totalBids} total bids</span>
            </div>
            <h1 className="detail-title">{auction.title}</h1>
            <p className="detail-desc">{auction.description}</p>

            <div className="divider" />

            <div className="detail-seller-row">
              <div className="detail-avatar">
                {(auction.sellerId?.name || 'S')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Listed by</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>{auction.sellerId?.name || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="detail-right">
          {/* Price Card */}
          <div className={`price-card card ${newBidFlash ? 'price-flash' : ''}`}>
            <div className="price-top">
              <div className="price-block">
                <span className="price-label">
                  {auction.currentBid > 0 ? 'Current Highest Bid' : 'Starting Price'}
                </span>
                {/* AnimatedPrice — counts up smoothly + shows +₹X badge */}
                <AnimatedPrice
                  value={currentPrice}
                  className="price-value"
                  style={{ display: 'block', fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif", fontSize: 38, fontWeight: 800, color: '#0071e3', lineHeight: 1, letterSpacing: '-1px', transformOrigin: 'left center' }}
                  duration={600}
                />
                {auction.currentBidder && (
                  <span className="price-bidder">
                    by {auction.currentBidder?.name}
                  </span>
                )}
              </div>

              {/* Timer */}
              <div className="timer-block">
                <span className="price-label">Time Remaining</span>
                {isLive ? (
                  <CountdownTimer endTime={auction.endTime} onEnd={() => setAuctionEnded(true)} />
                ) : (
                  <span className="timer-ended-label">⏱ Ended</span>
                )}
              </div>
            </div>

            {/* Winner Banner */}
            {auctionEnded && (
              <div className={`winner-banner ${user?._id === winner?._id ? 'winner-is-me' : ''}`}>
                {winner ? (
                  <>
                    <span className="winner-trophy">🏆</span>
                    <div style={{ flex: 1 }}>
                      <div className="winner-title">
                        {user?._id === winner?._id ? 'You Won! Congratulations!' : 'Auction Winner'}
                      </div>
                      <div className="winner-name">{winner.name}</div>
                      {user?._id === winner?._id && (
                        <div style={{ marginTop: '12px' }}>
                          <Link to="/won-auctions" className="btn btn-primary btn-sm btn-full" style={{ textAlign: 'center' }}>
                            💳 Proceed to Payment →
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>😔</div>
                    <div style={{ color: '#6e6e73', fontSize: 14 }}>No bids were placed — auction closed with no winner</div>
                  </div>
                )}
              </div>
            )}

            {/* Bid Form */}
            {canBid && (
              <form onSubmit={handleBid} className="bid-form">
                <div className="bid-type-toggles">
                  <button
                    type="button"
                    className={`bid-toggle-btn ${!isAuto ? 'active-toggle' : 'inactive-toggle'}`}
                    onClick={() => setIsAuto(false)}
                  >
                    🎯 Direct Bid
                  </button>
                  <button
                    type="button"
                    className={`bid-toggle-btn ${isAuto ? 'active-toggle' : 'inactive-toggle'}`}
                    onClick={() => setIsAuto(true)}
                  >
                    🤖 Auto-Bid
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" htmlFor="bid-amount">
                    {isAuto ? 'Your Maximum Auto-Bid (₹)' : 'Your Bid Amount (₹)'}
                  </label>
                  <div className="bid-input-row">
                    <span className="bid-rupee">₹</span>
                    <input
                      id="bid-amount"
                      type="number"
                      className="form-input bid-input"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minBid}
                      step="1"
                    />
                  </div>
                  <p className="text-sm text-muted" style={{ marginTop: 5 }}>
                    {isAuto
                      ? `Auto-bids up to this amount. Min: ₹${minBid.toLocaleString('en-IN')}`
                      : `Minimum required: ₹${minBid.toLocaleString('en-IN')}`
                    }
                  </p>
                </div>
                <button
                  id="place-bid-btn"
                  type="submit"
                  className={`btn btn-primary btn-full btn-lg ${btnPressed ? 'btn-press' : ''}`}
                  disabled={bidding}
                >
                  {bidding ? <span className="btn-spinner" /> : (isAuto ? '🤖 Set Maximum Bid' : '⚡ Place Bid Now')}
                </button>
              </form>
            )}

            {!user && isLive && (
              <div className="bid-login-prompt">
                <p>Please <a href="/login" className="auth-link">log in</a> to place a bid</p>
              </div>
            )}

            {user?.role === 'seller' && isLive && (
              <div className="bid-seller-notice">
                Sellers cannot participate in bidding
              </div>
            )}
          </div>

          {/* Bid Feed */}
          <div className="bid-feed-card card">
            <div className="bid-feed-header">
              <h3>Live Bid History</h3>
              <span className="bid-feed-count">{bids.length} bids</span>
            </div>
            <BidFeed bids={bids} />
          </div>
        </div>
      </div>
      <BidToastContainer />

      <style>{`
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        .detail-left { display: flex; flex-direction: column; gap: 20px; }
        .detail-right { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 90px; }

        /* ── Image ── */
        .detail-image-wrapper {
          position: relative; border-radius: 20px; overflow: hidden;
          aspect-ratio: 16/9; background: #f5f5f7;
          border: 1px solid #e5e7eb;
        }
        .detail-image { width: 100%; height: 100%; object-fit: cover; }
        .detail-image-placeholder {
          width: 100%; height: 100%; min-height: 300px;
          background: #f5f5f7;
          display: flex; align-items: center; justify-content: center;
          font-size: 72px;
        }
        .detail-status-overlay { position: absolute; top: 14px; left: 14px; }
        .detail-live-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: #ef4444; color: white;
          padding: 5px 12px; border-radius: 980px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(239,68,68,0.35);
        }
        .detail-live-ping-wrap {
          position: relative; display: inline-flex;
          align-items: center; justify-content: center;
          width: 9px; height: 9px; flex-shrink: 0;
        }
        .detail-live-ping-wrap::before {
          content: ''; position: absolute; inset: 0;
          border-radius: 50%; background: rgba(255,255,255,0.9);
          animation: live-ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
        }
        .detail-live-ping-dot {
          position: relative; width: 5px; height: 5px;
          border-radius: 50%; background: #fff; z-index: 1;
        }
        .detail-ended-badge {
          background: rgba(255,255,255,0.9); color: #6e6e73;
          backdrop-filter: blur(8px);
          padding: 5px 12px; border-radius: 980px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
          border: 1px solid #e5e7eb;
        }

        /* ── Info Card ── */
        .detail-info { padding: 24px; }
        .detail-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .detail-category {
          font-size: 10px; font-weight: 700;
          color: #0071e3;
          background: rgba(0,113,227,0.07);
          padding: 4px 12px; border-radius: 980px;
          border: 1px solid rgba(0,113,227,0.18);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .detail-bids-total { font-size: 13px; color: #6e6e73; font-weight: 600; }
        .detail-title { font-size: 26px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; color: #1d1d1f; letter-spacing: -0.3px; }
        .detail-desc { font-size: 15px; color: #6e6e73; line-height: 1.7; }
        .detail-seller-row { display: flex; align-items: center; gap: 12px; }
        .detail-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #0071e3, #005bb5);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; color: white; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,113,227,0.3);
        }

        /* ── Price Card ── */
        .price-card { padding: 22px; transition: all 0.25s ease; }
        .price-flash {
          box-shadow: 0 0 0 2px #0071e3, 0 8px 32px rgba(0,113,227,0.18) !important;
        }
        .price-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
        .price-block { display: flex; flex-direction: column; gap: 3px; }
        .price-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #aeaeb2; font-weight: 700; }
        .price-value {
          display: block;
          font-size: 38px; font-weight: 800; color: #0071e3;
          line-height: 1; letter-spacing: -1px;
          transform-origin: left center;
        }
        .price-bidder { font-size: 12px; color: #6e6e73; }
        .price-increment-float {
          position: absolute; left: 0; top: -6px;
          font-size: 13px; font-weight: 700; color: #22c55e;
          font-family: monospace; pointer-events: none;
          animation: bid-increment-float 1.4s ease forwards;
        }
        .timer-block { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
        .timer-ended-label { font-size: 13px; color: #6e6e73; font-weight: 700; }

        /* ── Winner Banner ── */
        .winner-banner {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; margin-bottom: 0;
          background: #f9f9fb; border: 1px solid #e5e7eb;
          border-radius: 14px;
        }
        .winner-is-me {
          background: rgba(34,197,94,0.06) !important;
          border-color: rgba(34,197,94,0.25) !important;
        }
        .winner-trophy { font-size: 30px; }
        .winner-title { font-size: 11px; color: #0071e3; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
        .winner-name { font-size: 18px; font-weight: 800; color: #1d1d1f; margin-top: 2px; }

        /* ── Bid Form ── */
        .bid-form { margin-top: 18px; padding-top: 18px; border-top: 1px solid #f0f0f5; }
        .bid-type-toggles {
          display: flex; gap: 5px; margin-bottom: 14px;
          background: #f5f5f7; border: 1px solid #e5e7eb;
          border-radius: 980px; padding: 4px;
        }
        .bid-toggle-btn {
          flex: 1; padding: 8px 12px; border-radius: 980px;
          font-weight: 600; font-size: 13px;
          cursor: pointer; transition: all 0.2s ease;
          border: none;
        }
        .active-toggle {
          background: #0071e3 !important; color: white !important;
          box-shadow: 0 2px 8px rgba(0,113,227,0.28) !important;
        }
        .inactive-toggle { background: transparent !important; color: #6e6e73 !important; }
        .inactive-toggle:hover { background: #ebebf0 !important; color: #1d1d1f !important; }
        .bid-input-row { position: relative; }
        .bid-rupee {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          font-size: 17px; color: #6e6e73; font-weight: 700; z-index: 1;
        }
        .bid-input {
          padding-left: 34px !important;
          font-size: 20px !important;
          font-weight: 800 !important;
          letter-spacing: -0.5px !important;
        }
        .bid-login-prompt { text-align: center; padding: 14px; color: #6e6e73; font-size: 14px; }
        .auth-link { color: #0071e3; font-weight: 700; }
        .bid-seller-notice {
          text-align: center; padding: 12px;
          background: rgba(0,113,227,0.04);
          border: 1px solid rgba(0,113,227,0.12);
          border-radius: 12px; font-size: 13px; color: #6e6e73;
          margin-top: 14px;
        }
        .btn-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        /* ── Bid Feed Card ── */
        .bid-feed-card { padding: 20px; }
        .bid-feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .bid-feed-header h3 { font-size: 15px; font-weight: 700; color: #1d1d1f; }
        .bid-feed-count {
          background: rgba(0,113,227,0.08); color: #0071e3;
          border: 1px solid rgba(0,113,227,0.18);
          border-radius: 980px; padding: 2px 10px;
          font-size: 11px; font-weight: 700;
        }

        .detail-skeleton { padding: 0; }
        @media (max-width: 900px) {
          .detail-layout { grid-template-columns: 1fr; }
          .detail-right { position: static; }
        }
      `}</style>
    </div>
  );
};

export default AuctionDetail;
