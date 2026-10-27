"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardSkeleton, Input, Select, Toggle } from "@/shared/components";
import { useNotificationStore } from "@/store/notificationStore";
import { useHeaderSearchStore } from "@/store/headerSearchStore";

const HEALTH_VARIANT = {
  PASS: "success",
  DEGRADED: "warning",
  FAIL: "error",
  UNKNOWN: "default",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Models" },
  { value: "freeFirst", label: "Free First" },
  { value: "freeOnly", label: "Free Only" },
  { value: "paidOnly", label: "Paid Only" },
  { value: "healthyOnly", label: "Healthy Only" },
];

const CONTEXT_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 32000, label: "32k+" },
  { value: 128000, label: "128k+" },
  { value: 200000, label: "200k+" },
  { value: 1000000, label: "1M+" },
];

function formatDateTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function relative(value) {
  if (!value) return "never";
  const then = Date.parse(value);
  if (!Number.isFinite(then)) return "never";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

function formatLatency(value) {
  return Number.isFinite(value) ? `${Math.round(value)}ms` : "—";
}

function Stat({ label, value, tone }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-lg font-semibold ${tone || "text-text"}`}>{value}</span>
    </div>
  );
}

export default function ModelIntelPage() {
  const [models, setModels] = useState([]);
  const [summary, setSummary] = useState(null);
  const [config, setConfig] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);

  const [filters, setFilters] = useState({
    filter: "all",
    health: "",
    provider: "",
    search: "",
    minContextWindow: 0,
    requireTools: false,
    requireVision: false,
  });

  const notify = useNotificationStore();
  const setHeaderQuery = useHeaderSearchStore((s) => s.setQuery);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/model-intel?includeMissing=0&limit=5000", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary || null);
      setConfig(data.config || null);
      setLastSync(data.sync?.lastRun || null);
      setProgress(data.tests?.progress || null);
      setModels(data.models || []);
    } catch (error) {
      notify.error(`Failed to load model intelligence: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadDiagnostics = useCallback(async () => {
    try {
      const res = await fetch("/api/model-intel/diagnostics", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDiagnostics(data.models || []);
    } catch (error) {
      notify.error(`Failed to load diagnostics: ${error.message}`);
    }
  }, [notify]);

  useEffect(() => {
    // Cancellation rather than a bare call: the first load has no request to
    // abort, but a remount mid-flight must not set state on a dead component.
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    };
    run();
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    setHeaderQuery(filters.search);
  }, [filters.search, setHeaderQuery]);

  // Poll while a long-running action is in flight so the progress bar moves.
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [busy, load]);

  const providers = useMemo(
    () => Array.from(new Set(models.map((m) => m.provider))).sort(),
    [models]
  );

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    let out = models;
    if (filters.provider) out = out.filter((m) => m.provider === filters.provider);
    if (filters.health) out = out.filter((m) => m.health === filters.health);
    if (filters.requireTools) out = out.filter((m) => m.capabilities?.tools);
    if (filters.requireVision) out = out.filter((m) => m.capabilities?.vision);
    if (filters.minContextWindow > 0) {
      out = out.filter((m) => (m.capabilities?.contextWindow || 0) >= filters.minContextWindow);
    }
    if (filters.filter === "freeOnly") out = out.filter((m) => m.free === "free");
    if (filters.filter === "paidOnly") out = out.filter((m) => m.free !== "free");
    if (filters.filter === "healthyOnly") {
      out = out.filter((m) => m.health === "PASS" || m.health === "DEGRADED");
    }
    if (needle) out = out.filter((m) => `${m.id} ${m.name}`.toLowerCase().includes(needle));

    const freeRank = { free: 0, unknown: 1, paid: 2 };
    const healthRank = { PASS: 0, DEGRADED: 1, UNKNOWN: 2, FAIL: 3 };
    const freeFirst = filters.filter === "freeFirst";
    return [...out].sort((a, b) => {
      if (freeFirst && (freeRank[a.free] ?? 9) !== (freeRank[b.free] ?? 9)) {
        return (freeRank[a.free] ?? 9) - (freeRank[b.free] ?? 9);
      }
      if ((healthRank[a.health] ?? 9) !== (healthRank[b.health] ?? 9)) {
        return (healthRank[a.health] ?? 9) - (healthRank[b.health] ?? 9);
      }
      const ctxA = a.capabilities?.contextWindow ?? -1;
      const ctxB = b.capabilities?.contextWindow ?? -1;
      if (ctxA !== ctxB) return ctxB - ctxA;
      const latA = Number.isFinite(a.avgLatencyMs) ? a.avgLatencyMs : Number.MAX_SAFE_INTEGER;
      const latB = Number.isFinite(b.avgLatencyMs) ? b.avgLatencyMs : Number.MAX_SAFE_INTEGER;
      return latA - latB;
    });
  }, [models, filters]);

  const runAction = useCallback(async (label, fn) => {
    setBusy(label);
    try {
      const result = await fn();
      if (result?.status === "busy") {
        notify.warning(result.message || "Another run is already in progress");
        return;
      }
      notify.success(`${label} finished`);
      await load();
      await loadDiagnostics();
    } catch (error) {
      notify.error(`${label} failed: ${error.message}`);
    } finally {
      setBusy(null);
    }
  }, [load, loadDiagnostics, notify]);

  const handleSync = () => runAction("Sync Models", async () => {
    const res = await fetch("/api/model-intel/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "manual" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.status === "error") throw new Error(data.errors?.[0] || "sync reported errors");
    return data;
  });

  const handleTestAll = (provider) => runAction("Test All", async () => {
    const res = await fetch("/api/model-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", provider }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  });

  const handleRetestFailed = () => runAction("Retest Failed", async () => {
    const res = await fetch("/api/model-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retest-failed" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  });

  const handleRecover = () => runAction("Recovery Sweep", async () => {
    const res = await fetch("/api/model-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recover" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  });

  const handleRestore = (model) => runAction(`Restore ${model.model}`, async () => {
    const res = await fetch("/api/model-intel/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: model.provider, model: model.model, restore: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  });

  const handleOverride = (model, override) => runAction(`Override ${model.model}`, async () => {
    const res = await fetch("/api/model-intel/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: model.provider, model: model.model, override }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  });

  const handleRestoreAll = () => runAction("Restore All", async () => {
    const res = await fetch("/api/model-intel/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restoreAll: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  });

  const openHistory = useCallback(async (model) => {
    setSelected(model);
    setHistory(null);
    try {
      const res = await fetch(`/api/model-intel/diagnostics?history=${encodeURIComponent(model.id)}&limit=50`, {
        cache: "no-store",
      });
      const data = await res.json();
      setHistory(data.history?.events || []);
    } catch (error) {
      notify.error(`Failed to load history: ${error.message}`);
    }
  }, [notify]);

  const patchConfig = useCallback(async (patch) => {
    try {
      const res = await fetch("/api/model-intel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConfig((await res.json()).config);
      notify.success("Configuration saved");
    } catch (error) {
      notify.error(`Failed to save configuration: ${error.message}`);
    }
  }, [notify]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Model Intelligence</h1>
          <p className="text-sm text-text-muted">
            Automatic discovery, health testing and free-first selection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSync} disabled={!!busy} icon="sync">
            {busy === "Sync Models" ? "Syncing…" : "Sync Models"}
          </Button>
          <Button onClick={() => handleTestAll()} disabled={!!busy} icon="science">
            {busy === "Test All" ? "Testing…" : "Test All"}
          </Button>
          <Button onClick={handleRetestFailed} disabled={!!busy} icon="replay">
            Retest Failed
          </Button>
          <Button onClick={handleRecover} disabled={!!busy} icon="healing">
            Recovery Sweep
          </Button>
        </div>
      </div>

      {progress && busy && (
        <Card padding="sm">
          <div className="text-sm text-text-muted">
            Testing {progress.done}/{progress.total} — {progress.tested} tested, {progress.skipped} skipped
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-bg">
            <div
              className="h-1.5 rounded-full bg-brand-500 transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </Card>
      )}

      {/* ── Counts ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <Stat label="Discovered models" value={summary?.total ?? 0} />
          <div className="mt-3 text-xs text-text-muted">
            {summary?.discovered ?? 0} auto-imported · {summary?.quarantined ?? 0} quarantined
          </div>
        </Card>
        <Card padding="md">
          <div className="flex gap-6">
            <Stat label="Healthy" value={summary?.pass ?? 0} tone="text-success-600" />
            <Stat label="Degraded" value={summary?.degraded ?? 0} tone="text-warning-600" />
          </div>
          <div className="mt-3 flex gap-4 text-xs text-text-muted">
            <span>Failed {summary?.fail ?? 0}</span>
            <span>Unknown {summary?.unknown ?? 0}</span>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex gap-6">
            <Stat label="Free" value={summary?.free ?? 0} tone="text-success-600" />
            <Stat label="Paid" value={summary?.paid ?? 0} />
          </div>
          <div className="mt-3 text-xs text-text-muted">
            {summary?.pricingUnknown ?? 0} with unknown pricing
          </div>
        </Card>
        <Card padding="md">
          <Stat label="Last sync" value={relative(lastSync?.timestamp)} />
          <div className="mt-3 text-xs text-text-muted">
            {lastSync
              ? `${lastSync.imported} imported · ${lastSync.updated} updated · ${lastSync.errorCount} errors`
              : "never synced"}
          </div>
        </Card>
      </div>

      {/* ── Diagnostics (quarantined + failed) ─────────────────────────── */}
      <Card
        title={showDiagnostics ? "Diagnostics (suppressed models)" : "Diagnostics"}
        subtitle={`${diagnostics.length} suppressed model(s) · last test ${relative(progress?.finishedAt || null)}`}
        icon="health_and_safety"
        action={(
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowDiagnostics((v) => !v)}>
              {showDiagnostics ? "Hide" : "Show"}
            </Button>
            <Button size="sm" onClick={handleRestoreAll} disabled={!!busy || diagnostics.length === 0}>
              Restore All
            </Button>
          </div>
        )}
      >
        {showDiagnostics && (
          diagnostics.length === 0 ? (
            <p className="text-sm text-text-muted">No suppressed models. Nothing is hidden from /v1/models.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-text-muted">
                  <tr>
                    <th className="py-2 pr-3">Model</th>
                    <th className="py-2 pr-3">Health</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Retest</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.map((m) => (
                    <tr key={m.id} className="border-t border-border-subtle">
                      <td className="py-2 pr-3 font-mono text-xs">{m.id}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={HEALTH_VARIANT[m.health] || "default"}>{m.health}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-xs text-text-muted">
                        {m.errorCategory || "—"}
                        {m.errorScope ? ` (${m.errorScope})` : ""}
                      </td>
                      <td className="py-2 pr-3 text-xs text-text-muted">
                        {m.autoRetestDue ? "due now" : m.quarantinedUntil ? `after ${formatDateTime(m.quarantinedUntil)}` : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <Button size="sm" onClick={() => handleRestore(m)} disabled={!!busy}>Restore</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <Card title="Filters" icon="filter_alt" padding="md">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={filters.filter}
            onChange={(e) => setFilters((f) => ({ ...f, filter: e.target.value }))}
            options={FILTER_OPTIONS}
            label="Pricing"
          />
          <Select
            value={filters.health}
            onChange={(e) => setFilters((f) => ({ ...f, health: e.target.value }))}
            options={[
              { value: "", label: "Any health" },
              { value: "PASS", label: "PASS" },
              { value: "DEGRADED", label: "DEGRADED" },
              { value: "FAIL", label: "FAIL" },
              { value: "UNKNOWN", label: "UNKNOWN" },
            ]}
            label="Health"
          />
          <Select
            value={filters.provider}
            onChange={(e) => setFilters((f) => ({ ...f, provider: e.target.value }))}
            options={[{ value: "", label: "All providers" }, ...providers.map((p) => ({ value: p, label: p }))]}
            label="Provider"
          />
          <Select
            value={String(filters.minContextWindow)}
            onChange={(e) => setFilters((f) => ({ ...f, minContextWindow: Number(e.target.value) }))}
            options={CONTEXT_OPTIONS}
            label="Min context window"
          />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search models…"
            label="Search"
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={filters.requireTools}
              onChange={(e) => setFilters((f) => ({ ...f, requireTools: e.target.checked }))}
            />
            Tool calling
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={filters.requireVision}
              onChange={(e) => setFilters((f) => ({ ...f, requireVision: e.target.checked }))}
            />
            Vision / multimodal
          </label>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Showing {visible.length} of {models.length} models. Free status comes from provider pricing
          metadata, never from a model name.
        </p>
      </Card>

      {/* ── Configuration ──────────────────────────────────────────────── */}
      {config && (
        <Card title="Schedule, testing & cost controls" icon="tune" padding="md">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-text">
              <Toggle
                checked={config.allowPaidTests === true}
                onChange={(v) => patchConfig({ allowPaidTests: v })}
              />
              Allow paid test requests
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <Toggle
                checked={config.testStreaming !== false}
                onChange={(v) => patchConfig({ testStreaming: v })}
              />
              Test streaming
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <Toggle
                checked={config.testToolCalling !== false}
                onChange={(v) => patchConfig({ testToolCalling: v })}
              />
              Test tool calling
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <Toggle
                checked={config.hideFailedFromModelsList !== false}
                onChange={(v) => patchConfig({ hideFailedFromModelsList: v })}
              />
              Hide failed models from /v1/models
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <Toggle
                checked={config.syncEnabled !== false}
                onChange={(v) => patchConfig({ syncEnabled: v })}
              />
              Scheduled catalog sync
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <Toggle
                checked={config.testEnabled !== false}
                onChange={(v) => patchConfig({ testEnabled: v })}
              />
              Scheduled model testing
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input
              type="number"
              min={1}
              max={16}
              value={config.testConcurrency}
              onChange={(e) => patchConfig({ testConcurrency: Number(e.target.value) })}
              label="Test concurrency"
            />
            <Input
              type="number"
              min={1000}
              step={1000}
              value={config.testTimeoutMs}
              onChange={(e) => patchConfig({ testTimeoutMs: Number(e.target.value) })}
              label="Timeout (ms)"
            />
            <Input
              type="number"
              min={0}
              max={5}
              value={config.testRetries}
              onChange={(e) => patchConfig({ testRetries: Number(e.target.value) })}
              label="Retries"
            />
            <Input
              type="number"
              min={1}
              max={20}
              value={config.failureThreshold}
              onChange={(e) => patchConfig({ failureThreshold: Number(e.target.value) })}
              label="Failures before suppression"
            />
            <Input
              type="number"
              min={1}
              max={10}
              value={config.recoveryPasses}
              onChange={(e) => patchConfig({ recoveryPasses: Number(e.target.value) })}
              label="Passes before restore"
            />
            <Input
              type="number"
              min={0}
              step={60000}
              value={config.cooldownMs}
              onChange={(e) => patchConfig({ cooldownMs: Number(e.target.value) })}
              label="Cooldown (ms)"
            />
          </div>
          {!config.allowPaidTests && (
            <p className="mt-3 text-xs text-warning-600">
              Paid test requests are disabled. Models with paid or unknown pricing are skipped rather
              than billed.
            </p>
          )}
        </Card>
      )}

      {/* ── Model list ─────────────────────────────────────────────────── */}
      <Card title={`Models (${visible.length})`} icon="list" padding="none">
        {visible.length === 0 ? (
          <div className="p-6 text-sm text-text-muted">
            No models match. Run <strong>Sync Models</strong> to import from a provider catalog.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Pricing</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Capabilities</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Last test</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 500).map((m) => (
                  <tr key={m.id} className="border-t border-border-subtle hover:bg-bg-soft">
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs">{m.id}</div>
                      <div className="text-xs text-text-muted">{m.name}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={HEALTH_VARIANT[m.health] || "default"}>{m.health}</Badge>
                      {m.healthReason && (
                        <div className="mt-0.5 max-w-[240px] truncate text-xs text-text-muted" title={m.healthReason}>
                          {m.healthReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={m.free === "free" ? "success" : "default"}>{m.free}</Badge>
                      <div className="mt-0.5 max-w-[200px] truncate text-xs text-text-muted" title={m.freeReason}>
                        {m.freeReason}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {m.capabilities?.contextWindow
                        ? `${Math.round(m.capabilities.contextWindow / 1000)}k`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {[
                        m.capabilities?.tools && "tools",
                        m.capabilities?.vision && "vision",
                        m.capabilities?.reasoning && "reasoning",
                      ].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">{formatLatency(m.avgLatencyMs)}</td>
                    <td className="px-4 py-2 text-xs text-text-muted">{relative(m.lastTestedAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => openHistory(m)}>History</Button>
                        <Button size="sm" onClick={() => handleTestAll(m.provider)}>Test</Button>
                        {m.manualOverride ? (
                          <Button size="sm" onClick={() => handleOverride(m, null)}>Clear</Button>
                        ) : (
                          <Button size="sm" onClick={() => handleOverride(m, "FORCE_FAIL")}>Disable</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <Card
          title={`History — ${selected.id}`}
          subtitle={selected.healthReason || ""}
          icon="history"
          action={<Button size="sm" onClick={() => setSelected(null)}>Close</Button>}
        >
          {!history ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-text-muted">No probe history recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-text-muted">
                  <tr>
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Health</th>
                    <th className="py-2 pr-3">Check</th>
                    <th className="py-2 pr-3">Latency</th>
                    <th className="py-2 pr-3">Retries</th>
                    <th className="py-2 pr-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((e, i) => (
                    <tr key={`${e.timestamp}-${i}`} className="border-t border-border-subtle">
                      <td className="py-2 pr-3 text-xs">{formatDateTime(e.timestamp)}</td>
                      <td className="py-2 pr-3 text-xs">{e.health}</td>
                      <td className="py-2 pr-3 text-xs">{e.check || "—"}</td>
                      <td className="py-2 pr-3 text-xs">{formatLatency(e.latencyMs)}</td>
                      <td className="py-2 pr-3 text-xs">{e.retries}</td>
                      <td className="py-2 pr-3 text-xs text-text-muted">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
