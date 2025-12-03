/**
 * Shared types for AI provider adapters
 * Requirements: 5.1, 5.2, 5.3 - Error handling types
 */

import OpenAI from "openai";

export type Provider = "openai" | "anthropic" | "openrouter" | "platform";

/**
 * Custom error class for API errors with status codes
 * Requirements: 5.1, 5.2, 5.3 - Error handling with status codes
 */
export class APIError extends Error {
  public readonly statusCode: number;
  public readonly isRetryable: boolean;

  constructor(message: string, statusCode: number, isRetryable: boolean = false) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  baseUrl?: string;
  modelId: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  toolCalls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

export interface ProviderAdapter {
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  validateKey(): Promise<boolean>;
}

/**
 * Token usage statistics for streaming responses
 */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Callbacks for streaming chat responses
 */
export interface StreamCallbacks {
  onTextDelta: (text: string) => void;
  onComplete: (usage: TokenUsage) => void;
  onError: (error: Error) => void;
}

/**
 * Extended provider adapter with streaming support
 */
export interface StreamingProviderAdapter extends ProviderAdapter {
  streamChat(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks
  ): Promise<void>;
}
