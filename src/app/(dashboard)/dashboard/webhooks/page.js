"use client";

import { useState, useEffect } from "react";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("webhooks"); // "webhooks" | "logs"
  const [testResult, setTestResult] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [],
    secret: "",
  });
  const [formError, setFormError] = useState("");
  const [createdSecret, setCreatedSecret] = useState(null);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.data || []);
        if (data.availableEvents) setAvailableEvents(data.availableEvents);
      }
    } catch (err) {
      console.error("Error fetching webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (webhookId = null) => {
    try {
      setLogsLoading(true);
      const url = webhookId ? `/api/webhooks/logs?webhookId=${webhookId}` : "/api/webhooks/logs";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      url: "",
      events: availableEvents.length > 0 ? [...availableEvents] : [],
      secret: "",
    });
    setFormError("");
    setCreatedSecret(null);
    setSelectedWebhook(null);
    setShowModal(true);
  };

  const handleToggleEvent = (ev) => {
    setFormData((prev) => {
      const exists = prev.events.includes(ev);
      const next = exists ? prev.events.filter((e) => e !== ev) : [...prev.events, ev];
      return { ...prev, events: next };
    });
  };

  const handleSelectAllEvents = () => {
    setFormData((prev) => ({ ...prev, events: [...availableEvents] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.url.trim()) {
      setFormError("Target URL is required");
      return;
    }
    if (formData.events.length === 0) {
      setFormError("Select at least one event subscription");
      return;
    }

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data.error || "Failed to save webhook");
        return;
      }

      if (data.data?.secret) {
        setCreatedSecret(data.data.secret);
      }
      fetchWebhooks();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleToggleActive = async (wh) => {
    try {
      const nextState = !wh.isActive;
      const res = await fetch("/api/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wh.id, isActive: nextState }),
      });
      if (res.ok) {
        setWebhooks((prev) =>
          prev.map((item) => (item.id === wh.id ? { ...item, isActive: nextState } : item))
        );
      }
    } catch (err) {
      console.error("Error toggling active:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error("Error deleting webhook:", err);
    }
  };

  const handleTestPing = async (id) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: id }),
      });
      const data = await res.json();
      setTestResult({
        id,
        success: data.ok,
        status: data.result?.statusCode,
        durationMs: data.result?.durationMs,
        error: data.result?.error,
      });
    } catch (err) {
      setTestResult({ id, success: false, error: err.message });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Webhooks & Integrations</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time HMAC-SHA256 signed event notifications for requests, provider health, budget alerts, and circuit breakers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => { setActiveTab("webhooks"); fetchWebhooks(); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "webhooks"
                  ? "bg-bg shadow-sm text-text font-semibold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Endpoints ({webhooks.length})
            </button>
            <button
              onClick={() => { setActiveTab("logs"); fetchLogs(); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "logs"
                  ? "bg-bg shadow-sm text-text font-semibold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Delivery Logs
            </button>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Endpoint
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "webhooks" ? (
        <div>
          {loading ? (
            <div className="py-20 text-center text-text-muted text-sm">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-16 bg-bg-card rounded-2xl border border-dashed border-border/80 p-8">
              <span className="material-symbols-outlined text-4xl text-text-muted mb-2">webhook</span>
              <h3 className="font-semibold text-text">No Webhooks Configured</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto mt-1 mb-5">
                Register HTTP endpoints to receive instant alerts when providers degrade, requests fail, or budgets are reached.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-sm"
              >
                Configure First Webhook
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="bg-bg-card rounded-xl border border-border p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-text text-base">{wh.name || "Webhook"}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          wh.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                        }`}
                      >
                        {wh.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-text-muted break-all">
                      <span className="material-symbols-outlined text-[16px] text-text-muted shrink-0">link</span>
                      <span>{wh.url}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {wh.events.map((ev) => (
                        <span
                          key={ev}
                          className="text-[11px] px-2 py-0.5 bg-bg-muted text-text-muted rounded-md border border-border/50"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>

                    {testResult && testResult.id === wh.id && (
                      <div
                        className={`text-xs p-2.5 rounded-lg border flex items-center justify-between mt-2 ${
                          testResult.success
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">
                            {testResult.success ? "check_circle" : "error"}
                          </span>
                          <span>
                            {testResult.success
                              ? `Test ping delivered successfully! HTTP ${testResult.status} (${testResult.durationMs}ms)`
                              : `Delivery failed: ${testResult.error || "Unknown error"}`}
                          </span>
                        </div>
                        <button
                          onClick={() => setTestResult(null)}
                          className="hover:opacity-75 text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    <button
                      onClick={() => handleToggleActive(wh)}
                      title={wh.isActive ? "Disable endpoint" : "Enable endpoint"}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-border hover:bg-bg-muted font-medium text-text-muted transition-all"
                    >
                      {wh.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleTestPing(wh.id)}
                      disabled={testingId === wh.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 font-medium transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {testingId === wh.id ? "hourglass_empty" : "send"}
                      </span>
                      {testingId === wh.id ? "Pinging..." : "Test Ping"}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("logs");
                        fetchLogs(wh.id);
                      }}
                      title="View delivery logs"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-border hover:bg-bg-muted text-text-muted transition-all"
                    >
                      Logs
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      title="Delete webhook"
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Logs Tab */
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text text-sm">Delivery Logs</h3>
            <button
              onClick={() => fetchLogs()}
              className="text-xs px-2.5 py-1 border border-border rounded-lg hover:bg-bg-muted text-text-muted flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Refresh
            </button>
          </div>
          {logsLoading ? (
            <div className="py-16 text-center text-text-muted text-sm">Loading delivery logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-sm">No delivery logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-muted/60 text-text-muted border-b border-border font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Attempts</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-bg-muted/30">
                      <td className="py-3 px-4 font-mono font-medium text-text">{l.event}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            l.success
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {l.statusCode ? `HTTP ${l.statusCode}` : l.success ? "OK" : "Failed"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted">{l.attempts}</td>
                      <td className="py-3 px-4 text-text-muted">{l.durationMs ? `${l.durationMs}ms` : "-"}</td>
                      <td className="py-3 px-4 text-text-muted max-w-xs truncate" title={l.error || "Success"}>
                        {l.error ? <span className="text-red-500">{l.error}</span> : <span className="text-emerald-500">Delivered</span>}
                      </td>
                      <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleTimeString()} {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold text-text">
                {createdSecret ? "Webhook Created" : "Add Webhook Endpoint"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text rounded-lg p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {createdSecret ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    Webhook Signing Secret
                  </div>
                  <p className="text-xs text-text-muted">
                    Store this secret safely. You will use it to verify incoming HMAC-SHA256 signatures in the{" "}
                    <code>x-nice-signature</code> header.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      readOnly
                      value={createdSecret}
                      className="w-full bg-bg font-mono text-xs p-2.5 rounded-lg border border-border select-all"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(createdSecret)}
                      className="px-3 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 text-sm">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block font-medium text-text mb-1 text-xs">Endpoint Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Production Slack Alert or Incident Webhook"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg rounded-lg border border-border text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-text mb-1 text-xs">
                    Target URL (HTTPS Recommended)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.yourdomain.com/webhooks/nice-router"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 bg-bg rounded-lg border border-border text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Protected against SSRF: Private IPs, loopbacks, and metadata servers are strictly blocked.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-medium text-text text-xs">Subscribed Events</label>
                    <button
                      type="button"
                      onClick={handleSelectAllEvents}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-lg bg-bg/50">
                    {availableEvents.map((ev) => (
                      <label
                        key={ev}
                        className="flex items-center gap-2 text-xs text-text cursor-pointer hover:bg-bg-muted/40 p-1.5 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.events.includes(ev)}
                          onChange={() => handleToggleEvent(ev)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="font-mono text-[11px]">{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-text mb-1 text-xs">
                    Custom Secret (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to automatically generate a secure secret"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    className="w-full px-3 py-2 bg-bg rounded-lg border border-border text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-text-muted hover:bg-bg-muted text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover shadow-sm"
                  >
                    Create Webhook
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
