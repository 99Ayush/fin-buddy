# Basic prompt: Offers & Negotiate

Paste this into your AI coding assistant and attach `requirement.md` from this folder as context.

```
You are building the Offers & Negotiate page of Akumas. Read requirement.md in this folder.

Work only inside frontend/src/module/offers and backend/src/module/offers.

Build:
1. Compare Offers: 2 to 4 offers side by side, populated from the documents report or manual entry, with the better value highlighted per row.
2. ESOP Value calculator with exit scenarios.
3. Counter-Email generator and HR Role-play chat with a short scorecard.

Rules: all numbers come from code (call salarytax calculators via its index.js); the LLM writes only text and inserts computed values; strings in offers/i18n.js; export only through index.js.
Start with the comparison table using sample data, then ESOP, then the email, then role-play.
```
