# Page 2: Ask & CA Help  (owner: P3, backup P1)
Route: `/ask`

## Purpose
Ask-anything chat grounded in the user's own reports, with an escalation path to a human CA.

## Tabs / sections
1. **Ask**: chat with text and voice input, suggested questions, answers cite the report/clause they come from.
2. **Escalate to CA**: send a question or report to a CA, track status.
3. **CA Summary Pack**: one-click exportable summary (PDF) of the user's reports, flags and open questions.
4. **CA Reviewer Workspace** (role: CA): queue of cases, view masked pack, reply, mark resolved.

## Functional requirements
- Chat retrieves context from the report store only; answers about numbers quote the stored number object, never recompute with the LLM.
- Voice: browser speech-to-text and text-to-speech, English and Hindi.
- If confidence is low or user asks, offer "Escalate to CA".
- CA pack contains masked data only; user previews before sending.
- Role-gated reviewer workspace (role = ca).

## Backend (module/assistant)
- chat: POST /assistant/ask, GET /assistant/history
- capack: POST /capack/generate, POST /capack/escalate, GET /capack/cases, POST /capack/cases/:id/reply

## Non-functional
Streaming responses, rate limiting, chat history stored without raw documents.

## Done when
- User asks "why is my in-hand lower than CTC?" and gets an answer using stored numbers with a "Why this number?" link.
- User can generate a CA pack and a CA can open and reply to it.

## Global rules (apply to every page)
- The LLM extracts and explains. Code calculates. The LLM never produces a tax, return or payout number.
- Documents: OCR, then mask PII, then LLM. No raw document is stored or logged.
- Every number is a `{value, formula, inputs, assumptions, source}` object so the UI can show "Why this number?".
- Tax rules come only from `shared/data/taxRules.json` (placeholder values, verify against official sources).
- Pages share results through the report store, never by importing another module internals. Use `index.js` only.
- Strings go in this module's `i18n.js` (English + Hindi). Support Fresher and Veteran depth.
- Show the "Not advice" disclaimer on tax and market screens.
