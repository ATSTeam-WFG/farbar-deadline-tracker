import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPreferences, updateUserPreferences } from '../services/userPreferencesService';
import './NotificationSettings.css';

function NotificationSettings({ onClose }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    notifyDaysBefore: 3,
    notificationTime: '09:00',
    deadlineTypes: {
      critical: true,
      urgent: true,
      warning: true,
      info: false
    }
  });

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const userPrefs = await getUserPreferences(currentUser.id);
      if (userPrefs) {
        setPreferences(userPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserPreferences(currentUser.id, preferences);

      // Show success message
      const message = document.createElement('div');
      message.textContent = '✓ Notification settings saved!';
      message.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
      `;
      document.body.appendChild(message);
      setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => message.remove(), 300);
      }, 3000);

      setTimeout(onClose, 1000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleDeadlineTypeToggle = (type) => {
    setPreferences(prev => ({
      ...prev,
      deadlineTypes: {
        ...prev.deadlineTypes,
        [type]: !prev.deadlineTypes[type]
      }
    }));
  };

  if (loading) {
    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-loading">
            <div className="loading-spinner"></div>
            <p>Loading notification settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div>
            <h2>Notification Settings</h2>
            <p className="settings-subtitle">Manage your email notification preferences</p>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-content">
          {/* Email Notifications Toggle */}
          <div className="settings-section">
            <div className="settings-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <h3>Email Notifications</h3>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Enable Email Notifications</label>
                <span className="setting-description">Receive email alerts for upcoming deadlines</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {preferences.emailNotifications && (
              <div className="setting-item">
                <div className="setting-info">
                  <label>Your Email</label>
                  <span className="setting-description">{currentUser?.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notification Timing */}
          {preferences.emailNotifications && (
            <>
              <div className="settings-section">
                <div className="settings-section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <h3>Notification Timing</h3>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Notify Me (Days Before Deadline)</label>
                    <span className="setting-description">How many days in advance to send notifications</span>
                  </div>
                  <select
                    className="setting-select"
                    value={preferences.notifyDaysBefore}
                    onChange={(e) => setPreferences(prev => ({ ...prev, notifyDaysBefore: parseInt(e.target.value) }))}
                  >
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={3}>3 days before</option>
                    <option value={5}>5 days before</option>
                    <option value={7}>7 days before</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Notification Time</label>
                    <span className="setting-description">What time to send daily notifications</span>
                  </div>
                  <input
                    type="time"
                    className="setting-input"
                    value={preferences.notificationTime}
                    onChange={(e) => setPreferences(prev => ({ ...prev, notificationTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Deadline Types */}
              <div className="settings-section">
                <div className="settings-section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h3>Deadline Priority Filters</h3>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label className="priority-label critical">Critical (Due Today)</label>
                    <span className="setting-description">Deadlines due today</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.deadlineTypes.critical}
                      onChange={() => handleDeadlineTypeToggle('critical')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label className="priority-label urgent">Urgent (1-2 Days)</label>
                    <span className="setting-description">Deadlines due within 1-2 days</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.deadlineTypes.urgent}
                      onChange={() => handleDeadlineTypeToggle('urgent')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label className="priority-label warning">Warning (3-5 Days)</label>
                    <span className="setting-description">Deadlines due within 3-5 days</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.deadlineTypes.warning}
                      onChange={() => handleDeadlineTypeToggle('warning')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label className="priority-label info">Info (6-7 Days)</label>
                    <span className="setting-description">Deadlines due within 6-7 days</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.deadlineTypes.info}
                      onChange={() => handleDeadlineTypeToggle('info')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Info Box */}
          {preferences.emailNotifications && (
            <div className="settings-info-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <strong>Email Notification Setup Required</strong>
                <p>Email notifications are sent via Resend using a Supabase Edge Function. See SUPABASE_SETUP.md for activation instructions.</p>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
