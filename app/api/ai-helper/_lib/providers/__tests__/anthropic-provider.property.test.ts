/**
 * Property-based tests for Anthropic Provider
 *
 * These tests verify correctness properties for the Anthropic provider
 * using fast-check for property-based testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  ChatCompletionRequest,
  StreamCallbacks,
  TokenUsage,
} from "../types";

// Create mock functions that we can control
const mockStream = vi.fn();
const mockCreate = vi.fn();

// Mock the Anthropic SDK with a proper class constructor
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: mockCreate,
      stream: mockStream,
    };
    constructor() {}
  }
  return { default: MockAnthropic };
});

// Import after mocks are set up
import { AnthropicProvider, DEFAULT_MAX_TOKENS } from "../anthropic-provider";

describe("AnthropicProvider Property Tests", () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider({
      provider: "anthropic",
      apiKey: "test-api-key",
      modelId: "claude-sonnet-4-20250514",
    });
  });

  /**
   * **Feature: anthropic-ai-migration, Property 1: Streaming delivers incremental content**
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any valid chat message, the streaming response SHALL deliver content
   * in multiple chunks where each chunk appends to the previous content,
   * and the final concatenated content equals the complete response.
   */
  describe("Property 1: Streaming delivers incremental content", () => {
    // Arbitrary for generating valid message content (alphanumeric to avoid special chars)
    const messageContentArb = fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/);

    // Arbitrary for generating response chunks (simulating streaming)
    const responseChunksArb = fc.array(
      fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
      { minLength: 1, maxLength: 10 }
    );

    // Arbitrary for token usage
    const tokenUsageArb = fc.record({
      input_tokens: fc.integer({ min: 1, max: 10000 }),
      output_tokens: fc.integer({ min: 1, max: 10000 }),
    });

    it.each(
      fc.sample(
        fc.record({
          userMessage: messageContentArb,
          responseChunks: responseChunksArb,
          usage: tokenUsageArb,
        }),
        100
      )
    )(
      "streaming accumulates content correctly for input %j",
      async ({ userMessage, responseChunks, usage }) => {
        // Track accumulated content from streaming
        const accumulatedChunks: string[] = [];
        let completionCalled = false;
        let finalUsage: TokenUsage | null = null;

        const callbacks: StreamCallbacks = {
          onTextDelta: (text: string) => {
            accumulatedChunks.push(text);
          },
          onComplete: (tokenUsage: TokenUsage) => {
            completionCalled = true;
            finalUsage = tokenUsage;
          },
          onError: (error: Error) => {
            throw error;
          },
        };

        // Create a mock stream object that emits chunks
        const mockStreamObj = {
          on: vi.fn((event: string, handler: (text: string) => void) => {
            if (event === "text") {
              // Emit each chunk
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

        // Set up the mock to return our stream object
        mockStream.mockReturnValue(mockStreamObj);

        const request: ChatCompletionRequest = {
          messages: [{ role: "user", content: userMessage }],
          model: "claude-sonnet-4-20250514",
        };

        await provider.streamChat(request, callbacks);

        // Property 1: All chunks were delivered
        expect(accumulatedChunks.length).toBe(responseChunks.length);

        // Property 2: Chunks match the expected content
        expect(accumulatedChunks).toEqual(responseChunks);

        // Property 3: Final concatenated content equals complete response
        const finalContent = accumulatedChunks.join("");
        const expectedContent = responseChunks.join("");
        expect(finalContent).toBe(expectedContent);

        // Property 4: onComplete was called with usage stats
        expect(completionCalled).toBe(true);
        expect(finalUsage).toEqual({
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
        });
      }
    );

    it("handles empty response gracefully", async () => {
      const accumulatedChunks: string[] = [];
      let completionCalled = false;

      const callbacks: StreamCallbacks = {
        onTextDelta: (text: string) => {
          accumulatedChunks.push(text);
        },
        onComplete: () => {
          completionCalled = true;
        },
        onError: (error: Error) => {
          throw error;
        },
      };

      const mockStreamObj = {
        on: vi.fn().mockReturnThis(),
        finalMessage: vi.fn().mockResolvedValue({
          usage: { input_tokens: 10, output_tokens: 0 },
        }),
      };

      mockStream.mockReturnValue(mockStreamObj);

      const request: ChatCompletionRequest = {
        messages: [{ role: "user", content: "test" }],
        model: "claude-sonnet-4-20250514",
      };

      await provider.streamChat(request, callbacks);

      // Empty response should still complete successfully
      expect(accumulatedChunks.length).toBe(0);
      expect(completionCalled).toBe(true);
    });
  });

  /**
   * **Feature: anthropic-ai-migration, Property 2: Max tokens configuration is respected**
   * **Validates: Requirements 2.4**
   *
   * For any max_tokens configuration value, the Anthropic API request SHALL
   * include that value, and the default SHALL be 4096 when not specified.
   */
  describe("Property 2: Max tokens configuration is respected", () => {
    // Arbitrary for valid max_tokens values
    const maxTokensArb = fc.integer({ min: 1, max: 100000 });

    it.each(
      fc.sample(
        fc.record({
          maxTokens: maxTokensArb,
          userMessage: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
        }),
        100
      )
    )(
      "max_tokens is passed correctly to API for config %j",
      async ({ maxTokens, userMessage }) => {
        const mockStreamObj = {
          on: vi.fn().mockReturnThis(),
          finalMessage: vi.fn().mockResolvedValue({
            usage: { input_tokens: 10, output_tokens: 10 },
          }),
        };

        mockStream.mockReturnValue(mockStreamObj);

        const callbacks: StreamCallbacks = {
          onTextDelta: () => {},
          onComplete: () => {},
          onError: (error: Error) => {
            throw error;
          },
        };

        const request: ChatCompletionRequest = {
          messages: [{ role: "user", content: userMessage }],
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
        };

        await provider.streamChat(request, callbacks);

        // Verify max_tokens was passed to the API
        expect(mockStream).toHaveBeenCalledWith(
          expect.objectContaining({
            max_tokens: maxTokens,
          })
        );
      }
    );

    it("uses default max_tokens (4096) when not specified", async () => {
      const mockStreamObj = {
        on: vi.fn().mockReturnThis(),
        finalMessage: vi.fn().mockResolvedValue({
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
      };

      mockStream.mockReturnValue(mockStreamObj);

      const callbacks: StreamCallbacks = {
        onTextDelta: () => {},
        onComplete: () => {},
        onError: (error: Error) => {
          throw error;
        },
      };

      const request: ChatCompletionRequest = {
        messages: [{ role: "user", content: "test" }],
        model: "claude-sonnet-4-20250514",
        // max_tokens not specified
      };

      await provider.streamChat(request, callbacks);

      // Verify default max_tokens was used
      expect(mockStream).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: DEFAULT_MAX_TOKENS,
        })
      );
      expect(DEFAULT_MAX_TOKENS).toBe(4096);
    });
  });
});
