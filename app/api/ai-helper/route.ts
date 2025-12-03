import { AIRequestBody } from "@/lib/types"
import { cookies } from "next/headers"

import { buildSystemPrompt } from "./_lib/system-prompt"
import { sanitizeMessages } from "./_lib/message-sanitizer"
import { resolveModelRouting } from "./_lib/model-router"
import { getAIConfig, isBYOKConfig, recordBYOKUsage } from "./_lib/byok-helper"
import { createProvider } from "./_lib/providers/factory"
import { ProviderConfig, ChatMessage, StreamCallbacks, APIError } from "./_lib/providers/types"
import { DEFAULT_MAX_TOKENS } from "./_lib/providers/anthropic-provider"

/**
 * Default model for Anthropic API
 * Requirements: 2.1 - Use Claude Sonnet 4.5 as default
 */
const DEFAULT_MODEL = "claude-sonnet-4-20250514"

/**
 * SSE Event types for streaming responses
 * Requirements: 1.1, 1.3, 1.4
 */
interface SSETextDelta {
  type: "text_delta"
  text: string
}

interface SSEMessageStart {
  type: "message_start"
  model: string
}

interface SSEMessageStop {
  type: "message_stop"
  model: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
  isBYOK: boolean
  provider: string
}

interface SSEError {
  type: "error"
  error: string
  code?: number
  isRetryable?: boolean
}

type SSEEvent = SSETextDelta | SSEMessageStart | SSEMessageStop | SSEError

/**
 * Formats an SSE event for transmission
 */
function formatSSEEvent(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

/**
 * Maps API errors to user-friendly messages
 * Requirements: 5.1, 5.2, 5.3 - Error handling for 401, 429, 503
 */
function mapErrorToUserMessage(error: Error, statusCode?: number): { message: string; code: number; isRetryable: boolean } {
  // If it's an APIError from our providers, use its properties directly
  if (error instanceof APIError) {
    return {
      message: error.message,
      code: error.statusCode,
      isRetryable: error.isRetryable
    }
  }

  const errorMessage = error.message.toLowerCase()

  // 401 - Invalid/missing API key
  // Requirements: 5.2 - Handle invalid/missing API key
  if (statusCode === 401 || errorMessage.includes("unauthorized") || errorMessage.includes("invalid api key") || errorMessage.includes("authentication")) {
    return {
      message: "API key is invalid or missing. Please check your configuration.",
      code: 401,
      isRetryable: false
    }
  }

  // 429 - Rate limiting
  // Requirements: 5.3 - Handle rate limiting
  if (statusCode === 429 || errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return {
      message: "Too many requests. Please wait a moment and try again.",
      code: 429,
      isRetryable: true
    }
  }

  // 503 - Service unavailable
  // Requirements: 5.1 - Handle service unavailability
  if (statusCode === 503 || errorMessage.includes("service unavailable") || errorMessage.includes("overloaded")) {
    return {
      message: "The AI service is temporarily unavailable. Please try again.",
      code: 503,
      isRetryable: true
    }
  }

  // 400 - Bad request
  if (statusCode === 400 || errorMessage.includes("bad request") || errorMessage.includes("invalid request")) {
    return {
      message: "Unable to process your request. Please try rephrasing.",
      code: 400,
      isRetryable: true
    }
  }

  // Default error
  return {
    message: "An error occurred while processing your request. Please try again.",
    code: 500,
    isRetryable: true
  }
}


/**
 * Creates a streaming response using Server-Sent Events
 * Requirements: 1.1, 1.3, 1.4 - Streaming responses
 */
function createStreamingResponse(
  provider: ReturnType<typeof createProvider>,
  messages: ChatMessage[],
  modelId: string,
  isBYOK: boolean,
  providerName: string,
  onComplete?: () => Promise<void>
): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send message_start event
        const startEvent: SSEMessageStart = {
          type: "message_start",
          model: modelId
        }
        controller.enqueue(encoder.encode(formatSSEEvent(startEvent)))

        let finalUsage = { input_tokens: 0, output_tokens: 0 }

        const callbacks: StreamCallbacks = {
          onTextDelta: (text: string) => {
            const deltaEvent: SSETextDelta = {
              type: "text_delta",
              text
            }
            controller.enqueue(encoder.encode(formatSSEEvent(deltaEvent)))
          },
          onComplete: (usage) => {
            finalUsage = usage
          },
          onError: (error: Error) => {
            const { message, code, isRetryable } = mapErrorToUserMessage(error)
            const errorEvent: SSEError = {
              type: "error",
              error: message,
              code,
              isRetryable
            }
            controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)))
            controller.close()
          }
        }

        // Start streaming
        await provider.streamChat(
          {
            messages,
            model: modelId,
            max_tokens: DEFAULT_MAX_TOKENS,
            temperature: 0.7
          },
          callbacks
        )

        // Send message_stop event with usage and BYOK info
        // Requirements: 6.4, 6.5 - BYOK indication
        const stopEvent: SSEMessageStop = {
          type: "message_stop",
          model: modelId,
          usage: finalUsage,
          isBYOK,
          provider: providerName
        }
        controller.enqueue(encoder.encode(formatSSEEvent(stopEvent)))

        // Execute completion callback (e.g., record BYOK usage)
        if (onComplete) {
          await onComplete()
        }

        controller.close()
      } catch (error) {
        console.error("[AI Helper] Streaming error:", error)
        const err = error instanceof Error ? error : new Error("Unknown error")
        const { message, code, isRetryable } = mapErrorToUserMessage(err)
        const errorEvent: SSEError = {
          type: "error",
          error: message,
          code,
          isRetryable
        }
        controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  })
}


/**
 * POST handler for AI helper API
 * Refactored to use direct Anthropic API with SSE streaming
 * Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 3.4
 */
export async function POST(req: Request) {
  try {
    // Extract Convex auth token from cookies
    const cookieStore = await cookies()
    const isLocalhost = req.headers.get("host")?.includes("localhost")
    const cookieName = isLocalhost ? "__convexAuthJWT" : "__Host-__convexAuthJWT"
    const convexAuthToken = cookieStore.get(cookieName)?.value

    // Parse request body
    const { messages, userName, studyStats, groupInfo, modelId }: AIRequestBody & { modelId?: string } =
      await req.json()

    // Resolve model routing
    const routingDecision = resolveModelRouting({
      messages,
      studyStats,
      modelId
    })

    // Get AI configuration (BYOK or platform)
    // Requirements: 6.1, 6.2, 6.3 - BYOK provider selection
    const aiConfig = await getAIConfig(
      convexAuthToken,
      process.env.NEXT_PUBLIC_CONVEX_URL!,
      routingDecision.resolvedModelId,
      () => {
        // Platform config fallback - use Anthropic as default
        // Requirements: 2.1, 2.2 - Use Anthropic as default provider
        // Support both ANTHROPIC_API_KEY and ANTHROPIC_INFERENCE_KEY for backwards compatibility
        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_INFERENCE_KEY
        if (!apiKey) {
          throw new Error("ANTHROPIC_API_KEY is not configured. Please set ANTHROPIC_API_KEY in your environment.")
        }
        return {
          herokuBaseUrl: "", // Not used for Anthropic
          herokuApiKey: apiKey,
          herokuModelId: DEFAULT_MODEL,
          isBYOK: false as const
        }
      }
    )

    // Determine provider configuration
    let providerConfig: ProviderConfig
    let isBYOK: boolean
    let providerName: string

    if (isBYOKConfig(aiConfig)) {
      // BYOK configuration
      // Requirements: 6.1, 6.2, 6.3 - Use user's API key
      console.log(`[BYOK] Using user's ${aiConfig.provider} key (model: ${aiConfig.modelId})`)
      console.log("[BYOK] No coins will be charged for this query")

      providerConfig = {
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        baseUrl: aiConfig.baseUrl,
        modelId: aiConfig.modelId
      }
      isBYOK = true
      providerName = aiConfig.provider
    } else {
      // Platform configuration - use Anthropic
      // Requirements: 2.1, 3.1 - Use Anthropic without Heroku
      console.log(`[Platform] Using Anthropic (model: ${aiConfig.herokuModelId})`)

      providerConfig = {
        provider: "anthropic",
        apiKey: aiConfig.herokuApiKey,
        modelId: aiConfig.herokuModelId
      }
      isBYOK = false
      providerName = "anthropic"
    }

    // Create provider adapter
    // Requirements: 6.6 - Multi-provider streaming support
    const provider = createProvider(providerConfig)

    // Build system prompt (simplified - no MCP tool instructions)
    // Requirements: 3.2, 3.3, 3.4 - Remove MCP dependencies
    const systemPrompt = buildSystemPrompt({ userName, studyStats, groupInfo })

    // Prepare chat messages
    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...sanitizeMessages(messages).map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
      }))
    ]

    // Create completion callback for BYOK usage recording
    // Requirements: 6.4 - BYOK coin exemption (no coins charged)
    const onComplete = async () => {
      if (isBYOK && convexAuthToken) {
        await recordBYOKUsage(
          convexAuthToken,
          process.env.NEXT_PUBLIC_CONVEX_URL!,
          providerName
        )
      }
    }

    // Return streaming response
    // Requirements: 1.1, 1.2, 1.3 - SSE streaming
    return createStreamingResponse(
      provider,
      chatMessages,
      providerConfig.modelId,
      isBYOK,
      providerName,
      onComplete
    )
  } catch (error) {
    console.error("[AI Helper] Error:", error)

    const err = error instanceof Error ? error : new Error("Unknown error")
    const { message, code } = mapErrorToUserMessage(err)

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: code,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
