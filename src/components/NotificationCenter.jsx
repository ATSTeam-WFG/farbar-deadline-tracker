import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import './NotificationCenter.css';

function NotificationCenter({ deadlines, inline = false }) {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!deadlines || deadlines.length === 0) {
      setNotifications([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate notifications for urgent deadlines
    const urgentDeadlines = deadlines
      .filter(deadline => {
        const dueDate = new Date(deadline.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysRemaining = differenceInDays(dueDate, today);
        return daysRemaining >= 0 && daysRemaining <= 7; // Next 7 days
      })
      .map(deadline => {
        const dueDate = new Date(deadline.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysRemaining = differenceInDays(dueDate, today);

        return {
          id: deadline.id,
          title: deadline.name,
          message: getNotificationMessage(deadline.name, daysRemaining),
          dueDate: deadline.dueDate,
          daysRemaining,
          priority: deadline.priority,
          type: getNotificationType(daysRemaining)
        };
      });

    setNotifications(urgentDeadlines);
  }, [deadlines]);

  const getNotificationMessage = (deadlineName, daysRemaining) => {
    if (daysRemaining === 0) return `${deadlineName} is due TODAY`;
    if (daysRemaining === 1) return `${deadlineName} is due TOMORROW`;
    return `${deadlineName} is due in ${daysRemaining} days`;
  };

  const getNotificationType = (daysRemaining) => {
    if (daysRemaining === 0) return 'critical';
    if (daysRemaining <= 1) return 'urgent';
    if (daysRemaining <= 3) return 'warning';
    return 'info';
  };

  const unreadCount = notifications.length;

  const panelContent = (
    <div className={inline ? 'notification-panel notification-panel--inline' : 'notification-panel'}>
      <div className="notification-header">
        <h3>Upcoming Deadlines</h3>
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount} upcoming</span>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>No upcoming deadlines</p>
            <span>All caught up!</span>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item notification-${notification.type}`}
            >
              <div className="notification-icon">
                {notification.type === 'critical' && '🔴'}
                {notification.type === 'urgent' && '🟠'}
                {notification.type === 'warning' && '🟡'}
                {notification.type === 'info' && '🔵'}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-date">
                  {format(new Date(notification.dueDate), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (inline) {
    return panelContent;
  }

  return (
    <div className="notification-center">
      <button
        className="notification-bell-btn"
        onClick={() => setShowPanel(!showPanel)}
        title="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <>
          <div className="notification-overlay" onClick={() => setShowPanel(false)} />
          {panelContent}
        </>
      )}
    </div>
  );
}

export default NotificationCenter;
