import { getAllProvidersHealth } from "../services/providerHealthMonitor.js";
import { resolveSmartRoute } from "../services/smartRouting.js";
import { getBudgetConfig } from "../services/budgetGuard.js";
import { getAlerts } from "../services/alertCenter.js";
import { getExchangeRate, PRICING_STATUS } from "../services/costIntelligence.js";
import { getDailyAndMonthlySpendUSD } from "../db/repos/usageRepo.js";
import { getSettings } from "../localDb.js";

export const MCP_SERVER_INFO = {
  name: "nice-router-mcp",
  version: "1.0.0",
  protocolVersion: "2024-11-05",
};

export const MCP_TOOLS = [
  {
    name: "get_router_status",
    description: "Get general Nice Router application status and non-sensitive routing configuration.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_provider_health",
    description: "Get current health, rolling latency (avg and p95), and error rates for all configured AI providers.",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description: "Optional provider name to filter health metrics (e.g. 'openai', 'anthropic')",
        },
      },
    },
  },
  {
    name: "get_usage_summary",
    description: "Get daily and monthly usage summary and accumulated spend (USD).",
    inputSchema: {
      type: "object",
      properties: {
        apiKey: {
          type: "string",
          description: "Optional API key identifier to inspect specific key quota usage",
        },
      },
    },
  },
  {
    name: "get_cost_summary",
    description: "Get current USD to IDR currency conversion rate and supported pricing statuses.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_budget_status",
    description: "Get current budget guard limits, enforcement policies, and live spending progress.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_available_models",
    description: "List configured models and combos with capability flags and pricing statuses.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category filter (e.g. 'coding', 'chat', 'agent', 'image', 'voice', 'free')",
        },
      },
    },
  },
  {
    name: "simulate_routing",
    description: "Dry-run smart routing to preview candidate model rankings without sending any external requests.",
    inputSchema: {
      type: "object",
      properties: {
        requestedModel: {
          type: "string",
          description: "Model or combo name to route (e.g. 'smart-router', 'coding-combo')",
        },
        candidateModels: {
          type: "array",
          items: { type: "string" },
          description: "List of candidate provider/model strings to evaluate",
        },
        policy: {
          type: "string",
          enum: ["lowest-cost", "lowest-latency", "health-based", "task-based", "capability"],
          description: "Smart routing policy to simulate",
        },
        taskHint: {
          type: "string",
          description: "Optional task type hint (e.g. 'coding', 'chat', 'agent')",
        },
      },
      required: ["candidateModels", "policy"],
    },
  },
  {
    name: "get_recent_alerts",
    description: "Retrieve recent operational alerts (e.g. provider downtime, circuit breaker trips, budget warnings).",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max number of alerts to return (default 20)",
        },
        severity: {
          type: "string",
          enum: ["INFO", "WARNING", "CRITICAL"],
          description: "Filter by severity level",
        },
        unresolvedOnly: {
          type: "boolean",
          description: "Whether to return only active unresolved alerts",
        },
      },
    },
  },
];

/**
 * Executes a tool call safely and returns text content.
 */
export async function executeMcpTool(name, args = {}) {
  switch (name) {
    case "get_router_status": {
      const settings = await getSettings().catch(() => ({}));
      const allHealth = getAllProvidersHealth();
      const provCount = Object.keys(allHealth).length;
      return {
        name: "Nice Router",
        version: "1.0.0",
        uptimeSeconds: Math.floor(process.uptime()),
        authMode: settings?.authMode || "password",
        requireLogin: settings?.requireLogin !== false,
        activeProvidersTracked: provCount,
        supportedSmartPolicies: [
          "lowest-cost",
          "lowest-latency",
          "health-based",
          "task-based",
          "capability",
        ],
      };
    }

    case "get_provider_health": {
      const allHealth = getAllProvidersHealth();
      if (args?.provider) {
        const key = String(args.provider).toLowerCase();
        return allHealth[key] || { provider: key, status: "UNKNOWN", message: "Provider not yet tracked" };
      }
      return allHealth;
    }

    case "get_usage_summary": {
      const spend = await getDailyAndMonthlySpendUSD(args?.apiKey || null);
      return {
        currentDaySpendUSD: spend.currentDaySpendUSD,
        currentMonthSpendUSD: spend.currentMonthSpendUSD,
        currentKeyDaySpendUSD: spend.currentKeyDaySpendUSD,
        currentKeyMonthSpendUSD: spend.currentKeyMonthSpendUSD,
        currency: "USD",
      };
    }

    case "get_cost_summary": {
      const rateInfo = await getExchangeRate();
      return {
        exchangeRate: {
          from: "USD",
          to: "IDR",
          rate: rateInfo.rate,
          lastUpdated: rateInfo.lastUpdated,
          source: rateInfo.source,
        },
        pricingStatuses: Object.values(PRICING_STATUS),
      };
    }

    case "get_budget_status": {
      const config = getBudgetConfig();
      const spend = await getDailyAndMonthlySpendUSD();
      return {
        limits: {
          dailyLimitUSD: config.dailyLimitUSD,
          monthlyLimitUSD: config.monthlyLimitUSD,
          warningThresholdRatio: config.warningThresholdRatio,
          action: config.defaultAction,
          approvedFreeModel: config.approvedFreeModel,
        },
        currentSpendUSD: {
          today: spend.currentDaySpendUSD,
          thisMonth: spend.currentMonthSpendUSD,
        },
      };
    }

    case "list_available_models": {
      const settings = await getSettings().catch(() => ({}));
      const combos = settings?.combos || {};
      const comboList = Object.entries(combos).map(([name, data]) => ({
        name,
        models: Array.isArray(data) ? data : data?.models || [],
        strategy: settings?.comboStrategies?.[name]?.fallbackStrategy || "fallback",
      }));

      return {
        combos: comboList,
        notice: "Full models list can be queried via /v1/models endpoint.",
      };
    }

    case "simulate_routing": {
      const { requestedModel = "test-combo", candidateModels = [], policy = "lowest-cost", taskHint = "" } = args;
      if (!Array.isArray(candidateModels) || candidateModels.length === 0) {
        throw new Error("candidateModels must be a non-empty array of model strings");
      }

      const dummyBody = taskHint ? { messages: [{ role: "user", content: `Please help with ${taskHint}` }] } : {};
      const decision = resolveSmartRoute({
        requestedModel,
        candidateModels,
        policy,
        body: dummyBody,
      });

      return {
        selectedModel: decision.selectedModel,
        selectionReason: decision.selectionReason,
        rankedModels: decision.rankedModels,
        policy,
        isDryRun: true,
      };
    }

    case "get_recent_alerts": {
      const limit = Number(args?.limit) || 20;
      const severity = args?.severity || null;
      const unresolvedOnly = args?.unresolvedOnly !== false;
      return getAlerts({ limit, severity, unresolvedOnly });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Handles incoming JSON-RPC 2.0 MCP request
 */
export async function handleMcpRpcRequest(request) {
  const { id, method, params } = request || {};

  if (!method) {
    return {
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32600, message: "Invalid Request: method is required" },
    };
  }

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: MCP_SERVER_INFO.protocolVersion,
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: MCP_SERVER_INFO.name,
              version: MCP_SERVER_INFO.version,
            },
          },
        };

      case "notifications/initialized":
        return null; // Notifications return no response

      case "ping":
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };

      case "tools/call": {
        const { name, arguments: toolArgs } = params || {};
        if (!name) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Invalid params: name is required for tools/call" },
          };
        }

        const toolResult = await executeMcpTool(name, toolArgs || {});
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(toolResult, null, 2),
              },
            ],
          },
        };
      }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message: err.message },
    };
  }
}
