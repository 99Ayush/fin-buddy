# Basic prompt: Ask & CA Help

Paste this into your AI coding assistant and attach `requirement.md` from this folder as context.

```
You are building the Ask & CA Help page of Akumas. Read requirement.md in this folder.

Work only inside frontend/src/module/assistant and backend/src/module/assistant.

Build:
1. A chat UI with text and voice input (browser speech APIs), English and Hindi.
2. Backend POST /assistant/ask that loads the user's reports from the report store and asks the LLM to answer using only those. Numbers must be quoted from stored number objects, never recomputed.
3. An Escalate to CA flow, a CA Summary Pack generator (masked, previewable, exportable to PDF) and a CA Reviewer workspace gated by role.

Rules: LLM explains, code calculates; strings in assistant/i18n.js; export only through index.js.
Start with a working text chat using a mocked report, then add the rest step by step.
```
