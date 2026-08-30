import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/common/SEO';

// Google "G" mark (multi-color) — inline SVG so we don't pull in an icon lib.
const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated } = useAuth();

  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth (Google Identity Services, Authorization Code + PKCE).
  const codeClientRef = useRef(null);
  // Async initializer (loads the script + builds the code client) — awaited on
  // click so a fast click still works; null when Google is unavailable.
  const googleSetupRef = useRef(null);
  // Holds a human-readable reason when the Google script fails to load.
  const googleInitErrorRef = useRef('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Load the GIS library once and configure the code client (only when an OAuth
  // client id is provided in the environment — otherwise the button is disabled).
  useEffect(() => {
    if (!googleClientId) return;

    let cancelled = false;
    googleInitErrorRef.current = '';

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) return resolve();
        const existing = document.getElementById('gsi-client');
        if (existing) {
          // Already appended earlier — wait for it to become ready.
          const t = setInterval(() => {
            if (window.google?.accounts?.oauth2) {
              clearInterval(t);
              resolve();
            }
          }, 100);
          return;
        }
        const s = document.createElement('script');
        s.id = 'gsi-client';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Google script failed to load'));
        document.head.appendChild(s);
      });

    const init = () => {
      if (codeClientRef.current) return codeClientRef.current;
      const redirectUri = window.location.origin;
      codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        // NOTE: do NOT pass redirect_uri here. For popup mode Google defaults it
        // to the calling page's origin; passing it explicitly can break the
        // popup → callback code handoff ("pick account, then nothing").
        callback: (credentialResponse) => {
          // credentialResponse.code is the authorization code → send to server.
          if (!credentialResponse?.code) {
            setGoogleLoading(false);
            setError('Google returned no authorization code. Please try again.');
            return;
          }
          (async () => {
            try {
              setGoogleLoading(true);
              setError('');
              await loginWithGoogle(credentialResponse.code, redirectUri);
              navigate('/admin');
            } catch (err) {
              setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
              setGoogleLoading(false);
            }
          })();
        },
        error_callback: (error) => {
          // Surface the REAL Google error (e.g. redirect_uri_mismatch), not a
          // generic message.
          setGoogleLoading(false);
          setError(
            'Google sign-in failed: ' + (error?.message || error?.type || 'cancelled or unknown error')
          );
        },
      });
      return codeClientRef.current;
    };

    // Expose init so the click handler can await it.
    googleSetupRef.current = async () => {
      await loadScript();
      if (cancelled || !window.google?.accounts?.oauth2) throw new Error('Google is not available');
      return init();
    };

    // Warm it up ahead of time so the button is usually ready instantly.
    loadScript().then(init).catch(() => {
      if (!cancelled) googleInitErrorRef.current = 'Script failed to load — check network/ad-blocker.';
    });

    return () => {
      cancelled = true;
      googleSetupRef.current = null;
      googleInitErrorRef.current = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const client = googleSetupRef.current ? await googleSetupRef.current() : null;
      if (client) {
        client.requestCode();
      } else {
        setGoogleLoading(false);
        setError(googleInitErrorRef.current || 'Google sign-in is not available right now.');
      }
    } catch (err) {
      setGoogleLoading(false);
      setError('Could not start Google sign-in: ' + (err?.message || 'Google script failed to load.'));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
      <SEO title="Admin Login" />

      <div className="w-full max-w-md space-y-8 bg-neutral-900 border border-neutral-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-sans font-bold text-white">Editorial Admin Portal</h1>
          <p className="text-xs font-mono text-neutral-400">Sign in with your Google account</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || !googleClientId}
          className="w-full py-3 px-4 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <GoogleG />
          <span>
            {googleLoading
              ? 'Signing in with Google…'
              : googleClientId
                ? 'Continue with Google'
                : 'Google sign-in not configured'}
          </span>
        </button>

        <p className="text-center text-[10px] font-mono uppercase tracking-widest text-neutral-600">
          Only your authorized Google account can access this dashboard
        </p>
      </div>
    </div>
  );
};
export default Login;
