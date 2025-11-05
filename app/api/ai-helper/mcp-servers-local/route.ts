/**
 * API endpoint to provide available MCP servers (including local Google Calendar MCP)
 * This version supports both Heroku-hosted MCP servers and local MCP server
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface McpTool {
  id: string
  name: string
  namespace: string
  description: string
  inputSchema?: any
}

interface McpServer {
  namespace: string
  name: string
  version: string
  tools: McpTool[]
  isLocal?: boolean
  baseUrl?: string
}

/**
 * Get local Google Calendar MCP tools
 */
async function getLocalGoogleCalendarTools(): Promise<McpServer | null> {
  try {
    const mcpUrl = process.env.GOOGLE_CALENDAR_MCP_URL

    if (!mcpUrl) {
      console.log('No local Google Calendar MCP URL configured')
      return null
    }

    // Check if local MCP server is healthy
    const healthResponse = await fetch(`${mcpUrl}/health`, {
      headers: {
        'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    })

    if (!healthResponse.ok) {
      console.warn('Local Google Calendar MCP server not healthy')
      return null
    }

    // Define Google Calendar MCP tools manually
    // (In a production setup, these would be fetched from the MCP server's list-tools endpoint)
    const googleCalendarServer: McpServer = {
      namespace: 'google-calendar-local',
      name: 'Google Calendar (Local MCP)',
      version: '2.0.6',
      isLocal: true,
      baseUrl: mcpUrl,
      tools: [
        {
          id: 'google-calendar-local/list-calendars',
          name: 'list-calendars',
          namespace: 'google-calendar-local',
          description: 'List all Google calendars for the authenticated user',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID from Convex authentication',
              },
            },
            required: ['userId'],
          },
        },
        {
          id: 'google-calendar-local/list-events',
          name: 'list-events',
          namespace: 'google-calendar-local',
          description: 'List calendar events within a specified time range',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID from Convex authentication',
              },
              calendarId: {
                type: 'string',
                description: 'Calendar ID (use "primary" for main calendar)',
              },
              timeMin: {
                type: 'string',
                description: 'Start time in ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
              },
              timeMax: {
                type: 'string',
                description: 'End time in ISO 8601 format',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of events to return (default: 10)',
              },
            },
            required: ['userId', 'calendarId'],
          },
        },
        {
          id: 'google-calendar-local/create-event',
          name: 'create-event',
          namespace: 'google-calendar-local',
          description: 'Create a new calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID from Convex authentication',
              },
              calendarId: {
                type: 'string',
                description: 'Calendar ID (use "primary" for main calendar)',
              },
              summary: {
                type: 'string',
                description: 'Event title',
              },
              description: {
                type: 'string',
                description: 'Event description (optional)',
              },
              start: {
                type: 'string',
                description: 'Start time in ISO 8601 format',
              },
              end: {
                type: 'string',
                description: 'End time in ISO 8601 format',
              },
              location: {
                type: 'string',
                description: 'Event location (optional)',
              },
            },
            required: ['userId', 'calendarId', 'summary', 'start', 'end'],
          },
        },
        {
          id: 'google-calendar-local/search-events',
          name: 'search-events',
          namespace: 'google-calendar-local',
          description: 'Search for events by query string',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID from Convex authentication',
              },
              calendarId: {
                type: 'string',
                description: 'Calendar ID (use "primary" for main calendar)',
              },
              query: {
                type: 'string',
                description: 'Search query',
              },
            },
            required: ['userId', 'calendarId', 'query'],
          },
        },
        {
          id: 'google-calendar-local/delete-event',
          name: 'delete-event',
          namespace: 'google-calendar-local',
          description: 'Delete a calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID from Convex authentication',
              },
              calendarId: {
                type: 'string',
                description: 'Calendar ID',
              },
              eventId: {
                type: 'string',
                description: 'Event ID to delete',
              },
            },
            required: ['userId', 'calendarId', 'eventId'],
          },
        },
      ],
    }

    return googleCalendarServer
  } catch (error) {
    console.error('Error fetching local Google Calendar MCP:', error)
    return null
  }
}

/**
 * Get Heroku-hosted MCP servers
 */
async function getHerokuMcpServers(): Promise<McpServer[]> {
  try {
    const herokuInferenceUrl = process.env.HEROKU_INFERENCE_URL
    const herokuInferenceKey = process.env.HEROKU_INFERENCE_KEY_OSS

    if (!herokuInferenceUrl || !herokuInferenceKey) {
      return []
    }

    const mcpServersUrl = `${herokuInferenceUrl.replace(/\/$/, '')}/v1/mcp/servers`

    const response = await fetch(mcpServersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${herokuInferenceKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`Failed to fetch Heroku MCP servers: ${response.status}`)
      return []
    }

    const servers = await response.json()
    return servers
  } catch (error) {
    console.error('Error fetching Heroku MCP servers:', error)
    return []
  }
}

export async function GET() {
  try {
    // Fetch both local and Heroku MCP servers
    const [localGoogleCalendar, herokuServers] = await Promise.all([
      getLocalGoogleCalendarTools(),
      getHerokuMcpServers(),
    ])

    // Combine all servers
    const allServers: McpServer[] = []

    if (localGoogleCalendar) {
      allServers.push(localGoogleCalendar)
    }

    allServers.push(...herokuServers)

    // Transform server tools into a flat list
    const tools = allServers.flatMap((server) => {
      if (!server.tools || !Array.isArray(server.tools)) {
        return []
      }

      return server.tools.map((tool) => ({
        ...tool,
        isLocal: server.isLocal || false,
        baseUrl: server.baseUrl,
      }))
    })

    return Response.json({ servers: allServers, tools })
  } catch (error) {
    console.error('Error in mcp-servers-local endpoint:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch MCP servers',
        servers: [],
        tools: [],
      },
      { status: 500 }
    )
  }
}
