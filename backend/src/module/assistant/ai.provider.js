
'use strict';

/**
 * AI Provider — backend-only abstraction layer.
 * Supports Google Gemini when GEMINI_API_KEY is configured.
 * Falls back to a clear "not configured" response otherwise.
 *
 * RULES (enforced here, not by the LLM):
 * - API keys are never returned to the frontend.
 * - The LLM may explain; it never computes a tax/salary/investment number.
 * - If context from the report store is available, it is injected as system context.
 * - Raw document text is never sent to the AI — only pre-extracted report fields.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CONFIGURED = !!GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are Fin-Buddy, a financial clarity assistant for Indian professionals.

STRICT RULES you must follow at all times:
1. You may EXPLAIN financial concepts, tax provisions, and salary components.
2. You must NEVER compute, calculate, or state a specific rupee amount, tax liability, or investment return — that is done by deterministic code, not you.
3. If the user asks for a number, explain what factors affect it and tell them to use the relevant module (Documents, Salary & Tax, Money Plan) for the actual calculation.
4. Always disclose when you are uncertain. Say "I'm not certain — please verify with a CA or official source."
5. You are not SEBI-registered. Never give investment advice. Always add: "Not financial or legal advice."
6. Do not hallucinate document contents, tax rules, or legal provisions.
7. If user-context is provided (financial data from their documents), use it to give relevant explanations — do not contradict the stored numbers.
8. Keep responses concise and friendly. Use bullet points where helpful.
9. When relevant, suggest the user escalate to a CA for complex tax or legal matters.
10. Respond in the same language the user writes in (English or Hindi).`;

/**
 * Send a message to the AI and get a response.
 * @param {string} userMessage - The user's text message
 * @param {Array}  history     - Prior messages [{role, text}] for context (last 10 max)
 * @param {object} userContext - Optional: sanitized report store data for the user
 * @returns {Promise<{text: string, configured: boolean}>}
 */
async function ask(userMessage, history = [], userContext = null) {
  if (!CONFIGURED) {
    return {
      text: "I'm not yet connected to an AI provider. To enable AI responses, ask your administrator to configure `GEMINI_API_KEY` in the backend environment.\n\nIn the meantime, I can still help you navigate the app — try uploading a document or using the Salary & Tax module.",
      configured: false,
      citations: [],
    };
  }

  try {
    // Build conversation contents for Gemini
    const contents = [];

    // Include recent history (last 10 turns)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      });
    }

    // Append user context if available
    let finalMessage = userMessage;
    if (userContext && userContext.documentCount > 0) {
      finalMessage = `[User has ${userContext.documentCount} document(s) uploaded: ${userContext.docTypes.join(', ')}]\n\n${userMessage}`;
    }

    contents.push({ role: 'user', parts: [{ text: finalMessage }] });

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
    };

    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[ai-provider] Gemini error:', resp.status, err.slice(0, 200));
      throw new Error(`AI provider returned ${resp.status}`);
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';

    return { text, configured: true, citations: [] };

  } catch (err) {
    console.error('[ai-provider] ask failed:', err.message);
    if (err.name === 'TimeoutError') {
      return { text: 'The AI took too long to respond. Please try again.', configured: true, citations: [] };
    }
    return { text: 'The AI assistant is temporarily unavailable. Please try again shortly.', configured: true, citations: [] };
  }
}

module.exports = { ask, CONFIGURED };
