# Page 1: Home  (owner: P3, backup P1)
Route: `/` (public landing) and `/home` (after login)

## Purpose
First impression and daily hub. Gets the user signed in, shows their financial snapshot, career timeline, next steps and market movers.

## Tabs / sections
1. **Landing** (logged out): hero, how it works (upload, understand, save, act), language toggle, Login / Register.
2. **Overview** (logged in): financial health snapshot, latest report cards (read from report store), next-best-actions list.
3. **Career Timeline**: jobs, offers, raises and tax years on one timeline.
4. **Profile**: name, language, depth (Fresher/Veteran), income details, consent settings.
5. **Market Movers**: leaderboard of top gainers/losers with disclaimer. Education only.

## Functional requirements
- Register, login, logout, session (JWT or cookie), protected routes.
- Overview reads reports from the report store; no direct import of other modules.
- Next steps are rule-based from report flags (e.g. "80C gap found, open Salary & Tax").
- Market data from a mock or free API, cached; no buy/sell advice.
- Language and depth toggle persists in profile.

## Backend (module/home)
- auth: POST /auth/register, POST /auth/login, GET /auth/me
- dashboard: GET /dashboard/summary, GET /dashboard/timeline, GET/PUT /profile
- markets: GET /markets/movers

## Non-functional
Mobile responsive, loads under 2s, accessible (labels, contrast), empty states for new users.

## Done when
- A new user can register, set language/depth, and see an empty-state Overview.
- After a report exists, Overview shows it and a next step links to the right page.
- Hindi and English both render fully.

## Global rules (apply to every page)
- The LLM extracts and explains. Code calculates. The LLM never produces a tax, return or payout number.
- Documents: OCR, then mask PII, then LLM. No raw document is stored or logged.
- Every number is a `{value, formula, inputs, assumptions, source}` object so the UI can show "Why this number?".
- Tax rules come only from `shared/data/taxRules.json` (placeholder values, verify against official sources).
- Pages share results through the report store, never by importing another module internals. Use `index.js` only.
- Strings go in this module's `i18n.js` (English + Hindi). Support Fresher and Veteran depth.
- Show the "Not advice" disclaimer on tax and market screens.
