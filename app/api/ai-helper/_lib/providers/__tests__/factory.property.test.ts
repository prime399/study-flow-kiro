/**
 * Property-based tests for Provider Factory
 *
 * These tests verify correctness properties for the provider factory
 * using fast-check for property-based testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  ProviderConfig,
  StreamingProviderAdapter,
  ChatCompletionRequest,
  StreamCallbacks,
  TokenUsage,
} from "../types";

// Create mock functions for Anthropic
const mockAnthropicStream = vi.fn();
const mockAnthropicCreate = vi.fn();

// Create mock functions for OpenAI
const mockOpenAICreate = vi.fn();

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: mockAnthropicCreate,
      stream: mockAnthropicStream,
    };
    constructor() {}
  }
  return { default: MockAnthropic };
});

// Mock the OpenAI SDK
vi.mock("openai", () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: mockOpenAICreate,
      },
    };
    models = {
      list: vi.fn().mockResolvedValue({ data: [] }),
    };
    constructor() {}
  }
  return { default: MockOpenAI };
});

// Import after mocks are set up
import { createProvider } from "../factory";

describe("Provider Factory Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: anthropic-ai-migration, Property 6: Multi-provider streaming support**
   * **Validates: Requirements 6.6**
   *
   * For any BYOK provider (Anthropic, OpenAI, OpenRouter), the system SHALL
   * support streaming responses using that provider's streaming API.
   */
  describe("Property 6: Multi-provider streaming support", () => {
    // Arbitrary for provider types that support streaming
    const providerArb = fc.constantFrom(
      "anthropic" as const,
      "openai" as const,
      "openrouter" as const
    );

    // Arbitrary for valid API keys
    const apiKeyArb = fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/);

    // Arbitrary for model IDs
    const modelIdArb = fc.constantFrom(
      "claude-sonnet-4-20250514",
      "gpt-4o",
      "gpt-4o-mini",
      "anthropic/claude-3.5-sonnet"
    );

    // Arbitrary for message content
    const messageContentArb = fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/);

    // Arbitrary for response chunks
    const responseChunksArb = fc.array(
      fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
      { minLength: 1, maxLength: 5 }
    );

    // Arbitrary for token usage
    const tokenUsageArb = fc.record({
      input_tokens: fc.integer({ min: 1, max: 10000 }),
      output_tokens: fc.integer({ min: 1, max: 10000 }),
    });

    it.each(
      fc.sample(
        fc.record({
          provider: providerArb,
          apiKey: apiKeyArb,
          modelId: modelIdArb,
          userMessage: messageContentArb,
          responseChunks: responseChunksArb,
          usage: tokenUsageArb,
        }),
        100
      )
    )(
      "provider %j supports streaming via streamChat method",
      async ({ provider, apiKey, modelId, userMessage, responseChunks, usage }) => {
        // Set up mocks based on provider type
        if (provider === "anthropic") {
          const mockStreamObj = {
            on: vi.fn((event: string, handler: (text: string) => void) => {
              if (event === "text") {
                responseChunks.forEach((chunk) => handler(chunk));
              }
              return mockStreamObj;
            }),
            finalMessage: vi.fn().mockResolvedValue({
              usage: {
                input_tokens: usage.input_tokens,
                output_tokens: usage.output_tokens,
              },
            }),
          };
          mockAnthropicStream.mockReturnValue(mockStreamObj);
        } else {
          // OpenAI and OpenRouter use the same mock
          const mockAsyncIterator = {
            async *[Symbol.asyncIterator]() {
              for (const chunk of responseChunks) {
                yield {
                  choices: [{ delta: { content: chunk } }],
                  usage: null,
                };
              }
              // Final chunk with usage
              yield {
                choices: [{ delta: {} }],
                usage: {
                  prompt_tokens: usage.input_tokens,
                  completion_tokens: usage.output_tokens,
                },
              };
            },
          };
          mockOpenAICreate.mockResolvedValue(mockAsyncIterator);
        }

        const config: ProviderConfig = {
          provider,
          apiKey,
          modelId,
          baseUrl: provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined,
        };

        // Property 1: createProvider returns a StreamingProviderAdapter
        const providerInstance = createProvider(config);
        expect(providerInstance).toBeDefined();

        // Property 2: Provider has streamChat method
        expect(typeof providerInstance.streamChat).toBe("function");

        // Track streaming results
        const accumulatedChunks: string[] = [];
        let completionCalled = false;
        let finalUsage: TokenUsage | null = null;
        let errorOccurred = false;

        const callbacks: StreamCallbacks = {
          onTextDelta: (text: string) => {
            accumulatedChunks.push(text);
          },
          onComplete: (tokenUsage: TokenUsage) => {
            completionCalled = true;
            finalUsage = tokenUsage;
          },
          onError: () => {
            errorOccurred = true;
          },
        };

        const request: ChatCompletionRequest = {
          messages: [{ role: "user", content: userMessage }],
          model: modelId,
        };

        // Property 3: streamChat can be called without throwing
        await providerInstance.streamChat(request, callbacks);

        // Property 4: Streaming completed successfully (no errors)
        expect(errorOccurred).toBe(false);

        // Property 5: onComplete was called
        expect(completionCalled).toBe(true);

        // Property 6: All chunks were delivered
        expect(accumulatedChunks.length).toBe(responseChunks.length);
        expect(accumulatedChunks).toEqual(responseChunks);

        // Property 7: Usage stats were provided
        expect(finalUsage).toEqual({
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
        });
      }
    );

    it("all supported providers implement StreamingProviderAdapter interface", () => {
      const providers: Array<ProviderConfig["provider"]> = ["anthropic", "openai", "openrouter"];

      for (const providerType of providers) {
        const config: ProviderConfig = {
          provider: providerType,
          apiKey: "test-api-key",
          modelId: "test-model",
          baseUrl: providerType === "openrouter" ? "https://openrouter.ai/api/v1" : undefined,
        };

        const provider = createProvider(config);

        // Verify StreamingProviderAdapter interface
        expect(typeof provider.chat).toBe("function");
        expect(typeof provider.streamChat).toBe("function");
        expect(typeof provider.validateKey).toBe("function");
      }
    });

    it("throws error for unsupported provider", () => {
      const config = {
        provider: "unsupported" as ProviderConfig["provider"],
        apiKey: "test-api-key",
        modelId: "test-model",
      };

      expect(() => createProvider(config)).toThrow("Unsupported provider: unsupported");
    });
  });
});
