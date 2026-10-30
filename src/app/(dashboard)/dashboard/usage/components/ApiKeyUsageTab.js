"use client";

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import Card from "@/shared/components/Card";
import Badge from "@/shared/components/Badge";
import { exportApiKeyUsageToExcel } from "@/shared/utils/excelExport";

const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const fmtCost = (n) => `$${(n || 0).toFixed(4)}`;

function TimeAgo({ timestamp }) {
  if (!timestamp) return <span className="text-text-muted">Never</span>;
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 60) return <span>Just now</span>;
  if (diffSec < 3600) return <span>{Math.floor(diffSec / 60)}m ago</span>;
  if (diffSec < 86400) return <span>{Math.floor(diffSec / 3600)}h ago</span>;
  return <span>{new Date(timestamp).toLocaleDateString()}</span>;
}

TimeAgo.propTypes = {
  timestamp: PropTypes.string,
};

export default function ApiKeyUsageTab({ period = "all" }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [requireApiKey, setRequireApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/apps?period=${period}`);
      if (!res.ok) throw new Error("Gagal mengambil analitik API Keys");
      const json = await res.json();
      if (json.ok) {
        setData(json.data || []);
        setSummary(json.summary || null);
        setRequireApiKey(Boolean(json.requireApiKey));
      } else {
        throw new Error(json.error || "Gagal memproses analitik");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const toggleExpand = (appKey) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(appKey)) next.delete(appKey);
      else next.add(appKey);
      return next;
    });
  };

  const copyToClipboard = (text, keyId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (item) =>
        (item.appName && item.appName.toLowerCase().includes(q)) ||
        (item.appKey && item.appKey.toLowerCase().includes(q)) ||
        (item.apiKeyMasked && item.apiKeyMasked.toLowerCase().includes(q)) ||
        (item.machineId && item.machineId.toLowerCase().includes(q))
    );
  }, [data, search]);

  // Compute percentage share for top keys
  const keyShares = useMemo(() => {
    const totalTokens = summary?.totalTokens || 1;
    return data
      .filter((d) => d.tokens.total > 0)
      .slice(0, 5)
      .map((d) => ({
        name: d.appName || d.apiKeyMasked || "Key",
        totalTokens: d.tokens.total,
        percentage: ((d.tokens.total / totalTokens) * 100).toFixed(1),
      }));
  }, [data, summary]);

  return (
    <div className="flex flex-col gap-6">
      {/* Require API Key Policy Status Card */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
          requireApiKey
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
            : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              requireApiKey ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {requireApiKey ? "verified_user" : "gpp_maybe"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base">Require API key</span>
              <Badge variant={requireApiKey ? "success" : "warning"} size="sm">
                {requireApiKey ? "AKTIF (Wajib)" : "NONAKTIF (Opsional)"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm mt-0.5 opacity-90 font-medium">
              {requireApiKey
                ? "Requests without a valid key will be rejected. Seluruh token request teratribusi ke API Key resmi."
                : "Akses tanpa key masih diizinkan secara lokal (Local / No Key mode). Aktifkan untuk membatasi akses hanya ke kunci terdaftar."}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/endpoint"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold hover:border-primary text-text-main transition-colors shrink-0 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Pengaturan API Key
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="flex flex-col items-center text-center p-3">
          <span className="text-[11px] font-semibold text-text-muted uppercase">Total API Keys</span>
          <span className="text-xl font-bold mt-1 text-text-main">
            {loading ? "..." : summary?.totalKeys ?? data.length}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5">Kunci Terdaftar</span>
        </Card>

        <Card className="flex flex-col items-center text-center p-3">
          <span className="text-[11px] font-semibold text-text-muted uppercase">Keys Digunakan</span>
          <span className="text-xl font-bold mt-1 text-primary">
            {loading ? "..." : summary?.activeKeysInPeriod ?? data.filter((d) => d.totalRequests > 0).length}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5">Pada Periode Ini</span>
        </Card>

        <Card className="flex flex-col items-center text-center p-3">
          <span className="text-[11px] font-semibold text-text-muted uppercase">Total Requests</span>
          <span className="text-xl font-bold mt-1 text-text-main">
            {loading ? "..." : fmt(summary?.totalRequests)}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5">Panggilan API</span>
        </Card>

        <Card className="flex flex-col items-center text-center p-3">
          <span className="text-[11px] font-semibold text-text-muted uppercase">Input Tokens</span>
          <span className="text-xl font-bold mt-1 text-emerald-500" title={fmt(summary?.totalPromptTokens)}>
            {loading ? "..." : `${fmt(summary?.totalPromptTokens)}↑`}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Prompt Tokens</span>
        </Card>

        <Card className="flex flex-col items-center text-center p-3">
          <span className="text-[11px] font-semibold text-text-muted uppercase">Output Tokens</span>
          <span className="text-xl font-bold mt-1 text-red-500" title={fmt(summary?.totalCompletionTokens)}>
            {loading ? "..." : `${fmt(summary?.totalCompletionTokens)}↓`}
          </span>
          <span className="text-[10px] text-red-500 mt-0.5 font-medium">Completion Tokens</span>
        </Card>

        <Card className="flex flex-col items-center text-center p-3">
          <span className="text-[11px] font-semibold text-text-muted uppercase">Estimasi Biaya</span>
          <span className="text-xl font-bold mt-1 text-amber-500" title={fmtCost(summary?.totalCostUSD)}>
            {loading ? "..." : fmtCost(summary?.totalCostUSD)}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5 truncate max-w-full">
            ≈ Rp {loading ? "..." : (summary?.totalCostIDR || 0).toLocaleString("id-ID")}
          </span>
        </Card>
      </div>

      {/* Visual Token Distribution Share Bar */}
      {keyShares.length > 0 && (
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">pie_chart</span>
              Distribusi Token per API Key
            </h3>
            <span className="text-xs text-text-muted">Top Konsumen Token</span>
          </div>

          <div className="w-full h-3 rounded-full bg-border/60 overflow-hidden flex">
            {keyShares.map((k, idx) => {
              const colors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500"];
              return (
                <div
                  key={k.name}
                  style={{ width: `${Math.max(Number(k.percentage), 2)}%` }}
                  className={`h-full transition-all ${colors[idx % colors.length]}`}
                  title={`${k.name}: ${fmt(k.totalTokens)} tokens (${k.percentage}%)`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {keyShares.map((k, idx) => {
              const dotColors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500"];
              return (
                <div key={k.name} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                  <span className="font-semibold text-text-main truncate max-w-[140px]">{k.name}</span>
                  <span className="text-text-muted font-mono">({k.percentage}%)</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Table Section */}
      <Card className="overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border bg-bg-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">vpn_key</span>
            <div>
              <h2 className="font-bold text-base text-text-main">Penggunaan Token Berdasarkan API Key</h2>
              <p className="text-xs text-text-muted">Rincian token prompt (hijau) & completion (merah) per client</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => exportApiKeyUsageToExcel(filteredData, period)}
              disabled={loading || filteredData.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-colors cursor-pointer shrink-0"
              title="Download laporan Excel/CSV dengan kolom rapi dan terpisah"
            >
              <span className="material-symbols-outlined text-[16px]">table_view</span>
              <span>Download Excel</span>
            </button>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-text-muted pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau key..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-bg-subtle/50 text-text-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama Key / Aplikasi</th>
                <th className="px-4 py-3">API Key (Masked)</th>
                <th className="px-4 py-3 text-right">Requests</th>
                <th className="px-4 py-3 text-right text-emerald-500">Input Tokens (↑)</th>
                <th className="px-4 py-3 text-right text-red-500">Output Tokens (↓)</th>
                <th className="px-4 py-3 text-right">Total Tokens</th>
                <th className="px-4 py-3 text-right">Est. Biaya</th>
                <th className="px-4 py-3 text-right">Terakhir Digunakan</th>
                <th className="px-4 py-3 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    <p className="text-xs mt-2">Memuat penggunaan token API Keys...</p>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-red-500">
                    <span className="material-symbols-outlined text-[28px] mb-1">error</span>
                    <p className="text-sm font-semibold">{error}</p>
                    <button
                      onClick={fetchAnalytics}
                      className="mt-2 text-xs px-3 py-1 bg-surface border border-border rounded-lg hover:border-primary"
                    >
                      Coba Lagi
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-muted">
                    <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">vpn_key_off</span>
                    <p className="text-sm font-medium">Tidak ada data penggunaan API Key pada periode ini.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredData.map((row) => {
                  const isExpanded = expandedKeys.has(row.appKey);
                  const isUnauth = row.appKey === "unauthenticated";
                  const hasUsage = row.totalRequests > 0;

                  return (
                    <tr key={row.appKey} className="group hover:bg-bg-subtle/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-main">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isUnauth
                                ? "bg-amber-500"
                                : row.isActive
                                ? "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                                : "bg-neutral-400"
                            }`}
                          />
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              {row.appName}
                              {isUnauth && (
                                <Badge variant="warning" size="xs">
                                  No Key
                                </Badge>
                              )}
                              {!isUnauth && row.isActive && (
                                <Badge variant="success" size="xs">
                                  Aktif
                                </Badge>
                              )}
                            </div>
                            {row.machineId && (
                              <span className="text-[10px] text-text-muted font-mono">
                                Machine: {row.machineId.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {isUnauth ? (
                          <span className="text-text-muted italic">Local Loopback</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-text-main bg-surface px-1.5 py-0.5 rounded border border-border">
                              {row.apiKeyMasked || "sk-...active"}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(row.appKey, row.appKey)}
                              className="text-text-muted hover:text-primary transition-colors p-1"
                              title="Salin Key"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {copiedKey === row.appKey ? "check" : "content_copy"}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {fmt(row.totalRequests)}
                      </td>

                      {/* Input Tokens (Green) */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-500 font-semibold font-mono" title="Input Tokens">
                          {fmt(row.tokens.prompt)}↑
                        </span>
                      </td>

                      {/* Output Tokens (Red) */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-red-500 font-semibold font-mono" title="Output Tokens">
                          {fmt(row.tokens.completion)}↓
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-text-main font-mono">
                        {fmt(row.tokens.total)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-warning text-xs font-mono">
                            {fmtCost(row.costUSD)}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            ≈ Rp {row.costIDR.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right text-text-muted whitespace-nowrap text-xs">
                        <TimeAgo timestamp={row.lastUsed} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        {hasUsage && row.models && row.models.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.appKey)}
                            className="px-2 py-1 rounded border border-border bg-surface text-xs font-medium hover:border-primary text-text-main flex items-center gap-1 mx-auto"
                            title="Lihat Model yang digunakan"
                          >
                            <span>{row.models.length} Model</span>
                            <span
                              className={`material-symbols-outlined text-[14px] transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            >
                              expand_more
                            </span>
                          </button>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Expandable Model Breakdown Detail Drawers / Subrows */}
        {expandedKeys.size > 0 &&
          filteredData
            .filter((d) => expandedKeys.has(d.appKey) && d.models?.length > 0)
            .map((keyData) => (
              <div
                key={`models-${keyData.appKey}`}
                className="p-4 bg-bg-subtle/30 border-t border-border flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">smart_toy</span>
                    Model yang Digunakan oleh:{" "}
                    <span className="text-primary font-semibold">{keyData.appName}</span> ({keyData.apiKeyMasked || "Local"})
                  </h4>
                  <button
                    onClick={() => toggleExpand(keyData.appKey)}
                    className="text-text-muted hover:text-text-main text-xs"
                  >
                    Tutup
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-bg-subtle text-text-muted uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Model</th>
                        <th className="px-3 py-2">Provider</th>
                        <th className="px-3 py-2 text-right">Requests</th>
                        <th className="px-3 py-2 text-right text-emerald-500">Input Tokens (↑)</th>
                        <th className="px-3 py-2 text-right text-red-500">Output Tokens (↓)</th>
                        <th className="px-3 py-2 text-right">Total Tokens</th>
                        <th className="px-3 py-2 text-right">Est. Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {keyData.models.map((m) => (
                        <tr key={`${m.provider}-${m.model}`} className="hover:bg-bg-subtle/20">
                          <td className="px-3 py-2 font-mono font-medium text-text-main">{m.model}</td>
                          <td className="px-3 py-2">
                            <Badge variant="neutral" size="xs">
                              {m.provider}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right">{fmt(m.requests)}</td>
                          <td className="px-3 py-2 text-right text-emerald-500 font-mono font-semibold">
                            {fmt(m.promptTokens)}↑
                          </td>
                          <td className="px-3 py-2 text-right text-red-500 font-mono font-semibold">
                            {fmt(m.completionTokens)}↓
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-text-main font-mono">
                            {fmt(m.totalTokens)}
                          </td>
                          <td className="px-3 py-2 text-right text-warning font-mono">
                            {fmtCost(m.costUSD)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
      </Card>
    </div>
  );
}

ApiKeyUsageTab.propTypes = {
  period: PropTypes.string,
};
