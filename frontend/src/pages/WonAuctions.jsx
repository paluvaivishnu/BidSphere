import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const WonAuctions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => { fetchWon(); }, []);

  const fetchWon = async () => {
    try {
      const { data } = await API.get('/users/won');
      setTransactions(data.data || []);
    } catch { toast.error('Failed to load won auctions'); }
    finally { setLoading(false); }
  };

  const loadRazorpay = () => new Promise(resolve => {
    if (document.getElementById('rzp')) return resolve(true);
    const s = document.createElement('script');
    s.id = 'rzp'; s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handlePayment = async (txId) => {
    setPayingId(txId);
    try {
      const { data } = await API.post(`/payment/create-order/${txId}`);
      if (data.mockMode) {
        await API.post(`/payment/mock-payment/${txId}`);
        toast.success('Mock payment success!'); fetchWon(); return;
      }
      if (!await loadRazorpay()) { toast.error('Razorpay failed to load'); return; }
      const opts = {
        key: data.keyId, amount: data.order.amount, currency: 'INR',
        name: 'BidSphere', order_id: data.order.id, theme: { color: '#0071e3' },
        handler: async (r) => {
          try {
            const v = await API.post('/payment/verify', {
              razorpay_order_id: r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id,
              razorpay_signature: r.razorpay_signature,
              transaction_id: txId,
            });
            if (v.data.success) { toast.success('Payment successful! 🎉'); fetchWon(); }
          } catch { toast.error('Verification failed'); }
        },
      };
      const rz = new window.Razorpay(opts);
      rz.open();
      rz.on('payment.failed', r => toast.error(r.error.description || 'Payment failed'));
    } catch (e) { toast.error(e.response?.data?.message || 'Payment error'); }
    finally { setPayingId(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', paddingTop: 60 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1d1d1f', marginBottom: 4, letterSpacing: '-0.3px' }}>
            Won Auctions
          </h1>
          <p style={{ fontSize: 13, color: '#6e6e73' }}>Complete payment to finalize your purchase</p>
        </div>

        {/* Loading skeletons */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16 }} />
            ))}
          </div>

        ) : transactions.length === 0 ? (
          /* Empty state */
          <div style={{
            padding: '56px 24px', textAlign: 'center',
            border: '2px dashed #e5e7eb', borderRadius: 20, background: '#ffffff',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🏆</div>
            <p style={{ color: '#1d1d1f', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              No won auctions yet
            </p>
            <p style={{ color: '#6e6e73', fontSize: 13, marginBottom: 20 }}>
              Start bidding on live auctions to win items!
            </p>
            <Link to="/auctions" style={{
              display: 'inline-block', padding: '10px 22px',
              background: '#0071e3', color: '#fff',
              borderRadius: 980, fontWeight: 600, fontSize: 14,
              boxShadow: '0 2px 8px rgba(0,113,227,0.28)',
            }}>
              Browse Live Auctions →
            </Link>
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transactions.map(tx => {
              if (!tx.auctionId) return null;
              const a = tx.auctionId;
              const isPaid = tx.paymentStatus === 'paid';
              const imgUrl = a.image
                ? (a.image.startsWith('http') ? a.image : `${API_URL}${a.image}`)
                : null;

              return (
                <div key={tx._id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderLeft: isPaid ? '3px solid #22c55e' : '3px solid #0071e3',
                  borderRadius: 16, padding: '16px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.2s ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                >
                  {/* Image */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                    flexShrink: 0, background: '#f5f5f7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, border: '1px solid #e5e7eb',
                  }}>
                    {imgUrl
                      ? <img src={imgUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🎁'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f' }}>{a.title}</h3>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 980,
                        background: isPaid ? 'rgba(34,197,94,0.08)' : 'rgba(0,113,227,0.08)',
                        color: isPaid ? '#16a34a' : '#0071e3',
                        border: `1px solid ${isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(0,113,227,0.18)'}`,
                        textTransform: 'uppercase', letterSpacing: '0.3px',
                      }}>
                        {isPaid ? '✓ Paid' : 'Payment Pending'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6e6e73' }}>
                      {a.category} · Seller: {tx.sellerId?.name || 'Unknown'} · {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  {/* Winning Bid */}
                  <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 16 }}>
                    <p style={{ fontSize: 10, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, fontWeight: 600 }}>
                      Winning Bid
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#0071e3', letterSpacing: '-0.5px' }}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    {!isPaid ? (
                      <button
                        onClick={() => handlePayment(tx._id)}
                        disabled={payingId === tx._id}
                        style={{
                          padding: '10px 20px',
                          background: payingId === tx._id ? '#6e6e73' : '#0071e3',
                          color: '#fff', border: 'none', borderRadius: 980,
                          fontWeight: 600, fontSize: 13,
                          cursor: payingId === tx._id ? 'not-allowed' : 'pointer',
                          opacity: payingId === tx._id ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: payingId === tx._id ? 'none' : '0 2px 8px rgba(0,113,227,0.28)',
                        }}
                        onMouseEnter={e => { if (payingId !== tx._id) e.currentTarget.style.background = '#005bb5'; }}
                        onMouseLeave={e => { if (payingId !== tx._id) e.currentTarget.style.background = '#0071e3'; }}
                      >
                        {payingId === tx._id ? '⏳ Opening...' : '💳 Pay Now'}
                      </button>
                    ) : (
                      <Link to={`/auctions/${a._id}`} style={{
                        display: 'inline-block',
                        padding: '10px 18px',
                        background: '#f5f5f7', border: '1px solid #e5e7eb',
                        borderRadius: 980, color: '#6e6e73',
                        fontSize: 13, fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ebebf0'; e.currentTarget.style.color = '#1d1d1f'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f7'; e.currentTarget.style.color = '#6e6e73'; }}
                      >
                        View Item →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WonAuctions;
