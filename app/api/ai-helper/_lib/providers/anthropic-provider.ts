/**
 * Anthropic provider adapter
 * Supports both BYOK and platform keys with streaming
 * Requirements: 5.1, 5.2, 5.3 - Error handling
 */

import Anthropic from "@anthropic-ai/sdk";
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
 * Maps Anthropic API errors to standardized APIError
 * Requirements: 5.1, 5.2, 5.3 - Map API errors to user-friendly messages
 */
function mapAnthropicError(error: unknown): APIError {
  // Handle Anthropic SDK errors
  if (error instanceof Anthropic.APIError) {
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

    // 503 - Service unavailable / overloaded
    if (status === 503 || status === 529) {
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
    if (status >= 500) {
      return new APIError(
        "Something went wrong on our end. Please try again.",
        status,
        true
      );
    }

    // Default for other status codes
    return new APIError(message, status, status >= 500);
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
 * Default max tokens for Anthropic API requests
 */
export const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicProvider implements StreamingProviderAdapter {
  private client: Anthropic;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  /**
   * Converts OpenAI-style messages to Anthropic format
   * Extracts system message and formats conversation messages
   */
  private convertMessages(messages: ChatCompletionRequest["messages"]): {
    systemMessage: string | undefined;
    conversationMessages: Anthropic.Messages.MessageParam[];
  } {
    const systemMsg = messages.find((m) => m.role === "system");
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    return {
      systemMessage: systemMsg?.content,
      conversationMessages,
    };
  }

  /**
   * Converts OpenAI tools to Anthropic tools format
   */
  private convertTools(
    tools?: OpenAI.Chat.Completions.ChatCompletionTool[]
  ): Anthropic.Messages.Tool[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }

    return tools
      .filter((tool) => tool.type === "function")
      .map((tool) => ({
        name: tool.function.name,
        description: tool.function.description || "",
        input_schema: {
          type: "object" as const,
          ...(tool.function.parameters as Record<string, unknown>),
        },
      }));
  }

  /**
   * Non-streaming chat completion
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const { systemMessage, conversationMessages } = this.convertMessages(
        request.messages
      );
      const tools = this.convertTools(request.tools);

      const response = await this.client.messages.create({
        model: request.model || this.config.modelId,
        messages: conversationMessages,
        system: systemMessage,
        max_tokens: request.max_tokens || DEFAULT_MAX_TOKENS,
        temperature: request.temperature || 0.7,
        tools: tools,
      });

      // Convert Anthropic response to OpenAI format
      let content = "";
      let toolCalls:
        | OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
        | undefined;

      for (const block of response.content) {
        if (block.type === "text") {
          content += block.text;
        } else if (block.type === "tool_use") {
          if (!toolCalls) {
            toolCalls = [];
          }
          toolCalls.push({
            id: block.id,
            type: "function",
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          });
        }
      }

      return {
        content,
        model: response.model,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
        toolCalls,
      };
    } catch (error: unknown) {
      console.error("Anthropic chat error:", error);
      throw mapAnthropicError(error);
    }
  }

  /**
   * Streaming chat completion using Anthropic's streaming API
   * Delivers content incrementally via callbacks
   *
   * **Feature: anthropic-ai-migration, Property 1: Streaming delivers incremental content**
   */
  async streamChat(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const { systemMessage, conversationMessages } = this.convertMessages(
        request.messages
      );
      const tools = this.convertTools(request.tools);

      const stream = this.client.messages.stream({
        model: request.model || this.config.modelId,
        messages: conversationMessages,
        system: systemMessage,
        max_tokens: request.max_tokens || DEFAULT_MAX_TOKENS,
        temperature: request.temperature || 0.7,
        tools: tools,
      });

      // Handle streaming events
      stream.on("text", (text) => {
        callbacks.onTextDelta(text);
      });

      // Wait for the stream to complete and get final message
      const finalMessage = await stream.finalMessage();

      // Call onComplete with usage stats
      callbacks.onComplete({
        input_tokens: finalMessage.usage.input_tokens,
        output_tokens: finalMessage.usage.output_tokens,
      });
    } catch (error: unknown) {
      console.error("Anthropic streaming error:", error);
      callbacks.onError(mapAnthropicError(error));
    }
  }

  async validateKey(): Promise<boolean> {
    try {
      // Make a minimal test request
      await this.client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });
      return true;
    } catch (error) {
      console.error("Anthropic key validation error:", error);
      return false;
    }
  }
}
