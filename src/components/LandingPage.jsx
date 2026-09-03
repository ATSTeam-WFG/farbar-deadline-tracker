import Navbar from './Navbar';
import FeedbackButton from './FeedbackButton';
import './LandingPage.css';

function LandingPage({ onEnter, onSignIn }) {
  return (
    <div className="landing">
      <Navbar mode="landing" onSignIn={onSignIn} />

      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="landing-badge">Built with title professionals, for title professionals</span>
            <h1>Never miss a<br /><span className="landing-accent">FAR/BAR</span><br />deadline again</h1>
            <p className="landing-hero-sub">
              From deposits and financing to inspections and beyond, every critical date is
              calculated in real time, <b>tracked automatically</b>, and <b>always kept up to date</b>,
              so nothing slips through the cracks.
            </p>
            <p className="landing-hero-tag">Accurate. Automated. Always up to date.</p>
            <div className="landing-actions">
              <button className="landing-btn landing-btn-gold" onClick={onEnter}>
                Calculate a Contract &rarr;
              </button>
              <a className="landing-btn landing-btn-outline-light" href="#how">See how it works</a>
            </div>
            <p className="landing-hero-note">
              No file needed to start. Manual entry takes under a minute. PDF intake is in development.
            </p>
          </div>

          <div className="landing-hero-art" aria-hidden="true">
            <div className="landing-panel">
              <div className="landing-panel-bar">
                <span>CONTRACT DEADLINES</span>
                <span className="landing-panel-stats">
                  <b>15</b> total <em className="hot">6 overdue</em> <b>2</b> in 7 days
                </span>
              </div>
              <div className="landing-panel-body">
                <div className="landing-panel-group">DEPOSITS <span className="count">2</span></div>
                <div className="landing-panel-row critical">
                  <span><b>Initial Deposit Due</b> <em>&sect;2(a)</em></span>
                  <span className="date">Aug 5</span>
                </div>
                <div className="landing-panel-row">
                  <span><b>Additional Deposit Due</b> <em>&sect;2(b)</em></span>
                  <span className="date">Aug 12</span>
                </div>
                <div className="landing-panel-group">FINANCING <span className="count">2</span></div>
                <div className="landing-panel-row critical">
                  <span><b>Loan Application</b> <em>&sect;8(b)(i)</em></span>
                  <span className="date">Aug 7</span>
                </div>
                <div className="landing-panel-row ok">
                  <span><b>Loan Approval Period Ends</b> <em>&sect;8(b)(ii)</em></span>
                  <span className="date">Sep 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-steps-band" id="how">
        <div className="landing-container">
          <div className="landing-eyebrow">The workflow</div>
          <div className="landing-section-head">
            <h2>Three simple steps that keep you on track.</h2>
            <p>From entering your contract to tracking every deadline, FAR/BAR Compliance Center keeps you organized and ahead of what&rsquo;s next.</p>
          </div>

          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <h3>Enter the dates</h3>
              <p>Enter the effective date, closing date, financing details, and property information.</p>
              <img className="landing-step-shot" src="/landing/step-1-enter-dates.png" alt="Contract Information form" />
            </div>
            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <h3>Read the docket</h3>
              <p>See every deadline, clearly organized by category and urgency.</p>
              <img className="landing-step-shot" src="/landing/step-2-read-docket.png" alt="Contract Deadlines list" />
            </div>
            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <h3>Track it to closing</h3>
              <p>Use the calendar and deadline view to see what&rsquo;s due, what&rsquo;s overdue, and what&rsquo;s coming next.</p>
              <img className="landing-step-shot" src="/landing/step-3-track-closing.png" alt="Calendar view of deadlines" />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-built-for">
        <div className="landing-container">
          <div className="landing-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h2>Built for title professionals.</h2>
          <p>FAR/BAR rules. Business-day adjustments.<br />Deposits. Financing. Inspections. Title. Closing.</p>
        </div>
      </section>

      <section className="landing-section landing-articles-band" id="tracks">
        <div className="landing-container">
          <div className="landing-eyebrow">What it tracks</div>
          <div className="landing-section-head">
            <h2>Three articles of coverage, same as the contract itself.</h2>
            <p>Every rule traces back to a specific paragraph of the FAR/BAR Standard Residential Contract or its Condominium Rider.</p>
          </div>

          <div className="landing-articles">
            <article className="landing-article">
              <div className="landing-article-kicker">Article I</div>
              <h3>Calculation</h3>
              <ul>
                <li>Full-contract coverage: deposits, financing, inspections, title, closing</li>
                <li>Business-day aware, per Standard F</li>
                <li>Condo &amp; HOA rider logic</li>
                <li>Every result cited to a contract paragraph</li>
              </ul>
            </article>

            <article className="landing-article landing-article-dark">
              <div className="landing-article-kicker">Article II</div>
              <h3>Tracking</h3>
              <ul>
                <li>List &amp; calendar views</li>
                <li>Status per deadline: pending, completed, waived, extended</li>
                <li>Risk at a glance: overdue and due-soon counts</li>
                <li>In-app due-soon alerts</li>
              </ul>
            </article>

            <article className="landing-article">
              <div className="landing-article-kicker">Article III</div>
              <h3>Record</h3>
              <ul>
                <li>Branded PDF export</li>
                <li>Saved reports, reload anytime</li>
                <li>Print-ready view</li>
                <li>Configurable report: hide deadlines you don&rsquo;t need</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-disclaimer" id="disclaimer">
        <div className="landing-container">
          <div className="landing-disclaimer-box">
            <span className="landing-disclaimer-label">Legal Disclaimer</span>
            <p>
              All deadline calculations displayed by this tool are generated programmatically
              from FAR/BAR contract parameters and are provided for informational and educational
              purposes only. No output constitutes legal advice or a final determination of any
              contractual deadline. Deadlines must be independently verified against the executed
              contract and applicable Florida law.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-container">
          <h2>Open the tracker on your next closing.</h2>
          <p>
            WFG National Title has opened early access to gather feedback from real estate
            professionals working real files. Your input shapes what ships next.
          </p>
          <div className="landing-actions landing-actions-center">
            <button className="landing-btn landing-btn-gold" onClick={onEnter}>
              Start a Calculation &rarr;
            </button>
          </div>
          <p className="landing-hero-note landing-cta-note">
            Beta &middot; updated on a best-efforts basis as FAR and the Florida Bar revise the contract forms.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-logo-chip">
              <img src="/logo.png" alt="WFG National Title Insurance Company" />
            </span>
          </div>
          <p className="landing-legal">
            This tool is provided for informational and educational purposes only. No output
            constitutes legal advice or a final determination of any contractual deadline.
          </p>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
}

export default LandingPage;
