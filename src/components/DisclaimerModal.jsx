import { useEffect } from 'react';

function DisclaimerModal({ onAgree }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="disclaimer-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="disclaimer-modal">
        <div className="disclaimer-modal-header">
          <img src="/logo.png" alt="WFG National Title" className="disclaimer-modal-logo" />
          <h1 id="disclaimer-title" className="disclaimer-modal-title">FAR/BAR Deadline Tracker</h1>
          <p className="disclaimer-modal-subtitle">Beta Access — Early Release</p>
        </div>

        <div className="disclaimer-modal-body">
          <p>
            This tool is currently under active development. WFG National Title Insurance
            Company has opened this early access round to gather feedback from real estate
            professionals on real-world title closing scenarios.
          </p>

          <p className="disclaimer-modal-notice-label">IMPORTANT — PLEASE READ BEFORE CONTINUING</p>

          <p>
            All deadline calculations displayed by this tool are generated programmatically
            from FAR/BAR contract parameters and are provided for informational and
            educational purposes only. No output from this tool constitutes legal advice,
            constitutes a final determination of any contractual deadline, or creates any
            obligation on the part of WFG National Title Insurance Company.
          </p>

          <p>
            WFG National Title Insurance Company expressly disclaims any liability arising
            from reliance on calculations produced by this tool. All deadlines must be
            independently verified against the executed contract and applicable Florida law.
          </p>

          <p>
            This tool is updated on a best-efforts basis as the Florida Association of
            Realtors® and Florida Bar issue revisions to the FAR/BAR contract forms. Users
            are responsible for confirming currency of any deadline against the version of
            the contract in use.
          </p>

          <p className="disclaimer-modal-agree-note">
            By clicking "I Agree," you acknowledge that you have read and understood
            this notice and agree to use this tool for informational purposes only.
          </p>
        </div>

        <div className="disclaimer-modal-footer">
          <button className="disclaimer-modal-btn" onClick={onAgree}>
            I Agree — Continue to Deadline Tracker
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisclaimerModal;
