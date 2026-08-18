import { useState } from 'react';
import ManualEntryForm from './components/ManualEntryForm';
import PDFUpload from './components/PDFUpload';
import DeadlineResults from './components/DeadlineResults';
import DeadlineConfig from './components/DeadlineConfig';
import NotificationCenter from './components/NotificationCenter';
import NotificationSettings from './components/NotificationSettings';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import DisclaimerModal from './components/DisclaimerModal';
import { calculateAllDeadlines } from './utils/deadlineRules';
import './App.css';

function FeedbackButton() {
  return (
    <a
      href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=o6hYNyq_bUuqce_63KT3Ta7fqjmMiadGmU6Gof7Q8-pUNk1DOTQ1RjM0R0lMVzY0SldXOUtPVjRESC4u"
      target="_blank"
      rel="noopener noreferrer"
      className="feedback-btn"
      aria-label="Share feedback"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      <span>Feedback</span>
    </a>
  );
}

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(
    !localStorage.getItem('wfg_disclaimer_v1')
  );
  const [inputMethod, setInputMethod] = useState('manual');
  const [result, setResult] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [hiddenDeadlines, setHiddenDeadlines] = useState(new Set());
  const [activeView, setActiveView] = useState('calculator');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  };

  const handleLoadSession = (session) => {
    setContractData(session.contractData);
    setResult(session.result);
    setActiveView('calculator');
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

  const pageTitles = {
    calculator: 'Deadline Tracker',
    reports: 'My Reports',
    notifications: 'Notifications',
    settings: 'Settings',
  };

  return (
    <div className="app-layout">
      {showDisclaimer && (
        <DisclaimerModal onAgree={() => {
          localStorage.setItem('wfg_disclaimer_v1', 'accepted');
          setShowDisclaimer(false);
        }} />
      )}

      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        currentUser={null}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-panel">
        <header className="main-topbar">
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="topbar-title">
            <h1>{pageTitles[activeView]}</h1>
            {activeView === 'calculator' && result && contractData?.propertyAddress && (
              <span className="topbar-subtitle">{contractData.propertyAddress}</span>
            )}
          </div>

          <div className="topbar-actions">
            {activeView === 'calculator' && result && (
              <button className="topbar-action-btn" onClick={handleReset} title="New Contract">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>New</span>
              </button>
            )}
          </div>
        </header>

        <main className="main-body">
          {(panelMap[activeView] || panelMap.calculator)()}
        </main>
      </div>

      <FeedbackButton />
    </div>
  );
}

export default App;
