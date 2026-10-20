import React, { useState, useRef } from 'react';
import './DocumentsPage.css';

const MOCK_DOCS = [
  { id: 1, name: 'Payslip_Oct_2025.pdf', type: 'Payslip', status: 'processed', date: '15 Oct 2025', size: '142 KB' },
  { id: 2, name: 'Form16_FY2425.pdf', type: 'Form 16', status: 'processed', date: '10 Jun 2025', size: '380 KB' },
  { id: 3, name: 'OfferLetter_TCS.pdf', type: 'Offer Letter', status: 'masked', date: '2 Jan 2024', size: '210 KB' },
];

const STATUS_LABEL = { processed: '✅ Processed', masked: '🔒 PII Masked', pending: '⏳ Pending' };
const STATUS_CLASS = { processed: 'status-green', masked: 'status-blue', pending: 'status-yellow' };

export default function DocumentsPage() {
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const newDocs = files.map((f, i) => ({
      id: docs.length + i + 1,
      name: f.name,
      type: 'Unknown',
      status: 'pending',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      size: `${(f.size / 1024).toFixed(0)} KB`,
    }));
    setDocs((prev) => [...prev, ...newDocs]);
  };

  return (
    <div className="documents-page">
      <div className="doc-header">
        <div>
          <h2>Documents</h2>
          <p>Upload, mask PII, and extract data from your financial documents.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        id="upload-dropzone"
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current.click()}
      >
        <input
          ref={fileInput}
          id="file-input"
          type="file"
          multiple
          accept=".pdf,image/*"
          style={{ display: 'none' }}
          onChange={(e) => addFiles(Array.from(e.target.files))}
        />
        <div className="upload-icon">📁</div>
        <p className="upload-label">Drag &amp; drop PDFs or images here</p>
        <p className="upload-sub">Payslips · Form 16 · Offer Letters · Loan Docs</p>
        <button id="btn-browse-files" className="btn-primary-sm">Browse Files</button>
      </div>

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <span>🔒</span>
        <div>
          <strong>Privacy First:</strong> PAN, Aadhaar, and account numbers are automatically
          detected and masked before any external processing.
        </div>
      </div>

      {/* Document Table */}
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td className="doc-name">📄 {doc.name}</td>
                <td>
                  <span className="type-badge">{doc.type}</span>
                </td>
                <td>{doc.date}</td>
                <td>{doc.size}</td>
                <td>
                  <span className={`doc-status ${STATUS_CLASS[doc.status]}`}>
                    {STATUS_LABEL[doc.status]}
                  </span>
                </td>
                <td className="doc-actions">
                  <button className="action-link" title="Preview">👁</button>
                  <button className="action-link" title="Download masked">⬇</button>
                  <button
                    className="action-link danger"
                    title="Delete"
                    onClick={() => setDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">No documents yet. Upload one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
