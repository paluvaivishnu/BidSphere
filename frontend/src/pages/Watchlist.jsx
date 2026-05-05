import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import AuctionCard from '../components/AuctionCard';
import toast from 'react-hot-toast';

const Watchlist = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const { data } = await API.get('/users/watchlist');
      setAuctions(data.data || []);
    } catch (err) {
      toast.error('Failed to load your watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="list-header animate-fade-in" style={{ marginBottom: 32 }}>
        <div>
          <h1>⭐ My Watchlist</h1>
          <p className="text-muted">Items you are keeping an eye on</p>
        </div>
      </div>

      {loading ? (
        <div className="grid-cards" style={{ marginTop: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: 380, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 200 }} />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton" style={{ height: 20 }} />
                <div className="skeleton" style={{ height: 14, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-state animate-fade-in card" style={{ padding: '60px 24px', marginTop: 24 }}>
          <span className="empty-icon">🤍</span>
          <h3>Your watchlist is empty</h3>
          <p>Browse auctions and click the heart icon to save items here.</p>
          <Link to="/auctions" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid-cards animate-fade-in">
          {auctions.map(a => <AuctionCard key={a._id} auction={a} />)}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
