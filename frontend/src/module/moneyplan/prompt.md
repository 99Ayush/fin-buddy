# Basic prompt: Money Plan

Paste this into your AI coding assistant and attach `requirement.md` from this folder as context.

```
You are building the Money Plan page of Akumas. Read requirement.md in this folder.

Work inside frontend/src/module/moneyplan and backend/src/module/moneyplan.

Build:
1. Financial health score with a breakdown (weights from rules data).
2. Goals tracker with required monthly saving.
3. Loan calculator (EMI, interest, prepayment impact) that also reads loan-letter flags from the report store.
4. Regret simulator with editable assumptions.
5. A hidden role-gated /admin area for tax rule versions and usage stats.

Rules: all numbers from code in the standard number object; strings in moneyplan/i18n.js; export only through index.js; non-admin users must not reach /admin.
Start with the health score, then goals, loans, simulator, and admin last.
```
