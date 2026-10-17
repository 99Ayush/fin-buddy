# Page 5: Salary & Tax  (owner: P2, backup P1)
Route: `/salary-tax`

## Purpose
Show what the salary is really worth and how much tax the user can save. This page holds the reference pattern for all calculators.

## Tabs / sections
1. **In-hand & Waterfall**: CTC to in-hand waterfall (PF, tax, professional tax, employer-only items).
2. **Payslip Audit**: compare payslip with offer letter, flag wrong deductions.
3. **Regime Comparison**: old vs new regime with what-if sliders (80C, 80D, HRA, NPS, home loan).
4. **Savings Gaps**: unused deductions and suggested actions (education only).
5. **TDS & Advance Tax**: TDS check against Form 16, advance tax schedule and reminders.

## Functional requirements
- All calculators are pure functions in `salarytax/*/services` reading `taxRules.json`; results use the `calcResult.js` shape.
- Sliders recompute instantly.
- Each number has a "Why this number?" drawer showing formula, inputs, assumptions, source.
- Results saved to report store for Home, Assistant, Offers.
- Tax disclaimer visible.

## Backend (module/salarytax)
- salary: POST /salary/inhand, POST /salary/payslip-audit
- tax: POST /tax/compare, POST /tax/whatif, GET /tax/gaps, POST /tax/tds-check, GET /tax/advance-schedule

## Done when
- Sample CTC gives a correct waterfall verified by unit tests.
- Regime comparison matches hand-calculated sample cases for both regimes.

## Global rules (apply to every page)
- The LLM extracts and explains. Code calculates. The LLM never produces a tax, return or payout number.
- Documents: OCR, then mask PII, then LLM. No raw document is stored or logged.
- Every number is a `{value, formula, inputs, assumptions, source}` object so the UI can show "Why this number?".
- Tax rules come only from `shared/data/taxRules.json` (placeholder values, verify against official sources).
- Pages share results through the report store, never by importing another module internals. Use `index.js` only.
- Strings go in this module's `i18n.js` (English + Hindi). Support Fresher and Veteran depth.
- Show the "Not advice" disclaimer on tax and market screens.
