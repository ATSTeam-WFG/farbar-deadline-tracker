import { useState, useEffect } from 'react';
import ManualEntryForm from './components/ManualEntryForm';
import PDFUpload from './components/PDFUpload';
import DeadlineResults from './components/DeadlineResults';
import DeadlineConfig from './components/DeadlineConfig';
import NotificationCenter from './components/NotificationCenter';
import NotificationSettings from './components/NotificationSettings';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import DisclaimerModal from './components/DisclaimerModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthButton from './components/AuthButton';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabase';
import { calculateAllDeadlines } from './utils/deadlineRules';
import { getUserReports } from './services/reportService';
import { getDeadlineStatuses } from './services/deadlineStatusService';
import FeedbackButton from './components/FeedbackButton';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import { recordDisclaimerAcceptance } from './services/disclaimerService';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();
  const [showDisclaimer, setShowDisclaimer] = useState(
    !localStorage.getItem('wfg_disclaimer_v1')
  );
  const [authError, setAuthError] = useState('');
  const [showSignInAfterConfirm, setShowSignInAfterConfirm] = useState(false);
  const [showLanding, setShowLanding] = useState(!currentUser);

  // A fresh sign-in while the landing page is showing means the visitor wants in
  useEffect(() => {
    if (currentUser && showLanding) setShowLanding(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Handle Supabase auth callbacks (email confirmation, PKCE code exchange, error fragments)
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const errorCode = params.get('error_code');
    const errorDesc = params.get('error_description');

    if (errorCode === 'otp_expired') {
      setAuthError('Your confirmation link has expired. Please sign up again or request a new link.');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    if (errorCode) {
      setAuthError(decodeURIComponent(errorDesc || 'Authentication error. Please try again.').replace(/\+/g, ' '));
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // PKCE code exchange — Supabase sends ?code= for email confirmations
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setAuthError('Confirmation link is invalid or expired. Please try again.');
        }
        window.history.replaceState(null, '', window.location.pathname);
      });
    }
  }, []);
  const [inputMethod, setInputMethod] = useState('manual');
  const [result, setResult] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [hiddenDeadlines, setHiddenDeadlines] = useState(new Set());
  const [activeView, setActiveView] = useState('calculator');
  const [sidebarOpen, setSidebarOpen] = useState(false);       // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse

  const handleHamburger = () => {
    setSidebarOpen(prev => !prev);
    setSidebarCollapsed(prev => !prev);
  };

  // Report persistence state
  const [savedReportId, setSavedReportId] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [calendarStatuses, setCalendarStatuses] = useState({});

  // Load saved reports list when user signs in
  useEffect(() => {
    if (currentUser) {
      getUserReports(currentUser.id)
        .then(setSavedReports)
        .catch(console.error);
    } else {
      setSavedReports([]);
    }
  }, [currentUser]);

  const handleCalculate = (formData) => {
    const calculatedResult = calculateAllDeadlines(formData);
    setResult(calculatedResult);
    setContractData(formData);
    setSavedReportId(null);
    setCalendarStatuses({});
  };

  const handleReset = () => {
    setResult(null);
    setContractData(null);
    setSavedReportId(null);
    setCalendarStatuses({});
  };

  const handleLoadSession = (session) => {
    setContractData(session.contractData);
    setResult(session.result);
    setSavedReportId(session.id || null);
    setCalendarStatuses({});
    setActiveView('calculator');

    if (session.id) {
      getDeadlineStatuses(session.id)
        .then(setCalendarStatuses)
        .catch(console.error);
    }
  };

  const handleReportSaved = (id) => {
    setSavedReportId(id);
    // Refresh the reports list
    if (currentUser) {
      getUserReports(currentUser.id)
        .then(setSavedReports)
        .catch(console.error);
    }
  };

  const handleSwitchCalendarReport = async (reportId) => {
    if (!reportId) {
      // Switch back to current unsaved calculation
      return;
    }
    const report = savedReports.find(r => r.id === reportId);
    if (!report) return;

    setResult(report.result);
    setContractData(report.contract_data);
    setSavedReportId(report.id);

    try {
      const statuses = await getDeadlineStatuses(report.id);
      setCalendarStatuses(statuses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigSave = (newHiddenSet) => {
    setHiddenDeadlines(newHiddenSet);
  };

  const hiddenCount = hiddenDeadlines.size;

  const renderCalculatorPanel = () => (
    <div className="panel-calculator">
      {!result ? (
        <div className="input-section">
          <div className="section-header">
            <h2>Contract Information</h2>
            <button
              className="btn-configure"
              onClick={() => setActiveView('settings')}
              title="Choose which deadlines appear in the report"
              aria-haspopup="dialog"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/>
              </svg>
              Configure Report
              {hiddenCount > 0 && (
                <span className="configure-badge">{hiddenCount} hidden</span>
              )}
            </button>
          </div>

          <div className="input-method-toggle">
            <button
              className={`toggle-btn ${inputMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setInputMethod('manual')}
            >
              Manual Entry
            </button>
            <button
              className={`toggle-btn ${inputMethod === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMethod('upload')}
            >
              Upload PDF
            </button>
          </div>

          <div className="form-container">
            {inputMethod === 'manual' ? (
              <ManualEntryForm onSubmit={handleCalculate} />
            ) : (
              <PDFUpload onExtractedData={handleCalculate} />
            )}
          </div>
        </div>
      ) : (
        <DeadlineResults
          result={result}
          contractData={contractData}
          hiddenDeadlines={hiddenDeadlines}
          onReset={handleReset}
          savedReportId={savedReportId}
          onReportSaved={handleReportSaved}
          onSwitchView={setActiveView}
        />
      )}
    </div>
  );

  const renderReportsPanel = () => (
    <div className="panel-reports">
      <div className="panel-header">
        <h2>My Reports</h2>
        <p className="panel-subtitle">View and reload your saved deadline calculations</p>
      </div>
      <Dashboard
        onLoadSession={handleLoadSession}
        onClose={() => {}}
        inline
      />
    </div>
  );

  const renderNotificationsPanel = () => (
    <div className="panel-notifications">
      <div className="panel-header">
        <h2>Notifications</h2>
        <p className="panel-subtitle">Deadline alerts and notification preferences</p>
      </div>
      {result ? (
        <NotificationCenter deadlines={result.deadlines} inline />
      ) : (
        <div className="panel-empty">
          <p>Calculate a contract to see deadline notifications.</p>
        </div>
      )}
      <NotificationSettings />
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="panel-settings">
      <div className="panel-header">
        <h2>Settings</h2>
        <p className="panel-subtitle">Configure report preferences and application settings</p>
      </div>
      <DeadlineConfig
        hiddenDeadlines={hiddenDeadlines}
        onSave={handleConfigSave}
        onClose={() => {}}
        inline
      />
      <div className="settings-disclaimer">
        <strong>Legal Disclaimer:</strong> This tool is for informational purposes only.
        Users remain responsible for verifying all deadlines and dates against the actual contract.
        Consult your title company or real estate attorney for official deadline tracking.
      </div>
    </div>
  );

  const panelMap = {
    calculator: renderCalculatorPanel,
    reports: renderReportsPanel,
    notifications: renderNotificationsPanel,
    settings: renderSettingsPanel,
  };

  if (showLanding) {
    return (
      <>
        <LandingPage
          onEnter={() => setShowLanding(false)}
          onSignIn={() => setShowSignInAfterConfirm(true)}
        />
        {showSignInAfterConfirm && (
          <AuthModal onClose={() => setShowSignInAfterConfirm(false)} />
        )}
      </>
    );
  }

  return (
    <div className="app-layout">
      {showDisclaimer && (
        <DisclaimerModal onAgree={() => {
          localStorage.setItem('wfg_disclaimer_v1', 'accepted');
          setShowDisclaimer(false);
          recordDisclaimerAcceptance(currentUser?.id ?? null);
        }} />
      )}

      {authError && (
        <div className="auth-callback-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{authError}</span>
          <button onClick={() => { setAuthError(''); setShowSignInAfterConfirm(true); }}>Sign In</button>
          <button className="auth-callback-error-close" onClick={() => setAuthError('')} aria-label="Dismiss">×</button>
        </div>
      )}

      {showSignInAfterConfirm && (
        <AuthModal onClose={() => setShowSignInAfterConfirm(false)} />
      )}

      <Navbar
        mode="app"
        onHamburger={handleHamburger}
        actions={
          <>
            {activeView === 'calculator' && result && (
              <button className="topbar-action-btn" onClick={handleReset} title="New Contract">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>New</span>
              </button>
            )}
            <AuthButton onNavigate={setActiveView} />
          </>
        }
      />

      <div className="app-body">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          currentUser={currentUser}
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="main-body">
          {(panelMap[activeView] || panelMap.calculator)()}
        </main>
      </div>

      <FeedbackButton />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
