export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initConsoleLogCapture } = await import("@/lib/consoleLogBuffer");
    initConsoleLogCapture();

    // Server-only: lets capabilities.js read the synced catalog without pulling
    // node:fs into the dashboard's browser bundle.
    const { installCatalogSource } = await import("open-sse/providers/catalogOverride.js");
    await installCatalogSource();

    const { startModelCatalogSync } = await import("@/lib/modelCatalog/sync.js");
    startModelCatalogSync();

    // Model intelligence: catalog discovery + health testing. Both schedulers
    // are no-ops when disabled in settings or switched off by env, and both
    // delay their first run so a cold boot serves requests first.
    const { startCatalogSyncScheduler } = await import("@/lib/intelligence/sync.js");
    startCatalogSyncScheduler();
    const { startTestScheduler } = await import("@/lib/intelligence/runner.js");
    startTestScheduler();
  }
}
