import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './AuthButton.css';

function AuthButton({ onNavigate }) {
  const { currentUser, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setShowMenu(false);
    } catch {
      alert('Failed to sign out. Please try again.');
    }
  };

  const getInitials = (user) => {
    const name = user.user_metadata?.full_name || user.email || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!currentUser) {
    return (
      <>
        <button className="auth-signin-btn" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Sign In
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  const displayName = currentUser.user_metadata?.full_name || currentUser.email || 'User';

  return (
    <div className="auth-user-menu">
      <button className="auth-user-btn" onClick={() => setShowMenu(!showMenu)}>
        <div className="auth-user-avatar auth-avatar-fallback">
          <span>{getInitials(currentUser)}</span>
        </div>
        <span className="auth-user-name">{displayName}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
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
              <div className="auth-menu-avatar auth-avatar-fallback">
                <span>{getInitials(currentUser)}</span>
              </div>
              <div>
                <div className="auth-menu-name">{currentUser.user_metadata?.full_name || 'User'}</div>
                <div className="auth-menu-email">{currentUser.email}</div>
              </div>
            </div>
            <div className="auth-menu-divider" />
            {onNavigate && (
              <button
                className="auth-menu-item"
                onClick={() => { onNavigate('reports'); setShowMenu(false); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                My Reports
              </button>
            )}
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
