import './Sidebar.css';

const NAV_ITEMS = [
  {
    id: 'calculator',
    label: 'Deadlines',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
      </svg>
    ),
  },
];

function Sidebar({ activeView, onViewChange, currentUser, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img src="/logo.png" alt="WFG National Title" className="sidebar-logo" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">FAR/BAR</span>
            <span className="sidebar-brand-sub">Deadline Tracker</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav" role="navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item${activeView === item.id ? ' sidebar-nav-item--active' : ''}`}
              onClick={() => { onViewChange(item.id); onClose(); }}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser ? (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar" aria-hidden="true">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.displayName || 'User'}</span>
                <span className="sidebar-user-email">{currentUser.email}</span>
              </div>
            </div>
          ) : null}
          <div className="sidebar-version">
            <span>v1.0 Professional</span>
            <span
              className="sidebar-disclaimer-tooltip"
              title="For informational purposes only. Always verify deadlines against the actual contract."
            >
              Legal ⓘ
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
