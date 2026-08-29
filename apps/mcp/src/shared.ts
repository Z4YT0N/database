import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import TurndownService from "turndown";

import { createNotedClient } from "@noted/sdk";

import packageJson from "../package.json";

const addr = process.env.NOTED_API_ADDR;
const apiKey = process.env.NOTED_API_KEY;

const getCustomHeaders = () => {
  try {
    return process.env.NOTED_CUSTOM_HEADERS
      ? JSON.parse(process.env.NOTED_CUSTOM_HEADERS)
      : {};
  } catch (e) {
    console.error("Failed to parse NOTED_CUSTOM_HEADERS", e);
    return {};
  }
};

export const notedClient = createNotedClient({
  baseUrl: `${addr}/api/v1`,
  headers: {
    ...getCustomHeaders(),
    "Content-Type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
});

export const mcpServer = new McpServer({
  name: "Noted",
  version: packageJson.version,
});

export const turndownService = new TurndownService();
