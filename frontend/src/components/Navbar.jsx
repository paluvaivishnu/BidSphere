import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    padding: '6px 14px',
    borderRadius: 980,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    color: isActive(path) ? '#0071e3' : '#1d1d1f',
    background: isActive(path) ? 'rgba(0,113,227,0.08)' : 'transparent',
    letterSpacing: '-0.1px',
  });

  const roleColor = (role) =>
    role === 'buyer' ? '#22c55e' : role === 'seller' ? '#0071e3' : '#ef4444';

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 60,
        background: scrolled ? 'rgba(255,255,255,0.92)' : '#ffffff',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        transition: 'background 0.25s ease, border-color 0.25s ease',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, marginRight: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #0071e3, #005bb5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
            }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1d1d1f', letterSpacing: '-0.3px' }}>
              Bid<span style={{ color: '#0071e3' }}>Sphere</span>
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Link to="/auctions" style={navLinkStyle('/auctions')}>Auctions</Link>
            {user?.role === 'buyer' && (<>
              <Link to="/watchlist" style={navLinkStyle('/watchlist')}>Watchlist</Link>
              <Link to="/won-auctions" style={navLinkStyle('/won-auctions')}>Won Items</Link>
            </>)}
            {(user?.role === 'seller' || user?.role === 'admin') && (<>
              <Link to="/create-auction" style={navLinkStyle('/create-auction')}>List Item</Link>
              <Link to="/my-auctions" style={navLinkStyle('/my-auctions')}>My Auctions</Link>
            </>)}
            {user?.role === 'admin' && <Link to="/admin" style={navLinkStyle('/admin')}>Admin</Link>}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {connected && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 980, fontSize: 12, color: '#16a34a', fontWeight: 600,
              }}>
                <span className="live-ping-wrap"><span className="live-ping-dot" /></span>
                Live
              </div>
            )}
            {user ? (<>
              <Link to="/profile" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px 5px 8px',
                background: '#f5f5f7', border: '1px solid #e5e7eb',
                borderRadius: 980, textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ebebf0'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f7'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: user.avatar ? 'transparent' : '#0071e3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.name[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: roleColor(user.role),
                  background: `${roleColor(user.role)}15`,
                  padding: '2px 7px', borderRadius: 980,
                }}>
                  {user.role}
                </span>
              </Link>
              <button onClick={handleLogout} style={{
                padding: '7px 16px', background: '#f5f5f7',
                border: '1px solid #e5e7eb', borderRadius: 980,
                color: '#6e6e73', fontSize: 13, cursor: 'pointer', fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ebebf0'; e.currentTarget.style.color = '#1d1d1f'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f7'; e.currentTarget.style.color = '#6e6e73'; }}
              >
                Log out
              </button>
            </>) : (<>
              <Link to="/login" style={{
                fontSize: 14, color: '#6e6e73', fontWeight: 500,
                padding: '7px 16px', textDecoration: 'none',
                borderRadius: 980, transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#1d1d1f'}
                onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
              >
                Log In
              </Link>
              <Link to="/register" style={{
                padding: '8px 18px', background: '#0071e3',
                color: '#fff', borderRadius: 980, fontSize: 14, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,113,227,0.28)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#005bb5'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,113,227,0.38)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0071e3'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,113,227,0.28)'; }}
              >
                Sign Up
              </Link>
            </>)}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #e5e7eb', zIndex: 999, padding: '10px 0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          <Link to="/auctions" style={{ display: 'block', padding: '12px 24px', fontSize: 15, color: '#1d1d1f' }}>Auctions</Link>
          {user?.role === 'buyer' && (<>
            <Link to="/watchlist" style={{ display: 'block', padding: '12px 24px', fontSize: 15, color: '#1d1d1f' }}>Watchlist</Link>
            <Link to="/won-auctions" style={{ display: 'block', padding: '12px 24px', fontSize: 15, color: '#1d1d1f' }}>Won Items</Link>
          </>)}
          {user ? (
            <button onClick={handleLogout} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '12px 24px', fontSize: 15, color: '#ef4444',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Log out
            </button>
          ) : (<>
            <Link to="/login" style={{ display: 'block', padding: '12px 24px', fontSize: 15, color: '#1d1d1f' }}>Log In</Link>
            <div style={{ padding: '10px 24px' }}>
              <Link to="/register" style={{
                display: 'block', padding: '12px', background: '#0071e3',
                color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, textAlign: 'center',
              }}>
                Sign Up
              </Link>
            </div>
          </>)}
        </div>
      )}
    </>
  );
};

export default Navbar;
