import { config } from '../config/env.js';

/**
 * Provider-agnostic AI client.
 *
 * The provider is detected from the API key prefix so the app keeps working
 * regardless of which vendor key is supplied in AI_API_KEY:
 *   nvapi-...  -> NVIDIA NIM        (https://integrate.api.nvidia.com/v1)
 *   AIza...    -> Google Gemini     (https://generativelanguage.googleapis.com)
 *   gsk_...    -> Groq              (https://api.groq.com/openai/v1)
 */

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODELS = {
  nvidia: ['openai/gpt-oss-20b'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
};

const PLACEHOLDER_KEYS = new Set(['your_ai_api_key', 'your_api_key', 'changeme', '']);

export const getApiKey = () =>
  config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';

export const detectProvider = (key = getApiKey()) => {
  if (!key || PLACEHOLDER_KEYS.has(String(key).trim())) return null;
  if (key.startsWith('nvapi-')) return 'nvidia';
  if (key.startsWith('AIza')) return 'gemini';
  if (key.startsWith('gsk_')) return 'groq';
  return null;
};

/**
 * Ordered list of models to attempt. The configured AI_MODEL is always tried
 * first, then sensible vendor defaults.
 */
const getModelsToTry = (provider, configured) => {
  const fallback = DEFAULT_MODELS[provider] || [];
  if (configured && !placeholderModel(configured)) return Array.from(new Set([configured, ...fallback]));
  return Array.from(new Set(fallback));
};

const placeholderModel = (m) => !m || /^your_/i.test(String(m).trim());

/** Pull plain text out of a provider response. */
const extractText = (provider, data) => {
  if (provider === 'gemini') {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }
  // NVIDIA + Groq (OpenAI-compatible chat completions shape)
  const msg = data?.choices?.[0]?.message;
  if (!msg) return null;
  // Reasoning models (e.g. gpt-oss) put thinking in reasoning_content and the
  // answer in content, but fall back to reasoning_content if content is empty.
  return msg.content || msg.reasoning_content || null;
};

const buildRequest = (provider, { model, prompt, system, temperature, maxTokens, json }) => {
  if (provider === 'gemini') {
    const generationConfig = { temperature, topK: 40, topP: 0.95 };
    if (maxTokens) generationConfig.maxOutputTokens = maxTokens;
    if (json) generationConfig.response_mime_type = 'application/json';
    return {
      url: `${GEMINI_URL}/${model}:streamGenerateContent?alt=sse&key=${getApiKey()}`,
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
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    },
  };
};

/**
 * Consume a Server-Sent Events stream and accumulate the response text.
 * `onActivity` is invoked on every chunk so the caller can treat the timeout
 * as an idle timeout rather than a hard deadline.
 */
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
 * Single completion call with automatic model fallback.
 *
 * Requests are streamed so that slow reasoning models (e.g. NVIDIA gpt-oss) do
 * not trip a hard deadline: `timeoutMs` is an *idle* timeout that is reset on
 * every chunk received.
 *
 * @returns {Promise<string|null>} raw model text, or null when the provider is
 *   unconfigured or every model attempt failed.
 */
export const generateText = async (prompt, options = {}) => {
  const {
    system = '',
    temperature = 0.4,
    maxTokens = 2048,
    json = false,
    timeoutMs = 60000,
  } = options;

  const provider = detectProvider();
  if (!provider) {
    console.warn('[AI] No usable AI_API_KEY found (expected nvapi-, AIza, or gsk_ prefix). Skipping AI call.');
    return null;
  }

  const models = getModelsToTry(provider, config.ai?.model);

  for (const model of models) {
    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    // Idle timeout: any incoming chunk proves the model is still working.
    const onActivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    };

    try {
      const { url, init } = buildRequest(provider, { model, prompt, system, temperature, maxTokens, json });
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn(`[AI] ${provider} ${model} HTTP ${response.status}: ${body.slice(0, 180)}`);
        continue;
      }

      if (!response.body) {
        const data = await response.json();
        const text = extractText(provider, data);
        if (text) return text;
        continue;
      }

      const text = await readSSE(response.body, provider, onActivity);
      if (text) return text;
    } catch (err) {
      console.warn(`[AI] ${provider} ${model} failed: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
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
    // Fall back to the outermost object/array found in the response.
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch { /* fall through */ }
    }
    const objectMatch = clean.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try { return JSON.parse(objectMatch[0]); } catch { /* fall through */ }
    }
    console.warn('[AI] Could not parse model output as JSON.');
    return null;
  }
};

export const describeProvider = () => {
  const provider = detectProvider();
  if (!provider) return 'none (no valid AI_API_KEY)';
  return `${provider} (model: ${config.ai?.model || DEFAULT_MODELS[provider][0]})`;
};
