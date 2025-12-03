# Design Document: Anthropic AI Migration

## Overview

This design migrates the AI helper from OpenAI/Heroku-based inference to Anthropic's Claude API with real-time streaming. The migration simplifies the architecture by removing Heroku Agents and MCP dependencies while maintaining BYOK support for multiple providers (Anthropic, OpenAI, OpenRouter).

The key changes include:
- Replacing Heroku Inference with direct Anthropic API calls
- Implementing Server-Sent Events (SSE) for real-time streaming
- Updating the frontend to handle streaming responses
- Maintaining backward compatibility with BYOK for all providers

## Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (React)"]
        UI[Message List Component]
        Hook[useChat Hook]
        Stream[Stream Handler]
    end
    
    subgraph API["Next.js API Route"]
        Route[/api/ai-helper]
        Router[Model Router]
        Factory[Provider Factory]
    end
    
    subgraph Providers["AI Providers"]
        Anthropic[Anthropic Provider]
        OpenAI[OpenAI Provider]
        OpenRouter[OpenRouter Provider]
    end
    
    subgraph External["External APIs"]
        AnthropicAPI[Anthropic Messages API]
        OpenAIAPI[OpenAI Chat API]
        OpenRouterAPI[OpenRouter API]
    end
    
    UI --> Hook
    Hook --> Stream
    Stream -->|SSE| Route
    Route --> Router
    Router --> Factory
    Factory --> Anthropic
    Factory --> OpenAI
    Factory --> OpenRouter
    Anthropic -->|Stream| AnthropicAPI
    OpenAI -->|Stream| OpenAIAPI
    OpenRouter -->|Stream| OpenRouterAPI
```

## Components and Interfaces

### 1. API Route (`/api/ai-helper/route.ts`)

The main API route will be refactored to:
- Remove Heroku Agents endpoint calls
- Remove MCP tool fetching and injection
- Support SSE streaming responses
- Route to appropriate provider based on configuration

```typescript
interface StreamingResponse {
  type: 'text_delta' | 'message_start' | 'message_stop' | 'error';
  content?: string;
  model?: string;
  usage?: { input_tokens: number; output_tokens: number };
  error?: string;
}
```

### 2. Anthropic Provider (`anthropic-provider.ts`)

Updated to support streaming:

```typescript
interface AnthropicStreamConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface StreamCallbacks {
  onTextDelta: (text: string) => void;
  onComplete: (usage: TokenUsage) => void;
  onError: (error: Error) => void;
}
```

### 3. Provider Factory (`factory.ts`)

Extended to create streaming-capable providers:

```typescript
interface StreamingProviderAdapter extends ProviderAdapter {
  streamChat(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks
  ): Promise<void>;
}
```

### 4. Frontend Chat Hook (`use-chat.ts`)

Updated to handle SSE streaming:

```typescript
interface StreamState {
  isStreaming: boolean;
  partialContent: string;
  error: string | null;
}
```

### 5. Model Configuration

Default model configuration:

```typescript
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;
```

## Data Models

### Message Format

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
  toolInvocations?: ToolInvocation[];
}
```

### SSE Event Format

```typescript
// Server sends events in this format
interface SSEEvent {
  event: 'text_delta' | 'message_start' | 'message_stop' | 'error';
  data: string; // JSON stringified payload
}

// Text delta payload
interface TextDeltaPayload {
  text: string;
}

// Message stop payload
interface MessageStopPayload {
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  isBYOK: boolean;
  provider: string;
}
```

### Provider Configuration

```typescript
interface ProviderConfig {
  provider: 'anthropic' | 'openai' | 'openrouter';
  apiKey: string;
  baseUrl?: string;
  modelId: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Streaming delivers incremental content
*For any* valid chat message, the streaming response SHALL deliver content in multiple chunks where each chunk appends to the previous content, and the final concatenated content equals the complete response.
**Validates: Requirements 1.1, 1.2**

### Property 2: Max tokens configuration is respected
*For any* max_tokens configuration value, the Anthropic API request SHALL include that value, and the default SHALL be 4096 when not specified.
**Validates: Requirements 2.4**

### Property 3: BYOK provider selection
*For any* user with a configured API key for a specific provider (Anthropic, OpenAI, or OpenRouter), the AI_Helper SHALL use that provider's key for requests to that provider's models.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 4: BYOK coin exemption
*For any* request using BYOK, the system SHALL not deduct coins from the user's balance (coins are refunded if pre-deducted).
**Validates: Requirements 6.4**

### Property 5: BYOK provider indication
*For any* BYOK request, the response SHALL include the provider name and indicate that BYOK was used.
**Validates: Requirements 6.5**

### Property 6: Multi-provider streaming support
*For any* BYOK provider (Anthropic, OpenAI, OpenRouter), the system SHALL support streaming responses using that provider's streaming API.
**Validates: Requirements 6.6**

### Property 7: Error message user-friendliness
*For any* API error response, the displayed error message SHALL be user-friendly (not raw API error text) and SHALL suggest actionable next steps.
**Validates: Requirements 5.1**

### Property 8: Streaming indicator during generation
*For any* active streaming response, the UI SHALL display both the partial content and a streaming indicator simultaneously.
**Validates: Requirements 4.2**

## Error Handling

### API Errors

| Error Type | HTTP Status | User Message |
|------------|-------------|--------------|
| Invalid API Key | 401 | "API key is invalid or missing. Please check your configuration." |
| Rate Limited | 429 | "Too many requests. Please wait a moment and try again." |
| Model Unavailable | 503 | "The AI service is temporarily unavailable. Please try again." |
| Stream Interrupted | 500 | "Connection interrupted. Your partial response has been preserved." |
| Invalid Request | 400 | "Unable to process your request. Please try rephrasing." |

### Error Recovery Strategy

1. Pre-deducted coins are refunded on any error
2. Partial streaming content is preserved on mid-stream errors
3. Retry button is displayed for recoverable errors
4. Connection errors trigger automatic retry with exponential backoff (max 3 attempts)

## Testing Strategy

### Dual Testing Approach

This implementation uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties across all valid inputs

### Property-Based Testing Framework

The project will use **fast-check** for property-based testing in TypeScript/JavaScript.

Configuration:
- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: anthropic-ai-migration, Property {number}: {property_text}**`

### Test Categories

#### Unit Tests
- API route returns correct status codes for various error conditions
- Provider factory creates correct provider type based on config
- SSE events are correctly formatted
- Message state transitions (idle → loading → streaming → complete)

#### Property-Based Tests
- Streaming content accumulation (Property 1)
- Max tokens configuration (Property 2)
- BYOK provider selection (Property 3)
- BYOK coin exemption (Property 4)
- BYOK provider indication (Property 5)
- Multi-provider streaming (Property 6)
- Error message formatting (Property 7)

#### Integration Tests
- End-to-end streaming flow with mock Anthropic API
- BYOK flow with coin refund verification
- Error recovery with partial content preservation

### Test File Structure

```
app/api/ai-helper/
├── __tests__/
│   ├── route.test.ts           # API route unit tests
│   ├── route.property.test.ts  # API route property tests
│   └── providers/
│       ├── anthropic.test.ts
│       └── anthropic.property.test.ts
app/(protected)/dashboard/ai-helper/
├── _hooks/
│   └── __tests__/
│       └── use-chat.test.ts
```
