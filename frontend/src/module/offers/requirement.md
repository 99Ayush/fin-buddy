# Page 4: Offers & Negotiate  (owner: P1, backup P3)
Route: `/offers`

## Purpose
Help the user decide between offers and negotiate better terms.

## Tabs / sections
1. **Compare Offers**: 2 to 4 offers side by side (CTC, in-hand, variable, benefits, notice period, bond, growth). Highlights the winner per row.
2. **ESOP Value**: grant, vesting, strike, scenarios of exit value, tax on exercise. Calculator driven.
3. **Counter-Email**: generate a polite counter-offer email from chosen asks.
4. **HR Role-play**: practice negotiation chat with an AI HR persona, feedback at end.

## Functional requirements
- Offers come from the report store (documents module) or manual entry.
- Comparison and ESOP numbers are computed by code (use salarytax calculators through its `index.js`).
- LLM writes email text and role-play dialogue only; any figure in the email is inserted from computed values.
- Role-play has difficulty levels and a short scorecard.

## Backend (module/offers)
- compare: POST /offers/compare
- esop: POST /offers/esop
- negotiate: POST /offers/email, POST /offers/roleplay

## Done when
- Two offers compare with correct in-hand values and a "Why this number?" per cell.
- A counter-email is generated using the user's real numbers.

## Global rules (apply to every page)
- The LLM extracts and explains. Code calculates. The LLM never produces a tax, return or payout number.
- Documents: OCR, then mask PII, then LLM. No raw document is stored or logged.
- Every number is a `{value, formula, inputs, assumptions, source}` object so the UI can show "Why this number?".
- Tax rules come only from `shared/data/taxRules.json` (placeholder values, verify against official sources).
- Pages share results through the report store, never by importing another module internals. Use `index.js` only.
- Strings go in this module's `i18n.js` (English + Hindi). Support Fresher and Veteran depth.
- Show the "Not advice" disclaimer on tax and market screens.
