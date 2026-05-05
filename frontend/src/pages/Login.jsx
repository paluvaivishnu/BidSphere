import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/auctions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      toast.success(`Welcome, ${user.name.split(' ')[0]}! 🎉`);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/auctions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-brand">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #0071e3, #005bb5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 4px 12px rgba(0,113,227,0.35)',
            }}>⚡</div>
            <h1 className="auth-brand-name">BidSphere</h1>
          </div>
          <h2 className="auth-tagline">
            The Future of<br /><span style={{ color: '#0071e3' }}>Online Auctions</span>
          </h2>
          <p className="auth-desc">
            Real-time bidding. Transparent pricing. Instant winner selection.
          </p>
          <div className="auth-features">
            {['Live Bidding via Sockets', 'Secure JWT Authentication', 'Auto Auction Finalization', 'Email Winner Notifications'].map(f => (
              <div key={f} className="auth-feature-item">
                <span className="auth-check">✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-card card">
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-sub">Sign in to your BidSphere account</p>

            <form onSubmit={handleSubmit} id="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email" name="email" type="email" className="form-input"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange} autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password" name="password" type="password" className="form-input"
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange} autoComplete="current-password"
                />
              </div>

              {/* Demo hint */}
              <div className="demo-hint">
                <span>🔑 Demo Admin:</span>
                <code>admin@auction.com</code>
                <span>/</span>
                <code>Admin@123</code>
              </div>

              <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Sign In →'}
              </button>
            </form>

            <div className="auth-divider"><span>OR</span></div>

            <GoogleAuthButton
              onSuccess={handleGoogle}
              onError={(msg) => toast.error(msg)}
            />

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one free</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 60px;
          background: #f5f5f7;
        }
        .auth-container {
          display: flex;
          gap: 64px;
          max-width: 900px;
          width: 100%;
          align-items: center;
        }
        .auth-left { flex: 1; }
        .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .auth-brand-name {
          font-size: 22px; font-weight: 800;
          color: #1d1d1f; letter-spacing: -0.3px;
        }
        .auth-tagline { font-size: 36px; font-weight: 800; line-height: 1.15; margin-bottom: 14px; color: #1d1d1f; letter-spacing: -0.5px; }
        .auth-desc { color: #6e6e73; font-size: 15px; line-height: 1.7; margin-bottom: 28px; }
        .auth-features { display: flex; flex-direction: column; gap: 12px; }
        .auth-feature-item { font-size: 14px; color: #6e6e73; display: flex; align-items: center; gap: 10px; font-weight: 500; }
        .auth-check { color: #22c55e; font-weight: 800; font-size: 16px; }

        .auth-right { flex: 0 0 380px; }
        .auth-form-card { padding: 36px; }
        .auth-form-title { font-size: 22px; font-weight: 800; margin-bottom: 6px; color: #1d1d1f; letter-spacing: -0.3px; }
        .auth-form-sub { color: #6e6e73; font-size: 14px; margin-bottom: 26px; }

        .demo-hint {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px;
          background: rgba(0,113,227,0.05);
          border: 1px solid rgba(0,113,227,0.15);
          border-radius: 12px;
          font-size: 12px; color: #0071e3;
          margin-bottom: 18px; flex-wrap: wrap;
          font-weight: 500;
        }
        .demo-hint code {
          background: rgba(0,113,227,0.1);
          padding: 2px 7px; border-radius: 6px;
          font-size: 11px; color: #0071e3; font-weight: 700;
        }
        .btn-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        .auth-divider {
          text-align: center; color: #aeaeb2; font-size: 12px;
          margin: 20px 0; position: relative;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          position: absolute; top: 50%;
          width: 42%; height: 1px;
          background: #e5e7eb;
        }
        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }
        .auth-switch { text-align: center; font-size: 14px; color: #6e6e73; }
        .auth-link { color: #0071e3; font-weight: 700; }
        .auth-link:hover { text-decoration: underline; text-underline-offset: 3px; }

        @media (max-width: 768px) {
          .auth-container { flex-direction: column; }
          .auth-left { display: none; }
          .auth-right { flex: none; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Login;
