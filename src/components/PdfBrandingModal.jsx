import { useState, useRef, useEffect } from 'react';
import { validateAndNormalizeLogo, LOGO_ACCEPT, LogoValidationError } from '../utils/logoUtils';
import './PdfBrandingModal.css';

/**
 * "Choose PDF Branding" dialog.
 *
 * Mounted only while open, so every open starts fresh (WFG selected, no logo).
 * onExport receives the options object passed to exportToPDF: {} for the default
 * WFG logo, or { logo: { dataUrl, width, height } } for an uploaded logo.
 */
function PdfBrandingModal({ onCancel, onExport, exporting = false }) {
  const [choice, setChoice] = useState('wfg');
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef(null);
  const latestRequest = useRef(0);

  // Escape closes the dialog (unless an export is in flight).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !exporting) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel, exporting]);

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const requestId = ++latestRequest.current;
    setChecking(true);
    setError('');
    try {
      const normalized = await validateAndNormalizeLogo(file);
      if (requestId !== latestRequest.current) return; // a newer selection superseded this one
      setLogo(normalized);
      setChoice('custom');
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      const message = err instanceof LogoValidationError ? err.message : 'That file could not be used. Please try a different PNG or JPG.';
      // A rejected file never replaces an already-accepted logo; say so to avoid confusion.
      setError(logo ? `${message} Your current logo was kept.` : message);
    } finally {
      if (requestId === latestRequest.current) setChecking(false);
    }
  };

  const customWithoutLogo = choice === 'custom' && !logo;
  const exportDisabled = exporting || checking || customWithoutLogo;

  const handleExport = () => {
    if (exportDisabled) return;
    if (choice === 'custom') {
      onExport({ logo: { dataUrl: logo.dataUrl, width: logo.width, height: logo.height } });
    } else {
      onExport({});
    }
  };

  return (
    <div className="save-modal-overlay" onClick={exporting ? undefined : onCancel}>
      <div
        className="save-modal branding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branding-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="branding-modal-close"
          onClick={onCancel}
          disabled={exporting}
          aria-label="Close"
        >
          ×
        </button>

        <h3 id="branding-modal-title">Choose PDF Branding</h3>
        <p>Select the logo to use on this PDF.</p>

        <div className="branding-options" role="radiogroup" aria-labelledby="branding-modal-title">
          <label className={`branding-option${choice === 'wfg' ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="pdf-branding"
              value="wfg"
              checked={choice === 'wfg'}
              onChange={() => setChoice('wfg')}
              autoFocus
            />
            <span className="branding-option-text">
              <span className="branding-option-title">WFG Logo</span>
              <span className="branding-option-desc">Use standard WFG branding</span>
            </span>
          </label>

          <div className={`branding-option${choice === 'custom' ? ' is-selected' : ''}`}>
            <label className="branding-option-radio">
              <input
                type="radio"
                name="pdf-branding"
                value="custom"
                checked={choice === 'custom'}
                onChange={() => setChoice('custom')}
              />
              <span className="branding-option-text">
                <span className="branding-option-title">Use My Logo</span>
                <span className="branding-option-desc">PNG or JPG, up to 2 MB</span>
              </span>
            </label>

            <div className="branding-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept={LOGO_ACCEPT}
                onChange={handleFileChange}
                className="branding-file-input"
                tabIndex={-1}
                aria-label="Upload logo file"
              />
              <button
                type="button"
                className="btn-secondary btn-secondary--sm"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={exporting || checking}
              >
                {checking ? 'Checking…' : logo ? 'Replace Logo' : 'Upload Logo'}
              </button>
              {logo && <span className="branding-file-name" title={logo.fileName}>{logo.fileName}</span>}
            </div>

            {error && <p className="branding-error" role="alert">{error}</p>}
            {!error && customWithoutLogo && !checking && (
              <p className="branding-hint">Upload a PNG or JPG logo to export with your own branding.</p>
            )}

            {logo && (
              <div className="branding-preview" aria-label="Logo preview">
                <img src={logo.dataUrl} alt="Your uploaded logo preview" />
              </div>
            )}
          </div>
        </div>

        <div className="save-modal-actions">
          <button type="button" className="btn-secondary btn-secondary--sm" onClick={onCancel} disabled={exporting}>
            Cancel
          </button>
          <button type="button" className="btn-primary btn-primary--sm" onClick={handleExport} disabled={exportDisabled}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfBrandingModal;
