import { useState } from 'react';
import { daysRemaining, formatDate } from '../utils/businessDays';
import { getDeadlineStatus, getStatusLabel } from '../utils/deadlineRules';
import { useAuth } from '../contexts/AuthContext';
import { saveSession } from '../services/sessionService';
import { exportToPDF } from '../services/pdfExport';
import CalendarView from './CalendarView';

// Category display config: order, label, color tier
const CATEGORY_CONFIG = [
  { key: 'Deposit',          label: 'Deposits',           tier: 'critical', defaultOpen: true },
  { key: 'Financing',        label: 'Financing',          tier: 'high',     defaultOpen: true },
  { key: 'Inspection',       label: 'Inspections',        tier: 'high',     defaultOpen: true },
  { key: 'Contingency',      label: 'Contingencies',      tier: 'standard', defaultOpen: false },
  { key: 'Title',            label: 'Title',              tier: 'standard', defaultOpen: false },
  { key: 'Seller Obligations', label: 'Seller Obligations', tier: 'standard', defaultOpen: false },
  { key: 'Condo',            label: 'Condo / HOA',        tier: 'standard', defaultOpen: false },
  { key: 'Closing',          label: 'Closing',            tier: 'closing',  defaultOpen: true },
];

function ChevronIcon({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      className={`deadline-group-chevron${open ? ' deadline-group-chevron--open' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function DeadlineGroup({ config, deadlines, isFinanced }) {
  const [open, setOpen] = useState(config.defaultOpen || (config.key === 'Financing' && isFinanced));

  if (deadlines.length === 0) return null;

  return (
    <div className="deadline-group">
      <button
        className={`deadline-group-header deadline-group-header--${config.tier}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="deadline-group-title">
          <span className="deadline-group-name">{config.label}</span>
          <span className="deadline-group-count">{deadlines.length}</span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="deadline-group-rows">
          {deadlines.map(deadline => {
            const days = daysRemaining(deadline.dueDate);
            const status = getDeadlineStatus(days);
            return (
              <div key={deadline.id} className={`deadline-row deadline-row--${status}`}>
                <div className="deadline-row-name">
                  <div className="deadline-name">
                    {deadline.name}
                    {deadline.isEstimated && <span className="estimated-indicator"> [EST]</span>}
                    {deadline.isOption && <span className="option-indicator"> [OPT]</span>}
                    {deadline.priority === 'critical' && (
                      <span className="badge-critical">CRITICAL</span>
                    )}
                  </div>
                  <div className="deadline-description">{deadline.description}</div>
                  {deadline.note && (
                    <div className="deadline-note">NOTE: {deadline.note}</div>
                  )}
                  <div className="deadline-reference">Ref: {deadline.contractReference}</div>
                </div>

                <div className="deadline-row-date">
                  <strong>{formatDate(deadline.dueDate)}</strong>
                  {deadline.calculatedFrom === 'closing' && (
                    <div className="calc-direction">← from closing</div>
                  )}
                  {deadline.isConditional && (
                    <div className="conditional-note">Conditional</div>
                  )}
                </div>

                <div className="deadline-row-days">
                  {deadline.calendarDays > 0 ? `${deadline.calendarDays} cal` : '—'}
                </div>

                <div className="deadline-row-remaining">
                  <span className={days < 0 ? 'text-danger' : days <= 3 ? 'text-warning' : ''}>
                    {days < 0
                      ? `${Math.abs(days)}d overdue`
                      : days === 0 ? 'Due today'
                      : days === 1 ? '1 day'
                      : `${days} days`}
                  </span>
                </div>

                <div className="deadline-row-status">
                  <span className={`status-badge status-${status}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeadlineResults({ result, contractData, hiddenDeadlines = new Set(), onReset }) {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  if (!result || !result.deadlines || result.deadlines.length === 0) {
    return null;
  }

  const { metadata } = result;
  const deadlines = result.deadlines.filter(d => !hiddenDeadlines.has(d.id));
  const isFinanced = contractData.transactionType === 'financed';

  const overdueCount = deadlines.filter(d => daysRemaining(d.dueDate) < 0).length;
  const urgentCount = deadlines.filter(d => {
    const days = daysRemaining(d.dueDate);
    return days >= 0 && days <= 3;
  }).length;

  // Group deadlines by category in the defined order
  const groupedDeadlines = CATEGORY_CONFIG.map(config => ({
    config,
    deadlines: deadlines.filter(d => d.category === config.key),
  })).filter(g => g.deadlines.length > 0);

  const handleSaveSession = async () => {
    if (!currentUser) {
      alert('Please sign in to save calculations');
      return;
    }
    setSaving(true);
    try {
      if (!result?.deadlines?.length) throw new Error('No deadline data to save');
      await saveSession(currentUser.uid, { contractData, result });

      const message = document.createElement('div');
      message.textContent = '✓ Calculation saved successfully!';
      message.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white; padding: 1rem 1.5rem; border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(16,185,129,0.3);
        font-weight: 600; z-index: 10000; animation: slideInRight 0.3s ease;
      `;
      document.body.appendChild(message);
      setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => message.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error('Error saving session:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(result, contractData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="results-section">
      <div className="results-header">
        <div>
          <h2>Contract Deadlines</h2>
          {contractData.propertyAddress && (
            <p className="property-address">{contractData.propertyAddress}</p>
          )}
        </div>
        <div className="input-method-toggle results-view-toggle">
          <button
            className={`toggle-btn${viewMode === 'list' ? ' active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
          <button
            className={`toggle-btn${viewMode === 'calendar' ? ' active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendar
          </button>
        </div>
        <div className="results-actions">
          {currentUser && (
            <button className="btn-secondary" onClick={handleSaveSession} disabled={saving}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button className="btn-secondary" onClick={handleExportPDF}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="12" y2="18" /><line x1="15" y1="15" x2="12" y2="18" />
            </svg>
            Export PDF
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
          <button className="btn-secondary" onClick={onReset}>New</button>
        </div>
      </div>

      {/* Contract Summary */}
      <div className="contract-summary">
        <div className="summary-item">
          <span className="label">Effective Date</span>
          <span className="value">{formatDate(contractData.effectiveDate)}</span>
        </div>
        <div className="summary-item">
          <span className="label">Transaction Type</span>
          <span className="value">{isFinanced ? 'Financed' : 'Cash'}</span>
        </div>
        {contractData.isCondo && (
          <div className="summary-item">
            <span className="label">Property Type</span>
            <span className="value">Condo / HOA</span>
          </div>
        )}
        <div className="summary-item">
          <span className="label">Closing Date</span>
          <span className="value">
            {formatDate(metadata.closingDate)}
            {metadata.isClosingEstimated && <span className="estimated-badge"> (Est.)</span>}
          </span>
        </div>
      </div>

      {/* Notices */}
      <div className="notice-box notice-info">
        <strong>BUSINESS DAY COMPLIANCE</strong>
        <p>All deadlines adjusted to next business day per FAR/BAR STANDARD F if they fall on weekends or federal holidays.</p>
      </div>

      {metadata.isClosingEstimated && (
        <div className="notice-box notice-info">
          <strong>NOTICE: Estimated Closing Date</strong>
          <p>
            Closing date not provided. Using industry standard of{' '}
            {contractData.transactionType === 'cash' ? '30' : '45'} days.
            Deadlines marked [EST] may change when actual closing date is provided.
          </p>
        </div>
      )}

      {hiddenDeadlines.size > 0 && (
        <div className="notice-box notice-muted">
          <strong>Note:</strong> {hiddenDeadlines.size} deadline{hiddenDeadlines.size > 1 ? 's have' : ' has'} been hidden via Configure Report.
        </div>
      )}

      {/* Alert Summary */}
      {(overdueCount > 0 || urgentCount > 0) && (
        <div className="alert-summary">
          {overdueCount > 0 && (
            <div className="alert alert-danger">
              <strong>CRITICAL: {overdueCount} Overdue Deadline{overdueCount > 1 ? 's' : ''}</strong>
            </div>
          )}
          {urgentCount > 0 && (
            <div className="alert alert-warning">
              <strong>URGENT: {urgentCount} Deadline{urgentCount > 1 ? 's' : ''} Due Within 3 Days</strong>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView deadlines={result.deadlines} hiddenDeadlines={hiddenDeadlines} />
      )}

      {/* Grouped Accordion List */}
      {viewMode === 'list' && (
        <div className="deadline-groups">
          {groupedDeadlines.map(({ config, deadlines: groupDeadlines }) => (
            <DeadlineGroup
              key={config.key}
              config={config}
              deadlines={groupDeadlines}
              isFinanced={isFinanced}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      {viewMode === 'list' && (
        <div className="legend-section">
          <div className="legend-column">
            <div className="legend-title">Status Legend</div>
            <div className="legend-items">
              {[
                { cls: 'overdue',   label: 'Overdue',        desc: 'Past deadline' },
                { cls: 'due-today', label: 'Due Today',      desc: 'Due today' },
                { cls: 'urgent',    label: 'Urgent',         desc: 'Within 3 days' },
                { cls: 'upcoming',  label: 'Upcoming',       desc: 'Within 7 days' },
                { cls: 'future',    label: 'Future',         desc: 'More than 7 days' },
              ].map(s => (
                <div key={s.cls} className="legend-item">
                  <span className={`status-badge status-${s.cls}`}>{s.label}</span>
                  <span>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="legend-column">
            <div className="legend-title">Indicators</div>
            <div className="legend-items">
              {[
                { badge: '[EST]',         desc: 'Calculated from estimated closing date' },
                { badge: '[OPT]',         desc: 'Multiple options available' },
                { badge: 'NOTE',          desc: 'Special notes or conditions apply' },
                { badge: 'Conditional',   desc: 'May vary if prior deadlines missed' },
              ].map(i => (
                <div key={i.badge} className="legend-item">
                  <span className="legend-badge">{i.badge}</span>
                  <span>{i.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="disclaimer-footer">
        <strong>IMPORTANT DISCLAIMER:</strong> This calculator is for informational purposes only.
        All dates should be verified against the actual FAR/BAR contract.
        Consult your title company or real estate attorney for official deadline tracking.
      </div>
    </div>
  );
}

export default DeadlineResults;
