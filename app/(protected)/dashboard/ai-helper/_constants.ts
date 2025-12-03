export const AUTO_MODEL_ID = "auto"
export const DEFAULT_FALLBACK_MODEL_ID = "claude-sonnet-4-20250514"

export const MODEL_LABELS: Record<string, string> = {
  [AUTO_MODEL_ID]: "Smart Auto Route",
  "claude-sonnet-4-20250514": "Claude Sonnet 4",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
}



export const MCP_TOOLS = [
  {
    id: "none",
    label: "Auto-Select Tools",
    description: "Let The Librarian Ghost automatically choose the best tool for each task.",
  },
] as const

export type McpToolId = string

export const DEFAULT_MCP_TOOL: McpToolId = MCP_TOOLS[0].id

export interface DynamicMcpTool {
  id: string
  name: string
  namespace: string
  description: string
  inputSchema?: any
}

