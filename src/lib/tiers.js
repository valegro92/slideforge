/**
 * SlideForge Tier System
 * Defines feature gates, model access, and pricing
 */

// Resolve tier aliases (admin → enterprise)
export function resolveTier(tier) {
  if (tier === 'admin') return 'enterprise';
  return tier;
}

export const TIERS = {
  pro: {
    name: 'Pro',
    maxPages: 50,
    models: [
      'nvidia/nemotron-nano-12b-v2-vl:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'google/gemma-3-27b-it:free',
      'meta-llama/llama-4-maverick:free',
      'qwen/qwen2.5-vl-72b-instruct:free',
      'google/gemini-2.5-flash',
      'qwen/qwen2.5-vl-72b-instruct',
      'google/gemini-2.0-flash-001'
    ],
    watermark: false,
    price: 9.99,
    priceId: 'price_pro_monthly', // Stripe
    features: [
      '50 pagine per PDF',
      'AI Vision (4 modelli)',
      'Nessun watermark',
      'Drag & resize text'
    ]
  },

  enterprise: {
    name: 'Enterprise',
    maxPages: 200,
    models: [
      'nvidia/nemotron-nano-12b-v2-vl:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'google/gemma-3-27b-it:free',
      'meta-llama/llama-4-maverick:free',
      'qwen/qwen2.5-vl-72b-instruct:free',
      'google/gemini-2.5-flash',
      'qwen/qwen2.5-vl-72b-instruct',
      'google/gemini-2.0-flash-001'
    ],
    watermark: false,
    price: 29.99,
    priceId: 'price_enterprise_monthly',
    features: [
      '200 pagine per PDF',
      'Tutti i modelli AI',
      'API REST dedicata',
      'Batch processing',
      'Brand personalizzato',
      'Supporto prioritario'
    ]
  }
};

/**
 * Check if a tier can use a specific feature
 * @param {string} tier - tier name (free, pro, enterprise)
 * @param {string} feature - feature name (watermark, offline, etc)
 * @returns {boolean}
 */
export function canUseTier(tier, feature) {
  const tierConfig = TIERS[tier];
  if (!tierConfig) return false;

  switch (feature) {
    case 'watermark':
      return tierConfig.watermark;
    case 'offline':
      return tierConfig.models.includes('offline');
    case 'api':
      return tier === 'enterprise';
    case 'batch':
      return tier === 'enterprise';
    default:
      return false;
  }
}

/**
 * Get maximum pages allowed for a tier
 * @param {string} tier - tier name
 * @returns {number}
 */
export function getMaxPages(tier) {
  return TIERS[tier]?.maxPages || 0;
}

/**
 * Check if a tier can use a specific AI model
 * @param {string} tier - tier name
 * @param {string} model - model identifier
 * @returns {boolean}
 */
export function canUseModel(tier, model) {
  const tierConfig = TIERS[tier];
  if (!tierConfig) return false;
  return tierConfig.models.includes(model);
}

/**
 * Check if a tier requires a watermark on exports
 * @param {string} tier - tier name
 * @returns {boolean}
 */
export function hasWatermark(tier) {
  return TIERS[tier]?.watermark !== false;
}

/**
 * Get tier configuration by name
 * @param {string} tier - tier name
 * @returns {object|null}
 */
export function getTierConfig(tier) {
  return TIERS[tier] || null;
}

/**
 * List all available AI models for a tier
 * @param {string} tier - tier name
 * @returns {string[]}
 */
export function getAvailableModels(tier) {
  return TIERS[tier]?.models || [];
}

/**
 * Get all tiers (for pricing page, etc)
 * @returns {object}
 */
export function getAllTiers() {
  return TIERS;
}
