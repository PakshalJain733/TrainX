import { config } from '../config/env.js';

/**
 * Multi-Provider AI Client (NVIDIA NIM, Google Gemini, Groq)
 *
 * Automatically rotates and falls back across all 3 configured AI providers:
 *   1. NVIDIA NIM        (https://integrate.api.nvidia.com/v1)
 *   2. Google Gemini     (https://generativelanguage.googleapis.com)
 *   3. Groq              (https://api.groq.com/openai/v1)
 */

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODELS = {
  nvidia: ['openai/gpt-oss-20b', 'nvidia/llama-3.1-nemotron-70b-instruct', 'mistralai/mistral-large-2-instruct'],
  gemini: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'],
  groq: ['qwen/qwen3.8-27b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
};

const PLACEHOLDER_KEYS = new Set(['your_ai_api_key', 'your_api_key', 'changeme', '']);

let lastUsedProviderInfo = null;

export const getAllAvailableProviders = () => {
  const providers = [];

  // NVIDIA
  const nvidiaKey = (
    config.ai?.nvidiaApiKey ||
    process.env.NVIDIA_AI_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    (String(config.ai?.apiKey || '').startsWith('nvapi-') ? config.ai?.apiKey : '')
  ).trim();

  if (nvidiaKey && !PLACEHOLDER_KEYS.has(nvidiaKey)) {
    providers.push({
      provider: 'nvidia',
      key: nvidiaKey,
      configuredModel: config.ai?.nvidiaModel || process.env.NVIDIA_AI_MODEL || (String(config.ai?.apiKey || '').startsWith('nvapi-') ? config.ai?.model : null),
    });
  }

  // Gemini
  const geminiKey = (
    config.ai?.geminiApiKey ||
    process.env.GEMINI_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    (String(config.ai?.apiKey || '').startsWith('AIza') || String(config.ai?.apiKey || '').startsWith('AQ.') ? config.ai?.apiKey : '')
  ).trim();

  if (geminiKey && !PLACEHOLDER_KEYS.has(geminiKey)) {
    providers.push({
      provider: 'gemini',
      key: geminiKey,
      configuredModel: config.ai?.geminiModel || process.env.GEMINI_AI_MODEL || (String(config.ai?.apiKey || '').startsWith('AIza') || String(config.ai?.apiKey || '').startsWith('AQ.') ? config.ai?.model : null),
    });
  }

  // Groq
  const groqKey = (
    config.ai?.groqApiKey ||
    process.env.Groq_AI_API_KEY ||
    process.env.GROQ_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    (String(config.ai?.apiKey || '').startsWith('gsk_') ? config.ai?.apiKey : '')
  ).trim();

  if (groqKey && !PLACEHOLDER_KEYS.has(groqKey)) {
    providers.push({
      provider: 'groq',
      key: groqKey,
      configuredModel: config.ai?.groqModel || process.env.Groq_AI_MODEL || (String(config.ai?.apiKey || '').startsWith('gsk_') ? config.ai?.model : null),
    });
  }

  // Prioritize primary provider specified by AI_API_KEY if present
  const primaryRawKey = String(config.ai?.apiKey || process.env.AI_API_KEY || '').trim();
  if (primaryRawKey.startsWith('nvapi-')) {
    providers.sort((a, b) => (a.provider === 'nvidia' ? -1 : b.provider === 'nvidia' ? 1 : 0));
  } else if (primaryRawKey.startsWith('AQ.') || primaryRawKey.startsWith('AIza')) {
    providers.sort((a, b) => (a.provider === 'gemini' ? -1 : b.provider === 'gemini' ? 1 : 0));
  } else if (primaryRawKey.startsWith('gsk_')) {
    providers.sort((a, b) => (a.provider === 'groq' ? -1 : b.provider === 'groq' ? 1 : 0));
  }

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
  return msg.content || msg.reasoning_content || null;
};

const buildRequest = (provider, key, { model, prompt, system, temperature, maxTokens, json }) => {
  if (provider === 'gemini') {
    const generationConfig = { temperature, topK: 40, topP: 0.95 };
    if (maxTokens) generationConfig.maxOutputTokens = maxTokens;
    if (json) generationConfig.response_mime_type = 'application/json';
    return {
      url: `${GEMINI_URL}/${model}:streamGenerateContent?alt=sse&key=${key}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      },
    };
  }

  const url = provider === 'nvidia' ? NVIDIA_URL : GROQ_URL;
  const messages = system ? [{ role: 'system', content: system }, { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }];
  const body = { model, messages, temperature, stream: true };
  if (maxTokens) body.max_tokens = maxTokens;
  if (json) body.response_format = { type: 'json_object' };

  return {
    url,
    init: {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    },
  };
};

const readSSE = async (body, provider, onActivity) => {
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let reasoning = '';

  for await (const chunk of body) {
    if (onActivity) onActivity();
    buffer += decoder.decode(chunk, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let evt;
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }

      if (provider === 'gemini') {
        content += evt?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      } else {
        const delta = evt?.choices?.[0]?.delta;
        if (delta?.content) content += delta.content;
        if (delta?.reasoning_content) reasoning += delta.reasoning_content;
      }
    }
  }

  return content || reasoning || null;
};

/**
 * Primary completion call with multi-provider rotation & fallback.
 *
 * Tries all active providers (NVIDIA, Gemini, Groq) and their respective models
 * until a successful response is generated.
 */
export const generateText = async (prompt, options = {}) => {
  const {
    system = '',
    temperature = 0.4,
    maxTokens = 2048,
    json = false,
    timeoutMs = 60000,
  } = options;

  const availableProviders = getAllAvailableProviders();
  if (availableProviders.length === 0) {
    console.warn('[AI] No usable AI API keys found. Skipping AI call.');
    return null;
  }

  for (const { provider, key, configuredModel } of availableProviders) {
    const models = getModelsToTry(provider, configuredModel);

    for (const model of models) {
      const controller = new AbortController();
      let timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const onActivity = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      };

      try {
        const { url, init } = buildRequest(provider, key, { model, prompt, system, temperature, maxTokens, json });
        const response = await fetch(url, { ...init, signal: controller.signal });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          console.warn(`[AI] ${provider} (${model}) HTTP ${response.status}: ${body.slice(0, 180)}`);
          continue;
        }

        if (!response.body) {
          const data = await response.json();
          const text = extractText(provider, data);
          if (text) {
            lastUsedProviderInfo = { provider, model };
            return text;
          }
          continue;
        }

        const text = await readSSE(response.body, provider, onActivity);
        if (text) {
          lastUsedProviderInfo = { provider, model };
          return text;
        }
      } catch (err) {
        console.warn(`[AI] ${provider} (${model}) failed: ${err.message}`);
      } finally {
        clearTimeout(timeoutId);
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

