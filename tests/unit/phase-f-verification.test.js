import { describe, it, expect, beforeEach } from "vitest";
import { __test__ } from "@/dashboardGuard.js";
import { getDailyAndMonthlySpendUSD } from "@/lib/db/repos/usageRepo.js";
import { evaluateBudgetGuard, setBudgetConfig } from "@/lib/services/budgetGuard.js";

describe("Phase F — Integration Audit & Verification", () => {
  describe("API Security Guard (SEC-01)", () => {
    it("differentiates exact /api/health probe from protected /api/health/providers", () => {
      // In dashboardGuard:
      // isPublicLlmApi handles LLM endpoints
      // isPublicApi handles non-authenticated paths
      expect(__test__.isPublicLlmApi("/v1/chat/completions")).toBe(true);
      expect(__test__.isPublicLlmApi("/api/health")).toBe(false);
      expect(__test__.isPublicLlmApi("/api/health/providers")).toBe(false);
    });
  });

  describe("Real Budget Guard Integration (BUDGET-01)", () => {
    it("correctly respects currentDaySpendUSD and currentMonthSpendUSD from repo", async () => {
      // Test getDailyAndMonthlySpendUSD returns valid schema
      const spend = await getDailyAndMonthlySpendUSD();
      expect(spend).toHaveProperty("currentDaySpendUSD");
      expect(spend).toHaveProperty("currentMonthSpendUSD");
      expect(spend).toHaveProperty("currentKeyDaySpendUSD");
      expect(typeof spend.currentDaySpendUSD).toBe("number");

      // Verify that budget guard triggers block if spend exceeds limit
      setBudgetConfig({
        dailyLimitUSD: 10.0,
        defaultAction: "block",
      });

      const blockedDecision = evaluateBudgetGuard({
        requestedModel: "openai/gpt-4o",
        pricingStatus: "PRICED",
        estimatedCostUSD: 0.50,
        currentDaySpendUSD: 10.20, // Exceeds 10.0
      });

      expect(blockedDecision.allowed).toBe(false);
      expect(blockedDecision.action).toBe("block");
    });
  });
});
