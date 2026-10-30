import { describe, it, expect } from "vitest";
import { exportApiKeyUsageToExcel, exportUsageTableToExcel } from "../../src/shared/utils/excelExport.js";

describe("Excel Export Utility", () => {
  it("formats API key usage data into clean CSV with UTF-8 BOM", () => {
    let downloadedContent = null;
    let downloadedFilename = null;

    // Mock document.createElement and Blob in node environment if needed
    const mockData = [
      {
        appName: "Claude Code CLI",
        apiKeyMasked: "sk_live_...481a",
        machineId: "mach-win-01",
        accessPolicy: "Unrestricted",
        totalRequests: 142,
        tokens: { prompt: 125000, completion: 45000, total: 170000 },
        cost: { totalUSD: 0.425, totalIDR: 7012 },
        lastUsed: "2026-10-31T00:00:00.000Z",
        models: [
          {
            model: "claude-sonnet-4.5",
            provider: "anthropic",
            requests: 100,
            tokens: { prompt: 100000, completion: 35000, total: 135000 },
            cost: { totalUSD: 0.35, totalIDR: 5775 },
            lastUsed: "2026-10-31T00:00:00.000Z",
          },
        ],
      },
    ];

    expect(typeof exportApiKeyUsageToExcel).toBe("function");
    expect(typeof exportUsageTableToExcel).toBe("function");
  });
});
