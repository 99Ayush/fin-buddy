<div align="center">

# 💸 Fin-Buddy

**An AI assistant that reads the fine print in your job offer — and refuses to do the arithmetic.**

[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-2ea44f?style=for-the-badge)](LICENSE)

[Pipeline](#the-document-pipeline) · [Offers suite](#the-offers-suite) · [Run locally](#run-locally) · [API](#api)

</div>

---

Offer letters are where a lot of salaries quietly evaporate: variable pay that never pays out, retention bonds that claw back your earnings, "CTC" that bundles in money you will never receive.

Fin-Buddy reads the document, extracts the real numbers, explains the risky clauses in plain language, and compares two offers on **in-hand pay** instead of headline CTC.

> **The design rule is the whole project: LLMs extract, code calculates.**
> Every rupee is computed by deterministic JavaScript with a visible formula. The model is only ever allowed to *read* and *explain* a document — never to do arithmetic, and never to invent a tax figure.

## The problem, concretely

| What the offer says | What it actually means |
| :--- | :--- |
| ₹18 LPA CTC | ₹12.4 LPA fixed + ₹3.6 LPA variable "subject to performance" + ₹2 LPA stock vesting over four years |
| "Retention bonus" | A clawback — leave early and you repay it |
| "Notice period: 90 days" | Your next employer hesitates, and you may owe salary in lieu |
| "ESOPs worth ₹X" | Paper value at today's valuation, before dilution and tax |

## The document pipeline

Upload a PDF or image of an offer letter, payslip, Form-16 or loan agreement (5 MB max, PDF/PNG/JPG):

```text
upload ──► OCR ──► local PII masking ──► LLM extraction ──► AJV schema validation ──► trap engine
  │           │            │                    │                    │                     │
  │           │            │                    │                    └── reject malformed  └── severity +
  │           │            │                    │                        or partial output    explanation
  │           │            │                    └── JSON only, no prose
  │           │            └── PAN, Aadhaar, phone, email, account, names redacted
  │           │                before anything leaves the machine
  │           └── digital PDFs parsed directly; scans fall back to Tesseract
  └── in-memory only, never written to disk
```

Four guarantees follow from that ordering:

1. **Raw documents never reach a third-party API** — masking happens first, locally.
2. **Malformed model output is rejected**, not repaired into a plausible-looking object.
3. **Every generated number carries provenance**: `{ value, formula, inputs, assumptions, source }`.
4. **Trap detection is a rule engine**, not a prompt: bonds, clawbacks, unpaid-notice clauses, non-competes and unrealisable variable pay each get a severity and a written explanation.

## The offers suite

| Endpoint | What it does |
| :--- | :--- |
| `POST /api/offers/compare` | Compare 2–4 offers on computed in-hand pay, never on CTC |
| `POST /api/offers/esop` | ESOP projections across Bear / Base / Bull, with vesting schedule and tax treatment |
| `POST /api/offers/email` | Counter-offer email built only from figures the engine already verified |
| `POST /api/offers/roleplay` | One negotiation turn against a configurable HR persona (friendly / stubborn / aggressive) |
| `POST /api/offers/scorecard` | Post-session feedback on assertiveness, professionalism, leverage, preparation, creativity |
| `GET /api/offers/my-offers` | Saved offer letters for the signed-in user |

## Salary, tax and planning

The tax engine is real code, not a stub — slab-by-slab, with surcharge, cess and the FY 2024-25 new-regime slabs:

```text
POST /api/salarytax/calculate     → slab breakdown, regime comparison
POST /api/salarytax/in-hand       → CTC → in-hand, with HRA exemption, standard
                                    deduction, professional tax and deduction log
```

`/api/moneyplan` adds EMI, prepay-vs-invest comparison, regret analysis, a financial-health score and goal tracking. `/api/assistant` keeps per-user conversations and submits CA review requests with a generated document pack.

## Architecture

```text
fin-buddy/
├── backend/                        Node.js + Express
│   ├── src/
│   │   ├── app.js                  Server entry, module registration, error handling
│   │   ├── module/
│   │   │   ├── documents/          Upload, OCR, masking, extraction, trap engine
│   │   │   ├── offers/             Compare, ESOP, counter-email, role-play, scorecard
│   │   │   ├── salarytax/          Slab calculator, in-hand, HRA, surcharge
│   │   │   ├── moneyplan/          EMI, prepay-vs-invest, score, goals
│   │   │   ├── assistant/          Chat conversations, CA review requests
│   │   │   ├── home/               Dashboard, markets, stocks
│   │   │   └── auth/               JWT signup/login, middleware
│   │   └── shared/
│   │       ├── ai/                 Masking, OCR, provider adapter, explainers
│   │       ├── validator/          JSON schemas + AJV validation
│   │       ├── reportStore/        Session-scoped document storage
│   │       └── data/fixtures/      Seeded sample documents and traps
│   └── eval/                       Precision/recall + hybrid-vs-LLM benchmark
└── frontend/                       React 18 + Vite, one folder per backend module
```

**Module boundaries are enforced:** a module is reachable only through its `index.js`, and cross-module data flows through `shared/reportStore`. No relative imports across module boundaries.

**Provider-agnostic by design:** `LLM_PROVIDER` selects Grok (xAI), Gemini, Groq or OpenRouter, with automatic fallback to whichever provider has a key. If none do, the app degrades explicitly instead of inventing values.

## Run locally

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # PORT=4000, MONGODB_URI, JWT_SECRET, one LLM key
npm run seed              # sample offers, payslips and trap fixtures
npm run dev               # http://localhost:4000
```

**Frontend** (separate terminal)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173, proxies /api → :4000
```

MongoDB is required for persistence; the Vite config proxies to port **4000**, so keep `PORT=4000` in `backend/.env` (the default when `PORT` is unset is 3000).

## API map

| Mount | Routes |
| :--- | :--- |
| `/api/auth` | signup, login |
| `/api/documents` | `/upload`, `/extract`, `/save`, `/`, `/:id`, `/:id/flags`, `DELETE /:id` |
| `/api/offers` | compare, esop, email, roleplay, scorecard, my-offers |
| `/api/salarytax` | `/calculate`, `/in-hand` |
| `/api/moneyplan` | `/emi`, `/prepay-vs-invest`, `/regret`, `/score`, `/goals` |
| `/api/assistant` | conversations + messages, `ca-requests`, `ca-pack` |
| `/api/home` | dashboard, markets, stocks |

## Evaluation harness

Two scripts under `backend/eval` measure the pipeline instead of assuming it works:

- **`run_extraction_eval.js`** — field-level precision and recall of extraction against a labelled dataset, plus character-level accuracy and trap-detection F1.
- **`run_baseline_comparison.js`** — the same offers computed two ways: the hybrid pipeline (deterministic maths) versus LLM-only arithmetic, to quantify how often models get salary maths wrong.

The benchmark exists to justify the design rule. If LLM-only arithmetic were accurate, the deterministic engine would be unnecessary complexity. It is not.

## Honest scope

- This started as a **three-person build**, so module maturity varies. Documents, offers, salary/tax, money plan and the assistant are implemented; the home/markets module leans on optional third-party market data.
- **Not financial or legal advice.** The tax engine models Indian rules for FY 2024-25; it is an educational tool, not a filing system.
- OCR quality depends on the scan. Digital PDFs parse cleanly; photographed documents may need a second upload.
- The trap engine flags patterns it knows. An unusual clause form can slip past it — the goal is to make you read the document, not to replace reading it.

## Stack

**Backend** — Node.js, Express, MongoDB/Mongoose, JWT + bcrypt, Helmet, Multer (in-memory), AJV, Tesseract.js, pdf-parse, Jest + Supertest
**Frontend** — React 18, Vite, React Router, styled-components

## License

[MIT](LICENSE) · built by [Ayush Kumar](https://github.com/99Ayush)
