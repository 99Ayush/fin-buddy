# Fin-Buddy

**An AI assistant that reads the fine print in your job offer.**

Offer letters and payslips are where a lot of tech salaries quietly evaporate — variable pay that never pays out, retention bonds that claw back your earnings, "CTC" that bundles in things you will never actually receive. Fin-Buddy reads those documents, extracts the real numbers, explains the clauses in plain language, and lets you compare two offers on **in-hand pay** instead of headline CTC.

> **Core design rule: LLMs extract, code calculates.**
> Every rupee is computed by deterministic JavaScript with a visible formula. The language model is only ever allowed to *read* and *explain* a document — never to do arithmetic, and never to invent a tax figure.

---

## The problem

| What the offer says | What it actually means |
| --- | --- |
| ₹18 LPA CTC | ₹12.4 LPA fixed + ₹3.6 LPA variable "subject to performance" + ₹2 LPA stock that vests over 4 years |
| "Retention bonus" | A clawback — leave early and you repay it |
| "Notice period 90 days" | Your next employer will hesitate, and you may owe salary in lieu |
| "ESOPs worth ₹X" | Paper value at the *current* valuation, before dilution and taxes |

Most freshers sign without decoding any of this. Fin-Buddy turns the document into a structured, explained comparison.

---

## What it does

### 1. Documents pipeline
Upload a PDF or image of an offer letter, payslip, Form-16, or loan document:

1. **Upload → OCR** — digital PDFs are parsed directly; scanned pages fall back to Tesseract OCR.
2. **PII masking** — PAN, Aadhaar, phone, email, bank account and names are redacted **locally, before any network call**.
3. **LLM extraction** — the masked text goes to the model, which returns JSON only.
4. **Schema validation** — every response is validated with AJV against a strict schema. Malformed or partial output is rejected rather than trusted.
5. **Trap detection** — a rule engine flags bonds, clawbacks, unpaid-notice clauses, non-compete traps and unrealisable variable pay, each with a severity and a plain-language explanation.

### 2. Offers suite
- **Compare 2–4 offers** side by side on computed in-hand pay, not CTC.
- **ESOP projection** with Bear / Base / Bull scenarios, vesting schedules and tax treatment.
- **Counter-offer email** generation using only the numbers already verified by the deterministic engine.
- **HR role-play** — practise the negotiation against a configurable persona (friendly / stubborn / aggressive).
- **Scorecard** — post-negotiation feedback on assertiveness, professionalism, leverage, preparation and creativity.

---

## Architecture

```
fin-buddy/
├── backend/                        Node.js + Express
│   ├── src/
│   │   ├── app.js                  Server entry, route registration
│   │   ├── module/
│   │   │   ├── documents/          Upload, OCR, extraction, trap engine
│   │   │   ├── offers/             Compare, ESOP, counter-email, role-play
│   │   │   ├── salarytax/          In-hand calculator, payslip audit
│   │   │   ├── moneyplan/          Financial health and goals
│   │   │   ├── home/               Landing, auth, timeline
│   │   │   └── assistant/          Tax assistant, CA review requests
│   │   └── shared/
│   │       ├── ai/                 Masking, OCR, LLM client, explainers
│   │       ├── validator/          JSON schemas + AJV validation
│   │       ├── reportStore/        Session-scoped document storage
│   │       └── data/fixtures/      Seed data
│   └── eval/                       Precision/recall + hybrid-vs-LLM benchmark
├── frontend/                       React 18 + Vite
│   └── src/
│       ├── AppRoutes.jsx
│       └── module/                 One folder per backend module
└── README.md
```

**Module boundaries are enforced:** a module is only reachable through its `index.js`, and cross-module data flows through the shared `reportStore`. No relative imports across module boundaries.

---

## Privacy shield

Financial documents are the most sensitive thing a user will ever upload, so the order of operations matters:

```
raw document  →  local PII redaction  →  masked text  →  LLM  →  JSON  →  schema validation
                                                                              ↓
                                                              re-attach values locally
```

- **Raw documents never reach a third-party API.**
- Files are processed **in memory** and unlinked immediately; only the user's reviewed extraction is persisted.
- Every generated number carries its provenance: `{ value, formula, inputs, assumptions, source }`.

---

## API

### `/api/documents`
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/upload` | Upload → OCR → mask → returns a session token and masked preview |
| `POST` | `/extract` | Token → LLM extraction → schema validation → trap detection |
| `POST` | `/save` | Persist a reviewed extraction |
| `GET` | `/` | List the user's documents |
| `GET` | `/:id` | Fetch one extraction report |
| `PUT` | `/:id` | Apply user corrections |
| `GET` | `/:id/flags` | Trap flags for a document |
| `DELETE` | `/:id` | Delete a document |

### `/api/offers`
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/compare` | Compare 2–4 offers with deterministic in-hand calculation |
| `POST` | `/esop` | ESOP projections (Bear / Base / Bull) |
| `POST` | `/email` | Counter-offer email from verified figures |
| `POST` | `/roleplay` | One HR negotiation turn against a persona |
| `POST` | `/scorecard` | Score a completed negotiation session |
| `GET` | `/my-offers` | List saved offer letters |

---

## Running locally

**Backend**
```bash
cd backend
npm install
npm run seed     # populate reportStore with sample offers, payslips and traps
npm run dev      # http://localhost:3000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173  (proxies /api to the backend)
```

**Environment**
```bash
LLM_API_KEY=your_key
LLM_ENDPOINT=...
```

---

## Evaluation harness

Two scripts under `backend/eval` measure the pipeline rather than assume it works:

- `run_extraction_eval.js` — field-level **precision and recall** of the extraction step against a labelled dataset, plus character-level accuracy.
- `run_baseline_comparison.js` — the same offers computed two ways: **hybrid pipeline** (deterministic math) versus **LLM-only arithmetic**, to quantify how often models get salary math wrong.

The harness reports trap-detection F1 alongside the extraction metrics. The point of the benchmark is to justify the design rule: if LLM-only arithmetic were accurate, the deterministic engine would be unnecessary complexity. It is not.

---

## Scope

This started as a three-person build, so the repository contains module skeletons alongside finished ones.

**Implemented end to end:** documents pipeline (upload → OCR → masking → extraction → traps) and the offers suite (compare, ESOP, counter-offer, role-play, scorecard).

**Interface-level stubs:** salary/tax breakdown, money planning, and the tax assistant.

---

## Stack

**Backend** — Node.js, Express, MongoDB / Mongoose, JWT + bcrypt, Helmet, Multer, AJV, Tesseract.js, pdf-parse, Node test runner with Jest + Supertest
**Frontend** — React 18, Vite, React Router, styled-components

## License

MIT — educational tool. Not financial or legal advice.
