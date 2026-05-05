import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import AuctionCard from '../components/AuctionCard';

const FEATURES = [
  { icon: '⚡', title: 'Real-Time Bidding', desc: 'Every bid appears instantly — no page refresh needed.' },
  { icon: '🔒', title: 'Validated Bids',   desc: 'Only genuine higher bids accepted.' },
  { icon: '🏆', title: 'Auto Winner',       desc: 'Winner declared automatically when timer ends.' },
  { icon: '🔔', title: 'Notifications',     desc: 'Email alerts for winners and sellers.' },
];

const Home = () => {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [endingSoon,   setEndingSoon]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [liveRes, soonRes] = await Promise.all([
          API.get('/auctions?limit=8&sort=newest&status=active'),
          API.get('/auctions?limit=4&sort=ending-soon&status=active'),
        ]);
        setLiveAuctions(liveRes.data.data || []);
        setEndingSoon(soonRes.data.data   || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const Skeleton = () => (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '4/3', borderRadius: 0 }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '55%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 20, width: '45%', marginTop: 4, borderRadius: 6 }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>

      {/* ── Hero ── */}
      <section style={{ borderBottom: '1px solid #e5e7eb', marginTop: 60, background: '#ffffff' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '72px 32px',
          display: 'flex', alignItems: 'center', gap: 80,
        }}>

          {/* Left: copy */}
          <div style={{ maxWidth: 500 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.15)',
              borderRadius: 980, padding: '4px 12px', marginBottom: 20,
              fontSize: 12, fontWeight: 600, color: '#0071e3',
            }}>
              <span className="live-ping-wrap"><span className="live-ping-dot" /></span>
              Live Auctions Happening Now
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#1d1d1f', lineHeight: 1.1, marginBottom: 18, letterSpacing: '-0.5px' }}>
              Buy &amp; Sell at<br />
              <span style={{ color: '#0071e3' }}>Live Auction.</span>
            </h1>
            <p style={{ fontSize: 16, color: '#6e6e73', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
              BidSphere is a real-time auction platform. Browse live auctions, place bids instantly, and win great deals.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/auctions" style={{
                padding: '13px 28px', background: '#0071e3', color: '#fff',
                borderRadius: 980, fontWeight: 600, fontSize: 15,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0,113,227,0.32)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#005bb5'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,113,227,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0071e3'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,113,227,0.32)'; }}
              >
                Browse Auctions
              </Link>
              <Link to="/register" style={{
                padding: '13px 28px', background: '#f5f5f7', color: '#1d1d1f',
                border: '1px solid #e5e7eb', borderRadius: 980, fontWeight: 600, fontSize: 15,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ebebf0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f7'; }}
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Right: preview cards */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {/* Floating chip 1 */}
            <div style={{
              position: 'absolute', top: -12, right: 16, zIndex: 10,
              background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              animation: 'hero-float 5s ease-in-out infinite',
            }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0071e3', lineHeight: 1 }}>1,284</div>
                <div style={{ fontSize: 9, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Bids</div>
              </div>
            </div>

            {/* Floating chip 2 */}
            <div style={{
              position: 'absolute', bottom: -12, left: -16, zIndex: 10,
              background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              animation: 'hero-float 6s ease-in-out infinite reverse',
            }}>
              <span style={{ fontSize: 16 }}>🏷️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>42</div>
                <div style={{ fontSize: 9, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auctions</div>
              </div>
            </div>

            {/* Scrollable preview cards */}
            <div style={{
              display: 'flex', gap: 16, overflowX: 'auto', padding: '20px 4px 28px',
              scrollSnapType: 'x mandatory', scrollBehavior: 'smooth',
              position: 'relative', zIndex: 2,
            }} className="hide-scroll">

              {/* Preview Card 1 */}
              <div style={{
                minWidth: 220, scrollSnapAlign: 'start',
                background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20,
                padding: '18px 18px', cursor: 'grab',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span className="live-ping-wrap"><span className="live-ping-dot" /></span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '0.5px' }}>LIVE AUCTION</span>
                </div>
                <div style={{ width: '100%', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: '#f5f5f7' }}>
                  <img src="/rolex.png" alt="Vintage Watch"
                       style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 13, color: '#1d1d1f', marginBottom: 2, fontWeight: 700 }}>Vintage Rolex Submariner</div>
                <div style={{ fontSize: 11, color: '#6e6e73', marginBottom: 10 }}>Jewelry · 47 bids</div>
                <div style={{ fontSize: 10, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Current Bid</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0071e3', letterSpacing: '-0.5px' }}>₹2,45,000</div>
                <div style={{ marginTop: 10, background: '#f0f0f5', borderRadius: 4, height: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #0071e3, #005bb5)', width: '35%', borderRadius: 4 }} />
                </div>
              </div>

              {/* Preview Card 2 */}
              <div style={{
                minWidth: 220, scrollSnapAlign: 'start',
                background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20,
                padding: '18px 18px', cursor: 'grab',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.5px' }}>UPCOMING</span>
                </div>
                <div style={{ width: '100%', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: '#f0ece6' }}>
                  <img src="/chair.png" alt="Modern Chair"
                       style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 13, color: '#1d1d1f', marginBottom: 2, fontWeight: 700 }}>Mid-Century Modern Chair</div>
                <div style={{ fontSize: 11, color: '#6e6e73', marginBottom: 10 }}>Furniture · 0 bids</div>
                <div style={{ fontSize: 10, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Starting Bid</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#6e6e73', letterSpacing: '-0.5px' }}>₹12,000</div>
                <div style={{ marginTop: 10, background: '#f0f0f5', borderRadius: 4, height: 3 }} />
              </div>

              {/* Preview Card 3 */}
              <div style={{
                minWidth: 220, scrollSnapAlign: 'start',
                background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20,
                padding: '18px 18px', cursor: 'grab',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span className="live-ping-wrap"><span className="live-ping-dot" /></span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '0.5px' }}>LIVE AUCTION</span>
                </div>
                <div style={{ width: '100%', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: '#f5f5f7' }}>
                  <img src="/mustang.png" alt="Ford Mustang"
                       style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 13, color: '#1d1d1f', marginBottom: 2, fontWeight: 700 }}>1969 Ford Mustang Mach 1</div>
                <div style={{ fontSize: 11, color: '#6e6e73', marginBottom: 10 }}>Vehicles · 128 bids</div>
                <div style={{ fontSize: 10, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Current Bid</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0071e3', letterSpacing: '-0.5px' }}>₹48,50,000</div>
                <div style={{ marginTop: 10, background: '#f0f0f5', borderRadius: 4, height: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #0071e3, #005bb5)', width: '85%', borderRadius: 4 }} />
                </div>
              </div>

            </div>

            <style>{`
              .hide-scroll::-webkit-scrollbar { display: none; }
              .hide-scroll { -ms-overflow-style: none; }
              @keyframes hero-float {
                0%, 100% { transform: translateY(0px); }
                50%      { transform: translateY(-8px); }
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* ── Live Auctions ── */}
      <section style={{ padding: '44px 0', borderBottom: '1px solid #e5e7eb', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="live-ping-wrap"><span className="live-ping-dot" /></span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.3px' }}>Live Auctions</h2>
              {liveAuctions.length > 0 && (
                <span style={{ fontSize: 12, color: '#6e6e73', fontWeight: 500 }}>{liveAuctions.length} active</span>
              )}
            </div>
            <Link to="/auctions" style={{ fontSize: 13, color: '#0071e3', fontWeight: 600 }}>View all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} />)}
            </div>
          ) : liveAuctions.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {liveAuctions.map(a => <AuctionCard key={a._id} auction={a} />)}
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: 20, background: '#ffffff' }}>
              <p style={{ color: '#6e6e73', fontSize: 14, marginBottom: 8 }}>No live auctions right now.</p>
              <Link to="/register" style={{ color: '#0071e3', fontSize: 13, fontWeight: 600 }}>Start selling →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Ending Soon ── */}
      {!loading && endingSoon.length > 0 && (
        <section style={{ padding: '44px 0', borderBottom: '1px solid #e5e7eb', background: '#f5f5f7' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1d1d1f', marginBottom: 2, letterSpacing: '-0.3px' }}>⏳ Ending Soon</h2>
                <p style={{ fontSize: 13, color: '#6e6e73' }}>Place your bid before time runs out</p>
              </div>
              <Link to="/auctions?sort=ending-soon" style={{ fontSize: 13, color: '#0071e3', fontWeight: 600 }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {endingSoon.map(a => <AuctionCard key={a._id} auction={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section style={{ padding: '44px 0 64px', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
            Why BidSphere
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1d1d1f', marginBottom: 28, letterSpacing: '-0.3px' }}>
            Built for real auctions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: '#f9f9fb', border: '1px solid #e5e7eb', borderRadius: 16, padding: 22,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f9f9fb'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
