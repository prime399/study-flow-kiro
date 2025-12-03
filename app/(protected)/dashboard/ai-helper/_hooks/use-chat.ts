/**
 * Custom hook for chat functionality with SSE streaming support
 * Manages chat state, API communication, and user interactions
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Message,
  saveMessagesToStorage,
  loadMessagesFromStorage,
  clearMessagesFromStorage,
  createUserMessage,
  createAssistantMessage,
  generateId,
} from "../_components/chat-state"
import {
  AUTO_MODEL_ID,
  DEFAULT_FALLBACK_MODEL_ID,
  DEFAULT_MCP_TOOL,
  MCP_TOOLS,
  type McpToolId,
} from "../_constants"

interface UseChatProps {
  studyStats: any
  groupInfo: any
  userName?: string
}

type ModelPreference = string

type AvailableModelsResponse = {
  models?: { id: string }[]
}

/**
 * SSE Event types matching the API route
 * Requirements: 1.1 - Streaming response handling
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
}

type SSEEvent = SSETextDelta | SSEMessageStart | SSEMessageStop | SSEError


const COINS_PER_AI_MESSAGE = 100
const COIN_SHORTAGE_MESSAGE =
  "The spirits require 100 coins to commune with The Librarian Ghost. Begin a study session to earn more coins (every second of study adds 1 coin to your spectral treasury)."

const MCP_TOOL_STORAGE_KEY = "preferredMcpTool"

/**
 * Parses SSE event data from a line
 * Requirements: 1.1 - Parse SSE events
 */
function parseSSEEvent(eventType: string, data: string): SSEEvent | null {
  try {
    const parsed = JSON.parse(data)
    return parsed as SSEEvent
  } catch (e) {
    console.error("Failed to parse SSE event:", e)
    return null
  }
}

export function useChat({ studyStats, groupInfo, userName }: UseChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingCoinsRef = useRef(0)

  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  /**
   * Streaming state separate from loading state
   * Requirements: 4.1, 4.2, 4.3 - Streaming indicator management
   */
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /**
   * Partial content preserved from a failed streaming response
   * Requirements: 5.4 - Preserve partial response on error
   */
  const [partialContent, setPartialContent] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [selectedModelState, setSelectedModelState] = useState<ModelPreference>(AUTO_MODEL_ID)
  const [selectedMcpToolState, setSelectedMcpToolState] = useState<McpToolId>(DEFAULT_MCP_TOOL)
  const [resolvedModel, setResolvedModel] = useState<string>(DEFAULT_FALLBACK_MODEL_ID)
  const [coinBalance, setCoinBalance] = useState<number>(
    typeof studyStats?.coinsBalance === "number" ? studyStats.coinsBalance : 0,
  )

  const spendCoins = useMutation(api.study.spendCoins)
  const refundCoins = useMutation(api.study.refundCoins)

  const applyModelPreference = useCallback((modelId: string, fallbackResolved?: string) => {
    setSelectedModelState(modelId)
    if (modelId === AUTO_MODEL_ID) {
      setResolvedModel(fallbackResolved ?? DEFAULT_FALLBACK_MODEL_ID)
    } else {
      setResolvedModel(modelId)
    }
  }, [])

  // Load messages and model preference from localStorage on mount
  useEffect(() => {
    const savedMessages = loadMessagesFromStorage()
    if (savedMessages.length > 0) {
      setMessages(savedMessages)
    }

    const savedPreference = localStorage.getItem("preferredModel") ?? AUTO_MODEL_ID

    const savedMcpTool = localStorage.getItem(MCP_TOOL_STORAGE_KEY)
    if (savedMcpTool && MCP_TOOLS.some(tool => tool.id === savedMcpTool)) {
      setSelectedMcpToolState(savedMcpTool as McpToolId)
    }

    fetch("/api/ai-helper/models")
      .then(res => res.json() as Promise<AvailableModelsResponse>)
      .then(data => {
        const availableModels = Array.isArray(data.models) ? data.models : []
        const firstAvailable = availableModels[0]?.id ?? DEFAULT_FALLBACK_MODEL_ID

        if (
          savedPreference !== AUTO_MODEL_ID &&
          availableModels.some(model => model.id === savedPreference)
        ) {
          applyModelPreference(savedPreference)
        } else {
          applyModelPreference(AUTO_MODEL_ID, firstAvailable)
          localStorage.setItem("preferredModel", AUTO_MODEL_ID)
        }
      })
      .catch(err => {
        console.warn("Failed to validate model availability:", err)
        const fallbackResolved = savedPreference === AUTO_MODEL_ID ? DEFAULT_FALLBACK_MODEL_ID : undefined
        applyModelPreference(savedPreference, fallbackResolved)
      })
  }, [applyModelPreference])

  // Sync coin balance whenever stats change (and no pending deductions)
  useEffect(() => {
    if (typeof studyStats?.coinsBalance === "number" && pendingCoinsRef.current === 0) {
      setCoinBalance(studyStats.coinsBalance)
    }
  }, [studyStats?.coinsBalance])

  // Save model preference to localStorage
  useEffect(() => {
    localStorage.setItem("preferredModel", selectedModelState)
  }, [selectedModelState])

  // Save MCP tool preference to localStorage
  useEffect(() => {
    localStorage.setItem(MCP_TOOL_STORAGE_KEY, selectedMcpToolState)
  }, [selectedMcpToolState])

  // Save messages to localStorage
  useEffect(() => {
    saveMessagesToStorage(messages)
  }, [messages])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])


  /**
   * Processes SSE stream from the API
   * Requirements: 1.1, 1.2, 1.3 - Stream handling and incremental updates
   */
  const processSSEStream = useCallback(async (
    response: Response,
    assistantMessageId: string,
    controller: AbortController
  ): Promise<{ isBYOK: boolean; provider: string } | null> => {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const decoder = new TextDecoder()
    let buffer = ""
    let accumulatedContent = ""
    let result: { isBYOK: boolean; provider: string } | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        if (controller.signal.aborted) break

        buffer += decoder.decode(value, { stream: true })
        
        // Process complete SSE events from buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        let currentEventType = ""
        
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim()
          } else if (line.startsWith("data: ") && currentEventType) {
            const data = line.slice(6)
            const event = parseSSEEvent(currentEventType, data)
            
            if (event) {
              switch (event.type) {
                case "message_start":
                  // Update resolved model from stream
                  setResolvedModel(event.model)
                  break

                case "text_delta":
                  // Accumulate content and update message incrementally
                  // Requirements: 1.2 - Display partial response content
                  accumulatedContent += event.text
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent, isStreaming: true }
                      : msg
                  ))
                  break

                case "message_stop":
                  // Stream completed successfully
                  // Requirements: 1.3 - Finalize message on completion
                  result = { isBYOK: event.isBYOK, provider: event.provider }
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent, isStreaming: false }
                      : msg
                  ))
                  break

                case "error":
                  // Handle streaming error
                  // Requirements: 1.4 - Display error and allow retry
                  throw new Error(event.error)
              }
            }
            currentEventType = ""
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return result
  }, [])

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || isStreaming) return

    if (coinBalance < COINS_PER_AI_MESSAGE) {
      setError(COIN_SHORTAGE_MESSAGE)
      toast.error("Not enough coins", {
        description: "Start a study session to earn coins. Every second of focused study gives you 1 coin.",
      })
      return
    }

    // Requirements: 4.1 - Display loading indicator immediately
    setIsLoading(true)
    setError(null)

    const controller = new AbortController()
    setAbortController(controller)

    // Generate ID for the assistant message upfront for streaming updates
    const assistantMessageId = generateId()

    try {
      const spendResult = await spendCoins({ amount: COINS_PER_AI_MESSAGE, reason: "ai-helper" })
      pendingCoinsRef.current = COINS_PER_AI_MESSAGE
      setCoinBalance(spendResult.balance)

      const userMessage = createUserMessage(messageContent)
      
      // Create placeholder assistant message for streaming
      // Requirements: 4.2 - Show streaming indicator alongside content
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      }
      
      setMessages(prev => [...prev, userMessage, assistantMessage])
      setInput("")
      
      // Start streaming
      // Requirements: 4.2 - isStreaming state during generation
      setIsStreaming(true)

      const response = await fetch("/api/ai-helper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          studyStats,
          groupInfo,
          userName,
          modelId: selectedModelState,
          mcpToolId: selectedMcpToolState !== DEFAULT_MCP_TOOL ? selectedMcpToolState : undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Process SSE stream
      // Requirements: 1.1, 1.2 - Stream tokens and update incrementally
      const streamResult = await processSSEStream(response, assistantMessageId, controller)

      // Handle BYOK coin refund
      // Requirements: 6.4 - BYOK coin exemption
      if (streamResult?.isBYOK && pendingCoinsRef.current > 0) {
        try {
          const refundResult = await refundCoins({
            amount: pendingCoinsRef.current,
            reason: "byok-refund"
          })
          setCoinBalance(refundResult.balance)
          pendingCoinsRef.current = 0

          toast.success("BYOK used - coins refunded!", {
            description: `Using your ${streamResult.provider} API key. No coins charged.`,
          })
        } catch (refundError) {
          console.error("Failed to refund coins for BYOK:", refundError)
        }
      } else {
        // Platform keys used - coins were spent
        pendingCoinsRef.current = 0
      }
    } catch (err: any) {
      // Refund coins on error
      if (pendingCoinsRef.current > 0) {
        try {
          const refundResult = await refundCoins({ amount: pendingCoinsRef.current, reason: "ai-helper-refund" })
          setCoinBalance(refundResult.balance)
        } catch (refundError) {
          console.error("Failed to refund coins after error:", refundError)
        } finally {
          pendingCoinsRef.current = 0
        }
      }

      // Remove the streaming assistant message on error, but preserve partial content
      // Requirements: 5.4 - Preserve partial response on error
      let preservedContent: string | null = null
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg?.id === assistantMessageId) {
          if (lastMsg.content) {
            // Preserve partial content for display in error UI
            preservedContent = lastMsg.content
            // Keep partial content in messages but mark as not streaming
            return prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          } else {
            // Remove empty assistant message
            return prev.slice(0, -1)
          }
        }
        return prev
      })
      
      // Store partial content for error display
      // Requirements: 5.4 - Preserve partial response on error
      setPartialContent(preservedContent)

      if (err?.message === "INSUFFICIENT_COINS") {
        setError(COIN_SHORTAGE_MESSAGE)
        toast.error("Not enough coins", {
          description: "Start a study session to earn coins. Every second of focused study gives you 1 coin.",
        })
      } else if (err?.name === "AbortError") {
        toast.info("Request cancelled")
        // Clear partial content on user-initiated abort
        setPartialContent(null)
      } else {
        console.error("Error sending message:", err)
        setError(err?.message ?? "Something went wrong.")
        toast.error("Failed to get response", {
          description: err?.message ?? "Please try again.",
        })
      }
    } finally {
      // Requirements: 4.3 - Remove loading indicator on completion
      setIsLoading(false)
      setIsStreaming(false)
      setAbortController(null)
    }
  }, [coinBalance, groupInfo, isLoading, isStreaming, messages, processSSEStream, refundCoins, selectedModelState, selectedMcpToolState, spendCoins, studyStats, userName])


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  const append = useCallback((message: { role: "user"; content: string }) => {
    sendMessage(message.content)
  }, [sendMessage])

  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
      setIsStreaming(false)
      toast.info("Request stopped")
    }
  }, [abortController])

  const reload = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user")
      if (lastUserMessage) {
        // Remove the last assistant message if it exists
        const lastMessageIndex = messages.length - 1
        if (messages[lastMessageIndex]?.role === "assistant") {
          setMessages(prev => prev.slice(0, -1))
        }
        sendMessage(lastUserMessage.content)
      }
    }
  }, [messages, sendMessage])

  const clearChat = useCallback(() => {
    setMessages([])
    clearMessagesFromStorage()
    setError(null)
    toast.success("Chat history cleared")
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setPartialContent(null)
  }, [])

  const setSelectedModel = useCallback((modelId: string) => {
    applyModelPreference(modelId)
  }, [applyModelPreference])

  const setSelectedMcpTool = useCallback((toolId: McpToolId) => {
    setSelectedMcpToolState(toolId)
  }, [])

  return {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    error,
    /** Partial content preserved from a failed streaming response - Requirements: 5.4 */
    partialContent,
    messagesEndRef,
    selectedModel: selectedModelState,
    resolvedModel,
    coinBalance,
    coinsRequired: COINS_PER_AI_MESSAGE,
    selectedMcpTool: selectedMcpToolState,
    setSelectedModel,
    setSelectedMcpTool,
    handleSubmit,
    append,
    stop,
    reload,
    clearChat,
    clearError,
  }
}
