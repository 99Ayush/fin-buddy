/**
 * LLM Adapter Layer (llm.js)
 * Standardized client interface. Primary provider: xAI Grok (api.x.ai).
 * Also supports Google Gemini, Groq and OpenRouter as fallbacks.
 * Strict JSON mode, response caching, graceful degradation.
 *
 * HARD RULES (enforced here, not by the prompt):
 * - A failed call never returns invented values. If the provider cannot be
 *   reached, the call throws and the caller surfaces a real error.
 * - Cached responses are only ever replayed for an identical prompt+schema,
 *   so a cache hit is always a real answer for the same document.
 */

const crypto = require('crypto');

// In-memory response cache (session-scoped, volatile)
const llmCache = new Map(); // cacheKey -> { response, timestamp, model }

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Per-call network timeout. Free-tier providers can be slow, but a hung request
// should surface as an error rather than blocking the user forever.
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 45000;

// ============================================
// PROVIDER CONFIGURATIONS
// ============================================

const providers = {
  // xAI Grok — primary provider for document validation and field extraction.
  // NOTE: distinct from `groq` below, which is Groq (api.groq.com) hosting open-weight models.
  grok: {
    name: 'xAI Grok',
    models: ['grok-4.7', 'grok-4.6', 'grok-4.5', 'grok-4.3'],
    defaultModel: 'grok-4.7',
    baseUrl: 'https://api.x.ai/v1',
    apiKeyEnv: 'GROK_API_KEY',
    supportsJsonMode: true,
    rateLimit: { rpm: 60, rpd: 0 }, // Pay-as-you-go
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'],
    defaultModel: 'gemini-flash-lite-latest',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsJsonMode: true,
    rateLimit: { rpm: 15, rpd: 1500 }, // Free tier
  },
  groq: {
    name: 'Groq',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    defaultModel: 'openai/gpt-oss-120b',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsJsonMode: true,
    rateLimit: { rpm: 30, rpd: 6000 },
  },
  openrouter: {
    name: 'OpenRouter',
    models: ['google/gemini-flash-1.5', 'meta-llama/llama-3.1-70b-instruct', 'anthropic/claude-3.5-sonnet'],
    defaultModel: 'google/gemini-flash-1.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsJsonMode: true,
    rateLimit: { rpm: 20, rpd: 1000 },
  },
};

// Order used when LLM_PROVIDER is unset or its key is missing.
const PROVIDER_PREFERENCE = ['grok', 'gemini', 'groq', 'openrouter'];

// Explicit selection via setProvider() (tests / programmatic callers)
let explicitProvider = null;
let currentModel = null;

/**
 * Resolve which provider key is actually usable right now.
 * An explicit LLM_PROVIDER wins only when its API key is present; otherwise we
 * fall back to the first configured provider so the app keeps working.
 * @returns {string} Provider key
 */
function resolveProviderKey() {
  if (explicitProvider) return explicitProvider;

  const requested = process.env.LLM_PROVIDER && providers[process.env.LLM_PROVIDER]
    ? process.env.LLM_PROVIDER
    : null;

  if (requested && process.env[providers[requested].apiKeyEnv]) return requested;

  for (const key of PROVIDER_PREFERENCE) {
    if (process.env[providers[key].apiKeyEnv]) return key;
  }

  // Nothing configured: honour the request (or the top preference) so the caller
  // receives a precise "<KEY> not set" error rather than a silent wrong answer.
  return requested || PROVIDER_PREFERENCE[0];
}

/**
 * Resolve the model id for a provider.
 * Override with e.g. GROK_MODEL, GEMINI_MODEL, GROQ_MODEL, OPENROUTER_MODEL.
 * @param {string} providerKey
 * @returns {string}
 */
function resolveModel(providerKey) {
  if (currentModel) return currentModel;
  const envModel = process.env[`${providerKey.toUpperCase()}_MODEL`];
  return envModel || providers[providerKey].defaultModel;
}

/**
 * Set the active LLM provider
 * @param {string} provider - Provider key (grok, gemini, groq, openrouter)
 * @param {string} [model] - Specific model to use
 */
function setProvider(provider, model = null) {
  if (!providers[provider]) {
    throw new Error(`Unknown provider: ${provider}. Available: ${Object.keys(providers).join(', ')}`);
  }
  explicitProvider = provider;
  currentModel = model || null;
}

/**
 * Get current provider config
 * @returns {object} Provider configuration
 */
function getProviderConfig() {
  return providers[resolveProviderKey()];
}

/**
 * Is an LLM provider actually usable (API key present)?
 * @returns {boolean}
 */
function isLlmConfigured() {
  return Boolean(process.env[getProviderConfig().apiKeyEnv]);
}

/**
 * Generate cache key from prompt and parameters
 * @param {string} prompt - Prompt text
 * @param {object} options - Generation options
 * @returns {string} Cache key
 */
function generateCacheKey(prompt, options) {
  const hash = crypto.createHash('sha256');
  hash.update(prompt);
  hash.update(JSON.stringify(options));
  return hash.digest('hex').substring(0, 32);
}

/**
 * Get cached response if valid
 * @param {string} cacheKey
 * @returns {object|null} Cached response or null
 */
function getCachedResponse(cacheKey) {
  const cached = llmCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    llmCache.delete(cacheKey);
    return null;
  }

  return cached.response;
}

/**
 * Store response in cache
 * @param {string} cacheKey
 * @param {object} response
 * @param {string} model
 */
function setCachedResponse(cacheKey, response, model) {
  llmCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    model,
  });
}

/**
 * Build a human-readable error for a failed HTTP call.
 * Never includes the API key.
 */
function describeHttpError(provider, status, body) {
  const detail = String(body || '').slice(0, 300);
  if (status === 401 || status === 403) {
    return `${provider.apiKeyEnv} was rejected by ${provider.name} (HTTP ${status}). Check the key in backend/.env.`;
  }
  if (status === 404) {
    return `${provider.name} does not expose this model (HTTP 404). Set ${provider.apiKeyEnv.replace('_API_KEY', '_MODEL')} in backend/.env. ${detail}`;
  }
  if (status === 429) {
    return `${provider.name} rate limit reached (HTTP 429). Retry in a moment. ${detail}`;
  }
  return `${provider.name} API error ${status}: ${detail}`;
}

/**
 * Call LLM with structured JSON output (primary method)
 * @param {string} prompt - System + user prompt
 * @param {object} schema - JSON schema for response validation
 * @param {object} options - Generation options
 * @returns {Promise<object>} Parsed JSON response
 */
async function callLlmStructured(prompt, schema, options = {}) {
  const providerKey = resolveProviderKey();
  const provider = providers[providerKey];
  const model = resolveModel(providerKey);
  const cacheKey = generateCacheKey(prompt, { schema, provider: providerKey, model, ...options });

  // Replay only an identical previous call (same prompt + schema + provider + model).
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('[LLM] Cache hit');
    return cached;
  }

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} not set. Cannot call ${provider.name}.`);
  }

  const systemPrompt = `You are a precise information extraction engine. Output ONLY valid JSON matching the provided schema. No markdown, no explanations, no extra text. Never invent a value that is not literally present in the input.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${prompt}\n\nOutput schema:\n${JSON.stringify(schema, null, 2)}` },
  ];

  const response = providerKey === 'gemini'
    ? await callGemini(messages, schema, model, apiKey, options)
    : await callOpenAICompatible(messages, schema, model, apiKey, providerKey, provider, options);

  const validated = validateJsonResponse(response, schema);
  setCachedResponse(cacheKey, validated, model);
  return validated;
}

/**
 * Call Gemini API
 */
async function callGemini(messages, schema, model, apiKey, options = {}) {
  const url = `${providers.gemini.baseUrl}/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxTokens ?? 8192,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(describeHttpError(providers.gemini, res.status, await res.text()));
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseJsonOrThrow(text, providers.gemini);
}

/**
 * Call an OpenAI-compatible API (xAI Grok, Groq, OpenRouter)
 */
async function callOpenAICompatible(messages, schema, model, apiKey, providerKey, provider, options = {}) {
  const url = `${provider.baseUrl}/chat/completions`;

  const payload = {
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: options.temperature ?? 0.1,
    max_tokens: options.maxTokens ?? 8192,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(providerKey === 'openrouter' && {
        'HTTP-Referer': 'https://fin-buddy.dev',
        'X-Title': 'Fin-Buddy',
      }),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(describeHttpError(provider, res.status, await res.text()));
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty response from ${provider.name}`);

  return parseJsonOrThrow(text, provider);
}

/**
 * Parse a JSON body, tolerating accidental markdown fences.
 */
function parseJsonOrThrow(text, provider) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch (inner) {
        // fall through to the descriptive error below
      }
    }
    throw new Error(`${provider.name} returned a non-JSON response`);
  }
}

/**
 * Validate JSON response against schema (basic validation)
 * @param {object} response - Parsed JSON
 * @param {object} schema - JSON Schema
 * @returns {object} Validated response
 */
function validateJsonResponse(response, schema) {
  if (!response || typeof response !== 'object') {
    throw new Error('LLM returned an empty structured response');
  }

  // Basic required field check
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in response)) {
        console.warn(`[LLM] Missing required field: ${field}`);
      }
    }
  }
  return response;
}

/**
 * Simple text generation (non-structured)
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<string>}
 */
async function callLlm(prompt, options = {}) {
  const providerKey = resolveProviderKey();
  const provider = providers[providerKey];
  const model = resolveModel(providerKey);
  const apiKey = process.env[provider.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} not set`);
  }

  const messages = [
    { role: 'system', content: options.system || 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];

  if (providerKey === 'gemini') {
    const url = `${provider.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, parts: [{ text: m.content }] })),
        generationConfig: { temperature: options.temperature ?? 0.3, maxOutputTokens: options.maxTokens ?? 2048 },
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(describeHttpError(provider, res.status, JSON.stringify(data.error || data)));
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  const url = `${provider.baseUrl}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
    }),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(describeHttpError(provider, res.status, JSON.stringify(data.error || data)));
  }
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Get cache statistics
 * @returns {object}
 */
function getCacheStats() {
  return {
    size: llmCache.size,
    keys: Array.from(llmCache.keys()),
    ttlHours: CACHE_TTL_MS / (60 * 60 * 1000),
  };
}

/**
 * Clear cache
 */
function clearCache() {
  llmCache.clear();
}

module.exports = {
  callLlm,
  callLlmStructured,
  setProvider,
  getProviderConfig,
  getActiveProviderKey: resolveProviderKey,
  getActiveModel: () => resolveModel(resolveProviderKey()),
  isLlmConfigured,
  getCacheStats,
  clearCache,
  providers,
};
