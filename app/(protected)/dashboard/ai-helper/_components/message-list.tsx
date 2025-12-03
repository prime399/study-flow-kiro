"use client"
/**
 * Message list component for displaying chat messages
 * Handles rendering of user and assistant messages with proper styling
 * Requirements: 1.2, 4.2, 4.3 - Streaming message display
 */

import { AITable } from "@/components/ai-data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle, Bot, Loader2, RefreshCw, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { useEffect, useState } from "react"

import { formatMessageContent } from "./message-formatter"
import { markdownComponents } from "./markdown-components"
import type { Message } from "./chat-state"
import { formatErrorMessage, type StreamingError } from "./error-formatter"

const LOADING_MESSAGES = [
  "Flipping through my mental notes...",
  "Consulting the study guides...",
  "Brewing up some knowledge...",
  "Highlighting the key points...",
  "Searching my memory palace...",
  "Organizing my thoughts...",
  "Reviewing the material...",
  "Connecting the dots...",
  "Pulling an all-nighter for you...",
  "Cramming for this answer...",
  "Taking notes from the universe...",
  "Sharpening my pencils...",
  "Reading between the lines...",
  "Gathering study materials...",
  "Checking my flashcards...",
  "Synthesizing information...",
  "Pondering the possibilities...",
  "Brewing a cup of wisdom...",
  "Dusting off the textbooks...",
  "Calculating the perfect response...",
]

interface MessageListProps {
  messages: Message[]
  user?: { name?: string; image?: string }
  error?: string | null
  isLoading: boolean
  isStreaming?: boolean
  onRetry: () => void
  onClearError: () => void
  /** Partial content preserved from a failed streaming response */
  partialContent?: string
}

export function MessageList({ 
  messages, 
  user, 
  error, 
  isLoading,
  isStreaming = false,
  onRetry, 
  onClearError,
  partialContent
}: MessageListProps) {
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      // Reset to random message when loading starts next time
      setMessageIndex(Math.floor(Math.random() * LOADING_MESSAGES.length))
      return
    }

    // Start with a random message
    const initialIndex = Math.floor(Math.random() * LOADING_MESSAGES.length)
    setMessageIndex(initialIndex)
    setLoadingMessage(LOADING_MESSAGES[initialIndex])

    // Change message every 2 seconds while loading
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % LOADING_MESSAGES.length
        setLoadingMessage(LOADING_MESSAGES[next])
        return next
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoading])

  return (
    <div className="space-y-3 sm:space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-2 sm:gap-3 text-sm",
            message.role === "user" ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full shrink-0",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
            )}
          >
            {message.role === "user" ? (
              <Avatar className="size-7 sm:size-8">
                <AvatarImage src={user?.image} />
                <AvatarFallback>
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </div>
          <div
            className={cn(
              "flex flex-col gap-2 sm:gap-4 min-w-0 flex-1",
              message.role === "user" ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "w-full max-w-[calc(100vw-4rem)] sm:max-w-prose rounded-lg bg-muted px-3 sm:px-4 py-2 sm:py-3 overflow-hidden break-words",
              )}
            >
              <div className="markdown-body text-xs sm:text-sm overflow-wrap-anywhere">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {formatMessageContent(message.content)}
                </ReactMarkdown>
                {/* Streaming indicator alongside content - Requirements: 1.2, 4.2 */}
                {message.isStreaming && (
                  <span className="inline-flex items-center gap-1.5 ml-1 align-middle">
                    <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse rounded-sm" />
                    <span className="text-xs text-muted-foreground animate-pulse">
                      generating...
                    </span>
                  </span>
                )}
              </div>
              {/* Streaming status bar - Requirements: 4.2, 4.3 */}
              {message.isStreaming && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Streaming response...
                  </span>
                </div>
              )}
            </div>

            {message.role === "assistant" &&
              message.toolInvocations?.map((toolInvocation: any) => {
                const { toolName, toolCallId, state } = toolInvocation

                if (state === "result") {
                  if (toolName === "displayTable") {
                    const { result } = toolInvocation
                    return (
                      <div key={toolCallId} className="w-full">
                        <AITable {...result} />
                      </div>
                    )
                  }
                } else {
                  return (
                    <div
                      key={toolCallId}
                      className="rounded-lg bg-muted px-4 py-3"
                    >
                      <div className="flex flex-row items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating visualization...
                      </div>
                    </div>
                  )
                }
              })}
          </div>
        </div>
      ))}
      
      {/* Error display with user-friendly messages - Requirements: 1.4, 5.1, 5.4 */}
      {error && (
        <div className="flex gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-destructive/10 shrink-0">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
          </div>
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {/* Show partial content if available - Requirements: 5.4 */}
            {partialContent && (
              <div className="rounded-lg bg-muted px-3 sm:px-4 py-2 sm:py-3 mb-2">
                <div className="markdown-body text-xs sm:text-sm overflow-wrap-anywhere opacity-80">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {formatMessageContent(partialContent)}
                  </ReactMarkdown>
                </div>
                <div className="text-xs text-muted-foreground mt-2 italic">
                  (Partial response - connection interrupted)
                </div>
              </div>
            )}
            {/* User-friendly error message - Requirements: 5.1 */}
            <div className="rounded-lg bg-destructive/10 px-3 sm:px-4 py-2 sm:py-3">
              {(() => {
                const formattedError = formatErrorMessage(error)
                return (
                  <>
                    <div className="text-xs sm:text-sm text-destructive break-words font-medium">
                      {formattedError.message}
                    </div>
                    {formattedError.suggestion && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formattedError.suggestion}
                      </div>
                    )}
                  </>
                )
              })()}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClearError()
                  onRetry()
                }}
                className="w-fit text-xs sm:text-sm mt-2"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show loading indicator only when loading but not yet streaming */}
      {/* Requirements: 4.1, 4.2, 4.3 - Loading and streaming state management */}
      {isLoading && !isStreaming && (
        <div className="flex gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted shrink-0">
            <Bot className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 sm:px-4 py-2 sm:py-3">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            <span className="text-xs sm:text-sm text-muted-foreground animate-pulse">
              {loadingMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}