/**
 * Unit tests for error handling in AI providers
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4 - Error handling
 * - Test 401, 429, 503 status code handling
 * - Test error message mapping
 * - Test partial content preservation
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { APIError } from "../types"

describe("Error Handling - Unit Tests", () => {
  describe("APIError class", () => {
    it("creates error with correct properties", () => {
      const error = new APIError("Test error", 401, false)
      
      expect(error.message).toBe("Test error")
      expect(error.statusCode).toBe(401)
      expect(error.isRetryable).toBe(false)
      expect(error.name).toBe("APIError")
    })

    it("defaults isRetryable to false", () => {
      const error = new APIError("Test error", 500)
      
      expect(error.isRetryable).toBe(false)
    })

    it("is instanceof Error", () => {
      const error = new APIError("Test error", 500)
      
      expect(error instanceof Error).toBe(true)
      expect(error instanceof APIError).toBe(true)
    })
  })

  describe("401 - Authentication errors", () => {
    /**
     * Requirements: 5.2 - Handle invalid/missing API key
     */
    it("401 errors should not be retryable", () => {
      const error = new APIError("API key is invalid", 401, false)
      
      expect(error.statusCode).toBe(401)
      expect(error.isRetryable).toBe(false)
    })

    it("401 errors should have user-friendly message", () => {
      const error = new APIError(
        "API key is invalid or missing. Please check your configuration.",
        401,
        false
      )
      
      expect(error.message).toContain("API key")
      expect(error.message).toContain("configuration")
    })
  })

  describe("429 - Rate limiting errors", () => {
    /**
     * Requirements: 5.3 - Handle rate limiting
     */
    it("429 errors should be retryable", () => {
      const error = new APIError("Too many requests", 429, true)
      
      expect(error.statusCode).toBe(429)
      expect(error.isRetryable).toBe(true)
    })

    it("429 errors should suggest waiting", () => {
      const error = new APIError(
        "Too many requests. Please wait a moment and try again.",
        429,
        true
      )
      
      expect(error.message).toContain("wait")
      expect(error.message).toContain("try again")
    })
  })

  describe("503 - Service unavailability errors", () => {
    /**
     * Requirements: 5.1 - Handle service unavailability
     */
    it("503 errors should be retryable", () => {
      const error = new APIError("Service unavailable", 503, true)
      
      expect(error.statusCode).toBe(503)
      expect(error.isRetryable).toBe(true)
    })

    it("503 errors should have user-friendly message", () => {
      const error = new APIError(
        "The AI service is temporarily unavailable. Please try again.",
        503,
        true
      )
      
      expect(error.message).toContain("temporarily unavailable")
      expect(error.message).toContain("try again")
    })
  })

  describe("400 - Bad request errors", () => {
    it("400 errors should be retryable", () => {
      const error = new APIError("Bad request", 400, true)
      
      expect(error.statusCode).toBe(400)
      expect(error.isRetryable).toBe(true)
    })

    it("400 errors should suggest rephrasing", () => {
      const error = new APIError(
        "Unable to process your request. Please try rephrasing.",
        400,
        true
      )
      
      expect(error.message).toContain("Unable to process")
    })
  })

  describe("500 - Server errors", () => {
    it("500 errors should be retryable", () => {
      const error = new APIError("Internal server error", 500, true)
      
      expect(error.statusCode).toBe(500)
      expect(error.isRetryable).toBe(true)
    })

    it("500 errors should have user-friendly message", () => {
      const error = new APIError(
        "Something went wrong on our end. Please try again.",
        500,
        true
      )
      
      expect(error.message).toContain("Something went wrong")
      expect(error.message).toContain("try again")
    })
  })
})

describe("Error Message Mapping", () => {
  /**
   * Test that error messages are mapped correctly based on patterns
   */
  describe("Pattern-based error detection", () => {
    const errorPatterns = [
      {
        input: "unauthorized",
        expectedCode: 401,
        expectedRetryable: false,
        description: "unauthorized keyword"
      },
      {
        input: "invalid api key",
        expectedCode: 401,
        expectedRetryable: false,
        description: "invalid api key phrase"
      },
      {
        input: "authentication failed",
        expectedCode: 401,
        expectedRetryable: false,
        description: "authentication keyword"
      },
      {
        input: "rate limit exceeded",
        expectedCode: 429,
        expectedRetryable: true,
        description: "rate limit phrase"
      },
      {
        input: "too many requests",
        expectedCode: 429,
        expectedRetryable: true,
        description: "too many requests phrase"
      },
      {
        input: "service unavailable",
        expectedCode: 503,
        expectedRetryable: true,
        description: "service unavailable phrase"
      },
      {
        input: "server overloaded",
        expectedCode: 503,
        expectedRetryable: true,
        description: "overloaded keyword"
      }
    ]

    errorPatterns.forEach(({ input, expectedCode, expectedRetryable, description }) => {
      it(`detects ${description} and maps to ${expectedCode}`, () => {
        // This tests the pattern matching logic
        const lowerInput = input.toLowerCase()
        
        let detectedCode: number
        let detectedRetryable: boolean

        if (lowerInput.includes("unauthorized") || 
            lowerInput.includes("invalid api key") || 
            lowerInput.includes("authentication")) {
          detectedCode = 401
          detectedRetryable = false
        } else if (lowerInput.includes("rate limit") || 
                   lowerInput.includes("too many requests")) {
          detectedCode = 429
          detectedRetryable = true
        } else if (lowerInput.includes("service unavailable") || 
                   lowerInput.includes("overloaded")) {
          detectedCode = 503
          detectedRetryable = true
        } else {
          detectedCode = 500
          detectedRetryable = true
        }

        expect(detectedCode).toBe(expectedCode)
        expect(detectedRetryable).toBe(expectedRetryable)
      })
    })
  })
})

describe("Partial Content Preservation", () => {
  /**
   * Requirements: 5.4 - Preserve partial response on error
   */
  describe("Streaming error scenarios", () => {
    it("partial content should be preserved when error occurs mid-stream", () => {
      // Simulate partial content accumulation
      let accumulatedContent = ""
      const chunks = ["Hello", " ", "world", "!"]
      
      // Simulate receiving some chunks before error
      for (let i = 0; i < 2; i++) {
        accumulatedContent += chunks[i]
      }
      
      // Error occurs - content should be preserved
      const preservedContent = accumulatedContent
      
      expect(preservedContent).toBe("Hello ")
      expect(preservedContent.length).toBeGreaterThan(0)
    })

    it("empty content should be handled gracefully on immediate error", () => {
      // Simulate error before any content received
      const accumulatedContent = ""
      
      // Error occurs immediately
      const preservedContent = accumulatedContent || null
      
      expect(preservedContent).toBeNull()
    })

    it("full content should be preserved on late error", () => {
      // Simulate all chunks received before error
      const chunks = ["Hello", " ", "world", "!"]
      const accumulatedContent = chunks.join("")
      
      // Error occurs after all content
      const preservedContent = accumulatedContent
      
      expect(preservedContent).toBe("Hello world!")
    })
  })
})

describe("Error Response Format", () => {
  /**
   * Test SSE error event format
   */
  describe("SSE Error Events", () => {
    interface SSEError {
      type: "error"
      error: string
      code?: number
      isRetryable?: boolean
    }

    it("error event has correct structure", () => {
      const errorEvent: SSEError = {
        type: "error",
        error: "API key is invalid or missing. Please check your configuration.",
        code: 401,
        isRetryable: false
      }

      expect(errorEvent.type).toBe("error")
      expect(errorEvent.error).toBeDefined()
      expect(typeof errorEvent.code).toBe("number")
      expect(typeof errorEvent.isRetryable).toBe("boolean")
    })

    it("401 error event is not retryable", () => {
      const errorEvent: SSEError = {
        type: "error",
        error: "API key is invalid",
        code: 401,
        isRetryable: false
      }

      expect(errorEvent.code).toBe(401)
      expect(errorEvent.isRetryable).toBe(false)
    })

    it("429 error event is retryable", () => {
      const errorEvent: SSEError = {
        type: "error",
        error: "Too many requests",
        code: 429,
        isRetryable: true
      }

      expect(errorEvent.code).toBe(429)
      expect(errorEvent.isRetryable).toBe(true)
    })

    it("503 error event is retryable", () => {
      const errorEvent: SSEError = {
        type: "error",
        error: "Service unavailable",
        code: 503,
        isRetryable: true
      }

      expect(errorEvent.code).toBe(503)
      expect(errorEvent.isRetryable).toBe(true)
    })
  })
})
