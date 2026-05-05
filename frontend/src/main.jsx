import './index.css';
import './styles/global.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRouter from './App';

const main = document.getElementById('root');

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(main).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1d1d1f',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '12px 18px',
              fontSize: '14px',
              fontFamily: 'Inter, -apple-system, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>
);
