/**
 * Export table data to Excel-compatible CSV format with UTF-8 BOM.
 * Ensures Microsoft Excel, Google Sheets, and LibreOffice immediately parse
 * the file into neat, cleanly separated columns without garbled characters.
 */

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadExcelCsv({ filename, headers, rows }) {
  if (typeof window === "undefined") return;

  const BOM = "\uFEFF"; // Byte Order Mark for Excel UTF-8 recognition
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));

  const csvContent = BOM + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanFilename = filename ? `${filename}-${timestamp}.csv` : `export-${timestamp}.csv`;

  link.href = url;
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format API Key Usage data for neat Excel columns
 */
export function exportApiKeyUsageToExcel(data, period = "all") {
  const headers = [
    "Nama Key / Aplikasi",
    "API Key (Masked)",
    "Machine ID",
    "Status Akses",
    "Total Requests",
    "Input Tokens (Prompt)",
    "Output Tokens (Completion)",
    "Total Tokens",
    "Estimasi Biaya (USD)",
    "Estimasi Biaya (IDR)",
    "Terakhir Digunakan",
  ];

  const rows = [];

  for (const item of data || []) {
    // Summary row for API key
    rows.push([
      item.appName || item.appKey || "Akses Tanpa Kunci (No Key)",
      item.apiKeyMasked || "—",
      item.machineId || "—",
      item.accessPolicy || (item.isActive === false ? "Nonaktif" : "Aktif"),
      item.totalRequests || 0,
      item.tokens?.prompt || 0,
      item.tokens?.completion || 0,
      item.tokens?.total || 0,
      `$${(item.cost?.totalUSD || 0).toFixed(4)}`,
      Math.round(item.cost?.totalIDR || 0),
      item.lastUsed ? new Date(item.lastUsed).toLocaleString("id-ID") : "Belum pernah",
    ]);

    // Breakdown sub-rows for each model used under this key
    if (Array.isArray(item.models) && item.models.length > 0) {
      for (const m of item.models) {
        rows.push([
          `   ↳ [Model] ${m.model}`,
          m.provider ? `Provider: ${m.provider}` : "—",
          "—",
          "Sub-total Model",
          m.requests || 0,
          m.tokens?.prompt || 0,
          m.tokens?.completion || 0,
          m.tokens?.total || 0,
          `$${(m.cost?.totalUSD || 0).toFixed(4)}`,
          Math.round(m.cost?.totalIDR || 0),
          m.lastUsed ? new Date(m.lastUsed).toLocaleString("id-ID") : "—",
        ]);
      }
    }
  }

  downloadExcelCsv({
    filename: `nice-router-api-keys-usage-${period}`,
    headers,
    rows,
  });
}

/**
 * Format Usage Table data (by Model, Provider, Account, Endpoint) for Excel
 */
export function exportUsageTableToExcel({ groupedData, tableType, period = "all" }) {
  const headers = [
    "Kategori / Grup",
    "Item / Model Detail",
    "Provider",
    "Total Requests",
    "Prompt Tokens (Input)",
    "Cached Tokens",
    "Completion Tokens (Output)",
    "Total Tokens",
    "Input Cost (USD)",
    "Output Cost (USD)",
    "Total Cost (USD)",
    "Terakhir Digunakan",
  ];

  const rows = [];

  for (const group of groupedData || []) {
    // Group summary row
    rows.push([
      group.groupKey,
      "[SEMUA MODEL / RINGKASAN]",
      "—",
      group.summary?.requests || 0,
      group.summary?.promptTokens ?? "—",
      group.summary?.cachedTokens ?? 0,
      group.summary?.completionTokens ?? "—",
      group.summary?.totalTokens ?? 0,
      group.summary?.inputCost !== undefined ? `$${Number(group.summary.inputCost).toFixed(4)}` : "—",
      group.summary?.outputCost !== undefined ? `$${Number(group.summary.outputCost).toFixed(4)}` : "—",
      group.summary?.totalCost !== undefined ? `$${Number(group.summary.totalCost).toFixed(4)}` : "—",
      group.summary?.lastUsed ? new Date(group.summary.lastUsed).toLocaleString("id-ID") : "—",
    ]);

    // Detail rows
    if (Array.isArray(group.items)) {
      for (const item of group.items) {
        rows.push([
          group.groupKey,
          item.rawModel || item.model || item.endpoint || item.accountName || item.keyName || "—",
          item.provider || "—",
          item.requests || 0,
          item.promptTokens ?? 0,
          item.cachedTokens ?? 0,
          item.completionTokens ?? 0,
          item.totalTokens ?? 0,
          item.inputCost !== undefined ? `$${Number(item.inputCost).toFixed(4)}` : "—",
          item.outputCost !== undefined ? `$${Number(item.outputCost).toFixed(4)}` : "—",
          item.totalCost !== undefined ? `$${Number(item.totalCost).toFixed(4)}` : "—",
          item.lastUsed ? new Date(item.lastUsed).toLocaleString("id-ID") : "—",
        ]);
      }
    }
  }

  downloadExcelCsv({
    filename: `nice-router-usage-${tableType}-${period}`,
    headers,
    rows,
  });
}
