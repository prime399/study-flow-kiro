/**
 * OpenAI provider adapter
 * Supports both BYOK and platform keys with streaming
 * Also used for OpenRouter (OpenAI-compatible API)
 * Requirements: 5.1, 5.2, 5.3 - Error handling
 */

import OpenAI from "openai";
import {
  StreamingProviderAdapter,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamCallbacks,
  APIError,
} from "./types";

// Re-export APIError for convenience
export { APIError };

/**
 * Maps OpenAI API errors to standardized APIError
 * Requirements: 5.1, 5.2, 5.3 - Map API errors to user-friendly messages
 */
function mapOpenAIError(error: unknown): APIError {
  // Handle OpenAI SDK errors
  if (error instanceof OpenAI.APIError) {
    const status = error.status;
    const message = error.message;

    // 401 - Authentication error
    if (status === 401) {
      return new APIError(
        "API key is invalid or missing. Please check your configuration.",
        401,
        false
      );
    }

    // 429 - Rate limiting
    if (status === 429) {
      return new APIError(
        "Too many requests. Please wait a moment and try again.",
        429,
        true
      );
    }

    // 503 - Service unavailable
    if (status === 503) {
      return new APIError(
        "The AI service is temporarily unavailable. Please try again.",
        503,
        true
      );
    }

    // 400 - Bad request
    if (status === 400) {
      return new APIError(
        "Unable to process your request. Please try rephrasing.",
        400,
        true
      );
    }

    // 500+ - Server errors
    if (status && status >= 500) {
      return new APIError(
        "Something went wrong on our end. Please try again.",
        status,
        true
      );
    }

    // Default for other status codes
    return new APIError(message, status || 500, (status || 500) >= 500);
  }

  // Handle generic errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for authentication-related errors
    if (message.includes("unauthorized") || message.includes("invalid api key") || message.includes("authentication")) {
      return new APIError(
        "API key is invalid or missing. Please check your configuration.",
        401,
        false
      );
    }

    // Check for rate limiting
    if (message.includes("rate limit") || message.includes("too many requests")) {
      return new APIError(
        "Too many requests. Please wait a moment and try again.",
        429,
        true
      );
    }

    // Check for service unavailability
    if (message.includes("service unavailable") || message.includes("overloaded")) {
      return new APIError(
        "The AI service is temporarily unavailable. Please try again.",
        503,
        true
      );
    }

    // Default error
    return new APIError(error.message, 500, true);
  }

  // Unknown error type
  return new APIError("An unexpected error occurred. Please try again.", 500, true);
}

/**
 * Default max tokens for OpenAI API requests
 */
export const DEFAULT_MAX_TOKENS = 4096;

export class OpenAIProvider implements StreamingProviderAdapter {
  private client: OpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || "https://api.openai.com/v1",
    });
  }

  async chat(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model || this.config.modelId,
        messages: request.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || DEFAULT_MAX_TOKENS,
        tools: request.tools,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response from OpenAI");
      }

      return {
        content: choice.message.content || "",
        model: response.model,
        usage: response.usage,
        toolCalls: choice.message.tool_calls,
      };
    } catch (error: unknown) {
      console.error("OpenAI chat error:", error);
      throw mapOpenAIError(error);
    }
  }

  /**
   * Streaming chat completion using OpenAI's streaming API
   * Delivers content incrementally via callbacks
   *
   * **Feature: anthropic-ai-migration, Property 6: Multi-provider streaming support**
   */
  async streamChat(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: request.model || this.config.modelId,
        messages: request.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || DEFAULT_MAX_TOKENS,
        tools: request.tools,
        stream: true,
        stream_options: { include_usage: true },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        // Handle content deltas
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          callbacks.onTextDelta(delta.content);
        }

        // Capture usage from the final chunk (when stream_options.include_usage is true)
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
        }
      }

      // Call onComplete with usage stats
      callbacks.onComplete({
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      });
    } catch (error: unknown) {
      console.error("OpenAI streaming error:", error);
      callbacks.onError(mapOpenAIError(error));
    }
  }

  async validateKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error("OpenAI key validation error:", error);
      return false;
    }
  }
}
