import './Navbar.css';

/**
 * Shared navbar — dark navy strip used on both the landing page and the main app.
 *
 * Landing mode: hamburger? no — logo + brand left, anchor nav links centre, sign-in right.
 * App mode:     hamburger + logo + brand left | spacer | actions (New btn + AuthButton) right.
 */
function Navbar({
  mode = 'landing',
  // landing mode
  onSignIn,
  // app mode
  onHamburger,
  actions,
}) {
  return (
    <header className={`navbar navbar-${mode}`}>
      <div className="navbar-inner">

        {/* ---- Left cluster ---- */}
        <div className="navbar-left">
          {mode === 'app' && (
            <button
              className="navbar-hamburger"
              onClick={onHamburger}
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <div className="navbar-brand">
            <img src="/logo.png" alt="WFG National Title Insurance Company" className="navbar-logo" />
            <div className="navbar-brand-word">
              <strong>FAR/BAR</strong>
              <span>Compliance Center</span>
            </div>
          </div>
        </div>

        {/* ---- Right cluster ---- */}
        <div className="navbar-right">
          {mode === 'landing' && (
            <>
              <nav className="navbar-nav" aria-label="Primary navigation">
                <a href="#how">How it works</a>
                <a href="#tracks">What it tracks</a>
              </nav>
              <button className="navbar-signin-btn" onClick={onSignIn}>Sign in</button>
            </>
          )}
          {mode === 'app' && actions && (
            <div className="navbar-actions">{actions}</div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;
