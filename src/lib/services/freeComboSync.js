// Service: Daily Free Models Discovery & Auto-Sync for Free Combos
import {
  getCombos,
  updateCombo,
  getProviderConnections,
  getCustomModels,
  getModelAliases,
  getProviderNodes,
} from "@/lib/localDb";
import { getDisabledModels } from "@/lib/disabledModelsDb";
import {
  AI_PROVIDERS,
  FREE_PROVIDERS,
  FREE_TIER_PROVIDERS,
  getProviderAlias,
  resolveProviderId,
  isOpenAICompatibleProvider,
} from "@/shared/constants/providers";
import { getModelsByProviderId } from "@/shared/constants/models";
import { listModelIntel } from "@/lib/db/repos/modelIntelRepo";
import { matchesModelCategory } from "@/shared/constants/modelCategories";

let lastSyncTimestamp = null;
let lastDiscoveredFreeModels = [];
let syncInProgress = false;
let schedulerStarted = false;

// Default free models that are available through built-in / free providers
// (Only included if the provider is actually active and connected)
const BUILT_IN_FREE_MODELS = [
  "pol/openai",
  "pol/claude",
  "pol/gemini",
  "pol/deepseek",
  "pol/llama",
  "pol/mistral",
  "lc/LongCat-Flash-Lite",
  "pu/gpt-4o-mini",
  "scw/qwen3-235b-a22b-instruct-2507",
  "scw/llama-3.1-70b-instruct",
];

/**
 * Check if a model object or ID qualifies as free.
 */
export function checkIsFree(modelOrId, providerId) {
  if (!modelOrId) return false;
  if (typeof modelOrId === "object" && modelOrId.isFree === true) return true;

  const id = (typeof modelOrId === "string" ? modelOrId : (modelOrId.id || modelOrId.value || "")).toLowerCase();
  const name = (typeof modelOrId === "object" ? (modelOrId.name || "") : "").toLowerCase();

  // Explicit free suffixes or patterns
  if (
    id.endsWith(":free") ||
    id.includes(":free/") ||
    id.includes("/free") ||
    id.includes("-free") ||
    id.endsWith("-free")
  ) {
    return true;
  }
  if (name.includes("free") || name.includes("gratis") || name.includes("🆓")) {
    return true;
  }

  // Provider flags
  const prov = AI_PROVIDERS[providerId] || FREE_PROVIDERS[providerId] || FREE_TIER_PROVIDERS[providerId];
  if (prov?.noAuth) return true;
  if (
    prov?.hasFree &&
    (id.includes("flash") ||
      id.includes("lite") ||
      id.includes("free") ||
      providerId === "pollinations" ||
      providerId === "pol")
  ) {
    return true;
  }

  return false;
}

/**
 * Load set of model IDs that are marked FAIL, quarantined, or force-failed.
 */
export async function getFailedModelSet() {
  const failedSet = new Set();
  try {
    const intelList = await listModelIntel({ includeMissing: true }).catch(() => []);
    for (const row of intelList) {
      if (
        row.manualOverride === "FORCE_FAIL" ||
        row.quarantined === true ||
        row.health === "FAIL" ||
        row.presentInCatalog === false
      ) {
        if (row.id) failedSet.add(row.id.toLowerCase());
        if (row.model) failedSet.add(row.model.toLowerCase());
        if (row.provider && row.model) {
          failedSet.add(`${row.provider}/${row.model}`.toLowerCase());
          const alias = getProviderAlias(row.provider);
          if (alias) failedSet.add(`${alias}/${row.model}`.toLowerCase());
        }
      }
    }
  } catch (err) {
    console.warn("[FreeComboSync] Failed to load model intelligence status:", err.message);
  }
  return failedSet;
}

/**
 * Scan active connections and model registries to gather all available free models.
 * Excludes any models that have failed health checks or belong to inactive/disconnected providers.
 */
export async function getAvailableFreeModels() {
  const freeModels = new Set();

  try {
    const [connections, disabled, customModels, providerNodes, modelAliases, failedModelSet] = await Promise.all([
      getProviderConnections().catch(() => []),
      getDisabledModels().catch(() => ({})),
      getCustomModels().catch(() => []),
      getProviderNodes().catch(() => []),
      getModelAliases().catch(() => ({})),
      getFailedModelSet(),
    ]);

    const activeConns = Array.isArray(connections) ? connections.filter((c) => c && c.isActive !== false) : [];

    // 1. Built-in free providers (ONLY if provider is actively connected)
    for (const m of BUILT_IN_FREE_MODELS) {
      const [provAlias, id] = m.split("/");
      const providerId = resolveProviderId(provAlias) || provAlias;
      const isConnected = activeConns.some(
        (c) => c && c.isActive !== false && (c.provider === providerId || c.provider === provAlias)
      );
      if (!isConnected) continue;

      if (failedModelSet.has(m.toLowerCase()) || failedModelSet.has(id.toLowerCase())) continue;

      const provDisabled = new Set([...(disabled[provAlias] || []), ...(disabled[providerId] || [])]);
      if (!provDisabled.has(id) && !provDisabled.has(m)) {
        freeModels.add(m);
      }
    }

    // 2. Discover from all active provider connections
    for (const conn of activeConns) {
      const providerId = conn?.provider;
      if (!providerId) continue;

      const alias = getProviderAlias(providerId) || providerId;
      const isCustom =
        isOpenAICompatibleProvider(providerId) ||
        providerId.startsWith("openai-compatible") ||
        providerId.startsWith("anthropic-compatible");

      // Per-provider disabled set
      const provDisabled = new Set([
        ...(disabled[alias] || []),
        ...(disabled[providerId] || []),
      ]);

      // Explicit enabled models for this connection if configured
      const explicitEnabled =
        Array.isArray(conn.providerSpecificData?.enabledModels) && conn.providerSpecificData.enabledModels.length > 0
          ? new Set(conn.providerSpecificData.enabledModels)
          : null;

      if (isCustom) {
        const matchedNode = Array.isArray(providerNodes) ? providerNodes.find((n) => n.id === providerId) : null;
        const nodePrefix = conn.providerSpecificData?.prefix || matchedNode?.prefix || providerId;

        // Custom models from DB registered under this provider
        if (Array.isArray(customModels)) {
          for (const cm of customModels) {
            if (cm?.providerAlias === providerId || cm?.providerAlias === nodePrefix) {
              const val = `${nodePrefix}/${cm.id}`;
              if (provDisabled.has(cm.id) || provDisabled.has(val)) continue;
              if (explicitEnabled && !explicitEnabled.has(cm.id) && !explicitEnabled.has(val)) continue;
              if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(cm.id.toLowerCase())) continue;

              if (checkIsFree(cm, providerId)) {
                freeModels.add(val);
              }
            }
          }
        }

        // Aliases registered under this provider
        if (modelAliases && typeof modelAliases === "object") {
          for (const [aliasName, fullModel] of Object.entries(modelAliases)) {
            if (fullModel?.startsWith(`${providerId}/`)) {
              const modelId = fullModel.replace(`${providerId}/`, "");
              const val = `${nodePrefix}/${modelId}`;
              if (provDisabled.has(modelId) || provDisabled.has(val)) continue;
              if (explicitEnabled && !explicitEnabled.has(modelId) && !explicitEnabled.has(val)) continue;
              if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(modelId.toLowerCase())) continue;

              if (checkIsFree({ id: modelId, name: aliasName }, providerId)) {
                freeModels.add(val);
              }
            }
          }
        }
      } else {
        // Standard provider hardcoded models
        let hardcoded = [];
        try {
          hardcoded = getModelsByProviderId(providerId) || [];
        } catch {
          hardcoded = [];
        }

        for (const m of hardcoded) {
          if (!m?.id) continue;
          const val = `${alias}/${m.id}`;
          if (provDisabled.has(m.id) || provDisabled.has(val)) continue;
          if (explicitEnabled && !explicitEnabled.has(m.id) && !explicitEnabled.has(val)) continue;
          if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(m.id.toLowerCase())) continue;

          if (checkIsFree(m, providerId)) {
            freeModels.add(val);
          }
        }

        // Custom models registered under this provider in DB
        if (Array.isArray(customModels)) {
          for (const cm of customModels) {
            if (cm?.providerAlias === alias || cm?.providerAlias === providerId) {
              const val = `${alias}/${cm.id}`;
              if (provDisabled.has(cm.id) || provDisabled.has(val)) continue;
              if (explicitEnabled && !explicitEnabled.has(cm.id) && !explicitEnabled.has(val)) continue;
              if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(cm.id.toLowerCase())) continue;

              if (checkIsFree(cm, providerId)) {
                freeModels.add(val);
              }
            }
          }
        }

        // OpenRouter live API fetch for dynamic free models
        if (providerId === "openrouter" && conn.apiKey) {
          try {
            const res = await fetch("https://openrouter.ai/api/v1/models", {
              headers: {
                Authorization: `Bearer ${conn.apiKey}`,
                "Content-Type": "application/json",
              },
              signal: AbortSignal.timeout(10000),
            });
            if (res.ok) {
              const data = await res.json();
              const list = Array.isArray(data?.data) ? data.data : [];
              for (const m of list) {
                const id = m?.id || "";
                if (!id) continue;
                const val = `openrouter/${id}`;
                if (provDisabled.has(id) || provDisabled.has(val)) continue;
                if (explicitEnabled && !explicitEnabled.has(id) && !explicitEnabled.has(val)) continue;
                if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(id.toLowerCase())) continue;

                const isZeroPrice =
                  m?.pricing &&
                  (Number(m.pricing.prompt) === 0 || m.pricing.prompt === "0") &&
                  (Number(m.pricing.completion) === 0 || m.pricing.completion === "0");

                if (id.endsWith(":free") || isZeroPrice || checkIsFree(m, "openrouter")) {
                  freeModels.add(val);
                }
              }
            }
          } catch (err) {
            console.warn("[FreeComboSync] OpenRouter free models fetch failed:", err.message);
          }
        }
      }
    }

    const finalModels = Array.from(freeModels);
    lastDiscoveredFreeModels = finalModels;
    return finalModels;
  } catch (error) {
    console.error("[FreeComboSync] Error gathering free models:", error);
    return Array.from(freeModels);
  }
}

/**
 * Scan active connections and gather models matching a specific category (and optionally freeOnly).
 * @param {string} category - "all" | "free" | "coding" | "agent" | "chat" | "image" | "voice"
 * @param {Object} options - { freeOnly: boolean }
 */
export async function getAvailableModelsByCategory(category = "all", options = {}) {
  const { freeOnly = false } = options;
  if (category === "free" || (freeOnly && category === "all")) {
    return getAvailableFreeModels();
  }

  const result = new Set();
  try {
    const [connections, disabled, customModels, providerNodes, modelAliases, failedModelSet] = await Promise.all([
      getProviderConnections().catch(() => []),
      getDisabledModels().catch(() => ({})),
      getCustomModels().catch(() => []),
      getProviderNodes().catch(() => []),
      getModelAliases().catch(() => ({})),
      getFailedModelSet(),
    ]);

    const activeConns = Array.isArray(connections) ? connections.filter((c) => c && c.isActive !== false) : [];

    for (const conn of activeConns) {
      const providerId = conn?.provider;
      if (!providerId) continue;

      const alias = getProviderAlias(providerId) || providerId;
      const isCustom =
        isOpenAICompatibleProvider(providerId) ||
        providerId.startsWith("openai-compatible") ||
        providerId.startsWith("anthropic-compatible");

      const provDisabled = new Set([
        ...(disabled[alias] || []),
        ...(disabled[providerId] || []),
      ]);

      const explicitEnabled =
        Array.isArray(conn.providerSpecificData?.enabledModels) && conn.providerSpecificData.enabledModels.length > 0
          ? new Set(conn.providerSpecificData.enabledModels)
          : null;

      if (isCustom) {
        const matchedNode = Array.isArray(providerNodes) ? providerNodes.find((n) => n.id === providerId) : null;
        const nodePrefix = conn.providerSpecificData?.prefix || matchedNode?.prefix || providerId;

        if (Array.isArray(customModels)) {
          for (const cm of customModels) {
            if (cm?.providerAlias === providerId || cm?.providerAlias === nodePrefix) {
              const val = `${nodePrefix}/${cm.id}`;
              if (provDisabled.has(cm.id) || provDisabled.has(val)) continue;
              if (explicitEnabled && !explicitEnabled.has(cm.id) && !explicitEnabled.has(val)) continue;
              if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(cm.id.toLowerCase())) continue;

              const isFree = checkIsFree(cm, providerId);
              if (freeOnly && !isFree) continue;

              if (matchesModelCategory(cm, category, { isFree, providerId })) {
                result.add(val);
              }
            }
          }
        }

        if (modelAliases && typeof modelAliases === "object") {
          for (const [aliasName, fullModel] of Object.entries(modelAliases)) {
            if (fullModel?.startsWith(`${providerId}/`)) {
              const modelId = fullModel.replace(`${providerId}/`, "");
              const val = `${nodePrefix}/${modelId}`;
              if (provDisabled.has(modelId) || provDisabled.has(val)) continue;
              if (explicitEnabled && !explicitEnabled.has(modelId) && !explicitEnabled.has(val)) continue;
              if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(modelId.toLowerCase())) continue;

              const isFree = checkIsFree({ id: modelId, name: aliasName }, providerId);
              if (freeOnly && !isFree) continue;

              if (matchesModelCategory({ id: modelId, name: aliasName }, category, { isFree, providerId })) {
                result.add(val);
              }
            }
          }
        }
      } else {
        // Standard provider hardcoded models
        let hardcoded = [];
        try {
          hardcoded = getModelsByProviderId(providerId) || [];
        } catch {
          hardcoded = [];
        }

        for (const m of hardcoded) {
          if (!m?.id) continue;
          const val = `${alias}/${m.id}`;
          if (provDisabled.has(m.id) || provDisabled.has(val)) continue;
          if (explicitEnabled && !explicitEnabled.has(m.id) && !explicitEnabled.has(val)) continue;
          if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(m.id.toLowerCase())) continue;

          const isFree = checkIsFree(m, providerId);
          if (freeOnly && !isFree) continue;

          if (matchesModelCategory(m, category, { isFree, providerId })) {
            result.add(val);
          }
        }

        if (Array.isArray(customModels)) {
          for (const cm of customModels) {
            if (cm?.providerAlias === alias || cm?.providerAlias === providerId) {
              const val = `${alias}/${cm.id}`;
              if (provDisabled.has(cm.id) || provDisabled.has(val)) continue;
              if (explicitEnabled && !explicitEnabled.has(cm.id) && !explicitEnabled.has(val)) continue;
              if (failedModelSet.has(val.toLowerCase()) || failedModelSet.has(cm.id.toLowerCase())) continue;

              const isFree = checkIsFree(cm, providerId);
              if (freeOnly && !isFree) continue;

              if (matchesModelCategory(cm, category, { isFree, providerId })) {
                result.add(val);
              }
            }
          }
        }
      }
    }

    return Array.from(result);
  } catch (error) {
    console.error(`[FreeComboSync] Error gathering models for category ${category}:`, error);
    return Array.from(result);
  }
}

/**
 * Sync all combos that have autoSyncFree enabled or autoSyncCategory configured.
 * Automatically purges failed/disconnected models and appends fresh healthy models.
 */
export async function syncAllFreeCombos() {
  if (syncInProgress) return { running: true };
  syncInProgress = true;

  try {
    console.log("[FreeComboSync] Starting daily model sync...");
    const [combos, connections, failedModelSet] = await Promise.all([
      getCombos(),
      getProviderConnections().catch(() => []),
      getFailedModelSet(),
    ]);

    const activeConns = Array.isArray(connections) ? connections.filter((c) => c && c.isActive !== false) : [];
    const activeProviderKeys = new Set(
      activeConns.flatMap((c) => [c.provider, getProviderAlias(c.provider), c.providerSpecificData?.prefix].filter(Boolean))
    );

    // Target combos with autoSyncFree or autoSyncCategory
    const targetCombos = combos.filter((c) => c.autoSyncFree === true || Boolean(c.autoSyncCategory));
    const updated = [];

    // Cache discovered models per category
    const categoryCache = {};

    for (const combo of targetCombos) {
      const existingModels = combo.models || [];
      const cat = combo.autoSyncCategory || "free";
      const freeOnly = combo.autoSyncFree !== false;

      const cacheKey = `${cat}:${freeOnly}`;
      if (!categoryCache[cacheKey]) {
        categoryCache[cacheKey] = await getAvailableModelsByCategory(cat, { freeOnly });
      }
      const poolModels = categoryCache[cacheKey] || [];

      // 1. Purge any models that are failed or whose provider is disconnected
      const validModels = existingModels.filter((m) => {
        if (!m || typeof m !== "string") return false;
        if (failedModelSet.has(m.toLowerCase())) return false;

        const parts = m.split("/");
        if (parts.length > 1) {
          const prov = parts[0];
          const provId = resolveProviderId(prov) || prov;
          // Must belong to an active provider connection
          if (!activeProviderKeys.has(prov) && !activeProviderKeys.has(provId)) {
            return false;
          }
        }
        return true;
      });

      // 2. Append new discovered healthy models
      const existingSet = new Set(validModels);
      const newModels = [...validModels];

      for (const m of poolModels) {
        if (!existingSet.has(m) && !failedModelSet.has(m.toLowerCase())) {
          newModels.push(m);
          existingSet.add(m);
        }
      }

      // 3. Update combo if models changed (either added or failed models removed)
      const hasChanged =
        newModels.length !== existingModels.length ||
        newModels.some((m, idx) => m !== existingModels[idx]);

      if (hasChanged) {
        await updateCombo(combo.id, { models: newModels });
        updated.push({
          id: combo.id,
          name: combo.name,
          category: cat,
          oldCount: existingModels.length,
          newCount: newModels.length,
          purgedCount: existingModels.length - validModels.length,
        });
      }
    }

    lastSyncTimestamp = new Date().toISOString();
    console.log(
      `[FreeComboSync] Sync complete. Discovered ${freeModels.length} free models, updated ${updated.length} combo(s).`
    );

    return {
      success: true,
      timestamp: lastSyncTimestamp,
      totalFreeModels: freeModels.length,
      updatedCombos: updated,
      freeModels,
    };
  } catch (error) {
    console.error("[FreeComboSync] Sync error:", error);
    return { success: false, error: error.message };
  } finally {
    syncInProgress = false;
  }
}

export function getFreeSyncState() {
  return {
    lastSyncTimestamp,
    modelsCount: lastDiscoveredFreeModels.length,
    freeModels: lastDiscoveredFreeModels,
    syncInProgress,
  };
}

/**
 * Start the 24h background scheduler to ensure free combos are always fresh.
 */
export function startFreeComboSyncScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Run initial sync after a short delay (15s) so server boot completes cleanly
  setTimeout(() => {
    syncAllFreeCombos().catch((e) => console.warn("[FreeComboSync] Initial sync failed:", e.message));
  }, 15000);

  // Daily interval: 24 hours (86,400,000 ms)
  const DAY_MS = 24 * 60 * 60 * 1000;
  const interval = setInterval(() => {
    syncAllFreeCombos().catch((e) => console.warn("[FreeComboSync] Daily tick failed:", e.message));
  }, DAY_MS);

  if (interval.unref) interval.unref();
}
