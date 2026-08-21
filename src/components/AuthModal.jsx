import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AuthModal({ onClose }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        await signIn(email, password);
        onClose();
      } else if (tab === 'signup') {
        await signUp(email, password, fullName);
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        setTab('signin');
      } else if (tab === 'reset') {
        await resetPassword(email);
        setSuccessMsg('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in">
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="auth-modal-header">
          <div className="auth-modal-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2>
            {tab === 'signin' && 'Welcome Back'}
            {tab === 'signup' && 'Create Account'}
            {tab === 'reset' && 'Reset Password'}
          </h2>
          <p className="auth-modal-subtitle">
            {tab === 'signin' && 'Sign in to access your saved reports'}
            {tab === 'signup' && 'Save and track your deadline reports'}
            {tab === 'reset' && "We'll send you a reset link"}
          </p>
        </div>

        {tab !== 'reset' && (
          <div className="auth-modal-tabs">
            <button
              className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`}
              onClick={() => { setTab('signin'); setError(''); setSuccessMsg(''); }}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
              type="button"
            >
              Sign Up
            </button>
          </div>
        )}

        <form className="auth-modal-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="auth-alert auth-alert--success" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {successMsg}
            </div>
          )}

          {tab === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-full-name">Full Name</label>
              <input
                id="auth-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {tab !== 'reset' && (
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
                required
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
              />
            </div>
          )}

          {tab === 'signin' && (
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => { setTab('reset'); setError(''); setSuccessMsg(''); }}
            >
              Forgot password?
            </button>
          )}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                {tab === 'signin' && 'Sign In'}
                {tab === 'signup' && 'Create Account'}
                {tab === 'reset' && 'Send Reset Email'}
              </>
            )}
          </button>

          {tab === 'reset' && (
            <button
              type="button"
              className="auth-back-link"
              onClick={() => { setTab('signin'); setError(''); setSuccessMsg(''); }}
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
