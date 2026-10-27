// Public surface of the model-intelligence subsystem.

export { DEFAULT_INTELLIGENCE_CONFIG, getIntelConfig, updateIntelConfig, sanitizeIntelConfig } from "./config.js";
export { getAdapterFor, listAdapterIds, hasAdapterFor } from "./adapters/index.js";
export { openrouterAdapter, parseOpenRouterModels, OPENROUTER_MODELS_URL } from "./adapters/openrouter.js";
export { parseOpenAICompatibleModels } from "./adapters/openaiCompatible.js";
export { syncCatalog, startCatalogSyncScheduler, stopCatalogSyncScheduler, getSyncRuntimeState } from "./sync.js";
export { classifyFreeTier, FREE_STATUS, isFreeMarker } from "./freeTier.js";
export { classifyError, isModelScoped, scopeForCategory, CATEGORY, SCOPE, explainNonModelScope } from "./classify.js";
export { evaluateRun, backoffCooldownMs, cooldownExpired, autoRetestAllowed, healthForOverride } from "./state.js";
export { runModelTests, runRecoverySweep, canTestRow, describeRow, startTestScheduler, stopTestScheduler, getTestRuntimeState } from "./runner.js";
export { setModelOverride, restoreModel, restoreAllQuarantined, listRecoverable, sanitizeOverride } from "./override.js";
export {
  enrichRow, applyFilters, sortModels, isEligibleForModelsList, pickFallback,
  assertFreeOnlySafe, summarizeModels, FILTER, FILTER_VALUES,
} from "./selection.js";
export { HEALTH, HEALTH_VALUES, OVERRIDE } from "@/lib/db/repos/modelIntelRepo.js";
