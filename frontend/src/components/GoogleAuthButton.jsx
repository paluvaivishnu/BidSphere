import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * GoogleAuthButton
 * Renders a Google Sign-In button using the Google Identity Services SDK.
 * On success, calls onSuccess(credential) with the raw Google ID token.
 * On error, calls onError(message).
 */
const GoogleAuthButton = ({ onSuccess, onError, label = 'Continue with Google' }) => {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError('Google sign-in was cancelled');
          }
        },
        ux_mode: 'popup',
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: btnRef.current?.offsetWidth || 340,
        logo_alignment: 'center',
        text: 'continue_with',
      });
    };

    // Load GSI script if not already loaded
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, []);

  // If Google client ID isn't set, show a placeholder
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    return (
      <div style={{
        width: '100%', padding: '11px 16px',
        border: '1px solid #e5e7eb', borderRadius: 980,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: '#f9f9fb', color: '#aeaeb2',
        fontSize: 14, fontWeight: 500, cursor: 'not-allowed',
        boxSizing: 'border-box',
      }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
        Google Sign-In (configure Client ID)
      </div>
    );
  }

  return (
    <div
      ref={btnRef}
      style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}
    />
  );
};

export default GoogleAuthButton;
