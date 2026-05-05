import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import AnimatedStat from '../components/AnimatedStat';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [statsRes, usersRes, auctionsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users?limit=20'),
        API.get('/admin/auctions?limit=20'),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data || []);
      setAuctions(auctionsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const updateUserRole = async (userId, role) => {
    try {
      await API.patch(`/admin/users/${userId}`, { role });
      toast.success('User role updated');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await API.patch(`/admin/users/${userId}`, { isActive: !isActive });
      toast.success(isActive ? 'User deactivated' : 'User activated');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !isActive } : u));
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <h1 style={{ marginBottom: 28 }}>Admin Dashboard</h1>
        <div className="admin-stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users',    label: '👥 Users' },
    { id: 'auctions', label: '🏷️ Auctions' },
  ];

  return (
    <div className="page-wrapper">
      <div className="admin-header animate-fade-in">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>Platform management and analytics</p>
        </div>
        <div className="admin-badge">
          <span>🔑</span> Admin Panel
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs animate-fade-in">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && stats && (
        <div className="animate-fade-in">
          <div className="admin-stats-grid">
            {[
              { label: 'Total Users',     value: stats.users.total,     icon: '👥', accent: '#22c55e', sub: `${stats.users.buyers} buyers · ${stats.users.sellers} sellers` },
              { label: 'Active Auctions', value: stats.auctions.active, icon: '🔴', accent: '#ef4444', sub: `${stats.auctions.total} total · ${stats.auctions.completed} completed` },
              { label: 'Total Bids',      value: stats.totalBids,       icon: '⚡', accent: '#0071e3', sub: 'All-time platform bids' },
              { label: 'Total Revenue',   value: stats.totalRevenue || 0, icon: '💰', accent: '#f59e0b', prefix: '₹', sub: 'From completed transactions' },
            ].map((s, i) => (
              <div key={i} style={{ animationDelay: `${i * 80}ms` }}>
                <AnimatedStat
                  value={s.value} label={s.label} icon={s.icon}
                  accent={s.accent} sub={s.sub} prefix={s.prefix || ''}
                />
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="admin-recent-grid">
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 18, fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>🕒 Recent Auctions</h3>
              {stats.recentAuctions?.map(a => (
                <div key={a._id} className="recent-row">
                  <div className="recent-dot" style={{ background: a.status === 'active' ? '#22c55e' : '#d1d5db' }} />
                  <div className="recent-info">
                    <div className="recent-name">{a.title}</div>
                    <div className="recent-meta">by {a.sellerId?.name} · {new Date(a.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className={`badge ${a.status === 'active' ? 'badge-active' : 'badge-completed'}`} style={{ fontSize: 10 }}>
                    {a.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 18, fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>👤 Recent Users</h3>
              {stats.recentUsers?.map(u => (
                <div key={u._id} className="recent-row">
                  <div className="recent-avatar">{u.name[0].toUpperCase()}</div>
                  <div className="recent-info">
                    <div className="recent-name">{u.name}</div>
                    <div className="recent-meta">{u.email}</div>
                  </div>
                  <span className={`user-role-chip role-${u.role}`}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div className="admin-table-card card">
            <div className="table-header">
              <h3>All Users ({users.length})</h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th><th>Email</th><th>Role</th>
                    <th>Status</th><th>Violations</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={!u.isActive || u.isFlagged ? { background: 'rgba(239,68,68,0.03)' } : {}}>
                      <td>
                        <div className="table-user">
                          <div className="table-avatar" style={{ background: u.isFlagged ? '#ef4444' : undefined }}>
                            {u.isFlagged ? '🚫' : u.name[0].toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="table-muted">{u.email}</td>
                      <td>
                        {u.role !== 'admin' ? (
                          <select className="role-select" value={u.role}
                            onChange={(e) => updateUserRole(u._id, e.target.value)}>
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                          </select>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Admin</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`badge ${u.isActive ? 'badge-active' : 'badge-cancelled'}`}>
                            {u.isActive ? 'Active' : 'Banned'}
                          </span>
                          {u.isFlagged && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              background: 'rgba(239,68,68,0.1)', color: '#dc2626',
                              border: '1px solid rgba(239,68,68,0.25)',
                              padding: '2px 7px', borderRadius: 980,
                              whiteSpace: 'nowrap',
                            }}>🤖 Fraud Flag</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {u.fraudViolations > 0 ? (
                          <span style={{
                            fontWeight: 700, fontSize: 13,
                            color: u.fraudViolations >= 3 ? '#dc2626' : '#f59e0b',
                          }}>
                            {u.fraudViolations} ⚠️
                          </span>
                        ) : (
                          <span style={{ color: '#aeaeb2', fontSize: 13 }}>0</span>
                        )}
                      </td>
                      <td className="table-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        {u.role !== 'admin' && (
                          <div className="table-actions">
                            {/* Unban gets a bright green style; Ban gets red */}
                            {!u.isActive || u.isFlagged ? (
                              <button
                                style={{
                                  padding: '5px 14px', borderRadius: 980, fontSize: 12, fontWeight: 700,
                                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                  color: '#fff', border: 'none', cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(34,197,94,0.35)',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                onClick={() => toggleUserStatus(u._id, u.isActive)}
                              >
                                ✓ Unban
                              </button>
                            ) : (
                              <button className="btn btn-danger btn-sm"
                                onClick={() => toggleUserStatus(u._id, u.isActive)}>
                                Ban
                              </button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id, u.name)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── AUCTIONS ── */}
      {activeTab === 'auctions' && (
        <div className="animate-fade-in">
          <div className="admin-table-card card">
            <div className="table-header">
              <h3>All Auctions ({auctions.length})</h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th><th>Seller</th><th>Base Price</th>
                    <th>Current Bid</th><th>Bids</th><th>Status</th><th>Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map(a => (
                    <tr key={a._id}>
                      <td>
                        <a href={`/auctions/${a._id}`} style={{ color: '#0071e3', fontWeight: 600, fontSize: 14 }}>
                          {a.title.length > 30 ? a.title.slice(0, 30) + '...' : a.title}
                        </a>
                      </td>
                      <td className="table-muted">{a.sellerId?.name}</td>
                      <td style={{ color: '#1d1d1f' }}>₹{a.basePrice?.toLocaleString('en-IN')}</td>
                      <td style={{ color: '#0071e3', fontWeight: 700 }}>
                        ₹{(a.currentBid || a.basePrice)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ color: '#1d1d1f' }}>{a.totalBids || 0}</td>
                      <td>
                        <span className={`badge ${a.status === 'active' ? 'badge-active' : a.status === 'completed' ? 'badge-completed' : 'badge-cancelled'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="table-muted">{new Date(a.endTime).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .admin-header h1 { font-size: 26px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.4px; }
        .admin-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 980px; font-size: 13px; color: #ef4444; font-weight: 600;
        }
        .admin-tabs {
          display: flex; gap: 4px; margin-bottom: 24px;
          background: #ffffff; border: 1px solid #e5e7eb;
          border-radius: 14px; padding: 5px; width: fit-content;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .admin-tab {
          padding: 9px 20px; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          color: #6e6e73; background: none; border: none;
          cursor: pointer; transition: all 0.2s ease;
        }
        .admin-tab.active { background: #0071e3; color: white; box-shadow: 0 2px 8px rgba(0,113,227,0.25); }
        .admin-tab:hover:not(.active) { background: #f5f5f7; color: #1d1d1f; }

        .admin-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .admin-stat-card {
          padding: 22px; display: flex; align-items: center; gap: 16px;
          border-left: 3px solid transparent;
        }
        .asc-icon { font-size: 32px; flex-shrink: 0; }
        .asc-right { flex: 1; min-width: 0; overflow: hidden; }
        .asc-value { font-size: 26px; font-weight: 800; line-height: 1.15; margin-bottom: 4px; letter-spacing: -0.5px; word-break: break-all; white-space: normal; }
        .asc-label { font-size: 13px; font-weight: 600; color: #6e6e73; }
        .asc-sub { font-size: 11px; color: #aeaeb2; margin-top: 3px; }

        .admin-recent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .recent-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0f0f5; }
        .recent-row:last-child { border-bottom: none; }
        .recent-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .recent-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #0071e3;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; color: white; flex-shrink: 0;
        }
        .recent-info { flex: 1; }
        .recent-name { font-size: 13px; font-weight: 600; color: #1d1d1f; }
        .recent-meta { font-size: 11px; color: #6e6e73; }
        .user-role-chip { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 9px; border-radius: 980px; }
        .role-buyer  { color: #16a34a; background: rgba(34,197,94,0.1); }
        .role-seller { color: #0071e3; background: rgba(0,113,227,0.1); }
        .role-admin  { color: #ef4444; background: rgba(239,68,68,0.1); }

        /* Table */
        .admin-table-card { overflow: hidden; }
        .table-header { padding: 18px 24px; border-bottom: 1px solid #e5e7eb; }
        .table-header h3 { font-size: 15px; font-weight: 700; color: #1d1d1f; }
        .admin-table-wrapper { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th {
          padding: 12px 16px; text-align: left;
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px;
          color: #aeaeb2; font-weight: 700;
          background: #f9f9fb; border-bottom: 1px solid #e5e7eb;
        }
        .admin-table td { padding: 14px 16px; border-bottom: 1px solid #f0f0f5; font-size: 13px; color: #1d1d1f; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover td { background: #fafafa; }
        .table-user { display: flex; align-items: center; gap: 9px; }
        .table-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #0071e3;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 11px; color: white; flex-shrink: 0;
        }
        .table-muted { color: #6e6e73 !important; font-size: 12px !important; }
        .table-actions { display: flex; gap: 6px; }
        .role-select {
          background: #f5f5f7; border: 1px solid #e5e7eb;
          border-radius: 8px; color: #1d1d1f;
          padding: 5px 10px; font-size: 12px; cursor: pointer;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .admin-recent-grid { grid-template-columns: 1fr; }
          .admin-header { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
