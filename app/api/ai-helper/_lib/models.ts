/**
 * Model configuration and metadata
 * Centralized model definitions and availability checking for Anthropic-based AI
 */

// Supported model IDs for the Anthropic-based system
export type SupportedModelId = 
  | "claude-sonnet-4-20250514"    // Claude Sonnet 4 (default)
  | "gpt-4o"                       // OpenAI GPT-4o (BYOK)
  | "gpt-4o-mini"                  // OpenAI GPT-4o Mini (BYOK)

// Default model configuration
export const DEFAULT_MODEL_ID: SupportedModelId = "claude-sonnet-4-20250514"
export const DEFAULT_MAX_TOKENS = 4096
export const DEFAULT_TEMPERATURE = 0.7

export interface ModelInfo {
  id: SupportedModelId
  name: string
  description: string
  provider: "anthropic" | "openai" | "openrouter"
  iconType?: "brain" | "zap" | "cpu"
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

// Complete model definitions
export const ALL_MODELS: ModelInfo[] = [
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Advanced reasoning model recommended for most study help.",
    provider: "anthropic",
    iconType: "cpu",
    badge: "Recommended",
    badgeVariant: "default",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's most capable model for complex tasks (BYOK only).",
    provider: "openai",
    iconType: "brain",
    badge: "BYOK",
    badgeVariant: "outline",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and efficient OpenAI model (BYOK only).",
    provider: "openai",
    iconType: "zap",
    badge: "BYOK",
    badgeVariant: "secondary",
  },
] as const

/**
 * Get available models based on configured environment variables
 * Returns models that have their required API keys configured
 */
export function getAvailableModels(): SupportedModelId[] {
  const available: SupportedModelId[] = []
  
  // Anthropic models - available if ANTHROPIC_API_KEY or ANTHROPIC_INFERENCE_KEY is set
  // Support both env var names for backwards compatibility
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_INFERENCE_KEY) {
    available.push("claude-sonnet-4-20250514")
  }
  
  // OpenAI models - available for BYOK users only (checked at runtime via user keys)
  // These are always listed as potentially available for BYOK
  available.push("gpt-4o", "gpt-4o-mini")
  
  return available
}

/**
 * Get the default model ID from environment or fallback
 */
export function getDefaultModelId(): SupportedModelId {
  const envModelId = process.env.AI_DEFAULT_MODEL_ID
  if (envModelId && isValidModelId(envModelId)) {
    return envModelId as SupportedModelId
  }
  return DEFAULT_MODEL_ID
}

/**
 * Check if a model ID is valid
 */
export function isValidModelId(modelId: string): modelId is SupportedModelId {
  return ALL_MODELS.some(model => model.id === modelId)
}

/**
 * Get available models with their metadata
 */
export function getAvailableModelInfo(): ModelInfo[] {
  const availableModelIds = getAvailableModels()
  return ALL_MODELS.filter(model => availableModelIds.includes(model.id))
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return ALL_MODELS.find(model => model.id === modelId)
}

/**
 * Validate if a model is available
 */
export function isModelAvailable(modelId: string): boolean {
  const availableModels = getAvailableModels()
  return availableModels.includes(modelId as SupportedModelId)
}

/**
 * Get the provider for a given model ID
 */
export function getModelProvider(modelId: string): "anthropic" | "openai" | "openrouter" | undefined {
  const model = getModelInfo(modelId)
  return model?.provider
}