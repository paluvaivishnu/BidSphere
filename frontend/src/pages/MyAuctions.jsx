import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import CountdownTimer from '../components/CountdownTimer';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null); // tracks which auction is being acted on

  const fetchMyAuctions = async () => {
    try {
      const { data } = await API.get('/auctions/my');
      setAuctions(data.data || []);
    } catch (err) {
      toast.error('Failed to load your auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyAuctions(); }, []);

  const handleEnd = async (a) => {
    if (!window.confirm(`End "${a.title}" now? The current highest bidder will win.`)) return;
    setActionId(a._id + '_end');
    try {
      await API.put(`/auctions/${a._id}/end`);
      toast.success('Auction ended successfully!');
      fetchMyAuctions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end auction');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone and all bids will be removed.`)) return;
    setActionId(a._id + '_del');
    try {
      await API.delete(`/auctions/${a._id}`);
      toast.success('Auction deleted');
      setAuctions(prev => prev.filter(x => x._id !== a._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete auction');
    } finally {
      setActionId(null);
    }
  };

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    completed: auctions.filter(a => a.status === 'completed').length,
    totalBids: auctions.reduce((s, a) => s + (a.totalBids || 0), 0),
    totalEarned: auctions.filter(a => a.status === 'completed' && a.currentBid > 0).reduce((s, a) => s + a.currentBid, 0),
  };

  return (
    <div className="page-wrapper">
      <div className="my-header animate-fade-in">
        <div>
          <h1>My Auctions</h1>
          <p className="text-muted">Manage your auction listings</p>
        </div>
        <Link to="/create-auction" className="btn btn-primary">+ Create New Auction</Link>
      </div>

      {/* Stats */}
      <div className="my-stats animate-fade-in">
        {[
          { label: 'Total Listings', value: stats.total,       icon: '📦', accent: '#6e6e73' },
          { label: 'Active Now',     value: stats.active,      icon: '🔴', accent: '#ef4444' },
          { label: 'Completed',      value: stats.completed,   icon: '✅', accent: '#22c55e' },
          { label: 'Total Bids',     value: stats.totalBids,   icon: '⚡', accent: '#0071e3' },
          { label: 'Revenue Earned', value: `₹${stats.totalEarned.toLocaleString('en-IN')}`, icon: '💰', accent: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="my-stat-card card" style={{ borderTopColor: s.accent }}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-val" style={{ color: s.accent }}>{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card" style={{ padding: 22 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10, borderRadius: 8 }} />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-state animate-fade-in card" style={{ padding: '48px 24px' }}>
          <span className="empty-icon">🏷️</span>
          <h3>No auctions yet</h3>
          <p>Create your first auction listing to start selling!</p>
          <Link to="/create-auction" className="btn btn-primary" style={{ marginTop: 16 }}>Create Auction</Link>
        </div>
      ) : (
        <div className="my-auctions-list animate-fade-in">
          {auctions.map(a => {
            const imageUrl = a.image
              ? a.image.startsWith('http') ? a.image : `${API_URL}${a.image}`
              : null;
            const isLive = a.status === 'active' && new Date() < new Date(a.endTime);
            const currentPrice = a.currentBid || a.basePrice;
            const endingId = a._id + '_end';
            const delId = a._id + '_del';

            return (
              <div key={a._id} className="my-auction-row card">
                {/* Image */}
                <div className="my-auction-img">
                  {imageUrl ? <img src={imageUrl} alt={a.title} /> : <span>🛍️</span>}
                </div>

                {/* Info */}
                <div className="my-auction-info">
                  <div className="my-auction-title-row">
                    <h3 className="my-auction-title">{a.title}</h3>
                    {isLive ? (
                      <span className="my-badge-live">🔴 LIVE</span>
                    ) : (
                      <span className={`badge ${a.status === 'completed' ? 'badge-completed' : 'badge-cancelled'}`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                  <div className="my-auction-meta">
                    <span>📦 {a.category}</span>
                    <span>⚡ {a.totalBids || 0} bids</span>
                    {isLive && <CountdownTimer endTime={a.endTime} />}
                  </div>
                </div>

                {/* Price */}
                <div className="my-auction-price-block">
                  <div className="my-price-label">{a.currentBid > 0 ? 'Current Bid' : 'Base Price'}</div>
                  <div className="my-price-value">₹{currentPrice.toLocaleString('en-IN')}</div>
                  {a.currentBidder && <div className="my-price-bidder">by {a.currentBidder?.name}</div>}
                </div>

                {/* Actions */}
                <div className="my-auction-actions">
                  {a.winner && <div className="winner-chip">🏆 {a.winner?.name}</div>}

                  <Link to={`/auctions/${a._id}`} className="btn btn-secondary btn-sm">View →</Link>

                  {/* End Auction — only for active auctions */}
                  {isLive && (
                    <button
                      className="btn btn-sm"
                      disabled={actionId === endingId}
                      onClick={() => handleEnd(a)}
                      style={{
                        background: 'rgba(245,158,11,0.1)', color: '#b45309',
                        border: '1px solid rgba(245,158,11,0.3)', borderRadius: 980,
                        fontSize: 12, fontWeight: 600, padding: '5px 12px',
                        cursor: 'pointer', transition: 'all 0.2s',
                        opacity: actionId === endingId ? 0.6 : 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                    >
                      {actionId === endingId ? '⏳' : '⏹ End'}
                    </button>
                  )}

                  {/* Delete — only if no bids or already ended */}
                  <button
                    className="btn btn-sm"
                    disabled={actionId === delId}
                    onClick={() => handleDelete(a)}
                    style={{
                      background: 'rgba(239,68,68,0.08)', color: '#dc2626',
                      border: '1px solid rgba(239,68,68,0.2)', borderRadius: 980,
                      fontSize: 12, fontWeight: 600, padding: '5px 12px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      opacity: actionId === delId ? 0.6 : 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  >
                    {actionId === delId ? '⏳' : '🗑 Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .my-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .my-header h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #1d1d1f; letter-spacing: -0.3px; }
        .my-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px; margin-bottom: 24px;
        }
        .my-stat-card { padding: 20px; text-align: center; border-top: 3px solid transparent; }
        .stat-icon { font-size: 24px; display: block; margin-bottom: 8px; }
        .stat-val { font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px; word-break: break-all; }
        .stat-lbl { font-size: 11px; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700; }
        .my-auctions-list { display: flex; flex-direction: column; gap: 10px; }
        .my-auction-row {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 16px;
          transition: all 0.2s ease;
        }
        .my-auction-row:hover { border-color: rgba(0,113,227,0.25); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .my-auction-img {
          width: 60px; height: 60px; border-radius: 12px;
          background: #f5f5f7; border: 1px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; overflow: hidden; flex-shrink: 0;
        }
        .my-auction-img img { width: 100%; height: 100%; object-fit: cover; }
        .my-auction-info { flex: 1; min-width: 0; }
        .my-auction-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; flex-wrap: wrap; }
        .my-auction-title { font-size: 15px; font-weight: 700; color: #1d1d1f; }
        .my-badge-live {
          background: #ef4444; color: white;
          font-size: 10px; font-weight: 700;
          padding: 3px 9px; border-radius: 980px;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 6px rgba(239,68,68,0.3);
        }
        .my-auction-meta { display: flex; gap: 14px; font-size: 12px; color: #6e6e73; align-items: center; flex-wrap: wrap; }
        .my-auction-price-block { text-align: right; min-width: 120px; flex-shrink: 0; }
        .my-price-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #aeaeb2; font-weight: 700; margin-bottom: 2px; }
        .my-price-value { font-size: 18px; font-weight: 800; color: #0071e3; letter-spacing: -0.5px; }
        .my-price-bidder { font-size: 11px; color: #6e6e73; }
        .my-auction-actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0; }
        .winner-chip {
          font-size: 11px; font-weight: 700;
          color: #16a34a;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          padding: 3px 10px; border-radius: 980px;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .my-header { flex-direction: column; gap: 14px; align-items: flex-start; }
          .my-auction-row { flex-wrap: wrap; }
          .my-auction-price-block { text-align: left; min-width: auto; }
          .my-auction-actions { flex-direction: row; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
};

export default MyAuctions;
