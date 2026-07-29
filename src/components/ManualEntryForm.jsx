import { useState } from 'react';

function ManualEntryForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    effectiveDate: '',
    closingDate: '',
    transactionType: '',
    isCondo: false,
    propertyAddress: '',
    initialDepositDays: 3,
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
