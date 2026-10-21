# Fin-Buddy — AI Engine, Documents Pipeline, Offer Comparison & Negotiation

> **Owner:** P1 (AI Engine, Documents, Offers)  
> **Backup Partners:** P2 (Salary & Tax, Money Plan), P3 (Home, Assistant)  
> **Core Principle:** *"LLM explains and extracts, code calculates. Never trust the LLM with math or tax figures."*

---

## 📁 Project Structure

```
ayush.fin/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── app.js             # Main entry - mounts P1 routes ONLY
│   │   ├── module/
│   │   │   ├── documents/     # P1: Page 3 - Document upload, OCR, extraction, trap detection
│   │   │   ├── offers/        # P1: Page 4 - Compare, ESOP, Counter-email, HR Role-play
│   │   │   ├── salarytax/     # P2: In-hand calculator, payslip audit (interface only)
│   │   │   ├── moneyplan/     # P2: Financial health, goals (interface only)
│   │   │   ├── home/          # P3: Landing, auth, timeline (interface only)
│   │   │   └── assistant/     # P3: Tax assistant, CA review (interface only)
│   │   ├── shared/
│   │   │   ├── ai/            # P1: mask, ocr, llm, explain
│   │   │   ├── validator/     # P1: JSON schemas (offer, payslip, form16, loan, traps)
│   │   │   ├── reportStore/   # P1: In-memory session storage
│   │   │   └── data/fixtures/ # P1: Day-zero mock data
│   │   └── scripts/
│   │       └── seedFixtures.js
│   ├── eval/                   # P1: Academic evaluation suite
│   │   ├── dataset/
│   │   ├── run_extraction_eval.js
│   │   └── run_baseline_comparison.js
│   └── package.json
│
├── frontend/                   # React 18 + Vite
│   ├── src/
│   │   ├── AppRoutes.jsx      # Routes - P1 registers /documents & /offers ONLY
│   │   ├── main.jsx
│   │   ├── styles.css
│   │   └── module/
│   │       ├── documents/     # P1: 4-tab UI (Upload, Mask, Review, Clauses)
│   │       ├── offers/        # P1: 4-tab UI (Compare, ESOP, Email, Roleplay)
│   │       ├── salarytax/     # P2: Placeholder
│   │       ├── moneyplan/     # P2: Placeholder
│   │       ├── home/          # P3: Dashboard with nav cards
│   │       └── assistant/     # P3: Chat placeholder
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ✅ Phases Completed

| Phase | Description | Status |
|-------|-------------|--------|
| **1** | Day-Zero Schemas & Fixtures | ✅ Complete |
| **2** | AI Engine & Privacy Shield | ✅ Complete |
| **3** | Documents Backend & Trap Engine | ✅ Complete |
| **4** | Documents Frontend (4 tabs) | ✅ Complete |
| **5** | Offers Suite (Compare, ESOP, Email, Roleplay) | ✅ Complete |
| **6** | Evaluation Suite & Shell Integration | ✅ Complete |

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run seed        # Populates reportStore with sample offer/payslip/traps
npm run dev         # Starts on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:5173 (proxies /api to backend)
```

### Run Evaluations
```bash
cd backend
node eval/run_extraction_eval.js        # Field precision/recall benchmark
node eval/run_baseline_comparison.js    # Hybrid vs LLM-only math accuracy
```

---

## 🔌 API Endpoints (P1 Owned)

### Documents (`/api/documents`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload PDF/image → OCR → PII masking → returns session token + masked preview |
| POST | `/extract` | Takes session token → LLM structured extraction → schema validation → trap detection |
| POST | `/save` | Save reviewed extraction to user's report store |
| GET | `/` | List user's documents |
| GET | `/:id` | Get document report |
| PUT | `/:id` | Update fields (user corrections) |
| GET | `/:id/flags` | Get trap flags for document |
| DELETE | `/:id` | Delete document |

### Offers (`/api/offers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/compare` | Compare 2-4 offers (from reportStore or manual) → deterministic in-hand calc |
| POST | `/esop` | ESOP projections (Bear/Base/Bull) with tax modeling |
| POST | `/email` | Generate counter-offer email with verified numbers |
| POST | `/roleplay` | HR negotiation turn (persona: friendly/stubborn/aggressive) |
| POST | `/scorecard` | Post-negotiation scoring (assertiveness, professionalism, leverage, prep, creativity) |
| GET | `/my-offers` | List user's saved offer letters |

---

## 🛡️ Privacy & Compliance

- **Local PII Redaction:** PAN, Aadhaar, phone, email, bank accounts, names masked **before** any LLM call
- **No Raw Data to LLMs:** Only masked text + structured prompts sent to external APIs
- **In-Memory Only:** Uploaded files processed in-memory, immediately unlinked; no persistent storage of raw documents
- **Educational Only:** All outputs carry "Not financial/legal advice" disclaimers
- **SEBI-Safe:** No investment recommendations, only math & clause explanation

---

## 🧪 Evaluation Results (Expected)

| Metric | Target |
|--------|--------|
| Field Precision | > 95% |
| Field Recall | > 95% |
| Char Accuracy | > 98% |
| Trap Detection F1 | > 90% |
| LLM-Only Math Error | > 40% |
| Hybrid Pipeline Error | < 1% (deterministic) |

Run `node eval/run_baseline_comparison.js` to see the hybrid vs LLM-only comparison.

---

## 📋 File Boundaries (MANDATORY)

**P1 Owns (Full):**
- `backend/src/module/documents/**`
- `backend/src/module/offers/**`
- `backend/src/shared/ai/**`
- `backend/src/shared/validator/**`
- `backend/src/shared/reportStore/**`
- `backend/src/shared/data/fixtures/**`
- `frontend/src/module/documents/**`
- `frontend/src/module/offers/**`
- `eval/**`

**P1 Touches Minimally (Registration Only):**
- `backend/src/app.js` → mount `/api/documents` & `/api/offers`
- `frontend/src/AppRoutes.jsx` → register `/documents` & `/offers`

**P1 NEVER Touches (P2/P3 Owned):**
- `backend/src/module/salarytax/**`
- `backend/src/module/moneyplan/**`
- `backend/src/module/home/**`
- `backend/src/module/assistant/**`
- Corresponding frontend modules

---

## 🔧 Key Dependencies

**Backend:**
- `express`, `cors`, `helmet`, `multer` — API & uploads
- `ajv`, `ajv-formats` — JSON schema validation
- `pdf-parse`, `pdfjs-dist` — Digital PDF extraction
- `tesseract.js` — OCR fallback for scanned docs
- `node-fetch` — LLM API calls

**Frontend:**
- `react@18`, `react-dom`, `react-router-dom@6`
- `axios` — API client
- `vite` — Dev server & build

---

## 🧠 Core Architecture Principles

1. **Never Calculate with LLM** — LLM parses/extracts; deterministic JS computes tax, in-hand, ESOP projections
2. **Local PII Redaction First** — Mask → Send to LLM → Unmask for user display only
3. **Traceability** — Every number shows `{ value, formula, inputs, assumptions, source }`
4. **Module Encapsulation** — Cross-module calls ONLY via `reportStore` or module `index.js`
5. **Strict File Boundaries** — No relative imports across module boundaries

---

## 📝 License

MIT — Educational financial clarity tool. Not financial or legal advice.