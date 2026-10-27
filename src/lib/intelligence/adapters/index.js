// Adapter registry. Adding a provider: export an adapter from its own file and
// add one line to ADAPTERS below. Nothing in sync.js, the API or the dashboard
// needs to change.

import { openrouterAdapter } from "./openrouter.js";
import { createCompatibleAdapter } from "./openaiCompatible.js";
import REGISTRY from "open-sse/providers/registry/index.js";

const ADAPTERS = new Map();

function register(adapter) {
  if (!adapter?.id || typeof adapter.fetchModels !== "function") return;
  ADAPTERS.set(adapter.id, adapter);
}

register(openrouterAdapter);
ADAPTERS.get("openrouter").providerId = "openrouter";

// Every registry entry that already declares a catalog URL gets a generic
// adapter, keyed by BOTH the provider id and its alias so config can name
// either. OpenRouter keeps its dedicated adapter above.
for (const entry of REGISTRY) {
  const fetcherUrl = entry?.modelsFetcher?.url;
  if (!fetcherUrl || typeof fetcherUrl !== "string") continue;
  if (!/^https:\/\//i.test(fetcherUrl)) continue;
  const ids = [entry.id, entry.alias].filter(Boolean);
  if (ids.some((id) => ADAPTERS.get(id)?.dedicated)) continue;
  for (const id of ids) {
    if (ADAPTERS.has(id)) continue;
    register(createCompatibleAdapter({
      id,
      providerId: entry.id,
      url: fetcherUrl,
      label: entry.display?.name || entry.id,
      headers: entry.modelsFetcher?.headers,
    }));
  }
}

// Mark the hand-written ones so the generic pass above can never shadow them.
ADAPTERS.get("openrouter").dedicated = true;

export function getAdapterFor(providerId) {
  if (!providerId) return null;
  if (ADAPTERS.has(providerId)) return ADAPTERS.get(providerId);
  return null;
}

export function hasAdapterFor(providerId) {
  return getAdapterFor(providerId) !== null;
}

/** Ids usable in config's `providers` map. */
export function listAdapterIds() {
  return Array.from(ADAPTERS.keys()).sort();
}

/**
 * The provider id an adapter's discovered models are filed under. This is the
 * id requests arrive with (`provider/model`), NOT the alias a client may use in
 * a URL — conflating the two would file OpenCode's models under "oc".
 */
export function providerIdForAdapter(adapterId) {
  return ADAPTERS.get(adapterId)?.providerId || adapterId;
}
