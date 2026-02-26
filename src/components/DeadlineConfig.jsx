import { useState, useMemo } from 'react';
import { DEADLINE_DEFINITIONS } from '../utils/deadlineRules';

/**
 * DeadlineConfig modal – lets the user deselect deadlines they don't want
 * to appear on the final report.
 *
 * Props:
 *   hiddenDeadlines  – Set<string>  ids of currently-hidden deadlines
 *   onSave(newSet)   – called when user confirms their selection
 *   onClose()        – called to dismiss without saving
 */
function DeadlineConfig({ hiddenDeadlines, onSave, onClose }) {
  // Local checked state: id → boolean (true = visible in report)
  const [checked, setChecked] = useState(() => {
    const map = {};
    DEADLINE_DEFINITIONS.forEach(def => {
      map[def.id] = !hiddenDeadlines.has(def.id);
    });
    return map;
  });

  // Group definitions by category
  const grouped = useMemo(() => {
    const map = {};
    DEADLINE_DEFINITIONS.forEach(def => {
      if (!map[def.category]) map[def.category] = [];
      map[def.category].push(def);
    });
    return map;
  }, []);

  const allChecked = DEADLINE_DEFINITIONS.every(def => checked[def.id]);
  const noneChecked = DEADLINE_DEFINITIONS.every(def => !checked[def.id]);

  const toggleOne = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAll = () => {
    const map = {};
    DEADLINE_DEFINITIONS.forEach(def => { map[def.id] = true; });
    setChecked(map);
  };

  const deselectAll = () => {
    const map = {};
    DEADLINE_DEFINITIONS.forEach(def => { map[def.id] = false; });
    setChecked(map);
  };

  const handleSave = () => {
    const newHidden = new Set(
      DEADLINE_DEFINITIONS.filter(def => !checked[def.id]).map(def => def.id)
    );
    onSave(newHidden);
  };

  const visibleCount = DEADLINE_DEFINITIONS.filter(def => checked[def.id]).length;

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal" role="dialog" aria-modal="true" aria-labelledby="config-title">
        {/* Header */}
        <div className="config-header">
          <div>
            <h2 id="config-title">Configure Report Deadlines</h2>
            <p className="config-subtitle">
              Select which deadlines to include in the generated report.
              All are included by default.
            </p>
          </div>
          <button className="config-close-btn" onClick={onClose} aria-label="Close">&#x2715;</button>
        </div>

        {/* Bulk actions */}
        <div className="config-bulk-actions">
          <span className="config-count">
            {visibleCount} of {DEADLINE_DEFINITIONS.length} selected
          </span>
          <div className="config-bulk-btns">
            <button
              className="btn-link"
              onClick={selectAll}
              disabled={allChecked}
            >
              Select all
            </button>
            <span className="config-divider">|</span>
            <button
              className="btn-link"
              onClick={deselectAll}
              disabled={noneChecked}
            >
              Deselect all
            </button>
          </div>
        </div>

        {/* Checklist grouped by category */}
        <div className="config-body">
          {Object.entries(grouped).map(([category, defs]) => (
            <div key={category} className="config-category">
              <div className="config-category-header">{category}</div>
              <div className="config-items">
                {defs.map(def => (
                  <label key={def.id} className="config-item">
                    <input
                      type="checkbox"
                      checked={checked[def.id]}
                      onChange={() => toggleOne(def.id)}
                    />
                    <span className="config-item-info">
                      <span className="config-item-name">{def.name}</span>
                      {def.appliesTo !== 'all' && (
                        <span className="config-item-tag">
                          {def.appliesTo === 'financed' ? 'Financed only' : 'Condo/HOA only'}
                        </span>
                      )}
                      {def.note && (
                        <span className="config-item-note">{def.note}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="config-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Apply to Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeadlineConfig;
