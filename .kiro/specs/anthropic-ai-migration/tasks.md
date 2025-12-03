# Implementation Plan

- [x] 1. Update environment configuration and model definitions





  - [x] 1.1 Update environment variables for Anthropic


    - Add ANTHROPIC_API_KEY to .env.example
    - Remove HEROKU_INFERENCE_URL requirement
    - Update model ID configuration for Anthropic
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 1.2 Update model definitions in models.ts

    - Set claude-sonnet-4-5-20250929 as default model
    - Remove Heroku-specific model mappings
    - Update getAvailableModels() to work without Heroku
    - _Requirements: 2.1, 3.1_

- [x] 2. Implement streaming Anthropic provider





  - [x] 2.1 Update Anthropic provider with streaming support


    - Add streamChat() method using Anthropic streaming API
    - Implement SSE event generation for text deltas
    - Handle stream completion with usage stats
    - _Requirements: 1.1, 2.3, 2.4_
  - [x] 2.2 Write property test for streaming content accumulation


    - **Property 1: Streaming delivers incremental content**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 2.3 Write property test for max tokens configuration


    - **Property 2: Max tokens configuration is respected**
    - **Validates: Requirements 2.4**

- [x] 3. Update provider factory and types





  - [x] 3.1 Extend provider types for streaming


    - Add StreamingProviderAdapter interface
    - Add StreamCallbacks type
    - Update ProviderConfig for new defaults
    - _Requirements: 1.1, 6.6_

  - [x] 3.2 Update provider factory for streaming

    - Modify createProvider to return streaming-capable adapters
    - Ensure all providers (Anthropic, OpenAI, OpenRouter) support streaming
    - _Requirements: 6.6_

  - [x] 3.3 Write property test for multi-provider streaming

    - **Property 6: Multi-provider streaming support**
    - **Validates: Requirements 6.6**

- [x] 4. Refactor API route for streaming





  - [x] 4.1 Remove Heroku/MCP dependencies from route


    - Remove fetchAvailableMcpTools function
    - Remove callHerokuAgentsEndpoint function
    - Remove MCP tool injection logic
    - Simplify system prompt (remove MCP tool instructions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 Implement SSE streaming response

    - Create streaming response handler
    - Implement text_delta, message_start, message_stop events
    - Add error event handling for stream errors
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 4.3 Update BYOK integration for streaming

    - Ensure BYOK detection works with streaming
    - Implement coin refund for BYOK streaming requests
    - Include provider info in message_stop event
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 4.4 Write property tests for BYOK functionality


    - **Property 3: BYOK provider selection**
    - **Property 4: BYOK coin exemption**
    - **Property 5: BYOK provider indication**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 5. Checkpoint - Ensure backend tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update frontend chat hook for streaming





  - [x] 6.1 Implement SSE stream handling in useChat


    - Add EventSource or fetch with ReadableStream handling
    - Parse SSE events (text_delta, message_start, message_stop, error)
    - Update message state incrementally during streaming
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 6.2 Update loading and streaming state management


    - Add isStreaming state separate from isLoading
    - Track partial content during streaming
    - Handle stream completion and error states
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.3 Write property test for streaming indicator


    - **Property 8: Streaming indicator during generation**
    - **Validates: Requirements 4.2**

- [x] 7. Update message list component





  - [x] 7.1 Add streaming message display


    - Show partial content as it arrives
    - Display streaming indicator alongside content
    - Handle transition from streaming to complete
    - _Requirements: 1.2, 4.2, 4.3_
  - [x] 7.2 Update error display for streaming errors


    - Preserve partial content on error
    - Show user-friendly error messages
    - Enable retry functionality
    - _Requirements: 1.4, 5.1, 5.4_
  - [x] 7.3 Write property test for error message formatting


    - **Property 7: Error message user-friendliness**
    - **Validates: Requirements 5.1**

- [x] 8. Update error handling






  - [x] 8.1 Implement comprehensive error handling

    - Add 401 handling for invalid/missing API keys
    - Add 429 handling for rate limiting
    - Add 503 handling for service unavailability
    - Map API errors to user-friendly messages
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 8.2 Write unit tests for error handling


    - Test 401, 429, 503 status code handling
    - Test error message mapping
    - Test partial content preservation
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Update model selector and constants





  - [x] 9.1 Update frontend model constants


    - Update DEFAULT_FALLBACK_MODEL_ID to claude-sonnet-4-20250514
    - Update model display names and descriptions
    - Remove Heroku-specific model references
    - _Requirements: 2.1_
  - [x] 9.2 Update models API endpoint


    - Return available models based on new configuration
    - Support Anthropic as primary provider
    - _Requirements: 2.1, 3.1_

- [x] 10. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
