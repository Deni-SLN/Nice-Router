#!/usr/bin/env node

/**
 * Nice Router MCP Server (stdio transport)
 * Allows AI assistants (Claude Desktop, Cursor, Antigravity) to query router health,
 * usage, budgets, alerts, and simulate routing decisions.
 */

import readline from "readline";
import { handleMcpRpcRequest } from "../src/lib/mcp/niceRouterMcpServer.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const jsonReq = JSON.parse(trimmed);
    const response = await handleMcpRpcRequest(jsonReq);
    if (response) {
      process.stdout.write(JSON.stringify(response) + "\n");
    }
  } catch (err) {
    const errResponse = {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` },
    };
    process.stdout.write(JSON.stringify(errResponse) + "\n");
  }
});

process.stderr.write("[Nice Router MCP] stdio server ready.\n");
