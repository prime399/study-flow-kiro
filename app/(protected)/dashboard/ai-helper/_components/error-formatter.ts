/**
 * Error formatting utilities for user-friendly error messages
 * Requirements: 5.1 - Display user-friendly error messages
 * 
 * Property 7: Error message user-friendliness
 * For any API error response, the displayed error message SHALL be user-friendly
 * (not raw API error text) and SHALL suggest actionable next steps.
 * Validates: Requirements 5.1
 */

/**
 * Represents a streaming error with optional HTTP status code
 */
export interface StreamingError {
  message: string
  code?: number
}

/**
 * Formatted error with user-friendly message and suggestion
 */
export interface FormattedError {
  message: string
  suggestion?: string
  isRetryable: boolean
}

/**
 * Error patterns that map to user-friendly messages
 */
interface ErrorPattern {
  patterns: (string | RegExp)[]
  message: string
  suggestion: string
  isRetryable: boolean
}

/**
 * Known error patterns with user-friendly messages
 * Requirements: 5.1, 5.2, 5.3 - Error handling
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // Authentication errors (401)
  {
    patterns: [
      "401",
      "unauthorized",
      "invalid api key",
      "authentication",
      "api key is invalid",
      /api.?key.*missing/i,
      /invalid.*key/i
    ],
    message: "Unable to authenticate with the AI service.",
    suggestion: "Please check your API key configuration in settings.",
    isRetryable: false
  },
  // Rate limiting (429)
  {
    patterns: [
      "429",
      "rate limit",
      "too many requests",
      "quota exceeded",
      /rate.?limit/i,
      /too.?many/i
    ],
    message: "You've made too many requests.",
    suggestion: "Please wait a moment before trying again.",
    isRetryable: true
  },
  // Service unavailable (503)
  {
    patterns: [
      "503",
      "service unavailable",
      "overloaded",
      "temporarily unavailable",
      /service.*unavailable/i,
      /server.*overloaded/i
    ],
    message: "The AI service is temporarily unavailable.",
    suggestion: "Please try again in a few moments.",
    isRetryable: true
  },
  // Network/connection errors
  {
    patterns: [
      "network",
      "connection",
      "timeout",
      "fetch failed",
      "failed to fetch",
      /network.*error/i,
      /connection.*refused/i,
      /timed?.?out/i
    ],
    message: "Connection to the AI service was interrupted.",
    suggestion: "Please check your internet connection and try again.",
    isRetryable: true
  },
  // Insufficient coins
  {
    patterns: [
      "insufficient_coins",
      "not enough coins",
      "coin shortage",
      /coins?.?required/i
    ],
    message: "You don't have enough coins for this request.",
    suggestion: "Start a study session to earn more coins (1 coin per second of study).",
    isRetryable: false
  },
  // Request cancelled
  {
    patterns: [
      "aborted",
      "cancelled",
      "canceled",
      /request.*abort/i
    ],
    message: "Request was cancelled.",
    suggestion: "You can send a new message when ready.",
    isRetryable: false
  },
  // Invalid request (400)
  {
    patterns: [
      "400",
      "bad request",
      "invalid request",
      "malformed",
      /invalid.*request/i
    ],
    message: "Unable to process your request.",
    suggestion: "Please try rephrasing your message.",
    isRetryable: true
  },
  // Server errors (500)
  {
    patterns: [
      "500",
      "internal server error",
      "server error",
      /internal.*error/i
    ],
    message: "Something went wrong on our end.",
    suggestion: "Please try again. If the problem persists, contact support.",
    isRetryable: true
  }
]

/**
 * Default error for unrecognized errors
 */
const DEFAULT_ERROR: FormattedError = {
  message: "An unexpected error occurred.",
  suggestion: "Please try again. If the problem persists, contact support.",
  isRetryable: true
}

/**
 * Checks if an error message matches a pattern
 */
function matchesPattern(errorText: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string") {
    return errorText.includes(pattern.toLowerCase())
  }
  return pattern.test(errorText)
}

/**
 * Formats an error message to be user-friendly
 * 
 * Property 7: Error message user-friendliness
 * For any API error response, the displayed error message SHALL be user-friendly
 * (not raw API error text) and SHALL suggest actionable next steps.
 * 
 * @param error - The error string or StreamingError object
 * @returns FormattedError with user-friendly message and suggestion
 */
export function formatErrorMessage(error: string | StreamingError): FormattedError {
  const errorText = typeof error === "string" ? error : error.message
  const errorCode = typeof error === "object" ? error.code : undefined
  
  const normalizedError = errorText.toLowerCase()

  // Check for code-based matching first
  if (errorCode) {
    if (errorCode === 401) {
      return ERROR_PATTERNS.find(p => p.patterns.includes("401"))!
    }
    if (errorCode === 429) {
      return ERROR_PATTERNS.find(p => p.patterns.includes("429"))!
    }
    if (errorCode === 503) {
      return ERROR_PATTERNS.find(p => p.patterns.includes("503"))!
    }
    if (errorCode === 400) {
      return ERROR_PATTERNS.find(p => p.patterns.includes("400"))!
    }
    if (errorCode >= 500) {
      return ERROR_PATTERNS.find(p => p.patterns.includes("500"))!
    }
  }

  // Pattern-based matching
  for (const errorPattern of ERROR_PATTERNS) {
    for (const pattern of errorPattern.patterns) {
      if (matchesPattern(normalizedError, pattern)) {
        return {
          message: errorPattern.message,
          suggestion: errorPattern.suggestion,
          isRetryable: errorPattern.isRetryable
        }
      }
    }
  }

  // Return default error if no pattern matches
  return DEFAULT_ERROR
}

/**
 * Checks if an error is retryable
 * @param error - The error string or StreamingError object
 * @returns true if the error is retryable
 */
export function isRetryableError(error: string | StreamingError): boolean {
  return formatErrorMessage(error).isRetryable
}
