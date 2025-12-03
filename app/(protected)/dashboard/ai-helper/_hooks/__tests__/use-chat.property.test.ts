/**
 * Property-based tests for useChat hook - Streaming Indicator
 *
 * These tests verify correctness properties for streaming indicator
 * functionality using fast-check for property-based testing.
 *
 * **Feature: anthropic-ai-migration, Property 8: Streaming indicator during generation**
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { Message, createAssistantMessage, generateId } from "../../_components/chat-state";

// Mock dependencies
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue({ balance: 1000 }),
  useQuery: () => null,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    study: {
      spendCoins: "spendCoins",
      refundCoins: "refundCoins",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

/**
 * SSE Event types matching the API route
 */
interface SSETextDelta {
  type: "text_delta";
  text: string;
}

interface SSEMessageStart {
  type: "message_start";
  model: string;
}

interface SSEMessageStop {
  type: "message_stop";
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  isBYOK: boolean;
  provider: string;
}

interface SSEError {
  type: "error";
  error: string;
  code?: number;
}

type SSEEvent = SSETextDelta | SSEMessageStart | SSEMessageStop | SSEError;

/**
 * Simulates the streaming state transitions that occur in useChat
 * This models the behavior without needing to render React components
 */
interface StreamingState {
  isLoading: boolean;
  isStreaming: boolean;
  messages: Message[];
  partialContent: string;
}

/**
 * Simulates processing an SSE event and updating state
 * This mirrors the logic in processSSEStream from use-chat.ts
 */
function processSSEEvent(
  state: StreamingState,
  event: SSEEvent,
  assistantMessageId: string
): StreamingState {
  switch (event.type) {
    case "message_start":
      return {
        ...state,
        isStreaming: true,
      };

    case "text_delta":
      const newContent = state.partialContent + event.text;
      return {
        ...state,
        partialContent: newContent,
        messages: state.messages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: newContent, isStreaming: true }
            : msg
        ),
      };

    case "message_stop":
      return {
        ...state,
        isLoading: false,
        isStreaming: false,
        messages: state.messages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        ),
      };

    case "error":
      return {
        ...state,
        isLoading: false,
        isStreaming: false,
        messages: state.messages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        ),
      };

    default:
      return state;
  }
}

describe("useChat - Streaming Indicator Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: anthropic-ai-migration, Property 8: Streaming indicator during generation**
   * **Validates: Requirements 4.2**
   *
   * For any active streaming response, the UI SHALL display both the
   * partial content and a streaming indicator simultaneously.
   */
  describe("Property 8: Streaming indicator during generation", () => {
    // Arbitrary for text chunks (simulating streaming deltas)
    const textChunkArb = fc.string({ minLength: 1, maxLength: 50 });

    // Arbitrary for a sequence of text chunks
    const textChunksArb = fc.array(textChunkArb, { minLength: 1, maxLength: 20 });

    // Arbitrary for model IDs
    const modelIdArb = fc.constantFrom(
      "claude-sonnet-4-20250514",
      "gpt-4o",
      "claude-3-5-haiku-20241022"
    );

    // Arbitrary for token usage
    const tokenUsageArb = fc.record({
      input_tokens: fc.integer({ min: 1, max: 10000 }),
      output_tokens: fc.integer({ min: 1, max: 10000 }),
    });

    // Arbitrary for BYOK flag
    const isBYOKArb = fc.boolean();

    // Arbitrary for provider
    const providerArb = fc.constantFrom("anthropic", "openai", "openrouter");

    it.each(
      fc.sample(
        fc.record({
          textChunks: textChunksArb,
          modelId: modelIdArb,
          usage: tokenUsageArb,
          isBYOK: isBYOKArb,
          provider: providerArb,
        }),
        100
      )
    )(
      "streaming state shows indicator alongside partial content for %j",
      ({ textChunks, modelId, usage, isBYOK, provider }) => {
        const assistantMessageId = generateId();

        // Initial state: loading started, streaming message created
        let state: StreamingState = {
          isLoading: true,
          isStreaming: false,
          partialContent: "",
          messages: [
            {
              id: assistantMessageId,
              role: "assistant",
              content: "",
              timestamp: Date.now(),
              isStreaming: true,
            },
          ],
        };

        // Process message_start event
        const startEvent: SSEMessageStart = {
          type: "message_start",
          model: modelId,
        };
        state = processSSEEvent(state, startEvent, assistantMessageId);

        // Property 1: After message_start, isStreaming should be true
        expect(state.isStreaming).toBe(true);

        // Process each text_delta event
        let expectedContent = "";
        for (const chunk of textChunks) {
          const deltaEvent: SSETextDelta = {
            type: "text_delta",
            text: chunk,
          };
          state = processSSEEvent(state, deltaEvent, assistantMessageId);
          expectedContent += chunk;

          // Property 2: During streaming, isStreaming should remain true
          expect(state.isStreaming).toBe(true);

          // Property 3: Partial content should accumulate correctly
          expect(state.partialContent).toBe(expectedContent);

          // Property 4: The streaming message should have isStreaming=true
          const streamingMessage = state.messages.find(
            (m) => m.id === assistantMessageId
          );
          expect(streamingMessage).toBeDefined();
          expect(streamingMessage?.isStreaming).toBe(true);

          // Property 5: The streaming message content should match accumulated content
          expect(streamingMessage?.content).toBe(expectedContent);
        }

        // Process message_stop event
        const stopEvent: SSEMessageStop = {
          type: "message_stop",
          model: modelId,
          usage,
          isBYOK,
          provider,
        };
        state = processSSEEvent(state, stopEvent, assistantMessageId);

        // Property 6: After message_stop, isStreaming should be false
        expect(state.isStreaming).toBe(false);

        // Property 7: After message_stop, isLoading should be false
        expect(state.isLoading).toBe(false);

        // Property 8: The message should no longer have isStreaming=true
        const finalMessage = state.messages.find(
          (m) => m.id === assistantMessageId
        );
        expect(finalMessage?.isStreaming).toBe(false);

        // Property 9: Final content should be preserved
        expect(finalMessage?.content).toBe(expectedContent);
      }
    );

    it.each(
      fc.sample(
        fc.record({
          textChunks: textChunksArb,
          modelId: modelIdArb,
          errorMessage: fc.string({ minLength: 5, maxLength: 100 }),
        }),
        100
      )
    )(
      "streaming indicator is removed on error while preserving partial content for %j",
      ({ textChunks, modelId, errorMessage }) => {
        const assistantMessageId = generateId();

        // Initial state
        let state: StreamingState = {
          isLoading: true,
          isStreaming: false,
          partialContent: "",
          messages: [
            {
              id: assistantMessageId,
              role: "assistant",
              content: "",
              timestamp: Date.now(),
              isStreaming: true,
            },
          ],
        };

        // Process message_start
        state = processSSEEvent(
          state,
          { type: "message_start", model: modelId },
          assistantMessageId
        );

        // Process some text deltas (partial content)
        let expectedContent = "";
        const partialChunks = textChunks.slice(0, Math.ceil(textChunks.length / 2));
        for (const chunk of partialChunks) {
          state = processSSEEvent(
            state,
            { type: "text_delta", text: chunk },
            assistantMessageId
          );
          expectedContent += chunk;
        }

        // Verify streaming state before error
        expect(state.isStreaming).toBe(true);
        expect(state.partialContent).toBe(expectedContent);

        // Process error event
        const errorEvent: SSEError = {
          type: "error",
          error: errorMessage,
          code: 500,
        };
        state = processSSEEvent(state, errorEvent, assistantMessageId);

        // Property 1: After error, isStreaming should be false
        expect(state.isStreaming).toBe(false);

        // Property 2: After error, isLoading should be false
        expect(state.isLoading).toBe(false);

        // Property 3: The message should no longer have isStreaming=true
        const erroredMessage = state.messages.find(
          (m) => m.id === assistantMessageId
        );
        expect(erroredMessage?.isStreaming).toBe(false);

        // Property 4: Partial content should be preserved (Requirements 5.4)
        expect(erroredMessage?.content).toBe(expectedContent);
      }
    );

    it("empty streaming response handles correctly", () => {
      const assistantMessageId = generateId();

      let state: StreamingState = {
        isLoading: true,
        isStreaming: false,
        partialContent: "",
        messages: [
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            isStreaming: true,
          },
        ],
      };

      // Process message_start
      state = processSSEEvent(
        state,
        { type: "message_start", model: "claude-sonnet-4-20250514" },
        assistantMessageId
      );

      expect(state.isStreaming).toBe(true);

      // Process message_stop immediately (no content)
      state = processSSEEvent(
        state,
        {
          type: "message_stop",
          model: "claude-sonnet-4-20250514",
          usage: { input_tokens: 10, output_tokens: 0 },
          isBYOK: false,
          provider: "anthropic",
        },
        assistantMessageId
      );

      // Property: Empty response should still complete correctly
      expect(state.isStreaming).toBe(false);
      expect(state.isLoading).toBe(false);

      const message = state.messages.find((m) => m.id === assistantMessageId);
      expect(message?.isStreaming).toBe(false);
      expect(message?.content).toBe("");
    });
  });
});
