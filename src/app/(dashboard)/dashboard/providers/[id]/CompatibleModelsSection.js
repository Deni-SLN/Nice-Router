"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, CapacityBadges } from "@/shared/components";
import { getProviderCustomModelRows } from "@/shared/utils/providerCustomModels";

function checkModelIsFree(model) {
  if (!model) return false;
  if (model.isFree === true) return true;
  const id = (model.id || "").toLowerCase();
  const name = (model.name || "").toLowerCase();
  if (id.endsWith(":free") || id.includes(":free/") || id.includes("/free") || id.includes("-free")) return true;
  if (name.includes("free") || name.includes("gratis") || name.includes("🆓")) return true;
  if (id.includes("flash") || id.includes("lite")) return true;
  return false;
}

function CompatibleModelRow({
  modelId,
  name,
  fullModel,
  copied,
  onCopy,
  onDelete,
  onTest,
  testStatus,
  isTesting,
  isHidden,
  onToggleHidden,
  isFree,
  caps,
}) {
  const borderColor = isHidden
    ? "border-border/40 opacity-60 bg-surface/30"
    : testStatus === "ok"
    ? "border-emerald-500/40 bg-emerald-500/5"
    : testStatus === "error"
    ? "border-red-500/40 bg-red-500/5"
    : "border-border bg-surface/60 hover:bg-surface-2";

  const iconColor = testStatus === "ok"
    ? "#10b981"
    : testStatus === "error"
    ? "#ef4444"
    : undefined;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${borderColor}`}>
      <span
        className="material-symbols-outlined text-base text-text-muted"
        style={iconColor ? { color: iconColor } : undefined}
      >
        {testStatus === "ok" ? "check_circle" : testStatus === "error" ? "cancel" : "smart_toy"}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <p className="text-sm font-medium truncate text-text-main" title={modelId}>{modelId}</p>
          {isFree && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
              Gratis
            </span>
          )}
          {isHidden && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-500/20 text-text-muted shrink-0">
              Tersembunyi
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1 min-w-0 flex-wrap">
          <code className="text-xs text-text-muted font-mono bg-sidebar px-1.5 py-0.5 rounded truncate max-w-[180px] sm:max-w-[240px]" title={fullModel}>
            {fullModel}
          </code>
          {caps && <CapacityBadges caps={caps} colorOverride="text-text-muted/70" size={12} />}
          <div className="relative group/btn shrink-0">
            <button
              onClick={() => onCopy(fullModel, `model-${modelId}`)}
              className="p-1 hover:bg-sidebar rounded text-text-muted hover:text-primary transition-colors cursor-pointer"
              title="Salin model ID"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied === `model-${modelId}` ? "check" : "content_copy"}
              </span>
            </button>
            <span className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-text-muted whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity bg-surface px-1 py-0.5 rounded border border-border shadow-sm">
              {copied === `model-${modelId}` ? "Tersalin!" : "Salin"}
            </span>
          </div>

          {onTest && (
            <div className="relative group/btn shrink-0">
              <button
                onClick={onTest}
                disabled={isTesting}
                className="p-1 hover:bg-sidebar rounded text-text-muted hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                title="Uji model ini"
              >
                <span
                  className="material-symbols-outlined text-[15px]"
                  style={isTesting ? { animation: "spin 1s linear infinite" } : undefined}
                >
                  {isTesting ? "progress_activity" : "science"}
                </span>
              </button>
              <span className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-text-muted whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity bg-surface px-1 py-0.5 rounded border border-border shadow-sm">
                {isTesting ? "Menguji..." : "Uji model"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onToggleHidden && (
          <button
            onClick={onToggleHidden}
            className="p-1.5 hover:bg-surface-2 rounded-lg text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title={isHidden ? "Tampilkan model" : "Sembunyikan model"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isHidden ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors cursor-pointer"
            title="Hapus model"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CompatibleModelsSection({
  providerId,
  providerName,
  providerStorageAlias,
  providerDisplayAlias,
  modelAliases,
  customModels = [],
  builtInModels = [],
  copied,
  onCopy,
  onSetAlias,
  onDeleteAlias,
  onAddCustomModel,
  onDeleteCustomModel,
  connections = [],
  isAnthropic,
  disabledModelIds = [],
  onDisableModel,
  onEnableModel,
  onDisableAll,
  onEnableAll,
  fetchCustomModels,
  getCaps,
}) {
  const [newModel, setNewModel] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testingModelId, setTestingModelId] = useState(null);
  const [modelTestResults, setModelTestResults] = useState({});

  // Filter & Toolbar States
  const [searchFilter, setSearchFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // 'all' | 'visible' | 'hidden'
  const [tierFilter, setTierFilter] = useState("all"); // 'all' | 'free' | 'paid'
  const [freeFirst, setFreeFirst] = useState(false);
  const [autoHideFailed, setAutoHideFailed] = useState(true);

  // Auto-Fetch & Auto-Sync Switches
  const [autoFetchUpstream, setAutoFetchUpstream] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  // Batch Testing
  const [isTestingBatch, setIsTestingBatch] = useState(false);
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0 });
  const testCancelRef = useRef(false);

  // Build complete list of models for this provider
  const allModels = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Built-in models (if any)
    for (const m of builtInModels) {
      if (!m?.id || seenIds.has(m.id)) continue;
      const isFree = checkModelIsFree(m);
      list.push({
        id: m.id,
        name: m.name || m.id,
        fullModel: `${providerDisplayAlias}/${m.id}`,
        source: "builtin",
        isFree,
      });
      seenIds.add(m.id);
    }

    // 2. Custom/imported models
    const customRows = getProviderCustomModelRows({
      customModels,
      modelAliases,
      providerAlias: providerStorageAlias,
      builtInModels,
      type: "llm",
    });

    for (const m of customRows) {
      if (!m?.id || seenIds.has(m.id)) continue;
      const isFree = checkModelIsFree(m);
      list.push({
        id: m.id,
        name: m.name || m.id,
        fullModel: `${providerDisplayAlias}/${m.id}`,
        source: m.source,
        alias: m.alias,
        isFree,
      });
      seenIds.add(m.id);
    }

    return list;
  }, [builtInModels, customModels, modelAliases, providerDisplayAlias, providerStorageAlias]);

  // Apply filters & sort
  const filteredModels = useMemo(() => {
    let result = allModels.filter((m) => {
      const isHidden = disabledModelIds.includes(m.id);

      // Search filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        if (!m.id.toLowerCase().includes(query) && !m.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Visibility filter
      if (visibilityFilter === "visible" && isHidden) return false;
      if (visibilityFilter === "hidden" && !isHidden) return false;

      // Tier filter
      if (tierFilter === "free" && !m.isFree) return false;
      if (tierFilter === "paid" && m.isFree) return false;

      return true;
    });

    // Free first sort
    if (freeFirst) {
      result = [...result].sort((a, b) => {
        if (a.isFree === b.isFree) return 0;
        return a.isFree ? -1 : 1;
      });
    }

    return result;
  }, [allModels, disabledModelIds, freeFirst, searchFilter, tierFilter, visibilityFilter]);

  const activeCount = useMemo(() => {
    return allModels.filter((m) => !disabledModelIds.includes(m.id)).length;
  }, [allModels, disabledModelIds]);

  // Test single model
  const handleTestModel = async (modelId) => {
    if (testingModelId) return;
    setTestingModelId(modelId);
    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: `${providerStorageAlias}/${modelId}` }),
      });
      const data = await res.json();
      const ok = data.ok === true;
      setModelTestResults((prev) => ({ ...prev, [modelId]: ok ? "ok" : "error" }));

      if (!ok && autoHideFailed && onDisableModel) {
        onDisableModel(modelId);
      }
    } catch {
      setModelTestResults((prev) => ({ ...prev, [modelId]: "error" }));
      if (autoHideFailed && onDisableModel) {
        onDisableModel(modelId);
      }
    } finally {
      setTestingModelId(null);
    }
  };

  // Batch Test All Models with progress
  const handleTestAllModels = async () => {
    if (isTestingBatch || filteredModels.length === 0) return;
    testCancelRef.current = false;
    setIsTestingBatch(true);

    const modelsToTest = filteredModels.filter((m) => !disabledModelIds.includes(m.id));
    setTestProgress({ current: 0, total: modelsToTest.length });

    const concurrency = 3;
    let index = 0;

    const worker = async () => {
      while (index < modelsToTest.length) {
        if (testCancelRef.current) break;
        const current = modelsToTest[index++];
        if (!current) break;

        try {
          const res = await fetch("/api/models/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: `${providerStorageAlias}/${current.id}` }),
          });
          const data = await res.json();
          const ok = data.ok === true;
          setModelTestResults((prev) => ({ ...prev, [current.id]: ok ? "ok" : "error" }));

          if (!ok && autoHideFailed && onDisableModel) {
            onDisableModel(current.id);
          }
        } catch {
          setModelTestResults((prev) => ({ ...prev, [current.id]: "error" }));
          if (autoHideFailed && onDisableModel) {
            onDisableModel(current.id);
          }
        } finally {
          setTestProgress((prev) => ({
            ...prev,
            current: Math.min(prev.current + 1, prev.total),
          }));
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, worker));
    setIsTestingBatch(false);
  };

  const handleCancelTestAll = () => {
    testCancelRef.current = true;
    setIsTestingBatch(false);
  };

  // Add manual model
  const handleAdd = async () => {
    if (!newModel.trim() || adding) return;
    const modelId = newModel.trim();
    if (allModels.some((model) => model.id === modelId)) {
      alert("Model sudah ada pada penyedia ini.");
      return;
    }

    setAdding(true);
    try {
      await onAddCustomModel(modelId);
      setNewModel("");
    } catch (error) {
      console.log("Error adding model:", error);
    } finally {
      setAdding(false);
    }
  };

  // Import models from upstream /models
  const handleImport = async () => {
    if (importing) return;
    const activeConnection = connections.find((conn) => conn.isActive !== false);
    if (!activeConnection) {
      alert("Silakan hubungkan akun/koneksi aktif terlebih dahulu sebelum mengimpor model.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch(`/api/providers/${activeConnection.id}/models`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengimpor model dari endpoint.");
        return;
      }
      const models = data.models || [];
      if (models.length === 0) {
        alert("Tidak ada model yang dikembalikan dari titik akhir /models.");
        return;
      }

      // Batch save new models
      const newModels = [];
      const seenExisting = new Set(allModels.map((m) => m.id));

      for (const m of models) {
        const id = m.id || m.name || m.model;
        if (!id || seenExisting.has(id)) continue;
        newModels.push({
          providerAlias: providerStorageAlias,
          id,
          name: m.name || id,
          type: "llm",
        });
        seenExisting.add(id);
      }

      if (newModels.length === 0) {
        alert("Semua model sudah ada di daftar. Tidak ada model baru yang ditambahkan.");
        return;
      }

      // Send batch POST to /api/models/custom
      const batchRes = await fetch("/api/models/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: newModels }),
      });

      if (batchRes.ok) {
        if (fetchCustomModels) await fetchCustomModels();
        alert(`Berhasil mengimpor ${newModels.length} model baru dari upstream!`);
      } else {
        alert("Gagal menyimpan model yang diimpor ke database.");
      }
    } catch (error) {
      console.log("Error importing models:", error);
      alert("Terjadi kesalahan saat mengimpor model: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  // Clear all custom models for this provider
  const handleClearAllModels = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus semua model kustom/impor untuk penyedia ini?")) {
      return;
    }
    try {
      const res = await fetch(`/api/models/custom?providerAlias=${encodeURIComponent(providerStorageAlias)}&all=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (fetchCustomModels) await fetchCustomModels();
        alert("Semua model kustom berhasil dihapus.");
      }
    } catch (err) {
      console.log("Error clearing models:", err);
    }
  };

  const canImport = connections.some((conn) => conn.isActive !== false);
  const isSpecialOpenRouter = providerId === "openrouter" || providerStorageAlias === "openrouter";

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Top Options Bar (Sync & Clear) */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className={`size-2.5 rounded-full ${autoFetchUpstream ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-400"}`} />
            <span className="font-medium text-text-main">Ambil model upstream secara otomatis</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={autoFetchUpstream}
              onChange={(e) => setAutoFetchUpstream(e.target.checked)}
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className={`size-2.5 rounded-full ${autoSync ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-400"}`} />
            <span className="font-medium text-text-main">Sinkronisasi Otomatis</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
          </label>
        </div>

        <button
          onClick={handleClearAllModels}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/30 text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Hapus semua model kustom"
        >
          <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
          Hapus Semua Model
        </button>
      </div>

      {/* 2. Model Hint / Description */}
      <p className="text-xs text-text-muted">
        {isSpecialOpenRouter
          ? "OpenRouter mendukung model apa pun. Tambahkan model dan buat alias untuk akses cepat, atau klik Impor dari /models."
          : `${providerName || providerDisplayAlias} mendukung model bawaan dan kustom. Tambahkan model secara manual atau klik Impor dari /models untuk mengambil model upstream terbaru.`}
      </p>

      {/* 3. Input & Import Actions */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <label htmlFor="new-compatible-model-input" className="text-xs text-text-muted mb-1 block">
            ID Model (dari {providerName || (isSpecialOpenRouter ? "OpenRouter" : "Penyedia")})
          </label>
          <input
            id="new-compatible-model-input"
            type="text"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={isSpecialOpenRouter ? "anthropic/claude-3-opus" : "Contoh: gpt-4o, gemini-2.5-flash, deepseek-chat..."}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <Button size="sm" icon="add" onClick={handleAdd} disabled={!newModel.trim() || adding}>
          {adding ? "Menambahkan..." : "Tambahkan"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon="download"
          onClick={handleImport}
          disabled={!canImport || importing}
        >
          {importing ? "Mengimpor..." : "Impor dari /models"}
        </Button>
      </div>

      {!canImport && (
        <p className="text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
          Tambahkan dan aktifkan koneksi akun terlebih dahulu untuk mengimpor model dari upstream.
        </p>
      )}

      {/* 4. Filter & Batch Toolbar (matching OmniRoute) */}
      <div className="rounded-xl border border-border/70 bg-surface/40 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search input */}
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <span className="material-symbols-outlined text-[16px] text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter model..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background/80 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {/* Center: Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visibility pills */}
          <div className="flex rounded-lg border border-border bg-background/50 p-0.5">
            <button
              onClick={() => setVisibilityFilter("all")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${visibilityFilter === "all" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setVisibilityFilter("visible")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${visibilityFilter === "visible" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              Hanya yang terlihat
            </button>
            <button
              onClick={() => setVisibilityFilter("hidden")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${visibilityFilter === "hidden" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              Hanya yang tersembunyi
            </button>
          </div>

          {/* Pricing pills */}
          <div className="flex rounded-lg border border-border bg-background/50 p-0.5">
            <button
              onClick={() => setTierFilter("all")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${tierFilter === "all" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setTierFilter("free")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${tierFilter === "free" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              Hanya gratis
            </button>
            <button
              onClick={() => setTierFilter("paid")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${tierFilter === "paid" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}
            >
              Hanya berbayar
            </button>
          </div>

          {/* Free first sort toggle */}
          <button
            onClick={() => setFreeFirst((v) => !v)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors cursor-pointer text-[11px] font-medium ${freeFirst ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border text-text-muted hover:text-text-main"}`}
            title="Urutkan model gratis di urutan teratas"
          >
            <span className="material-symbols-outlined text-[14px]">sort</span>
            Gratis terlebih dahulu
          </button>

          {/* Auto-hide failed checkbox */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-text-muted hover:text-text-main select-none">
            <input
              type="checkbox"
              checked={autoHideFailed}
              onChange={(e) => setAutoHideFailed(e.target.checked)}
              className="accent-primary size-3.5 rounded"
            />
            <span>Sembunyikan otomatis model yang gagal</span>
          </label>
        </div>

        {/* Right: Actions & Counters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Batch Test or Progress */}
          {isTestingBatch ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 font-medium">
              <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
              <span>Menguji {testProgress.current}/{testProgress.total}...</span>
              <button
                onClick={handleCancelTestAll}
                className="ml-1 text-[10px] text-red-400 hover:underline cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={handleTestAllModels}
              disabled={filteredModels.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              title="Uji semua model yang terlihat"
            >
              <span className="material-symbols-outlined text-[15px]">play_arrow</span>
              Uji Semua
            </button>
          )}

          {/* Bulk Visibility Actions */}
          {onEnableAll && (
            <button
              onClick={onEnableAll}
              className="px-2 py-1 rounded border border-border bg-background hover:bg-surface-2 text-text-main transition-colors cursor-pointer text-[11px]"
              title="Tampilkan semua model"
            >
              Semua
            </button>
          )}

          {onDisableAll && (
            <button
              onClick={() => onDisableAll(filteredModels.map((m) => m.id))}
              className="px-2 py-1 rounded border border-border bg-background hover:bg-surface-2 text-text-main transition-colors cursor-pointer text-[11px]"
              title="Sembunyikan semua model yang sedang difilter"
            >
              Sembunyikan semua
            </button>
          )}

          <span className="text-[11px] text-text-muted font-medium ml-1">
            {activeCount}/{allModels.length} aktif
          </span>
        </div>
      </div>

      {/* 5. Models List */}
      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {filteredModels.map((m) => {
            const isHidden = disabledModelIds.includes(m.id);
            return (
              <CompatibleModelRow
                key={`${m.source}-${providerStorageAlias}/${m.id}`}
                modelId={m.id}
                name={m.name}
                fullModel={m.fullModel}
                copied={copied}
                onCopy={onCopy}
                isFree={m.isFree}
                isHidden={isHidden}
                onToggleHidden={() => {
                  if (isHidden) {
                    if (onEnableModel) onEnableModel(m.id);
                  } else {
                    if (onDisableModel) onDisableModel(m.id);
                  }
                }}
                onDelete={
                  m.source === "custom"
                    ? () => onDeleteCustomModel(m.id)
                    : m.alias
                    ? () => onDeleteAlias(m.alias)
                    : undefined
                }
                onTest={connections.length > 0 ? () => handleTestModel(m.id) : undefined}
                testStatus={modelTestResults[m.id]}
                isTesting={testingModelId === m.id}
                caps={getCaps ? getCaps(`${providerId}/${m.id}`) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <p className="text-sm text-text-muted">
            {allModels.length === 0
              ? "Belum ada model yang ditambahkan. Gunakan formulir di atas untuk menambahkan model atau klik 'Impor dari /models'."
              : "Tidak ada model yang sesuai dengan filter pencarian Anda."}
          </p>
        </div>
      )}
    </div>
  );
}

CompatibleModelsSection.propTypes = {
  providerId: PropTypes.string,
  providerStorageAlias: PropTypes.string.isRequired,
  providerDisplayAlias: PropTypes.string.isRequired,
  modelAliases: PropTypes.object.isRequired,
  customModels: PropTypes.arrayOf(PropTypes.object),
  builtInModels: PropTypes.arrayOf(PropTypes.object),
  copied: PropTypes.string,
  onCopy: PropTypes.func.isRequired,
  onSetAlias: PropTypes.func,
  onDeleteAlias: PropTypes.func,
  onAddCustomModel: PropTypes.func.isRequired,
  onDeleteCustomModel: PropTypes.func.isRequired,
  connections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      isActive: PropTypes.bool,
    })
  ).isRequired,
  isAnthropic: PropTypes.bool,
  disabledModelIds: PropTypes.arrayOf(PropTypes.string),
  onDisableModel: PropTypes.func,
  onEnableModel: PropTypes.func,
  onDisableAll: PropTypes.func,
  onEnableAll: PropTypes.func,
  fetchCustomModels: PropTypes.func,
};
