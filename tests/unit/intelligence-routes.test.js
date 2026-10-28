import { describe, it, expect } from "vitest";
import { GET as getProvidersHealthRoute } from "@/app/api/health/providers/route.js";
import { GET as getAdvisorRoute } from "@/app/api/routing/advisor/route.js";
import { POST as postSimulateRoute } from "@/app/api/routing/simulate/route.js";
import { GET as getAlertsRoute, POST as postAlertsRoute } from "@/app/api/alerts/route.js";
import { GET as getExchangeRateRoute, POST as postExchangeRateRoute } from "@/app/api/settings/exchange-rate/route.js";
import { recordProviderMetric, resetProviderHealth } from "@/lib/services/providerHealthMonitor.js";
import { recordAlert, clearAlerts } from "@/lib/services/alertCenter.js";

describe("Intelligence API Routes Contract", () => {
  it("GET /api/health/providers returns providers health status map", async () => {
    resetProviderHealth();
    recordProviderMetric({ provider: "openai", success: true, latencyMs: 220 });

    const res = await getProvidersHealthRoute();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.openai).toBeDefined();
    expect(body.data.openai.status).toBe("HEALTHY");
  });

  it("GET /api/routing/advisor returns read-only recommendations", async () => {
    const res = await getAdvisorRoute();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.recommendations).toBeInstanceOf(Array);
  });

  it("POST /api/routing/simulate returns dry-run smart routing decision", async () => {
    resetProviderHealth();
    const req = new Request("http://localhost/api/routing/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedModel: "combo-test",
        candidateModels: ["openrouter/google/gemini-2.0-flash-exp:free", "openai/gpt-4o"],
        policy: "lowest-cost",
      }),
    });

    const res = await postSimulateRoute(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.selectedModel).toBe("openrouter/google/gemini-2.0-flash-exp:free");
  });

  it("GET and POST /api/alerts manages alerts lifecycle", async () => {
    clearAlerts();
    const alert = recordAlert({
      category: "PROVIDER_DOWN",
      target: "anthropic",
      message: "Anthropic down",
    });

    const getReq = new Request("http://localhost/api/alerts?unresolvedOnly=true");
    const getRes = await getAlertsRoute(getReq);
    const getBody = await getRes.json();
    expect(getBody.ok).toBe(true);
    expect(getBody.data.length).toBe(1);

    const postReq = new Request("http://localhost/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: alert.id, action: "resolve" }),
    });
    const postRes = await postAlertsRoute(postReq);
    const postBody = await postRes.json();
    expect(postBody.ok).toBe(true);
  });

  it("GET and POST /api/settings/exchange-rate manages USD/IDR currency rate", async () => {
    const getRes = await getExchangeRateRoute();
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.ok).toBe(true);
    expect(getBody.data.rate).toBeGreaterThan(0);

    const postReq = new Request("http://localhost/api/settings/exchange-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate: 16500, source: "test_update" }),
    });
    const postRes = await postExchangeRateRoute(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.ok).toBe(true);
    expect(postBody.data.rate).toBe(16500);
  });
});
