import { useState } from 'react';
import ManualEntryForm from './components/ManualEntryForm';
import PDFUpload from './components/PDFUpload';
import DeadlineResults from './components/DeadlineResults';
import DeadlineConfig from './components/DeadlineConfig';
import AuthButton from './components/AuthButton';
import NotificationCenter from './components/NotificationCenter';
import Dashboard from './components/Dashboard';
import { useAuth } from './contexts/AuthContext';
import { calculateAllDeadlines } from './utils/deadlineRules';
import './App.css';

function App() {
  const { currentUser } = useAuth();
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' or 'upload'
  const [result, setResult] = useState(null); // { deadlines: [], metadata: {} }
  const [contractData, setContractData] = useState(null);

  // Set of deadline IDs to hide from the report (empty = show all)
  const [hiddenDeadlines, setHiddenDeadlines] = useState(new Set());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const handleCalculate = (formData) => {
    const calculatedResult = calculateAllDeadlines(formData);
    setResult(calculatedResult);
    setContractData(formData);
  };

  const handleReset = () => {
    setResult(null);
    setContractData(null);
  };

  const handleExtractedData = (data) => {
    handleCalculate(data);
  };

  const handleConfigSave = (newHiddenSet) => {
    setHiddenDeadlines(newHiddenSet);
    setIsConfigOpen(false);
  };

  const handleLoadSession = (session) => {
    setContractData(session.contractData);
    setResult(session.result);
    setIsDashboardOpen(false);
  };

  const hiddenCount = hiddenDeadlines.size;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-container">
          {/* Logo Section */}
          <div className="header-logo-section">
            <div className="logo-wrapper">
              <img src="/logo.png" alt="WFG National Title" className="header-logo" />
            </div>
          </div>

          {/* Center Section - Title */}
          <div className="header-center">
            <h1 className="header-title">FAR/BAR Contract Deadline Tracker</h1>
            <p className="header-subtitle">Precision Deadline Tracking for Title Professionals</p>
          </div>

          {/* Right Section - Actions & Account */}
          <div className="header-right">
            <div className="header-nav">
              {/* Home/Back Button */}
              {result ? (
                <button
                  className="nav-btn nav-btn-home"
                  onClick={handleReset}
                  title="Back to Home"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Home</span>
                </button>
              ) : null}

              {/* Notifications */}
              {result && <NotificationCenter deadlines={result.deadlines} />}

              {/* My Reports Button */}
              {currentUser && (
                <button
                  className="nav-btn nav-btn-calculations"
                  onClick={() => setIsDashboardOpen(true)}
                  title="View Saved Reports"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>My Reports</span>
                </button>
              )}
            </div>

            {/* Account Section */}
            <div className="header-account">
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <div className="disclaimer">
        <div className="container">
          <strong>Legal Disclaimer:</strong> This tool is for informational purposes only.
          Users remain responsible for verifying all deadlines and dates. Always refer to the actual contract.
        </div>
      </div>

      <main className="container">
        {!result ? (
          <div className="input-section">
            <div className="section-header">
              <h2>Contract Information</h2>
              {/* Configure button */}
              <button
                className="btn-configure"
                onClick={() => setIsConfigOpen(true)}
                title="Choose which deadlines appear in the report"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/>
                </svg>
                Configure Report
                {hiddenCount > 0 && (
                  <span className="configure-badge">{hiddenCount} hidden</span>
                )}
              </button>
            </div>

            {/* Toggle between Manual and Upload */}
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

            {/* Show appropriate input method */}
            <div className="form-container">
              {inputMethod === 'manual' ? (
                <ManualEntryForm onSubmit={handleCalculate} />
              ) : (
                <PDFUpload onExtractedData={handleExtractedData} />
              )}
            </div>
          </div>
        ) : (
          <DeadlineResults
            result={result}
            contractData={contractData}
            hiddenDeadlines={hiddenDeadlines}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>FAR/BAR Contract Deadline Tracker v1.0 | Professional Edition</p>
          <p className="small-text">Precision deadline tracking based on FAR/BAR Standard Residential Contract (Rev.12/24)</p>
          <p className="small-text">Calendar days with business day adjustments per STANDARD F</p>
        </div>
      </footer>

      {/* Configure modal */}
      {isConfigOpen && (
        <DeadlineConfig
          hiddenDeadlines={hiddenDeadlines}
          onSave={handleConfigSave}
          onClose={() => setIsConfigOpen(false)}
        />
      )}

      {/* Dashboard modal */}
      {isDashboardOpen && (
        <Dashboard
          onLoadSession={handleLoadSession}
          onClose={() => setIsDashboardOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
