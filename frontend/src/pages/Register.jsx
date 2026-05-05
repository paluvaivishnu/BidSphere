import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', phone: '' });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const roleParam = params.get('role');
    if (roleParam === 'seller' || roleParam === 'buyer') {
      setForm(f => ({ ...f, role: roleParam }));
    }
  }, [params]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role, form.phone);
      toast.success(`Account created! Welcome, ${user.name.split(' ')[0]}! 🎉`);
      navigate('/auctions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential, form.role);
      toast.success(`Welcome, ${user.name.split(' ')[0]}! 🎉`);
      navigate('/auctions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in">
        <div className="auth-left">
          <div className="auth-brand">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #0071e3, #005bb5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 4px 12px rgba(0,113,227,0.35)',
            }}></div>
            <h1 className="auth-brand-name">BidSphere</h1>
          </div>
          <h2 className="auth-tagline">
            Join 1000s of<br /><span style={{ color: '#0071e3' }}>Bidders &amp; Sellers</span>
          </h2>
          <p className="auth-desc">
            Create your free account and start buying or selling in minutes. No hidden fees.
          </p>
          <div className="role-cards">
            <div
              className={`role-card ${form.role === 'buyer' ? 'active' : ''}`}
              onClick={() => setForm(f => ({ ...f, role: 'buyer' }))}
            >
              <span className="role-emoji">🛒</span>
              <div>
                <div className="role-title">Buyer</div>
                <div className="role-desc">Browse and bid on live auctions</div>
              </div>
            </div>
            <div
              className={`role-card ${form.role === 'seller' ? 'active' : ''}`}
              onClick={() => setForm(f => ({ ...f, role: 'seller' }))}
            >
              <span className="role-emoji">🏷️</span>
              <div>
                <div className="role-title">Seller</div>
                <div className="role-desc">List items and reach thousands of buyers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-card card">
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-sub">Free forever. No credit card required.</p>

            <form onSubmit={handleSubmit} id="register-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Rahul Mehta"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Phone Number (Optional)</label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 9876543210 (For SMS Alerts)"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">I want to</label>
                <div className="role-select-row">
                  {['buyer', 'seller'].map(r => (
                    <label
                      key={r}
                      className={`role-radio ${form.role === r ? 'checked' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={form.role === r}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      {r === 'buyer' ? '🛒 Buy Items' : '🏷️ Sell Items'}
                    </label>
                  ))}
                </div>
              </div>

              <button
                id="register-submit"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading ? <span className="btn-spinner" /> : 'Create Free Account →'}
              </button>
            </form>

            <div className="auth-divider"><span>OR</span></div>

            <GoogleAuthButton
              onSuccess={handleGoogle}
              onError={(msg) => toast.error(msg)}
            />

            <p className="auth-switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in here</Link>
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
        .auth-container { display: flex; gap: 64px; max-width: 900px; width: 100%; align-items: center; }
        .auth-left { flex: 1; }
        .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .auth-brand-icon { font-size: 28px; }
        .auth-brand-name { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.3px; }
        .auth-tagline { font-size: 36px; font-weight: 800; line-height: 1.15; margin-bottom: 14px; color: #1d1d1f; letter-spacing: -0.5px; }
        .auth-desc { color: #6e6e73; font-size: 15px; line-height: 1.7; margin-bottom: 28px; }
        .role-cards { display: flex; flex-direction: column; gap: 10px; }
        .role-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .role-card:hover { background: #f9f9fb; border-color: #d1d5db; }
        .role-card.active { background: rgba(0,113,227,0.04); border-color: rgba(0,113,227,0.3); box-shadow: 0 0 0 3px rgba(0,113,227,0.1); }
        .role-emoji { font-size: 26px; }
        .role-title { font-weight: 700; font-size: 15px; color: #1d1d1f; }
        .role-desc { font-size: 12px; color: #6e6e73; margin-top: 2px; }

        .auth-right { flex: 0 0 380px; }
        .auth-form-card { padding: 36px; }
        .auth-form-title { font-size: 22px; font-weight: 800; margin-bottom: 6px; color: #1d1d1f; letter-spacing: -0.3px; }
        .auth-form-sub { color: #6e6e73; font-size: 14px; margin-bottom: 24px; }

        .role-select-row { display: flex; gap: 8px; }
        .role-radio {
          flex: 1; padding: 11px 8px;
          background: #f5f5f7;
          border: 1px solid #e5e7eb;
          border-radius: 980px;
          text-align: center; font-size: 13px; font-weight: 600;
          color: #6e6e73; cursor: pointer; transition: all 0.2s ease;
        }
        .role-radio:hover { background: #ebebf0; color: #1d1d1f; }
        .role-radio.checked { background: #0071e3; border-color: #0071e3; color: white; box-shadow: 0 2px 8px rgba(0,113,227,0.25); }

        .btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        .auth-divider { text-align: center; color: #aeaeb2; font-size: 12px; margin: 20px 0; position: relative; }
        .auth-divider::before, .auth-divider::after { content: ''; position: absolute; top: 50%; width: 42%; height: 1px; background: #e5e7eb; }
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

export default Register;
