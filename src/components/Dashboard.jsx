import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getUserSessions, deleteSession } from '../services/sessionService';
import './Dashboard.css';

// Helper to safely convert Firestore Timestamp to Date
const getDateFromTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate(); // Firestore Timestamp
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

function Dashboard({ onLoadSession, onClose }) {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const userSessions = await getUserSessions(currentUser.uid);
      setSessions(userSessions);
    } catch (err) {
      console.error('Error loading sessions:', err);

      // More detailed error message
      let errorMessage = 'Failed to load saved reports. ';
      if (err.code === 'permission-denied') {
        errorMessage += 'Please check your Firestore security rules.';
      } else if (err.code === 'unavailable') {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += 'Please try again or contact support.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = (session) => {
    onLoadSession(session);
    onClose();
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-overlay">
        <div className="dashboard-modal">
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading your saved reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <div>
            <h2>My Saved Reports</h2>
            <p className="dashboard-subtitle">
              {sessions.length} {sessions.length === 1 ? 'report' : 'reports'} saved
            </p>
          </div>
          <button className="dashboard-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="dashboard-content">
          {error && (
            <div className="dashboard-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="dashboard-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <h3>No saved reports yet</h3>
              <p>Your report history will appear here once you save your first contract.</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="session-card"
                  onClick={() => handleLoadSession(session)}
                >
                  <div className="session-card-header">
                    <h3 className="session-title">
                      {session.propertyAddress || 'Untitled Report'}
                    </h3>
                    <button
                      className="session-delete-btn"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>

                  <div className="session-details">
                    <div className="session-detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>
                        Effective: {(() => {
                          try {
                            const date = new Date(session.contractData.effectiveDate);
                            return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d, yyyy');
                          } catch (e) {
                            return 'N/A';
                          }
                        })()}
                      </span>
                    </div>

                    <div className="session-detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>
                        Closing: {(() => {
                          try {
                            const date = new Date(session.result.metadata.closingDate);
                            return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d, yyyy');
                          } catch (e) {
                            return 'N/A';
                          }
                        })()}
                      </span>
                    </div>

                    <div className="session-detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="session-type">
                        {session.contractData.transactionType === 'cash' ? 'Cash' : 'Financed'}
                      </span>
                    </div>
                  </div>

                  <div className="session-footer">
                    <span className="session-date">
                      {(() => {
                        const date = getDateFromTimestamp(session.createdAt);
                        return date ? `Saved ${format(date, 'MMM d, yyyy h:mm a')}` : 'Saved Recently';
                      })()}
                    </span>
                    <span className="session-load-hint">Click to load →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
