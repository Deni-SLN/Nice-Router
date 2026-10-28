"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Card from "@/shared/components/Card";

const CURRENCY_CONFIG = {
  IDR: { label: "IDR (Rp)", symbol: "Rp", defaultRate: 16500, locale: "id-ID", decimals: 0 },
  EUR: { label: "EUR (€)", symbol: "€", defaultRate: 0.92, locale: "de-DE", decimals: 2 },
  SGD: { label: "SGD (S$)", symbol: "S$", defaultRate: 1.34, locale: "en-SG", decimals: 2 },
  MYR: { label: "MYR (RM)", symbol: "RM", defaultRate: 4.45, locale: "ms-MY", decimals: 2 },
  JPY: { label: "JPY (¥)", symbol: "¥", defaultRate: 155, locale: "ja-JP", decimals: 0 },
};

const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const fmtCost = (n) => `$${(n || 0).toFixed(2)}`;

function formatSecondaryCurrency(costUsd, currencyKey, customRate) {
  const conf = CURRENCY_CONFIG[currencyKey] || CURRENCY_CONFIG.IDR;
  const rate = customRate || conf.defaultRate;
  const converted = (costUsd || 0) * rate;

  return new Intl.NumberFormat(conf.locale, {
    style: "currency",
    currency: currencyKey,
    maximumFractionDigits: conf.decimals,
  }).format(converted);
}

export default function OverviewCards({ stats }) {
  const [secondaryCurrency, setSecondaryCurrency] = useState("IDR");
  const [customRates, setCustomRates] = useState({});
  const [showRateModal, setShowRateModal] = useState(false);
  const [tempRateInput, setTempRateInput] = useState("");

  useEffect(() => {
    try {
      const savedCur = localStorage.getItem("nice_router_secondary_currency");
      if (savedCur && CURRENCY_CONFIG[savedCur]) {
        setSecondaryCurrency(savedCur);
      }
      const savedRates = localStorage.getItem("nice_router_currency_rates");
      if (savedRates) {
        setCustomRates(JSON.parse(savedRates));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCurrencyChange = (newCur) => {
    setSecondaryCurrency(newCur);
    try {
      localStorage.setItem("nice_router_secondary_currency", newCur);
    } catch {
      // ignore
    }
  };

  const activeConfig = CURRENCY_CONFIG[secondaryCurrency] || CURRENCY_CONFIG.IDR;
  const currentRate = customRates[secondaryCurrency] || activeConfig.defaultRate;

  const handleSaveRate = () => {
    const val = parseFloat(tempRateInput);
    if (!val || val <= 0) return;
    const nextRates = { ...customRates, [secondaryCurrency]: val };
    setCustomRates(nextRates);
    try {
      localStorage.setItem("nice_router_currency_rates", JSON.stringify(nextRates));
    } catch {
      // ignore
    }
    setShowRateModal(false);
  };

  const handleResetRate = () => {
    const nextRates = { ...customRates };
    delete nextRates[secondaryCurrency];
    setCustomRates(nextRates);
    try {
      localStorage.setItem("nice_router_currency_rates", JSON.stringify(nextRates));
    } catch {
      // ignore
    }
    setShowRateModal(false);
  };

  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        <Card className="flex min-w-0 flex-col items-center text-center gap-1 px-3 py-3 sm:px-4">
          <span className="text-text-muted text-xs uppercase font-semibold sm:text-sm">Total Requests</span>
          <span className="w-full truncate text-lg font-bold xl:text-xl" title={fmt(stats.totalRequests)}>
            {fmt(stats.totalRequests)}
          </span>
        </Card>

        <Card className="flex min-w-0 flex-col items-center text-center gap-1 px-3 py-3 sm:px-4">
          <span className="text-text-muted text-xs uppercase font-semibold sm:text-sm">Total Input Tokens</span>
          <span className="w-full truncate text-lg font-bold text-primary xl:text-xl" title={fmt(stats.totalPromptTokens)}>
            {fmt(stats.totalPromptTokens)}
          </span>
        </Card>

        <Card className="flex min-w-0 flex-col items-center text-center gap-1 px-3 py-3 sm:px-4">
          <span className="text-text-muted text-xs uppercase font-semibold sm:text-sm">Cached Tokens</span>
          <span className="w-full truncate text-lg font-bold text-info xl:text-xl" title={fmt(stats.totalCachedTokens)}>
            {fmt(stats.totalCachedTokens)}
          </span>
        </Card>

        <Card className="flex min-w-0 flex-col items-center text-center gap-1 px-3 py-3 sm:px-4">
          <span className="text-text-muted text-xs uppercase font-semibold sm:text-sm">Output Tokens</span>
          <span className="w-full truncate text-lg font-bold text-error xl:text-xl" title={fmt(stats.totalCompletionTokens)}>
            {fmt(stats.totalCompletionTokens)}
          </span>
        </Card>

        {/* Est. Cost with Secondary Currency (Rupiah IDR by default) */}
        <Card className="flex min-w-0 flex-col items-center text-center gap-1 px-3 py-3 sm:px-4 relative group">
          <div className="flex items-center justify-between w-full min-w-0">
            <span className="text-text-muted text-xs uppercase font-semibold sm:text-sm">Est. Cost</span>
            
            {/* Currency selector & rate settings */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={secondaryCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="text-[10px] font-bold bg-surface-2 border border-border/80 rounded px-1.5 py-0.5 text-text-muted hover:text-text-main focus:outline-none cursor-pointer"
                title="Pilih mata uang kedua"
              >
                {Object.keys(CURRENCY_CONFIG).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setTempRateInput(String(currentRate));
                  setShowRateModal(true);
                }}
                className="p-0.5 text-text-muted hover:text-primary transition-colors cursor-pointer"
                title={`Atur kurs $1 = ${activeConfig.symbol} ${currentRate}`}
              >
                <span className="material-symbols-outlined text-[13px]">tune</span>
              </button>
            </div>
          </div>

          {/* Primary Currency: USD */}
          <span className="w-full truncate text-lg font-bold text-warning xl:text-xl leading-snug" title={`~${fmtCost(stats.totalCost)}`}>
            ~{fmtCost(stats.totalCost)}
          </span>

          {/* Secondary Currency: IDR / Rupiah */}
          <span
            className="w-full truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400"
            title={`≈ ${formatSecondaryCurrency(stats.totalCost, secondaryCurrency, currentRate)}`}
          >
            ≈ {formatSecondaryCurrency(stats.totalCost, secondaryCurrency, currentRate)}
          </span>

          <span className="text-[10px] text-text-muted">Estimated, not actual billing</span>
        </Card>
      </div>

      {/* Modal Edit Kurs */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">currency_exchange</span>
                Atur Kurs USD ke {secondaryCurrency}
              </h3>
              <button
                onClick={() => setShowRateModal(false)}
                className="text-text-muted hover:text-text-main cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                1 USD setara dengan ({activeConfig.symbol}):
              </label>
              <input
                type="number"
                step="any"
                value={tempRateInput}
                onChange={(e) => setTempRateInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold focus:outline-none focus:border-primary"
                placeholder={`Contoh: ${activeConfig.defaultRate}`}
              />
              <p className="text-[11px] text-text-muted">
                Default kurs: 1 USD = {activeConfig.symbol} {activeConfig.defaultRate.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleResetRate}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-2 text-xs font-medium cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveRate}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

OverviewCards.propTypes = {
  stats: PropTypes.object.isRequired,
};
