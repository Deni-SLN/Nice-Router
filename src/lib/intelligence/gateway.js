// /v1/models eligibility gate.
//
// Suppression only. A quarantined model is hidden from the default list and
// stays fully routable by explicit id, so an agent that already has
// "openrouter/some-model:free" configured keeps working while the model is
// being retested. Nothing is deleted.
//
// Fail-open by design: if the intelligence layer cannot answer (DB down,
// migration not applied), the list is returned untouched. A broken health
// feature must never take /v1/models — and therefore every agent using it —
// offline.

import { getIntelMap } from "@/lib/db/repos/modelIntelRepo.js";
import { isEligibleForModelsList } from "./selection.js";
import { getIntelConfig } from "./config.js";
import { PROVIDER_ID_TO_ALIAS } from "open-sse/config/providerModels.js";

// provider id -> alias, inverted once. /v1/models publishes ids under the
// connection's output alias while intelligence rows are keyed by provider id.
let aliasToProviderId = null;
function providerIdForAlias(alias) {
  if (!aliasToProviderId) {
    aliasToProviderId = {};
    for (const [id, alias2] of Object.entries(PROVIDER_ID_TO_ALIAS || {})) {
      aliasToProviderId[alias2] = id;
    }
  }
  return aliasToProviderId[alias] || alias;
}

/**
 * @param {Array<{id: string, owned_by?: string}>} models  entries from buildModelsList
 * @param {object} [options] { includeAll?: boolean, hideFailed?: boolean }
 * @returns {Promise<{ models: Array, suppressed: number, reason?: string }>}
 */
export async function applyModelsListEligibility(models, options = {}) {
  const includeAll = options.includeAll === true;
  if (includeAll) return { models, suppressed: 0 };

  let config;
  try {
    config = await getIntelConfig();
  } catch (error) {
    return { models, suppressed: 0, reason: `config unavailable: ${error?.message}` };
  }
  if (config.enabled === false || config.hideFailedFromModelsList === false) {
    return { models, suppressed: 0 };
  }

  let index;
  try {
    const intel = await getIntelMap();
    // Look a model up by provider id and by alias; ids arriving from different
    // callers spell the prefix differently.
    index = new Map();
    for (const row of intel.values()) {
      index.set(row.id, row);
      const alias = PROVIDER_ID_TO_ALIAS?.[row.provider];
      if (alias && alias !== row.provider) index.set(`${alias}/${row.model}`, row);
    }
  } catch (error) {
    return { models, suppressed: 0, reason: `intel unavailable: ${error?.message}` };
  }
  if (!index.size) return { models, suppressed: 0 };

  const kept = [];
  let suppressed = 0;
  for (const model of models) {
    if (!model?.id) continue;
    const slash = model.id.indexOf("/");
    if (slash <= 0) {
      // Combos and virtual entries carry no provider prefix — always eligible.
      kept.push(model);
      continue;
    }
    const alias = model.id.slice(0, slash);
    const modelId = model.id.slice(slash + 1);
    const row = index.get(model.id)
      || index.get(`${providerIdForAlias(alias)}/${modelId}`);
    if (isEligibleForModelsList(row, { hideFailed: config.hideFailedFromModelsList })) {
      kept.push(model);
    } else {
      suppressed++;
    }
  }
  return { models: kept, suppressed };
}

/**
 * Administrative request for the full catalog. Deliberately narrow:
 *   ?full=1 / ?full=true   on /v1/models, or
 *   an API key whose access.allow includes "models:all"
 */
export function wantsFullCatalog(request) {
  const url = request?.url;
  if (!url) return false;
  try {
    const value = new URL(url).searchParams.get("full");
    return value === "1" || value === "true";
  } catch {
    return false;
  }
}
