/**
 * Provider factory
 * Creates the appropriate streaming-capable provider adapter based on configuration
 */

import { StreamingProviderAdapter, ProviderConfig } from "./types";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";

/**
 * Creates a streaming-capable provider adapter based on the configuration.
 * All providers (Anthropic, OpenAI, OpenRouter) support streaming responses.
 *
 * **Feature: anthropic-ai-migration, Property 6: Multi-provider streaming support**
 */
export function createProvider(config: ProviderConfig): StreamingProviderAdapter {
  switch (config.provider) {
    case "openai":
    case "openrouter": // OpenRouter uses OpenAI-compatible API
      return new OpenAIProvider(config);

    case "anthropic":
      return new AnthropicProvider(config);

    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
