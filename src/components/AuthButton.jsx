import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthButton.css';

function AuthButton() {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setShowMenu(false);
    } catch (error) {
      alert('Failed to sign out. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <button
        className="auth-signin-btn"
        onClick={handleSignIn}
        disabled={loading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderAvatar = () => {
    if (currentUser.photoURL && !imageError) {
      return (
        <img
          src={currentUser.photoURL}
          alt={currentUser.displayName}
          className="auth-user-avatar"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
        />
      );
    }

    // Fallback to initials avatar
    return (
      <div className="auth-user-avatar auth-avatar-fallback">
        <span>{getInitials(currentUser.displayName || currentUser.email)}</span>
      </div>
    );
  };

  return (
    <div className="auth-user-menu">
      <button
        className="auth-user-btn"
        onClick={() => setShowMenu(!showMenu)}
      >
        {renderAvatar()}
        <span className="auth-user-name">{currentUser.displayName || 'User'}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          style={{ transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="auth-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="auth-dropdown-menu">
            <div className="auth-menu-header">
              {currentUser.photoURL && !imageError ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="auth-menu-avatar"
                  onError={() => setImageError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="auth-menu-avatar auth-avatar-fallback">
                  <span>{getInitials(currentUser.displayName || currentUser.email)}</span>
                </div>
              )}
              <div>
                <div className="auth-menu-name">{currentUser.displayName}</div>
                <div className="auth-menu-email">{currentUser.email}</div>
              </div>
            </div>
            <div className="auth-menu-divider" />
            <button className="auth-menu-item" onClick={handleSignOut}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AuthButton;
