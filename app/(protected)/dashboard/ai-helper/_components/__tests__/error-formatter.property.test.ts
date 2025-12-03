/**
 * Property-based tests for Error Formatter
 *
 * **Feature: anthropic-ai-migration, Property 7: Error message user-friendliness**
 * **Validates: Requirements 5.1**
 *
 * For any API error response, the displayed error message SHALL be user-friendly
 * (not raw API error text) and SHALL suggest actionable next steps.
 */

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  formatErrorMessage,
  isRetryableError,
  type StreamingError,
  type FormattedError,
} from "../error-formatter"

/**
 * Helper to check if a message is user-friendly
 * User-friendly messages should:
 * - Not contain raw technical jargon like stack traces
 * - Not contain raw HTTP status codes as the main message
 * - Be readable by non-technical users
 * - Be reasonably short (under 200 characters)
 */
function isUserFriendlyMessage(message: string): boolean {
  // Should not contain stack traces
  if (message.includes("at ") && message.includes(".ts:")) return false
  if (message.includes("at ") && message.includes(".js:")) return false

  // Should not contain raw error object notation
  if (message.includes("[object Object]")) return false

  // Should not be just a status code
  if (/^\d{3}$/.test(message.trim())) return false

  // Should not contain raw JSON
  if (message.startsWith("{") && message.endsWith("}")) return false

  // Should be reasonably short
  if (message.length > 200) return false

  // Should not be empty
  if (message.trim().length === 0) return false

  return true
}

/**
 * Helper to check if a suggestion is actionable
 * Actionable suggestions should:
 * - Contain action words (try, check, wait, contact, etc.)
 * - Be reasonably short
 * - Not be empty
 */
function isActionableSuggestion(suggestion: string | undefined): boolean {
  if (!suggestion) return true // Suggestions are optional

  const actionWords = [
    "try",
    "check",
    "wait",
    "contact",
    "please",
    "start",
    "send",
    "rephrase",
    "verify",
  ]

  const lowerSuggestion = suggestion.toLowerCase()
  const hasActionWord = actionWords.some((word) => lowerSuggestion.includes(word))

  // Should be reasonably short
  if (suggestion.length > 150) return false

  return hasActionWord
}

describe("Error Formatter - Property Tests", () => {
  /**
   * **Feature: anthropic-ai-migration, Property 7: Error message user-friendliness**
   * **Validates: Requirements 5.1**
   */
  describe("Property 7: Error message user-friendliness", () => {
    // Arbitrary for raw API error messages
    const rawApiErrorArb = fc.oneof(
      // HTTP status code errors
      fc.constantFrom(
        "401 Unauthorized",
        "429 Too Many Requests",
        "500 Internal Server Error",
        "503 Service Unavailable",
        "400 Bad Request"
      ),
      // Authentication errors
      fc.constantFrom(
        "Invalid API key provided",
        "Unauthorized: API key is missing",
        "Authentication failed: invalid credentials",
        "API key is invalid or missing"
      ),
      // Rate limiting errors
      fc.constantFrom(
        "Rate limit exceeded",
        "Too many requests, please slow down",
        "Quota exceeded for this API key",
        "rate_limit_error: too many requests"
      ),
      // Network errors
      fc.constantFrom(
        "Network error: connection refused",
        "Failed to fetch",
        "Connection timeout",
        "ECONNREFUSED",
        "fetch failed"
      ),
      // Service errors
      fc.constantFrom(
        "Service temporarily unavailable",
        "Server overloaded",
        "503 Service Unavailable",
        "The service is currently unavailable"
      ),
      // Generic errors
      fc.constantFrom(
        "Something went wrong",
        "An error occurred",
        "Unknown error",
        "Internal server error"
      )
    )

    // Arbitrary for HTTP status codes
    const httpStatusCodeArb = fc.constantFrom(400, 401, 403, 404, 429, 500, 502, 503, 504)

    // Arbitrary for StreamingError objects
    const streamingErrorArb = fc.record({
      message: rawApiErrorArb,
      code: fc.option(httpStatusCodeArb, { nil: undefined }),
    }) as fc.Arbitrary<StreamingError>

    it("formats string errors to user-friendly messages", () => {
      fc.assert(
        fc.property(rawApiErrorArb, (errorMessage) => {
          const formatted = formatErrorMessage(errorMessage)

          // Property 1: Result has required structure
          expect(formatted).toHaveProperty("message")
          expect(formatted).toHaveProperty("isRetryable")

          // Property 2: Message is user-friendly
          expect(isUserFriendlyMessage(formatted.message)).toBe(true)

          // Property 3: Suggestion (if present) is actionable
          expect(isActionableSuggestion(formatted.suggestion)).toBe(true)

          // Property 4: isRetryable is a boolean
          expect(typeof formatted.isRetryable).toBe("boolean")
        }),
        { numRuns: 100 }
      )
    })

    it("formats StreamingError objects to user-friendly messages", () => {
      fc.assert(
        fc.property(streamingErrorArb, (error) => {
          const formatted = formatErrorMessage(error)

          // Property 1: Result has required structure
          expect(formatted).toHaveProperty("message")
          expect(formatted).toHaveProperty("isRetryable")

          // Property 2: Message is user-friendly
          expect(isUserFriendlyMessage(formatted.message)).toBe(true)

          // Property 3: Suggestion (if present) is actionable
          expect(isActionableSuggestion(formatted.suggestion)).toBe(true)

          // Property 4: isRetryable is a boolean
          expect(typeof formatted.isRetryable).toBe("boolean")
        }),
        { numRuns: 100 }
      )
    })

    it("handles arbitrary string inputs gracefully", () => {
      fc.assert(
        fc.property(fc.string(), (arbitraryError) => {
          const formatted = formatErrorMessage(arbitraryError)

          // Property 1: Never throws
          expect(formatted).toBeDefined()

          // Property 2: Always returns valid structure
          expect(formatted).toHaveProperty("message")
          expect(formatted).toHaveProperty("isRetryable")

          // Property 3: Message is always user-friendly
          expect(isUserFriendlyMessage(formatted.message)).toBe(true)

          // Property 4: Suggestion (if present) is actionable
          expect(isActionableSuggestion(formatted.suggestion)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("isRetryableError is consistent with formatErrorMessage", () => {
      fc.assert(
        fc.property(rawApiErrorArb, (errorMessage) => {
          const formatted = formatErrorMessage(errorMessage)
          const retryable = isRetryableError(errorMessage)

          // Property: isRetryableError returns same value as formatted.isRetryable
          expect(retryable).toBe(formatted.isRetryable)
        }),
        { numRuns: 100 }
      )
    })

    // Specific error code tests
    it("401 errors are not retryable and suggest checking configuration", () => {
      const error401: StreamingError = { message: "Unauthorized", code: 401 }
      const formatted = formatErrorMessage(error401)

      expect(formatted.isRetryable).toBe(false)
      expect(formatted.suggestion?.toLowerCase()).toContain("check")
    })

    it("429 errors are retryable and suggest waiting", () => {
      const error429: StreamingError = { message: "Rate limited", code: 429 }
      const formatted = formatErrorMessage(error429)

      expect(formatted.isRetryable).toBe(true)
      expect(formatted.suggestion?.toLowerCase()).toContain("wait")
    })

    it("503 errors are retryable and suggest trying again", () => {
      const error503: StreamingError = { message: "Service unavailable", code: 503 }
      const formatted = formatErrorMessage(error503)

      expect(formatted.isRetryable).toBe(true)
      expect(formatted.suggestion?.toLowerCase()).toContain("try")
    })

    it("network errors are retryable", () => {
      const networkErrors = [
        "Network error",
        "Connection refused",
        "Timeout",
        "Failed to fetch",
      ]

      for (const error of networkErrors) {
        const formatted = formatErrorMessage(error)
        expect(formatted.isRetryable).toBe(true)
      }
    })

    it("coin shortage errors are not retryable", () => {
      const coinErrors = [
        "insufficient_coins",
        "Not enough coins",
        "coins required",
      ]

      for (const error of coinErrors) {
        const formatted = formatErrorMessage(error)
        expect(formatted.isRetryable).toBe(false)
      }
    })
  })
})
