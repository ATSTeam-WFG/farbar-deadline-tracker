import { useState, useRef, useEffect } from 'react';
import {
  validateAndNormalizeLogo,
  normalizeStoredLogo,
  dataUrlToBlob,
  LOGO_ACCEPT,
  LogoValidationError,
} from '../utils/logoUtils';
import { getSavedLogo, saveLogo, removeSavedLogo } from '../services/brandingService';
import './PdfBrandingModal.css';

// Why a save failed, in words a user can act on. Technical detail goes to the console only.
function describeSaveFailure(err) {
  switch (err && err.code) {
    case 'too_large': return 'it is too detailed to store (limit 1 MB).';
    case 'unauthorized': return 'you need to be signed in to save it.';
    case 'network': return 'we could not reach the server. Check your connection.';
    default: return 'saving is not available right now.';
  }
}

/**
 * "Choose PDF Branding" dialog.
 *
 * Mounted only while open (and keyed by user id by the parent), so every open starts fresh
 * and a different account can never inherit the previous account's state.
 *
 *  - Signed-in users get their saved logo loaded automatically and preselected.
 *  - A newly uploaded logo is one-time unless "Save this logo for future exports" is ticked
 *    (unchecked by default).
 *  - A failed save never blocks the export: the PDF is generated first, then the save runs.
 *
 * onExport(branding) must resolve true when the PDF was generated: {} selects the default
 * WFG logo, { logo: { dataUrl, width, height } } an uploaded or saved one.
 * onClose() closes the dialog. This component calls it when everything has finished.
 */
function PdfBrandingModal({ userId = null, onClose, onExport, exporting = false }) {
  const [choice, setChoice] = useState('wfg');
  const [pending, setPending] = useState(null);   // newly uploaded, validated, not stored
  const [saved, setSaved] = useState({ status: userId ? 'loading' : 'none', logo: null });
  const [saveRequested, setSaveRequested] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [checking, setChecking] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFailure, setSaveFailure] = useState(''); // non-empty = "PDF exported, logo not saved"
  const [loadAttempt, setLoadAttempt] = useState(0);
  const fileInputRef = useRef(null);
  const latestUpload = useRef(0);
  const choiceTouched = useRef(false);

  // Load the signed-in user's saved logo. A missing logo is normal; a corrupt or failed one
  // is reported without blocking anything else in the dialog.
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const blob = await getSavedLogo(userId);
        if (cancelled) return;
        if (!blob) {
          setSaved({ status: 'none', logo: null });
          return;
        }
        try {
          const logo = await normalizeStoredLogo(blob);
          if (cancelled) return;
          setSaved({ status: 'ready', logo });
          if (!choiceTouched.current) setChoice('custom'); // preselect, unless the user already chose
        } catch (validationError) {
          console.error('Saved PDF logo could not be read:', validationError);
          if (!cancelled) setSaved({ status: 'corrupt', logo: null });
        }
      } catch (loadError) {
        console.error('Could not load saved PDF logo:', loadError);
        if (!cancelled) setSaved({ status: 'error', logo: null });
      }
    })();
    return () => { cancelled = true; };
  }, [userId, loadAttempt]);

  const retryLoad = () => {
    setSaved({ status: 'loading', logo: null });
    setLoadAttempt((n) => n + 1);
  };

  const savedLogo = saved.status === 'ready' ? saved.logo : null;
  const activeLogo = pending || savedLogo;
  const saveFailed = Boolean(saveFailure);
  const locked = exporting || saving || removing || saveFailed;
  const customWithoutLogo = choice === 'custom' && !activeLogo;
  const exportDisabled = locked || checking || customWithoutLogo;

  // Escape closes the dialog, unless something is in flight.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !exporting && !saving && !removing) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, exporting, saving, removing]);

  const chooseOption = (value) => {
    choiceTouched.current = true;
    setChoice(value);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const requestId = ++latestUpload.current;
    setChecking(true);
    setUploadError('');
    try {
      const normalized = await validateAndNormalizeLogo(file);
      if (requestId !== latestUpload.current) return; // a newer selection superseded this one
      choiceTouched.current = true;
      setPending(normalized);
      setSaveRequested(false); // saving is always opt-in, per new logo
      setChoice('custom');
    } catch (err) {
      if (requestId !== latestUpload.current) return;
      const message = err instanceof LogoValidationError ? err.message : 'That file could not be used. Please try a different PNG or JPG.';
      // A rejected file never replaces an already-accepted logo; say so to avoid confusion.
      setUploadError(activeLogo ? `${message} Your current logo was kept.` : message);
    } finally {
      if (requestId === latestUpload.current) setChecking(false);
    }
  };

  const discardPending = () => {
    setPending(null);
    setSaveRequested(false);
    setUploadError('');
  };

  const attemptSave = async () => {
    setSaving(true);
    setSaveFailure('');
    try {
      await saveLogo(userId, dataUrlToBlob(pending.dataUrl));
      onClose();
    } catch (err) {
      console.error('Could not save PDF logo:', err);
      setSaveFailure(describeSaveFailure(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (exportDisabled) return;
    const useCustom = choice === 'custom';
    const branding = useCustom
      ? { logo: { dataUrl: activeLogo.dataUrl, width: activeLogo.width, height: activeLogo.height } }
      : {};

    const exported = await onExport(branding);
    if (!exported) return; // the parent already reported the failure; stay open so the user can retry

    if (useCustom && pending && saveRequested && userId) {
      await attemptSave(); // the PDF is already downloaded; a save problem can only add a notice
    } else {
      onClose();
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setRemoveError('');
    try {
      await removeSavedLogo(userId);
      setSaved({ status: 'none', logo: null });
      setConfirmRemove(false);
      if (!pending) setChoice('wfg'); // nothing left to use
    } catch (err) {
      console.error('Could not remove saved PDF logo:', err);
      setRemoveError('We could not remove your saved logo. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const canRemove = Boolean(userId) && (saved.status === 'ready' || saved.status === 'corrupt');
  const hintText = saved.status === 'loading' && !activeLogo
    ? 'Loading your saved logo…'
    : 'Upload a PNG or JPG logo to export with your own branding.';

  return (
    <div className="save-modal-overlay" onClick={locked || removing ? undefined : onClose}>
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
          onClick={onClose}
          disabled={exporting || saving || removing}
          aria-label="Close"
        >
          ×
        </button>

        <h3 id="branding-modal-title">Choose PDF Branding</h3>
        <p>Select the logo to use on this PDF.</p>

        {saveFailed && (
          <div className="branding-save-failure" role="alert">
            <strong>Your PDF was exported.</strong> Your logo was not saved: {saveFailure}
          </div>
        )}

        <div className="branding-options" role="radiogroup" aria-labelledby="branding-modal-title">
          <label className={`branding-option${choice === 'wfg' ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="pdf-branding"
              value="wfg"
              checked={choice === 'wfg'}
              onChange={() => chooseOption('wfg')}
              disabled={locked}
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
                onChange={() => chooseOption('custom')}
                disabled={locked}
              />
              <span className="branding-option-text">
                <span className="branding-option-title">Use My Logo</span>
                <span className="branding-option-desc">PNG or JPG, up to 2 MB</span>
              </span>
            </label>

            {saved.status === 'loading' && (
              <p className="branding-hint" aria-live="polite">Loading your saved logo…</p>
            )}
            {saved.status === 'error' && (
              <p className="branding-error" role="alert">
                We could not load your saved logo.{' '}
                <button type="button" className="branding-link" onClick={retryLoad} disabled={locked}>Try again</button>
              </p>
            )}
            {saved.status === 'corrupt' && (
              <p className="branding-error" role="alert">
                Your saved logo could not be read. Upload a new one or remove it.
              </p>
            )}

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
                disabled={locked || checking}
              >
                {checking ? 'Checking…' : pending ? 'Replace Logo' : savedLogo ? 'Upload New Logo' : 'Upload Logo'}
              </button>
              {pending && <span className="branding-file-name" title={pending.fileName}>{pending.fileName}</span>}
            </div>

            {uploadError && <p className="branding-error" role="alert">{uploadError}</p>}
            {!uploadError && customWithoutLogo && !checking && saved.status !== 'error' && saved.status !== 'corrupt' && (
              <p className="branding-hint">{hintText}</p>
            )}

            {activeLogo && (
              <figure className="branding-preview-block">
                <div className="branding-preview" aria-label="Logo preview">
                  <img src={activeLogo.dataUrl} alt="Your logo preview" />
                </div>
                <figcaption className="branding-preview-caption">
                  {pending
                    ? (saveRequested && !saveFailed ? 'New logo (will be saved when you export)' : 'New logo (not saved)')
                    : 'Saved logo'}
                </figcaption>
              </figure>
            )}

            {pending && userId && (
              <label className="branding-save-option">
                <input
                  type="checkbox"
                  checked={saveRequested}
                  onChange={(e) => setSaveRequested(e.target.checked)}
                  disabled={locked}
                />
                <span>
                  {savedLogo ? 'Replace my saved logo with this one' : 'Save this logo for future exports'}
                </span>
              </label>
            )}

            {pending && savedLogo && (
              <button type="button" className="branding-link" onClick={discardPending} disabled={locked}>
                Use my saved logo instead
              </button>
            )}

            {canRemove && !confirmRemove && (
              <button
                type="button"
                className="branding-link branding-link--danger"
                onClick={() => { setConfirmRemove(true); setRemoveError(''); }}
                disabled={locked}
              >
                Remove saved logo
              </button>
            )}
            {canRemove && confirmRemove && (
              <div className="branding-confirm" role="alertdialog" aria-label="Confirm removing your saved logo">
                <span>Remove your saved logo? This cannot be undone.</span>
                <span className="branding-confirm-actions">
                  <button type="button" className="btn-secondary btn-secondary--sm" onClick={() => setConfirmRemove(false)} disabled={removing}>
                    Keep
                  </button>
                  <button type="button" className="btn-primary btn-primary--sm" onClick={handleRemove} disabled={removing}>
                    {removing ? 'Removing…' : 'Remove'}
                  </button>
                </span>
              </div>
            )}
            {removeError && <p className="branding-error" role="alert">{removeError}</p>}
          </div>
        </div>

        <div className="save-modal-actions">
          {saveFailed ? (
            <>
              <button type="button" className="btn-secondary btn-secondary--sm" onClick={onClose} disabled={saving}>
                Done
              </button>
              <button type="button" className="btn-primary btn-primary--sm" onClick={attemptSave} disabled={saving}>
                {saving ? 'Saving…' : 'Try saving again'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-secondary btn-secondary--sm" onClick={onClose} disabled={exporting || saving || removing}>
                Cancel
              </button>
              <button type="button" className="btn-primary btn-primary--sm" onClick={handleExport} disabled={exportDisabled}>
                {exporting ? 'Exporting…' : saving ? 'Saving…' : 'Export PDF'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PdfBrandingModal;
