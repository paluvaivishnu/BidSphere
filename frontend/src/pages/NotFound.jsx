import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="nf-page">
    <div className="nf-content animate-fade-in">
      <div className="nf-code">404</div>
      <h1 className="nf-title">Page Not Found</h1>
      <p className="nf-desc">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="nf-actions">
        <Link to="/" className="btn btn-primary btn-lg">← Go Home</Link>
        <Link to="/auctions" className="btn btn-secondary btn-lg">Browse Auctions</Link>
      </div>
    </div>
    <style>{`
      .nf-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; background: #f5f5f7; }
      .nf-code { font-size: 120px; font-weight: 900; background: linear-gradient(135deg, #0071e3, #005bb5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 16px; }
      .nf-title { font-size: 32px; font-weight: 800; margin-bottom: 12px; color: #1d1d1f; letter-spacing: -0.3px; }
      .nf-desc { font-size: 16px; color: #6e6e73; margin-bottom: 32px; line-height: 1.7; }
      .nf-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
    `}</style>
  </div>
);

export default NotFound;
