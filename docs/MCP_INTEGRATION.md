# Nice Router — Model Context Protocol (MCP) Integration Guide

Nice Router v1.0.0 provides a native, read-only MCP server conforming to the **Model Context Protocol (2024-11-05)** specification. This allows external AI assistants (Claude Desktop, Cursor, Antigravity, Cline, Windsurf) to inspect router status, monitor real-time provider health, simulate intelligent routing, and query budgets safely without exposing private API keys or secrets.

---

## 1. Supported Transports

### A. Local Stdio Transport (Recommended for Local Clients)
Runs the lightweight MCP server process directly via Node.js using standard input/output.
- **Path**: `scripts/mcp-server.mjs`
- **Security**: Bound to your local machine environment; no external port opened.

### B. HTTP / SSE Transport (For Remote & Web Assistants)
Allows AI clients to interact with Nice Router over HTTP.
- **Endpoint**: `http://localhost:20127/api/mcp/router`
- **Security**: Gated by Nice Router session token, API key, or CLI machine token.

---

## 2. Client Configuration Examples

### Claude Desktop
Add the following configuration to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nice-router": {
      "command": "node",
      "args": [
        "D:\\9router-master\\scripts\\mcp-server.mjs"
      ]
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "nice-router": {
      "command": "node",
      "args": [
        "scripts/mcp-server.mjs"
      ]
    }
  }
}
```

### Antigravity (`~/.gemini/antigravity/mcp/nice-router.json`)
```json
{
  "mcpServers": {
    "nice-router": {
      "command": "node",
      "args": [
        "D:/9router-master/scripts/mcp-server.mjs"
      ]
    }
  }
}
```

---

## 3. Available MCP Tools Reference

All tools provided by the Nice Router MCP server are strictly **read-only** and execute within the existing service layers.

| Tool Name | Parameters | Description |
|---|---|---|
| `get_router_status` | *(none)* | Returns core router health, uptime, active provider count, and supported smart routing policies. |
| `get_provider_health` | `provider` *(string, optional)* | Returns latency averages, p95 rolling latency, error rate, and status (`HEALTHY`, `DEGRADED`, `UNAVAILABLE`) for providers. |
| `get_usage_summary` | `apiKey` *(string, optional)* | Returns daily and monthly token spend and request counts from persistent database storage. |
| `get_cost_summary` | *(none)* | Returns current USD to IDR exchange rate, update timestamp, and pricing classification statuses. |
| `get_budget_status` | *(none)* | Returns daily/monthly budget caps, enforcement policies (warning, block, downgrade), and current spending. |
| `list_available_models` | `category` *(string, optional)* | Lists configured combos and models with capability flags (tools, vision, reasoning) and pricing statuses. |
| `simulate_routing` | `candidateModels`, `policy`, `taskHint` | Runs a dry-run smart routing simulation to rank models without dispatching external requests or consuming tokens. |
| `get_recent_alerts` | `limit`, `severity`, `unresolvedOnly` | Returns operational alerts (e.g. rate limit bursts, provider degradation, circuit breaker trips). |

---

## 4. Security & Data Protection

- **No Secret Leakage**: API keys, credentials, and passwords are never returned in MCP responses.
- **No Mutation**: Configuration cannot be modified via MCP tools in v1.0.0.
- **Fail-Safe Simulation**: `simulate_routing` operates purely in memory using dry-run algorithms; no external API calls are made.
