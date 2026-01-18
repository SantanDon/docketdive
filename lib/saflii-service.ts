import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const EventSource = require("eventsource");

// Polyfill EventSource for Node.js
global.EventSource = EventSource;

const MCP_URL = process.env.SAFLII_MCP_URL || "http://127.0.0.1:3005/sse";

let client: Client | null = null;
let transport: SSEClientTransport | null = null;

async function getClient() {
  if (client) return client;

  try {
    transport = new SSEClientTransport(new URL(MCP_URL));
    client = new Client({
      name: "DocketDive-Client",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    console.log("Connected to SAFLII MCP at", MCP_URL);
    return client;
  } catch (error) {
    console.error("Failed to connect to SAFLII MCP:", error);
    return null;
  }
}

export async function searchCaseLaw(court: string, keywords: string, limit: number = 5) {
  const mcp = await getClient();
  if (!mcp) return null;

  try {
    const result = await mcp.callTool({
      name: "search_cases",
      arguments: {
        court,
        keywords,
        limit
      }
    });

    // Content is array of { type: 'text', text: '...' }
    // We expect JSON in text
    if (result.content && result.content[0] && result.content[0].type === 'text') {
        const text = result.content[0].text;
        try {
            return JSON.parse(text);
        } catch (e) {
            return text; // Return raw text if not JSON
        }
    }
    return result;
  } catch (error) {
    console.error("Error calling search_cases:", error);
    return null;
  }
}

export async function getCase(caseId: string) {
  const mcp = await getClient();
  if (!mcp) return null;

  try {
    const result = await mcp.callTool({
      name: "get_case",
      arguments: {
        case_id: caseId
      }
    });
    
    if (result.content && result.content[0] && result.content[0].type === 'text') {
        const text = result.content[0].text;
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    }
    return result;
  } catch (error) {
    console.error("Error calling get_case:", error);
    return null;
  }
}
