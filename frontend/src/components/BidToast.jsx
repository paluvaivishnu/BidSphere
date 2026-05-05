import { useState, useCallback } from 'react';

let _setToasts = null;

export const useBidToast = () => {
  const showBidToast = useCallback(({ itemName, oldPrice, newPrice }) => {
    if (!_setToasts) return;
    const id = Date.now();
    _setToasts(prev => [...prev, { id, itemName, oldPrice, newPrice, exiting: false }]);
    setTimeout(() => {
      _setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    }, 3300);
    setTimeout(() => {
      _setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return { showBidToast };
};

export const BidToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  return (
    <div style={{
      position: 'fixed', top: 72, right: 16,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderLeft: '3px solid #0071e3',
            borderRadius: 14,
            padding: '12px 16px',
            minWidth: 240, maxWidth: 300,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
            animation: t.exiting
              ? 'toast-slide-out 0.2s ease forwards'
              : 'toast-slide-in 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f', marginBottom: 4 }}>
            ⚡ New bid on <span style={{ color: '#0071e3' }}>{t.itemName}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6e6e73', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ textDecoration: 'line-through' }}>₹{(t.oldPrice || 0).toLocaleString('en-IN')}</span>
            <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 700 }}>→ ₹{(t.newPrice || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
