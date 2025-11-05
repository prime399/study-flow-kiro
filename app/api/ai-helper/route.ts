import { AIRequestBody } from "@/lib/types"
import OpenAI from "openai"
import { cookies } from "next/headers"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

import { buildSystemPrompt } from "./_lib/system-prompt"
import { sanitizeMessages } from "./_lib/message-sanitizer"
import {
  validateOpenAIConfig,
  createOpenAIClient,
  DEFAULT_COMPLETION_OPTIONS,
  fetchChatCompletion,
  type ChatCompletionOptions,
} from "./_lib/openai-client"
import { processAIResponse } from "./_lib/response-processor"
import { resolveModelRouting } from "./_lib/model-router"
import { injectUserTokensToMCP } from "@/lib/mcp-token-injector"

interface McpTool {
  id: string
  name: string
  namespace: string
  description: string
  inputSchema?: any
}

async function fetchAvailableMcpTools(requestUrl?: string): Promise<McpTool[]> {
  try {
    // Skip MCP tools in production if no URL is available
    // MCP tools are typically for local development with MCP servers
    if (!requestUrl && !process.env.NEXT_PUBLIC_APP_URL) {
      console.log('Skipping MCP tools fetch - no base URL available (production environment)')
      return []
    }
    
    const baseUrl = requestUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Fetch all Heroku-registered MCP tools (including Google Calendar MCP addon)
    const response = await fetch(`${baseUrl}/api/ai-helper/mcp-servers`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.warn('Failed to fetch MCP tools, continuing without them')
      return []
    }
    
    const data = await response.json()
    return data.tools || []
  } catch (error) {
    console.warn('Error fetching MCP tools:', error)
    return []
  }
}

async function callHerokuAgentsEndpoint(
  config: { herokuBaseUrl: string; herokuApiKey: string; herokuModelId: string },
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  mcpTools: McpTool[]
) {
  const agentsUrl = `${config.herokuBaseUrl.replace(/\/$/, "")}/v1/agents/heroku`

  // Filter out tools with missing IDs and deduplicate
  const validTools = mcpTools.filter(tool => {
    if (!tool.id || typeof tool.id !== 'string') {
      console.warn(`[AI Helper] Skipping tool with missing or invalid id:`, tool)
      return false
    }
    return true
  })

  const uniqueTools = validTools.reduce((acc, tool) => {
    if (!acc.find(t => t.id === tool.id)) {
      acc.push(tool)
    }
    return acc
  }, [] as McpTool[])

  // Log filtering and deduplication stats
  if (mcpTools.length !== validTools.length) {
    console.log(`[AI Helper] Filtered ${mcpTools.length - validTools.length} invalid tools`)
  }
  if (validTools.length !== uniqueTools.length) {
    console.log(`[AI Helper] Deduplicated ${validTools.length} tools to ${uniqueTools.length} unique tools`)
  }

  const toolsArray = uniqueTools.map(tool => ({
    type: "mcp",
    name: tool.id,
  }))

  const requestBody: any = {
    model: config.herokuModelId,
    messages,
    tools: toolsArray,
  }

  const response = await fetch(agentsUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.herokuApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Heroku Agents API error (${response.status}): ${errorText}`)
  }

  // Parse SSE response
  const text = await response.text()
  const lines = text.split('\n')
  let lastCompletion: any = null

  for (const line of lines) {
    if (line.startsWith('data:')) {
      const data = line.slice(5).trim()
      if (data === '[DONE]') break
      
      try {
        const parsed = JSON.parse(data)
        // Collect chat completions (including tool calls and responses)
        if (parsed.object === 'chat.completion' || parsed.object === 'tool.completion') {
          lastCompletion = parsed
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  }

  if (!lastCompletion) {
    throw new Error("No valid completion received from Heroku Agents API")
  }

  return lastCompletion
}

export async function POST(req: Request) {
  try {
    // ===== OPTIONAL AUTHENTICATION FOR GOOGLE CALENDAR =====
    // Extract Convex auth token from cookies (optional - only needed for Google Calendar)
    const cookieStore = await cookies()
    const isLocalhost = req.headers.get('host')?.includes('localhost')
    const cookieName = isLocalhost ? '__convexAuthJWT' : '__Host-__convexAuthJWT'
    const convexAuthToken = cookieStore.get(cookieName)?.value

    // Get user ID if authenticated (for Google Calendar MCP token injection)
    let userId: string | null = null
    if (convexAuthToken) {
      try {
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
        convexClient.setAuth(convexAuthToken)
        userId = await convexClient.query(api.scheduling.getCurrentUserId)
      } catch (error) {
        console.warn('[AI Helper] Failed to get user ID from auth token:', error)
        // Continue without user ID - calendar tools won't work but AI helper will
      }
    }

    const { messages, userName, studyStats, groupInfo, modelId, mcpToolId }: AIRequestBody & { modelId?: string; mcpToolId?: string } =
      await req.json()

    const routingDecision = resolveModelRouting({
      messages,
      studyStats,
      modelId,
    })

    // Validate and get OpenAI configuration for the resolved model
    const config = validateOpenAIConfig(routingDecision.resolvedModelId)

    // Get base URL from request for MCP tools fetch
    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Fetch all available MCP tools
    let availableMcpTools = await fetchAvailableMcpTools(baseUrl)

    // Filter tools if user selected a specific tool
    if (mcpToolId && mcpToolId !== 'none') {
      const selectedTool = availableMcpTools.find(tool => tool.id === mcpToolId)
      if (selectedTool) {
        availableMcpTools = [selectedTool]
        console.log(`[AI Helper] User selected specific tool: ${mcpToolId}`)
      }
    }

    // ===== GOOGLE CALENDAR MCP TOKEN INJECTION =====
    // If Google Calendar MCP tools are available and user is authenticated, inject tokens
    // Calendar tools can be under different namespaces: 'mcp', 'google-calendar', 'google-calendar-local'
    const calendarToolNames = ['list-calendars', 'list-events', 'create-event', 'update-event',
                                'delete-event', 'get-event', 'search-events', 'get-freebusy',
                                'list-colors', 'get-current-time']
    const hasGoogleCalendarTools = availableMcpTools.some(
      tool => tool.namespace === 'mcp' ||
              tool.namespace === 'google-calendar' ||
              tool.namespace === 'google-calendar-local' ||
              calendarToolNames.includes(tool.name)
    )

    if (hasGoogleCalendarTools && userId && convexAuthToken) {
      try {
        console.log(`[AI Helper] Injecting Google Calendar tokens for user: ${userId}`)
        const injectionResult = await injectUserTokensToMCP(userId, convexAuthToken)

        if (!injectionResult.success) {
          console.warn(`[AI Helper] Token injection failed: ${injectionResult.message}`)
          // Don't fail the request, but log the warning
          // The user will get an error when they try to use calendar tools
        } else {
          console.log(`[AI Helper] Tokens injected successfully. Expires in: ${injectionResult.expiresIn}ms`)
        }
      } catch (error) {
        console.error('[AI Helper] Error during token injection:', error)
        // Continue with the request even if token injection fails
        // The calendar tools will return appropriate errors if tokens are missing
      }
    } else if (hasGoogleCalendarTools && !userId) {
      console.log('[AI Helper] Google Calendar tools available but user not authenticated - calendar tools will not work')
    }

    // Build system prompt with user context
    const baseSystemPrompt = buildSystemPrompt({ userName, studyStats, groupInfo })
    let systemPrompt = baseSystemPrompt
    
    // Add MCP tool instruction if tools are available
    if (availableMcpTools.length > 0) {
      const toolsList = availableMcpTools
        .map(tool => `- ${tool.name}: ${tool.description}`)
        .join('\n')
      
      systemPrompt = `${baseSystemPrompt}

You have access to the following MCP tools to help answer questions:
${toolsList}

When using these tools, extract any required information (like URLs) directly from the user's message. Use these tools proactively when they can help provide better answers.`
    }

    // Prepare chat messages
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...sanitizeMessages(messages),
    ]

    let completion: OpenAI.Chat.Completions.ChatCompletion

    // Use Heroku Agents endpoint with all registered MCP tools
    if (availableMcpTools.length > 0) {
      console.log(`[AI Helper] Using ${availableMcpTools.length} Heroku-registered MCP tools`)
      completion = await callHerokuAgentsEndpoint(
        config,
        chatMessages,
        availableMcpTools
      )
    } else {
      // Fall back to standard OpenAI client if no MCP tools available
      const client = createOpenAIClient(config)

      const completionOptions: ChatCompletionOptions = {
        model: config.herokuModelId,
        messages: chatMessages,
        ...DEFAULT_COMPLETION_OPTIONS,
      }

      completion = await fetchChatCompletion(client, completionOptions)
    }

    // Process response and extract tables
    const { choices, toolInvocations } = processAIResponse(completion)

    const responsePayload = {
      ...completion,
      choices,
      toolInvocations,
      routing: routingDecision,
      selectedModel: routingDecision.resolvedModelId,
    }

    return Response.json(responsePayload)
  } catch (error) {
    console.error("Error in AI helper API:", error)

    if (error instanceof OpenAI.APIError) {
      return new Response(error.message, { status: error.status ?? 500 })
    }

    if (error instanceof Error) {
      return new Response(error.message, { status: 500 })
    }

    return new Response("Error processing request", { status: 500 })
  }
}
