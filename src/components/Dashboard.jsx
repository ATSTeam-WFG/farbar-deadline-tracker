import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getUserReports, deleteReport, renameReport, setReportStatus } from '../services/reportService';
import { getDeadlineStatuses } from '../services/deadlineStatusService';
import './Dashboard.css';

const STATUS_LABELS = { active: 'Active', closed: 'Closed', archived: 'Archived' };
const STATUS_NEXT = { active: ['closed', 'archived'], closed: ['active', 'archived'], archived: ['active'] };

function ProgressBar({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="session-progress">
      <div className="session-progress-bar">
        <div className="session-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="session-progress-label">{completed}/{total} done</span>
    </div>
  );
}

function ReportCard({ session, onLoad, onDelete, onRename, onStatusChange }) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(session.report_name);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const inputRef = useRef(null);

  const totalDeadlines = session.result?.deadlines?.length ?? 0;

  useEffect(() => {
    getDeadlineStatuses(session.id).then((map) => {
      const done = Object.values(map).filter(v => v.status === 'completed' || v.status === 'waived').length;
      setCompletedCount(done);
    }).catch(() => {});
  }, [session.id]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = async () => {
    setEditing(false);
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === session.report_name) {
      setNameVal(session.report_name);
      return;
    }
    try {
      await onRename(session.id, trimmed);
    } catch {
      setNameVal(session.report_name);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setNameVal(session.report_name); setEditing(false); }
  };

  const effectiveDate = (() => {
    try {
      const d = new Date(session.contract_data?.effectiveDate);
      return isNaN(d) ? 'N/A' : format(d, 'MMM d, yyyy');
    } catch { return 'N/A'; }
  })();

  const closingDate = (() => {
    try {
      const d = new Date(session.result?.metadata?.closingDate);
      return isNaN(d) ? 'N/A' : format(d, 'MMM d, yyyy');
    } catch { return 'N/A'; }
  })();

  const createdDate = session.created_at ? format(new Date(session.created_at), 'MMM d, yyyy h:mm a') : 'Recently';

  return (
    <div className="session-card">
      <div className="session-card-header">
        {editing ? (
          <input
            ref={inputRef}
            className="session-rename-input"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            maxLength={120}
          />
        ) : (
          <h3
            className="session-title"
            title="Double-click to rename"
            onDoubleClick={() => setEditing(true)}
          >
            {nameVal}
          </h3>
        )}

        <div className="session-card-actions">
          <div className="session-status-wrapper">
            <button
              className={`session-status-badge session-status-badge--${session.status}`}
              onClick={(e) => { e.stopPropagation(); setShowStatusMenu(v => !v); }}
              title="Change status"
            >
              {STATUS_LABELS[session.status] || session.status}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </button>
            {showStatusMenu && (
              <>
                <div className="session-status-overlay" onClick={() => setShowStatusMenu(false)} />
                <div className="session-status-menu">
                  {STATUS_NEXT[session.status]?.map(s => (
                    <button
                      key={s}
                      className="session-status-option"
                      onClick={(e) => { e.stopPropagation(); onStatusChange(session.id, s); setShowStatusMenu(false); }}
                    >
                      Mark {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className="session-icon-btn"
            title="Rename"
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="session-delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(session.id, e); }}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="session-details">
        <div className="session-detail-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Effective: {effectiveDate}</span>
        </div>
        <div className="session-detail-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Closing: {closingDate}</span>
        </div>
        <div className="session-detail-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <span>{session.contract_data?.transactionType === 'cash' ? 'Cash' : 'Financed'}</span>
        </div>
      </div>

      <ProgressBar completed={completedCount} total={totalDeadlines} />

      <div className="session-footer">
        <span className="session-date">Saved {createdDate}</span>
        <button className="session-load-btn" onClick={() => onLoad(session)}>
          Load Report →
        </button>
      </div>
    </div>
  );
}

function Dashboard({ onLoadSession, onClose, inline = false }) {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadSessions();
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getUserReports(currentUser.id);
      setSessions(data);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (session) => {
    onLoadSession({
      id: session.id,
      contractData: session.contract_data,
      result: session.result,
    });
    onClose();
  };

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this report? This cannot be undone.')) return;
    try {
      await deleteReport(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {
      alert('Failed to delete report.');
    }
  };

  const handleRename = async (id, name) => {
    await renameReport(id, name);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, report_name: name } : s));
  };

  const handleStatusChange = async (id, status) => {
    await setReportStatus(id, status);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const filtered = sessions
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      return a.report_name.localeCompare(b.report_name);
    });

  if (loading) {
    return (
      <div className="dashboard-modal dashboard-modal--inline">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading your saved reports...</p>
        </div>
      </div>
    );
  }

  const content = (
    <div className={inline ? 'dashboard-modal dashboard-modal--inline' : 'dashboard-modal'}>
      <div className="dashboard-header">
        <div>
          <h2>My Saved Reports</h2>
          <p className="dashboard-subtitle">{sessions.length} {sessions.length === 1 ? 'report' : 'reports'} saved</p>
        </div>
        {!inline && (
          <button className="dashboard-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="dashboard-filters">
          <div className="dashboard-filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="dashboard-select">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="dashboard-filter-group">
            <label>Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dashboard-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {error && (
          <div className="dashboard-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {!currentUser ? (
          <div className="dashboard-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <h3>Sign in to view reports</h3>
            <p>Your saved reports appear here after signing in.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <h3>{sessions.length === 0 ? 'No saved reports yet' : 'No matching reports'}</h3>
            <p>{sessions.length === 0 ? 'Save a calculation to see it here.' : 'Try changing the filter.'}</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filtered.map(session => (
              <ReportCard
                key={session.id}
                session={session}
                onLoad={handleLoad}
                onDelete={handleDelete}
                onRename={handleRename}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return inline ? content : (
    <div className="dashboard-overlay" onClick={onClose}>{content}</div>
  );
}

export default Dashboard;
