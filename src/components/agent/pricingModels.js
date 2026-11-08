/**
 * Metadatos de Facturación por Token y Tarifas Reales de Modelos (USD por 1M tokens)
 * Solo los proveedores con API de pago por token aplican a telemetría de costos.
 * Los proveedores que usan cuota de cuenta fija (Google Antigravity CLI, Claude CLI con cuota Pro/Max, Ollama local, Custom)
 * se excluyen explícitamente ya que no tienen sentido financiero por token.
 */

export const PAY_PER_TOKEN_PROVIDERS = new Set([
  'deepseek',
  'anthropic',
  'openai',
  'openrouter'
]);

/**
 * Tarifas oficiales de referencia por 1M de tokens (Input / Output) en USD
 */
export const MODEL_PRICING_USD_PER_M = {
  // DeepSeek (Direct Cloud API)
  'deepseek-chat': { input: 0.14, output: 0.28, name: 'DeepSeek V3' },
  'deepseek-reasoner': { input: 0.55, output: 2.19, name: 'DeepSeek R1' },

  // Anthropic API (Nativo / API Key)
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00, name: 'Claude 3.5 Haiku' },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, name: 'Claude 3.5 Sonnet' },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00, name: 'Claude 3 Opus' },

  // OpenAI API (Nativo / API Key)
  'gpt-4o-mini': { input: 0.15, output: 0.60, name: 'GPT-4o Mini' },
  'gpt-4o': { input: 2.50, output: 10.00, name: 'GPT-4o' },
  'o3-mini': { input: 1.10, output: 4.40, name: 'OpenAI o3-mini' },

  // OpenRouter (Agregado)
  'deepseek/deepseek-chat': { input: 0.14, output: 0.28, name: 'DeepSeek V3 (OR)' },
  'deepseek/deepseek-r1': { input: 0.55, output: 2.19, name: 'DeepSeek R1 (OR)' },
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00, name: 'Claude 3.5 Sonnet (OR)' }
};

/**
 * Determina si el motor activo opera bajo facturación por consumo de token (Pay-Per-Token).
 * Proveedores como 'agy', 'claude' (CLI con cuota fija), 'ollama' y 'custom' retornan false.
 */
export function isPayPerTokenProvider(agentType) {
  if (!agentType) return false;
  return PAY_PER_TOKEN_PROVIDERS.has(String(agentType).toLowerCase());
}

/**
 * Normaliza el identificador de modelo retirando flags de intensidad (-low, -medium, -high)
 */
export function normalizeModelId(modelId) {
  if (!modelId) return '';
  return String(modelId).replace(/-(low|medium|high)$/i, '').trim();
}

/**
 * Calcula el costo en USD de un consumo de tokens.
 * Retorna null si el proveedor o modelo no factura por token.
 */
export function calculateTokenCostUsd(agentType, modelId, inputTokens = 0, outputTokens = 0) {
  if (!isPayPerTokenProvider(agentType)) return null;

  const cleanId = normalizeModelId(modelId);
  const pricing = MODEL_PRICING_USD_PER_M[cleanId] || MODEL_PRICING_USD_PER_M[modelId];

  // Si no está registrado en el tarifario exacto pero es de pago, usar tarifa de referencia conservadora según proveedor
  const rate = pricing || (
    agentType === 'deepseek' ? { input: 0.14, output: 0.28 } :
    agentType === 'anthropic' ? { input: 3.00, output: 15.00 } :
    agentType === 'openai' ? { input: 2.50, output: 10.00 } :
    agentType === 'openrouter' ? { input: 0.55, output: 2.19 } :
    null
  );

  if (!rate) return null;

  const inCost = (Number(inputTokens) || 0) * (rate.input / 1_000_000);
  const outCost = (Number(outputTokens) || 0) * (rate.output / 1_000_000);
  const totalCost = inCost + outCost;

  return totalCost;
}

/**
 * Formatea un monto en USD para visualización limpia en badge táctico.
 * Ejemplos: < $0.0001 -> "<$0.0001", $0.0042, $0.12
 */
export function formatUsdCost(cost) {
  if (typeof cost !== 'number' || isNaN(cost) || cost <= 0) return null;
  if (cost < 0.0001) return '<$0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}
