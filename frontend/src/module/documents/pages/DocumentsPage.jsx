/**
 * Documents Module - Main Page (DocumentsPage.jsx)
 * 4-Tab Container: Upload ΓåÆ Mask Preview ΓåÆ Review & Edit ΓåÆ Clauses & Traps
 * Production-ready FinTech UI with multi-language and Fresher/Veteran depth toggles
 */

import React, { useState, useEffect, useRef } from 'react';
import { useToast, useSettings } from '../../../components/AppLayout';
import * as i18n from '../i18n';
import documentsApi from '../services/documentsApi';

const DocumentsPage = () => {
  const { showToast } = useToast();
  const { lang, depth } = useSettings();

  const [activeTab, setActiveTab] = useState(0);
  const [documentType, setDocumentType] = useState('offer_letter');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [trapFlags, setTrapFlags] = useState([]);
  const [unverifiedFields, setUnverifiedFields] = useState([]);
  const [computed, setComputed] = useState(null);
  const [selectedFlagIndex, setSelectedFlagIndex] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fileInputRef = useRef(null);

  const t = (key) => i18n.t(key, lang, depth) || key;

  // Handle actual file upload to backend
  const handleUploadFile = async (fileToUpload) => {
    if (!fileToUpload) return;
    setIsUploading(true);

    try {
      const res = await documentsApi.uploadDocument(fileToUpload);
      setSessionToken(res.sessionToken);
      setUploadResult(res);
      showToast(lang === 'hi' ? 'αñªαñ╕αÑìαññαñ╛αñ╡αÑçαñ£αñ╝ αñ╕αñ½αñ▓αññαñ╛αñ¬αÑéαñ░αÑìαñ╡αñò αñàαñ¬αñ▓αÑïαñí αñ╣αÑï αñùαñ»αñ╛!' : `Recognised as ${res.classification?.label || res.documentType}. Review the redacted OCR before extraction.`, 'success');
      setActiveTab(1); // Proceed to Mask Preview
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Instant 1-Click Demo Loader for testing like a senior dev

  // Run AI Extraction from confirmed masked text
  const handleExtract = async () => {
    if (!sessionToken) return;
    setIsExtracting(true);

    try {
      // Text fixtures cannot be sent through the production PDF/image upload
      // endpoint.  A locally-created demo session is therefore intentionally
      // extracted from the deterministic fixture below.
      if (sessionToken.startsWith('demo_session_')) {
        const err = new Error('Local demo session');
        err.code = 'DEMO_SESSION';
        throw err;
      }
      const res = await documentsApi.extractDocument(sessionToken);
      setExtractedData(res.extractedData);
      setTrapFlags(res.trapFlags || []);
      setUnverifiedFields(res.unverifiedFields || []);
      setComputed(res.computed || null);
      showToast(
        res.unverifiedFields && res.unverifiedFields.length > 0
          ? 'AI extraction complete. Some figures could not be matched verbatim to the document and are flagged for review.'
          : 'AI extraction complete with zero PII exposure!',
        'success'
      );
      setActiveTab(2); // Proceed to Review
    } catch (err) {
      if (err.code === 'SESSION_EXPIRED') {
        showToast('Secure session expired. Please re-upload.', 'error');
        setActiveTab(0);
      } else if (err.code === 'UNSUPPORTED_DOCUMENT') {
        showToast(err.message || 'This file is not a supported document type.', 'error');
        setActiveTab(0);
      } else {
        showToast(err.message || 'Extraction failed. Please retry.', 'error');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Save reviewed fields into reportStore
  const handleSaveReport = async () => {
    if (!extractedData) return;
    try {
      const res = await documentsApi.saveDocument(extractedData);
      showToast(lang === 'hi' ? 'αñªαñ╕αÑìαññαñ╛αñ╡αÑçαñ£αñ╝ αñ╕αñ½αñ▓αññαñ╛αñ¬αÑéαñ░αÑìαñ╡αñò αñ╕αñ╣αÑçαñ£αñ╛ αñùαñ»αñ╛!' : `Saved to Reports! ID: ${res.docId.slice(0, 8)}...`, 'success');
      setActiveTab(3); // Proceed to Traps
    } catch (e) {
      showToast(e.message || 'Save failed', 'error');
    }
  };

  // Field change handler for ReviewTab
  const handleFieldChange = (section, key, value) => {
    setExtractedData((prev) => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      const numVal = parseFloat(value) || 0;

      if (section === 'compensation') {
        copy.compensation[key] = numVal;
      } else if (section === 'fixed') {
        copy.compensation.fixedComponent[key] = numVal;
        // Recalculate annual CTC automatically
        const fix = copy.compensation.fixedComponent;
        const variable = copy.compensation.variableComponent?.performanceBonus || 0;
        copy.compensation.ctcAnnual = (fix.baseSalary || 0) + (fix.hra || 0) + (fix.specialAllowance || 0) + (fix.pfEmployer || 0) + (fix.gratuity || 0) + variable;
        copy.compensation.ctcMonthly = Math.round(copy.compensation.ctcAnnual / 12);
      } else if (section === 'contract') {
        copy.contractualTerms[key] = typeof value === 'boolean' ? value : (parseInt(value, 10) || value);
      }
      return copy;
    });
  };

  const filteredTraps = severityFilter === 'ALL'
    ? trapFlags
    : trapFlags.filter((f) => f.severity === severityFilter);

  return (
    <div className="page-wrapper">
      <div className="app-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {lang === 'hi' ? '≡ƒôä αñªαñ╕αÑìαññαñ╛αñ╡αÑçαñ£αñ╝ αñ╡αñ┐αñ╢αÑìαñ▓αÑçαñ╖αñú' : '≡ƒôä Document Analysis & Trap Engine'}
            </h1>
            <p className="page-subtitle">
              {lang === 'hi'
                ? 'αñàαñ¬αñ¿αÑç αñæαñ½αñ╝αñ░ αñ▓αÑçαñƒαñ░ αñ»αñ╛ αñ¬αÑç-αñ╕αÑìαñ▓αñ┐αñ¬ αñòαÑï αñ╕αÑüαñ░αñòαÑìαñ╖αñ┐αññ αñ░αÑéαñ¬ αñ╕αÑç αñàαñ¬αñ▓αÑïαñí αñòαñ░αÑçαñé, αñùαÑïαñ¬αñ¿αÑÇαñ»αññαñ╛ αñòαÑÇ αñ£αñ╛αñéαñÜ αñòαñ░αÑçαñé αñöαñ░ αñ¢αñ┐αñ¬αÑÇ αñ╣αÑüαñê αñ╢αñ░αÑìαññαÑïαñé αñòαñ╛ αñ¬αññαñ╛ αñ▓αñùαñ╛αñÅαñéαÑñ'
                : 'Upload offer letters or payslips with guaranteed local PII redaction, verify compensation fields, and uncover predatory clauses.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
              {lang === 'hi' ? 'केवल असली दस्तावेज़' : 'Only real documents are analysed'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            <span className="tab-icon">≡ƒôñ</span>
            <span>1. {t('tabUpload')}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
            disabled={!sessionToken}
          >
            <span className="tab-icon">≡ƒöÆ</span>
            <span>2. {t('tabMaskPreview')}</span>
            {uploadResult?.piiDetected && (
              <span className="tab-badge">{Object.keys(uploadResult.piiDetected).length} PII</span>
            )}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
            disabled={!extractedData}
          >
            <span className="tab-icon">Γ£Å∩╕Å</span>
            <span>3. {t('tabReview')}</span>
            {extractedData && <span className="tab-badge">Verified</span>}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 3 ? 'active' : ''}`}
            onClick={() => setActiveTab(3)}
            disabled={!extractedData}
          >
            <span className="tab-icon">ΓÜá∩╕Å</span>
            <span>4. {t('tabClauses')}</span>
            {extractedData && (
              <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                {trapFlags.length} findings
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === 0 && (
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{t('uploadTitle')}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  PDF, PNG, JPG &bull; Max 5MB &bull; 100% Client-Side Privacy Shield
                </p>
              </div>
              <span className="badge badge-info">Type is recognised automatically</span>
            </div>

            <div className="panel-body">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                    handleUploadFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '50px 24px',
                  textAlign: 'center',
                  background: 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      handleUploadFile(e.target.files[0]);
                    }
                  }}
                />

                <div style={{ fontSize: '44px', marginBottom: '12px' }}>≡ƒôä</div>
                <h4 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px' }}>
                  {isUploading ? 'Scanning & Redacting Document...' : 'Drag & drop your document here, or click to browse'}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Upload a PDF, PNG, or JPG. We recognise offer letters, payslips, Form 16, loan agreements, and loan sanction letters after local OCR and PII redaction. Unsupported documents stop before extraction.
                </p>

                {isUploading ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div className="spinner" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                      Applying Layered OCR + Local Regex Redaction...
                    </span>
                  </div>
                ) : (
                  <button type="button" className="btn btn-primary">
                    Select Document File
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Mask Preview & Privacy Shield */}
        {activeTab === 1 && (
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>≡ƒ¢í∩╕Å Privacy Shield Active</span>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Local PII Redaction Audit</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Review your redacted text below. Sensitive identifiers have been masked locally in volatile memory.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleExtract}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <div className="spinner" style={{ borderTopColor: '#fff' }} />
                    Extracting Structured Terms...
                  </>
                ) : (
                  'Γ£à Confirm & Proceed to AI Extraction'
                )}
              </button>
            </div>

            <div className="panel-body">
              {uploadResult?.classification && (
                <div style={{ marginBottom: '20px', padding: '12px 14px', background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', color: '#065f46', fontSize: '13px' }}>
                  <strong>Recognised document:</strong> {uploadResult.classification.label || uploadResult.documentType.replaceAll('_', ' ')}
                  {uploadResult.classification.confidence ? ` ┬╖ ${Math.round(uploadResult.classification.confidence * 100)}% confidence` : ''}. Confirm the redacted OCR below before any structured extraction or clause review.
                </div>
              )}
              {/* Detected PII Badges */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Identified & Redacted PII Tokens:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {uploadResult?.piiDetected && Object.entries(uploadResult.piiDetected).map(([k, count]) => (
                    <div key={k} className="badge badge-low" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      <strong>{k}:</strong> {count} redacted
                    </div>
                  ))}
                  <div className="badge badge-info" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Zero Permanent Cloud Storage
                  </div>
                </div>
              </div>

              {/* Redacted Document Box */}
              <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 'var(--radius-md)', padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.7', maxHeight: '360px', overflowY: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {uploadResult?.maskedPreview?.text || 'No preview text available.'}
                </pre>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab(0)}>
                  &larr; Re-upload Document
                </button>
                <button type="button" className="btn btn-success" onClick={handleExtract} disabled={isExtracting}>
                  {isExtracting ? 'Analyzing...' : 'I Confirm ΓÇö Run AI Clause & Field Extraction &rarr;'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Review & Edit Form */}
        {activeTab === 2 && extractedData && (
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Review & Edit Compensation Terms</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Confidence score: <strong>{Math.round((extractedData.metadata?.extractionConfidence || 0.95) * 100)}%</strong>. You can manually correct any OCR value before saving.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-primary" onClick={handleSaveReport}>
                  ≡ƒÆ╛ Save to Reports
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab(3)}>
                  View Traps ({trapFlags.length}) &rarr;
                </button>
              </div>
            </div>

            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Column 1: Salary & Allowances */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>
                    ≡ƒÆ╡ Compensation Breakdown (Annual INR)
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Total Cost to Company (Annual CTC)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.compensation?.ctcAnnual || 0}
                      onChange={(e) => handleFieldChange('compensation', 'ctcAnnual', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Basic Salary (Annual)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.compensation?.fixedComponent?.baseSalary || 0}
                      onChange={(e) => handleFieldChange('fixed', 'baseSalary', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">House Rent Allowance (HRA)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.compensation?.fixedComponent?.hra || 0}
                      onChange={(e) => handleFieldChange('fixed', 'hra', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Special Allowance</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.compensation?.fixedComponent?.specialAllowance || 0}
                      onChange={(e) => handleFieldChange('fixed', 'specialAllowance', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Variable Performance Bonus</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.compensation?.variableComponent?.performanceBonus || 0}
                      onChange={(e) => {
                        const copy = { ...extractedData };
                        copy.compensation.variableComponent = { performanceBonus: parseFloat(e.target.value) || 0 };
                        setExtractedData(copy);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Joining / Signing Bonus</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.compensation?.joiningBonus || 0}
                      onChange={(e) => handleFieldChange('compensation', 'joiningBonus', e.target.value)}
                    />
                  </div>
                </div>

                {/* Column 2: Contractual Terms & Traps Context */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>
                    ≡ƒô£ Contractual Terms & Obligations
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Notice Period (Days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.contractualTerms?.noticePeriodDays || 0}
                      onChange={(e) => handleFieldChange('contract', 'noticePeriodDays', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Training Bond Penalty Amount (Γé╣)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.contractualTerms?.bondPenaltyAmount || 0}
                      onChange={(e) => handleFieldChange('contract', 'bondPenaltyAmount', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bond Commitment Duration (Months)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.contractualTerms?.bondDurationMonths || 0}
                      onChange={(e) => handleFieldChange('contract', 'bondDurationMonths', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Non-Compete Radius (Kilometers)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={extractedData.contractualTerms?.nonCompeteRadiusKm || 0}
                      onChange={(e) => handleFieldChange('contract', 'nonCompeteRadiusKm', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Moonlighting Permitted?</label>
                    <select
                      className="form-control"
                      value={extractedData.contractualTerms?.moonlightingAllowed ? 'true' : 'false'}
                      onChange={(e) => handleFieldChange('contract', 'moonlightingAllowed', e.target.value === 'true')}
                    >
                      <option value="false">Strictly Prohibited (High Risk Trap)</option>
                      <option value="true">Allowed with Prior Approval</option>
                    </select>
                  </div>

                  {/* Estimated In-Hand Take Home Highlight */}
                  {computed?.inHand ? (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Estimated Net In-Hand / Month:
                        </span>
                        <strong style={{ fontSize: '18px', color: 'var(--success)' }}>
                          Γé╣{computed.inHand.netMonthly.toLocaleString()}
                        </strong>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {computed.inHand.sourceNote} · {computed.inHand.disclaimer}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                        Take-home pay could not be estimated from the extracted values. Use the Salary & Tax module for a full calculation.
                      </p>
                    </div>
                  )}

                  {unverifiedFields.length > 0 && (
                    <div style={{ marginTop: '20px', padding: '14px', background: 'var(--warning-light, #fff7ed)', border: '1px solid var(--warning-border, #fed7aa)', borderRadius: 'var(--radius-md)', color: '#7c2d12', fontSize: '12px' }}>
                      <strong>Figures to double-check:</strong> the following extracted numbers could not be matched verbatim against the uploaded document text. Confirm them before relying on the results.
                      <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                        {unverifiedFields.slice(0, 12).map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab(1)}>
                  &larr; Back to Mask Preview
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-primary" onClick={handleSaveReport}>
                    ≡ƒÆ╛ Save Document Report
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => setActiveTab(3)}>
                    View clause findings ({trapFlags.length}) &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Clauses & Traps Viewer */}
        {activeTab === 3 && (
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>
                  {lang === 'hi' ? 'ΓÜá∩╕Å αñûαñéαñí αñöαñ░ αñ£αÑïαñûαñ┐αñ« αñ╡αñ┐αñ╢αÑìαñ▓αÑçαñ╖αñú' : 'ΓÜá∩╕Å Clause & Risk Analysis'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Findings are shown only when a matching clause is evidenced in the verified document text. An empty result means no supported risk rule matched.
                </p>
              </div>

              {/* Severity Filter Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    className={`btn btn-sm ${severityFilter === sev ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSeverityFilter(sev)}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-body">
              {filteredTraps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>Γ£à</div>
                  <h4>No traps matching severity: {severityFilter}</h4>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.4fr)', gap: '20px' }}>
                  {/* Left Column: Trap Clause List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                    {filteredTraps.map((flag, idx) => {
                      const isSelected = selectedFlagIndex === idx;
                      const badgeClass =
                        flag.severity === 'CRITICAL' ? 'badge-critical' :
                        flag.severity === 'HIGH' ? 'badge-high' :
                        flag.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';

                      return (
                        <div
                          key={flag.clauseId || idx}
                          onClick={() => setSelectedFlagIndex(idx)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            background: isSelected ? 'var(--primary-light)' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span className={`badge ${badgeClass}`}>{flag.severity}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Page {flag.pageNumber || 1}</span>
                          </div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                            {flag.title}
                          </strong>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {flag.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Deep-Dive Inspector */}
                  {filteredTraps[selectedFlagIndex] && (
                    <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <span className={`badge ${filteredTraps[selectedFlagIndex].severity === 'CRITICAL' ? 'badge-critical' : filteredTraps[selectedFlagIndex].severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                            {filteredTraps[selectedFlagIndex].severity} RISK
                          </span>
                          <h4 style={{ fontSize: '17px', fontWeight: '800', marginTop: '6px', color: 'var(--text-main)' }}>
                            {filteredTraps[selectedFlagIndex].title}
                          </h4>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Page {filteredTraps[selectedFlagIndex].pageNumber || 1}
                        </span>
                      </div>

                      {/* Excerpt Quote */}
                      <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', fontStyle: 'italic', color: 'var(--text-main)' }}>
                        "{filteredTraps[selectedFlagIndex].textSpan?.text || 'Clause excerpt identified in document text'}"
                      </div>

                      {/* Plain-Language Explanation */}
                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                          ≡ƒÆí {depth === 'fresher' ? 'What this means for you (Simple)' : 'Legal & Financial Impact (In-Depth)'}:
                        </strong>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                          {filteredTraps[selectedFlagIndex].explanation}
                        </p>
                      </div>

                      {/* Actionable Counter Strategy */}
                      <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#ecfdf5', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
                        <strong style={{ fontSize: '13px', color: '#065f46', display: 'block', marginBottom: '4px' }}>
                          ≡ƒñ¥ How to Negotiate with HR:
                        </strong>
                        <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>
                          {filteredTraps[selectedFlagIndex].recommendation}
                        </p>
                      </div>

                      {/* Statutory Legal Reference */}
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                          ΓÜû∩╕Å Indian Regulatory & Legal Reference:
                        </strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                          {filteredTraps[selectedFlagIndex].regulatoryReference}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab(2)}>
                  &larr; Back to Field Review
                </button>
                <a href="/offers" className="btn btn-primary">
                  Compare with Other Offers &rarr;
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
