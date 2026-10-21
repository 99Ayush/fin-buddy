# Task: Complete Fin-Buddy Ask & CA Help Module End-to-End

Implement the complete **Ask & CA Help** module in the existing Fin-Buddy repository, including frontend, backend, AI integration, MongoDB persistence, voice interaction, CA escalation, and CA summary-pack export.

I am responsible for P3: Home + Ask & CA Help. The Home module is being completed separately. Focus on Ask & CA Help now.

## 1. Implementation rules

- Work directly in the existing repository.
- Use the existing React + Vite + JavaScript frontend, Express/Node.js backend, MongoDB/Mongoose database, authentication, and UI conventions.
- Inspect relevant existing Ask & CA Help files as needed, then implement the feature directly.
- Preserve the working Home module, Login/Register flow, and all other existing modules.
- Keep changes limited to the Ask & CA Help module and the smallest necessary shared integration files.
- Do not rewrite unrelated files, replace the app architecture, or install unnecessary dependencies.
- Do not commit or push changes.

## 2. Ask & CA Help frontend

Create a polished, responsive financial-assistance workspace with the following features.

### A. AI financial chat
- Provide a chat interface with message history, timestamps, loading states, error handling, and a clear way to start a new conversation.
- Allow users to ask questions about personal finance, savings, budgeting, salary, taxation, financial documents, and financial planning.
- Display answers in readable sections with bullet points and explanations where appropriate.
- Preserve conversation history for the authenticated user.
- Allow the user to revisit previous conversations if supported by the backend.

### B. Evidence-based responses
- Use real user-authorized data and available document/module information when answering questions about the user's finances.
- Clearly distinguish retrieved facts, calculations, assumptions, and general educational information.
- Use existing Salary & Tax and Money Plan APIs for their respective calculations when available.
- Do not invent financial figures, tax results, document contents, citations, or sources.
- If necessary information is unavailable, ask the user for it or explain the limitation.
- Do not claim that an answer has been verified when it has not.

### C. Voice interaction
- Add voice input for converting speech into a chat message, using browser-supported speech recognition where available.
- Add read-aloud functionality for assistant responses using browser-supported speech synthesis where available.
- Handle browser/language support limitations and microphone permission errors gracefully.
- Use the app's existing language preferences if they are available. Do not introduce a separate language selector unless the existing product requirements explicitly require one.
- Always allow normal text input when voice features are unavailable.

### D. CA Help and escalation
- Provide a clear action to request assistance from a Chartered Accountant (CA).
- Let users describe their issue and choose an appropriate category, such as income tax, filing, financial documentation, or other financial concerns.
- Show the request's actual status, such as submitted or pending, based on persisted backend data.
- Do not pretend that a real CA has been contacted unless a real delivery/integration mechanism confirms it.
- Do not build a separate CA reviewer portal in this task. This is an individual-user application; implement the user-side request workflow only.
- If no CA assignment or notification service exists, store the request and show a truthful confirmation that it was recorded, not that a CA has accepted it.

### E. CA summary pack
- Let users generate an organized summary of their financial question or case for sharing with a CA.
- Include the user's selected conversation, relevant user-provided facts, available authorized document references, and applicable dates.
- Clearly separate confirmed facts from user-provided assumptions and unresolved questions.
- Let the user preview the summary before exporting.
- Provide a downloadable PDF if an appropriate existing PDF-generation library is already available; otherwise implement a reliable export format using existing dependencies and report the limitation.
- Never include unrelated users' information, secrets, authentication tokens, or hidden system data.
- Ask for explicit user action before including sensitive optional material in an export.

## 3. Backend APIs

Implement the module's APIs following existing Express conventions. Adapt route names to existing architecture and avoid duplicate endpoints.

Provide suitable authenticated endpoints for:
- Creating and listing conversations.
- Retrieving an individual conversation and its messages.
- Sending a message to the assistant and returning its response.
- Saving messages and conversation metadata.
- Submitting and listing the current user's CA-help requests.
- Generating and exporting a CA summary pack.

Validate all inputs, use consistent JSON responses and HTTP status codes, and handle errors safely.

Every private conversation, message, CA request, and exported case must be scoped to the authenticated user. Never authorize access solely from a user ID provided by the frontend.

## 4. AI provider integration

- Reuse an existing configured AI provider if the repository already has one.
- If none exists, implement a small backend-only provider abstraction that can support a configured model/API later.
- Keep API keys and secrets exclusively in backend environment variables.
- Never expose AI keys in frontend code or browser responses.
- If AI credentials are not configured, show a clear unavailable/configuration state instead of returning fabricated AI responses.
- Use a structured system prompt that requires factual honesty, uncertainty disclosure, privacy protection, and safe financial guidance.
- Do not let untrusted document contents or user messages override application security rules.
- Add suitable request validation, timeout/error handling, and basic abuse protection.

The assistant can explain financial topics, but it must not present uncertain tax or investment information as guaranteed professional advice.

## 5. MongoDB persistence

Use existing Mongoose models and the existing database connection where possible.

Create or extend models only as needed for:
- Conversations and messages.
- CA-help requests.
- Summary-pack metadata, if persistence is needed.

Use references and ownership checks appropriately. Avoid storing duplicate financial data unnecessarily. Do not log complete sensitive conversations or documents.

## 6. Integration with other modules

- Integrate with the completed Home module using its existing navigation and route conventions.
- Reuse confirmed APIs from Documents, Offers, Salary & Tax, and Money Plan when relevant.
- Do not rewrite your friends' modules or duplicate their calculations.
- If an external module API is not available, clearly identify that integration as pending and provide a graceful fallback.
- Preserve all existing routes, authentication middleware, and UI conventions.
- Make only the smallest required shared routing or backend registration changes.

## 7. Security and privacy

- Require authentication for all private conversation, CA request, and export operations.
- Enforce per-user authorization on every read and write.
- Validate message lengths, request payloads, and export options.
- Keep credentials and secrets backend-only.
- Avoid exposing sensitive financial records in errors or logs.
- Ensure a user cannot read or export another user's conversations or CA requests.
- Do not send user financial information to an external AI provider unless that provider is explicitly configured and the request is necessary for the feature.

## 8. Testing and completion

Run available frontend builds, backend checks, and relevant tests. Fix issues introduced by this implementation.

Verify:
1. The chat UI works and handles unavailable AI configuration honestly.
2. Conversations and messages persist and remain private to the owner.
3. Voice input and read-aloud fail gracefully when unsupported.
4. CA-help requests are saved and their displayed status reflects the database.
5. Summary packs contain only selected, authorized information.
6. Exports do not leak another user's data or secrets.
7. Existing authentication, Home, and team-module routes still work.

Do not claim a test passed unless it actually ran.

## 9. Final report

Report:
- Files created or modified.
- Frontend features completed.
- API endpoints implemented.
- Database models added or reused.
- AI provider used and whether its credentials are configured.
- Voice/browser limitations.
- CA request delivery limitations.
- Summary export format.
- Actual build and test results.
- Remaining integration blockers.

Implement the Ask & CA Help module now. Prioritize a working, secure end-to-end flow over a mockup. Preserve existing working code and do not commit or push changes.