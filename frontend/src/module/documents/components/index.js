/**
 * Documents Module - Frontend Components
 * UploadSection, MaskPreview, ReviewForm, ClauseViewer, PdfViewer
 */

import React, { useState, useRef } from 'react';
import * as i18n from '../i18n';

// ============================================
// UPLOAD SECTION
// ============================================
export const UploadSection = ({ onUpload, documentType, setDocumentType }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null); // 'ocr' | 'masking' | 'analyzing' | null
  const fileInputRef = useRef(null);

  const t = (key) => i18n.t(key, 'en', 'fresher');

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file && onUpload) onUpload(file, documentType);
  };

  const progressSteps = [
    { key: 'ocr', label: t('uploadOcrStep') || 'OCR Scanning' },
    { key: 'masking', label: t('uploadMaskStep') || 'Redacting PII' },
    { key: 'analyzing', label: t('uploadAnalyzeStep') || 'Analyzing Clauses' },
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ margin: '0 0 8px', color: '#111827' }}>{t('uploadTitle')}</h2>
      <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>{t('uploadSubtitle')}</p>

      <div
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: '48px 24px',
          background: dragActive ? '#eff6ff' : '#f9fafb',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <h3 style={{ margin: '0 0 8px', color: '#111827' }}>{t('uploadTitle')}</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>{t('uploadSubtitle')}</p>
      </div>

      {file && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <strong>{file.name}</strong>
              <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '13px' }}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
            >
              <option value="offer_letter">Offer Letter</option>
              <option value="payslip">Payslip</option>
              <option value="form16">Form 16</option>
              <option value="loan_agreement">Loan Agreement</option>
            </select>
          </div>

          {progress && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {progressSteps.map((step, i) => (
                  <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: progress === step.key ? '#3b82f6' : '#d1d5db',
                        transition: 'all 0.3s',
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{step.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressSteps.findIndex(s => s.key === progress) / (progressSteps.length - 1) * 100}%`,
                    background: '#3b82f6',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={progress !== null}
            style={{
              width: '100%',
              padding: '12px',
              background: progress ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: progress ? 'not-allowed' : 'pointer',
            }}
          >
            {progress ? `${t('processing')}...` : t('uploadButton')}
          </button>
        </div>
      )}

      <p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
        {t('supportedTypes')}
      </p>
    </div>
  );
};

// ============================================
// MASK PREVIEW
// ============================================
export const MaskPreview = ({ sessionToken, piiDetected, maskStats, onConfirm }) => {
  const t = (key) => i18n.t(key, 'en', 'fresher');

  if (!sessionToken) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3>{t('uploadTitle')}</h3>
        <p>Upload a document first to see the privacy shield in action.</p>
      </div>
    );
  }

  const piiItems = Object.entries(piiDetected || {}).map(([type, count]) => ({
    type,
    count,
    label: t(`piiTypes.${type}`) || type,
  }));

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
        <h2 style={{ margin: '0 0 8px', color: '#111827' }}>{t('maskTitle')}</h2>
        <p style={{ margin: 0, color: '#6b7280' }}>{t('maskSubtitle')}</p>
      </div>

      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: '16px' }}>{t('piiDetected')}</h3>
        {piiItems.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {piiItems.map(({ type, count, label }) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '600', color: '#ef4444' }}>{count}</span>
                <span style={{ color: '#374151' }}>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', margin: 0 }}>No PII detected in this document.</p>
        )}
      </div>

      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '24px', maxHeight: '300px', overflow: 'auto' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#374151' }}>
          [MASKED_NAME_1] has been offered a position at [MASKED_COMPANY_NAME_1]...
          CTC: ₹18,50,000 | Base: ₹7,40,000 | HRA: ₹2,96,000...
          PAN: [MASKED_PAN_1] | Phone: [MASKED_PHONE_1] | Email: [MASKED_EMAIL_1]
          Notice period: 90 days | Bond: ₹2,00,000 for 24 months...
        </p>
      </div>

      <button
        onClick={onConfirm}
        style={{
          width: '100%',
          padding: '14px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        ✅ {t('maskConfirmButton')}
      </button>
    </div>
  );
};

// ============================================
// REVIEW FORM
// ============================================
export const ReviewForm = ({ extractedData, onSave, onNext }) => {
  const t = (key) => i18n.t(key, 'en', 'fresher');
  const [edits, setEdits] = useState({});

  if (!extractedData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✏️</div>
        <h3>{t('reviewTitle')}</h3>
        <p>Complete extraction first to review data.</p>
      </div>
    );
  }

  const fields = [
    { key: 'ctcAnnual', label: t('reviewCtc') || 'CTC (Annual)', path: 'compensation.ctcAnnual', format: 'currency' },
    { key: 'baseSalary', label: t('reviewBase') || 'Basic Salary', path: 'compensation.fixedComponent.baseSalary', format: 'currency' },
    { key: 'hra', label: t('reviewHra') || 'HRA', path: 'compensation.fixedComponent.hra', format: 'currency' },
    { key: 'specialAllowance', label: t('reviewSpecial') || 'Special Allowance', path: 'compensation.fixedComponent.specialAllowance', format: 'currency' },
    { key: 'performanceBonus', label: t('reviewBonus') || 'Performance Bonus', path: 'compensation.variableComponent.performanceBonus', format: 'currency' },
    { key: 'noticePeriod', label: t('reviewNotice') || 'Notice Period', path: 'contractualTerms.noticePeriodDays', format: 'days' },
    { key: 'bondAmount', label: t('reviewBond') || 'Training Bond', path: 'contractualTerms.bondPenaltyAmount', format: 'currency' },
    { key: 'bondDuration', label: t('reviewBondDuration') || 'Bond Duration', path: 'contractualTerms.bondDurationMonths', format: 'months' },
  ];

  const getValue = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
  const setValue = (obj, path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
    target[last] = value;
  };

  const formatVal = (val, format) => {
    if (val === null || val === undefined) return '';
    if (format === 'currency') return `₹${val.toLocaleString()}`;
    if (format === 'days') return `${val} days`;
    if (format === 'months') return `${val} months`;
    return val.toString();
  };

  const handleChange = (key, value) => {
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const updated = { ...extractedData };
    Object.entries(edits).forEach(([key, value]) => {
      const field = fields.find(f => f.key === key);
      if (field) setValue(updated, field.path, parseFloat(value) || value);
    });
    onSave(updated, edits);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ margin: '0 0 8px', color: '#111827' }}>{t('reviewTitle')}</h2>
      <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>{t('reviewSubtitle')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fields.map(field => {
          const originalValue = getValue(extractedData, field.path);
          const editValue = edits[field.key];
          const displayValue = editValue !== undefined ? editValue : originalValue;
          return (
            <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ minWidth: '200px', fontWeight: '500', color: '#374151' }}>{field.label}</div>
              <input
                type={field.format === 'currency' ? 'number' : 'text'}
                value={displayValue}
                onChange={(e) => handleChange(field.key, e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: editValue !== undefined ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                }}
              />
              {editValue !== undefined && (
                <span style={{ fontSize: '12px', color: '#3b82f6' }}>Edited</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          💾 {t('saveButton')}
        </button>
        <button onClick={onNext} style={{ padding: '12px 24px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          {t('nextButton')}
        </button>
      </div>
    </div>
  );
};

// ============================================
// CLAUSE VIEWER
// ============================================
export const ClauseViewer = ({ trapFlags }) => {
  const t = (key) => i18n.t(key, 'en', 'fresher');

  if (!trapFlags?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3>No Traps Detected</h3>
        <p>No predatory clauses found in this document.</p>
      </div>
    );
  }

  const severityColors = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#3b82f6',
    INFO: '#6b7280',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ margin: '0 0 8px', color: '#111827' }}>{t('clauseTitle')}</h2>
      <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>
        {trapFlags.length} {t('clauseSubtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {trapFlags.map((flag, i) => {
          const color = severityColors[flag.severity] || '#6b7280';
          return (
            <details key={i} style={{ border: `1px solid ${color}40`, borderRadius: '8px', overflow: 'hidden' }}>
              <summary style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: `${color}10` }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: color,
                  color: 'white',
                  textTransform: 'uppercase',
                }}>
                  {t(`severity${flag.severity}`) || flag.severity}
                </span>
                <strong style={{ flex: 1 }}>{flag.title}</strong>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Page {flag.pageNumber}</span>
              </summary>
              <div style={{ padding: '16px', background: '#fafafa' }}>
                <p style={{ margin: '0 0 12px', color: '#374151' }}><strong>{t('whatThisMeans')}:</strong> {flag.explanation}</p>
                <p style={{ margin: '0 0 12px', color: '#374151' }}><strong>{t('whatToAskHR')}:</strong> {flag.recommendation}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}><strong>{t('regulatoryRef')}:</strong> {flag.regulatoryReference}</p>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// PDF VIEWER (Placeholder)
// ============================================
export const PdfViewer = ({ pdfUrl, highlights = [] }) => {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <p>PDF Viewer with Clause Highlights</p>
        <p style={{ fontSize: '13px' }}>Integration with PDF.js for bounding box overlay</p>
        {highlights.length > 0 && (
          <p style={{ marginTop: '16px', fontSize: '13px' }}>
            {highlights.length} highlighted clauses
          </p>
        )}
      </div>
    </div>
  );
};

export default {
  UploadSection,
  MaskPreview,
  ReviewForm,
  ClauseViewer,
  PdfViewer,
};