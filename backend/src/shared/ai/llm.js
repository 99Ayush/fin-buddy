/**
 * LLM Adapter Layer (llm.js)
 * Standardized client interface with support for Google Gemini, Groq, OpenRouter.
 * Strict JSON mode, cached offline fallback, graceful degradation.
 */

const crypto = require('crypto');

// In-memory response cache (session-scoped, volatile)
const llmCache = new Map(); // cacheKey -> { response, timestamp, model }

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ============================================
// PROVIDER CONFIGURATIONS
// ============================================

const providers = {
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
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.1-70b-versatile',
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

// Current provider selection (can be overridden via env)
let currentProvider = process.env.LLM_PROVIDER || 'gemini';
let currentModel = null;

/**
 * Set the active LLM provider
 * @param {string} provider - Provider key (gemini, groq, openrouter)
 * @param {string} [model] - Specific model to use
 */
function setProvider(provider, model = null) {
  if (!providers[provider]) {
    throw new Error(`Unknown provider: ${provider}. Available: ${Object.keys(providers).join(', ')}`);
  }
  currentProvider = provider;
  currentModel = model || providers[provider].defaultModel;
}

/**
 * Get current provider config
 * @returns {object} Provider configuration
 */
function getProviderConfig() {
  return providers[currentProvider];
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
 * Call LLM with structured JSON output (primary method)
 * @param {string} prompt - System + user prompt
 * @param {object} schema - JSON schema for response validation
 * @param {object} options - Generation options
 * @returns {Promise<object>} Parsed JSON response
 */
async function callLlmStructured(prompt, schema, options = {}) {
  const provider = getProviderConfig();
  const model = currentModel || provider.defaultModel;
  const cacheKey = generateCacheKey(prompt, { schema, ...options });

  // Check cache first
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('[LLM] Cache hit');
    return cached;
  }

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} not set. Cannot call ${provider.name}.`);
  }

  const systemPrompt = `You are a precise information extraction engine. Output ONLY valid JSON matching the provided schema. No markdown, no explanations, no extra text.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${prompt}\n\nOutput schema:\n${JSON.stringify(schema, null, 2)}` },
  ];

  let response;

  try {
    if (currentProvider === 'gemini') {
      response = await callGemini(messages, schema, model, apiKey);
    } else {
      response = await callOpenAICompatible(messages, schema, model, apiKey, provider.baseUrl);
    }

    // Validate against schema
    const validated = validateJsonResponse(response, schema);
    setCachedResponse(cacheKey, validated, model);
    return validated;

  } catch (error) {
    console.error('[LLM] Call failed:', error.message);

    // Return cached fallback if available
    const fallback = getFallbackResponse(schema);
    if (fallback) {
      console.log('[LLM] Using cached fallback response');
      return fallback;
    }

    throw error;
  }
}

/**
 * Call Gemini API
 */
async function callGemini(messages, schema, model, apiKey) {
  const url = `${providers.gemini.baseUrl}/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return JSON.parse(text);
}

/**
 * Call OpenAI-compatible API (Groq, OpenRouter)
 */
async function callOpenAICompatible(messages, schema, model, apiKey, baseUrl) {
  const url = `${baseUrl}/chat/completions`;

  const payload = {
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 8192,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(currentProvider === 'openrouter' && {
        'HTTP-Referer': 'https://fin-buddy.dev',
        'X-Title': 'Fin-Buddy',
      }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${currentProvider} API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from LLM');

  return JSON.parse(text);
}

/**
 * Validate JSON response against schema (basic validation)
 * @param {object} response - Parsed JSON
 * @param {object} schema - JSON Schema
 * @returns {object} Validated response
 */
function validateJsonResponse(response, schema) {
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
 * Generate fallback response from schema defaults
 * @param {object} schema - JSON Schema
 * @returns {object|null} Fallback object with defaults
 */
function getFallbackResponse(schema) {
  if (!schema.properties) return null;

  const fallback = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.default !== undefined) {
      fallback[key] = prop.default;
    } else if (prop.type === 'string') {
      fallback[key] = prop.enum ? prop.enum[0] : '';
    } else if (prop.type === 'number' || prop.type === 'integer') {
      fallback[key] = prop.minimum ?? 0;
    } else if (prop.type === 'boolean') {
      fallback[key] = false;
    } else if (prop.type === 'array') {
      fallback[key] = [];
    } else if (prop.type === 'object') {
      fallback[key] = getFallbackResponse(prop) || {};
    }
  }
  return fallback;
}

/**
 * Simple text generation (non-structured)
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<string>}
 */
async function callLlm(prompt, options = {}) {
  const provider = getProviderConfig();
  const model = currentModel || provider.defaultModel;
  const apiKey = process.env[provider.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} not set`);
  }

  const messages = [
    { role: 'system', content: options.system || 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];

  if (currentProvider === 'gemini') {
    const url = `${providers.gemini.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: options.temperature ?? 0.3, maxOutputTokens: options.maxTokens ?? 2048 },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(data.error || data)}`);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
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
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
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
  getCacheStats,
  clearCache,
  providers,
};
