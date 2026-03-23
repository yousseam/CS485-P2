/**
 * Treats example/placeholder env values as unset so AI_PROVIDER=auto
 * does not prefer a fake OpenAI key over a real Gemini key.
 */

const PLACEHOLDER_KEYS = new Set(
  [
    'sk-your-openai-api-key-here',
    'your-anthropic-api-key-here',
    'sk-ant-your-anthropic-api-key-here',
    'your-gemini-api-key-here',
  ].map((s) => s.toLowerCase())
);

/**
 * @param {string | undefined} value
 * @returns {string | undefined} Trimmed key, or undefined if missing / placeholder
 */
export function effectiveApiKey(value) {
  if (value == null || typeof value !== 'string') return undefined;
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  if (v.length === 0) return undefined;
  if (PLACEHOLDER_KEYS.has(v.toLowerCase())) return undefined;
  return v;
}
