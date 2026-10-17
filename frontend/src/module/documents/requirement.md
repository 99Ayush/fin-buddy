# Page 3: Documents  (owner: P1, backup P2)
Route: `/documents`

## Purpose
Entry point for all data. Upload an offer letter, payslip, Form 16 or loan letter, protect privacy, extract structured data, and flag traps clause by clause.

## Tabs / sections
1. **Upload**: drag-drop PDF/image, pick document type, progress states.
2. **Mask Preview**: show detected PII (PAN, Aadhaar, phone, account no.) masked before anything goes to the LLM; user confirms.
3. **Review & Edit**: extracted fields in a form; user can correct values.
4. **Clauses & Traps**: document viewer with highlighted clauses (notice period, bond, variable pay, clawback, non-compete, etc.), each flag with plain-language explanation and severity.

## Functional requirements
- Pipeline order: OCR, mask PII, LLM extraction, schema validation (`documentSchema.js`).
- Each flag links to the exact clause (page + text span).
- Save the extracted document as a structured report in the report store; never store the raw file.
- Handle failure: unreadable scan, wrong doc type, low confidence fields highlighted.

## Backend (module/documents)
- POST /documents/upload (OCR + mask), POST /documents/extract, GET/PUT /documents/:id, GET /documents/:id/flags
- shared/ai: llm, mask, explain helpers (owned by P1)

## Non-functional
File size limit, file type check, temp files deleted after processing, no PII in logs.

## Done when
- Uploading a sample offer letter produces masked preview, editable fields and at least one clause flag with source highlight.
- Report appears in the report store for other pages.

## Global rules (apply to every page)
- The LLM extracts and explains. Code calculates. The LLM never produces a tax, return or payout number.
- Documents: OCR, then mask PII, then LLM. No raw document is stored or logged.
- Every number is a `{value, formula, inputs, assumptions, source}` object so the UI can show "Why this number?".
- Tax rules come only from `shared/data/taxRules.json` (placeholder values, verify against official sources).
- Pages share results through the report store, never by importing another module internals. Use `index.js` only.
- Strings go in this module's `i18n.js` (English + Hindi). Support Fresher and Veteran depth.
- Show the "Not advice" disclaimer on tax and market screens.
