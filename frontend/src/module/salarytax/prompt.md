# Basic prompt: Salary & Tax

Paste this into your AI coding assistant and attach `requirement.md` from this folder as context.

```
You are building the Salary & Tax page of Akumas. Read requirement.md in this folder.

Work inside frontend/src/module/salarytax, backend/src/module/salarytax and read backend/src/shared/data/taxRules.json.

Build:
1. In-hand and waterfall calculator (CTC to in-hand).
2. Payslip audit against the offer.
3. Old vs new regime comparison with what-if sliders (80C, 80D, HRA, NPS, home loan).
4. Savings gaps, TDS check and advance tax schedule.

Rules: every calculator is a pure function that returns {value, formula, inputs, assumptions, source}; read all rates and slabs from taxRules.json; add unit tests with hand-verified cases; show a Why this number drawer; show a tax disclaimer; strings in salarytax/i18n.js; export only through index.js.
Start with the in-hand waterfall as the reference pattern, then copy it for the other calculators.
```
