const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODELS = {
  groq: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
  nvidia: ['meta/llama-3.2-11b-vision-instruct', 'google/gemma-3-12b-it'],
  gemini: ['gemini-1.5-flash', 'gemini-2.0-flash'],
};

const PLACEHOLDER_KEYS = new Set(['your_ai_api_key', 'your_api_key', 'changeme', '']);

let lastUsedProviderInfo = null;

export const getAllAvailableProviders = () => {
  const providers = [];

  // Groq (high speed, 200-800ms)
  const groqKey = (
    process.env.Groq_AI_API_KEY ||
    process.env.GROQ_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    (String(process.env.AI_API_KEY || '').startsWith('gsk_') ? process.env.AI_API_KEY : '')
  ).trim();

  if (groqKey && !PLACEHOLDER_KEYS.has(groqKey)) {
    providers.push({
      provider: 'groq',
      key: groqKey,
      configuredModel: process.env.Groq_AI_MODEL || process.env.GROQ_AI_MODEL || (String(process.env.AI_API_KEY || '').startsWith('gsk_') ? process.env.AI_MODEL : null),
    });
  }

  // NVIDIA
  const nvidiaKey = (
    process.env.NVIDIA_AI_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    (String(process.env.AI_API_KEY || '').startsWith('nvapi-') ? process.env.AI_API_KEY : '')
  ).trim();

  if (nvidiaKey && !PLACEHOLDER_KEYS.has(nvidiaKey)) {
    providers.push({
      provider: 'nvidia',
      key: nvidiaKey,
      configuredModel: process.env.NVIDIA_AI_MODEL || (String(process.env.AI_API_KEY || '').startsWith('nvapi-') ? process.env.AI_MODEL : null),
    });
  }

  // Gemini
  const geminiKey = (
    process.env.GEMINI_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    (String(process.env.AI_API_KEY || '').startsWith('AIza') || String(process.env.AI_API_KEY || '').startsWith('AQ.') ? process.env.AI_API_KEY : '')
  ).trim();

  if (geminiKey && !PLACEHOLDER_KEYS.has(geminiKey)) {
    providers.push({
      provider: 'gemini',
      key: geminiKey,
      configuredModel: process.env.GEMINI_AI_MODEL || (String(process.env.AI_API_KEY || '').startsWith('AIza') || String(process.env.AI_API_KEY || '').startsWith('AQ.') ? process.env.AI_MODEL : null),
    });
  }

  // Always prioritize ultra-fast providers (Groq: ~600ms, then NVIDIA, then Gemini)
  providers.sort((a, b) => {
    const priority = { groq: 1, nvidia: 2, gemini: 3 };
    return (priority[a.provider] || 99) - (priority[b.provider] || 99);
  });

  return providers;
};

export const getActiveKeyAndProvider = () => {
  const available = getAllAvailableProviders();
  if (available.length > 0) {
    return { key: available[0].key, provider: available[0].provider };
  }
  return { key: '', provider: null };
};

export const getApiKey = () => getActiveKeyAndProvider().key;

export const detectProvider = () => getActiveKeyAndProvider().provider;

const getModelsToTry = (provider, configured) => {
  const fallback = DEFAULT_MODELS[provider] || [];
  if (configured && !placeholderModel(configured)) {
    if (provider === 'groq' && configured.toLowerCase().startsWith('gemini')) {
      return Array.from(new Set(fallback));
    }
    return Array.from(new Set([configured, ...fallback]));
  }
  return Array.from(new Set(fallback));
};

const placeholderModel = (m) => !m || /^your_/i.test(String(m).trim());

/** Pull plain text out of a provider response. */
const extractText = (provider, data) => {
  if (provider === 'gemini') {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }
  const msg = data?.choices?.[0]?.message;
  if (!msg) return null;
  const content = typeof msg.content === 'string' ? msg.content.trim() : '';
  if (content.length > 0) return content;
  return msg.reasoning_content || msg.reasoning || null;
};

const buildRequest = (provider, key, { model, prompt, system, temperature, maxTokens, json }) => {
  if (provider === 'gemini') {
    const generationConfig = { temperature, topK: 40, topP: 0.95 };
    if (maxTokens) generationConfig.maxOutputTokens = maxTokens;
    if (json) generationConfig.response_mime_type = 'application/json';
    return {
      url: `${GEMINI_URL}/${model}:generateContent?key=${key}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: (system ? system + '\n\n' : '') + prompt }] }],
          generationConfig,
        }),
      },
    };
  }

  const url = provider === 'nvidia' ? NVIDIA_URL : GROQ_URL;
  const messages = system ? [{ role: 'system', content: system }, { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }];
  const body = { model, messages, temperature };
  if (maxTokens) body.max_tokens = maxTokens;
  if (json) body.response_format = { type: 'json_object' };

  return {
    url,
    init: {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  };
};

/**
 * Primary completion call with multi-provider rotation & fallback.
 * Direct non-blocking REST JSON calls (sub-second response time).
 */
export const generateText = async (prompt, options = {}) => {
  const {
    system = '',
    temperature = 0.4,
    maxTokens = 2048,
    json = false,
    timeoutMs = 6000,
  } = options;

  const availableProviders = getAllAvailableProviders();
  if (availableProviders.length === 0) {
    console.warn('[AI] No usable AI API keys found. Skipping AI call.');
    return null;
  }

  for (const { provider, key, configuredModel } of availableProviders) {
    const models = getModelsToTry(provider, configuredModel);

    for (const model of models) {
      try {
        const { url, init } = buildRequest(provider, key, { model, prompt, system, temperature, maxTokens, json });
        const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          console.warn(`[AI] ${provider} (${model}) HTTP ${response.status}: ${body.slice(0, 160)}`);
          continue;
        }

        const data = await response.json();
        const text = extractText(provider, data);
        if (text) {
          lastUsedProviderInfo = { provider, model };
          return text;
        }
      } catch (err) {
        console.warn(`[AI] ${provider} (${model}) failed: ${err.message}`);
      }
    }
  }

  return null;
};

/** Same as generateText but strips markdown fences and parses JSON. */
export const generateJSON = async (prompt, options = {}) => {
  const text = await generateText(prompt, { ...options, json: true });
  if (!text) return null;

  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Extract outermost JSON object or array if preamble text exists
    const arrayStart = clean.indexOf('[');
    const arrayEnd = clean.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(clean.slice(arrayStart, arrayEnd + 1));
      } catch {
        /* fall through */
      }
    }

    const objStart = clean.indexOf('{');
    const objEnd = clean.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(clean.slice(objStart, objEnd + 1));
      } catch {
        /* fall through */
      }
    }

    console.warn('[AI] Could not parse model output as JSON.');
    return null;
  }
};

export const describeProvider = () => {
  const available = getAllAvailableProviders();
  if (available.length === 0) return 'none (no valid AI API keys)';
  const activeNames = available.map(p => p.provider).join(', ');
  if (lastUsedProviderInfo) {
    return `${lastUsedProviderInfo.provider} (model: ${lastUsedProviderInfo.model}) [Active Pool: ${activeNames}]`;
  }
  return `${available[0].provider} (model: ${available[0].configuredModel || DEFAULT_MODELS[available[0].provider][0]}) [Active Pool: ${activeNames}]`;
};

