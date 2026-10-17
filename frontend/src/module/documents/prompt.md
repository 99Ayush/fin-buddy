# Basic prompt: Documents

Paste this into your AI coding assistant and attach `requirement.md` from this folder as context.

```
You are building the Documents page of Akumas. Read requirement.md in this folder.

Work inside frontend/src/module/documents, backend/src/module/documents and backend/src/shared/ai.

Build:
1. Upload screen for PDF/image with document type selection.
2. Pipeline: OCR, then mask PII (PAN, Aadhaar, phone, bank account), then LLM extraction, then validate against documentSchema.js.
3. Tabs: Upload, Mask Preview, Review & Edit, Clauses & Traps (highlight clause text with severity and plain explanation).
4. Save the structured result to the report store. Never store or log the raw document.

Rules: order is OCR, mask, LLM; every flag links to an exact clause; strings in documents/i18n.js; export only through index.js.
Start with the pipeline using one sample offer letter, then build the UI around it.
```
