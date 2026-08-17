import { useState } from 'react';

function ManualEntryForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    effectiveDate: '',
    closingDate: '',
    transactionType: '',
    isCondo: false,
    propertyAddress: '',
    initialDepositDays: 3,
    // Condo Rider §1
    condoAssocApprovalRequired: false,
    condoAssocApprovalDaysBefore: 5,
    condoSellerInitiatesDays: 5,
    // Condo Rider §2(c)
    hasRightOfFirstRefusal: false,
    // Condo Rider §5
    condoDocsPreProvided: false,
    // Condo Rider §6(b)
    condoDocsBuyerRequested: false,
    // Condo Rider §9(d)
    milestoneInspectionStatus: 'not_required',
    sirsStatus: 'not_required',
    turnoverInspectionStatus: 'not_required',
    // STANDARD A(ii)
    buyerInvokesExtendedCure: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.effectiveDate || !formData.transactionType) {
      alert('Please fill in all required fields (Effective Date and Transaction Type)');
      return;
    }

    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      effectiveDate: '',
      closingDate: '',
      transactionType: '',
      isCondo: false,
      propertyAddress: '',
      initialDepositDays: 3,
      condoAssocApprovalRequired: false,
      condoAssocApprovalDaysBefore: 5,
      condoSellerInitiatesDays: 5,
      hasRightOfFirstRefusal: false,
      condoDocsPreProvided: false,
      condoDocsBuyerRequested: false,
      milestoneInspectionStatus: 'not_required',
      sirsStatus: 'not_required',
      turnoverInspectionStatus: 'not_required',
      buyerInvokesExtendedCure: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="manual-form">
      <div className="form-group">
        <label htmlFor="effectiveDate">
          Effective Date <span className="required">*</span>
        </label>
        <input
          type="date"
          id="effectiveDate"
          name="effectiveDate"
          value={formData.effectiveDate}
          onChange={handleChange}
          required
        />
        <small>Date when last party signed and delivered the contract</small>
      </div>

      <div className="form-group">
        <label htmlFor="closingDate">Closing Date (Optional)</label>
        <input
          type="date"
          id="closingDate"
          name="closingDate"
          value={formData.closingDate}
          onChange={handleChange}
        />
        <small>Leave blank to estimate ({formData.transactionType === 'cash' ? '~30 days' : formData.transactionType === 'financed' ? '~45 days' : '30-45 days'} typical)</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="transactionType">
            Transaction Type <span className="required">*</span>
          </label>
          <select
            id="transactionType"
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            required
          >
            <option value="">Select...</option>
            <option value="cash">Cash</option>
            <option value="financed">Financed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="initialDepositDays">
            Initial Deposit <span className="form-label-sub">days (Para. 2(a))</span>
          </label>
          <input
            type="number"
            id="initialDepositDays"
            name="initialDepositDays"
            value={formData.initialDepositDays}
            onChange={handleChange}
            min={1}
            max={90}
          />
          <small>Default per FAR/BAR. Edit if contract specifies differently.</small>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              id="isCondo"
              name="isCondo"
              checked={formData.isCondo}
              onChange={handleChange}
            />
            <span>Condo/HOA Property</span>
          </label>
        </div>
      </div>

      {formData.isCondo && (
        <div className="condo-rider-panel">
          <h4 className="condo-rider-title">Condo Rider Details <span className="condo-rider-ref">(CR-7 Rev. 06/2025)</span></h4>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="condoAssocApprovalRequired"
                checked={formData.condoAssocApprovalRequired}
                onChange={handleChange}
              />
              <span>Association approval required? <span className="form-label-sub">(Condo Rider §1)</span></span>
            </label>
          </div>

          {formData.condoAssocApprovalRequired && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="condoSellerInitiatesDays">
                  Seller initiates approval <span className="form-label-sub">days after effective</span>
                </label>
                <input
                  type="number"
                  id="condoSellerInitiatesDays"
                  name="condoSellerInitiatesDays"
                  value={formData.condoSellerInitiatesDays}
                  onChange={handleChange}
                  min={1}
                  max={30}
                />
              </div>
              <div className="form-group">
                <label htmlFor="condoAssocApprovalDaysBefore">
                  Buyer approved <span className="form-label-sub">days before closing</span>
                </label>
                <input
                  type="number"
                  id="condoAssocApprovalDaysBefore"
                  name="condoAssocApprovalDaysBefore"
                  value={formData.condoAssocApprovalDaysBefore}
                  onChange={handleChange}
                  min={1}
                  max={30}
                />
              </div>
            </div>
          )}

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasRightOfFirstRefusal"
                checked={formData.hasRightOfFirstRefusal}
                onChange={handleChange}
              />
              <span>Right of First Refusal applies? <span className="form-label-sub">(Condo Rider §2(c))</span></span>
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="condoDocsPreProvided"
                checked={formData.condoDocsPreProvided}
                onChange={handleChange}
              />
              <span>Condo docs provided before contract signing? <span className="form-label-sub">(§5(a) vs §5(b))</span></span>
            </label>
            <small>If unchecked, 7-business-day nondeveloper termination window applies</small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="condoDocsBuyerRequested"
                checked={formData.condoDocsBuyerRequested}
                onChange={handleChange}
              />
              <span>Buyer requesting additional docs? <span className="form-label-sub">(Condo Rider §6(b))</span></span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="milestoneInspectionStatus">
                Milestone Inspection <span className="form-label-sub">(§553.899 F.S.) — §9(a)</span>
              </label>
              <select
                id="milestoneInspectionStatus"
                name="milestoneInspectionStatus"
                value={formData.milestoneInspectionStatus}
                onChange={handleChange}
              >
                <option value="not_required">Not Required</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sirsStatus">
                SIRS <span className="form-label-sub">(§§718.103(26)/718.112(2)(g)) — §9(c)</span>
              </label>
              <select
                id="sirsStatus"
                name="sirsStatus"
                value={formData.sirsStatus}
                onChange={handleChange}
              >
                <option value="not_required">Not Required</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="turnoverInspectionStatus">
                Turnover Inspection <span className="form-label-sub">(§718.301(4)(p)(q)) — §9(b)</span>
              </label>
              <select
                id="turnoverInspectionStatus"
                name="turnoverInspectionStatus"
                value={formData.turnoverInspectionStatus}
                onChange={handleChange}
              >
                <option value="not_required">Not Required</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input type="checkbox" name="buyerInvokesExtendedCure"
            checked={formData.buyerInvokesExtendedCure} onChange={handleChange} />
          <span>Buyer invokes extended cure period? <span className="form-label-sub">(STANDARD A(ii))</span></span>
        </label>
        <small>
          120 additional days after the standard 30-day cure. Buyer invokes unilaterally —
          no seller consent or addendum required unless this provision is stricken from the contract.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="propertyAddress">Property Address (Optional)</label>
        <input
          type="text"
          id="propertyAddress"
          name="propertyAddress"
          value={formData.propertyAddress}
          onChange={handleChange}
          placeholder="123 Main St, Miami, FL 33101"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Calculate Deadlines
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  );
}

export default ManualEntryForm;
