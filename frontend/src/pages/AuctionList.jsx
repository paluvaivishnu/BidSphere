import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';
import AuctionCard from '../components/AuctionCard';
import ActivityFeed from '../components/ActivityFeed';
import ActivityTicker from '../components/ActivityTicker';
import StatsBar from '../components/StatsBar';
import LoadingCard from '../components/LoadingCard';
import { useSocket } from '../context/SocketContext';

const CATEGORIES = ['All','Electronics','Fashion','Furniture','Vehicles','Art','Jewelry','Sports','Other'];
const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest First' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

const AuctionList = () => {
  const [auctions,   setAuctions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [sort,       setSort]       = useState('ending-soon');
  const [status,     setStatus]     = useState('active');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [livePrices, setLivePrices] = useState({});
  const [feedEvents, setFeedEvents] = useState([]);

  const joinedRoomsRef = useRef(new Set());
  const auctionsRef = useRef([]);
  auctionsRef.current = auctions;

  const { joinAuction, leaveAuction, onBidUpdate, onBidActivity, connected } = useSocket();

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 12, sort, status,
        ...(search && { search }),
        ...(category !== 'All' && { category }),
      });
      const { data } = await API.get(`/auctions?${params}`);
      setAuctions(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort, status]);

  useEffect(() => { setPage(1); }, [search, category, sort, status]);
  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  useEffect(() => {
    const fetchRecentBids = async () => {
      try {
        const { data } = await API.get('/bids/recent?limit=10');
        const events = (data.data || []).map(bid => ({
          id: bid._id,
          ts: new Date(bid.createdAt).getTime(),
          icon: '⚡',
          text: `${bid.userId?.name?.split(' ')[0] || 'Someone'} bid ₹${bid.bidAmount?.toLocaleString('en-IN')} on ${(bid.auctionId?.title || 'an item').split(' ').slice(0, 4).join(' ')}`,
          color: '#0071e3',
        }));
        setFeedEvents(events);
      } catch (e) {
        console.error('Failed to load recent bids:', e);
      }
    };
    fetchRecentBids();
  }, []);

  useEffect(() => {
    if (!connected || auctions.length === 0) return;
    const ids = auctions.map(a => a._id);
    joinedRoomsRef.current.forEach(oldId => {
      if (!ids.includes(oldId)) { leaveAuction(oldId); joinedRoomsRef.current.delete(oldId); }
    });
    ids.forEach(id => {
      if (!joinedRoomsRef.current.has(id)) { joinAuction(id); joinedRoomsRef.current.add(id); }
    });
    return () => { joinedRoomsRef.current.forEach(id => leaveAuction(id)); joinedRoomsRef.current.clear(); };
  }, [auctions, connected, joinAuction, leaveAuction]);

  useEffect(() => {
    const off = onBidUpdate((data) => {
      if (data.auctionId || data.bid?.auctionId) {
        const aId = data.auctionId || data.bid?.auctionId;
        const newPrice = data.currentBid;
        setLivePrices(prev => ({ ...prev, [aId]: newPrice }));
        setAuctions(prev => prev.map(a =>
          a._id === aId
            ? { ...a, currentBid: newPrice, totalBids: data.totalBids ?? (a.totalBids || 0) + 1 }
            : a
        ));
      }
    });
    return off;
  }, [connected, onBidUpdate]);

  useEffect(() => {
    const off = onBidActivity((data) => {
      const { auctionTitle, currentBid, currentBidder } = data;
      const shortTitle = (auctionTitle || 'an item').split(' ').slice(0, 4).join(' ');
      const name = (currentBidder?.name || 'Someone').split(' ')[0];
      setFeedEvents(prev => [{
        id: `${Date.now()}-${Math.random()}`,
        ts: Date.now(),
        icon: '⚡',
        text: `${name} bid ₹${currentBid?.toLocaleString('en-IN')} on ${shortTitle}`,
        color: '#0071e3',
      }, ...prev].slice(0, 10));
    });
    return off;
  }, [connected, onBidActivity]);

  const tickerActivities = feedEvents.map(evt => ({
    id: evt.id,
    bidderName: evt.text.split(' bid ')[0] || 'Someone',
    amount: parseInt(evt.text.match(/₹([\d,]+)/)?.[1]?.replace(/,/g, '') || '0'),
    itemName: evt.text.split(' on ').slice(1).join(' on ') || 'an item',
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', paddingTop: 60 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 64px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1d1d1f', marginBottom: 4, letterSpacing: '-0.3px' }}>
            Browse Auctions
          </h1>
          <p style={{ fontSize: 13, color: '#6e6e73', display: 'flex', alignItems: 'center', gap: 6 }}>
            {status === 'active' && <span className="live-ping-wrap"><span className="live-ping-dot" /></span>}
            {total} {status === 'active' ? 'live' : 'ended'} auction{total !== 1 ? 's' : ''}
            {connected && status === 'active' && (
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, marginLeft: 4 }}>● Connected</span>
            )}
          </p>
        </div>

        {/* Stats bar */}
        {status === 'active' && <StatsBar liveCount={total} auctions={auctions} />}

        {/* ── Filter bar ── */}
        <div style={{
          background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: 16, padding: 16, marginBottom: 18,
          display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8 }}>
              <input
                id="auction-search"
                type="text"
                placeholder="Search auctions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchAuctions()}
                style={{
                  flex: 1, background: '#f5f5f7', border: '1px solid #e5e7eb',
                  borderRadius: 980, padding: '9px 16px', color: '#1d1d1f', fontSize: 14,
                  transition: 'all 0.2s ease',
                }}
                className="form-input"
                onFocus={e => { e.target.style.borderColor = '#0071e3'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f5f5f7'; }}
              />
              <button onClick={fetchAuctions} style={{
                padding: '9px 20px', background: '#0071e3', color: '#fff',
                borderRadius: 980, fontWeight: 600, fontSize: 14, border: 'none',
                cursor: 'pointer', transition: 'background 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,113,227,0.25)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#005bb5'}
                onMouseLeave={e => e.currentTarget.style.background = '#0071e3'}
              >
                Search
              </button>
            </div>

            {/* Live / Ended toggle */}
            <div style={{
              display: 'flex', background: '#f5f5f7', border: '1px solid #e5e7eb',
              borderRadius: 980, overflow: 'hidden', padding: 3,
            }}>
              {['active', 'completed'].map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: '7px 16px', fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: 'pointer', borderRadius: 980,
                  background: status === s ? '#0071e3' : 'transparent',
                  color: status === s ? '#fff' : '#6e6e73',
                  transition: 'all 0.2s ease',
                  boxShadow: status === s ? '0 2px 8px rgba(0,113,227,0.25)' : 'none',
                }}>
                  {s === 'active' ? '🔴 Live' : 'Ended'}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select id="auction-sort" value={sort} onChange={e => setSort(e.target.value)} style={{
              background: '#f5f5f7', border: '1px solid #e5e7eb',
              borderRadius: 980, padding: '9px 16px',
              color: '#1d1d1f', fontSize: 13, cursor: 'pointer',
            }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#fff' }}>{o.label}</option>)}
            </select>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600,
                borderRadius: 980, border: '1px solid',
                cursor: 'pointer', transition: 'all 0.18s ease',
                background: category === c ? '#0071e3' : 'transparent',
                borderColor: category === c ? '#0071e3' : '#e5e7eb',
                color: category === c ? '#fff' : '#6e6e73',
                boxShadow: category === c ? '0 2px 8px rgba(0,113,227,0.2)' : 'none',
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Activity ticker */}
        {status === 'active' && tickerActivities.length > 0 && (
          <ActivityTicker activities={tickerActivities} />
        )}

        {/* ── Main content: Grid + Sidebar ── */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 20 }}>

          {/* Auction grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                {[...Array(8)].map((_, i) => <LoadingCard key={i} />)}
              </div>
            ) : auctions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                {auctions.map(a => (
                  <AuctionCard key={a._id} auction={a} overridePrice={livePrices[a._id]} />
                ))}
              </div>
            ) : (
              <div style={{
                padding: '64px 24px', textAlign: 'center',
                border: '2px dashed #e5e7eb', borderRadius: 20,
                background: '#ffffff',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🏷️</div>
                <p style={{ color: '#1d1d1f', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No auctions found</p>
                <p style={{ color: '#6e6e73', fontSize: 13 }}>Try adjusting your filters or check back later</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
                  padding: '9px 20px', fontSize: 13, fontWeight: 600,
                  background: '#ffffff', border: '1px solid #e5e7eb',
                  color: page <= 1 ? '#d1d5db' : '#1d1d1f', borderRadius: 980,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: '#6e6e73', fontWeight: 500 }}>
                  Page {page} of {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{
                  padding: '9px 20px', fontSize: 13, fontWeight: 600,
                  background: '#ffffff', border: '1px solid #e5e7eb',
                  color: page >= totalPages ? '#d1d5db' : '#1d1d1f', borderRadius: 980,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Activity sidebar */}
          {status === 'active' && <ActivityFeed events={feedEvents} />}
        </div>
      </div>
    </div>
  );
};

export default AuctionList;
