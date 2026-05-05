import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user: authUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/users/profile');
      setProfile(data.data);
      setForm({ name: data.data.name, phone: data.data.phone || '' });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      const { data } = await API.put('/auth/profile', { name: form.name, phone: form.phone });
      updateUser({ name: data.data.name });
      setProfile(p => ({ ...p, name: data.data.name, phone: form.phone }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f7', paddingTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6e6e73' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14 }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isSeller = profile.role === 'seller';
  const isBuyer = profile.role === 'buyer';
  const avatarLetter = profile.name?.[0]?.toUpperCase() || '?';
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const sellerStats = [
    { label: 'Total Listings',  value: profile.stats?.totalListings ?? 0,                                        icon: '📦', color: '#6e6e73' },
    { label: 'Active Now',      value: profile.stats?.active ?? 0,                                               icon: '🔴', color: '#ef4444' },
    { label: 'Completed',       value: profile.stats?.completed ?? 0,                                            icon: '✅', color: '#22c55e' },
    { label: 'Total Bids Rcvd', value: profile.stats?.totalBids ?? 0,                                            icon: '⚡', color: '#0071e3' },
    { label: 'Revenue Earned',  value: `₹${(profile.stats?.revenue ?? 0).toLocaleString('en-IN')}`,              icon: '💰', color: '#f59e0b' },
  ];

  const buyerStats = [
    { label: 'Bids Placed',     value: profile.stats?.totalBidsPlaced ?? 0,                                      icon: '⚡', color: '#0071e3' },
    { label: 'Auctions Won',    value: profile.stats?.auctionsWon ?? 0,                                          icon: '🏆', color: '#f59e0b' },
    { label: 'Total Spent',     value: `₹${(profile.stats?.totalSpent ?? 0).toLocaleString('en-IN')}`,           icon: '💸', color: '#ef4444' },
    { label: 'Watchlist',       value: profile.stats?.watchlistCount ?? 0,                                       icon: '❤️', color: '#ec4899' },
  ];

  const statCards = isSeller ? sellerStats : isBuyer ? buyerStats : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', paddingTop: 72 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Profile Card */}
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20,
        }}>
          {/* Cover gradient */}
          <div style={{ height: 90, background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)' }} />

          <div style={{ padding: '0 28px 28px', marginTop: -44 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: profile.avatar ? 'transparent' : 'linear-gradient(135deg, #0071e3, #005bb5)',
                border: '3px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 16px rgba(0,113,227,0.3)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : avatarLetter}
              </div>

              <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{
                    padding: '8px 18px', background: '#f5f5f7', border: '1px solid #e5e7eb',
                    borderRadius: 980, fontSize: 13, fontWeight: 600, color: '#1d1d1f',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ebebf0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f5f5f7'}
                  >
                    ✏️ Edit
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditing(false)} style={{
                      padding: '8px 14px', background: '#f5f5f7', border: '1px solid #e5e7eb',
                      borderRadius: 980, fontSize: 13, fontWeight: 600, color: '#6e6e73',
                      cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{
                      padding: '8px 18px', background: '#0071e3', border: 'none',
                      borderRadius: 980, fontSize: 13, fontWeight: 600, color: '#fff',
                      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(0,113,227,0.28)',
                    }}>
                      {saving ? 'Saving…' : '✓ Save'}
                    </button>
                  </>
                )}
                <button onClick={handleLogout} style={{
                  padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 980, fontSize: 13, fontWeight: 600, color: '#dc2626',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  Log Out
                </button>
              </div>
            </div>

            {/* Name / role */}
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Full Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', border: '1.5px solid #0071e3',
                      borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box',
                      fontWeight: 600, color: '#1d1d1f',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 00000 00000"
                    style={{
                      width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                      borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1d1d1f',
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.3px', margin: 0 }}>{profile.name}</h1>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 980,
                    background: profile.role === 'seller' ? 'rgba(245,158,11,0.1)' : profile.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(0,113,227,0.1)',
                    color: profile.role === 'seller' ? '#b45309' : profile.role === 'admin' ? '#dc2626' : '#0071e3',
                    border: `1px solid ${profile.role === 'seller' ? 'rgba(245,158,11,0.25)' : profile.role === 'admin' ? 'rgba(239,68,68,0.25)' : 'rgba(0,113,227,0.25)'}`,
                    textTransform: 'capitalize',
                  }}>{profile.role}</span>
                </div>
              </>
            )}

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📧', label: 'Email', value: profile.email },
                { icon: '📱', label: 'Phone', value: profile.phone || 'Not provided' },
                { icon: '📅', label: 'Member since', value: joinDate },
                { icon: '✅', label: 'Account status', value: profile.isActive ? 'Active' : 'Suspended' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid #f5f5f7' : 'none' }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{row.icon}</span>
                  <span style={{ fontSize: 12, color: '#aeaeb2', fontWeight: 600, width: 110, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 14, color: row.label === 'Account status' ? (profile.isActive ? '#16a34a' : '#dc2626') : '#1d1d1f', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {statCards.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 14 }}>
              {isSeller ? '📊 Seller Statistics' : '📊 Buyer Statistics'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {statCards.map((s, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 16, padding: '18px 16px',
                  border: '1px solid #e5e7eb', borderTop: `3px solid ${s.color}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.5px', wordBreak: 'break-all', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f5f5f7' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isSeller && (
              <>
                <Link to="/my-auctions" style={actionRowStyle}>
                  <span style={actionIconStyle('rgba(0,113,227,0.1)')}>📦</span>
                  <div style={{ flex: 1 }}>
                    <div style={actionTitleStyle}>My Auctions</div>
                    <div style={actionSubStyle}>Manage and monitor your listings</div>
                  </div>
                  <span style={arrowStyle}>→</span>
                </Link>
                <Link to="/create-auction" style={actionRowStyle}>
                  <span style={actionIconStyle('rgba(34,197,94,0.1)')}>➕</span>
                  <div style={{ flex: 1 }}>
                    <div style={actionTitleStyle}>Create Auction</div>
                    <div style={actionSubStyle}>List a new item for bidding</div>
                  </div>
                  <span style={arrowStyle}>→</span>
                </Link>
              </>
            )}
            {isBuyer && (
              <>
                <Link to="/won-auctions" style={actionRowStyle}>
                  <span style={actionIconStyle('rgba(245,158,11,0.1)')}>🏆</span>
                  <div style={{ flex: 1 }}>
                    <div style={actionTitleStyle}>Won Auctions</div>
                    <div style={actionSubStyle}>View and pay for your wins</div>
                  </div>
                  <span style={arrowStyle}>→</span>
                </Link>
                <Link to="/watchlist" style={actionRowStyle}>
                  <span style={actionIconStyle('rgba(236,72,153,0.1)')}>❤️</span>
                  <div style={{ flex: 1 }}>
                    <div style={actionTitleStyle}>My Watchlist</div>
                    <div style={actionSubStyle}>Auctions you're keeping an eye on</div>
                  </div>
                  <span style={arrowStyle}>→</span>
                </Link>
              </>
            )}
            <Link to="/auctions" style={{ ...actionRowStyle, borderBottom: 'none' }}>
              <span style={actionIconStyle('rgba(107,114,128,0.1)')}>🔍</span>
              <div style={{ flex: 1 }}>
                <div style={actionTitleStyle}>Browse Auctions</div>
                <div style={actionSubStyle}>Discover live and upcoming auctions</div>
              </div>
              <span style={arrowStyle}>→</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

const actionRowStyle = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '14px 24px', borderBottom: '1px solid #f5f5f7',
  textDecoration: 'none', transition: 'background 0.15s',
  cursor: 'pointer',
  background: 'transparent',
};

const actionIconStyle = (bg) => ({
  width: 36, height: 36, borderRadius: 10,
  background: bg, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
  fontSize: 16, flexShrink: 0,
});

const actionTitleStyle = { fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 1 };
const actionSubStyle = { fontSize: 12, color: '#6e6e73' };
const arrowStyle = { color: '#aeaeb2', fontSize: 16 };

export default Profile;
