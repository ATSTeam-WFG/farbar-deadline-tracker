import { useState } from 'react';

function PDFUpload({ onExtractedData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please drop a valid PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Implement OCR processing with Flask backend
      // For now, show a message
      alert('OCR processing will be implemented with Flask backend. Please use manual entry for now.');

      // Simulated extraction (replace with actual OCR call)
      // const formData = new FormData();
      // formData.append('pdf', selectedFile);
      //
      // const response = await fetch('http://localhost:5000/api/extract', {
      //   method: 'POST',
      //   body: formData,
      // });
      //
      // const data = await response.json();
      // onExtractedData(data);

    } catch (err) {
      setError('Error processing PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pdf-upload">
      <div
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-icon">PDF</div>
        <p>Drag & Drop Contract PDF or Click to Browse</p>

        <input
          type="file"
          id="pdfInput"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="btn-secondary"
          onClick={() => document.getElementById('pdfInput').click()}
        >
          Choose File
        </button>

        {selectedFile && (
          <div className="selected-file">
            <span>Selected: {selectedFile.name}</span>
            <button
              type="button"
              className="btn-small"
              onClick={() => setSelectedFile(null)}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {selectedFile && (
        <button
          type="button"
          className="btn-primary"
          onClick={handleUpload}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Extract Data from PDF'}
        </button>
      )}

      <div className="upload-info">
        <p><strong>Note:</strong> OCR feature will extract:</p>
        <ul>
          <li>Effective Date</li>
          <li>Closing Date</li>
          <li>Transaction Type (Cash/Financed)</li>
          <li>Property Address</li>
        </ul>
        <p className="small-text">You will be able to review and edit extracted data before calculating deadlines.</p>
      </div>
    </div>
  );
}

export default PDFUpload;
