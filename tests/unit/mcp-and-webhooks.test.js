import { describe, it, expect, beforeEach } from "vitest";
import {
  handleMcpRpcRequest,
  executeMcpTool,
  MCP_TOOLS,
  MCP_SERVER_INFO,
} from "@/lib/mcp/niceRouterMcpServer.js";
import {
  isPrivateOrReservedIp,
  validateWebhookUrl,
  signPayload,
  redactSensitiveData,
  WEBHOOK_EVENTS,
} from "@/lib/services/webhookEngine.js";
import {
  createWebhook,
  getWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  saveDeliveryLog,
  getDeliveryLogs,
  maskWebhookSecret,
} from "@/lib/db/repos/webhooksRepo.js";
import crypto from "crypto";

describe("Nice Router MCP Server", () => {
  it("initializes with valid protocol version and server info", async () => {
    const res = await handleMcpRpcRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });

    expect(res.jsonrpc).toBe("2.0");
    expect(res.id).toBe(1);
    expect(res.result.serverInfo.name).toBe("nice-router-mcp");
    expect(res.result.protocolVersion).toBe(MCP_SERVER_INFO.protocolVersion);
    expect(res.result.capabilities).toHaveProperty("tools");
  });

  it("lists all 8 required read-only tools", async () => {
    const res = await handleMcpRpcRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });

    expect(res.result.tools).toHaveLength(8);
    const names = res.result.tools.map((t) => t.name);
    expect(names).toContain("get_router_status");
    expect(names).toContain("get_provider_health");
    expect(names).toContain("get_usage_summary");
    expect(names).toContain("get_cost_summary");
    expect(names).toContain("get_budget_status");
    expect(names).toContain("list_available_models");
    expect(names).toContain("simulate_routing");
    expect(names).toContain("get_recent_alerts");
  });

  it("executes get_router_status without exposing secrets", async () => {
    const status = await executeMcpTool("get_router_status");
    expect(status.name).toBe("Nice Router");
    expect(status.version).toBe("1.1.0");
    expect(status).toHaveProperty("uptimeSeconds");
    expect(status).toHaveProperty("supportedSmartPolicies");
    expect(status).not.toHaveProperty("password");
    expect(status).not.toHaveProperty("jwtSecret");
  });

  it("simulates smart routing decision without external requests", async () => {
    const sim = await executeMcpTool("simulate_routing", {
      requestedModel: "coding-test",
      candidateModels: ["deepseek/deepseek-coder", "openai/gpt-4o", "anthropic/claude-3-5-sonnet"],
      policy: "lowest-cost",
    });

    expect(sim.isDryRun).toBe(true);
    expect(sim).toHaveProperty("selectedModel");
    expect(sim).toHaveProperty("selectionReason");
    expect(sim.rankedModels).toHaveLength(3);
  });

  it("returns error for unknown MCP tool", async () => {
    const res = await handleMcpRpcRequest({
      jsonrpc: "2.0",
      id: 99,
      method: "tools/call",
      params: { name: "invalid_tool_name" },
    });

    expect(res.error).toBeDefined();
    expect(res.error.code).toBe(-32000);
    expect(res.error.message).toContain("Unknown tool");
  });
});

describe("Webhook Engine Security & SSRF Protection", () => {
  it("detects and blocks private IPv4 and IPv6 addresses", () => {
    // Loopback
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("127.255.255.255")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);

    // Private networks (RFC 1918)
    expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.0.5")).toBe(true);
    expect(isPrivateOrReservedIp("172.31.255.255")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);

    // Cloud metadata / link-local
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.1.1")).toBe(true);

    // Public IPs should NOT be blocked
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
    expect(isPrivateOrReservedIp("104.26.4.120")).toBe(false);
  });

  it("validates webhook URLs and blocks localhost and bad protocols", async () => {
    const loopback = await validateWebhookUrl("http://localhost:8080/webhook");
    expect(loopback.valid).toBe(false);
    expect(loopback.reason).toContain("restricted");

    const loopbackIp = await validateWebhookUrl("http://127.0.0.1:3000/webhook");
    expect(loopbackIp.valid).toBe(false);

    const badProto = await validateWebhookUrl("ftp://example.com/webhook");
    expect(badProto.valid).toBe(false);
    expect(badProto.reason).toContain("protocol");

    const validPublic = await validateWebhookUrl("https://httpbin.org/post");
    expect(validPublic.valid).toBe(true);
  });

  it("generates and verifies HMAC-SHA256 signatures", () => {
    const secret = "whsec_supersecretkey123456789";
    const timestamp = 1778369000000;
    const payload = JSON.stringify({ event: "request.completed", data: { id: "req_1" } });

    const signature = signPayload(payload, secret, timestamp);
    expect(signature).toBeTypeOf("string");
    expect(signature).toHaveLength(64);

    // Verify using standard crypto
    const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    expect(signature).toBe(expected);
  });

  it("redacts sensitive fields from data payloads", () => {
    const rawData = {
      model: "openai/gpt-4o",
      provider: "openai",
      apiKey: "sk-secret12345678",
      authorization: "Bearer sensitive_token",
      prompt: "My confidential prompt",
      messages: [{ role: "user", content: "secret password" }],
      tokens: { prompt_tokens: 10, completion_tokens: 20 },
      costUSD: 0.005,
    };

    const redacted = redactSensitiveData(rawData);
    expect(redacted).toHaveProperty("model", "openai/gpt-4o");
    expect(redacted).toHaveProperty("provider", "openai");
    expect(redacted).toHaveProperty("costUSD", 0.005);
    expect(redacted).not.toHaveProperty("apiKey");
    expect(redacted).not.toHaveProperty("authorization");
    expect(redacted).not.toHaveProperty("prompt");
    expect(redacted).not.toHaveProperty("messages");
  });
});

describe("Webhook Persistence and Delivery Logs (SQLite)", () => {
  let createdId = null;

  it("creates a webhook endpoint and persists it in database", async () => {
    const wh = await createWebhook({
      name: "Alert Slack Webhook",
      url: "https://hooks.slack.com/services/test/alert",
      events: [WEBHOOK_EVENTS.BUDGET_WARNING, WEBHOOK_EVENTS.PROVIDER_UNHEALTHY],
    });

    expect(wh.id).toBeDefined();
    expect(wh.name).toBe("Alert Slack Webhook");
    expect(wh.events).toContain(WEBHOOK_EVENTS.BUDGET_WARNING);
    expect(wh.secret).toMatch(/^whsec_/);
    createdId = wh.id;

    // Verify it is saved in database
    const fetched = await getWebhookById(createdId, false);
    expect(fetched).not.toBeNull();
    expect(fetched.secret).toContain("..."); // Masked
  });

  it("masks secret by default and only exposes plain secret when explicitly requested", async () => {
    const masked = await getWebhookById(createdId, false);
    expect(masked.secret).not.toMatch(/^whsec_[a-f0-9]{48}$/);
    expect(masked.secret).toContain("...");

    const plain = await getWebhookById(createdId, true);
    expect(plain.secret).toMatch(/^whsec_/);
  });

  it("updates and toggles webhook active state", async () => {
    const updated = await updateWebhook(createdId, {
      name: "Renamed Webhook",
      isActive: false,
    });

    expect(updated.name).toBe("Renamed Webhook");
    expect(updated.isActive).toBe(false);
  });

  it("saves and retrieves delivery logs", async () => {
    const logId = await saveDeliveryLog({
      webhookId: createdId,
      eventId: "evt_12345",
      event: WEBHOOK_EVENTS.BUDGET_WARNING,
      statusCode: 200,
      success: true,
      attempts: 1,
      durationMs: 145,
    });

    expect(logId).toBeDefined();

    const logs = await getDeliveryLogs({ webhookId: createdId });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].eventId).toBe("evt_12345");
    expect(logs[0].success).toBe(true);
    expect(logs[0].durationMs).toBe(145);
  });

  it("deletes webhook and associated logs cleanly", async () => {
    await deleteWebhook(createdId);
    const fetched = await getWebhookById(createdId);
    expect(fetched).toBeNull();
  });
});
