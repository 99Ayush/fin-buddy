# Page 6: Money Plan  (owner: P2, backup P3)
Route: `/money-plan`  (plus role-gated `/admin`, not in main nav)

## Purpose
Turn the analysis into a plan: health score, goals, loans and what-if regrets.

## Tabs / sections
1. **Health Score**: score out of 100 from savings rate, emergency fund, debt ratio, insurance, tax efficiency, with the breakdown.
2. **Goals**: create goals (house, emergency fund, travel), required monthly saving, progress.
3. **Loans**: EMI, total interest, prepayment impact, loan letter hidden-charge flags (reads documents report).
4. **Regret Simulator**: "what if I had invested X earlier / taken that loan / skipped the SIP". Shows the difference with assumptions.
5. **Admin (hidden)**: tax rule versions, usage stats. Role = admin only.

## Functional requirements
- All figures computed by code with the standard number object.
- Health score weights live in rules data, not hard-coded in the UI.
- Simulator uses explicit return/inflation assumptions the user can edit.
- Admin can add a new tax rule version with effective date; audit trail kept.

## Backend (module/moneyplan)
- planner: GET /planner/score, CRUD /planner/goals, POST /planner/loan, POST /planner/regret
- admin: GET/POST /admin/tax-rules, GET /admin/usage

## Done when
- Score updates when a goal or loan changes.
- Regret simulator shows the formula and assumptions for every output.
- Non-admin cannot reach /admin.

## Global rules (apply to every page)
- The LLM extracts and explains. Code calculates. The LLM never produces a tax, return or payout number.
- Documents: OCR, then mask PII, then LLM. No raw document is stored or logged.
- Every number is a `{value, formula, inputs, assumptions, source}` object so the UI can show "Why this number?".
- Tax rules come only from `shared/data/taxRules.json` (placeholder values, verify against official sources).
- Pages share results through the report store, never by importing another module internals. Use `index.js` only.
- Strings go in this module's `i18n.js` (English + Hindi). Support Fresher and Veteran depth.
- Show the "Not advice" disclaimer on tax and market screens.
