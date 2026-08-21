import { useState, useMemo } from 'react';
import { daysRemaining } from '../utils/businessDays';
import { getDeadlineStatus, getStatusLabel } from '../utils/deadlineRules';
import './CalendarView.css';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_ABBREV = {
  'Deposit': 'DEP',
  'Financing': 'FIN',
  'Inspection': 'INS',
  'Contingency': 'CON',
  'Title': 'TTL',
  'Seller Obligations': 'SEL',
  'Condo': 'HOA',
  'Closing': 'CLO',
};

const STATUS_RANK = { overdue: 0, 'due-today': 1, urgent: 2, upcoming: 3, future: 4 };

function buildCalendarGrid(year, month) {
  const startOffset = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(year, month, 1 - startOffset + i));
  }
  return days;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDeadlineMap(deadlines, hiddenDeadlines) {
  const map = {};
  for (const dl of deadlines) {
    if (hiddenDeadlines.has(dl.id)) continue;
    const key = toDateKey(new Date(dl.dueDate));
    if (!map[key]) map[key] = [];
    map[key].push(dl);
  }
  return map;
}

function getDominantStatus(dlList, statuses) {
  let best = 'future';
  for (const dl of dlList) {
    const dlStatus = statuses?.[dl.id]?.status;
    if (dlStatus === 'completed' || dlStatus === 'waived') continue;
    const days = daysRemaining(dl.dueDate);
    const s = getDeadlineStatus(days);
    if (STATUS_RANK[s] < STATUS_RANK[best]) best = s;
  }
  return best;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDetailDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function CalendarView({ deadlines, hiddenDeadlines = new Set(), statuses = {}, savedReports = [], activeReportId, onSwitchReport }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [animDir, setAnimDir] = useState('none');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const deadlineMap = useMemo(() => buildDeadlineMap(deadlines, hiddenDeadlines), [deadlines, hiddenDeadlines]);

  const navigate = (dir) => {
    setAnimDir(dir);
    setSelectedDate(null);
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'right' ? 1 : -1));
      return d;
    });
  };

  const goToToday = () => {
    const todayFirst = new Date(today.getFullYear(), today.getMonth(), 1);
    if (todayFirst.getTime() !== currentMonth.getTime()) {
      setAnimDir(todayFirst > currentMonth ? 'right' : 'left');
      setSelectedDate(null);
      setCurrentMonth(todayFirst);
    }
  };

  const handleDayClick = (day) => {
    const key = toDateKey(day);
    if (!deadlineMap[key]) return;
    setSelectedDate(prev => (prev && isSameDay(day, prev)) ? null : day);
  };

  const selectedKey = selectedDate ? toDateKey(selectedDate) : null;
  const selectedDeadlines = selectedKey ? (deadlineMap[selectedKey] || []) : [];
  const gridKey = `${year}-${month}`;

  const activeReport = savedReports.find(r => r.id === activeReportId);
  const reportLabel = activeReport
    ? (activeReport.report_name || activeReport.property_address || 'Report')
    : null;

  return (
    <div className="calendar-view">
      {/* Report Switcher */}
      {savedReports.length > 0 && onSwitchReport && (
        <div className="calendar-report-switcher">
          <span className="calendar-report-label">Viewing:</span>
          <select
            className="calendar-report-select"
            value={activeReportId || ''}
            onChange={(e) => onSwitchReport(e.target.value || null)}
          >
            <option value="">— Current (unsaved) —</option>
            {savedReports.map(r => (
              <option key={r.id} value={r.id}>
                {r.report_name || r.property_address || 'Untitled'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Controls */}
      <div className="calendar-controls">
        <button className="cal-nav-btn" onClick={() => navigate('left')} aria-label="Previous month">&lt;</button>
        <div className="cal-month-label">
          <span className="cal-month-name">{MONTH_NAMES[month]}</span>
          <span className="cal-year">{year}</span>
        </div>
        <button className="cal-today-btn" onClick={goToToday}>Today</button>
        <button className="cal-nav-btn" onClick={() => navigate('right')} aria-label="Next month">&gt;</button>
      </div>

      <div className="calendar-layout">
        <div className="calendar-grid-wrapper">
          <div className="calendar-dow-row">
            {DOW_LABELS.map(d => <div key={d} className="calendar-dow-cell">{d}</div>)}
          </div>

          <div key={gridKey} className={`calendar-month-grid anim-${animDir}`}>
            {calendarDays.map((day, idx) => {
              const key = toDateKey(day);
              const isCurrentMonth = day.getMonth() === month;
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayDeadlines = deadlineMap[key] || [];
              const hasDeadlines = dayDeadlines.length > 0;
              const dominantStatus = hasDeadlines ? getDominantStatus(dayDeadlines, statuses) : null;

              let cellClass = 'calendar-day';
              if (!isCurrentMonth) cellClass += ' calendar-day--other-month';
              if (isToday) cellClass += ' calendar-day--today';
              if (isSelected) cellClass += ' calendar-day--selected';
              if (dominantStatus) cellClass += ` calendar-day--has-${dominantStatus}`;
              if (hasDeadlines) cellClass += ' calendar-day--clickable';

              return (
                <div
                  key={idx}
                  className={cellClass}
                  onClick={() => handleDayClick(day)}
                  role={hasDeadlines ? 'button' : undefined}
                  tabIndex={hasDeadlines ? 0 : undefined}
                  aria-label={hasDeadlines ? `${day.toLocaleDateString()} - ${dayDeadlines.length} deadline(s)` : undefined}
                  onKeyDown={hasDeadlines ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(day); } : undefined}
                >
                  <div className="calendar-day-number">{day.getDate()}</div>
                  {hasDeadlines && (
                    <div className="calendar-day-chips">
                      {dayDeadlines.slice(0, 2).map((dl) => {
                        const dlStatus = statuses[dl.id]?.status;
                        const s = (dlStatus === 'completed' || dlStatus === 'waived')
                          ? dlStatus
                          : getDeadlineStatus(daysRemaining(dl.dueDate));
                        const abbrev = CATEGORY_ABBREV[dl.category] || dl.category.slice(0, 3).toUpperCase();
                        return (
                          <span key={dl.id} className={`cal-chip cal-chip--${s}`}>
                            {abbrev}
                          </span>
                        );
                      })}
                      {dayDeadlines.length > 2 && (
                        <span className={`cal-chip-more cal-chip-more--${dominantStatus}`}>
                          +{dayDeadlines.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && selectedDeadlines.length > 0 && (
          <div className="calendar-detail-panel">
            <div className="cal-detail-header">
              <span className="cal-detail-date">{formatDetailDate(selectedDate)}</span>
              <button className="cal-detail-close" onClick={() => setSelectedDate(null)} aria-label="Close detail panel">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="cal-detail-list">
              {selectedDeadlines.map((dl) => {
                const days = daysRemaining(dl.dueDate);
                const urgencyStatus = getDeadlineStatus(days);
                const dlStatus = statuses[dl.id]?.status;
                const displayStatus = (dlStatus && dlStatus !== 'pending') ? dlStatus : urgencyStatus;
                return (
                  <div key={dl.id} className={`cal-detail-card cal-detail-card--${urgencyStatus}${dlStatus === 'completed' ? ' cal-detail-card--done' : ''}${dlStatus === 'waived' ? ' cal-detail-card--waived' : ''}`}>
                    <div className="cal-detail-card-name">
                      {dl.name}
                      {dl.priority === 'critical' && <span className="badge-critical">CRITICAL</span>}
                      {dlStatus && dlStatus !== 'pending' && (
                        <span className={`badge-dl-status badge-dl-status--${dlStatus}`}>{dlStatus}</span>
                      )}
                    </div>
                    <div className="cal-detail-card-desc">{dl.description}</div>
                    {dl.note && <div className="cal-detail-card-note">NOTE: {dl.note}</div>}
                    {statuses[dl.id]?.note && (
                      <div className="cal-detail-card-note cal-detail-card-note--user">Your note: {statuses[dl.id].note}</div>
                    )}
                    <div className="cal-detail-card-meta">
                      <span className={`status-badge status-${urgencyStatus}`}>{getStatusLabel(urgencyStatus)}</span>
                      <span className="cal-detail-ref">{dl.contractReference}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="calendar-legend">
        {['overdue', 'due-today', 'urgent', 'upcoming', 'future', 'completed', 'waived'].map(s => (
          <div key={s} className="cal-legend-item">
            <span className={`cal-dot cal-dot--${s}`} />
            <span className="cal-legend-label">{
              s === 'completed' ? 'Completed' :
              s === 'waived' ? 'Waived' :
              getStatusLabel(s)
            }</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarView;
